/* Shared navigation and progressive enhancements for the public website. */
(() => {
  'use strict';
  const header = document.querySelector('.site-header');
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.nav-links');
  const progress = document.querySelector('.scroll-progress');
  const mobile = matchMedia('(max-width: 600px)');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const links = navigation ? [...navigation.querySelectorAll('a')] : [];

  const localTarget = link => {
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return null;
    return document.getElementById(decodeURIComponent(url.hash.slice(1)));
  };

  if (header && menu && navigation) {
    const closeMenu = () => {
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', 'Open navigation');
      navigation.toggleAttribute('data-collapsed', mobile.matches);
      navigation.toggleAttribute('inert', mobile.matches);
    };
    closeMenu();
    mobile.addEventListener('change', closeMenu);
    menu.hidden = false;
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      navigation.toggleAttribute('data-collapsed', !open);
      navigation.toggleAttribute('inert', !open);
      if (open) links[0]?.focus({ preventScroll: true });
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        menu.focus();
      }
    });
    document.addEventListener('click', event => {
      if (menu.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) closeMenu();
    });
    links.forEach(link => link.addEventListener('click', () => {
      if (!mobile.matches) return;
      closeMenu();
      const target = localTarget(link);
      if (target) {
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    }));
  }

  const sections = links.map(link => ({ link, target: localTarget(link) })).filter(section => section.target);
  let scheduled = false;
  let positions = [];
  const measureSections = () => {
    positions = sections.map(section => ({ ...section, top: section.target.getBoundingClientRect().top + scrollY }));
  };
  const renderScroll = () => {
    scheduled = false;
    header?.classList.toggle('is-sticky', scrollY > 100);
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    let active = null;
    for (const section of positions) {
      if (section.top <= scrollY + innerHeight * .35) active = section.link;
    }
    sections.forEach(({ link }) => {
      if (link === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const scheduleScroll = () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(renderScroll);
    }
  };
  measureSections();
  renderScroll();
  addEventListener('scroll', scheduleScroll, { passive: true });
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { measureSections(); scheduleScroll(); }).observe(document.body);
  } else {
    addEventListener('resize', () => { measureSections(); scheduleScroll(); }, { passive: true });
  }

  if ('IntersectionObserver' in window && !motion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: '100px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(element => {
      if (element.getBoundingClientRect().top <= innerHeight) return;
      element.classList.add('reveal-ready');
      observer.observe(element);
    });
    motion.addEventListener('change', () => {
      if (!motion.matches) return;
      observer.disconnect();
      document.querySelectorAll('.reveal-ready').forEach(element => element.classList.add('is-visible'));
    });
  }
})();
