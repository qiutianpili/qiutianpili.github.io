/* Legacy entry point: the site now uses /assets/hark-sub.js (theme key "hark-theme", header, home button). */
(function () {
  if (document.querySelector('script[src$="hark-sub.js"]')) return;
  var s = document.createElement("script");
  s.src = "/assets/hark-sub.js";
  document.head.appendChild(s);
})();
