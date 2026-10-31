/* Hand-rolled inline SVG charts — no charting library, fully offline, theme-aware
   via CSS custom properties referenced directly in fill/stroke. */
window.PHIMS_CHARTS = (function () {
  "use strict";

  const COLOR_VAR = {
    teal: "var(--teal-600)", amber: "var(--amber-500)", rose: "var(--rose-500)", indigo: "var(--indigo-500)",
  };

  function svgEl(w, h, inner, extra) {
    return '<svg viewBox="0 0 ' + w + " " + h + '" ' + (extra || "") + '>' + inner + "</svg>";
  }

  // ---- Line chart: one or two series over N categorical x points ---------
  function line(series, labels, opts) {
    opts = opts || {};
    const w = 600, h = 220, padL = 34, padR = 10, padT = 14, padB = 26;
    const innerW = w - padL - padR, innerH = h - padT - padB;
    const allVals = series.flatMap((s) => s.values);
    const max = Math.max(...allVals, 1) * 1.15;
    const n = labels.length;
    const x = (i) => padL + (innerW * i) / (n - 1);
    const y = (v) => padT + innerH - (innerH * v) / max;

    let defs = "";
    let body = "";
    // gridlines
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const gy = padT + (innerH * i) / steps;
      body += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (w - padR) + '" y2="' + gy + '" stroke="var(--line)" stroke-width="1"/>';
    }
    series.forEach((s, si) => {
      const color = COLOR_VAR[s.color] || COLOR_VAR.teal;
      const pts = s.values.map((v, i) => x(i) + "," + y(v));
      const gradId = "lg" + si + Math.floor(Math.random() * 100000);
      defs += '<linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.32"/>' +
        '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/></linearGradient>';
      const areaPts = pts.join(" ") + " " + x(n - 1) + "," + (padT + innerH) + " " + x(0) + "," + (padT + innerH);
      body += '<polygon points="' + areaPts + '" fill="url(#' + gradId + ')"/>';
      body += '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
      const lastI = n - 1;
      body += '<circle cx="' + x(lastI) + '" cy="' + y(s.values[lastI]) + '" r="4" fill="' + color + '"/>';
      body += '<circle class="pulse" cx="' + x(lastI) + '" cy="' + y(s.values[lastI]) + '" r="4" fill="' + color + '"/>';
    });
    // x-axis labels, sparse
    const labelEvery = Math.ceil(n / 6);
    for (let i = 0; i < n; i += labelEvery) {
      body += '<text x="' + x(i) + '" y="' + (h - 6) + '" font-size="9.5" fill="var(--text-3)" text-anchor="middle" font-family="var(--font-body)">' + labels[i] + "</text>";
    }
    return svgEl(w, h, defs + body, 'class="chart-line"');
  }

  // ---- Donut chart ----------------------------------------------------------
  function donut(segments, opts) {
    opts = opts || {};
    const size = 160, cx = size / 2, cy = size / 2, r = 54, stroke = 20;
    const circumference = 2 * Math.PI * r;
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    let offset = 0;
    let body = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="' + stroke + '"/>';
    segments.forEach((s) => {
      const frac = s.value / total;
      const len = frac * circumference;
      const color = COLOR_VAR[s.color] || COLOR_VAR.teal;
      body += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke +
        '" stroke-dasharray="' + len + " " + (circumference - len) + '" stroke-dashoffset="' + (-offset) +
        '" transform="rotate(-90 ' + cx + " " + cy + ')" stroke-linecap="butt"/>';
      offset += len;
    });
    body += '<text x="' + cx + '" y="' + (cy - 3) + '" text-anchor="middle" font-family="var(--font-display)" font-weight="700" font-size="22" fill="var(--text-1)">' + total + "</text>";
    body += '<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-family="var(--font-body)" font-size="9.5" fill="var(--text-3)">facilities</text>';
    return svgEl(size, size, body);
  }

  // ---- Horizontal bar chart ------------------------------------------------
  function hbar(items, opts) {
    opts = opts || {};
    const w = 560;
    const rowH = 26, gap = 10;
    const h = items.length * (rowH + gap);
    const labelW = opts.labelW || 150;
    const maxVal = opts.max || Math.max(...items.map((i) => i.value), 1);
    const barAreaW = w - labelW - 54;
    let body = "";
    items.forEach((it, i) => {
      const y = i * (rowH + gap);
      const barW = Math.max(2, (barAreaW * it.value) / maxVal);
      const color = COLOR_VAR[it.color] || COLOR_VAR.teal;
      body += '<text x="0" y="' + (y + rowH / 2 + 4) + '" font-size="12" fill="var(--text-2)" font-family="var(--font-body)">' + it.label + "</text>";
      body += '<rect x="' + labelW + '" y="' + y + '" width="' + barAreaW + '" height="' + rowH + '" rx="7" fill="var(--line)"/>';
      body += '<rect x="' + labelW + '" y="' + y + '" width="' + barW + '" height="' + rowH + '" rx="7" fill="' + color + '"/>';
      body += '<text x="' + (labelW + barAreaW + 10) + '" y="' + (y + rowH / 2 + 4) + '" font-size="12" font-family="var(--font-mono)" fill="var(--text-1)">' + it.display + "</text>";
    });
    return svgEl(w, h, body);
  }

  // ---- Abstract Pakistan map with intensity markers --------------------
  function map(provinces, markersByProvince) {
    const w = 320, h = 360;
    // Simplified, stylized blob shapes — not surveyed boundaries, a schematic reference only.
    const shapes = {
      kp:  "M95,55 L150,45 L165,95 L140,120 L100,110 Z",
      gb:  "M150,20 L205,15 L225,55 L180,70 L150,45 Z",
      ict: "M165,95 L195,90 L205,110 L180,118 Z",
      aj:  "M195,90 L235,70 L255,105 L225,125 L205,110 Z",
      pb:  "M100,110 L180,118 L225,125 L235,175 L210,230 L150,235 L120,190 L95,150 Z",
      bl:  "M40,180 L95,150 L120,190 L150,235 L135,300 L70,310 L35,250 Z",
      sd:  "M150,235 L210,230 L235,260 L225,330 L160,345 L135,300 Z",
    };
    let body = "";
    Object.keys(shapes).forEach((id) => {
      body += '<path d="' + shapes[id] + '" class="map-province" data-province="' + id + '"/>';
    });
    provinces.forEach((p) => {
      body += '<text x="' + p.x + '" y="' + p.y + '" font-size="8.5" fill="var(--text-3)" font-family="var(--font-body)" text-anchor="middle">' + p.name.split(" ")[0] + "</text>";
    });
    markersByProvince.forEach((m) => {
      const color = m.level === "high" ? "var(--rose-500)" : m.level === "medium" ? "var(--amber-500)" : "var(--teal-600)";
      body += '<g class="map-marker">' +
        '<circle class="pulse" cx="' + m.x + '" cy="' + m.y + '" r="6" fill="' + color + '"/>' +
        '<circle cx="' + m.x + '" cy="' + m.y + '" r="5" fill="' + color + '" stroke="var(--paper-2)" stroke-width="1.5"/>' +
        "</g>";
    });
    return svgEl(w, h, body);
  }

  return { line, donut, hbar, map };
})();
