(function () {
  'use strict';

  var qs = function (selector, scope) { return (scope || document).querySelector(selector); };
  var qsa = function (selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); };

  var i18nNode = qs('[data-i18n]');
  var I18N = {};
  try { I18N = i18nNode ? JSON.parse(i18nNode.textContent) : {}; } catch (e) { I18N = {}; }

  // Scoped money formatter. Returns an HTML string: the shop's money_format may
  // legitimately contain markup (e.g. <span class="money">), which is preserved,
  // while the numeric amount itself is always escaped. Does not touch
  // window.Shopify globals.
  function groupThousands(intPart, separator) {
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  }

  function moneyHtml(cents, format) {
    var fmt = format || (window.Shopify && window.Shopify.money_format) || '{{amount}}';
    var amount = Math.abs(Number(cents) / 100) || 0;
    var fixed = amount.toFixed(2);
    var parts = fixed.split('.');
    var intPart = parts[0];
    var decPart = parts[1];
    var rounded = String(Math.round(amount));
    var replacements = [
      ['{{amount_no_decimals_with_comma_separator}}', groupThousands(intPart, ',')],
      ['{{amount_no_decimals_with_space_separator}}', groupThousands(intPart, ' ')],
      ['{{amount_no_decimals_with_apostrophe_separator}}', groupThousands(intPart, "'")],
      ['{{amount_with_comma_separator}}', groupThousands(intPart, ',') + '.' + decPart],
      ['{{amount_with_apostrophe_separator}}', groupThousands(intPart, "'") + '.' + decPart],
      ['{{amount_with_space_separator}}', groupThousands(intPart, ' ') + '.' + decPart],
      ['{{amount_no_decimals}}', rounded],
      ['{{amount}}', fixed]
    ];
    var out = String(fmt);
    replacements.forEach(function (pair) {
      out = out.split(pair[0]).join(escapeHtml(pair[1]));
    });
    return out;
  }

  function setMoney(node, cents) {
    if (node) node.innerHTML = moneyHtml(cents);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Mobile menu ---------- */

  function initMobileMenu() {
    var toggle = qs('.mobile-menu-toggle');
    var mobileMenu = qs('#MobileMenu');
    if (toggle && mobileMenu && !toggle.dataset.jsInit) {
      toggle.dataset.jsInit = '1';
      toggle.addEventListener('click', function () {
        var open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        mobileMenu.hidden = open;
      });
    }
    qsa('.submenu-toggle').forEach(function (button) {
      if (button.dataset.jsInit) return;
      button.dataset.jsInit = '1';
      button.addEventListener('click', function () {
        var submenu = qs('.sub-menu', button.parentNode);
        if (!submenu) return;
        var open = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!open));
        submenu.hidden = open;
      });
    });
  }

  /* ---------- Carousels ---------- */

  function initCarousels() {
    qsa('[data-carousel]').forEach(function (carousel) {
      if (carousel.dataset.jsInit) return;
      var slides = qsa('[data-slide]', carousel);
      if (slides.length < 2) return;
      carousel.dataset.jsInit = '1';
      var current = 0;
      var timer = null;
      var paused = false;

      var show = function (index) {
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle('is-active', i === current);
        });
      };
      var start = function () {
        if (carousel.dataset.autoplay !== 'true' || paused || reduceMotion.matches) return;
        clearInterval(timer);
        timer = setInterval(function () { show(current + 1); }, Number(carousel.dataset.interval || 6) * 1000);
      };
      var prev = qs('[data-carousel-prev]', carousel);
      var next = qs('[data-carousel-next]', carousel);
      if (prev) prev.addEventListener('click', function () { show(current - 1); start(); });
      if (next) next.addEventListener('click', function () { show(current + 1); start(); });

      var pauseButton = qs('[data-carousel-pause]', carousel);
      if (pauseButton) {
        pauseButton.textContent = I18N.carousel_pause || pauseButton.textContent;
        pauseButton.addEventListener('click', function () {
          paused = !paused;
          pauseButton.setAttribute('aria-pressed', String(paused));
          pauseButton.textContent = paused
            ? (I18N.carousel_play || 'Play carousel')
            : (I18N.carousel_pause || 'Pause carousel');
          if (paused) clearInterval(timer); else start();
        });
      }
      start();
    });
  }

  /* ---------- Cart drawer ---------- */

  var drawerTrigger = null;

  function drawerElements() {
    var drawer = qs('[data-cart-drawer]');
    if (!drawer) return null;
    return {
      drawer: drawer,
      content: qs('[data-cart-drawer-content]', drawer),
      checkout: qs('[data-cart-checkout]', drawer),
      status: qs('[data-cart-drawer-status]', drawer)
    };
  }

  function openDrawer() {
    var els = drawerElements();
    if (!els) return;
    drawerTrigger = document.activeElement;
    els.drawer.classList.add('is-open');
    els.drawer.setAttribute('aria-hidden', 'false');
    var closeButton = qs('[data-cart-close]', els.drawer);
    if (closeButton) closeButton.focus();
  }

  function closeDrawer(restoreFocus) {
    var els = drawerElements();
    if (!els) return;
    els.drawer.classList.remove('is-open');
    els.drawer.setAttribute('aria-hidden', 'true');
    if (restoreFocus !== false && drawerTrigger && typeof drawerTrigger.focus === 'function') {
      drawerTrigger.focus();
    }
    drawerTrigger = null;
  }

  function updateCartCounts(cart) {
    var count = cart && typeof cart.item_count !== 'undefined' ? cart.item_count : 0;
    qsa('[data-cart-count]').forEach(function (el) { el.textContent = count; });
  }

  function renderCartDrawer(cart) {
    var els = drawerElements();
    if (!els || !els.content) return;
    updateCartCounts(cart);
    if (els.checkout) els.checkout.style.display = cart && cart.item_count ? '' : 'none';

    if (!cart || !cart.item_count) {
      els.content.innerHTML = '<p>' + escapeHtml(I18N.cart_empty || 'Your cart is empty') + '</p>';
      return;
    }

    var html = '<ul class="cart-drawer-items">';
    cart.items.forEach(function (item) {
      var image = item.image
        ? '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '" width="64" height="64" loading="lazy">'
        : '';
      var variantTitle = item.variant_title && item.variant_title !== 'Default Title'
        ? '<p class="cart-drawer-variant">' + escapeHtml(item.variant_title) + '</p>'
        : '';
      html += '<li class="cart-drawer-item">'
        + '<a class="cart-drawer-item-media" href="' + escapeHtml(item.url) + '">' + image + '</a>'
        + '<div class="cart-drawer-item-info">'
        + '<a href="' + escapeHtml(item.url) + '">' + escapeHtml(item.title) + '</a>'
        + variantTitle
        + '<label class="cart-drawer-qty">' + escapeHtml(I18N.cart_quantity || 'Quantity')
        + ' <input type="number" min="0" value="' + escapeHtml(item.quantity) + '" data-cart-key="' + escapeHtml(item.key) + '" aria-label="' + escapeHtml(I18N.cart_quantity || 'Quantity') + '"></label>'
        + '<button type="button" class="cart-drawer-remove" data-cart-remove="' + escapeHtml(item.key) + '">' + escapeHtml(I18N.cart_remove || 'Remove') + '</button>'
        + '<p class="cart-drawer-line-price">' + moneyHtml(item.final_line_price) + '</p>'
        + '</div></li>';
    });
    html += '</ul>'
      + '<p class="cart-drawer-subtotal">' + escapeHtml(I18N.cart_subtotal || 'Subtotal')
      + ': <strong>' + moneyHtml(cart.total_price) + '</strong></p>';
    els.content.innerHTML = html;
  }

  function showDrawerStatus(message) {
    var els = drawerElements();
    if (els && els.status) els.status.textContent = message || '';
  }

  function refreshCart() {
    return fetch(I18N.cart_js_url || '/cart.js', { headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('cart fetch failed');
        return r.json();
      })
      .then(renderCartDrawer)
      .catch(function () { /* keep last rendered content */ });
  }

  function updateCartItem(key, quantity) {
    var updates = {};
    updates[key] = quantity;
    showDrawerStatus('');
    return fetch(I18N.cart_update_url || '/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ updates: updates })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('cart update failed');
        return r.json();
      })
      .then(function (cart) {
        renderCartDrawer(cart);
        return cart;
      })
      .catch(function () {
        showDrawerStatus(I18N.cart_update_error || 'Unable to update the cart. Please try again.');
      });
  }

  function initCartDrawer() {
    var els = drawerElements();
    if (!els) return;

    qsa('[data-cart-toggle]').forEach(function (button) {
      if (button.dataset.jsInit) return;
      button.dataset.jsInit = '1';
      button.addEventListener('click', function (event) {
        if (window.matchMedia('(max-width: 989px)').matches) return;
        event.preventDefault();
        drawerTrigger = button;
        openDrawer();
      });
    });

    qsa('[data-cart-close]').forEach(function (button) {
      if (button.dataset.jsInit) return;
      button.dataset.jsInit = '1';
      button.addEventListener('click', function () { closeDrawer(); });
    });

    if (!els.drawer.dataset.jsInit) {
      els.drawer.dataset.jsInit = '1';
      els.drawer.addEventListener('click', function (event) {
        var target = event.target;
        if (!(target instanceof Element)) return;
        var remove = target.closest('[data-cart-remove]');
        if (remove) {
          updateCartItem(remove.getAttribute('data-cart-remove'), 0);
        }
      });
      els.drawer.addEventListener('change', function (event) {
        var target = event.target;
        if (target instanceof Element && target.matches('input[data-cart-key]')) {
          updateCartItem(target.getAttribute('data-cart-key'), target.value);
        }
      });
      els.drawer.addEventListener('keydown', function (event) {
        if (event.key !== 'Tab' || !els.drawer.classList.contains('is-open')) return;
        var focusables = qsa('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])', els.drawer)
          .filter(function (el) { return el.offsetParent !== null; });
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
    }

    refreshCart();
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeDrawer();
  });

  /* ---------- Product forms ---------- */

  function initProductForm(scope) {
    var section = scope.matches && scope.matches('[data-product-section]') ? scope : qs('[data-product-section]', scope);
    if (!section || section.dataset.productInit) return;
    var form = qs('.product-form', section);
    var jsonNode = qs('[data-product-json]', section);
    if (!form || !jsonNode) return;

    var product;
    try { product = JSON.parse(jsonNode.textContent); } catch (e) { return; }
    if (!product || !product.variants) return;
    section.dataset.productInit = '1';

    var variantInput = qs('[data-variant-id]', form) || qs('input[name="id"]', form);
    var priceNode = qs('[data-product-price]', section);
    var compareNode = qs('[data-compare-price]', section);
    var status = qs('[data-form-status]', form);
    var submit = qs('.product-submit', form);
    // Option names in DOM order; radio groups follow options_with_values order,
    // which is the same positional order as variant.options in the product JSON.
    var optionNames = [];
    qsa('input[type="radio"]', form).forEach(function (input) {
      var match = input.name.match(/^options\[(.*)\]$/);
      if (match && optionNames.indexOf(match[1]) === -1) optionNames.push(match[1]);
    });

    var labels = {
      add: I18N.add_to_cart || 'Add to cart',
      soldOut: I18N.sold_out || 'Sold out',
      unavailable: I18N.combination_unavailable || 'This combination is not available.'
    };

    var initialVariantId = variantInput ? variantInput.value : null;
    var initialVariant = product.variants.find(function (v) { return String(v.id) === String(initialVariantId); });

    function selectedValues() {
      var values = [];
      optionNames.forEach(function (name) {
        var input = qs('input[type="radio"][name="options[' + name + ']"]:checked', form);
        values.push(input ? input.value : null);
      });
      return values;
    }

    function findVariant(values) {
      // Products without visible option controls have no selections to match;
      // use the server-selected (or single) variant directly.
      if (!optionNames.length) {
        return initialVariant || product.variants[0] || null;
      }
      if (values.some(function (v) { return v === null; })) return null;
      return product.variants.find(function (variant) {
        return variant.options && variant.options.every(function (opt, i) {
          return opt === values[i];
        });
      }) || null;
    }

    function syncMedia(variant) {
      var mainImage = qs('[data-product-main-image]', section);
      if (!mainImage || !variant) return;
      var mediaId = variant.featured_media && variant.featured_media.id;
      if (!mediaId && product.featured_media) mediaId = product.featured_media.id;
      if (!mediaId) return;
      // Preferred path: delegate to the media module so thumbnail active state,
      // main image, and variant stay in sync.
      if (typeof section.horusiaSelectMedia === 'function' && section.horusiaSelectMedia(mediaId)) return;
      var media = (product.media || []).find(function (m) { return m.id === mediaId; });
      if (!media || !media.preview_image || !media.preview_image.src) return;
      mainImage.src = media.preview_image.src;
      mainImage.removeAttribute('srcset');
      if (media.alt) mainImage.alt = media.alt;
      qsa('[data-product-media]', section).forEach(function (thumb) {
        var active = thumb.getAttribute('data-product-media') === String(mediaId);
        thumb.classList.toggle('is-active', active);
        thumb.setAttribute('aria-pressed', String(active));
      });
    }

    function updateVariant() {
      var variant = findVariant(selectedValues());
      if (!variant) {
        if (variantInput) variantInput.value = '';
        if (priceNode) priceNode.innerHTML = '';
        if (compareNode) { compareNode.hidden = true; compareNode.innerHTML = ''; }
        if (submit) {
          submit.disabled = true;
          submit.textContent = labels.unavailable;
        }
        return;
      }
      if (variantInput) variantInput.value = variant.id;
      setMoney(priceNode, variant.price);
      if (compareNode) {
        var hasCompare = variant.compare_at_price && variant.compare_at_price > variant.price;
        compareNode.hidden = !hasCompare;
        compareNode.innerHTML = hasCompare ? moneyHtml(variant.compare_at_price) : '';
      }
      if (submit) {
        submit.disabled = !variant.available;
        submit.textContent = variant.available ? labels.add : labels.soldOut;
      }
      syncMedia(variant);
    }

    qsa('input[type="radio"]', form).forEach(function (input) {
      input.addEventListener('change', updateVariant);
    });

    // Align the checked radios with the server-selected variant on load
    // (covers ?variant= URLs and stale checked states).
    if (initialVariant && initialVariant.options) {
      optionNames.forEach(function (name, index) {
        var wanted = initialVariant.options[index];
        qsa('input[type="radio"][name="options[' + name + ']"]', form).forEach(function (input) {
          input.checked = input.value === wanted;
        });
      });
    }
    updateVariant();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var formData = new FormData(form);
      var quantity = Number(formData.get('quantity') || 1);
      var id = Number(variantInput ? variantInput.value : NaN);
      if (!id || quantity < 1 || !Number.isFinite(quantity)) {
        if (status) status.textContent = I18N.invalid_quantity || 'Please enter a valid quantity.';
        return;
      }
      if (submit) submit.disabled = true;
      if (status) status.textContent = '';
      var added = false;
      var cartJsUrl = I18N.cart_js_url || '/cart.js';
      var cartPageUrl = I18N.cart_page_url || '/cart';
      fetch(I18N.cart_add_url || '/cart/add.js', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, quantity: quantity })
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Cart add failed');
          return response.json();
        })
        .then(function () {
          added = true;
          if (status) status.textContent = I18N.added_to_cart || 'Added to cart.';
          return fetch(cartJsUrl, { headers: { Accept: 'application/json' } });
        })
        .then(function (r) {
          if (!r.ok) throw new Error('cart fetch failed');
          return r.json();
        })
        .then(function (cart) {
          renderCartDrawer(cart);
          openDrawer();
        })
        .catch(function () {
          if (!status) return;
          if (added) {
            // The item was added; only the drawer refresh failed. Do not imply
            // the add failed — offer a link to the cart page instead.
            status.innerHTML = escapeHtml(I18N.added_to_cart || 'Added to cart.')
              + ' <a href="' + escapeHtml(cartPageUrl) + '">'
              + escapeHtml(I18N.view_cart || 'View cart') + '</a>';
          } else {
            status.textContent = I18N.add_error || 'Unable to add this item. Please try again.';
          }
        })
        .then(function () {
          updateVariant();
        });
    });
  }

  /* ---------- Cart page quantity updates ---------- */

  function initCartPageUpdates(scope) {
    var root = scope && scope.matches && scope.matches('body') ? document : (scope || document);
    qsa('[data-cart-update]', root).forEach(function (input) {
      if (input.dataset.jsInit) return;
      input.dataset.jsInit = '1';
      input.addEventListener('change', function () {
        var updates = {};
        updates[input.getAttribute('data-cart-update')] = input.value;
        var status = qs('[data-cart-page-status]');
        fetch(I18N.cart_update_url || '/cart/update.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ updates: updates })
        })
          .then(function (r) {
            if (!r.ok) throw new Error('cart update failed');
            return r.json();
          })
          .then(function () {
            window.location.reload();
          })
          .catch(function () {
            if (status) {
              status.textContent = I18N.cart_update_error || 'Unable to update the cart. Please try again.';
            } else {
              window.location.reload();
            }
          });
      });
    });
  }

  /* ---------- Product media ---------- */

  function initProductMedia(scope) {
    var section = scope.matches && scope.matches('[data-product-section]') ? scope : qs('[data-product-section]', scope);
    if (!section || section.dataset.mediaInit) return;
    var mainImage = qs('[data-product-main-image]', section);
    if (!mainImage) return;
    section.dataset.mediaInit = '1';

    var thumbs = qsa('[data-product-media]', section);
    var setActive = function (activeThumb) {
      thumbs.forEach(function (thumb) {
        var active = thumb === activeThumb;
        thumb.classList.toggle('is-active', active);
        thumb.setAttribute('aria-pressed', String(active));
      });
    };
    var selectMedia = function (button) {
      var src = button.getAttribute('data-media-src');
      var srcset = button.getAttribute('data-media-srcset');
      var alt = button.getAttribute('data-media-alt');
      if (src) {
        mainImage.src = src;
        if (srcset) {
          mainImage.srcset = srcset;
          mainImage.sizes = '(min-width: 990px) 50vw, 100vw';
        } else {
          mainImage.removeAttribute('srcset');
        }
        if (alt) mainImage.alt = alt;
      }
      setActive(button);
    };

    // Shared entry point used by the variant logic so the active thumbnail,
    // main image, and selected variant stay synchronized. Returns false when
    // no thumbnail matches the requested media id.
    section.horusiaSelectMedia = function (mediaId) {
      var button = thumbs.filter(function (thumb) {
        return thumb.getAttribute('data-product-media') === String(mediaId);
      })[0];
      if (!button) {
        setActive(null);
        return false;
      }
      selectMedia(button);
      return true;
    };

    if (thumbs.length) {
      thumbs.forEach(function (button) {
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', function () { selectMedia(button); });
      });
      // Activate the thumbnail that matches the media actually displayed
      // (the product's featured media), not blindly the first one.
      var jsonNode = qs('[data-product-json]', section);
      var featuredId = null;
      try {
        var parsed = JSON.parse(jsonNode.textContent);
        if (parsed.featured_media) featuredId = parsed.featured_media.id;
      } catch (e) { /* ignore */ }
      if (featuredId != null) section.horusiaSelectMedia(featuredId);
    }

    var zoomEnabled = section.getAttribute('data-zoom-enabled') === 'true';
    if (zoomEnabled) {
      var wrapper = qs('[data-product-main-image-wrapper]', section);
      mainImage.addEventListener('click', function () {
        if (!wrapper) return;
        wrapper.classList.toggle('is-zoomed');
      });
    }
  }

  /* ---------- Boot / theme editor reloads ---------- */

  function initAll(root) {
    var scope = root || document;
    initMobileMenu();
    initCarousels();
    initCartDrawer();
    initCartPageUpdates(scope);
    var productSections = qsa('[data-product-section]', scope);
    if (scope.matches && scope.matches('[data-product-section]')) productSections.unshift(scope);
    productSections.forEach(initProductMedia);
    productSections.forEach(initProductForm);
    if (scope === document) {
      // Product form may live inside a section that also matches above; cover
      // forms rendered without the section marker.
      qsa('.product-form', scope).forEach(function (form) {
        initProductForm(form.closest('section') || form);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(document); });
  } else {
    initAll(document);
  }
  document.addEventListener('shopify:section:load', function (event) {
    initAll(event.target && event.target.querySelector ? event.target : document);
  });
})();
