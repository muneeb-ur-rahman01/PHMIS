/* Minimal inline icon set — stroke-based, inherits currentColor. No external icon font. */
window.PHIMS_ICONS = (function () {
  "use strict";
  const wrap = (body) =>
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + body + "</svg>";

  const paths = {
    grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8"/>',
    building: '<rect x="4" y="3" width="11" height="18" rx="1.2"/><path d="M15 21V8l5 2v11"/><path d="M7.5 7h2M7.5 11h2M7.5 15h2"/>',
    folder: '<path d="M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h4l2 2.3h8a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z"/>',
    virus: '<circle cx="12" cy="12" r="4.2"/><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7"/>',
    pill: '<rect x="3" y="10.3" width="18" height="7.4" rx="3.7" transform="rotate(-35 12 14)"/><path d="M9.5 9.5l5 5" stroke-opacity="0"/><path d="M12 7.2 16.8 12" />',
    bed: '<path d="M3 18v-7a2 2 0 0 1 2-2h5v4"/><path d="M3 18V9.5"/><path d="M3 14h18v4"/><path d="M11 13h7a3 3 0 0 1 3 3v2"/><circle cx="7" cy="8" r="1.6"/>',
    upload: '<path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5"/>',
    bell: '<path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3.2 3.2 0 0 1 0 6.3"/><path d="M15 14c2.8.4 5 2.9 5 6"/>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6z"/><path d="M9 12l2.2 2.2L15.5 9.5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.4 7.4 0 0 0 0-3l2-1.4-1.7-3-2.3.8a7.5 7.5 0 0 0-2.6-1.5L14.4 3h-4.8l-.4 2.4a7.5 7.5 0 0 0-2.6 1.5l-2.3-.8-1.7 3 2 1.4a7.4 7.4 0 0 0 0 3l-2 1.4 1.7 3 2.3-.8a7.5 7.5 0 0 0 2.6 1.5l.4 2.4h4.8l.4-2.4a7.5 7.5 0 0 0 2.6-1.5l2.3.8 1.7-3z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    'chevron-left': '<path d="M15 6l-6 6 6 6"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 13l4 4L19 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    download: '<path d="M12 4v12M12 16l-4-4M12 16l4-4"/><path d="M4 18.5V20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  };

  function icon(name) {
    return wrap(paths[name] || paths.grid);
  }
  return { icon };
})();
