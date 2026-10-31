(function () {
  "use strict";
  const DATA = window.PHIMS_DATA, AUTH = window.PHIMS_AUTH, ICONS = window.PHIMS_ICONS, THEME = window.PHIMS_THEME, CHARTS = window.PHIMS_CHARTS, VIEWS = window.PHIMS_VIEWS;

  const role = AUTH.requireSession();
  if (!role) return;

  // Mutable, in-memory copies so demo actions (acknowledge, invite, approve) can
  // change state and re-render without touching the read-only source data.
  const state = {
    alerts: JSON.parse(JSON.stringify(DATA.ALERTS)),
    imports: JSON.parse(JSON.stringify(DATA.IMPORTS)),
    users: JSON.parse(JSON.stringify(DATA.USERS)),
    audit: JSON.parse(JSON.stringify(DATA.AUDIT)),
    pendingFacilityQuery: "",
    pendingCaseQuery: "",
  };

  const currentUser = DATA.USERS.find((u) => u.email === role.email) || { name: role.label, email: role.email };

  // ---------------------------------------------------------------- toast --
  const toastStack = document.getElementById("toastStack");
  function toast(message, kind) {
    const el = document.createElement("div");
    el.className = "toast glass-soft";
    el.style.borderLeft = "3px solid " + (kind === "danger" ? "var(--rose-500)" : kind === "warn" ? "var(--amber-500)" : "var(--teal-600)");
    el.textContent = message;
    toastStack.appendChild(el);
    setTimeout(function () { el.style.transition = "opacity .25s ease"; el.style.opacity = "0"; setTimeout(function () { el.remove(); }, 260); }, 3200);
  }

  // ---------------------------------------------------------------- modal --
  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalBody = document.getElementById("modalBody");
  function openModal(html, afterMount) {
    modalBody.innerHTML = html;
    modalBackdrop.classList.add("show");
    if (afterMount) afterMount(modalBody);
  }
  function closeModal() { modalBackdrop.classList.remove("show"); modalBody.innerHTML = ""; }
  modalBackdrop.addEventListener("click", function (e) { if (e.target === modalBackdrop) closeModal(); });

  function auditLog(action, target, outcome) {
    state.audit.unshift({
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      actor: role.email, action: action, target: target, outcome: outcome || "Success",
    });
  }

  function ctx() {
    return { role, state, DATA, CHARTS, ICONS, toast, openModal, closeModal, auditLog, rerender, currentUser, navigate };
  }

  // ----------------------------------------------------------- nav rail ----
  const navLinks = document.getElementById("navLinks");
  function buildNav() {
    navLinks.innerHTML = "";
    DATA.NAV_ITEMS.filter((n) => role.nav.indexOf(n.key) !== -1).forEach((n) => {
      const a = document.createElement("a");
      a.className = "nav-link";
      a.dataset.key = n.key;
      a.innerHTML = ICONS.icon(n.icon) + '<span class="nav-label">' + n.label + "</span>";
      a.addEventListener("click", function () { navigate(n.key); closeMobileNav(); });
      navLinks.appendChild(a);
    });
  }
  buildNav();
  document.getElementById("navScope").textContent = role.label + " · " + role.scope;

  // --------------------------------------------------------------- topbar --
  document.getElementById("scopeChip").textContent = role.scope;
  document.getElementById("searchIcon").innerHTML = ICONS.icon("search");
  document.getElementById("logoutIcon").innerHTML = ICONS.icon("logout");
  document.getElementById("themeSwitchIconLeft").innerHTML = ICONS.icon("sun");
  document.getElementById("themeSwitchIconRight").innerHTML = ICONS.icon("moon");
  document.getElementById("mobileMenuIcon").innerHTML = ICONS.icon("menu");
  document.getElementById("collapseIcon").innerHTML = ICONS.icon("chevron-left");
  document.getElementById("userAvatar").textContent = (currentUser.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  document.getElementById("userName").textContent = currentUser.name;
  document.getElementById("userRole").textContent = role.label;

  document.getElementById("logoutBtn").addEventListener("click", function () {
    auditLog("logout", role.email, "Success");
    AUTH.signOut();
    window.location.href = "index.html";
  });

  document.getElementById("themeSwitch").addEventListener("click", function () { THEME.toggle(); });

  const appShell = document.getElementById("appShell");
  const collapseBtn = document.getElementById("collapseBtn");
  const collapseLabel = document.getElementById("collapseLabel");
  function applyCollapsed(collapsed) {
    appShell.classList.toggle("collapsed", collapsed);
    collapseLabel.textContent = collapsed ? "Expand" : "Collapse";
    document.getElementById("collapseIcon").innerHTML = ICONS.icon(collapsed ? "chevron" : "chevron-left");
  }
  let collapsed = localStorage.getItem("phims.navCollapsed") === "1";
  applyCollapsed(collapsed);
  collapseBtn.addEventListener("click", function () {
    collapsed = !collapsed;
    localStorage.setItem("phims.navCollapsed", collapsed ? "1" : "0");
    applyCollapsed(collapsed);
  });

  const navRail = document.getElementById("navRail");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  function closeMobileNav() { navRail.classList.remove("open"); }
  mobileMenuBtn.addEventListener("click", function () { navRail.classList.toggle("open"); });
  function syncMobileButton() { mobileMenuBtn.style.display = window.innerWidth <= 860 ? "grid" : "none"; }
  syncMobileButton();
  window.addEventListener("resize", syncMobileButton);

  // Quick top-bar search: jumps to Facilities or Patients with a filter applied.
  document.getElementById("globalSearch").addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    const q = e.target.value.trim();
    if (!q) return;
    const ql = q.toLowerCase();
    const facilityHit = DATA.FACILITIES.some((f) => f.name.toLowerCase().includes(ql) || f.code.toLowerCase().includes(ql) || f.district.toLowerCase().includes(ql));
    const caseHit = DATA.CASES.some((c) => c.id.toLowerCase().includes(ql)) || DATA.DISEASES.some((d) => d.name.toLowerCase().includes(ql));
    if (facilityHit && role.nav.indexOf("facilities") !== -1) {
      state.pendingFacilityQuery = q; navigate("facilities");
    } else if (caseHit && role.nav.indexOf("patients") !== -1) {
      state.pendingCaseQuery = q; navigate("patients");
    } else {
      toast('No matches for "' + q + '" in facilities or case records.', "warn");
    }
  });

  // ---------------------------------------------------------------- router --
  let currentKey = null;
  function navigate(key) {
    if (role.nav.indexOf(key) === -1) key = role.nav[0];
    window.location.hash = "#/" + key;
  }
  function rerender() { if (currentKey) renderView(currentKey); }
  function renderView(key) {
    currentKey = key;
    Array.prototype.forEach.call(document.querySelectorAll(".nav-link"), function (el) {
      el.classList.toggle("active", el.dataset.key === key);
    });
    const mod = VIEWS[key];
    const root = document.getElementById("viewRoot");
    if (!mod) { root.innerHTML = '<div class="empty-state">This section isn\'t in the prototype yet.</div>'; return; }
    root.innerHTML = mod.render(ctx());
    if (mod.after) mod.after(ctx());
    root.scrollIntoView({ block: "start" });
  }
  function routeFromHash() {
    let key = (window.location.hash || "").replace(/^#\//, "") || role.nav[0];
    if (role.nav.indexOf(key) === -1) key = role.nav[0];
    renderView(key);
  }
  window.addEventListener("hashchange", routeFromHash);
  routeFromHash();

  window.PHIMS_APP = { toast, openModal, closeModal };
})();
