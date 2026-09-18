/* ==========================================================================
   FRONTEND-TO-BACKEND FETCH INTEGRATION HELPERS (fetch-helpers.js)
   1-Click Copy-Paste Vanilla JS fetch() Functions for Frontend Components
   ========================================================================== */

const API_BASE_URL = 'http://localhost:5000/api';

// 1. AUTHENTICATION FETCH HELPERS
async function apiLogin(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('auth_token', data.token);
      alert(`Welcome back, ${data.user.name}!`);
    } else {
      alert(data.message);
    }
    return data;
  } catch (err) {
    console.error('Login error:', err);
  }
}

async function apiSignup(name, email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('auth_token', data.token);
      alert('Account created successfully!');
    }
    return data;
  } catch (err) {
    console.error('Signup error:', err);
  }
}

// 2. USER PROFILE FETCH HELPERS
async function apiUpdateProfile(profileData) {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    return await response.json();
  } catch (err) {
    console.error('Update profile error:', err);
  }
}

// 3. E-COMMERCE & CART FETCH HELPERS
async function apiFetchProducts(searchQuery = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/products?search=${encodeURIComponent(searchQuery)}`);
    const data = await response.json();
    return data.products;
  } catch (err) {
    console.error('Fetch products error:', err);
  }
}

async function apiAddToCart(productId, quantity = 1) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity })
    });
    return await response.json();
  } catch (err) {
    console.error('Add to cart error:', err);
  }
}

async function apiCheckout(paymentInfo) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentInfo)
    });
    return await response.json();
  } catch (err) {
    console.error('Checkout error:', err);
  }
}

// 4. KANBAN & DASHBOARD FETCH HELPERS
async function apiAddKanbanTask(taskData) {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/kanban/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    return await response.json();
  } catch (err) {
    console.error('Add task error:', err);
  }
}

// 5. DIRECTORY UPVOTE FETCH HELPER
async function apiUpvoteTool(toolId) {
  try {
    const response = await fetch(`${API_BASE_URL}/tools/${toolId}/upvote`, {
      method: 'POST'
    });
    return await response.json();
  } catch (err) {
    console.error('Upvote error:', err);
  }
}

// 6. GENERIC ITEM / RESOURCE CRUD FETCH HELPERS (MongoDB)
async function apiGetItems(search = '') {
  try {
    const url = search ? `${API_BASE_URL}/items?search=${encodeURIComponent(search)}` : `${API_BASE_URL}/items`;
    const res = await fetch(url);
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error('Get items error:', err);
  }
}

async function apiCreateItem(itemData) {
  try {
    const res = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    return await res.json();
  } catch (err) {
    console.error('Create item error:', err);
  }
}

async function apiUpdateItem(id, itemData) {
  try {
    const res = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    return await res.json();
  } catch (err) {
    console.error('Update item error:', err);
  }
}

async function apiDeleteItem(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    console.error('Delete item error:', err);
  }
}

