/* Theme (light/dark) — persisted, applied before paint where possible. */
window.PHIMS_THEME = (function () {
  "use strict";
  const KEY = "phims.theme";

  function get() {
    return localStorage.getItem(KEY) || "auto";
  }
  function apply(mode) {
    const root = document.documentElement;
    if (mode === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
  }
  function effective() {
    const stored = get();
    if (stored !== "auto") return stored;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function set(mode) {
    localStorage.setItem(KEY, mode);
    apply(mode);
  }
  function toggle() {
    set(effective() === "dark" ? "light" : "dark");
  }
  apply(get());
  return { get, set, toggle, effective };
})();
