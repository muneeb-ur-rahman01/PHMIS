(function () {
  "use strict";
  const DATA = window.PHIMS_DATA, AUTH = window.PHIMS_AUTH, ICONS = window.PHIMS_ICONS, THEME = window.PHIMS_THEME;

  if (AUTH.session()) { window.location.href = "app.html"; return; }

  function paintThemeIcon() {
    document.getElementById("themeFloatIcon").innerHTML = ICONS.icon(THEME.effective() === "dark" ? "sun" : "moon");
  }
  paintThemeIcon();
  document.getElementById("themeFloat").addEventListener("click", function () { THEME.toggle(); paintThemeIcon(); });

  const roleWanted = document.getElementById("roleWanted");
  DATA.ROLES.forEach(function (r) {
    const opt = document.createElement("option");
    opt.value = r.key;
    opt.textContent = r.label;
    roleWanted.appendChild(opt);
  });

  document.getElementById("successIcon").innerHTML = ICONS.icon("check");

  const form = document.getElementById("requestForm");
  const banner = document.getElementById("successBanner");
  const submitBtn = document.getElementById("submitBtn");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";
    setTimeout(function () {
      banner.classList.add("show");
      form.querySelectorAll("input, select, button").forEach(function (el) { el.disabled = true; });
      submitBtn.textContent = "Request submitted";
    }, 500);
  });
})();
