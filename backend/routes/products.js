/* ==========================================================================
   E-COMMERCE & PRODUCTS ROUTES (routes/products.js)
   Products List, Detail View, Add to Cart & Checkout Simulation
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products (With search & category filtering)
router.get('/', (req, res) => {
  const { search, category } = req.query;
  let products = db.get('products');

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  if (category) {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  return res.json({
    success: true,
    total: products.length,
    products
  });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = db.findOne('products', p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }
  return res.json({ success: true, product });
});

// GET /api/cart
router.get('/cart/items', (req, res) => {
  const cart = db.get('cart');
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return res.json({ success: true, cart, totalAmount });
});

// POST /api/cart/add
router.post('/cart/add', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = db.findOne('products', p => p.id === productId);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const existingItem = db.findOne('cart', c => c.productId === productId);
  if (existingItem) {
    db.update('cart', existingItem.id, { quantity: existingItem.quantity + quantity });
  } else {
    db.create('cart', {
      productId,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity
    });
  }

  return res.json({
    success: true,
    message: `${product.name} added to shopping cart!`,
    cart: db.get('cart')
  });
});

// POST /api/checkout
router.post('/checkout', (req, res) => {
  const { cardholderName, cardNumber } = req.body;
  const cart = db.get('cart');

  const orderId = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;

  // Reset cart after checkout
  db.data.cart = [];
  db.save();

  return res.json({
    success: true,
    message: 'Payment authorized & order placed!',
    orderId,
    purchasedAt: new Date().toISOString()
  });
});

module.exports = router;
