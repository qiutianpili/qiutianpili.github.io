/* Hark-style sidebar for 20610728.xyz.
   Adds a menu button to the floating header (header.x-bar) and a slide-in panel:
   "本页" (built from the current page: its headings, the calculator categories, the post categories…)
   followed by the site-wide groups. Edit SITE below to change the site-wide groups. */
(function () {
  "use strict";
  var doc = document;
  if (doc.querySelector(".hs-panel")) return;

  var SITE = [
    ["文章", [
      ["/posts.html", "全部文章"],
      ["/posts.html#c=教程", "教程"],
      ["/posts.html#c=学习资料", "学习资料"],
      ["/posts.html#c=Linux 笔记", "Linux 笔记"],
      ["/posts.html#site", "站点更新"]
    ]],
    ["项目", [
      ["/hark/", "全部项目"],
      ["/calc/", "计算器中心"],
      ["/hark/#互动小作品", "互动小作品"],
      ["https://music.20610728.xyz/", "Any Music"],
      ["/sri/", "性压抑指数测评"]
    ]],
    ["资源", [
      ["/assist.html", "资源中心"],
      ["/download.html", "下载"],
      ["/help/main.html", "帮助中心"],
      ["/friends.html", "友链"]
    ]]
  ];

  var CSS = '' +
'.hs-btn{flex:none;width:50px;height:50px;display:grid;place-items:center;cursor:pointer;font:inherit;padding:0!important}' +
'.hs-btn svg{width:20px;height:20px;display:block}.hs-btn svg *{fill:none!important;stroke:currentColor!important}' +
'.hs-btn:hover{box-shadow:var(--hark-shadow),inset 0 0 0 100px var(--hover-wash)}' +
'header.x-bar.hs-on{grid-template-columns:auto auto minmax(0,1fr) auto!important}' +
'.hs-scrim{position:fixed;inset:0;z-index:90;background:rgb(0 0 0/.28);opacity:0;transition:opacity .22s ease;pointer-events:none}' +
'.hs-open .hs-scrim{opacity:1;pointer-events:auto}' +
'.hs-panel{color-scheme:light dark;position:fixed;z-index:91;top:calc(env(safe-area-inset-top,0px) + 10px);bottom:10px;left:10px;width:min(300px,calc(100vw - 20px));display:flex;flex-direction:column;' +
'border-radius:28px;background:var(--mat-agent,rgb(255 255 255/.9));-webkit-backdrop-filter:var(--hark-blur,blur(40px));backdrop-filter:var(--hark-blur,blur(40px));' +
'border:1px solid var(--stroke-primary,rgb(0 0 0/.1));box-shadow:var(--hark-shadow,0 10px 40px rgb(0 0 0/.18)),0 20px 60px rgb(0 0 0/.18);color:var(--text-primary,#1d1d1f);' +
'font-family:var(--sans,system-ui,sans-serif);transform:translateX(calc(-100% - 20px));transition:transform .28s cubic-bezier(.2,.8,.2,1);visibility:hidden;-webkit-font-smoothing:antialiased}' +
':root[data-theme="light"] .hs-panel{color-scheme:light}:root[data-theme="dark"] .hs-panel{color-scheme:dark}' +
'.hs-open .hs-panel{transform:none;visibility:visible}' +
'.hs-panel *{box-sizing:border-box}' +
'.hs-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:14px 14px 6px 20px}' +
'.hs-head b{font:var(--type-label,600 15px/1.3 sans-serif)}' +
'.hs-x{width:40px;height:40px;border-radius:50%;border:0;background:transparent;color:inherit;cursor:pointer;display:grid;place-items:center;font-size:20px;line-height:1}' +
'.hs-x:hover{background:var(--hover-wash,rgb(0 0 0/.06))}' +
'.hs-body{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:0 10px 16px}' +
'.hs-group{margin:10px 0 0}' +
'.hs-group h3{margin:0;padding:8px 10px 4px;font:var(--type-caption,500 12px/1.3 sans-serif)!important;letter-spacing:.04em;color:var(--text-tertiary,#8e8e93)!important;border:0!important}' +
'.hs-group ul{list-style:none;margin:0;padding:0}' +
'.hs-group li{margin:0;padding:0}' +
'.hs-panel a.hs-link{display:flex;align-items:center;min-height:40px;padding:6px 10px;border-radius:14px;font:var(--type-body,400 15px/1.35 sans-serif)!important;color:var(--text-primary,#1d1d1f)!important;text-decoration:none!important;background:transparent}' +
'.hs-panel a.hs-link:hover{background:var(--hover-wash,rgb(0 0 0/.06))}' +
'.hs-panel a.hs-link[aria-current]{background:var(--fill-primary,#1d1d1f);color:var(--text-primary-on,#fff)!important}' +
'.hs-panel a.hs-sub{padding-left:22px;min-height:34px;font:var(--type-small,400 14px/1.35 sans-serif)!important;color:var(--text-secondary,#6e6e73)!important}' +
'.hs-here{border-bottom:1px solid var(--stroke-secondary,rgb(0 0 0/.08));padding-bottom:10px}' +
'.hs-panel :focus-visible{outline:2px solid var(--fill-primary,#1d1d1f);outline-offset:2px}' +
'@media (max-width:760px){.hs-btn{width:var(--tap,44px);height:var(--tap,44px)}header.x-bar.hs-on .x-brand{display:none!important}header.x-bar.hs-on{grid-template-columns:auto minmax(0,1fr) auto!important}}' +
'@media (prefers-reduced-motion:reduce){.hs-panel,.hs-scrim{transition:none}}' +
'@media print{.hs-btn,.hs-panel,.hs-scrim{display:none!important}}';

  var MENU = '<svg viewBox="0 0 24 24" stroke-width="1.9" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h10"/></svg>';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(p) { return decodeURI(p || "/").replace(/\.html$/, "").replace(/\/index$/, "/").replace(/\/+$/, "") || "/"; }
  var path = norm(location.pathname);

  function link(href, text, sub) {
    var ext = /^https?:/.test(href) && href.indexOf(location.host) < 0;
    var cur = false;
    if (!sub && !ext) {
      var u = href.split("#");
      cur = norm(u[0]) === path && !u[1] && !location.hash;
    }
    return '<li><a class="hs-link' + (sub ? " hs-sub" : "") + '" href="' + esc(href) + '"' +
      (ext ? ' target="_blank" rel="noopener"' : "") + (cur ? ' aria-current="page"' : "") + ">" + esc(text) + "</a></li>";
  }
  function group(title, items, cls) {
    if (!items.length) return "";
    return '<section class="hs-group' + (cls ? " " + cls : "") + '"><h3>' + esc(title) + "</h3><ul>" +
      items.map(function (i) { return link(i[0], i[1], i[2]); }).join("") + "</ul></section>";
  }

  // "本页": what this page holds
  function here() {
    var items = [], title = "本页";
    if (path === "/") {
      title = "主页";
      [["music", "Any Music"], ["posts", "最近文章"], ["projects", "项目"]].forEach(function (s) {
        if (doc.getElementById(s[0])) items.push(["#" + s[0], s[1], true]);
      });
    } else if (path === "/calc" && window.CX && window.CX.cats) {
      title = "计算器分类";
      items.push(["#/", "全部计算器", true]);
      Object.keys(window.CX.cats).forEach(function (k) { items.push(["#/" + k, window.CX.cats[k], true]); });
    } else if (path === "/posts") {
      title = "按分类看";
      items.push(["#", "全部", true]);
      var seen = {};
      [].forEach.call(doc.querySelectorAll(".timeline .post-cat"), function (p) {
        var c = p.textContent.trim();
        if (c && !seen[c]) { seen[c] = 1; items.push(["#c=" + c, c, true]); }
      });
    } else {
      var hs = [].slice.call(doc.querySelectorAll("main h2, .doc h2, article h2"));
      if (hs.length < 2) hs = [].slice.call(doc.querySelectorAll("h2"));
      if (hs.length < 2) hs = [].slice.call(doc.querySelectorAll("h1[id], h1"));
      var n = 0;
      hs.forEach(function (h) {
        if (h.closest(".hs-panel, .hark-bar, header.x-bar, nav, footer")) return;
        var t = h.textContent.replace(/\s+/g, " ").trim();
        if (!t || t.length > 40 || n >= 30) return;
        if (!h.id) h.id = "s-" + (++n);
        else n++;
        items.push(["#" + h.id, t, true]);
      });
      title = "本页目录";
      if (items.length < 2) items = [];
    }
    return group(title, items, "hs-here");
  }

  function build() {
    return here() + SITE.map(function (g) { return group(g[0], g[1]); }).join("");
  }

  function init() {
    var bar = doc.querySelector("header.x-bar");
    if (!bar || bar.querySelector(".hs-btn")) return;
    var st = doc.createElement("style");
    st.textContent = CSS;
    doc.head.appendChild(st);

    var btn = doc.createElement("button");
    btn.type = "button";
    btn.className = "x-pill hs-btn";
    btn.setAttribute("aria-label", "打开侧边栏");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "hs-panel");
    btn.title = "目录";
    btn.innerHTML = MENU;
    bar.insertBefore(btn, bar.firstChild);
    bar.classList.add("hs-on");

    var scrim = doc.createElement("div");
    scrim.className = "hs-scrim";
    var panel = doc.createElement("aside");
    panel.className = "hs-panel";
    panel.id = "hs-panel";
    panel.setAttribute("aria-label", "侧边栏");
    panel.innerHTML = '<div class="hs-head"><b>秋天霹雳</b><button class="hs-x" type="button" aria-label="关闭侧边栏">×</button></div><nav class="hs-body" aria-label="侧边栏导航"></nav>';
    doc.body.appendChild(scrim);
    doc.body.appendChild(panel);
    var body = panel.querySelector(".hs-body");
    var root = doc.documentElement;

    function open() {
      body.innerHTML = build();
      root.classList.add("hs-open");
      btn.setAttribute("aria-expanded", "true");
      var f = body.querySelector("a"); if (f) f.focus({ preventScroll: true });
    }
    function close(back) {
      root.classList.remove("hs-open");
      btn.setAttribute("aria-expanded", "false");
      if (back) btn.focus({ preventScroll: true });
    }
    btn.addEventListener("click", function () { root.classList.contains("hs-open") ? close(true) : open(); });
    scrim.addEventListener("click", function () { close(true); });
    panel.querySelector(".hs-x").addEventListener("click", function () { close(true); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("hs-open")) close(true); });
    body.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      var h = a.getAttribute("href");
      if (h === "#") { e.preventDefault(); try { history.replaceState(null, "", location.pathname); } catch (x) {} window.dispatchEvent(new Event("hashchange")); }
      close(false);
    });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})();
