# 🚀 Hackathon UI Component Library & Express Backend Suite

An ultra-fast, zero-dependency, copy-paste ready UI component & Express backend suite designed specifically for **rapid prototyping in hackathons**. Built using **pure modern HTML5, CSS3, Vanilla JavaScript, and Node.js / Express**.

> 💡 **Self-Contained Architecture**:
> - **Frontend**: Every component `.html` file contains its HTML structure, CSS styles (`<style>`), and JS logic (`<script>`) embedded inside the file itself.
> - **Backend**: Modular, zero-config Node.js / Express server (`backend/server.js`) with an in-memory/JSON data store (`backend/db.js`) and pre-seeded mock datasets so you don't need to waste time configuring databases!

---

## ⚡ Quick Backend Start

1. **Start the Express Server**:
   ```bash
   cd backend
   npm start
   ```
   The backend server starts on `http://localhost:5000`.

2. **Test Health Check**:
   Open `http://localhost:5000/api/health` in your browser.

---

## 📂 Complete Project Structure

```
d:\Componant-For-Web\
├── index.html                   # Interactive Visual Catalog Showcase App
├── README.md                    # Hackathon Topic Matrix & Instructions
├── css/
│   └── hackathon-ui.css         # Universal Design Tokens & Resets
├── js/
│   └── hackathon-ui.js          # Shared Utility Engine (Toasts, Modals, Tabs)
│
├── backend/                     # ⚡ BACKEND SUITE
│   ├── server.js              # Runnable Express Server (CORS, Parser, Routes)
│   ├── db.js                  # Zero-Config JSON Data Store (Pre-seeded DB)
│   ├── package.json           # Dependencies (express, cors)
│   ├── fetch-helpers.js       # 1-Click Copy-Paste Vanilla JS fetch() Snippets
│   └── routes/
│       ├── auth.js            # POST /api/auth/login, POST /api/auth/signup, GET /api/auth/me
│       ├── profile.js         # GET /api/profile, PUT /api/profile/update, PUT /api/profile/password
│       ├── products.js        # GET /api/products, POST /api/cart/add, POST /api/checkout
│       ├── dashboard.js       # GET /api/dashboard/stats, GET/POST /api/kanban/tasks
│       └── directory.js       # GET /api/tools, POST /api/tools/:id/upvote
│
└── components/                  # 🎨 FRONTEND SUITES (35+ Components)
    ├── auth/                    # 1. LOGIN & REGISTRATION (5 Designs)
    ├── landing/                 # 2. HOME & LANDING PAGES (5 Designs)
    ├── dashboard/               # 3. DASHBOARD UI (5 Designs)
    ├── profile/                 # 4. PROFILE PAGES (5 Designs)
    ├── product-list/            # 5. PRODUCT & SERVICE LISTS (5 Designs)
    ├── product-detail/          # 6. PRODUCT DETAIL PAGES (5 Designs)
    └── extra/                   # 7. EXTRA ATOMIC COMPONENTS PACK
        ├── buttons.html         # Button Types, States & Color Schemes
        ├── cards.html           # Cards Variety Pack (KPI, Feature, 3D Flip)
        ├── loaders.html         # Loaders & Spinners (Ring, Skeleton, Wave dots)
        ├── lists.html           # Lists & Timelines (Team list, Activity timeline)
        ├── forms.html           # Forms UI & Recommended Color Palette Guide
        ├── badges.html          # Badges & Glowing Status Indicators
        ├── modals.html          # Modals (Confirmation, Form Input, Danger Alert)
        └── toasts.html          # Toasts Notification Engine
```

---

## 🎯 Hackathon Topic Recommendation Guide

| Hackathon Topic / Use Case | Recommended Landing Page | Recommended Auth Suite | Recommended Dashboard | Recommended Backend Endpoint |
| :--- | :--- | :--- | :--- | :--- |
| **🤖 AI / GenAI App** | `components/landing/02-ai-dark-futuristic.html` | `components/auth/01-dark-saas.html` | `components/dashboard/01-analytics-dark.html` | `routes/auth.js` |
| **💎 Fintech & Web3** | `components/landing/01-saas-tech.html` | `components/auth/04-gradient-mesh.html` | `components/dashboard/02-fintech-glass.html` | `routes/products.js` |
| **🛍️ E-Commerce & Store** | `components/landing/03-ecommerce-consumer.html` | `components/auth/02-split-screen.html` | `components/dashboard/05-vendor-store.html` | `routes/products.js` |
| **⚡ Dev Tools & API** | `components/landing/04-developer-tooling.html` | `components/auth/03-clean-minimal.html` | `components/profile/02-developer-creator.html` | `routes/directory.js` |
| **💼 B2B Enterprise SaaS** | `components/landing/05-b2b-corporate.html` | `components/auth/05-neumorphic-soft.html` | `components/dashboard/03-kanban-project.html` | `routes/dashboard.js` |

---

## 🔌 1-Click Frontend-to-Backend Connection Example

Connect your frontend form to the Node.js Express backend using the copy-paste snippets in `backend/fetch-helpers.js`:

```javascript
// Copy this into any frontend component <script>
async function handleLogin(email, password) {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (data.success) {
    Toast.show({ title: 'Welcome Back!', message: data.message, type: 'success' });
  }
}
```
