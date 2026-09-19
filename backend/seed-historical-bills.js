/* seed-historical-bills.js — run once: node backend/seed-historical-bills.js */
require('dotenv').config();
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/codeathon_db';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function numberToWordsINR(amount) {
  const num = Math.floor(amount);
  if (num === 0) return 'Zero Rupees Only';
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
  }
  const paise = Math.round((amount - num) * 100);
  return inWords(num) + ' Rupees' + (paise > 0 ? ' and ' + inWords(paise) + ' Paise' : '') + ' Only';
}

const customers = [
  { name:'Amit Patel',     mobile:'9876543210', address:'12 Nehru Nagar, Ahmedabad', state:'Gujarat',     stateCode:'24', gstin:'24AAACP1234A1Z5' },
  { name:'Priya Sharma',   mobile:'9988776655', address:'45 MG Road, Surat',         state:'Gujarat',     stateCode:'24', gstin:'' },
  { name:'Rajesh Kumar',   mobile:'9123456789', address:'7 Civil Lines, Mumbai',      state:'Maharashtra', stateCode:'27', gstin:'27AABCK5432B1Z3' },
  { name:'Sunita Mehta',   mobile:'9700123456', address:'22 Lal Darwaja, Vadodara',  state:'Gujarat',     stateCode:'24', gstin:'' },
  { name:'Vikram Singh',   mobile:'9654321098', address:'88 Connaught Place, Delhi', state:'Delhi',       stateCode:'07', gstin:'07AAACS7890C1Z2' },
  { name:'Kavita Joshi',   mobile:'9512348765', address:'3 Rajpath, Pune',            state:'Maharashtra', stateCode:'27', gstin:'' },
  { name:'Deepak Agarwal', mobile:'9876001234', address:'55 Ring Road, Jaipur',      state:'Rajasthan',   stateCode:'08', gstin:'08AABCA1234D1Z9' },
  { name:'Meena Patel',    mobile:'9988112233', address:'8 Ashram Road, Ahmedabad',  state:'Gujarat',     stateCode:'24', gstin:'' },
  { name:'Suresh Nair',    mobile:'9345678901', address:'14 MG Road, Kochi',         state:'Kerala',      stateCode:'32', gstin:'32AABCN5678E1Z1' },
  { name:'Anita Verma',    mobile:'9900112233', address:'21 Sector 17, Chandigarh',  state:'Chandigarh',  stateCode:'04', gstin:'' },
];

const products = [
  { name:'Amul Butter 500g',         hsnCode:'0405', barcode:'8901262010014', unit:'pcs', rate:265,  gstPercent:12 },
  { name:'Parle-G Biscuits 800g',    hsnCode:'1905', barcode:'8901719110047', unit:'pcs', rate:80,   gstPercent:18 },
  { name:'Tata Salt 1kg',            hsnCode:'2501', barcode:'8901289011678', unit:'pcs', rate:25,   gstPercent:5  },
  { name:'Surf Excel 2kg',           hsnCode:'3401', barcode:'8901030489660', unit:'pcs', rate:280,  gstPercent:18 },
  { name:'Colgate Toothpaste 200g',  hsnCode:'3306', barcode:'8901314002258', unit:'pcs', rate:115,  gstPercent:18 },
  { name:'Maggi Noodles 12pk',       hsnCode:'1902', barcode:'8901491502019', unit:'pcs', rate:180,  gstPercent:18 },
  { name:'Britannia Milk Cake 250g', hsnCode:'1905', barcode:'8901063110007', unit:'pcs', rate:65,   gstPercent:5  },
  { name:'Dettol Soap 75g 4pk',      hsnCode:'3401', barcode:'6291100300997', unit:'pcs', rate:90,   gstPercent:18 },
  { name:'Aashirvaad Atta 10kg',     hsnCode:'1101', barcode:'8901012345678', unit:'bag', rate:350,  gstPercent:5  },
  { name:'Mother Dairy Milk 1L',     hsnCode:'0401', barcode:'8901012390001', unit:'pcs', rate:58,   gstPercent:5  },
];

function makeBill(seq, date, customer, itemList, paymentMethod) {
  const invoiceNo = 'INV-2026-' + String(seq).padStart(5, '0');
  const isInterState = customer.state !== 'Gujarat';
  const items = itemList.map(({ product, qty }, idx) => {
    const taxable = product.rate * qty;
    const taxAmt  = taxable * (product.gstPercent / 100);
    const cgst    = isInterState ? 0 : +(taxAmt / 2).toFixed(2);
    const sgst    = isInterState ? 0 : +(taxAmt / 2).toFixed(2);
    const igst    = isInterState ? +taxAmt.toFixed(2) : 0;
    return {
      srNo: idx + 1,
      name: product.name, hsnCode: product.hsnCode,
      barcode: product.barcode, unit: product.unit,
      rate: product.rate, qty,
      taxableAmount: +taxable.toFixed(2),
      gstPercent: product.gstPercent,
      cgst, sgst, igst,
      lineTotal: +(taxable + taxAmt).toFixed(2),
    };
  });

  const subtotal   = +items.reduce((s, i) => s + i.taxableAmount, 0).toFixed(2);
  const cgstTotal  = +items.reduce((s, i) => s + i.cgst, 0).toFixed(2);
  const sgstTotal  = +items.reduce((s, i) => s + i.sgst, 0).toFixed(2);
  const igstTotal  = +items.reduce((s, i) => s + i.igst, 0).toFixed(2);
  const totalTax   = +(cgstTotal + sgstTotal + igstTotal).toFixed(2);
  const grandTotal = +(subtotal + totalTax).toFixed(2);

  return {
    invoiceNo,
    invoiceDate: date,
    party: {
      name: customer.name, mobile: customer.mobile, address: customer.address,
      state: customer.state, stateCode: customer.stateCode, gstin: customer.gstin,
    },
    items, isInterState,
    subtotal, cgstTotal, sgstTotal, igstTotal, totalTax, grandTotal,
    amountInWords: numberToWordsINR(grandTotal),
    paymentMethod, status: 'FINALIZED',
    createdBy: { userId: 'seed', name: 'Seed Script', role: 'ADMIN' },
    createdAt: date,
  };
}

// [daysAgo, customerIdx, [[productIdx, qty], ...], paymentMethod]
const PLAN = [
  // Today
  [0, 0, [[0,2],[2,3],[9,4]], 'CASH'],
  [0, 3, [[5,1],[7,2]],       'UPI' ],
  [0, 1, [[1,5],[3,1]],       'CARD'],
  // Yesterday
  [1, 4, [[0,1],[6,3],[8,1]], 'CASH'],
  [1, 2, [[3,2],[4,1]],       'UPI' ],
  // 2 days ago
  [2, 5, [[1,4],[9,6]],       'CASH'],
  [2, 7, [[2,2],[5,3],[6,1]], 'UPI' ],
  // 3-6 days ago
  [3, 0, [[0,3],[7,2]],       'CARD'],
  [3, 6, [[4,2],[8,2]],       'CASH'],
  [4, 1, [[3,1],[9,3],[1,2]], 'UPI' ],
  [4, 3, [[6,4]],             'CASH'],
  [5, 2, [[0,1],[5,2],[2,4]], 'CASH'],
  [5, 9, [[4,3],[7,1]],       'UPI' ],
  [6, 4, [[1,2],[8,3]],       'CARD'],
  [6, 0, [[3,1],[6,2],[9,5]], 'CASH'],
  // Last week
  [7,  5, [[0,4],[2,2]],       'CASH'],
  [8,  1, [[5,3],[3,2],[1,1]], 'UPI' ],
  [9,  7, [[4,1],[8,1],[6,3]], 'CASH'],
  [10, 2, [[9,4],[7,2]],       'CARD'],
  [11, 3, [[0,2],[5,1]],       'CASH'],
  [12, 6, [[1,3],[3,1],[2,2]], 'UPI' ],
  [13, 8, [[4,5],[6,1]],       'CASH'],
  [14, 0, [[8,2],[7,3],[9,2]], 'CARD'],
  // 2-3 weeks ago
  [15, 4, [[0,1],[1,4],[2,1]], 'CASH'],
  [16, 5, [[5,2],[6,2]],       'UPI' ],
  [17, 1, [[3,3],[8,1]],       'CASH'],
  [18, 9, [[7,4],[4,2]],       'CARD'],
  [19, 2, [[0,2],[9,3],[1,1]], 'CASH'],
  [20, 7, [[5,1],[6,4]],       'UPI' ],
  [21, 3, [[2,3],[3,2],[8,1]], 'CASH'],
  // Last month (30-45 days)
  [23, 0, [[0,3],[4,2]],       'CASH'],
  [25, 6, [[1,5],[7,1]],       'UPI' ],
  [27, 1, [[5,2],[9,4],[3,1]], 'CASH'],
  [29, 4, [[6,3],[2,2]],       'CARD'],
  [31, 2, [[8,1],[0,4],[1,2]], 'CASH'],
  [33, 5, [[4,3],[7,2]],       'UPI' ],
  [35, 9, [[3,5],[5,1]],       'CASH'],
  [37, 7, [[0,2],[6,3],[9,1]], 'CARD'],
  [39, 3, [[1,4],[2,2]],       'CASH'],
  [41, 8, [[7,1],[4,5],[8,2]], 'UPI' ],
  [43, 0, [[5,3],[3,1]],       'CASH'],
  [45, 6, [[9,2],[0,1],[1,3]], 'CASH'],
  // 2 months ago
  [52, 1, [[0,2],[6,4]],       'CASH'],
  [58, 4, [[5,1],[9,3],[7,2]], 'UPI' ],
  [63, 2, [[3,3],[1,2]],       'CARD'],
  [70, 7, [[4,2],[8,1],[0,3]], 'CASH'],
  [76, 5, [[6,5],[2,1]],       'UPI' ],
  [83, 9, [[1,3],[3,4]],       'CASH'],
];

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB');

  const col = client.db().collection('bills');

  // Avoid duplicate sequence numbers
  const last = await col.findOne({}, { sort: { invoiceNo: -1 }, projection: { invoiceNo: 1 } });
  let seq = 100;
  if (last && last.invoiceNo) {
    const n = parseInt(last.invoiceNo.split('-').pop(), 10);
    if (!isNaN(n)) seq = n + 1;
  }
  console.log('Starting sequence:', seq);

  const bills = PLAN.map(([ago, ci, itemDef, pay], i) =>
    makeBill(
      seq + i,
      daysAgo(ago),
      customers[ci],
      itemDef.map(([pi, qty]) => ({ product: products[pi], qty })),
      pay
    )
  );

  const result = await col.insertMany(bills);
  console.log(`Inserted: ${result.insertedCount} bills`);
  console.log(`Total bills now: ${await col.countDocuments()}`);

  bills.slice(0, 5).forEach(b =>
    console.log(`  ${b.invoiceNo} | ${b.party.name} | Rs.${b.grandTotal} | ${b.createdAt.toDateString()}`)
  );

  await client.close();
  console.log('Done! Refresh Reports & Analytics to see the chart.');
}

run().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });
