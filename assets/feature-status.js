(function () {
  const section = document.getElementById('feature-status');
  if (!section) return;
  const cards = globalThis.StayUnseenStatusCards;
  const model = globalThis.StayUnseenCompatibility;
  let initialData;
  try { initialData = JSON.parse(document.getElementById('published-feature-status')?.textContent || '{}'); } catch { initialData = {}; }
  cards.client(({ data, available, lastFetch, source, loading }) => {
    const hasData = available || lastFetch || source === 'published';
    cards.render(section.querySelector('[data-compat-cards]'), data);

    const summaryEl = section.querySelector('[data-compat-summary]');
    const updatedEl = section.querySelector('[data-compat-updated]');
    const noticeEl = section.querySelector('[data-compat-notice]');
    const pillEl = section.querySelector('.compat-status-pill');

    const allFeatures = Object.values(data.platforms).flatMap(p => Object.values(p.features));
    const workingCount = allFeatures.filter(f => f.status === 'working').length;

    if (summaryEl) {
      if (hasData) {
        summaryEl.textContent = `${workingCount} of ${allFeatures.length} features verified`;
      } else {
        summaryEl.textContent = 'Compatibility verification pending';
      }
    }

    if (updatedEl) {
      const date = model.date(data.updated_at);
      if (date) {
        updatedEl.textContent = 'Last updated ' + date;
      } else if (available) {
        updatedEl.textContent = 'No publication date provided';
      } else {
        updatedEl.textContent = 'No verification published yet';
      }
    }

    if (pillEl) {
      if (!hasData) {
        pillEl.dataset.state = 'unavailable';
      } else if (workingCount > 0) {
        pillEl.dataset.state = 'operational';
      } else {
        pillEl.dataset.state = 'pending';
      }
    }

    if (noticeEl) {
      if (source === 'published') {
        noticeEl.setAttribute('hidden', '');
        noticeEl.textContent = '';
      } else if (!available && !lastFetch) {
        noticeEl.removeAttribute('hidden');
        noticeEl.textContent = 'Compatibility data temporarily unavailable';
      } else if (!available && lastFetch) {
        noticeEl.removeAttribute('hidden');
        noticeEl.textContent = 'Compatibility data temporarily unavailable · showing cached verification';
      } else {
        noticeEl.setAttribute('hidden', '');
        noticeEl.textContent = '';
      }
    }
  }, { initialData });
})();
