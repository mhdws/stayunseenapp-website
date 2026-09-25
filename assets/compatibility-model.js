/* Shared public compatibility model. Never reads runtime, storage or licensing. */
(function (root) {
  'use strict';
  const catalog = {
    instagram: { name: 'Instagram', features: { seen: 'Hide Seen', typing: 'Hide Typing', stories: 'Hide Story Views', downloader: 'Media Downloader', follow: 'Follow Status' } },
    facebook: { name: 'Facebook', features: { seen: 'Hide Seen', typing: 'Hide Typing', stories: 'Hide Story Views', downloader: 'Media Downloader', mark_seen: 'Mark Seen' } },
    messenger: { name: 'Messenger', features: { seen: 'Hide Seen', typing: 'Hide Typing', mark_seen: 'Mark Seen' } },
    whatsapp: { name: 'WhatsApp Web', features: { read: 'Hide Read Receipts', typing: 'Hide Typing', status: 'Hide Status Views' } },
    threads: { name: 'Threads', features: { seen: 'Hide Seen', typing: 'Hide Typing' } },
    tiktok: { name: 'TikTok', features: { downloader: 'Video Downloader', follow: 'Follow Status' } },
    utilities: { name: 'Utilities', features: { ghost_pill: 'Ghost Pill', focus_mode: 'Focus Mode', screen_privacy: 'Screen Privacy', download_queue: 'Download Queue' } }
  };
  const states = ['working', 'degraded', 'issue', 'checking', 'not_verified'];
  const labels = { working: 'Working', degraded: 'Degraded', issue: 'Issue', checking: 'Checking', not_verified: 'Not Verified', ready: 'Ready', offline: 'Offline', disabled: 'Disabled', pro: 'Pro' };
  const version = '2.0.0';
  const defaultFreshnessDays = 30;
  function iso(value) {
    // Require an explicit UTC ISO timestamp; never interpret locale dates.
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return null;
    const time = Date.parse(value);
    if (!Number.isFinite(time)) return null;
    const canonical = new Date(time).toISOString();
    return canonical.slice(0, 19) === value.slice(0, 19) ? canonical : null;
  }
  function date(value) {
    const valid = iso(value);
    return valid ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(valid)) : null;
  }
  function freshness(value) {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 && n <= 365 ? n : defaultFreshnessDays;
  }
  function aggregate(values) {
    for (const state of ['issue', 'degraded', 'checking', 'not_verified']) if (values.includes(state)) return state;
    return values.length && values.every(s => s === 'working') ? 'working' : 'not_verified';
  }
  function normalize(input = {}, now = Date.now()) {
    const current = /^\d+\.\d+\.\d+$/.test(input.version) ? input.version : version;
    const days = freshness(input.freshness_days);
    const platforms = {};
    for (const [platform, info] of Object.entries(catalog)) {
      const features = {};
      for (const feature of Object.keys(info.features)) {
        const raw = input.platforms?.[platform]?.features?.[feature] || {};
        const verifiedAt = iso(raw.verified_at);
        const verifiedVersion = /^\d+\.\d+\.\d+$/.test(raw.verified_version) ? raw.verified_version : null;
        const reported = states.includes(raw.reported_status) ? raw.reported_status : states.includes(raw.status) ? raw.status : 'not_verified';
        let status = reported, reason = null;
        if (reported === 'working') {
          if (!verifiedAt || !verifiedVersion) reason = 'unverified';
          else if (Date.parse(verifiedAt) > now) reason = 'unverified';
          else if (verifiedVersion !== current) reason = 'version_changed';
          else if (now - Date.parse(verifiedAt) > days * 86400000) reason = 'stale';
          if (reason) status = 'not_verified';
        }
        features[feature] = { status, reported_status: reported, verified_at: verifiedAt, verified_version: verifiedVersion, reason };
      }
      platforms[platform] = { status: aggregate(Object.values(features).map(f => f.status)), features };
    }
    return { version: current, updated_at: iso(input.updated_at), freshness_days: days, platforms };
  }
  root.StayUnseenCompatibility = Object.freeze({ catalog, states, labels, version, defaultFreshnessDays, iso, date, freshness, aggregate, normalize });
})(globalThis);
