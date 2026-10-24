/*
 * boot.js: runs synchronously in <head>, before the first paint.
 * - swaps html.no-js -> html.js so CSS only hides things when JS can show them again
 * - marks the boot screen as already seen (once per session, or with reduced motion)
 * - failsafe: if main.js never runs (blocked, 404, slow), fall back to the no-JS page
 */
(function () {
  var d = document.documentElement;
  d.classList.remove("no-js");
  d.classList.add("js");

  try {
    if (sessionStorage.getItem("rux:booted")) d.classList.add("booted");
  } catch (e) { /* storage blocked: just show the boot screen */ }

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    d.classList.add("booted");
  }

  setTimeout(function () {
    if (!window.__rux) {
      d.classList.remove("js");
      d.classList.add("no-js", "booted");
    }
  }, 3500);
})();
