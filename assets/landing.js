/* Stay Unseen 2.0.0. Local illustrative demos; no extension or account access. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const stores = {
    edge: ['Add to Edge — free', 'https://microsoftedge.microsoft.com/addons/detail/stay-unseen-ig-fb-see/fnlnnfoeafbpbjgkkiihhkfncjhombai'],
    firefox: ['Add to Firefox — free', 'https://addons.mozilla.org/en-US/firefox/addon/stay-unseen-ig-fb-seen-blocker/'],
    chrome: ['Add to Chrome — free', 'https://chromewebstore.google.com/detail/stay-unseen-ig-fb-seen-bl/bfbajdhcgbnclhljgbcjficphhedlkje']
  };
  const ua = navigator.userAgent;
  const desktop = !/Android|iPhone|iPad|iPod|Mobile/i.test(ua) && !(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const browser = /Edg\//.test(ua) ? 'edge' : /Firefox\//.test(ua) ? 'firefox' : /Chrome\//.test(ua) || /Chromium\//.test(ua) ? 'chrome' : null;
  if (desktop && browser) {
    $$('[data-browser-cta]').forEach(link => {
      link.href = stores[browser][1]; link.target = '_blank'; link.rel = 'noopener noreferrer';
      $('[data-browser-label]', link).textContent = stores[browser][0];
    });
  } else {
    $$('[data-browser-label]').forEach(label => { label.textContent = 'Choose your browser'; });
  }
  // Video bytes load only when the visitor chooses to play. Native controls are the fallback.
  const video = $('#product-video');
  const play = $('.video-play');
  if (video && play) {
    play.hidden = false; video.controls = false;
    play.addEventListener('click', async () => {
      play.hidden = true; video.controls = true; video.tabIndex = 0; video.focus({ preventScroll: true });
      try { await video.play(); } catch { /* Leave native play/retry controls accessible. */ }
    });
    video.addEventListener('play', () => {
      play.hidden = true; video.controls = true; $('.hero-product').classList.add('is-playing');
    });
    video.addEventListener('ended', () => {
      play.hidden = false; video.controls = false; $('.hero-product').classList.remove('is-playing');
    });
    video.addEventListener('error', () => { play.hidden = true; video.controls = true; });
  }
  // Switches affect only this page's illustrated conversation.
  const privacy = { stories: true, receipts: true, typing: true };
  const updatePrivacy = () => {
    $('[data-receipt-output]').textContent = privacy.receipts ? 'Delivered · read receipt blocked' : 'Seen · read receipt sent';
    $('[data-typing-label]').textContent = privacy.typing ? 'Typing indicator hidden' : 'Typing… visible to the other person';
    $('[data-story-output]').textContent = privacy.stories ? 'Story view hidden from the viewer list' : 'Story view appears in the viewer list';
    $('[data-protection-output]').textContent = `${Object.values(privacy).filter(Boolean).length} privacy controls on`;
    $('.signal-stage').classList.toggle('signals-visible', Object.values(privacy).every(value => !value));
  };
  $$('[data-privacy]').forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      const key = button.dataset.privacy; privacy[key] = !privacy[key];
      button.setAttribute('aria-checked', String(privacy[key])); updatePrivacy();
    });
  });
  // ARIA tabs are progressive enhancements; all panels are readable without JavaScript.
  const tabList = $('.pro-tabs');
  const tabs = $$('[data-pro-tab]');
  const panels = $$('[data-pro-panel]');
  tabList.setAttribute('role', 'tablist');
  const selectTab = selected => {
    tabs.forEach(tab => {
      const active = tab === selected; tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1; tab.classList.toggle('selected', active);
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.proPanel !== selected.dataset.proTab; });
  };
  tabs.forEach((tab, index) => {
    tab.disabled = false; tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `panel-${tab.dataset.proTab}`);
    const panel = panels.find(item => item.dataset.proPanel === tab.dataset.proTab);
    panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', tab.id); panel.tabIndex = 0;
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); selectTab(tabs[next]); tabs[next].focus();
    });
  });
  selectTab(tabs[0]);
  const queue = $('[data-queue-demo]');
  const queueRow = $('.demo-queue-row');
  let queueTimer, queueBusy = false;
  queue.disabled = false;
  queue.addEventListener('click', () => {
    if (queueBusy) return;
    if (!queueRow.hidden) {
      queueRow.hidden = true; $('[data-queue-count]').textContent = '2 items';
      $('[data-queue-output]').textContent = 'Sample queue · no files are downloaded';
      $('[data-queue-button-label]').textContent = 'Try the queue demo'; return;
    }
    queueBusy = true; queue.setAttribute('aria-disabled', 'true'); queueRow.hidden = false;
    queueRow.classList.add('is-saving'); $('[data-queue-count]').textContent = '3 items';
    $('[data-queue-state]').textContent = 'Queued';
    $('[data-queue-output]').textContent = 'Example added to queue · preview only';
    $('[data-queue-button-label]').textContent = 'Adding to your queue…';
    queueTimer = window.setTimeout(() => {
      $('[data-queue-state]').textContent = 'Saved ✓'; queueRow.classList.remove('is-saving');
      $('[data-queue-output]').textContent = 'Demo complete · no files were downloaded';
      $('[data-queue-button-label]').textContent = 'Reset queue demo';
      queue.removeAttribute('aria-disabled'); queueBusy = false;
    }, motion.matches ? 100 : 1200);
  });
  window.addEventListener('pagehide', () => clearTimeout(queueTimer));
  const focus = $('[data-focus-demo]');
  const blur = $('[data-blur-demo]');
  [focus, blur].forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
      const focused = focus.getAttribute('aria-pressed') === 'true';
      const blurred = blur.getAttribute('aria-pressed') === 'true';
      $('.focus-preview').classList.toggle('focus-enabled', focused);
      $('.focus-preview').classList.toggle('blur-enabled', blurred); $('.blur-message').hidden = !blurred;
      $('[data-focus-label]').textContent = focused ? 'On' : 'Off'; $('[data-blur-label]').textContent = blurred ? 'On' : 'Off';
      $('[data-focus-output]').textContent = `Preview · focus mode ${focused ? 'on' : 'off'} · screen privacy ${blurred ? 'on' : 'off'}`;
    });
  });
  const seen = $('[data-seen-demo]'); seen.disabled = false;
  seen.addEventListener('click', () => {
    const marked = seen.getAttribute('aria-pressed') !== 'true'; seen.setAttribute('aria-pressed', String(marked));
    $('[data-seen-status]').textContent = marked ? 'Seen · sent by you ✓✓' : 'Delivered';
    $('[data-seen-label]').textContent = marked ? 'Reset demo' : 'Mark Seen';
  });
})();
