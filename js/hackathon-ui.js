/* ==========================================================================
   HACKATHON UI - Zero Dependency Vanilla JavaScript Utility Library
   Toast Engine, Modal Handler, Form Validator, Theme Manager & UI Helpers
   ========================================================================== */

(function (window, document) {
  'use strict';

  // 1. Toast Notification System
  const Toast = {
    init() {
      if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
      }
    },

    show({ title = 'Notification', message = '', type = 'primary', duration = 3500 }) {
      this.init();
      const container = document.getElementById('toast-container');
      
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      
      let iconSvg = '';
      if (type === 'success') {
        iconSvg = `<svg width="20" height="20" fill="none" stroke="var(--success)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
      } else if (type === 'danger' || type === 'error') {
        iconSvg = `<svg width="20" height="20" fill="none" stroke="var(--danger)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
      } else if (type === 'warning') {
        iconSvg = `<svg width="20" height="20" fill="none" stroke="var(--warning)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
      } else {
        iconSvg = `<svg width="20" height="20" fill="none" stroke="var(--primary)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
      }

      toast.innerHTML = `
        <div class="toast-icon">${iconSvg}</div>
        <div class="toast-content">
          <div class="toast-title">${title}</div>
          ${message ? `<div class="toast-desc">${message}</div>` : ''}
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
      `;

      container.appendChild(toast);
      
      // Trigger animation
      setTimeout(() => toast.classList.add('show'), 10);

      // Auto dismiss
      if (duration > 0) {
        setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => toast.remove(), 350);
        }, duration);
      }
    }
  };

  // 2. Modal Handler System
  const Modal = {
    open(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    },
    close(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  };

  // 3. Tab Switcher Utility
  function initTabs() {
    document.querySelectorAll('[data-tab-group]').forEach(group => {
      const groupName = group.getAttribute('data-tab-group');
      const triggers = group.querySelectorAll('[data-tab]');
      const targets = document.querySelectorAll(`[data-tab-content="${groupName}"]`);

      triggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = trigger.getAttribute('data-tab');

          triggers.forEach(t => t.classList.remove('active'));
          trigger.classList.add('active');

          targets.forEach(target => {
            if (target.id === targetId) {
              target.style.display = 'block';
              target.classList.add('active');
            } else {
              target.style.display = 'none';
              target.classList.remove('active');
            }
          });
        });
      });
    });
  }

  // 4. Form Validation Helper
  const FormValidator = {
    validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    setValid(fieldEl, message = '') {
      const group = fieldEl.closest('.form-group') || fieldEl.parentElement;
      group.classList.remove('is-invalid');
      group.classList.add('is-valid');
      let msgEl = group.querySelector('.validation-msg');
      if (msgEl) msgEl.textContent = message || 'Looks good!';
    },
    setInvalid(fieldEl, message = 'Invalid input') {
      const group = fieldEl.closest('.form-group') || fieldEl.parentElement;
      group.classList.remove('is-valid');
      group.classList.add('is-invalid');
      let msgEl = group.querySelector('.validation-msg');
      if (!msgEl) {
        msgEl = document.createElement('span');
        msgEl.className = 'validation-msg';
        group.appendChild(msgEl);
      }
      msgEl.textContent = message;
    }
  };

  // 5. Password Visibility Toggle
  function initPasswordToggles() {
    document.querySelectorAll('[data-toggle-password]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-toggle-password');
        const input = document.getElementById(targetId);
        if (input) {
          if (input.type === 'password') {
            input.type = 'text';
            btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>`;
          } else {
            input.type = 'password';
            btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
          }
        }
      });
    });
  }

  // 6. Global Theme Toggle
  const ThemeManager = {
    toggle() {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('hackathon_theme', next);
    },
    load() {
      const saved = localStorage.getItem('hackathon_theme') || 'light';
      document.documentElement.setAttribute('data-theme', saved);
    }
  };

  // Auto initialize on DOM Content Loaded
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initPasswordToggles();
    ThemeManager.load();

    // Close modal when clicking overlay background
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });
  });

  // Export to global scope
  window.Toast = Toast;
  window.Modal = Modal;
  window.FormValidator = FormValidator;
  window.ThemeManager = ThemeManager;

})(window, document);
