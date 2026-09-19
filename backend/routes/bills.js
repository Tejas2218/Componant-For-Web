/* ==========================================================================
   BILLS / INVOICE FINALIZATION ROUTES (routes/bills.js)
   --------------------------------------------------------------------------
   Stores immutable historical snapshots of generated GST Tax Invoices.
   Generates sequential invoice numbers (INV-2026-00001).
   Collection: bills (codeathon_db)
   ========================================================================== */

const express = require('express');
const router = express.Router();
const { getCollection, ObjectId } = require('../mongodb');
const { authenticate } = require('../middleware/auth');

function col() {
  return getCollection('bills');
}

// Helper: Convert Number to Indian Rupee Words
function numberToWordsINR(amount) {
  const num = Math.floor(amount);
  if (num === 0) return 'Zero Rupees Only';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const rupees = inWords(num);
  const paise = Math.round((amount - num) * 100);
  let result = rupees + ' Rupees';
  if (paise > 0) {
    result += ' and ' + inWords(paise) + ' Paise';
  }
  return result + ' Only';
}

// 1. GET /api/bills - Fetch all finalized bills (newest first)
// Accessible by ADMIN and STAFF
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, fromDate, toDate } = req.query;
    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { invoiceNo: regex },
        { 'party.name': regex },
        { 'party.mobile': regex }
      ];
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(new Date(toDate).setHours(23, 59, 59, 999));
    }

    const bills = await col().find(query).sort({ createdAt: -1 }).toArray();

    return res.json({
      success: true,
      count: bills.length,
      collection: 'bills',
      bills
    });
  } catch (err) {
    next(err);
  }
});

// 2. GET /api/bills/:id - Fetch single bill snapshot for viewing / reprinting
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    let bill = null;

    if (ObjectId.isValid(id)) {
      bill = await col().findOne({ _id: new ObjectId(id) });
    }
    if (!bill) {
      bill = await col().findOne({ invoiceNo: id });
    }

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Invoice not found in MongoDB.' });
    }

    return res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
});

// 3. POST /api/bills - Finalize Bill & Store Immutable Snapshot
// Accessible by ADMIN and STAFF (Cashier)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { party, items, isInterState, subtotal, cgst, sgst, igst, totalTax, grandTotal, paymentMethod } = req.body;

    if (!party || !party.name || !party.mobile) {
      return res.status(400).json({ success: false, message: 'Valid customer (party) details are required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot finalize an empty bill. Add at least one item.' });
    }

    // 1. Generate sequential invoice number: INV-2026-00001
    const totalCount = await col().countDocuments({});
    const seq = String(totalCount + 1).padStart(5, '0');
    const invoiceNo = `INV-2026-${seq}`;

    // 2. Freeze line items snapshot
    const itemSnapshots = items.map((item, idx) => {
      const rate = parseFloat(item.price || item.rate) || 0;
      const qty = parseInt(item.qty, 10) || 1;
      const gstRate = parseFloat(item.gstPercent) || 0;
      const taxable = rate * qty;
      const taxAmt = taxable * (gstRate / 100);

      let itemCgst = 0;
      let itemSgst = 0;
      let itemIgst = 0;

      if (isInterState) {
        itemIgst = taxAmt;
      } else {
        itemCgst = taxAmt / 2;
        itemSgst = taxAmt / 2;
      }

      return {
        srNo: idx + 1,
        itemId: item._id || item.itemId || null,
        name: item.name,
        hsnCode: item.hsnCode || '-',
        barcode: item.barcode || '-',
        unit: item.unit || 'pcs',
        rate,
        qty,
        taxableAmount: parseFloat(taxable.toFixed(2)),
        gstPercent: gstRate,
        cgst: parseFloat(itemCgst.toFixed(2)),
        sgst: parseFloat(itemSgst.toFixed(2)),
        igst: parseFloat(itemIgst.toFixed(2)),
        lineTotal: parseFloat((taxable + taxAmt).toFixed(2))
      };
    });

    // 3. Freeze customer snapshot
    const partySnapshot = {
      name: party.name.trim(),
      mobile: party.mobile.trim(),
      address: party.address ? party.address.trim() : '',
      city: party.city ? party.city.trim() : '',
      state: party.state ? party.state.trim() : 'Gujarat',
      stateCode: party.stateCode || (party.state && party.state.toLowerCase() === 'gujarat' ? '24' : ''),
      gstin: party.gstin ? party.gstin.trim().toUpperCase() : ''
    };

    const finalSubtotal = parseFloat(subtotal) || itemSnapshots.reduce((s, i) => s + i.taxableAmount, 0);
    const finalCGST = parseFloat(cgst) || itemSnapshots.reduce((s, i) => s + i.cgst, 0);
    const finalSGST = parseFloat(sgst) || itemSnapshots.reduce((s, i) => s + i.sgst, 0);
    const finalIGST = parseFloat(igst) || itemSnapshots.reduce((s, i) => s + i.igst, 0);
    const finalTotalTax = parseFloat(totalTax) || (finalCGST + finalSGST + finalIGST);
    const finalGrandTotal = parseFloat(grandTotal) || (finalSubtotal + finalTotalTax);

    // 4. Create immutable bill document
    const newBill = {
      invoiceNo,
      invoiceDate: new Date(),
      party: partySnapshot,
      items: itemSnapshots,
      isInterState: !!isInterState,
      subtotal: parseFloat(finalSubtotal.toFixed(2)),
      cgstTotal: parseFloat(finalCGST.toFixed(2)),
      sgstTotal: parseFloat(finalSGST.toFixed(2)),
      igstTotal: parseFloat(finalIGST.toFixed(2)),
      totalTax: parseFloat(finalTotalTax.toFixed(2)),
      grandTotal: parseFloat(finalGrandTotal.toFixed(2)),
      amountInWords: numberToWordsINR(finalGrandTotal),
      paymentMethod: paymentMethod || 'CASH',
      status: 'FINALIZED', // Immutable
      createdBy: {
        userId: req.user.id,
        name: req.user.name,
        role: req.user.role
      },
      createdAt: new Date()
    };

    const result = await col().insertOne(newBill);

    return res.status(201).json({
      success: true,
      message: `Invoice ${invoiceNo} finalized and permanently saved to MongoDB!`,
      bill: { _id: result.insertedId, ...newBill }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
