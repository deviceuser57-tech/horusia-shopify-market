(function () {
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const menuToggle = qs('.mobile-menu-toggle');
  const mobileMenu = qs('#MobileMenu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const open = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!open));
      mobileMenu.hidden = open;
    });
  }

  qsa('[data-carousel]').forEach((carousel) => {
    const slides = qsa('[data-slide]', carousel);
    if (slides.length < 2) return;
    let current = 0;
    let timer = null;
    let paused = false;
    const show = (index) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
    };
    const start = () => {
      if (carousel.dataset.autoplay !== 'true' || paused) return;
      clearInterval(timer);
      timer = setInterval(() => show(current + 1), Number(carousel.dataset.interval || 6) * 1000);
    };
    qs('[data-carousel-prev]', carousel)?.addEventListener('click', () => { show(current - 1); start(); });
    qs('[data-carousel-next]', carousel)?.addEventListener('click', () => { show(current + 1); start(); });
    const pauseButton = qs('[data-carousel-pause]', carousel);
    pauseButton?.addEventListener('click', () => {
      paused = !paused;
      pauseButton.setAttribute('aria-pressed', String(paused));
      pauseButton.textContent = paused ? 'Play carousel' : 'Pause carousel';
      if (paused) clearInterval(timer); else start();
    });
    start();
  });

  const drawer = qs('[data-cart-drawer]');
  const openDrawer = () => {
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
  };
  const closeDrawer = () => {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
  };
  qsa('[data-cart-toggle]').forEach((button) => button.addEventListener('click', (event) => {
    if (window.matchMedia('(max-width: 989px)').matches) return;
    event.preventDefault();
    openDrawer();
  }));
  qsa('[data-cart-close]').forEach((button) => button.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });

  const refreshCartCounts = async () => {
    try {
      const cart = await fetch('/cart.js', { headers: { Accept: 'application/json' } }).then((r) => r.json());
      qsa('[data-cart-count]').forEach((el) => { el.textContent = cart.item_count; });
    } catch (_) {}
  };

  qsa('.product-form').forEach((form) => {
    const jsonNode = qs('[data-product-json]');
    let product = null;
    try { product = JSON.parse(jsonNode.textContent); } catch (_) {}
    const variantInput = qs('[data-variant-id]', form);
    const priceNode = qs('[data-product-price]');
    const status = qs('[data-form-status]', form);
    const submit = qs('.product-submit', form);

    const updateVariant = () => {
      if (!product) return;
      const selections = qsa('input[type="radio"]:checked', form).map((input) => input.value);
      const variant = product.variants.find((item) =>
        selections.length === 0 || selections.every((value) => item.options.includes(value))
      );
      if (!variant) return;
      variantInput.value = variant.id;
      if (priceNode && window.Shopify && typeof window.Shopify.formatMoney === 'function') priceNode.textContent = window.Shopify.formatMoney(variant.price, window.Shopify.money_format);
      else if (priceNode) priceNode.textContent = String(variant.price);
      submit.disabled = !variant.available;
      submit.textContent = variant.available ? 'Add to cart' : 'Sold out';
    };
    qsa('input[type="radio"], input[name="quantity"]', form).forEach((input) => input.addEventListener('change', updateVariant));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const quantity = Number(formData.get('quantity') || 1);
      const id = Number(formData.get('id'));
      if (!id || quantity < 1) {
        if (status) status.textContent = 'Please enter a valid quantity.';
        return;
      }
      submit.disabled = true;
      try {
        await fetch('/cart/add.js', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, quantity })
        }).then((response) => {
          if (!response.ok) throw new Error('Cart add failed');
          return response.json();
        });
        await refreshCartCounts();
        openDrawer();
        if (status) status.textContent = 'Added to cart.';
      } catch (_) {
        if (status) status.textContent = 'Unable to add this item. Please try again.';
      } finally {
        submit.disabled = false;
        updateVariant();
      }
    });
  });

  qsa('[data-cart-update]').forEach((input) => {
    input.addEventListener('change', () => {
      const updates = {};
      updates[input.dataset.cartUpdate] = input.value;
      fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ updates })
      }).then(() => window.location.reload()).catch(() => window.location.reload());
    });
  });

  refreshCartCounts();
})();
