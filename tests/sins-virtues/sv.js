(function () {
  "use strict";
  var D = window.SV_DATA, $ = function (s) { return document.getElementById(s); };
  var KEY = "sv-7x7-v1";
  var ORDER = ["pride", "greed", "lust", "envy", "wrath", "gluttony", "sloth", "humility", "charity", "chastity", "kindness", "patience", "temperance", "diligence"];
  var SINS = ORDER.slice(0, 7), VIRS = ORDER.slice(7);
  var MIX = ["pride", "charity", "wrath", "kindness", "sloth", "chastity", "greed", "patience", "lust", "temperance", "envy", "diligence", "gluttony", "humility"];

  /* 题目顺序：4 轮，每轮 14 维各一题，轮间错位，避免同维度连在一起 */
  var Q = [];
  for (var k = 0; k < 4; k++) for (var j = 0; j < 14; j++) {
    var key = MIX[(j + k * 5) % 14];
    Q.push({ dim: key, i: k, text: D.dims[key].items[k][0], rev: D.dims[key].items[k][1] === 1 });
  }
  var N = Q.length;
  var st = load() || { a: new Array(N).fill(0), idx: 0 };
  var busy = false, shared = false, chartMode = "radar", lastScores = null;

  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.a && s.a.length === N) return s; } catch (e) {} return null; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function show(id) {
    ["v-intro", "v-quiz", "v-result"].forEach(function (v) { $(v).classList.toggle("is-on", v === id); });
    window.scrollTo(0, 0);
  }
  function toast(t) { var el = $("toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove("on"); }, 1800); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- intro ---------- */
  $("chips").innerHTML = ORDER.map(function (k) { var d = D.dims[k]; return '<span class="sv-chip ' + d.side + '">' + d.emoji + " " + d.name + "</span>"; }).join("");
  var answered = st.a.filter(Boolean).length;
  if (answered > 0 && answered < N) { $("b-resume").hidden = false; $("b-resume").textContent = "继续上次进度（" + answered + "/" + N + "）"; }
  if (answered === N) { $("b-resume").hidden = false; $("b-resume").textContent = "查看上次结果"; }

  $("b-start").onclick = function () { st = { a: new Array(N).fill(0), idx: 0 }; save(); startQuiz(); };
  $("b-resume").onclick = function () { if (st.a.filter(Boolean).length === N) { finish(); } else { st.idx = Math.min(st.a.indexOf(0), N - 1); startQuiz(); } };

  /* ---------- quiz ---------- */
  var scale = $("scale");
  scale.innerHTML = D.scale.map(function (t, i) { return '<button class="sv-opt" type="button" role="radio" aria-checked="false" aria-label="' + t + '" data-v="' + (i + 1) + '"><span class="k">' + (i + 1) + " · " + t + "</span></button>"; }).join("");
  scale.addEventListener("click", function (e) { var b = e.target.closest(".sv-opt"); if (b) answer(+b.dataset.v); });

  function startQuiz() { show("v-quiz"); render(0); }
  function render(dir) {
    var q = Q[st.idx], card = $("qcard");
    var paint = function () {
      $("qtag").textContent = "第 " + (st.idx + 1) + " 题";
      $("qtext").textContent = q.text;
      [].forEach.call(scale.children, function (b) { var on = +b.dataset.v === st.a[st.idx]; b.classList.toggle("is-sel", on); b.setAttribute("aria-checked", on); });
      var done = st.a.filter(Boolean).length;
      $("prog-bar").style.width = (done / N * 100) + "%";
      $("prog").setAttribute("aria-valuenow", done);
      $("count").textContent = (st.idx + 1) + " / " + N;
      $("b-back").disabled = st.idx === 0;
      $("b-next").style.visibility = st.a[st.idx] && st.idx < N - 1 ? "visible" : "hidden";
      $("b-finish").hidden = done < N;
    };
    if (!dir) { paint(); return; }
    busy = true;
    card.className = "sv-q " + (dir > 0 ? "out-l" : "out-r");
    setTimeout(function () { paint(); card.className = "sv-q " + (dir > 0 ? "in-r" : "in-l"); busy = false; }, 200);
  }
  function answer(v) {
    if (busy) return;
    st.a[st.idx] = v; save();
    [].forEach.call(scale.children, function (b) { b.classList.toggle("is-sel", +b.dataset.v === v); });
    if (navigator.vibrate) try { navigator.vibrate(8); } catch (e) {}
    busy = true;
    setTimeout(function () {
      busy = false;
      var next = st.a.indexOf(0, st.idx + 1); if (next < 0) next = st.a.indexOf(0);
      if (next < 0) { $("prog-bar").style.width = "100%"; finish(); return; }
      st.idx = st.idx < N - 1 && !st.a[st.idx + 1] ? st.idx + 1 : next; save(); render(1);
    }, 240);
  }
  function go(d) { var n = st.idx + d; if (busy || n < 0 || n >= N) return; if (d > 0 && !st.a[st.idx]) return; st.idx = n; save(); render(d); }
  $("b-back").onclick = function () { go(-1); };
  $("b-next").onclick = function () { go(1); };
  $("b-finish").onclick = finish;
  $("b-quit").onclick = function () { show("v-intro"); var a = st.a.filter(Boolean).length; $("b-resume").hidden = !a; $("b-resume").textContent = "继续上次进度（" + a + "/" + N + "）"; };
  document.addEventListener("keydown", function (e) {
    if (!$("v-quiz").classList.contains("is-on") || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key >= "1" && e.key <= "5") { answer(+e.key); e.preventDefault(); }
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
  });
  /* 手机左右滑动切题 */
  (function () { var x0 = null, stage = $("stage");
    stage.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); }, { passive: true });
  })();

  /* ---------- scoring ---------- */
  function score(a) {
    var s = {}, fwd = {}, rv = {};
    ORDER.forEach(function (k) { s[k] = 0; fwd[k] = []; });
    Q.forEach(function (q, i) { var v = q.rev ? 6 - a[i] : a[i]; s[q.dim] += v; if (q.rev) rv[q.dim] = v; else fwd[q.dim].push(v); });
    ORDER.forEach(function (k) { s[k] = Math.round((s[k] - 4) / 16 * 100) / 10; });
    var mean = a.reduce(function (x, y) { return x + y; }, 0) / N;
    var sd = Math.sqrt(a.reduce(function (x, y) { return x + (y - mean) * (y - mean); }, 0) / N);
    var incons = ORDER.filter(function (k) { var m = fwd[k].reduce(function (x, y) { return x + y; }, 0) / fwd[k].length; return Math.abs(m - rv[k]) >= 2.5; }).length;
    return { s: s, sd: sd, incons: incons };
  }
  function lv(v) { return v >= 6.5 ? "high" : v <= 3.5 ? "low" : "mid"; }
  var LV = { high: "偏高", mid: "中等", low: "偏低" };
  function top(list, s) { return list.slice().sort(function (x, y) { return s[y] - s[x] || ORDER.indexOf(x) - ORDER.indexOf(y); })[0]; }
  function bottom(list, s) { return list.slice().sort(function (x, y) { return s[x] - s[y] || ORDER.indexOf(x) - ORDER.indexOf(y); })[0]; }
  function avg(list, s) { return Math.round(list.reduce(function (x, k) { return x + s[k]; }, 0) / list.length * 10) / 10; }

  function encode(s) { return ORDER.map(function (k) { return ("0" + Math.round(s[k] * 10).toString(36)).slice(-2); }).join(""); }
  function decode(h) { if (!/^[0-9a-z]{28}$/.test(h)) return null; var s = {}; for (var i = 0; i < 14; i++) { var v = parseInt(h.substr(i * 2, 2), 36); if (isNaN(v) || v > 100) return null; s[ORDER[i]] = v / 10; } return s; }

  function finish() {
    var r = score(st.a); shared = false; $("shared-banner").hidden = true;
    history.replaceState(null, "", location.pathname + "#r=" + encode(r.s));
    renderResult(r.s, r);
  }

  /* ---------- result ---------- */
  function renderResult(s, meta) {
    lastScores = s;
    show("v-result");
    var ts = top(SINS, s), tv = top(VIRS, s), dS = D.dims[ts], dV = D.dims[tv];
    var allLowS = SINS.every(function (k) { return s[k] <= 3.5; }), allLowV = VIRS.every(function (k) { return s[k] <= 3.5; });
    var title = (allLowS ? "澄澈的" : dS.adj) + (allLowV ? "自由灵魂" : dV.noun);
    $("r-title").textContent = title;
    $("r-sub").innerHTML = '最突出的罪：<b class="c-sin">' + dS.name + " " + s[ts].toFixed(1) + '</b>　·　最突出的美德：<b class="c-vir">' + dV.name + " " + s[tv].toFixed(1) + "</b>";
    var top3 = ORDER.slice().sort(function (x, y) { return s[y] - s[x]; }).slice(0, 3);
    $("r-badges").innerHTML = top3.map(function (k) { var d = D.dims[k]; return '<span class="sv-badge ' + d.side + '">' + d.emoji + " " + d.name + " " + s[k].toFixed(1) + "</span>"; }).join("");

    var drive = avg(SINS, s), reg = avg(VIRS, s);
    var ten = D.pairs.filter(function (p) { return s[p[0]] >= 6.5 && s[p[1]] >= 6.5; }).length;
    countUp($("i-drive"), drive, 1); countUp($("i-reg"), reg, 1); countUp($("i-ten"), ten, 0);

    var sum;
    if (drive >= 6 && reg >= 6) sum = "驱动力和调节力都很强：你内心戏丰富，常在“想要”和“应该”之间拉扯，也因此格外有层次。";
    else if (drive <= 4 && reg <= 4) sum = "驱动力和调节力都偏低：你整体平和淡然，外界的诱惑和刺激很难真正搅动你。";
    else if (reg - drive >= 2) sum = "调节力明显强于驱动力：你习惯先想清楚再行动，内心秩序感很强，偶尔可以对自己松一点。";
    else if (drive - reg >= 2) sum = "驱动力明显强于调节力：你的欲望与情绪鲜活直接，行动力足，但有时会被它们推着走。";
    else sum = "驱动力与调节力大致平衡：你的想要和克制都在可控范围内，多数时候能随情境灵活切换。";
    sum += "你身上最鲜明的两面是「" + dS.light + "」与「" + dV.light + "」。";
    $("r-summary").textContent = sum;

    var qn = [];
    if (meta && meta.sd < 0.7) qn.push("你的答案大多集中在同一个选项附近，维度之间的差异可能被压平了。");
    if (meta && meta.incons >= 4) qn.push("有 " + meta.incons + " 个维度的正向题和反向题回答不太一致，可能是题目读得比较快。");
    $("r-quality-card").hidden = !qn.length;
    if (qn.length) $("r-quality").textContent = qn.join("") + "想要更准确的结果，可以放慢一点再测一次。";

    drawChart();
    renderDims(s, "all");
    renderPairs(s);
    var tips = [ts, tv, bottom(VIRS, s)].filter(function (k, i, a) { return a.indexOf(k) === i; });
    $("tips").innerHTML = tips.map(function (k) { var d = D.dims[k]; return "<li><div><b>" + d.emoji + " " + d.name + (k === bottom(VIRS, s) && k !== tv ? "（最低的美德）" : "") + "</b>" + esc(d.tip) + "</div></li>"; }).join("");
  }

  function countUp(el, to, dec) {
    var t0 = performance.now(), dur = 900;
    (function f(t) { var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = (to * e).toFixed(dec); if (p < 1) requestAnimationFrame(f); })(t0);
  }

  /* 雷达图：美德在右半圆、罪在左半圆，每对正好隔着圆心相对；12 点与 6 点方向留空 */
  function angle(k) {
    for (var i = 0; i < 7; i++) {
      var th = 22.5 + i * 22.5;
      if (D.pairs[i][1] === k) return th;
      if (D.pairs[i][0] === k) return th + 180;
    }
  }
  function pt(th, r) { var a = th * Math.PI / 180; return [r * Math.sin(a), -r * Math.cos(a)]; }
  var RING = D.pairs.map(function (p) { return p[1]; }).concat(D.pairs.map(function (p) { return p[0]; }));

  function drawChart() {
    var s = lastScores, box = $("chart");
    if (chartMode === "bars") return drawBars(s, box);
    var R = 168, h = [];
    h.push('<svg viewBox="-270 -250 540 500" role="img" aria-label="14 维雷达图"><defs><linearGradient id="g-fill" x1="0" x2="1"><stop offset="0" stop-color="var(--sin)" stop-opacity=".42"/><stop offset="1" stop-color="var(--vir)" stop-opacity=".42"/></linearGradient><linearGradient id="g-stroke" x1="0" x2="1"><stop offset="0" stop-color="var(--sin)"/><stop offset="1" stop-color="var(--vir)"/></linearGradient></defs>');
    [2, 4, 6, 8, 10].forEach(function (v) {
      var pts = RING.map(function (k) { return pt(angle(k), R * v / 10).join(","); }).join(" ");
      h.push('<polygon points="' + pts + '" fill="none" stroke="var(--stroke-secondary)" stroke-width="' + (v === 10 ? 1.4 : .8) + '"' + (v === 6 ? ' stroke-dasharray="3 4"' : "") + "/>");
    });
    h.push('<line x1="0" y1="-' + (R + 20) + '" x2="0" y2="' + (R + 20) + '" stroke="var(--stroke-secondary)" stroke-dasharray="2 6"/>');
    D.pairs.forEach(function (p) { var a = pt(angle(p[0]), R), b = pt(angle(p[1]), R); h.push('<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="var(--stroke-secondary)" stroke-width=".8"/>'); });
    h.push('<polygon id="shape" fill="url(#g-fill)" stroke="url(#g-stroke)" stroke-width="2.5" stroke-linejoin="round" points=""/>');
    RING.forEach(function (k) {
      var d = D.dims[k], th = angle(k), lp = pt(th, R + 34), dp = pt(th, R * s[k] / 10), col = d.side === "sin" ? "var(--sin)" : "var(--vir)";
      var anchor = Math.abs(lp[0]) < 8 ? "middle" : lp[0] > 0 ? "start" : "end";
      h.push('<g class="ax" data-k="' + k + '" tabindex="0"><line x1="0" y1="0" x2="' + pt(th, R)[0] + '" y2="' + pt(th, R)[1] + '" stroke="transparent" stroke-width="22"/>' +
        '<circle class="dot" data-k="' + k + '" cx="0" cy="0" r="5" fill="' + col + '" stroke="var(--mat-regular, #fff)" stroke-width="2"/>' +
        '<text x="' + lp[0] + '" y="' + (lp[1] - 2) + '" text-anchor="' + anchor + '">' + d.emoji + " " + d.name + "</text>" +
        '<text class="num" x="' + lp[0] + '" y="' + (lp[1] + 14) + '" text-anchor="' + anchor + '" fill="' + col + '">' + s[k].toFixed(1) + "</text></g>");
    });
    h.push('<text x="-' + (R + 6) + '" y="-' + (R + 4) + '" font-size="12" font-weight="700" fill="var(--sin)" text-anchor="start">SINS</text><text x="' + (R + 6) + '" y="-' + (R + 4) + '" font-size="12" font-weight="700" fill="var(--vir)" text-anchor="end">VIRTUES</text>');
    h.push("</svg><div class=\"sv-tip\" id=\"tip\"></div>");
    box.innerHTML = h.join("");
    var shape = box.querySelector("#shape"), dots = box.querySelectorAll(".dot"), t0 = performance.now();
    (function f(t) {
      var p = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - p, 4);
      shape.setAttribute("points", RING.map(function (k) { return pt(angle(k), R * s[k] / 10 * e).join(","); }).join(" "));
      [].forEach.call(dots, function (c) { var q = pt(angle(c.dataset.k), R * s[c.dataset.k] / 10 * e); c.setAttribute("cx", q[0]); c.setAttribute("cy", q[1]); });
      if (p < 1) requestAnimationFrame(f);
    })(t0);
    var tip = box.querySelector("#tip");
    [].forEach.call(box.querySelectorAll(".ax"), function (g) {
      var k = g.dataset.k, d = D.dims[k];
      var on = function (ev) {
        [].forEach.call(box.querySelectorAll(".ax"), function (o) { o.classList.toggle("dim", o !== g && o.dataset.k !== partner(k)); });
        tip.innerHTML = "<b>" + d.emoji + " " + d.name + " " + s[k].toFixed(1) + "（" + LV[lv(s[k])] + "）</b><br>" + esc(d.what);
        var br = box.getBoundingClientRect(), x = (ev && ev.clientX ? ev.clientX - br.left : br.width / 2), y = (ev && ev.clientY ? ev.clientY - br.top : br.height / 2);
        tip.style.left = Math.max(4, Math.min(br.width - 244, x - 120)) + "px"; tip.style.top = Math.max(0, y + 16) + "px"; tip.classList.add("on");
      };
      var off = function () { tip.classList.remove("on"); [].forEach.call(box.querySelectorAll(".ax"), function (o) { o.classList.remove("dim"); }); };
      g.addEventListener("mouseenter", on); g.addEventListener("mousemove", on); g.addEventListener("mouseleave", off);
      g.addEventListener("focus", on); g.addEventListener("blur", off);
      g.addEventListener("click", function (ev) { on(ev); jump(k); });
    });
  }
  function partner(k) { for (var i = 0; i < 7; i++) { if (D.pairs[i][0] === k) return D.pairs[i][1]; if (D.pairs[i][1] === k) return D.pairs[i][0]; } }
  function drawBars(s, box) {
    box.innerHTML = '<div class="sv-bars">' + D.pairs.map(function (p) {
      return '<div class="sv-bar"><span class="l">' + D.dims[p[0]].name + '</span><div class="sv-bar__track"><div class="sv-bar__half"><i class="sv-bar__fill" data-w="' + s[p[0]] * 10 + '">' + s[p[0]].toFixed(1) + '</i></div><div class="sv-bar__half"><i class="sv-bar__fill" data-w="' + s[p[1]] * 10 + '">' + s[p[1]].toFixed(1) + '</i></div></div><span class="r">' + D.dims[p[1]].name + "</span></div>";
    }).join("") + "</div>";
    requestAnimationFrame(function () { requestAnimationFrame(function () { [].forEach.call(box.querySelectorAll(".sv-bar__fill"), function (f) { f.style.width = Math.max(f.dataset.w, 14) + "%"; }); }); });
  }
  $("chart-seg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; chartMode = b.dataset.v; [].forEach.call(this.children, function (x) { x.classList.toggle("is-on", x === b); }); drawChart(); });

  function renderDims(s, filter) {
    var list = ORDER.filter(function (k) { return filter === "all" || D.dims[k].side === filter; });
    $("dims").innerHTML = list.map(function (k) {
      var d = D.dims[k], l = lv(s[k]);
      return '<div class="sv-dim" id="dim-' + k + '" data-side="' + d.side + '"><div class="sv-dim__head"><span class="sv-dim__name">' + d.emoji + " " + d.name + '</span><span class="sv-dim__en">' + d.en + '</span><span class="sv-dim__score">' + s[k].toFixed(1) + '</span><span class="sv-dim__lv">' + LV[l] + '</span></div>' +
        '<div class="sv-meter"><i data-w="' + s[k] * 10 + '"></i></div><p class="sv-dim__what">' + esc(d.what) + '</p><p class="sv-dim__txt">' + esc(d[l]) + '</p>' +
        '<div class="sv-dim__ls"><div><b>适度时</b>' + esc(d.light) + "</div><div><b>过度时</b>" + esc(d.shadow) + "</div></div></div>";
    }).join("");
    requestAnimationFrame(function () { requestAnimationFrame(function () { [].forEach.call($("dims").querySelectorAll(".sv-meter i"), function (i) { i.style.width = i.dataset.w + "%"; }); }); });
  }
  $("dim-seg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; [].forEach.call(this.children, function (x) { x.classList.toggle("is-on", x === b); }); renderDims(lastScores, b.dataset.v); });
  function jump(k) {
    if (!document.getElementById("dim-" + k)) { [].forEach.call($("dim-seg").children, function (x) { x.classList.toggle("is-on", x.dataset.v === "all"); }); renderDims(lastScores, "all"); }
    var el = $("dim-" + k); el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("flash"); setTimeout(function () { el.classList.remove("flash"); }, 1600);
  }

  function renderPairs(s) {
    $("pairs").innerHTML = D.pairs.map(function (p) {
      var a = s[p[0]], b = s[p[1]], key = p[0] + "|" + p[1], qi = -1;
      if (a >= 6.5 && b >= 6.5) qi = 0; else if (a >= 6.5 && b <= 3.5) qi = 1; else if (a <= 3.5 && b >= 6.5) qi = 2; else if (a <= 3.5 && b <= 3.5) qi = 3;
      var t = qi >= 0 ? D.pairText[key][qi] : ["情境型", "两边都处在中间地带：这一对特质在你身上不算极端，具体表现更多取决于场合、对象和当下的状态。"];
      var cells = [0, 1, 2, 3].map(function (i) { return '<span class="' + (i === qi ? "on" : "") + '"></span>'; });
      /* 小方格：左上=罪高美德高 右上=罪低美德高 左下=罪高美德低 右下=双低 */
      var grid = [cells[0], cells[2], cells[1], cells[3]].join("");
      return '<div class="sv-pair"><div class="sv-pair__top"><span class="l">' + D.dims[p[0]].name + " " + a.toFixed(1) + '</span><span class="r">' + D.dims[p[1]].name + " " + b.toFixed(1) + '</span></div><div class="sv-pair__q" aria-hidden="true">' + grid + '</div><div class="sv-pair__label">' + t[0] + '</div><p class="sv-pair__txt">' + esc(t[1]) + "</p></div>";
    }).join("");
  }

  /* ---------- share ---------- */
  function shareURL() { return location.origin + location.pathname + "#r=" + encode(lastScores); }
  $("b-link").onclick = function () {
    var u = shareURL();
    var ok = function () { toast("链接已复制"); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(ok, function () { prompt("复制这个链接：", u); });
    else prompt("复制这个链接：", u);
  };
  $("b-retake").onclick = function () { st = { a: new Array(N).fill(0), idx: 0 }; save(); history.replaceState(null, "", location.pathname); startQuiz(); };
  $("b-own").onclick = function () { history.replaceState(null, "", location.pathname); show("v-intro"); };
  $("modal-x").onclick = function () { $("modal").hidden = true; };
  $("modal").addEventListener("click", function (e) { if (e.target === this) this.hidden = true; });

  $("b-img").onclick = function () {
    var s = lastScores, W = 1080, H = 1560, c = document.createElement("canvas"); c.width = W; c.height = H;
    var g = c.getContext("2d"), dark = (document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
    var SIN = dark ? "#ff7a55" : "#f2643d", VIR = dark ? "#6c9cff" : "#3c7dff", FG = dark ? "#f5f5f7" : "#141416", SUB = dark ? "#a1a1aa" : "#6b6b73", BG = dark ? "#121214" : "#fafafa";
    var F = '-apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var rg = g.createRadialGradient(0, 0, 0, 0, 0, 800); rg.addColorStop(0, SIN + "44"); rg.addColorStop(1, SIN + "00"); g.fillStyle = rg; g.fillRect(0, 0, W, H);
    rg = g.createRadialGradient(W, 200, 0, W, 200, 800); rg.addColorStop(0, VIR + "44"); rg.addColorStop(1, VIR + "00"); g.fillStyle = rg; g.fillRect(0, 0, W, H);
    g.textAlign = "center"; g.fillStyle = SUB; g.font = "600 30px " + F; g.fillText("七宗罪 × 七美德 · 14 维人格光谱", W / 2, 110);
    var lg = g.createLinearGradient(200, 0, W - 200, 0); lg.addColorStop(0, SIN); lg.addColorStop(.5, "#b75ad6"); lg.addColorStop(1, VIR);
    g.fillStyle = lg; g.font = "800 84px " + F; g.fillText($("r-title").textContent, W / 2, 220);
    var ts = top(SINS, s), tv = top(VIRS, s);
    g.font = "600 32px " + F; g.fillStyle = SIN; g.textAlign = "right"; g.fillText("最突出的罪 " + D.dims[ts].name + " " + s[ts].toFixed(1), W / 2 - 24, 290);
    g.fillStyle = VIR; g.textAlign = "left"; g.fillText("最突出的美德 " + D.dims[tv].name + " " + s[tv].toFixed(1), W / 2 + 24, 290);
    var cx = W / 2, cy = 720, R = 300;
    var P = function (k, r) { var q = pt(angle(k), r); return [cx + q[0], cy + q[1]]; };
    g.lineWidth = 1.5;
    [2, 4, 6, 8, 10].forEach(function (v) { g.beginPath(); RING.forEach(function (k, i) { var q = P(k, R * v / 10); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); g.strokeStyle = dark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.1)"; g.stroke(); });
    D.pairs.forEach(function (p) { var a = P(p[0], R), b = P(p[1], R); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });
    g.beginPath(); RING.forEach(function (k, i) { var q = P(k, R * s[k] / 10); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath();
    var fg = g.createLinearGradient(cx - R, 0, cx + R, 0); fg.addColorStop(0, SIN + "70"); fg.addColorStop(1, VIR + "70"); g.fillStyle = fg; g.fill();
    var sg = g.createLinearGradient(cx - R, 0, cx + R, 0); sg.addColorStop(0, SIN); sg.addColorStop(1, VIR); g.strokeStyle = sg; g.lineWidth = 5; g.lineJoin = "round"; g.stroke();
    RING.forEach(function (k) {
      var d = D.dims[k], q = P(k, R * s[k] / 10), l = P(k, R + 56), col = d.side === "sin" ? SIN : VIR;
      g.beginPath(); g.arc(q[0], q[1], 9, 0, 7); g.fillStyle = col; g.fill(); g.lineWidth = 3; g.strokeStyle = BG; g.stroke();
      g.textAlign = Math.abs(l[0] - cx) < 10 ? "center" : l[0] > cx ? "left" : "right";
      g.fillStyle = FG; g.font = "700 30px " + F; g.fillText(d.name, l[0], l[1]);
      g.fillStyle = col; g.font = "800 28px " + F; g.fillText(s[k].toFixed(1), l[0], l[1] + 34);
    });
    var drive = avg(SINS, s), reg = avg(VIRS, s), ten = D.pairs.filter(function (p) { return s[p[0]] >= 6.5 && s[p[1]] >= 6.5; }).length;
    [["驱动力", drive.toFixed(1), SIN], ["调节力", reg.toFixed(1), VIR], ["内在张力", String(ten), FG]].forEach(function (it, i) {
      var x = W / 2 + (i - 1) * 300; g.textAlign = "center"; g.fillStyle = SUB; g.font = "600 28px " + F; g.fillText(it[0], x, 1170); g.fillStyle = it[2]; g.font = "800 72px " + F; g.fillText(it[1], x, 1250);
    });
    g.fillStyle = SUB; g.font = "500 28px " + F; g.textAlign = "center";
    wrap(g, $("r-summary").textContent, W / 2, 1330, W - 160, 44, 3);
    g.font = "600 26px " + F; g.fillStyle = FG; g.fillText("20610728.xyz/tests/sins-virtues", W / 2, H - 60);
    var url = c.toDataURL("image/png"); $("modal-img").src = url; $("modal-dl").href = url; $("modal").hidden = false;
  };
  function wrap(g, text, x, y, maxW, lh, maxL) {
    var line = "", n = 0;
    for (var i = 0; i < text.length; i++) {
      var t = line + text[i];
      if (g.measureText(t).width > maxW) { g.fillText(line, x, y + n * lh); n++; line = text[i]; if (n >= maxL) return; } else line = t;
    }
    if (line && n < maxL) g.fillText(line, x, y + n * lh);
  }

  /* ---------- 入口：分享链接直接显示结果 ---------- */
  function fromHash() {
    var m = location.hash.match(/^#r=([0-9a-z]{28})$/);
    var dec = m && decode(m[1]);
    if (!dec) return false;
    var own = st.a.filter(Boolean).length === N && encode(score(st.a).s) === m[1];
    shared = !own; $("shared-banner").hidden = own;
    renderResult(dec, own ? score(st.a) : null);
    return true;
  }
  fromHash();
  window.addEventListener("hashchange", fromHash);
  window.addEventListener("resize", function () { if (lastScores && chartMode === "radar" && $("v-result").classList.contains("is-on")) {/* svg 自适应，无需重绘 */} });
})();
