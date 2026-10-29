// assets/app.js — the page's behaviour.
//
// Four things are interactive, and each one is a real control rather than an
// effect: the six capability tabs swap the record set, the search filters the
// rows in place, the product rail swaps the pane, and the demo form actually
// posts. Nothing here is decorative.

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ------------------------------------------------------------- menu sheet */

  const menu = $('[data-menu]');
  const sheet = $('[data-sheet]');

  if (menu && sheet) {
    const setOpen = (open) => {
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
      sheet.hidden = !open;
      document.body.classList.toggle('is-locked', open);
    };
    menu.addEventListener('click', () => setOpen(sheet.hidden));
    $$('a', sheet).forEach((link) => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !sheet.hidden) {
        setOpen(false);
        menu.focus();
      }
    });
    const wide = window.matchMedia('(min-width: 681px)');
    const closeOnWide = (event) => { if (event.matches) setOpen(false); };
    if (wide.addEventListener) wide.addEventListener('change', closeOnWide);
    else wide.addListener(closeOnWide);
  }

  /* ---------------------------------------------------------- capability tabs */

  const caps = $$('.cap');
  const datasets = $$('.dataset');

  const activeRows = (panel) => $$('tbody tr', panel).filter((row) => !row.hidden);

  const refreshCount = (panel) => {
    const count = $('[data-count]');
    if (!count || !panel) return;
    count.textContent = String(activeRows(panel).length);
  };

  const setCap = (id) => {
    caps.forEach((cap) => {
      const on = cap.dataset.cap === id;
      cap.classList.toggle('is-on', on);
      cap.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    datasets.forEach((panel) => {
      const on = panel.dataset.dataset === id;
      panel.hidden = !on;
      if (on) {
        const input = $('input[type="search"]', panel);
        if (input) input.value = '';
        const chip = $('[data-alert-filter]', panel);
        if (chip) {
          chip.setAttribute('aria-pressed', 'false');
          $$('tbody tr', panel).forEach((row) => { row.hidden = false; });
        }
        refreshCount(panel);
      }
    });
  };

  caps.forEach((cap) => {
    cap.addEventListener('click', () => setCap(cap.dataset.cap));
    cap.addEventListener('keydown', (event) => {
      const i = caps.indexOf(cap);
      let next = null;
      if (event.key === 'ArrowRight') next = caps[(i + 1) % caps.length];
      if (event.key === 'ArrowLeft') next = caps[(i - 1 + caps.length) % caps.length];
      if (next) {
        event.preventDefault();
        next.focus();
        setCap(next.dataset.cap);
      }
    });
  });

  $$('[data-jump]').forEach((link) => {
    link.addEventListener('click', () => setCap(link.dataset.jump));
  });

  /* ------------------------------------------------------------ table search */

  datasets.forEach((panel) => {
    const input = $('input[type="search"]', panel);
    const chip = $('[data-alert-filter]', panel);
    const rows = $$('tbody tr', panel);
    if (!rows.length) return;

    const apply = () => {
      const term = input ? input.value.trim().toLowerCase() : '';
      const onlyAlerts = chip && chip.getAttribute('aria-pressed') === 'true';
      let shown = 0;
      rows.forEach((row) => {
        const hay = row.dataset.search || '';
        const matches = (!term || hay.includes(term)) && (!onlyAlerts || row.dataset.alert === '1');
        row.hidden = !matches;
        if (matches) shown += 1;
      });
      let empty = $('.empty', panel);
      if (!shown) {
        if (!empty) {
          empty = document.createElement('p');
          empty.className = 'empty';
          empty.textContent = 'No records match. Clear the search, or try a vendor name.';
          $('.table-wrap', panel).appendChild(empty);
        }
        empty.hidden = false;
      } else if (empty) {
        empty.hidden = true;
      }
      refreshCount(panel);
    };

    if (input) input.addEventListener('input', apply);
    if (chip) {
      chip.addEventListener('click', () => {
        const on = chip.getAttribute('aria-pressed') !== 'true';
        chip.setAttribute('aria-pressed', on ? 'true' : 'false');
        apply();
      });
    }
  });

  /* ----------------------------------------------------------- product rail */

  const railItems = $$('.rail-item');
  const panes = $$('.pane');

  const setProduct = (id) => {
    railItems.forEach((item) => {
      const on = item.dataset.product === id;
      item.classList.toggle('is-on', on);
      item.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panes.forEach((pane) => {
      pane.hidden = pane.dataset.pane !== id;
    });
  };

  railItems.forEach((item) => {
    item.addEventListener('click', () => setProduct(item.dataset.product));
    item.addEventListener('keydown', (event) => {
      const i = railItems.indexOf(item);
      let next = null;
      if (event.key === 'ArrowDown') next = railItems[(i + 1) % railItems.length];
      if (event.key === 'ArrowUp') next = railItems[(i - 1 + railItems.length) % railItems.length];
      if (next) {
        event.preventDefault();
        next.focus();
        setProduct(next.dataset.product);
      }
    });
  });

  /* -------------------------------------------------------------- industries */

  const tabs = $$('.tab');
  const industryPanes = $$('.industry-pane');

  const setIndustry = (id) => {
    tabs.forEach((tab) => {
      const on = tab.dataset.industry === id;
      tab.classList.toggle('is-on', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    industryPanes.forEach((pane) => {
      pane.hidden = pane.dataset.ipane !== id;
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setIndustry(tab.dataset.industry));
  });

  /* -------------------------------------------------------------- the form */

  const form = $('[data-demo-form]');
  if (form) {
    const note = $('[data-form-note]', form);
    const input = $('input[name="email"]', form);
    const button = $('button[type="submit"]', form);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const value = input.value.trim();
      note.classList.remove('is-error', 'is-ok');
      input.removeAttribute('aria-invalid');

      if (!value || !value.includes('@') || !value.includes('.')) {
        input.setAttribute('aria-invalid', 'true');
        note.textContent = 'That address is missing something — check the domain.';
        note.classList.add('is-error');
        input.focus();
        return;
      }

      button.disabled = true;
      const label = button.innerHTML;
      button.textContent = 'Sending…';
      note.textContent = '';

      try {
        const response = await fetch('/api/demo', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: value })
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          const detail = typeof data.error === 'string' ? data.error : 'The server could not take that.';
          throw new Error(detail);
        }
        note.textContent = data.message;
        note.classList.add('is-ok');
        input.value = '';
      } catch (error) {
        note.textContent = error.message + ' Try again, or write to hello@kiln.systems.';
        note.classList.add('is-error');
      } finally {
        button.disabled = false;
        button.innerHTML = label;
      }
    });
  }

  /* ---------------------------------------------------------------- reveal */

  const reveal = $('[data-reveal]');
  if (reveal && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('reveal-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.disconnect();
        }
      });
    }, { threshold: 0.25 });
    observer.observe(reveal);
  } else if (reveal) {
    reveal.classList.add('is-in');
  }

  // The count in the panel foot starts at the first dataset's row count.
  refreshCount($('.dataset:not([hidden])'));
})();
