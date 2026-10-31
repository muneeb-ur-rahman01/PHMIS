/* Page renderers. Each module exposes render(ctx) -> html string, and an
   optional after(ctx) that wires up listeners once that html is in the DOM.
   ctx = { role, state, DATA, CHARTS, ICONS, toast, openModal, closeModal, auditLog, rerender, currentUser, navigate } */
window.PHIMS_VIEWS = (function () {
  "use strict";

  // ---------------------------------------------------------------- utils --
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDate(d) {
    try { return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
    catch (e) { return d; }
  }
  function statusBadgeClass(status) {
    const s = String(status).toLowerCase();
    if (["operational", "active", "approved", "committed", "success", "resolved", "low"].indexOf(s) !== -1) return "badge-ok";
    if (["partial", "pending review", "needs review", "under review", "invited", "acknowledged", "open", "medium"].indexOf(s) !== -1) return "badge-warn";
    if (["non-operational", "closed", "suspended", "denied", "failed", "deactivated", "stale", "high"].indexOf(s) !== -1) return "badge-danger";
    return "badge-neutral";
  }
  function badge(status) {
    return '<span class="badge ' + statusBadgeClass(status) + '"><span class="badge-dot" style="background:currentColor"></span>' + esc(status) + "</span>";
  }
  function initials(name) {
    return String(name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  }
  function demoNote(text) {
    return '<p style="font-size:12px;color:var(--text-3);margin-top:-6px;">' + text + "</p>";
  }
  function pageHead(title, sub, actionsHtml) {
    return '<div class="page-head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<div class="sub">' + sub + "</div>" : "") +
      '</div><div class="actions">' + (actionsHtml || "") + "</div></div>";
  }
  function scopedFacilities(DATA, role) {
    // Dramatizes jurisdiction scoping from the role-permission matrix: each
    // role only "sees" facilities inside its assigned geography.
    const all = DATA.FACILITIES;
    switch (role.key) {
      case "district": case "facility": case "entry": case "inventory": case "partner":
        return all.filter((f) => f.district === "Narowal");
      case "provincial": case "epi":
        return all.filter((f) => f.province === "pb");
      default:
        return all;
    }
  }
  function scopedCases(DATA, role) {
    const fIds = scopedFacilities(DATA, role).map((f) => f.id);
    const visible = DATA.CASES.filter((c) => fIds.indexOf(c.facilityId) !== -1);
    // Epidemiologist and auditor-type roles see pseudonymized aggregates only —
    // the prototype marks this rather than hiding rows outright.
    return visible;
  }
  function facilityName(DATA, id) {
    const f = DATA.FACILITIES.find((x) => x.id === id);
    return f ? f.name : id;
  }
  function diseaseName(DATA, code) {
    const d = DATA.DISEASES.find((x) => x.code === code);
    return d ? d.name : code;
  }
  function diseaseColor(DATA, code) {
    const d = DATA.DISEASES.find((x) => x.code === code);
    return d ? d.color : "teal";
  }

  const VIEWS = {};

  // ===================================================================
  // DASHBOARD
  // ===================================================================
  VIEWS.dashboard = {
    render: function (c) {
      const DATA = c.DATA, role = c.role;
      const facilities = scopedFacilities(DATA, role);
      const fIds = facilities.map((f) => f.id);
      const cases = DATA.CASES.filter((cs) => fIds.indexOf(cs.facilityId) !== -1);
      const confirmed = cases.filter((cs) => cs.classification === "Confirmed");
      const active = confirmed.filter((cs) => cs.outcome === "Active").length;
      const recovered = confirmed.filter((cs) => cs.outcome === "Recovered").length;
      const deceased = confirmed.filter((cs) => cs.outcome === "Deceased").length;
      const operational = facilities.filter((f) => f.status === "Operational").length;
      const partial = facilities.filter((f) => f.status === "Partial").length;
      const nonOp = facilities.filter((f) => f.status === "Non-operational").length;
      const lowStock = DATA.MEDICINES.filter((m) => facilities.some((f) => f.name === m.facility) && m.stock < m.threshold);
      const openAlerts = c.state.alerts.filter((a) => a.status === "Open" && (role.key === "super-admin" || role.key === "national" || facilityScopeMatches(a.scope, facilities)));

      // 14-day trend of confirmed cases + deaths for the scoped set
      const days = 14;
      const today = new Date(2026, 9, 24);
      const labels = [], caseSeries = [], deathSeries = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        labels.push(d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }));
        caseSeries.push(confirmed.filter((cs) => cs.reportDate === iso).length);
        deathSeries.push(confirmed.filter((cs) => cs.reportDate === iso && cs.outcome === "Deceased").length);
      }

      // Disease distribution (top 5 by confirmed count in scope)
      const byDisease = {};
      confirmed.forEach((cs) => { byDisease[cs.disease] = (byDisease[cs.disease] || 0) + 1; });
      const diseaseBars = Object.keys(byDisease).map((code) => ({
        label: diseaseName(DATA, code), value: byDisease[code], display: String(byDisease[code]),
        color: diseaseColor(DATA, code),
      })).sort((a, b) => b.value - a.value).slice(0, 5);
      const maxDisease = Math.max.apply(null, diseaseBars.map((d) => d.value).concat([1]));

      const mapMarkers = buildMapMarkers(DATA, facilities);

      return (
        '<div class="greet">' +
          '<div><h1>Welcome back, ' + esc(firstName(c.currentUser.name)) + '</h1>' +
            '<div class="date">' + role.label + ' · ' + role.scope + ' · Saturday, 24 October 2026</div></div>' +
          '<div class="demo-banner"><span class="dot"></span>All figures are synthetic demonstration data</div>' +
        '</div>' +

        '<div class="kpi-strip">' +
          kpi("kpi-lg", "", "Confirmed cases in scope", confirmed.length, (confirmed.length ? "+" + Math.max(1, Math.round(confirmed.length * 0.08)) + " vs. last 14 days" : ""), "up") +
          kpi("kpi-lg info", "", "Active cases", active, recovered + " recovered · " + deceased + " deaths", "") +
          kpi("kpi-sm warn", "", "Facilities partially operational", partial, nonOp + " non-operational", "") +
          kpi("kpi-sm", "", "Facilities fully operational", operational, "of " + facilities.length + " in scope", "") +
          kpi("kpi-sm danger", "", "Medicines below threshold", lowStock.length, "across scoped facilities", "") +
          kpi("kpi-sm warn", "", "Alerts awaiting review", openAlerts.length, "open right now", "") +
        '</div>' +

        '<div class="grid-2">' +
          '<div class="glass panel">' +
            '<div class="panel-head"><h3>Confirmed cases and deaths, last 14 days</h3><span class="meta">All diseases in scope</span></div>' +
            c.CHARTS.line([
              { color: "teal", values: caseSeries },
              { color: "rose", values: deathSeries },
            ], labels) +
            '<div class="map-legend"><span><i style="background:var(--teal-600)"></i>confirmed cases</span><span><i style="background:var(--rose-500)"></i>deaths</span></div>' +
          '</div>' +
          '<div class="glass panel">' +
            '<div class="panel-head"><h3>Facility status</h3><span class="meta">' + facilities.length + ' facilities</span></div>' +
            '<div style="display:flex;align-items:center;gap:18px;">' +
              c.CHARTS.donut([
                { color: "teal", value: operational }, { color: "amber", value: partial }, { color: "rose", value: nonOp },
              ]) +
              '<div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">' +
                legendRow("teal", "Operational", operational) +
                legendRow("amber", "Partial", partial) +
                legendRow("rose", "Non-operational", nonOp) +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +

        '<div class="grid-2">' +
          '<div class="glass panel">' +
            '<div class="panel-head"><h3>Case distribution by province</h3><span class="meta">Marker size ~ severity</span></div>' +
            '<div class="map-wrap">' + c.CHARTS.map(DATA.PROVINCES, mapMarkers) + '</div>' +
            '<div class="map-legend">' +
              '<span><i style="background:var(--rose-500)"></i>high</span>' +
              '<span><i style="background:var(--amber-500)"></i>medium</span>' +
              '<span><i style="background:var(--teal-600)"></i>low</span>' +
            "</div>" +
          "</div>" +
          '<div class="glass panel">' +
            '<div class="panel-head"><h3>Top diseases by confirmed cases</h3><span class="meta">In scope</span></div>' +
            (diseaseBars.length
              ? c.CHARTS.hbar(diseaseBars.map((d) => ({ label: d.label, value: d.value, display: d.display, color: d.color })), { max: maxDisease })
              : '<div class="empty-state">No confirmed cases in this scope yet.</div>') +
          "</div>" +
        "</div>" +

        '<div class="grid-2">' +
          '<div class="glass panel">' +
            '<div class="panel-head"><h3>Recent validated reports</h3><a class="meta" style="cursor:pointer;color:var(--teal-600)" data-go="reports">View all</a></div>' +
            '<div class="table-wrap"><table class="data"><thead><tr><th>Report</th><th>Scope</th><th>Generated</th></tr></thead><tbody>' +
              DATA.REPORTS.slice(0, 5).map((r) => '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.scope) + '</td><td class="mono">' + fmtDate(r.generated) + '</td></tr>').join("") +
            "</tbody></table></div>" +
          "</div>" +
          '<div class="glass panel">' +
            '<div class="panel-head"><h3>Alerts requiring review</h3><a class="meta" style="cursor:pointer;color:var(--teal-600)" data-go="alerts">View all</a></div>' +
            (openAlerts.length
              ? openAlerts.slice(0, 4).map((a) => '<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px;">' +
                  '<span>' + esc(a.type) + ' — ' + esc(a.scope) + '</span>' + badge(a.severity) + '</div>').join("")
              : '<div class="empty-state">Nothing open in your scope.</div>') +
          "</div>" +
        "</div>"
      );
    },
    after: function (c) {
      Array.prototype.forEach.call(document.querySelectorAll("[data-go]"), function (el) {
        el.addEventListener("click", function () { c.navigate(el.dataset.go); });
      });
    },
  };

  function firstName(n) { return String(n || "").split(" ")[0] || "there"; }
  function kpi(extraClass, icon, label, value, delta, deltaDir) {
    return '<div class="kpi glass ' + extraClass + '">' +
      '<div class="label">' + esc(label) + '</div>' +
      '<div class="value">' + value + '</div>' +
      (delta ? '<div class="delta ' + (deltaDir || "") + '">' + esc(delta) + '</div>' : "") +
      "</div>";
  }
  function legendRow(color, label, value) {
    const v = { teal: "var(--teal-600)", amber: "var(--amber-500)", rose: "var(--rose-500)", indigo: "var(--indigo-500)" }[color];
    return '<div style="display:flex;align-items:center;gap:8px;"><span style="width:9px;height:9px;border-radius:50%;background:' + v + ';display:inline-block;"></span>' + esc(label) + ' <span class="mono" style="color:var(--text-3)">' + value + "</span></div>";
  }
  function facilityScopeMatches(scopeText, facilities) {
    return facilities.some((f) => scopeText.indexOf(f.district) !== -1 || scopeText.indexOf(f.name) !== -1);
  }
  function buildMapMarkers(DATA, facilities) {
    const byProvince = {};
    DATA.CASES.forEach((cs) => {
      if (facilities.some((f) => f.id === cs.facilityId) && cs.classification === "Confirmed") {
        byProvince[cs.province] = (byProvince[cs.province] || 0) + 1;
      }
    });
    return DATA.PROVINCES.filter((p) => byProvince[p.id]).map((p) => {
      const n = byProvince[p.id];
      const level = n >= 10 ? "high" : n >= 5 ? "medium" : "low";
      return { x: p.x + 14, y: p.y - 8, level: level };
    });
  }

  // ===================================================================
  // FACILITIES
  // ===================================================================
  VIEWS.facilities = {
    render: function (c) {
      const DATA = c.DATA, role = c.role;
      const list = scopedFacilities(DATA, role);
      const q = (c.state.pendingFacilityQuery || "").toLowerCase();
      c.state.pendingFacilityQuery = "";
      const canManage = role.nav.indexOf("facilities") !== -1 && (role.key === "super-admin" || role.key === "national" || role.key === "provincial" || role.key === "district" || role.key === "facility");

      return pageHead("Healthcare facilities", list.length + " facilities in " + role.scope,
          canManage ? '<button class="btn btn-primary btn-sm" id="addFacilityBtn">' + c.ICONS.icon("plus") + ' Add facility</button>' : "") +
        '<div class="glass panel">' +
          '<div class="filter-bar" style="margin-bottom:14px;">' +
            '<select id="fTypeFilter"><option value="">All types</option>' +
              Array.from(new Set(list.map((f) => f.type))).map((t) => '<option value="' + esc(t) + '">' + esc(t) + "</option>").join("") +
            "</select>" +
            '<select id="fStatusFilter"><option value="">All statuses</option>' +
              Array.from(new Set(list.map((f) => f.status))).map((s) => '<option value="' + esc(s) + '">' + esc(s) + "</option>").join("") +
            "</select>" +
            '<input id="fSearch" type="text" placeholder="Search name, code, district…" value="' + esc(q) + '" style="min-width:220px;" />' +
            '<span class="spacer"></span><span class="filter-count" id="fCount"></span>' +
          "</div>" +
          '<div class="table-wrap"><table class="data"><thead><tr>' +
            "<th>Code</th><th>Name</th><th>Type</th><th>District</th><th>Status</th><th>Beds available</th><th>Reporting</th>" +
          "</tr></thead><tbody id=\"fTableBody\"></tbody></table></div>" +
          '<div class="empty-state" id="fEmpty" style="display:none;">No facilities match these filters.</div>' +
        "</div>";
    },
    after: function (c) {
      const DATA = c.DATA, role = c.role;
      const list = scopedFacilities(DATA, role);
      const body = document.getElementById("fTableBody");
      const count = document.getElementById("fCount");
      const empty = document.getElementById("fEmpty");
      const typeSel = document.getElementById("fTypeFilter");
      const statusSel = document.getElementById("fStatusFilter");
      const search = document.getElementById("fSearch");

      function draw() {
        const t = typeSel.value, s = statusSel.value, q = search.value.trim().toLowerCase();
        const rows = list.filter((f) =>
          (!t || f.type === t) && (!s || f.status === s) &&
          (!q || f.name.toLowerCase().indexOf(q) !== -1 || f.code.toLowerCase().indexOf(q) !== -1 || f.district.toLowerCase().indexOf(q) !== -1)
        );
        count.textContent = rows.length + " of " + list.length;
        empty.style.display = rows.length ? "none" : "block";
        body.innerHTML = rows.map((f) =>
          "<tr>" +
            '<td class="mono">' + esc(f.code) + "</td>" +
            "<td>" + esc(f.name) + "</td>" +
            "<td>" + esc(f.type) + "</td>" +
            "<td>" + esc(f.district) + "</td>" +
            "<td>" + badge(f.status) + "</td>" +
            '<td class="num">' + (f.beds ? f.bedsAvailable + " / " + f.beds : "—") + "</td>" +
            "<td>" + esc(f.reporting) + "</td>" +
          "</tr>"
        ).join("");
      }
      typeSel.addEventListener("change", draw);
      statusSel.addEventListener("change", draw);
      search.addEventListener("input", draw);
      draw();

      const addBtn = document.getElementById("addFacilityBtn");
      if (addBtn) addBtn.addEventListener("click", function () {
        c.openModal(
          '<h3>Add facility</h3>' +
          '<p style="font-size:13px;color:var(--text-3);">This is a prototype — the form validates but doesn\'t persist new facilities.</p>' +
          '<div class="field-group"><label>Facility name</label><input id="mfName" type="text" placeholder="BHU Example Town" /></div>' +
          '<div class="field-group"><label>Type</label><select id="mfType"><option>Hospital</option><option>Clinic</option><option>BHU</option><option>RHC</option><option>Laboratory</option><option>Pharmacy</option></select></div>' +
          '<div class="modal-foot"><button class="btn btn-ghost" id="mfCancel">Cancel</button><button class="btn btn-primary" id="mfSave">Save facility</button></div>',
          function (root) {
            root.querySelector("#mfCancel").addEventListener("click", c.closeModal);
            root.querySelector("#mfSave").addEventListener("click", function () {
              const name = root.querySelector("#mfName").value.trim();
              if (!name) { c.toast("Facility name is required.", "danger"); return; }
              c.auditLog("facility.create", name, "Success");
              c.closeModal();
              c.toast('"' + name + '" was added to the demo facility list for this session.', "ok");
            });
          }
        );
      });
    },
  };

  // ===================================================================
  // PATIENTS / CASES
  // ===================================================================
  VIEWS.patients = {
    render: function (c) {
      const DATA = c.DATA, role = c.role;
      const cases = scopedCases(DATA, role);
      const pseudonymized = role.key === "epi";
      const q = (c.state.pendingCaseQuery || "").toLowerCase();
      c.state.pendingCaseQuery = "";

      return pageHead("Patients and case records", cases.length + " records in " + role.scope + (pseudonymized ? " · pseudonymized view" : ""),
          '<button class="btn btn-primary btn-sm" id="addCaseBtn">' + c.ICONS.icon("plus") + ' New case entry</button>') +
        (pseudonymized ? '<div class="demo-box">Your role analyzes pseudonymized case-level data. Identifiers are replaced with case numbers; direct patient identity isn\'t shown here.</div>' : "") +
        '<div class="glass panel">' +
          '<div class="filter-bar" style="margin-bottom:14px;">' +
            '<select id="pDisease"><option value="">All diseases</option>' + DATA.DISEASES.map((d) => '<option value="' + d.code + '">' + esc(d.name) + "</option>").join("") + "</select>" +
            '<select id="pClass"><option value="">All classifications</option><option>Suspected</option><option>Probable</option><option>Confirmed</option></select>' +
            '<select id="pOutcome"><option value="">All outcomes</option><option>Active</option><option>Recovered</option><option>Deceased</option></select>' +
            '<input id="pSearch" type="text" placeholder="Search case ID…" value="' + esc(q) + '" style="min-width:160px;" />' +
            '<span class="spacer"></span><span class="filter-count" id="pCount"></span>' +
          "</div>" +
          '<div class="table-wrap"><table class="data"><thead><tr>' +
            "<th>Case ID</th><th>Disease</th><th>Facility</th><th>Classification</th><th>Outcome</th><th>Reported</th><th>Status</th>" +
          "</tr></thead><tbody id=\"pTableBody\"></tbody></table></div>" +
          '<div class="empty-state" id="pEmpty" style="display:none;">No case records match these filters.</div>' +
        "</div>";
    },
    after: function (c) {
      const DATA = c.DATA, role = c.role;
      const cases = scopedCases(DATA, role).slice().sort((a, b) => b.reportDate.localeCompare(a.reportDate));
      const body = document.getElementById("pTableBody");
      const count = document.getElementById("pCount");
      const empty = document.getElementById("pEmpty");
      const dSel = document.getElementById("pDisease"), cSel = document.getElementById("pClass"), oSel = document.getElementById("pOutcome"), search = document.getElementById("pSearch");

      function draw() {
        const d = dSel.value, cl = cSel.value, oc = oSel.value, q = search.value.trim().toLowerCase();
        const rows = cases.filter((cs) =>
          (!d || cs.disease === d) && (!cl || cs.classification === cl) && (!oc || cs.outcome === oc) &&
          (!q || cs.id.toLowerCase().indexOf(q) !== -1)
        ).slice(0, 200);
        count.textContent = rows.length + " shown of " + cases.length;
        empty.style.display = rows.length ? "none" : "block";
        body.innerHTML = rows.map((cs) =>
          "<tr>" +
            '<td class="mono">' + esc(cs.id) + "</td>" +
            "<td>" + esc(diseaseName(DATA, cs.disease)) + "</td>" +
            "<td>" + esc(facilityName(DATA, cs.facilityId)) + "</td>" +
            "<td>" + badge(cs.classification) + "</td>" +
            "<td>" + badge(cs.outcome) + "</td>" +
            '<td class="mono">' + fmtDate(cs.reportDate) + "</td>" +
            "<td>" + badge(cs.status) + "</td>" +
          "</tr>"
        ).join("");
      }
      dSel.addEventListener("change", draw); cSel.addEventListener("change", draw); oSel.addEventListener("change", draw); search.addEventListener("input", draw);
      draw();

      document.getElementById("addCaseBtn").addEventListener("click", function () {
        c.openModal(
          '<h3>New case entry</h3>' +
          '<p style="font-size:13px;color:var(--text-3);">Prototype only — this submits a draft that isn\'t sent anywhere.</p>' +
          '<div class="field-group"><label>Disease</label><select id="mcDisease">' + DATA.DISEASES.map((d) => '<option value="' + d.code + '">' + esc(d.name) + "</option>").join("") + "</select></div>" +
          '<div class="field-group"><label>Classification</label><select id="mcClass"><option>Suspected</option><option>Probable</option><option>Confirmed</option></select></div>' +
          '<div class="modal-foot"><button class="btn btn-ghost" id="mcCancel">Cancel</button><button class="btn btn-primary" id="mcSave">Save as draft</button></div>',
          function (root) {
            root.querySelector("#mcCancel").addEventListener("click", c.closeModal);
            root.querySelector("#mcSave").addEventListener("click", function () {
              c.auditLog("case.create.draft", "new case entry", "Success");
              c.closeModal();
              c.toast("Case saved as a draft, pending approval — matches the Enter → Validate → Approve workflow.", "ok");
            });
          }
        );
      });
    },
  };

  // ===================================================================
  // SURVEILLANCE
  // ===================================================================
  VIEWS.surveillance = {
    render: function (c) {
      const DATA = c.DATA, role = c.role;
      const cases = scopedCases(DATA, role).filter((cs) => cs.classification === "Confirmed");
      const byDisease = {};
      cases.forEach((cs) => { byDisease[cs.disease] = (byDisease[cs.disease] || 0) + 1; });
      const bars = DATA.DISEASES.map((d) => ({ label: d.name, value: byDisease[d.code] || 0, display: String(byDisease[d.code] || 0), color: d.color }))
        .sort((a, b) => b.value - a.value);
      const maxV = Math.max.apply(null, bars.map((b) => b.value).concat([1]));

      const days = 21;
      const today = new Date(2026, 9, 24);
      const labels = [], series = {};
      DATA.DISEASES.slice(0, 3).forEach((d) => { series[d.code] = []; });
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        labels.push(d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }));
        DATA.DISEASES.slice(0, 3).forEach((dis) => series[dis.code].push(cases.filter((cs) => cs.reportDate === iso && cs.disease === dis.code).length));
      }

      return pageHead("Disease surveillance", "Case definitions and trend analysis, " + role.scope) +
        '<div class="grid-2">' +
          '<div class="glass panel">' +
            '<div class="panel-head"><h3>Confirmed cases by disease</h3><span class="meta">Cumulative, in scope</span></div>' +
            c.CHARTS.hbar(bars, { max: maxV }) +
          "</div>" +
          '<div class="glass panel">' +
            '<div class="panel-head"><h3>21-day trend, top 3 diseases</h3></div>' +
            c.CHARTS.line(DATA.DISEASES.slice(0, 3).map((d) => ({ color: d.color, values: series[d.code] })), labels) +
            '<div class="map-legend">' + DATA.DISEASES.slice(0, 3).map((d) => '<span><i style="background:var(--' + d.color + (d.color === "amber" || d.color === "rose" ? "-500" : "-600") + ')"></i>' + esc(d.name) + "</span>").join("") + "</div>" +
          "</div>" +
        "</div>" +
        '<div class="glass panel">' +
          '<div class="panel-head"><h3>Case classification guide</h3><span class="meta">Configured by public health administrators</span></div>' +
          '<div class="grid-3">' +
            classCard("Suspected", "Meets the clinical criteria for a disease but has no laboratory confirmation yet.", "indigo") +
            classCard("Probable", "Meets clinical and epidemiological criteria with a supporting but non-confirmatory test.", "amber") +
            classCard("Confirmed", "Laboratory-confirmed according to the active case definition for this disease.", "teal") +
          "</div>" +
        "</div>";
    },
  };
  function classCard(title, body, color) {
    return '<div class="glass-soft panel" style="border-top:3px solid var(--' + color + (color === "amber" ? "-500" : color === "teal" ? "-600" : "-500") + ');">' +
      '<h4 style="font-size:14px;margin-bottom:6px;">' + title + '</h4><p style="font-size:13px;color:var(--text-2);line-height:1.5;">' + body + "</p></div>";
  }

  // ===================================================================
  // INVENTORY
  // ===================================================================
  VIEWS.inventory = {
    render: function (c) {
      const DATA = c.DATA, role = c.role;
      const facilityNames = scopedFacilities(DATA, role).map((f) => f.name);
      const meds = DATA.MEDICINES.filter((m) => facilityNames.indexOf(m.facility) !== -1);
      const low = meds.filter((m) => m.stock < m.threshold).length;
      const nearExpiry = meds.filter((m) => daysUntil(m.expiry) <= 14).length;
      const canApprove = ["super-admin", "national", "provincial", "district", "facility", "inventory"].indexOf(role.key) !== -1;

      return pageHead("Medicines and inventory", meds.length + " catalog items tracked in " + role.scope,
          canApprove ? '<button class="btn btn-primary btn-sm" id="transferBtn">' + c.ICONS.icon("plus") + ' Record transfer</button>' : "") +
        '<div class="kpi-strip">' +
          kpi("kpi-sm", "", "Catalog items in scope", meds.length, "", "") +
          kpi("kpi-sm danger", "", "Below minimum threshold", low, "needs restock", "") +
          kpi("kpi-sm warn", "", "Near-expiry (14 days)", nearExpiry, "", "") +
          kpi("kpi-sm info", "", "Facilities tracked", facilityNames.length, "", "") +
        "</div>" +
        '<div class="glass panel">' +
          '<div class="filter-bar" style="margin-bottom:14px;">' +
            '<select id="mStatus"><option value="">All stock levels</option><option value="low">Below threshold</option><option value="ok">Adequate</option></select>' +
            '<input id="mSearch" type="text" placeholder="Search medicine or facility…" style="min-width:220px;" />' +
            '<span class="spacer"></span><span class="filter-count" id="mCount"></span>' +
          "</div>" +
          '<div class="table-wrap"><table class="data"><thead><tr>' +
            "<th>Medicine</th><th>Facility</th><th>Stock</th><th>Threshold</th><th>Expiry</th><th>Status</th>" +
          "</tr></thead><tbody id=\"mTableBody\"></tbody></table></div>" +
        "</div>";
    },
    after: function (c) {
      const DATA = c.DATA, role = c.role;
      const facilityNames = scopedFacilities(DATA, role).map((f) => f.name);
      const meds = DATA.MEDICINES.filter((m) => facilityNames.indexOf(m.facility) !== -1);
      const body = document.getElementById("mTableBody");
      const count = document.getElementById("mCount");
      const statusSel = document.getElementById("mStatus");
      const search = document.getElementById("mSearch");

      function rowStatus(m) {
        if (m.stock < m.threshold) return { label: "Low stock", cls: "badge-danger" };
        const dLeft = daysUntil(m.expiry);
        if (dLeft <= 14) return { label: dLeft + "d to expiry", cls: "badge-warn" };
        return { label: "Adequate", cls: "badge-ok" };
      }
      function draw() {
        const s = statusSel.value, q = search.value.trim().toLowerCase();
        const rows = meds.filter((m) => {
          const low = m.stock < m.threshold;
          if (s === "low" && !low) return false;
          if (s === "ok" && low) return false;
          if (q && m.name.toLowerCase().indexOf(q) === -1 && m.facility.toLowerCase().indexOf(q) === -1) return false;
          return true;
        });
        count.textContent = rows.length + " of " + meds.length;
        body.innerHTML = rows.map((m) => {
          const st = rowStatus(m);
          return "<tr>" +
            "<td>" + esc(m.name) + "</td>" +
            "<td>" + esc(m.facility) + "</td>" +
            '<td class="num">' + m.stock + " " + esc(m.unit) + "</td>" +
            '<td class="num">' + m.threshold + "</td>" +
            '<td class="mono">' + fmtDate(m.expiry) + "</td>" +
            '<td><span class="badge ' + st.cls + '"><span class="badge-dot" style="background:currentColor"></span>' + st.label + "</span></td>" +
          "</tr>";
        }).join("");
      }
      statusSel.addEventListener("change", draw); search.addEventListener("input", draw);
      draw();

      const tb = document.getElementById("transferBtn");
      if (tb) tb.addEventListener("click", function () {
        c.openModal(
          '<h3>Record stock transfer</h3>' +
          '<p style="font-size:13px;color:var(--text-3);">Prototype only. In the full system, the requester and approver must be different users.</p>' +
          '<div class="field-group"><label>Medicine</label><select id="mtMed">' + meds.map((m) => '<option>' + esc(m.name) + " — " + esc(m.facility) + "</option>").join("") + "</select></div>" +
          '<div class="field-row"><div class="field-group"><label>Quantity</label><input id="mtQty" type="number" placeholder="50" /></div><div class="field-group"><label>Destination facility</label><input id="mtDest" type="text" placeholder="RHC Zafarwal" /></div></div>' +
          '<div class="modal-foot"><button class="btn btn-ghost" id="mtCancel">Cancel</button><button class="btn btn-primary" id="mtSave">Submit for approval</button></div>',
          function (root) {
            root.querySelector("#mtCancel").addEventListener("click", c.closeModal);
            root.querySelector("#mtSave").addEventListener("click", function () {
              c.auditLog("inventory.transfer.request", root.querySelector("#mtMed").value, "Success");
              c.closeModal();
              c.toast("Transfer submitted. It needs approval from a different user before stock moves.", "ok");
            });
          }
        );
      });
    },
  };
  function daysUntil(iso) {
    const diff = (new Date(iso + "T00:00:00") - new Date(2026, 9, 24)) / 86400000;
    return Math.round(diff);
  }

  // ===================================================================
  // EQUIPMENT
  // ===================================================================
  VIEWS.equipment = {
    render: function (c) {
      const DATA = c.DATA, role = c.role;
      const facilityNames = scopedFacilities(DATA, role).map((f) => f.name);
      const rows = DATA.EQUIPMENT.filter((e) => facilityNames.indexOf(e.facility) !== -1);
      const totalVent = rows.reduce((a, r) => a + r.ventilators, 0);
      const upVent = rows.reduce((a, r) => a + r.ventilatorsUp, 0);
      const totalAmb = rows.reduce((a, r) => a + r.ambulances, 0);
      const upAmb = rows.reduce((a, r) => a + r.ambulancesUp, 0);

      return pageHead("Equipment and resources", "Beds, ventilators, and ambulances across " + role.scope) +
        '<div class="kpi-strip">' +
          kpi("kpi-sm", "", "Ventilators operational", upVent + " / " + totalVent, totalVent ? Math.round((upVent / totalVent) * 100) + "% uptime" : "", "") +
          kpi("kpi-sm info", "", "Ambulances operational", upAmb + " / " + totalAmb, totalAmb ? Math.round((upAmb / totalAmb) * 100) + "% uptime" : "", "") +
          kpi("kpi-sm warn", "", "Facilities reporting resources", rows.length, "", "") +
          kpi("kpi-sm", "", "Avg. ventilator uptime", rows.length ? Math.round((upVent / Math.max(totalVent, 1)) * 100) + "%" : "—", "", "") +
        "</div>" +
        '<div class="glass panel">' +
          '<div class="table-wrap"><table class="data"><thead><tr>' +
            "<th>Facility</th><th>Ventilators</th><th>Ambulances</th><th>Ventilator uptime</th>" +
          "</tr></thead><tbody>" +
          (rows.length ? rows.map((r) =>
            "<tr><td>" + esc(r.facility) + '</td><td class="num">' + r.ventilatorsUp + " / " + r.ventilators +
            '</td><td class="num">' + r.ambulancesUp + " / " + r.ambulances + "</td><td>" +
            uptimeBar(r.ventilatorsUp, r.ventilators) + "</td></tr>"
          ).join("") : '<tr><td colspan="4"><div class="empty-state">No equipment snapshots recorded for this scope yet.</div></td></tr>') +
          "</tbody></table></div>" +
        "</div>";
    },
  };
  function uptimeBar(up, total) {
    const pct = total ? Math.round((up / total) * 100) : 0;
    const color = pct >= 80 ? "var(--teal-600)" : pct >= 50 ? "var(--amber-500)" : "var(--rose-500)";
    return '<div style="display:flex;align-items:center;gap:8px;"><div style="width:90px;height:7px;border-radius:999px;background:var(--line);overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:' + color + ';"></div></div><span class="mono" style="font-size:12px;color:var(--text-3);">' + pct + "%</span></div>";
  }

  // ===================================================================
  // IMPORTS
  // ===================================================================
  VIEWS.imports = {
    render: function (c) {
      return pageHead("Data imports and integrations", "CSV, Excel, and API submissions with import preview and row-level validation",
          '<button class="btn btn-primary btn-sm" id="newImportBtn">' + c.ICONS.icon("upload") + ' Upload file</button>') +
        '<div class="glass panel">' +
          '<div class="table-wrap"><table class="data"><thead><tr>' +
            "<th>Batch</th><th>Source</th><th>Submitted by</th><th>Facility</th><th>Rows</th><th>Errors</th><th>Status</th>" +
          "</tr></thead><tbody id=\"impTableBody\"></tbody></table></div>" +
        "</div>";
    },
    after: function (c) {
      const body = document.getElementById("impTableBody");
      function draw() {
        body.innerHTML = c.state.imports.map((i) =>
          "<tr>" +
            '<td class="mono">' + esc(i.id) + "</td>" +
            "<td>" + esc(i.source) + "</td>" +
            "<td>" + esc(i.uploader) + "</td>" +
            "<td>" + esc(i.facility) + "</td>" +
            '<td class="num">' + i.rows + "</td>" +
            '<td class="num">' + (i.errors ? '<span style="color:var(--rose-500)">' + i.errors + "</span>" : "0") + "</td>" +
            "<td>" + badge(i.status) + "</td>" +
          "</tr>"
        ).join("");
      }
      draw();

      document.getElementById("newImportBtn").addEventListener("click", function () {
        c.openModal(
          '<h3>Upload data file</h3>' +
          '<p style="font-size:13px;color:var(--text-3);">Prototype only — no file is actually parsed. Uploaded files are never executed; only data rows are read, with content validated before anything commits.</p>' +
          '<div class="field-group"><label>File</label><input type="file" id="impFile" /></div>' +
          '<div class="field-group"><label>Target facility</label><select id="impFacility">' + c.DATA.FACILITIES.map((f) => '<option>' + esc(f.name) + "</option>").join("") + "</select></div>" +
          '<div class="modal-foot"><button class="btn btn-ghost" id="impCancel">Cancel</button><button class="btn btn-primary" id="impSave">Preview import</button></div>',
          function (root) {
            root.querySelector("#impCancel").addEventListener("click", c.closeModal);
            root.querySelector("#impSave").addEventListener("click", function () {
              const facility = root.querySelector("#impFacility").value;
              const rows = 15 + Math.floor(Math.random() * 60);
              const errors = Math.random() > 0.6 ? 1 + Math.floor(Math.random() * 4) : 0;
              const batch = {
                id: "IMP-" + (1043 + c.state.imports.length), source: "CSV upload", uploader: c.currentUser.name,
                facility: facility, rows: rows, errors: errors, status: errors ? "Needs review" : "Committed",
                submitted: "2026-10-24 " + String(10 + c.state.imports.length).padStart(2, "0") + ":00",
              };
              c.state.imports.unshift(batch);
              c.auditLog("import.submit", batch.id, "Success");
              c.closeModal();
              c.toast(batch.rows + " rows previewed for " + facility + (errors ? " — " + errors + " rows flagged for review." : " — no errors found."), errors ? "warn" : "ok");
              c.rerender();
            });
          }
        );
      });
    },
  };

  // ===================================================================
  // ALERTS
  // ===================================================================
  VIEWS.alerts = {
    render: function (c) {
      return pageHead("Alerts and outbreak signals", "Automated signals are decision support — a qualified reviewer must confirm before any outbreak is declared.") +
        '<div class="filter-bar glass panel" style="padding:14px 18px;">' +
          '<select id="alSeverity"><option value="">All severities</option><option>High</option><option>Medium</option><option>Low</option></select>' +
          '<select id="alStatus"><option value="">All statuses</option><option>Open</option><option>Acknowledged</option><option>Under review</option><option>Resolved</option></select>' +
          '<span class="spacer"></span><span class="filter-count" id="alCount"></span>' +
        "</div>" +
        '<div id="alList" style="display:flex;flex-direction:column;gap:12px;"></div>';
    },
    after: function (c) {
      const list = document.getElementById("alList");
      const count = document.getElementById("alCount");
      const sevSel = document.getElementById("alSeverity");
      const stSel = document.getElementById("alStatus");
      const canReview = ["super-admin", "national", "provincial", "district", "epi"].indexOf(c.role.key) !== -1;

      function draw() {
        const sv = sevSel.value, st = stSel.value;
        const rows = c.state.alerts.filter((a) => (!sv || a.severity === sv) && (!st || a.status === st));
        count.textContent = rows.length + " of " + c.state.alerts.length;
        list.innerHTML = rows.length ? rows.map((a) =>
          '<div class="glass alert-card" data-id="' + a.id + '">' +
            '<div class="alert-sev ' + a.severity + '"></div>' +
            '<div class="alert-body">' +
              '<div class="top"><h4>' + esc(a.type) + (a.disease ? " — " + esc(a.disease) : "") + '</h4>' + badge(a.status) + "</div>" +
              '<div class="evidence">' + esc(a.evidence) + "</div>" +
              '<div class="meta-row"><span>Scope: ' + esc(a.scope) + '</span><span>Created ' + fmtDate(a.created) + '</span>' +
                (a.reviewer ? "<span>Reviewer: " + esc(a.reviewer) + "</span>" : "") + "</div>" +
              (canReview && (a.status === "Open" || a.status === "Acknowledged" || a.status === "Under review")
                ? '<div class="alert-actions">' +
                    (a.status === "Open" ? '<button class="btn btn-ghost btn-sm" data-act="ack">Acknowledge</button>' : "") +
                    (a.status !== "Resolved" ? '<button class="btn btn-ghost btn-sm" data-act="review">Mark under review</button><button class="btn btn-primary btn-sm" data-act="resolve">Resolve</button>' : "") +
                  "</div>"
                : "") +
            "</div>" +
          "</div>"
        ).join("") : '<div class="empty-state glass">No alerts match these filters.</div>';
      }
      sevSel.addEventListener("change", draw); stSel.addEventListener("change", draw);
      draw();

      list.addEventListener("click", function (e) {
        const btn = e.target.closest("button[data-act]");
        if (!btn) return;
        const card = e.target.closest(".alert-card");
        const id = card.dataset.id;
        const alert = c.state.alerts.find((a) => a.id === id);
        if (!alert) return;
        const act = btn.dataset.act;
        if (act === "ack") { alert.status = "Acknowledged"; alert.reviewer = c.currentUser.name; c.auditLog("alert.acknowledge", id, "Success"); c.toast("Alert " + id + " acknowledged.", "ok"); }
        if (act === "review") { alert.status = "Under review"; alert.reviewer = c.currentUser.name; c.auditLog("alert.review.open", id, "Success"); c.toast("Alert " + id + " moved to under review.", "ok"); }
        if (act === "resolve") { alert.status = "Resolved"; alert.reviewer = c.currentUser.name; c.auditLog("alert.resolve", id, "Success"); c.toast("Alert " + id + " resolved and logged.", "ok"); }
        draw();
      });
    },
  };

  // ===================================================================
  // REPORTS
  // ===================================================================
  VIEWS.reports = {
    render: function (c) {
      const DATA = c.DATA;
      return pageHead("Reports and analytics", "Generate and export scope-checked reports. Every export is logged with who, when, and what scope.") +
        '<div class="grid-3">' +
          reportTemplate("National health summary", "Pakistan-wide indicators and trends") +
          reportTemplate("Facility performance report", "Reporting completeness and operational status") +
          reportTemplate("Medicine stock availability", "Low-stock and near-expiry positions by facility") +
          reportTemplate("Disease surveillance report", "Case counts, classifications, and outcomes") +
          reportTemplate("Outbreak alert summary", "Open, acknowledged, and resolved alerts") +
          reportTemplate("Data submission compliance", "On-time vs. late or missing facility reports") +
        "</div>" +
        '<div class="glass panel">' +
          '<div class="panel-head"><h3>Previously generated reports</h3><span class="meta">' + DATA.REPORTS.length + ' total</span></div>' +
          '<div class="table-wrap"><table class="data"><thead><tr><th>Report</th><th>Scope</th><th>Generated by</th><th>Date</th><th></th></tr></thead><tbody>' +
            DATA.REPORTS.map((r) => "<tr><td>" + esc(r.name) + "</td><td>" + esc(r.scope) + "</td><td>" + esc(r.by) + '</td><td class="mono">' + fmtDate(r.generated) +
              '</td><td><button class="btn btn-ghost btn-sm export-btn" data-name="' + esc(r.name) + '">' + c.ICONS.icon("download") + " Export</button></td></tr>").join("") +
          "</tbody></table></div>" +
        "</div>";
    },
    after: function (c) {
      Array.prototype.forEach.call(document.querySelectorAll(".export-btn"), function (btn) {
        btn.addEventListener("click", function () {
          c.auditLog("report.export", btn.dataset.name, "Success");
          c.toast('"' + btn.dataset.name + '" exported as CSV — recorded in the audit log with your scope.', "ok");
        });
      });
      Array.prototype.forEach.call(document.querySelectorAll(".report-tpl-btn"), function (btn) {
        btn.addEventListener("click", function () {
          c.auditLog("report.generate", btn.dataset.name, "Success");
          c.toast('"' + btn.dataset.name + '" generated for ' + c.role.scope + ".", "ok");
        });
      });
    },
  };
  function reportTemplate(name, desc) {
    return '<div class="glass panel" style="display:flex;flex-direction:column;gap:10px;">' +
      '<h4 style="font-size:14.5px;">' + esc(name) + '</h4>' +
      '<p style="font-size:13px;color:var(--text-2);line-height:1.5;flex:1;">' + esc(desc) + '</p>' +
      '<button class="btn btn-ghost btn-sm report-tpl-btn" data-name="' + esc(name) + '" style="align-self:flex-start;">Generate</button>' +
    "</div>";
  }

  // ===================================================================
  // USERS
  // ===================================================================
  VIEWS.users = {
    render: function (c) {
      const DATA = c.DATA;
      return pageHead("User and access management", DATA.ROLES.length + " configurable roles · deny-by-default authorization",
          '<button class="btn btn-primary btn-sm" id="inviteBtn">' + c.ICONS.icon("plus") + ' Invite user</button>') +
        '<div class="glass panel">' +
          '<div class="filter-bar" style="margin-bottom:14px;">' +
            '<select id="uStatus"><option value="">All statuses</option><option>Active</option><option>Invited</option><option>Suspended</option></select>' +
            '<input id="uSearch" type="text" placeholder="Search name, email, or role…" style="min-width:240px;" />' +
            '<span class="spacer"></span><span class="filter-count" id="uCount"></span>' +
          "</div>" +
          '<div class="table-wrap"><table class="data"><thead><tr><th>User</th><th>Role</th><th>MFA</th><th>Status</th><th></th></tr></thead><tbody id="uBody"></tbody></table></div>' +
        "</div>";
    },
    after: function (c) {
      const body = document.getElementById("uBody");
      const count = document.getElementById("uCount");
      const statusSel = document.getElementById("uStatus");
      const search = document.getElementById("uSearch");
      const canManage = ["super-admin", "national", "provincial", "district", "facility"].indexOf(c.role.key) !== -1;

      function draw() {
        const s = statusSel.value, q = search.value.trim().toLowerCase();
        const rows = c.state.users.filter((u) =>
          (!s || u.status === s) &&
          (!q || u.name.toLowerCase().indexOf(q) !== -1 || u.email.toLowerCase().indexOf(q) !== -1 || u.role.toLowerCase().indexOf(q) !== -1)
        );
        count.textContent = rows.length + " of " + c.state.users.length;
        body.innerHTML = rows.map((u, idx) =>
          "<tr>" +
            '<td><div style="display:flex;align-items:center;gap:10px;"><span class="avatar" style="width:26px;height:26px;font-size:10.5px;">' + initials(u.name) + '</span><div><div>' + esc(u.name) + '</div><div style="font-size:11.5px;color:var(--text-3);">' + esc(u.email) + "</div></div></div></td>" +
            "<td>" + esc(u.role) + "</td>" +
            "<td>" + (u.mfa ? '<span class="badge badge-ok">' + c.ICONS.icon("lock") + " Enabled</span>" : '<span class="badge badge-neutral">Not set</span>') + "</td>" +
            "<td>" + badge(u.status) + "</td>" +
            "<td>" + (canManage ? '<button class="btn btn-ghost btn-sm user-act" data-email="' + esc(u.email) + '" data-act="' +
              (u.status === "Suspended" ? "reactivate" : "suspend") + '">' + (u.status === "Suspended" ? "Reactivate" : "Suspend") + "</button>" : "") + "</td>" +
          "</tr>"
        ).join("");
      }
      statusSel.addEventListener("change", draw); search.addEventListener("input", draw);
      draw();

      body.addEventListener("click", function (e) {
        const btn = e.target.closest(".user-act");
        if (!btn) return;
        const u = c.state.users.find((x) => x.email === btn.dataset.email);
        if (!u) return;
        if (btn.dataset.act === "suspend") { u.status = "Suspended"; c.auditLog("user.suspend", u.email, "Success"); c.toast(u.name + " was suspended.", "warn"); }
        else { u.status = "Active"; c.auditLog("user.reactivate", u.email, "Success"); c.toast(u.name + " was reactivated.", "ok"); }
        draw();
      });

      const invite = document.getElementById("inviteBtn");
      if (invite) invite.addEventListener("click", function () {
        c.openModal(
          '<h3>Invite user</h3>' +
          '<p style="font-size:13px;color:var(--text-3);">New users receive only the permissions and jurisdiction you assign — never broad defaults.</p>' +
          '<div class="field-group"><label>Full name</label><input id="ivName" type="text" placeholder="Dr. Imran Qureshi" /></div>' +
          '<div class="field-group"><label>Work email</label><input id="ivEmail" type="email" placeholder="name@health.gov.pk" /></div>' +
          '<div class="field-group"><label>Role</label><select id="ivRole">' + c.DATA.ROLES.map((r) => '<option>' + esc(r.label) + "</option>").join("") + "</select></div>" +
          '<div class="modal-foot"><button class="btn btn-ghost" id="ivCancel">Cancel</button><button class="btn btn-primary" id="ivSave">Send invitation</button></div>',
          function (root) {
            root.querySelector("#ivCancel").addEventListener("click", c.closeModal);
            root.querySelector("#ivSave").addEventListener("click", function () {
              const name = root.querySelector("#ivName").value.trim();
              const email = root.querySelector("#ivEmail").value.trim();
              const roleLabel = root.querySelector("#ivRole").value;
              if (!name || !email) { c.toast("Name and email are required.", "danger"); return; }
              c.state.users.unshift({ name: name, email: email, role: roleLabel, status: "Invited", mfa: false });
              c.auditLog("user.invite", email, "Success");
              c.closeModal();
              c.toast("Invitation sent to " + email + ". No password is set until they accept.", "ok");
              c.rerender();
            });
          }
        );
      });
    },
  };

  // ===================================================================
  // AUDIT
  // ===================================================================
  VIEWS.audit = {
    render: function (c) {
      return pageHead("Audit logs", "Every security-relevant action: who, what, when, and the outcome. Entries are append-only.") +
        '<div class="filter-bar glass panel" style="padding:14px 18px;">' +
          '<select id="auOutcome"><option value="">All outcomes</option><option>Success</option><option>Denied</option></select>' +
          '<input id="auSearch" type="text" placeholder="Search actor, action, or target…" style="min-width:240px;" />' +
          '<span class="spacer"></span><span class="filter-count" id="auCount"></span>' +
        "</div>" +
        '<div class="glass panel"><div class="table-wrap"><table class="data"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Outcome</th></tr></thead><tbody id="auBody"></tbody></table></div></div>';
    },
    after: function (c) {
      const body = document.getElementById("auBody");
      const count = document.getElementById("auCount");
      const outSel = document.getElementById("auOutcome");
      const search = document.getElementById("auSearch");
      function draw() {
        const o = outSel.value, q = search.value.trim().toLowerCase();
        const rows = c.state.audit.filter((a) =>
          (!o || a.outcome === o) &&
          (!q || a.actor.toLowerCase().indexOf(q) !== -1 || a.action.toLowerCase().indexOf(q) !== -1 || String(a.target).toLowerCase().indexOf(q) !== -1)
        );
        count.textContent = rows.length + " of " + c.state.audit.length;
        body.innerHTML = rows.map((a) =>
          "<tr>" +
            '<td class="mono">' + esc(a.time) + "</td>" +
            '<td class="mono">' + esc(a.actor) + "</td>" +
            "<td>" + esc(a.action) + "</td>" +
            "<td>" + esc(a.target) + "</td>" +
            "<td>" + badge(a.outcome) + "</td>" +
          "</tr>"
        ).join("");
      }
      outSel.addEventListener("change", draw); search.addEventListener("input", draw);
      draw();
    },
  };

  // ===================================================================
  // SETTINGS
  // ===================================================================
  VIEWS.settings = {
    render: function (c) {
      const role = c.role;
      return pageHead("System settings", "Account, security, and appearance") +
        '<div class="grid-2">' +
          '<div class="glass panel">' +
            '<div class="panel-head"><h3>Account</h3></div>' +
            settingsRow("Name", c.currentUser.name) +
            settingsRow("Email", c.currentUser.email || role.email) +
            settingsRow("Role", role.label) +
            settingsRow("Jurisdiction", role.scope) +
            settingsRow("Multi-factor authentication", role.mfa ? "Required for this role" : "Not required for this role") +
          "</div>" +
          '<div class="glass panel">' +
            '<div class="panel-head"><h3>Appearance</h3></div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;">' +
              '<div><div style="font-size:13.5px;font-weight:500;">Dark mode</div><div style="font-size:12px;color:var(--text-3);">Switches the whole interface, including the glass surfaces.</div></div>' +
              '<button class="theme-switch" id="settingsThemeSwitch"><span class="track"><span class="thumb"></span></span></button>' +
            "</div>" +
          "</div>" +
        "</div>" +
        '<div class="glass panel">' +
          '<div class="panel-head"><h3>What this prototype does and doesn\'t do</h3></div>' +
          '<ul style="margin:0;padding-left:18px;font-size:13.5px;line-height:1.9;color:var(--text-2);">' +
            "<li>All data is synthetic and generated for this demo — no real patients, facilities, or figures.</li>" +
            "<li>Sign-in uses one shared demo password; nothing is sent to a server.</li>" +
            "<li>Actions like approving alerts, inviting users, or logging imports change this browser tab only and reset on reload.</li>" +
            "<li>The role you choose at sign-in changes what you can see and do, dramatizing the role-permission matrix from Phase 1.</li>" +
          "</ul>" +
        "</div>";
    },
    after: function (c) {
      document.getElementById("settingsThemeSwitch").addEventListener("click", function () { window.PHIMS_THEME.toggle(); });
    },
  };
  function settingsRow(label, value) {
    return '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line);font-size:13.5px;"><span style="color:var(--text-3);">' + esc(label) + "</span><span>" + esc(value) + "</span></div>";
  }

  window.PHIMS_VIEWS_INTERNAL = { esc, fmtDate, badge, statusBadgeClass, initials, demoNote, pageHead, scopedFacilities, scopedCases, facilityName, diseaseName, diseaseColor };
  return VIEWS;
})();
