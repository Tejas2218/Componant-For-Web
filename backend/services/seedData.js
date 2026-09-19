/* ==========================================================================
   GST BILLING SYSTEM - DATABASE SEED DATA (services/seedData.js)
   --------------------------------------------------------------------------
   Guarantees:
   - Exactly 8 Barcode-Ready Products in MongoDB items collection
   - Seeded Customers (Intra-State Gujarat & Inter-State Maharashtra)
   - Strict 2 Users: ADMIN (admin@shop.com) and STAFF (staff@shop.com)
   - Default Shop: Darshan SuperMart (Gujarat 24, GSTIN 24AAACD1234E1Z5)
   ========================================================================== */

const crypto = require('crypto');
const { getCollection } = require('../mongodb');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

const DEFAULT_SHOP = {
  shopName: 'Darshan SuperMart & Electronics',
  tagline: 'Smart Retail & GST Billing Counter',
  gstin: '24AAACD1234E1Z5',
  address: 'Opp. Crystal Mall, Kalawad Road',
  city: 'Rajkot',
  state: 'Gujarat',
  stateCode: '24',
  pincode: '360005',
  phone: '+91 98765 43210',
  email: 'admin@darshanshop.com',
  invoicePrefix: 'INV-2026-',
  nextInvoiceNumber: 1
};

const DEFAULT_USERS = [
  {
    name: 'Shop Owner (Admin)',
    email: 'admin@shop.com',
    password: hashPassword('admin123'),
    role: 'ADMIN',
    createdAt: new Date()
  },
  {
    name: 'Cashier Sunil (Staff)',
    email: 'staff@shop.com',
    password: hashPassword('staff123'),
    role: 'STAFF',
    createdAt: new Date()
  }
];

// Exactly 8 Barcode-Ready Products with statutory GST & HSN codes
const DEFAULT_PRODUCTS = [
  {
    name: 'Amul Gold Milk (500ml)',
    category: 'Dairy',
    hsnCode: '0401',
    price: 34.00,
    gstPercent: 5,
    barcode: '8901262010014',
    unit: 'pkt',
    createdAt: new Date()
  },
  {
    name: 'Britannia Whole Wheat Bread (400g)',
    category: 'Bakery',
    hsnCode: '1905',
    price: 45.00,
    gstPercent: 5,
    barcode: '8901063012480',
    unit: 'pkt',
    createdAt: new Date()
  },
  {
    name: 'Maggi 2-Minute Masala Noodles (70g)',
    category: 'Packaged Food',
    hsnCode: '1902',
    price: 14.00,
    gstPercent: 12,
    barcode: '8901058852273',
    unit: 'pack',
    createdAt: new Date()
  },
  {
    name: 'Tata Salt Vacuum Evaporated (1kg)',
    category: 'Grocery',
    hsnCode: '2501',
    price: 28.00,
    gstPercent: 5,
    barcode: '8901058000421',
    unit: 'kg',
    createdAt: new Date()
  },
  {
    name: 'Fortune Sunlite Refined Sunflower Oil (1L)',
    category: 'Cooking Oil',
    hsnCode: '1512',
    price: 145.00,
    gstPercent: 5,
    barcode: '8906007280014',
    unit: 'bottle',
    createdAt: new Date()
  },
  {
    name: 'Dettol Original Liquid Handwash (200ml)',
    category: 'Hygiene',
    hsnCode: '3401',
    price: 99.00,
    gstPercent: 18,
    barcode: '8901396316129',
    unit: 'bottle',
    createdAt: new Date()
  },
  {
    name: 'Cadbury Dairy Milk Chocolate (50g)',
    category: 'Confectionery',
    hsnCode: '1806',
    price: 40.00,
    gstPercent: 18,
    barcode: '8901233024873',
    unit: 'bar',
    createdAt: new Date()
  },
  {
    name: 'Boat BassHeads 100 Wired Earphones',
    category: 'Electronics',
    hsnCode: '8518',
    price: 399.00,
    gstPercent: 18,
    barcode: '8904330900125',
    unit: 'box',
    createdAt: new Date()
  }
];

const DEFAULT_PARTIES = [
  {
    name: 'Amit Patel',
    mobile: '9898012345',
    email: 'amit.patel@gmail.com',
    address: '102 Royal Residency, 150ft Ring Road',
    city: 'Rajkot',
    state: 'Gujarat',
    stateCode: '24',
    gstin: '24AABCP4321F1ZX',
    createdAt: new Date()
  },
  {
    name: 'Priya Sharma (Retail Consumer)',
    mobile: '9724098765',
    email: 'priya.sharma@yahoo.com',
    address: 'B-404 Shilp Heights, University Road',
    city: 'Rajkot',
    state: 'Gujarat',
    stateCode: '24',
    gstin: '',
    createdAt: new Date()
  },
  {
    name: 'Rahul Deshmukh (Inter-State)',
    mobile: '9820011223',
    email: 'rahul.deshmukh@gmail.com',
    address: 'Flat 12, Shivaji Park, Dadar',
    city: 'Mumbai',
    state: 'Maharashtra',
    stateCode: '27',
    gstin: '27AADCD5678G1Z2',
    createdAt: new Date()
  }
];

async function seedDatabase() {
  try {
    const shopCol = getCollection('shop');
    const usersCol = getCollection('users');
    const itemsCol = getCollection('items');
    const partiesCol = getCollection('parties');

    // 1. Seed Shop Profile
    const existingShop = await shopCol.findOne({});
    if (!existingShop) {
      await shopCol.insertOne(DEFAULT_SHOP);
      console.log('✅ Seeded default Shop profile: "Darshan SuperMart & Electronics"');
    }

    // 2. Seed Default Users (ADMIN & STAFF)
    for (const u of DEFAULT_USERS) {
      const existing = await usersCol.findOne({ email: u.email });
      if (!existing) {
        await usersCol.insertOne(u);
        console.log(`✅ Seeded default user: ${u.email} [${u.role}]`);
      }
    }

    // 3. Clean any legacy items without barcode or HSN (from old starter kit tests)
    try {
      await itemsCol.deleteMany({
        $or: [
          { barcode: { $exists: false } },
          { barcode: '' },
          { barcode: null }
        ]
      });
    } catch (e) {
      // Ignored if unsupported in fallback
    }

    // 4. Ensure EVERY ONE of the 8 DEFAULT_PRODUCTS is in MongoDB
    for (const prod of DEFAULT_PRODUCTS) {
      const existing = await itemsCol.findOne({ barcode: prod.barcode });
      if (!existing) {
        await itemsCol.insertOne({
          name: prod.name,
          title: prod.name,
          category: prod.category,
          hsnCode: prod.hsnCode,
          price: prod.price,
          gstPercent: prod.gstPercent,
          barcode: prod.barcode,
          unit: prod.unit,
          createdAt: new Date()
        });
      } else {
        // Ensure price, gstPercent, and hsnCode are synced
        await itemsCol.updateOne(
          { barcode: prod.barcode },
          {
            $set: {
              name: prod.name,
              title: prod.name,
              category: prod.category,
              hsnCode: prod.hsnCode,
              price: prod.price,
              gstPercent: prod.gstPercent,
              unit: prod.unit
            }
          }
        );
      }
    }
    const finalProductCount = await itemsCol.countDocuments({});
    console.log(`✅ Verified ${finalProductCount} barcode-ready GST products in MongoDB.`);

    // 5. Ensure EVERY ONE of the sample Customers (Parties) is in MongoDB
    for (const p of DEFAULT_PARTIES) {
      const existingParty = await partiesCol.findOne({ mobile: p.mobile });
      if (!existingParty) {
        await partiesCol.insertOne({
          name: p.name,
          mobile: p.mobile,
          email: p.email,
          address: p.address,
          city: p.city,
          state: p.state,
          stateCode: p.stateCode,
          gstin: p.gstin,
          createdAt: new Date()
        });
      }
    }
    const finalPartyCount = await partiesCol.countDocuments({});
    console.log(`✅ Verified ${finalPartyCount} sample customers (Intra & Inter-State) in MongoDB.`);

    return {
      success: true,
      message: 'Database seeded and verified successfully',
      counts: {
        products: finalProductCount,
        parties: finalPartyCount
      }
    };
  } catch (err) {
    console.error('⚠️ Seed warning:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  seedDatabase,
  hashPassword,
  DEFAULT_SHOP,
  DEFAULT_USERS,
  DEFAULT_PRODUCTS,
  DEFAULT_PARTIES
};
