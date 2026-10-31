(function () {
  "use strict";
  const DATA = window.PHIMS_DATA, AUTH = window.PHIMS_AUTH, ICONS = window.PHIMS_ICONS, THEME = window.PHIMS_THEME;

  // Already signed in? Skip straight to the app.
  if (AUTH.session()) { window.location.href = "app.html"; return; }

  // ---- Theme toggle ----
  function paintThemeIcon() {
    document.getElementById("themeFloatIcon").innerHTML = ICONS.icon(THEME.effective() === "dark" ? "sun" : "moon");
  }
  paintThemeIcon();
  document.getElementById("themeFloat").addEventListener("click", function () { THEME.toggle(); paintThemeIcon(); });

  // ---- Role select ----
  const roleSelect = document.getElementById("roleSelect");
  DATA.ROLES.forEach(function (r) {
    const opt = document.createElement("option");
    opt.value = r.key;
    opt.textContent = r.label + " — " + r.scope;
    roleSelect.appendChild(opt);
  });

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  roleSelect.addEventListener("change", function () {
    const role = AUTH.findRole(roleSelect.value);
    if (!role) return;
    emailInput.value = role.email;
    passwordInput.value = DATA.DEMO_PASSWORD;
    hideError();
  });

  // ---- Error banner ----
  const bannerError = document.getElementById("bannerError");
  const bannerErrorText = document.getElementById("bannerErrorText");
  document.getElementById("bannerErrorIcon").innerHTML = ICONS.icon("x");
  function showError(msg) { bannerErrorText.textContent = msg; bannerError.classList.add("show"); }
  function hideError() { bannerError.classList.remove("show"); }

  // ---- Credential step ----
  const credStep = document.getElementById("credStep");
  const mfaStep = document.getElementById("mfaStep");
  let pendingRole = null;

  credStep.addEventListener("submit", function (e) {
    e.preventDefault();
    const result = AUTH.verifyCredentials(emailInput.value, passwordInput.value);
    if (!result.ok) { showError(result.error); return; }
    hideError();
    if (result.role.mfa) {
      pendingRole = result.role;
      credStep.style.display = "none";
      mfaStep.style.display = "flex";
      mfaStep.style.flexDirection = "column";
      document.getElementById("mfaCode").focus();
    } else {
      AUTH.completeSignIn(result.role.key);
      window.location.href = "app.html";
    }
  });

  document.getElementById("mfaBack").addEventListener("click", function () {
    mfaStep.style.display = "none";
    credStep.style.display = "block";
    pendingRole = null;
  });

  mfaStep.addEventListener("submit", function (e) {
    e.preventDefault();
    const code = document.getElementById("mfaCode").value.trim();
    if (code !== "123456") { showError("That code doesn't match. Use the demo code 123456."); return; }
    if (!pendingRole) return;
    AUTH.completeSignIn(pendingRole.key);
    window.location.href = "app.html";
  });
})();
