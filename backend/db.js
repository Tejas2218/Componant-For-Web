/* ==========================================================================
   HACKATHON ZERO-CONFIG DATABASE ENGINE (db.js)
   Plug & Play In-Memory / JSON Data Store with Pre-Seeded Datasets
   No MongoDB or PostgreSQL required to start!
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

// Default Pre-Seeded Datasets
const initialData = {
  users: [
    {
      id: "usr_101",
      name: "Alex Rivera",
      email: "alex@company.com",
      password: "password123", // Plaintext for quick hackathon testing
      role: "Admin",
      bio: "Building open source UI frameworks & scaling high-performance web apps.",
      avatar: "AR",
      company: "TechCorp",
      createdAt: new Date().toISOString()
    }
  ],
  products: [
    {
      id: "prod_1",
      name: "Wireless ANC Headphones",
      description: "60-hour battery life with studio spatial sound.",
      price: 199.00,
      originalPrice: 249.00,
      rating: 4.9,
      reviewsCount: 128,
      category: "Audio",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80",
      inStock: true
    },
    {
      id: "prod_2",
      name: "Smartwatch Ultra v2",
      description: "Titanium chassis, ECG sensor, 50m water resistant.",
      price: 349.00,
      rating: 4.8,
      reviewsCount: 94,
      category: "Wearables",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=80",
      inStock: true
    },
    {
      id: "prod_3",
      name: "Developer Mechanical Keyboard",
      description: "Hot-swappable tactile switches & RGB backlit.",
      price: 149.00,
      rating: 5.0,
      reviewsCount: 42,
      category: "Peripherals",
      image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=80",
      inStock: true
    }
  ],
  cart: [],
  kanbanTasks: [
    { id: "task_1", title: "Design Glassmorphism Login", description: "Create dark mode auth card with validation.", column: "todo", priority: "High" },
    { id: "task_2", title: "Integrate Stripe Checkout API", description: "Wire webhook endpoints for upgrades.", column: "todo", priority: "Critical" },
    { id: "task_3", title: "Build Hackathon Component Suite", description: "Assemble zero-dependency HTML/CSS/JS snippets.", column: "in_progress", priority: "Medium" },
    { id: "task_4", title: "Set up Git Repository", description: "Configured CI/CD deployment pipeline.", column: "done", priority: "Normal" }
  ],
  dashboardStats: {
    totalRevenue: "$124,500",
    activeUsers: "45,210",
    conversionRate: "3.84%",
    churnRate: "1.12%",
    revenueChange: "+18.4%"
  },
  tools: [
    { id: "tool_1", name: "AutoCode AI", category: "Developer Tools", description: "Generate production React/Vue code from Figma.", upvotes: 482 },
    { id: "tool_2", name: "MindMap Flow", category: "Productivity", description: "Infinite canvas brainstorming tool for teams.", upvotes: 319 }
  ]
};

// Data Persistence Helpers
class Database {
  constructor() {
    this.data = initialData;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('⚠️ Could not load data.json, using default in-memory dataset.');
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error('❌ Failed to persist to data.json', err);
    }
  }

  // Generic DB Operations
  get(collectionName) {
    return this.data[collectionName] || [];
  }

  find(collectionName, queryFn) {
    const list = this.get(collectionName);
    return queryFn ? list.filter(queryFn) : list;
  }

  findOne(collectionName, queryFn) {
    const list = this.get(collectionName);
    return list.find(queryFn);
  }

  create(collectionName, item) {
    if (!this.data[collectionName]) this.data[collectionName] = [];
    const newItem = { id: `id_${Date.now()}`, ...item, createdAt: new Date().toISOString() };
    this.data[collectionName].push(newItem);
    this.save();
    return newItem;
  }

  update(collectionName, id, updates) {
    const list = this.get(collectionName);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[collectionName][index] = { ...this.data[collectionName][index], ...updates };
      this.save();
      return this.data[collectionName][index];
    }
    return null;
  }

  delete(collectionName, id) {
    const list = this.get(collectionName);
    this.data[collectionName] = list.filter(item => item.id !== id);
    this.save();
    return true;
  }
}

const db = new Database();
module.exports = db;

/* ==========================================================================
   OPTIONAL: MongoDB Mongoose Adapter Snippet (Uncomment if using MongoDB)
   --------------------------------------------------------------------------
   const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hackathon')
     .then(() => console.log('🍃 MongoDB Connected'))
     .catch(err => console.error(err));
   ========================================================================== */
