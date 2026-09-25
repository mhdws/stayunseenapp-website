/* Shared DOM view. All API strings enter the page through textContent. */
(function (root) {
  'use strict';
  const model = root.StayUnseenCompatibility;
  const publicTip = 'Working means this feature has been verified against the currently supported version of this platform.';
  const runtimeTip = 'Runtime status reflects the protection state detected in this browser.';

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function badge(state, text, tip) {
    const node = element('span', 'compat-badge compat-' + state, text != null ? text : model.labels[state] || 'Checking');
    if (tip) node.title = tip;
    return node;
  }

  function info(tip) {
    const wrap = element('span', 'compat-info-wrap');
    const button = element('button', 'compat-info', 'i');
    button.type = 'button';
    button.setAttribute('aria-label', tip);
    const show = () => { wrap.dataset.open = 'true'; button.setAttribute('aria-expanded', 'true'); };
    const hide = () => { delete wrap.dataset.open; button.setAttribute('aria-expanded', 'false'); };
    hide();
    button.addEventListener('focus', show);
    button.addEventListener('click', (e) => { e.stopPropagation(); show(); });
    button.addEventListener('blur', hide);
    button.addEventListener('keydown', event => { if (event.key === 'Escape') { hide(); button.blur(); } });
    wrap.append(button, element('span', 'compat-tooltip', tip));
    return wrap;
  }

  function render(container, input, options = {}) {
    const focusedPlatform = container.contains(document.activeElement) && document.activeElement.matches('.compat-info')
      ? document.activeElement.closest('[data-platform]')?.dataset.platform
      : null;
    const previouslyExpanded = new Set(
      Array.from(container.querySelectorAll('.compat-card[data-expanded="true"]')).map(c => c.dataset.platform)
    );
    const hasPriorState = container.querySelector('.compat-card') !== null;
    const defaultExpanded = options.expandedDefault ?? (container.closest('#feature-status')?.dataset.expandedDefault === 'true');

    const data = model.normalize(input);
    const grid = element('div', 'compat-grid');

    for (const [platform, meta] of Object.entries(model.catalog)) {
      const record = data.platforms[platform];
      const runtime = options.runtime?.platforms?.[platform];
      const card = element('article', 'compat-card');
      card.dataset.platform = platform;

      const isExpanded = options.local
        ? true
        : hasPriorState
          ? previouslyExpanded.has(platform)
          : (defaultExpanded || previouslyExpanded.has(platform));
      if (isExpanded) {
        card.dataset.expanded = 'true';
      }

      // Card Header
      const header = element('div', 'compat-card-head');
      const icon = element('span', 'compat-icon');
      if (platform === 'utilities') {
        const img = element('img');
        img.src = options.brandIcon || 'assets/icon128.png';
        img.alt = '';
        icon.append(img);
      } else if (options.iconBase != null) {
        const img = element('img');
        img.src = options.iconBase + platform + '.svg';
        img.alt = '';
        icon.append(img);
      } else {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', '#' + platform);
        svg.setAttribute('aria-hidden', 'true');
        svg.append(use);
        icon.append(svg);
      }

      const title = element('div', 'compat-card-title');
      const titleH3 = element('h3', '', meta.name);
      const totalControls = Object.keys(meta.features).length;
      const verifiedCount = Object.values(record.features).filter(f => f.status === 'working').length;

      let subText;
      if (options.local) {
        subText = totalControls + ' controls';
      } else if (platform === 'utilities') {
        subText = verifiedCount > 0 ? `${verifiedCount}/${totalControls} verified suite tools` : `${totalControls} in-page suite tools`;
      } else {
        subText = verifiedCount > 0 ? `${verifiedCount}/${totalControls} protections verified` : `${totalControls} protections`;
      }
      const titleP = element('p', 'compat-card-sub', subText);
      title.append(titleH3, titleP);

      const headState = options.local ? runtime?.status || 'checking' : record.status;
      const statusWrap = element('div', 'compat-header-status');
      const headLabel = options.local
        ? model.labels[headState] || 'Checking'
        : headState === 'working' ? 'Working' : headState === 'not_verified' ? 'Not Verified' : model.labels[headState] || 'Checking';
      statusWrap.append(badge(headState, headLabel), info(options.local ? runtimeTip : publicTip));
      header.append(icon, title, statusWrap);

      // Compact Meta Row with Latest Check & Toggle
      const metaRow = element('div', 'compat-card-meta');
      const latestVerified = Object.values(record.features)
        .map(f => f.verified_at)
        .filter(Boolean)
        .sort()
        .pop();

      const metaDate = element('span', 'compat-meta-date');
      if (latestVerified) {
        metaDate.textContent = 'Latest check: ' + model.date(latestVerified);
      } else {
        metaDate.textContent = verifiedCount > 0 ? 'Verified' : 'Check pending';
      }

      const expandBtn = element('button', 'compat-expand-btn');
      expandBtn.type = 'button';
      expandBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      expandBtn.setAttribute('aria-controls', 'details-' + platform);
      expandBtn.innerHTML = `<span>${isExpanded ? 'Hide details' : 'View details'}</span> <svg class="compat-chevron" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

      metaRow.append(metaDate, expandBtn);

      const toggleCard = () => {
        const currentlyExpanded = card.dataset.expanded === 'true';
        if (currentlyExpanded) {
          delete card.dataset.expanded;
          expandBtn.setAttribute('aria-expanded', 'false');
          expandBtn.querySelector('span').textContent = 'View details';
        } else {
          card.dataset.expanded = 'true';
          expandBtn.setAttribute('aria-expanded', 'true');
          expandBtn.querySelector('span').textContent = 'Hide details';
        }
      };

      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCard();
      });

      header.addEventListener('click', (e) => {
        if (e.target.closest('.compat-info-wrap')) return;
        toggleCard();
      });

      // Expandable Details Container
      const details = element('div', 'compat-card-details');
      details.id = 'details-' + platform;

      const list = element('ul', 'compat-features');
      for (const [feature, name] of Object.entries(meta.features)) {
        const row = element('li', 'compat-feature');
        row.dataset.feature = feature;
        const featureData = record.features[feature];
        const right = element('span', 'compat-feature-status');
        const health = runtime?.features?.[feature];
        const state = options.local ? health?.status || 'checking' : featureData.status;
        const isStale = !options.local && featureData.reason === 'stale';

        let label;
        if (isStale) {
          label = 'Verification due';
        } else if (options.local) {
          label = model.labels[state] || 'Checking';
        } else if (state === 'not_verified') {
          label = '—';
        } else {
          label = model.labels[state] || 'Checking';
        }

        right.append(badge(state, label, options.local ? health?.detail || runtimeTip : publicTip));

        const date = model.date(featureData.verified_at);
        const verified = element('small', 'compat-date', date ? 'Verified ' + date : '');
        if (date) {
          verified.title = 'Extension ' + (featureData.verified_version || '2.0.0') + ' · UTC' + (featureData.reason ? ' · ' + (featureData.reason === 'stale' ? 'Verification due' : 'Current version needs verification') : '');
        }
        if (options.local && featureData.reason) {
          verified.textContent += featureData.reason === 'stale' ? ' · Due' : ' · Recheck';
        }
        right.append(verified);

        row.append(element('span', 'compat-feature-name', name), right);
        list.append(row);
      }

      details.append(list);
      card.append(header, metaRow, details);
      grid.append(card);
    }

    container.replaceChildren(grid);

    // Bind section-level Expand all / Collapse all if present
    const toggleAllBtn = container.closest('section')?.querySelector('#compat-toggle-all');
    if (toggleAllBtn) {
      const anyCollapsed = Array.from(grid.querySelectorAll('.compat-card')).some(c => c.dataset.expanded !== 'true');
      toggleAllBtn.setAttribute('aria-expanded', !anyCollapsed ? 'true' : 'false');
      const textSpan = toggleAllBtn.querySelector('.compat-toggle-all-text');
      if (textSpan) textSpan.textContent = !anyCollapsed ? 'Collapse all' : 'Expand all';

      if (!toggleAllBtn.dataset.bound) {
        toggleAllBtn.dataset.bound = 'true';
        toggleAllBtn.addEventListener('click', () => {
          const cards = container.querySelectorAll('.compat-card');
          const willExpand = Array.from(cards).some(c => c.dataset.expanded !== 'true');
          for (const c of cards) {
            const btn = c.querySelector('.compat-expand-btn');
            if (willExpand) {
              c.dataset.expanded = 'true';
              if (btn) {
                btn.setAttribute('aria-expanded', 'true');
                btn.querySelector('span').textContent = 'Hide details';
              }
            } else {
              delete c.dataset.expanded;
              if (btn) {
                btn.setAttribute('aria-expanded', 'false');
                btn.querySelector('span').textContent = 'View details';
              }
            }
          }
          toggleAllBtn.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
          if (textSpan) textSpan.textContent = willExpand ? 'Collapse all' : 'Expand all';
        });
      }
    }

    if (focusedPlatform && Object.hasOwn(model.catalog, focusedPlatform)) {
      container.querySelector('[data-platform="' + focusedPlatform + '"] .compat-info')?.focus({ preventScroll: true });
    }
    return data;
  }

  function summary(input) {
    const data = model.normalize(input);
    const features = Object.values(data.platforms).flatMap(p => Object.values(p.features));
    const working = features.filter(f => f.status === 'working').length;
    if (working === 0) return 'Compatibility verification pending';
    if (working === features.length) return 'All verified systems operational';
    return `${working} of ${features.length} features verified`;
  }

  function client(onChange, options = {}) {
    let data = model.normalize(options.initialData || {}), available = false, lastFetch = 0, pending = false, stopped = false, activeRequest = null, attempted = false;
    let source = data.updated_at ? 'published' : null;
    const emit = () => { if (!stopped) onChange({ data: model.normalize(data), available, lastFetch, source, loading: !attempted || pending }); };
    async function refresh() {
      if (pending || stopped) return;
      pending = true;
      const controller = new AbortController();
      activeRequest = controller;
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        const response = await fetch('https://api.stayunseenapp.com/v1/status/features', {
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('unavailable');
        const text = await response.text();
        if (text.length > 65536) throw new Error('oversized');
        const input = JSON.parse(text);
        if (!input || typeof input !== 'object' || !input.platforms || typeof input.platforms !== 'object' || !/^\d+\.\d+\.\d+$/.test(input.version)) throw new Error('invalid');
        const incoming = model.normalize(input);
        // A website publication may be newer than D1 (or D1 may still be empty).
        // Keep the newest complete publication, including through API failures.
        if (!data.updated_at || (incoming.updated_at && incoming.updated_at >= data.updated_at)) {
          data = incoming;
          source = 'api';
        }
        available = true;
        lastFetch = Date.now();
      } catch {
        available = false;
      } finally {
        clearTimeout(timer);
        pending = false;
        attempted = true;
        activeRequest = null;
        emit();
      }
    }
    emit();
    refresh();
    // Re-normalize between fetches so an open page cannot retain Working forever.
    const tick = setInterval(emit, 60000);
    const poll = setInterval(refresh, 300000);
    return {
      refresh,
      stop() {
        stopped = true;
        activeRequest?.abort();
        clearInterval(tick);
        clearInterval(poll);
      }
    };
  }

  root.StayUnseenStatusCards = Object.freeze({ render, summary, client });
})(globalThis);
