/* WeChat / QQ in-app browser guide for Any Music links (2026-10-24).
   In those browsers, a click on a link to music.20610728.xyz opens a sheet that
   tells the user to open the link in a real browser, with a copy button. */
(function () {
  var ua = navigator.userAgent || "";
  var wx = /MicroMessenger/i.test(ua), qq = /\sQQ\/\d|\sTIM\/\d|V1_(AND|IPH)_SQ/.test(ua);
  if (!wx && !qq) return;
  var ios = /iPhone|iPad|iPod/i.test(ua);
  var app = wx ? (/wxwork/i.test(ua) ? "企业微信" : "微信") : (/\sTIM\//.test(ua) ? "TIM" : "QQ");
  var act = ios ? (wx ? "在 Safari 中打开" : "用 Safari 打开") : (wx ? "在浏览器打开" : "用浏览器打开");
  var HOST = /^https?:\/\/music\.20610728\.xyz(\/|$)/i;
  var box = null, url = "", last = null;

  function css() {
    var s = document.createElement("style");
    s.textContent =
      ".iag{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.55);opacity:0;transition:opacity .2s}" +
      ".iag.on{opacity:1}" +
      ".iag__arw{position:fixed;top:8px;right:14px;width:84px;height:84px;color:#fff}" +
      ".iag__c{width:100%;max-width:420px;margin:0 12px calc(12px + env(safe-area-inset-bottom));background:#15151b;color:#ececf1;border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:24px 20px 18px;font:15px/1.6 -apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;transform:translateY(16px);transition:transform .2s}" +
      ".iag.on .iag__c{transform:none}" +
      ".iag h2{font-size:19px;font-weight:650;margin:0 0 4px;color:#fff}" +
      ".iag p{margin:0;color:#a3a3b2;font-size:14px}" +
      ".iag ol{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:10px}" +
      ".iag li{display:flex;gap:10px;align-items:center;background:rgba(255,255,255,.05);border-radius:12px;padding:10px 12px;color:#ececf1}" +
      ".iag__n{flex:none;width:24px;height:24px;border-radius:50%;background:#7c74ff;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}" +
      ".iag__d{display:inline-flex;gap:3px;padding:3px 7px;border-radius:8px;background:rgba(255,255,255,.14);vertical-align:middle}" +
      ".iag__d i{width:4px;height:4px;border-radius:50%;background:#fff}" +
      ".iag b{color:#fff}" +
      ".iag__u{display:block;margin-top:14px;font:13px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#cfcfe0;background:rgba(0,0,0,.35);border-radius:10px;padding:9px 11px;word-break:break-all;-webkit-user-select:all;user-select:all}" +
      ".iag__r{display:flex;gap:10px;margin-top:12px}" +
      ".iag__b{flex:1;border:0;border-radius:12px;padding:12px;font:inherit;font-weight:600;cursor:pointer;color:#fff;background:#7c74ff}" +
      ".iag__b--g{background:rgba(255,255,255,.1)}" +
      ".iag__m{min-height:18px;margin-top:8px;font-size:13px;text-align:center}";
    document.head.appendChild(s);
  }

  function build() {
    css();
    box = document.createElement("div");
    box.className = "iag";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "iag-t");
    box.innerHTML =
      '<svg class="iag__arw" viewBox="0 0 92 92" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 84C20 50 42 28 74 18"/><path d="M58 14l17 4-6 16"/></svg>' +
      '<div class="iag__c">' +
      '<h2 id="iag-t">请在浏览器中打开</h2>' +
      "<p>" + app + " 内置浏览器里 Any Music 可能无法正常登录或播放。</p>" +
      '<ol><li><span class="iag__n">1</span><span>点击右上角 <span class="iag__d" aria-label="更多"><i></i><i></i><i></i></span></span></li>' +
      '<li><span class="iag__n">2</span><span>选择 <b>' + act + "</b>，再点 Any Music</span></li></ol>" +
      '<span class="iag__u"></span>' +
      '<div class="iag__r"><button class="iag__b" type="button" data-iag-copy>复制链接</button>' +
      '<button class="iag__b iag__b--g" type="button" data-iag-close>关闭</button></div>' +
      '<p class="iag__m" aria-live="polite"></p></div>';
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.closest("[data-iag-close]")) return close();
      if (e.target.closest("[data-iag-copy]")) copy();
    });
    document.body.appendChild(box);
  }

  function msg(ok) {
    var m = box.querySelector(".iag__m");
    m.style.color = ok ? "#9be3b0" : "#ffb4a8";
    m.textContent = ok ? "已复制，打开浏览器粘贴即可" : "复制失败，请长按上方链接手动复制";
  }
  function legacy() {
    var t = document.createElement("textarea");
    t.value = url; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;top:-100px;opacity:0";
    document.body.appendChild(t); t.select(); t.setSelectionRange(0, url.length);
    var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(t); msg(ok);
  }
  function copy() {
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(function () { msg(true); }, legacy);
    else legacy();
  }
  function onKey(e) { if (e.key === "Escape") close(); }
  function open(href) {
    if (!box) build();
    url = href;
    last = document.activeElement;
    box.querySelector(".iag__u").textContent = url;
    box.querySelector(".iag__m").textContent = "";
    box.style.display = "flex";
    requestAnimationFrame(function () { box.classList.add("on"); });
    document.addEventListener("keydown", onKey);
    box.querySelector("[data-iag-copy]").focus({ preventScroll: true });
  }
  function close() {
    box.classList.remove("on");
    document.removeEventListener("keydown", onKey);
    setTimeout(function () { box.style.display = "none"; if (last && last.focus) last.focus(); }, 200);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || !HOST.test(a.href)) return;
    e.preventDefault();
    open(a.href);
  }, true);
})();
