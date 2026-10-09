/* Calculator hub engine: renders the index and each calculator from window.CX (calcs.js). */
(function () {
  "use strict";
  var CX = window.CX, app = document.getElementById("app");
  var CATS = CX.cats, LIST = CX.list;
  var byId = {};
  LIST.forEach(function (c) { byId[c.cat + "/" + c.id] = c; });
  var RKEY = "cx-recent";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function recent() { try { return JSON.parse(localStorage.getItem(RKEY) || "[]"); } catch (e) { return []; } }
  function pushRecent(key) {
    var r = recent().filter(function (k) { return k !== key; }); r.unshift(key);
    try { localStorage.setItem(RKEY, JSON.stringify(r.slice(0, 8))); } catch (e) {}
  }
  function href(c) { return c.href || ("#/" + c.cat + "/" + c.id); }
  function card(c) { return '<a class="cx-card" href="' + href(c) + '"><b>' + esc(c.name) + "</b><span>" + esc(c.desc) + "</span></a>"; }

  /* ---------- index ---------- */
  function renderIndex(cat, q) {
    document.title = "计算器中心 | 秋天霹雳";
    var html = '<header class="doc-head"><p class="doc-eyebrow">在线工具</p><h1>计算器中心</h1>' +
      '<p class="lead">' + LIST.length + ' 个常用计算器，财务、房产、健康、换算、日期都在这里。全部在你的浏览器里计算，不上传任何数据。</p></header>' +
      '<label class="cx-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
      '<input id="cx-q" type="search" placeholder="搜索：房贷、个税、BMI、换算…" autocomplete="off" value="' + esc(q || "") + '"></label>' +
      '<div class="cx-cats" role="group" aria-label="分类"><a class="cx-chip" href="#/" aria-pressed="' + (!cat) + '">全部</a>' +
      Object.keys(CATS).map(function (k) { return '<a class="cx-chip" href="#/' + k + '" aria-pressed="' + (cat === k) + '">' + CATS[k] + "</a>"; }).join("") +
      '</div><div id="cx-body"></div>';
    app.innerHTML = html;
    var inp = document.getElementById("cx-q");
    function body() {
      var term = inp.value.trim().toLowerCase(), out = "";
      if (term) {
        var hits = LIST.filter(function (c) { return (c.name + c.desc + (c.kw || "") + CATS[c.cat]).toLowerCase().indexOf(term) > -1; });
        out = hits.length ? '<section class="cx-sec"><div class="cx-grid">' + hits.map(card).join("") + "</div></section>"
          : '<p class="cx-empty">没有找到“' + esc(inp.value) + '”，换个关键词试试。</p>';
      } else {
        if (!cat) {
          var rec = recent().map(function (k) { return byId[k]; }).filter(Boolean);
          if (rec.length) out += '<section class="cx-sec"><h2>最近使用</h2><div class="cx-grid">' + rec.map(card).join("") + "</div></section>";
        }
        Object.keys(CATS).forEach(function (k) {
          if (cat && cat !== k) return;
          var items = LIST.filter(function (c) { return c.cat === k; });
          out += '<section class="cx-sec"><h2>' + CATS[k] + " <small>" + items.length + " 个</small></h2><div class=\"cx-grid\">" + items.map(card).join("") + "</div></section>";
        });
      }
      document.getElementById("cx-body").innerHTML = out;
    }
    inp.addEventListener("input", body);
    body();
  }

  /* ---------- a calculator ---------- */
  function today() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  function defVal(f) {
    if (f.t === "date") return f.v === "today" || f.v == null ? today() : (typeof f.v === "function" ? f.v() : f.v);
    if (f.t === "list") return (f.v || []).map(function (r) { return r.slice(); });
    if (f.t === "sel") return f.v != null ? f.v : optVal(f.o[0]);
    return f.v != null ? f.v : "";
  }
  function optVal(o) { return Array.isArray(o) ? o[0] : o; }
  function optLab(o) { return Array.isArray(o) ? o[1] : o; }
  function inputHTML(f, val, name) {
    var t = f.t || "num";
    if (t === "sel") {
      if (f.o.length <= 4 && !f.drop) {
        return '<div class="cx-seg" role="group" data-k="' + name + '">' + f.o.map(function (o) {
          return '<button type="button" data-v="' + esc(optVal(o)) + '" aria-pressed="' + (String(optVal(o)) === String(val)) + '">' + esc(optLab(o)) + "</button>";
        }).join("") + "</div>";
      }
      return '<div class="cx-in"><select data-k="' + name + '">' + f.o.map(function (o) {
        return '<option value="' + esc(optVal(o)) + '"' + (String(optVal(o)) === String(val) ? " selected" : "") + ">" + esc(optLab(o)) + "</option>";
      }).join("") + "</select></div>";
    }
    if (t === "area") return '<div class="cx-in"><textarea data-k="' + name + '" placeholder="' + esc(f.ph || "") + '">' + esc(val) + "</textarea></div>";
    var type = t === "date" ? "date" : t === "dt" ? "datetime-local" : t === "text" ? "text" : "text";
    var mode = t === "num" ? ' inputmode="decimal"' : "";
    return '<div class="cx-in' + (f.u ? " has-u" : "") + '"><input type="' + type + '"' + mode + ' data-k="' + name + '" value="' + esc(val) + '" placeholder="' + esc(f.ph || "") + '" autocomplete="off">' +
      (f.u ? '<span class="u">' + esc(f.u) + "</span>" : "") + "</div>";
  }
  function listHTML(f, rows) {
    var n = f.cols.length;
    return '<div class="cx-list" data-list="' + f.k + '" style="--n:' + n + '"><div class="cx-row-h">' + f.cols.map(function (c) { return "<span>" + esc(c.l) + "</span>"; }).join("") + "<span></span></div>" +
      rows.map(function (r, i) {
        return '<div class="cx-row">' + f.cols.map(function (c, j) { return inputHTML(c, r[j] == null ? "" : r[j], f.k + "." + i + "." + j); }).join("") +
          '<button type="button" class="cx-x" data-del="' + f.k + "." + i + '" aria-label="删除">×</button></div>';
      }).join("") +
      '<button type="button" class="cx-add" data-add="' + f.k + '">+ 添加一行</button></div>';
  }

  function num(x) { if (typeof x === "number") return x; var s = String(x == null ? "" : x).replace(/[,，\s]/g, ""); return s === "" ? NaN : Number(s); }

  function renderCalc(c) {
    document.title = c.name + " | 计算器中心";
    pushRecent(c.cat + "/" + c.id);
    var state = {};
    c.fields.forEach(function (f) { state[f.k] = defVal(f); });

    app.innerHTML = '<a class="cx-back" href="#/' + c.cat + '">← ' + CATS[c.cat] + '</a>' +
      '<header class="doc-head"><p class="doc-eyebrow">' + CATS[c.cat] + "</p><h1>" + esc(c.name) + '</h1><p class="lead">' + esc(c.desc) + "</p></header>" +
      '<div class="cx-tool"><section class="cx-box"><form class="cx-form" id="cx-form" onsubmit="return false"></form></section>' +
      '<section class="cx-box cx-out" id="cx-out" aria-live="polite"></section></div>' +
      (c.about ? '<p class="cx-note" style="margin-top:22px">' + c.about + "</p>" : "") +
      related(c);
    var form = document.getElementById("cx-form"), out = document.getElementById("cx-out");

    function drawForm() {
      form.innerHTML = c.fields.map(function (f) {
        if (f.show && !f.show(vals())) return "";
        var inner = f.t === "list" ? listHTML(f, state[f.k]) : inputHTML(f, state[f.k], f.k);
        return '<div class="cx-fld"><span>' + esc(f.l) + "</span>" + inner + (f.hint ? '<p class="cx-hint">' + esc(f.hint) + "</p>" : "") + "</div>";
      }).join("");
    }
    function vals() {
      var v = {};
      c.fields.forEach(function (f) {
        var s = state[f.k], t = f.t || "num";
        if (t === "num") v[f.k] = num(s);
        else if (t === "list") v[f.k] = s.map(function (r) { return r.map(function (x, j) { return (f.cols[j].t || "num") === "num" ? num(x) : x; }); });
        else if (t === "sel" && typeof optVal(f.o[0]) === "number") v[f.k] = Number(s);
        else v[f.k] = s;
      });
      return v;
    }
    function draw() {
      var r;
      try { r = c.run(vals()); } catch (e) { r = { err: typeof e === "string" ? e : "请检查输入" }; if (typeof e !== "string" && window.console) console.error(e); }
      if (!r) { out.innerHTML = '<p class="cx-note">填写左侧数据后自动计算。</p>'; return; }
      if (r.err) { out.innerHTML = '<h3>结果</h3><p class="cx-err">' + esc(r.err) + "</p>"; return; }
      var h = "<h3>结果</h3>";
      if (r.big) h += '<div class="cx-big-l">' + esc(r.big[0]) + '</div><div class="cx-big">' + esc(r.big[1]) + "</div>";
      if (r.tag) h += '<span class="cx-tag">' + esc(r.tag) + "</span>";
      if (r.kv && r.kv.length) h += '<dl class="cx-kv">' + r.kv.map(function (p) { return "<div><dt>" + esc(p[0]) + "</dt><dd>" + esc(p[1]) + "</dd></div>"; }).join("") + "</dl>";
      if (r.table) h += '<div class="cx-tbl"><table><thead><tr>' + r.table.h.map(function (x) { return "<th>" + esc(x) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        r.table.r.map(function (row) { return "<tr>" + row.map(function (x) { return "<td>" + esc(x) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
      if (r.note) h += '<p class="cx-note">' + esc(r.note) + "</p>";
      out.innerHTML = h;
    }
    function setPath(path, value) {
      var p = path.split(".");
      if (p.length === 1) state[p[0]] = value; else state[p[0]][+p[1]][+p[2]] = value;
    }
    form.addEventListener("input", function (e) {
      var k = e.target.getAttribute("data-k"); if (!k) return;
      setPath(k, e.target.value);
      if (c.fields.some(function (f) { return f.show; }) && e.target.tagName === "SELECT") { drawForm(); }
      draw();
    });
    form.addEventListener("change", function (e) {
      var k = e.target.getAttribute("data-k"); if (!k) return;
      setPath(k, e.target.value);
      if (c.fields.some(function (f) { return f.show; })) drawForm();
      draw();
    });
    form.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var seg = b.parentNode.getAttribute("data-k");
      if (seg) { setPath(seg, b.getAttribute("data-v")); drawForm(); draw(); return; }
      var add = b.getAttribute("data-add");
      if (add) { var f = c.fields.filter(function (x) { return x.k === add; })[0]; state[add].push(f.cols.map(function (col) { return col.nv != null ? col.nv : ""; })); drawForm(); draw(); return; }
      var del = b.getAttribute("data-del");
      if (del) { var p = del.split("."); state[p[0]].splice(+p[1], 1); drawForm(); draw(); }
    });
    drawForm(); draw();
    window.scrollTo(0, 0);
  }
  function related(c) {
    var same = LIST.filter(function (x) { return x.cat === c.cat && x !== c; }).slice(0, 6);
    if (!same.length) return "";
    return '<section class="cx-sec"><h2>同类计算器</h2><div class="cx-grid">' + same.map(card).join("") + "</div></section>";
  }

  function route() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, "")), parts = h.split("/").filter(Boolean);
    if (parts.length >= 2 && byId[parts[0] + "/" + parts[1]]) return renderCalc(byId[parts[0] + "/" + parts[1]]);
    renderIndex(CATS[parts[0]] ? parts[0] : "", "");
    if (parts.length) window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
