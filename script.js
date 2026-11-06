/**
 * WearX — Shared JavaScript (script.js)
 * Pure Vanilla JS | Zero Libraries
 * Features: Navigation, Cart System, Lead Forms, Cursor Animation, Marquee, GA4 DataLayer
 */

(function () {
  'use strict';

  // GA4 dataLayer
  window.dataLayer = window.dataLayer || [];

  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initCursorTextAnimation();
    initLeadForms();
    initModal();
    if (window.WearXCart) {
      window.WearXCart.updateBadge();
    }
    initFloatingTracking();
  });

  /* ==========================================================================
     1. Mobile Navigation Drawer
     ========================================================================== */
  function initNavigation() {
    var toggleBtn = document.querySelector('.nav-toggle');
    var navMenu = document.querySelector('.nav');
    var backdrop = document.querySelector('.nav__backdrop');

    if (!toggleBtn || !navMenu) return;

    function openMenu() {
      navMenu.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      navMenu.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', function () {
      if (navMenu.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (backdrop) {
      backdrop.addEventListener('click', closeMenu);
    }

    navMenu.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
        closeMenu();
      }
    });
  }

  /* ==========================================================================
     2. Cursor-Based Text Animation
     Wrap heading characters in spans with .anim-char for per-character effects
     Also supports .anim-word for word-level hover
     ========================================================================== */
  function initCursorTextAnimation() {
    // Per-character animation for elements with [data-anim="chars"]
    document.querySelectorAll('[data-anim="chars"]').forEach(function (el) {
      var text = el.textContent;
      el.innerHTML = '';
      for (var i = 0; i < text.length; i++) {
        var charSpan = document.createElement('span');
        charSpan.className = 'anim-char';
        charSpan.textContent = text[i] === ' ' ? '\u00A0' : text[i];
        el.appendChild(charSpan);
      }
    });

    // Per-word animation for elements with [data-anim="words"]
    document.querySelectorAll('[data-anim="words"]').forEach(function (el) {
      var words = el.textContent.split(' ');
      el.innerHTML = '';
      words.forEach(function (word, idx) {
        var wordSpan = document.createElement('span');
        wordSpan.className = 'anim-word';
        wordSpan.textContent = word;
        el.appendChild(wordSpan);
        if (idx < words.length - 1) {
          el.appendChild(document.createTextNode(' '));
        }
      });
    });

    // Magnetic cursor effect on elements with [data-anim="magnetic"]
    document.querySelectorAll('[data-anim="magnetic"]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.15) + 'px)';
      });

      el.addEventListener('mouseleave', function () {
        el.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* ==========================================================================
     3. Lead Capture / Enquiry Forms
     ========================================================================== */
  function initLeadForms() {
    var leadForms = document.querySelectorAll('form[data-form="enquiry"]');

    leadForms.forEach(function (form) {
      var phoneInput = form.querySelector('input[type="tel"]');
      var submitBtn = form.querySelector('button[type="submit"]');
      var feedbackBox = form.querySelector('.form-feedback') || createFeedbackBox(form);

      if (phoneInput) {
        phoneInput.addEventListener('input', function () {
          this.value = this.value.replace(/\D/g, '').slice(0, 10);
          clearError(phoneInput);
        });
      }

      form.querySelectorAll('input, select, textarea').forEach(function (field) {
        field.addEventListener('input', function () {
          clearError(field);
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!validateForm(form)) return;

        var formData = new FormData(form);
        var data = Object.fromEntries(formData.entries());

        var originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>Sending...</span>';
        }

        setTimeout(function () {
          window.dataLayer.push({
            event: 'enquiry_form_submitted',
            form_id: form.id || 'lead_form',
            customer_name: data.fullName || '',
            interest: data.interest || 'General'
          });

          try {
            var enquiries = JSON.parse(localStorage.getItem('wearx_enquiries') || '[]');
            enquiries.push({ ...data, timestamp: new Date().toISOString() });
            localStorage.setItem('wearx_enquiries', JSON.stringify(enquiries));
          } catch (err) { /* ignore */ }

          form.reset();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }

          feedbackBox.className = 'form-feedback form-feedback--success is-active';
          feedbackBox.innerHTML = '<strong>Enquiry Received!</strong><p style="margin:0.4rem 0 0; font-size:0.88rem;">Thank you, <strong>' + escapeHtml(data.fullName || 'there') + '</strong>! Our style advisor will reach out within 24 hours.</p>';
        }, 600);
      });
    });
  }

  function validateForm(form) {
    var isValid = true;

    var nameInput = form.querySelector('[name="fullName"]');
    if (nameInput && (!nameInput.value.trim() || nameInput.value.trim().length < 2)) {
      showError(nameInput, 'Please enter your full name');
      isValid = false;
    }

    var phoneInput = form.querySelector('[name="phone"]');
    if (phoneInput) {
      var phoneVal = phoneInput.value.trim();
      if (!phoneVal) {
        showError(phoneInput, 'Mobile number is required');
        isValid = false;
      } else if (!/^[6-9]\d{9}$/.test(phoneVal)) {
        showError(phoneInput, 'Enter a valid 10-digit mobile number');
        isValid = false;
      }
    }

    var emailInput = form.querySelector('[name="email"]');
    if (emailInput && emailInput.hasAttribute('required')) {
      if (!emailInput.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
        showError(emailInput, 'Enter a valid email address');
        isValid = false;
      }
    }

    return isValid;
  }

  function showError(field, message) {
    field.classList.add('is-invalid');
    var errElem = field.parentElement.querySelector('.form-error');
    if (!errElem) {
      errElem = document.createElement('div');
      errElem.className = 'form-error';
      field.parentElement.appendChild(errElem);
    }
    errElem.textContent = message;
    errElem.classList.add('is-visible');
    field.focus();
  }

  function clearError(field) {
    field.classList.remove('is-invalid');
    var errElem = field.parentElement.querySelector('.form-error');
    if (errElem) errElem.classList.remove('is-visible');
  }

  function createFeedbackBox(form) {
    var box = document.createElement('div');
    box.className = 'form-feedback';
    form.appendChild(box);
    return box;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ==========================================================================
     4. Modal Controller
     ========================================================================== */
  function initModal() {
    var modal = document.getElementById('enquiryModal');
    if (!modal) return;

    var closeBtn = modal.querySelector('.modal-close');
    var triggers = document.querySelectorAll('[data-open-modal="enquiry"]');

    function openModal() {
      modal.classList.add('is-active');
      document.body.style.overflow = 'hidden';
      var feedback = modal.querySelector('.form-feedback');
      if (feedback) feedback.classList.remove('is-active');
    }

    function closeModal() {
      modal.classList.remove('is-active');
      document.body.style.overflow = '';
    }

    triggers.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-active')) closeModal();
    });

    window.openEnquiryModal = openModal;
  }

  /* ==========================================================================
     5. E-Commerce Cart Engine (Multi-Store: localStorage + sessionStorage + window.name)
     Works reliably across local file:// environments and deployed domains.
     ========================================================================== */
  var CART_KEYS = ['wearx_cart', 'wearx_cart_v1'];

  function readCartData() {
    for (var k = 0; k < CART_KEYS.length; k++) {
      var key = CART_KEYS[k];
      try {
        var rawLocal = localStorage.getItem(key);
        if (rawLocal) {
          var p1 = JSON.parse(rawLocal);
          if (Array.isArray(p1) && p1.length > 0) return p1;
        }
      } catch (e) {}

      try {
        var rawSession = sessionStorage.getItem(key);
        if (rawSession) {
          var p2 = JSON.parse(rawSession);
          if (Array.isArray(p2) && p2.length > 0) return p2;
        }
      } catch (e) {}
    }

    try {
      if (window.name && window.name.indexOf('wx_cart:') === 0) {
        var p3 = JSON.parse(window.name.substring(8));
        if (Array.isArray(p3) && p3.length > 0) return p3;
      }
    } catch (e) {}

    // Cookie fallback
    try {
      var match = document.cookie.match(/(?:^|; )wx_cart=([^;]*)/);
      if (match) {
        var p4 = JSON.parse(decodeURIComponent(match[1]));
        if (Array.isArray(p4) && p4.length > 0) return p4;
      }
    } catch (e) {}

    if (Array.isArray(window._wearx_cart_memory) && window._wearx_cart_memory.length > 0) {
      return window._wearx_cart_memory;
    }

    return [];
  }

  function writeCartData(items) {
    if (!Array.isArray(items)) items = [];
    window._wearx_cart_memory = items;
    var json = JSON.stringify(items);

    CART_KEYS.forEach(function (k) {
      try { localStorage.setItem(k, json); } catch (e) {}
      try { sessionStorage.setItem(k, json); } catch (e) {}
    });

    try { window.name = 'wx_cart:' + json; } catch (e) {}
    try { document.cookie = 'wx_cart=' + encodeURIComponent(json) + '; path=/; max-age=604800'; } catch (e) {}
  }

  window.WearXCart = {
    KEY: CART_STORAGE_KEY,

    getItems: function () {
      return readCartData();
    },

    save: function (items) {
      writeCartData(items);
      this.updateBadge();
      try {
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: items } }));
      } catch (e) {
        var evt = document.createEvent('Event');
        evt.initEvent('cart-updated', true, true);
        window.dispatchEvent(evt);
      }
    },

    addItem: function (product) {
      if (!product) return;
      var items = this.getItems();
      var id = String(product.id || 'wx-' + Date.now());
      var size = String(product.size || 'M');
      var price = parseFloat(product.price) || 999;
      var name = product.name || 'WearX Outfit';
      var image = product.image || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=530&fit=crop&q=80';
      var category = product.category || 'Casual Wear';

      var existing = items.find(function (item) {
        return item.id === id && item.size === size;
      });

      if (existing) {
        existing.qty = (parseInt(existing.qty, 10) || 1) + 1;
      } else {
        items.push({
          id: id,
          name: name,
          price: price,
          image: image,
          category: category,
          size: size,
          qty: 1
        });
      }

      this.save(items);

      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'add_to_cart',
          product_name: name,
          product_price: price,
          product_category: category,
          ecommerce: {
            items: [{
              item_id: id,
              item_name: name,
              price: price,
              item_category: category,
              quantity: 1
            }]
          }
        });
      } catch (e) {}

      this.showToast(name + ' added to bag!');
      return items;
    },

    removeItem: function (id, size) {
      var items = this.getItems().filter(function (item) {
        return !(item.id === id && item.size === size);
      });
      this.save(items);
    },

    updateQty: function (id, size, newQty) {
      var items = this.getItems();
      var item = items.find(function (i) {
        return i.id === id && i.size === size;
      });
      if (item) {
        item.qty = Math.max(1, parseInt(newQty, 10) || 1);
      }
      this.save(items);
    },

    getTotal: function () {
      return this.getItems().reduce(function (sum, item) {
        return sum + (parseFloat(item.price) || 0) * (parseInt(item.qty, 10) || 1);
      }, 0);
    },

    getCount: function () {
      return this.getItems().reduce(function (sum, item) {
        return sum + (parseInt(item.qty, 10) || 1);
      }, 0);
    },

    clear: function () {
      this.save([]);
    },

    addSampleItem: function () {
      return this.addItem({
        id: 'wx-c01',
        name: 'Olive Oversized Fleece Hoodie',
        price: 1299,
        category: 'Casual Wear',
        image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=530&fit=crop&q=80',
        size: 'M'
      });
    },

    updateBadge: function () {
      var count = this.getCount();
      var badges = document.querySelectorAll('.cart-badge');
      badges.forEach(function (badge) {
        badge.textContent = count > 0 ? count : '';
        badge.setAttribute('data-count', count);
        if (count > 0) {
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      });
    },

    showToast: function (message) {
      var existing = document.querySelector('.cart-toast');
      if (existing) existing.remove();

      var toast = document.createElement('div');
      toast.className = 'cart-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.style.cssText = 'position:fixed;bottom:2rem;right:1.25rem;background:#2a2118;color:#fff;padding:0.85rem 1.25rem;border-radius:12px;font-size:0.9rem;font-weight:700;z-index:99999;box-shadow:0 12px 32px rgba(0,0,0,0.3);transform:translateY(30px);opacity:0;transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1);display:flex;align-items:center;gap:12px;border:1px solid rgba(255,255,255,0.15);';
      
      toast.innerHTML = '<span>' + message + '</span><a href="cart.html" style="background:#d4a373;color:#1a1310;padding:5px 12px;border-radius:6px;text-decoration:none;font-size:0.8rem;font-weight:800;white-space:nowrap;display:inline-block;">View Bag &rarr;</a>';
      document.body.appendChild(toast);

      requestAnimationFrame(function () {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
      });

      setTimeout(function () {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(function () { if (toast.parentNode) toast.remove(); }, 350);
      }, 3500);
    }
  };

  // Immediate badge initialization
  window.WearXCart.updateBadge();

  // Global Click Delegator for all Add-to-Cart buttons
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add-cart]');
    if (!btn) return;

    var card = btn.closest('[data-product]');
    if (!card) return;

    e.preventDefault();

    var id = card.getAttribute('data-product-id') || 'wx-' + Date.now();
    var name = card.getAttribute('data-product-name') || 'WearX Outfit';
    var price = parseFloat(card.getAttribute('data-product-price')) || 999;
    var image = card.getAttribute('data-product-image') || '';
    var category = card.getAttribute('data-product-category') || 'Fashion';
    var size = card.getAttribute('data-product-size') || 'M';

    window.WearXCart.addItem({
      id: id,
      name: name,
      price: price,
      image: image,
      category: category,
      size: size
    });

    // Instant Visual Button Feedback
    var origHTML = btn.innerHTML;
    btn.innerHTML = '✓ Added to Bag!';
    btn.style.backgroundColor = '#5c6b47';
    btn.style.borderColor = '#5c6b47';
    btn.style.color = '#fff';

    setTimeout(function () {
      btn.innerHTML = origHTML;
      btn.style.backgroundColor = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 1500);
  });

  /* ==========================================================================
     6. Click Tracking for GA4
     ========================================================================== */
  function initFloatingTracking() {
    document.querySelectorAll('a[href*="wa.me"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.dataLayer.push({
          event: 'whatsapp_click',
          click_location: btn.classList.contains('floating-whatsapp') ? 'floating_badge' : 'content_button'
        });
      });
    });

    document.querySelectorAll('a[href^="tel:"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.dataLayer.push({
          event: 'phone_call_click',
          phone_number: btn.getAttribute('href')
        });
      });
    });
  }

})();
