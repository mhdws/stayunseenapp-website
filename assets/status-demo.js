/* Local illustration only. This demo never reads or writes extension settings. */
(() => {
  'use strict';
  const root = document.querySelector('[data-status-demo]');
  if (!root) return;
  const find = selector => root.querySelector(selector);
  const siteSelect = find('[data-status-site]');
  const stateSelect = find('[data-status-state]');
  const trigger = find('[data-status-trigger]');
  const panel = find('[data-status-controls]');
  const toolList = find('[data-status-tools]');
  const pause = find('[data-status-pause]');
  const restore = find('[data-status-restore]');
  const sample = find('[data-status-page]');
  const notice = find('[data-status-notice]');
  const platforms = {
    instagram: { name: 'Instagram', tools: ['media', 'follow', 'mark', 'focus', 'screen', 'queue', 'unread'] },
    facebook: { name: 'Facebook', tools: ['media', 'mark', 'focus', 'screen', 'queue', 'unread'] },
    messenger: { name: 'Messenger', tools: ['media', 'mark', 'screen', 'queue', 'unread'] },
    whatsapp: { name: 'WhatsApp Web', tools: ['mark', 'screen'] },
    threads: { name: 'Threads', tools: ['follow', 'focus', 'screen', 'unread'] },
    tiktok: { name: 'TikTok', tools: ['tiktokMedia', 'tiktokFollow'] }
  };
  const labels = {
    media: 'Media download buttons', follow: 'Profile follow status', mark: 'Mark Seen button',
    focus: 'Focus mode', screen: 'Screen privacy', queue: 'Download queue', unread: 'Keep unread markers',
    tiktokMedia: 'Video download buttons', tiktokFollow: 'Profile follow status'
  };
  const preferences = {
    media: true, follow: true, mark: true, focus: false, screen: false, queue: false, unread: true,
    tiktokMedia: true, tiktokFollow: true
  };
  let site = siteSelect.value;
  let pauseUntil = 0;
  let pauseTimer;

  const setOpen = open => {
    panel.hidden = !open;
    panel.setAttribute('aria-hidden', String(!open));
    trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      const firstControl = panel.querySelector('button:not([disabled]), a[href]');
      firstControl?.focus({ preventScroll: true });
    }
  };
  const announce = message => { notice.textContent = message + ' · Preview only'; };
  const status = () => {
    if (site === 'tiktok') return preferences.tiktokMedia || preferences.tiktokFollow ? 'On' : 'Off';
    if (pauseUntil > Date.now()) return 'Paused';
    return stateSelect.value;
  };
  const render = () => {
    const current = status();
    const tiktok = site === 'tiktok';
    const paused = pauseUntil > Date.now();
    const blurred = !tiktok && preferences.screen;
    const focused = platforms[site].tools.includes('focus') && preferences.focus;
    const badge = find('[data-status-badge]');
    badge.textContent = current;
    badge.dataset.state = current.toLowerCase();
    trigger.dataset.state = current.toLowerCase();
    find('[data-status-trigger-label]').textContent = ['Active', 'On'].includes(current) ? 'Stay Unseen' : 'Unseen: ' + current;
    trigger.setAttribute('aria-label', 'Stay Unseen ' + platforms[site].name + ' quick controls. ' + current);
    find('[data-status-type]').textContent = tiktok ? 'TikTok tools' : 'Privacy protection';
    find('[data-status-state-field]').hidden = tiktok;
    find('[data-status-platform-name]').textContent = platforms[site].name;
    find('[data-status-platform-icon]').setAttribute('href', '#' + site);
    toolList.querySelectorAll('[data-status-tool]').forEach(button => {
      button.setAttribute('aria-checked', String(preferences[button.dataset.statusTool]));
    });
    pause.hidden = tiktok;
    pause.textContent = paused ? 'Resume protection' : 'Pause protection for 15 minutes';
    const pauseHint = find('[data-status-pause-hint]');
    pauseHint.hidden = tiktok;
    pauseHint.textContent = paused
      ? 'Resumes in ' + Math.max(1, Math.ceil((pauseUntil - Date.now()) / 60000)) + ' minutes.'
      : 'In the extension, pause applies across supported sites.';
    sample.classList.toggle('is-blurred', blurred);
    sample.classList.toggle('is-focused', focused);
    find('[data-status-focus-message]').hidden = !focused;
    find('[data-status-blur-caption]').hidden = !blurred;
  };
  const renderTools = () => {
    toolList.replaceChildren();
    for (const key of platforms[site].tools) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'status-tool';
      button.dataset.statusTool = key;
      button.setAttribute('role', 'switch');
      button.setAttribute('aria-checked', String(preferences[key]));
      const label = document.createElement('span');
      label.textContent = labels[key];
      const control = document.createElement('span');
      control.className = 'status-tool-switch';
      control.setAttribute('aria-hidden', 'true');
      button.append(label, control);
      button.addEventListener('click', () => {
        preferences[key] = !preferences[key];
        render();
        announce(labels[key] + ' ' + (preferences[key] ? 'on' : 'off'));
      });
      toolList.append(button);
    }
  };
  const startPauseTimer = () => {
    clearInterval(pauseTimer);
    if (!pauseUntil) return;
    pauseTimer = setInterval(() => {
      if (Date.now() >= pauseUntil) {
        pauseUntil = 0;
        clearInterval(pauseTimer);
        announce('Protection pause ended');
      }
      render();
    }, 1000);
  };

  const closePanel = () => {
    setOpen(false);
    if (!trigger.hidden) trigger.focus({ preventScroll: true });
  };
  root.querySelectorAll('button:disabled,select:disabled').forEach(control => { control.disabled = false; });
  panel.setAttribute('aria-hidden', 'false');
  trigger.addEventListener('click', () => setOpen(panel.hidden));
  find('[data-status-close]').addEventListener('click', closePanel);
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault();
      closePanel();
    }
  });
  document.addEventListener('click', event => {
    if (panel.hidden || panel.contains(event.target) || trigger.contains(event.target) || restore.contains(event.target)) return;
    if (root.contains(event.target) && !find('.status-preview-stage').contains(event.target)) return;
    closePanel();
  });
  siteSelect.addEventListener('change', () => {
    site = siteSelect.value;
    renderTools();
    render();
    if (!trigger.hidden) setOpen(true);
    announce(platforms[site].name + ' quick controls');
  });
  stateSelect.addEventListener('change', () => {
    render();
    announce(pauseUntil > Date.now() ? 'Selected status will apply after the pause' : 'Privacy status: ' + status());
  });
  pause.addEventListener('click', () => {
    pauseUntil = pauseUntil > Date.now() ? 0 : Date.now() + 15 * 60000;
    startPauseTimer();
    render();
    announce(pauseUntil ? 'Protection paused for 15 minutes' : 'Protection resumed');
  });
  find('[data-status-hide]').addEventListener('click', () => {
    setOpen(false);
    trigger.hidden = true;
    restore.hidden = false;
    restore.focus();
    announce('Pill hidden. In the extension, restore it from Dashboard → In-Page Utilities');
  });
  restore.addEventListener('click', () => {
    trigger.hidden = false;
    restore.hidden = true;
    setOpen(true);
    render();
    trigger.focus();
    announce('Pill restored');
  });
  addEventListener('pagehide', () => clearInterval(pauseTimer));
  addEventListener('pageshow', event => { if (event.persisted) { startPauseTimer(); render(); } });
  renderTools();
  render();
})();
