/* ==========================================================================
   REUSABLE FRONTEND API CLIENT (js/api.js)
   --------------------------------------------------------------------------
   Simple, boilerplate-free wrapper around fetch() for Code-A-Thon speed.
   Automatically handles JSON headers, base URL, errors, and auth tokens.
   ========================================================================== */

(function (window) {
  'use strict';

  // Automatically detect base URL:
  // If served from backend server, uses relative '/api'
  // If opened via VSCode Live Server (port 5500) or file, defaults to 'http://localhost:5000/api'
  const isBackendOrigin = window.location.origin && window.location.origin.includes(':5000');
  const API_BASE_URL = isBackendOrigin ? '/api' : 'http://localhost:5000/api';

  const TOKEN_KEY = 'codeathon_auth_token';

  async function request(endpoint, options = {}) {
    // Format full URL
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;

    // Prepare default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Attach Bearer token if present in localStorage
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({
        success: response.ok,
        status: response.status,
        message: response.statusText
      }));

      if (!response.ok) {
        const errorMsg = data.message || `Request failed with status ${response.status}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      // Fallback for network errors (e.g. backend server not started)
      if (!err.status) {
        err.message = 'Unable to connect to backend server at ' + API_BASE_URL + '. Is "node server.js" running?';
      }
      throw err;
    }
  }

  const api = {
    baseUrl: API_BASE_URL,

    // GET request
    async get(endpoint, options = {}) {
      return request(endpoint, { method: 'GET', ...options });
    },

    // POST request
    async post(endpoint, body, options = {}) {
      return request(endpoint, { method: 'POST', body, ...options });
    },

    // PUT request
    async put(endpoint, body, options = {}) {
      return request(endpoint, { method: 'PUT', body, ...options });
    },

    // DELETE request
    async delete(endpoint, options = {}) {
      return request(endpoint, { method: 'DELETE', ...options });
    },

    // Auth Token Helpers
    setToken(token) {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    },

    getToken() {
      return localStorage.getItem(TOKEN_KEY);
    },

    clearToken() {
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  // Expose to global window
  window.api = api;

})(window);
