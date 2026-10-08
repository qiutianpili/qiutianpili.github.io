/* Shared sub-page behaviour for 20610728.xyz:
   - applies the saved theme (localStorage "hark-theme", same key as the homepage) before paint
   - wires every [data-theme-toggle] / .x-theme button
   - optionally injects the floating header (<script ... data-header>)
   - injects the floating "返回主页" button on every page except the homepage
   Options on the <script> tag: data-header, data-no-theme, data-fab="top" | "off". */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var me = doc.currentScript || {};
  var opt = (me && me.dataset) || {};
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : { matches: false };
  var KEY = "hark-theme";

  if (opt.noTheme === undefined) {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
    } catch (e) { /* storage blocked: follow the system theme */ }
  }
  function current() {
    var t = root.getAttribute("data-theme");
    return t === "light" || t === "dark" ? t : (mq.matches ? "dark" : "light");
  }
  function label() {
    [].forEach.call(doc.querySelectorAll("[data-theme-toggle], .hark-bar .x-theme"), function (b) {
      b.setAttribute("aria-label", current() === "dark" ? "切换到浅色模式" : "切换到深色模式");
      b.setAttribute("title", current() === "dark" ? "浅色模式" : "深色模式");
    });
  }
  function toggle() {
    var next = current() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch (e) { /* the choice lasts this visit */ }
    label();
    try { window.dispatchEvent(new CustomEvent("hark-theme", { detail: next })); } catch (e) {}
  }

  function norm(p) { return (p || "/").replace(/\.html$/, "").replace(/\/index$/, "/").replace(/\/+$/, "") || "/"; }
  var path = norm(location.pathname);
  var isHome = path === "/";

  var HOUSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v11h5v-6h4v6h5V9"/></svg>';

  var NAV = [["/", "首页"], ["/posts.html", "文章"], ["/assist.html", "资源"], ["/download.html", "下载"], ["/friends.html", "友链"]];
  function headerHTML() {
    return '<a class="x-pill x-brand" href="/" aria-label="秋天霹雳 首页">' +
      '<span class="x-brand__mark" aria-hidden="true">Q</span>' +
      '<span class="x-brand__text"><b>秋天霹雳</b><small>20610728.xyz</small></span></a>' +
      '<nav class="x-pill x-links" aria-label="站点导航">' +
      NAV.map(function (n) {
        var cur = n[0] !== "/" && path === norm(n[0]);
        return '<a href="' + n[0] + '"' + (cur ? ' aria-current="page"' : "") + ">" + n[1] + "</a>";
      }).join("") +
      "</nav>" +
      '<button class="x-pill x-theme" type="button" data-theme-toggle aria-label="切换深浅色"></button>';
  }

  function ready() {
    var body = doc.body;
    if (!body) return;
    if (opt.header !== undefined && !doc.querySelector(".hark-bar")) {
      var bar = doc.createElement("header");
      bar.className = "x-bar hark-bar";
      bar.innerHTML = headerHTML();
      body.insertBefore(bar, body.firstChild);
    }
    // mark the current page in any static header
    [].forEach.call(doc.querySelectorAll(".hark-bar .x-links a"), function (a) {
      var href = a.getAttribute("href") || "";
      if (href !== "/" && href.charAt(0) === "/" && norm(href) === path) a.setAttribute("aria-current", "page");
    });
    [].forEach.call(doc.querySelectorAll("[data-theme-toggle], .hark-bar .x-theme"), function (b) {
      if (b.__harkBound) return;
      b.__harkBound = true;
      b.addEventListener("click", toggle);
    });
    label();
    if (!isHome && opt.fab !== "off" && !doc.querySelector(".home-fab")) {
      var a = doc.createElement("a");
      a.className = "home-fab" + (opt.fab === "top" ? " home-fab--top" : "");
      a.href = "/";
      a.setAttribute("aria-label", "返回主页");
      a.title = "返回主页";
      a.innerHTML = HOUSE;
      body.appendChild(a);
    }
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", ready);
  else ready();
  if (mq.addEventListener) mq.addEventListener("change", label);
})();
