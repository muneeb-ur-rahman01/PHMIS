/* Demo-only session handling. No network calls, no real credential storage —
   this mirrors the PHIMS role model for presentation purposes only. */
window.PHIMS_AUTH = (function () {
  "use strict";
  const KEY = "phims.session";
  const DATA = window.PHIMS_DATA;

  function findRole(key) {
    return DATA.ROLES.find((r) => r.key === key) || null;
  }
  function findRoleByEmail(email) {
    const e = String(email || "").trim().toLowerCase();
    return DATA.ROLES.find((r) => r.email.toLowerCase() === e) || null;
  }
  function session() {
    try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; }
  }

  // Checks the email/password pair only. Does not start a session — a role
  // that requires MFA isn't signed in until completeSignIn() runs afterward.
  function verifyCredentials(email, password) {
    const role = findRoleByEmail(email);
    if (!role) return { ok: false, error: "We don't recognize that email. Pick a demo role below to fill in working credentials." };
    if (password !== DATA.DEMO_PASSWORD) return { ok: false, error: "That password doesn't match the demo credential: " + DATA.DEMO_PASSWORD };
    return { ok: true, role };
  }
  function completeSignIn(roleKey) {
    sessionStorage.setItem(KEY, JSON.stringify({ roleKey, signedInAt: new Date().toISOString() }));
  }
  function signOut() {
    sessionStorage.removeItem(KEY);
  }
  function requireSession() {
    const s = session();
    if (!s) { window.location.href = "index.html"; return null; }
    const role = findRole(s.roleKey);
    if (!role) { signOut(); window.location.href = "index.html"; return null; }
    return role;
  }
  return { findRole, findRoleByEmail, session, verifyCredentials, completeSignIn, signOut, requireSession };
})();
