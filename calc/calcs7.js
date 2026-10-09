/* Calculator registry, batch 7 (2026-10). Uses helpers exported by calcs.js / calcs2.js. */
(function () {
  "use strict";
  var H = window.CX.h, add = H.add, ok = H.ok, need = H.need, pos = H.pos, f = H.f, g = H.g, y = H.y, wy = H.wy, pct = H.pct,
    D = H.D, iso = H.iso, WK = H.WK, dayDiff = H.dayDiff, addMonths = H.addMonths, pmt = H.pmt, unit = H.unit;
  function nums(s) { var a = String(s).split(/[\s,，;；]+/).filter(Boolean).map(Number); if (!a.length || a.some(isNaN)) throw "请输入数字，用逗号或空格分隔"; return a; }
  function today() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
  function nowDT() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
  function plus(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function day(d) { return iso(d) + " " + WK[d.getDay()]; }
  function hms(s) { s = Math.round(s); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); }
  function parseT(s) { var p = String(s).trim().split(/[:：]/).map(Number); if (!p.length || p.some(isNaN) || p.length > 3) throw "时间格式如 1:45:30 或 25:00"; return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? p[0] * 60 + p[1] : p[0] * 60; }
  function irr(cf) { var lo = -0.99, hi = 1; function npv(r) { return cf.reduce(function (s, c, i) { return s + c / Math.pow(1 + r, i); }, 0); } if (npv(lo) * npv(hi) > 0) return NaN; for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (npv(lo) * npv(m) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; }
  function list(s) { return String(s).split(/[\n,，、;；\s]+/).map(function (x) { return x.trim(); }).filter(Boolean); }

  /* ======================= 财务理财 ======================= */
  add({ cat: "finance", id: "insurance-irr", name: "储蓄险 / 年金险 IRR", desc: "交几年保费、第几年领多少，算真实年化收益（IRR）", kw: "储蓄险 年金险 增额终身寿 irr 收益",
    fields: [{ k: "p", l: "每年保费", u: "元", v: 20000 }, { k: "n", l: "交费年数", u: "年", v: 10 }, { k: "m", l: "第几年末领取", u: "年", v: 20 }, { k: "s", l: "领取金额（现金价值）", u: "元", v: 300000 }],
    run: function (v) { pos(v.p, v.n, v.m, v.s); if (v.m < v.n) throw "领取年份应不早于交费结束"; var cf = []; for (var i = 0; i <= v.m; i++) cf.push((i < v.n ? -v.p : 0) + (i === v.m ? v.s : 0)); var r = irr(cf); return { big: ["IRR", ok(r) ? pct(r) : "无法计算"], kv: [["总保费", y(v.p * v.n)], ["领取 / 保费", g(v.s / (v.p * v.n), 4) + " 倍"]], note: "保费按每年年初交，领取按第 m 年末。对比同期国债、大额存单利率再决定。" }; } });

  add({ cat: "finance", id: "net-worth", name: "家庭净资产计算器", desc: "列出资产和负债，算净资产和负债率", kw: "净资产 资产负债 家庭财务",
    fields: [{ k: "a", l: "资产 / 负债（负债填负数）", t: "list", cols: [{ k: "n", l: "项目", t: "text", nv: "" }, { k: "x", l: "金额（元）", nv: "" }], v: [["房产市值", 3000000], ["存款理财", 300000], ["汽车", 100000], ["房贷余额", -1500000], ["车贷", -50000]] }],
    run: function (v) { var rs = v.a.filter(function (r) { return ok(r[1]); }); if (!rs.length) throw "至少一项"; var A = 0, L = 0; rs.forEach(function (r) { if (r[1] >= 0) A += r[1]; else L -= r[1]; }); return { big: ["净资产", wy(A - L)], kv: [["总资产", wy(A)], ["总负债", wy(L)], ["资产负债率", A ? pct(L / A, 1) : "—"]], note: "资产负债率一般建议控制在 50% 以下。" }; } });

  add({ cat: "finance", id: "holding-period-return", name: "持有期收益 / 年化", desc: "按买入卖出日期和价格算持有收益率和年化收益率", kw: "持有期 年化 收益率 买入 卖出",
    fields: [{ k: "b", l: "买入金额", u: "元", v: 10000 }, { k: "s", l: "卖出金额（含分红）", u: "元", v: 11200 }, { k: "d1", l: "买入日期", t: "date", v: "2025-03-01" }, { k: "d2", l: "卖出日期", t: "date", v: "today" }],
    run: function (v) { pos(v.b); need(v.s); var n = dayDiff(D(v.d1), D(v.d2)); if (n <= 0) throw "卖出日期需晚于买入"; var r = v.s / v.b - 1; return { big: ["年化收益", pct(Math.pow(v.s / v.b, 365 / n) - 1)], kv: [["持有收益率", pct(r)], ["持有", n + " 天"], ["单利年化", pct(r * 365 / n)]] }; } });

  add({ cat: "finance", id: "savings-rate", name: "储蓄率 / 财务自由年限", desc: "按收入和支出算储蓄率，以及攒够 25 倍年支出要多少年", kw: "储蓄率 财务自由 fire 4%法则",
    fields: [{ k: "i", l: "年税后收入", u: "万元", v: 30 }, { k: "e", l: "年支出", u: "万元", v: 15 }, { k: "c", l: "已有可投资资产", u: "万元", v: 50 }, { k: "r", l: "投资实际年化（扣通胀）", u: "%", v: 4 }],
    run: function (v) { pos(v.i, v.e); need(v.c, v.r); var s = (v.i - v.e) / v.i, t = v.e * 25, a = v.c, n = 0; while (a < t && n < 100) { a = a * (1 + v.r / 100) + (v.i - v.e); n++; } return { big: ["储蓄率", pct(s, 1)], kv: [["目标资产（25 倍支出）", f(t, 0) + " 万元"], ["约需", n >= 100 ? "100 年以上" : n + " 年"]], note: "4% 法则：每年取用资产的 4%，大概率能长期维持。" }; } });

  add({ cat: "finance", id: "loan-refinance", name: "贷款转贷 / 置换划算吗", desc: "换成低利率贷款后能省多少，扣掉费用几个月回本", kw: "转贷 置换 利率 降息",
    fields: [{ k: "b", l: "剩余本金", u: "万元", v: 100 }, { k: "n", l: "剩余期限", u: "月", v: 300 }, { k: "r1", l: "现利率", u: "%", v: 4.1 }, { k: "r2", l: "新利率", u: "%", v: 3.1 }, { k: "fee", l: "转贷总费用（过桥、评估、违约金等）", u: "元", v: 10000 }],
    run: function (v) { pos(v.b, v.n); need(v.r1, v.r2, v.fee); var P = v.b * 1e4, a = pmt(P, v.r1 / 1200, v.n), b = pmt(P, v.r2 / 1200, v.n), sv = (a - b) * v.n - v.fee; return { big: [sv > 0 ? "净省" : "不划算", wy(Math.abs(sv))], kv: [["每月少还", y(a - b)], ["回本", a > b ? Math.ceil(v.fee / (a - b)) + " 个月" : "—"]] }; } });

  add({ cat: "finance", id: "private-loan-cap", name: "民间借贷利率上限", desc: "按一年期 LPR 的 4 倍判断借款利率是否受法律保护，算利息", kw: "民间借贷 利率上限 lpr 4倍 借条",
    fields: [{ k: "a", l: "借款金额", u: "元", v: 100000 }, { k: "r", l: "约定年利率", u: "%", v: 15 }, { k: "lpr", l: "一年期 LPR", u: "%", v: 3.0 }, { k: "m", l: "借款期限", u: "月", v: 12 }],
    run: function (v) { pos(v.a, v.m); need(v.r, v.lpr); var cap = v.lpr * 4, eff = Math.min(v.r, cap); return { big: [v.r <= cap ? "在保护范围内" : "超出部分不受保护", "上限 " + f(cap, 2) + "%"], kv: [["约定利息", y(v.a * v.r / 100 * v.m / 12)], ["法院支持利息最多", y(v.a * eff / 100 * v.m / 12)], ["月利率约", f(v.r / 12, 3) + "%"]], note: "依据最高法《关于审理民间借贷案件适用法律若干问题的规定》，以合同成立时一年期 LPR 的 4 倍为上限。LPR 以全国银行间同业拆借中心公布为准。" }; } });

  add({ cat: "finance", id: "installment-vs-cash", name: "分期还是全款", desc: "全款优惠 vs 免息 / 有息分期，考虑钱放着的收益后哪个划算", kw: "分期 全款 免息 白条 花呗",
    fields: [{ k: "p", l: "商品价格", u: "元", v: 6000 }, { k: "d", l: "全款优惠", u: "元", v: 200 }, { k: "n", l: "分期期数", v: 12 }, { k: "fr", l: "每期手续费率", u: "%", v: 0 }, { k: "r", l: "闲钱年化收益", u: "%", v: 1.5 }],
    run: function (v) { pos(v.p, v.n); need(v.d, v.fr, v.r); var per = v.p / v.n + v.p * v.fr / 100, mr = v.r / 1200, pv = 0; for (var i = 1; i <= v.n; i++) pv += per / Math.pow(1 + mr, i); var cash = v.p - v.d; return { big: [pv < cash ? "分期更划算" : "全款更划算", "差 " + y(Math.abs(cash - pv))], kv: [["分期总付", y(per * v.n)], ["分期折现成本", y(pv)], ["全款成本", y(cash)]] }; } });

  /* ======================= 房产置业 ======================= */
  add({ cat: "property", id: "property-tax-pilot", name: "上海房产税估算", desc: "上海个人住房房产税试点：按人均 60 ㎡ 免税面积算应缴税额", kw: "房产税 上海 试点 人均60平",
    fields: [{ k: "a", l: "新购住房面积（含家庭已有住房合计）", u: "㎡", v: 180 }, { k: "n", l: "家庭人数", v: 2 }, { k: "p", l: "新购住房单价", u: "元/㎡", v: 70000 }, { k: "avg", l: "上年新建商品住房均价 × 2", u: "元/㎡", v: 150000 }],
    run: function (v) { pos(v.a, v.n, v.p); need(v.avg); var tx = Math.max(v.a - 60 * v.n, 0), rate = v.p < v.avg ? .004 : .006, tax = Math.min(tx, v.a) * v.p * .7 * rate; return { big: ["每年约", y(tax)], kv: [["应税面积", f(tx, 1) + " ㎡"], ["适用税率", rate * 100 + "%"]], note: "仅适用于上海试点：本市居民家庭新购第二套及以上住房、非本市居民新购住房征收，计税依据为交易价 × 70%。重庆规则不同。" }; } });

  add({ cat: "property", id: "price-to-income", name: "房价收入比", desc: "房价是家庭年收入的多少倍，不吃不喝几年能买", kw: "房价收入比 买房 几年",
    fields: [{ k: "p", l: "房屋总价", u: "万元", v: 300 }, { k: "i", l: "家庭年收入", u: "万元", v: 30 }, { k: "s", l: "年储蓄率", u: "%", v: 40 }],
    run: function (v) { pos(v.p, v.i); need(v.s); var r = v.p / v.i; return { big: ["房价收入比", f(r, 1)], kv: [["不吃不喝", f(r, 1) + " 年"], ["按储蓄率攒全款", v.s ? f(r / (v.s / 100), 1) + " 年" : "—"], ["攒首付（30%）", v.s ? f(r * .3 / (v.s / 100), 1) + " 年" : "—"]], note: "国际上 3–6 倍被认为较合理；国内一线城市多在 20 倍以上。" }; } });

  add({ cat: "property", id: "parking-buy-vs-rent", name: "车位买还是租", desc: "买车位总成本与长期租车位对比", kw: "车位 买 租 产权车位",
    fields: [{ k: "p", l: "车位售价", u: "万元", v: 20 }, { k: "m", l: "车位管理费", u: "元/月", v: 100 }, { k: "rent", l: "租车位月租", u: "元", v: 600 }, { k: "n", l: "打算用几年", u: "年", v: 10 }, { k: "r", l: "闲钱年化收益", u: "%", v: 2.5 }, { k: "rv", l: "到时卖出价", u: "万元", v: 15 }],
    run: function (v) { pos(v.p, v.n); need(v.m, v.rent, v.r, v.rv); var opp = v.p * 1e4 * (Math.pow(1 + v.r / 100, v.n) - 1), buy = v.p * 1e4 - v.rv * 1e4 + opp + v.m * 12 * v.n, rent = v.rent * 12 * v.n; return { big: [buy < rent ? "买更划算" : "租更划算", "差 " + wy(Math.abs(buy - rent))], kv: [["买的总成本", wy(buy)], ["租的总成本", wy(rent)], ["其中资金机会成本", wy(opp)]], note: "很多车位只有使用权、难转手，卖出价要保守估计。" }; } });

  add({ cat: "property", id: "house-flip-profit", name: "买卖房屋净利润", desc: "扣除税费、中介、装修和资金成本后的买卖净赚", kw: "买卖 差价 投资房 利润",
    fields: [{ k: "b", l: "买入价", u: "万元", v: 200 }, { k: "bt", l: "买入税费 + 中介", u: "%", v: 3 }, { k: "r", l: "装修投入", u: "万元", v: 15 }, { k: "h", l: "持有期间利息 + 物业等", u: "万元", v: 8 }, { k: "s", l: "卖出价", u: "万元", v: 250 }, { k: "st", l: "卖出税费 + 中介", u: "%", v: 4 }],
    run: function (v) { pos(v.b); need(v.bt, v.r, v.h, v.s, v.st); var cost = v.b * (1 + v.bt / 100) + v.r + v.h, net = v.s * (1 - v.st / 100) - cost; return { big: [net >= 0 ? "净赚" : "净亏", f(Math.abs(net), 2) + " 万元"], kv: [["总投入", f(cost, 2) + " 万元"], ["回报率", pct(net / cost, 1)], ["保本卖价", f(cost / (1 - v.st / 100), 1) + " 万元"]] }; } });

  add({ cat: "property", id: "mortgage-extra-monthly", name: "每月多还一点能提前几年", desc: "房贷每月额外多还固定金额，能提前多久还清、省多少利息", kw: "每月多还 提前还清 房贷",
    fields: [{ k: "b", l: "剩余本金", u: "万元", v: 120 }, { k: "r", l: "年利率", u: "%", v: 3.1 }, { k: "n", l: "剩余期限", u: "月", v: 300 }, { k: "x", l: "每月多还", u: "元", v: 1000 }],
    run: function (v) { pos(v.b, v.n); need(v.r, v.x); var P = v.b * 1e4, r = v.r / 1200, m = pmt(P, r, v.n), bal = P, k = 0, it = 0; while (bal > .01 && k < v.n) { var i = bal * r; it += i; bal -= Math.min(m + v.x - i, bal); k++; } return { big: ["提前", f((v.n - k) / 12, 1) + " 年还清"], kv: [["新期限", k + " 个月"], ["省利息", wy(m * v.n - P - it)], ["原月供", y(m)]], note: "需银行支持按月多还，或攒到一定金额做部分提前还款并选择缩短年限。" }; } });

  /* ======================= 汽车出行 ======================= */
  add({ cat: "auto", id: "fuel-grade", name: "92 号与 95 号油费差", desc: "加 95 号比 92 号每月、每年多花多少", kw: "92 95 汽油 标号",
    fields: [{ k: "a", l: "92 号油价", u: "元/L", v: 7.2 }, { k: "b", l: "95 号油价", u: "元/L", v: 7.7 }, { k: "c", l: "百公里油耗", u: "L", v: 7.5 }, { k: "km", l: "每月里程", u: "km", v: 1500 }],
    run: function (v) { need(v.a, v.b); pos(v.c, v.km); var l = v.c * v.km / 100; return { big: ["每月多花", y((v.b - v.a) * l)], kv: [["每年多花", y((v.b - v.a) * l * 12)], ["每升差价", y(v.b - v.a)]], note: "按车辆说明书和油箱盖标注加油即可，压缩比高的涡轮车才需要 95 号。" }; } });

  add({ cat: "auto", id: "garage-fit", name: "车库 / 车位能停下吗", desc: "车长宽高和车位尺寸对比，看前后左右余量和开门空间", kw: "车位 尺寸 停车 车长",
    fields: [{ k: "cl", l: "车长", u: "mm", v: 4900 }, { k: "cw", l: "车宽（不含后视镜）", u: "mm", v: 1900 }, { k: "ch", l: "车高", u: "mm", v: 1700 }, { k: "gl", l: "车位长", u: "mm", v: 5300 }, { k: "gw", l: "车位宽", u: "mm", v: 2500 }, { k: "gh", l: "限高（地面车位填 0）", u: "mm", v: 2200 }],
    run: function (v) { pos(v.cl, v.cw, v.ch, v.gl, v.gw); need(v.gh); var L = v.gl - v.cl, W = (v.gw - v.cw) / 2, Hh = v.gh ? v.gh - v.ch : null, okk = L >= 300 && W >= 250 && (Hh == null || Hh >= 100); return { big: ["结论", okk ? "停得下" : L < 0 || W < 0 || (Hh != null && Hh < 0) ? "停不下" : "很勉强"], kv: [["前后余量", L + " mm"], ["每侧余量", f(W, 0) + " mm"], ["头顶余量", Hh == null ? "—" : Hh + " mm"]], note: "正常开门每侧至少需要 600 mm；国标小型车位一般 2.5 × 5.3 m。" }; } });

  add({ cat: "auto", id: "battery-health", name: "电车电池健康度（SOH）", desc: "按新车和现在满电续航（或容量）估算电池衰减", kw: "电池衰减 soh 电池健康 续航",
    fields: [{ k: "a", l: "新车时满电续航 / 容量", v: 520 }, { k: "b", l: "现在满电续航 / 容量（同工况）", v: 470 }, { k: "km", l: "已行驶", u: "km", v: 60000 }, { k: "y", l: "车龄", u: "年", v: 3 }],
    run: function (v) { pos(v.a, v.b); need(v.km, v.y); var s = v.b / v.a; return { big: ["SOH 约", pct(s, 0)], tag: s >= .9 ? "健康" : s >= .8 ? "正常衰减" : s >= .7 ? "衰减较多" : "低于质保线", kv: [["衰减", pct(1 - s, 1)], ["每万公里衰减", v.km ? pct((1 - s) / v.km * 1e4, 2) : "—"]], note: "国家要求三电质保不低于 8 年或 12 万公里，多数车企承诺衰减不超过 30%。表显续航受算法影响，4S 店检测更准。" }; } });

  add({ cat: "auto", id: "ev-trip-stops", name: "电车长途充电规划", desc: "按续航、出发电量和充电策略算途中要充几次、多久", kw: "长途 充电 电车 补能",
    fields: [{ k: "d", l: "全程", u: "km", v: 900 }, { k: "r", l: "高速满电实际续航", u: "km", v: 420 }, { k: "s", l: "出发电量", u: "%", v: 95 }, { k: "lo", l: "到站剩余", u: "%", v: 15 }, { k: "hi", l: "每次充到", u: "%", v: 80 }, { k: "b", l: "电池容量", u: "kWh", v: 75 }, { k: "p", l: "快充平均功率", u: "kW", v: 90 }],
    run: function (v) { pos(v.d, v.r, v.b, v.p); need(v.s, v.lo, v.hi); if (v.hi <= v.lo) throw "充到的电量要高于到站剩余"; var first = v.r * (v.s - v.lo) / 100, leg = v.r * (v.hi - v.lo) / 100, left = Math.max(v.d - first, 0), stops = Math.ceil(left / leg), each = v.b * (v.hi - v.lo) / 100 / v.p * 60; return { big: ["充电", stops + " 次"], kv: [["每次约", f(each, 0) + " 分钟"], ["总充电时间", f(stops * each, 0) + " 分钟"], ["首段可跑", f(first, 0) + " km"], ["之后每段", f(leg, 0) + " km"]], note: "节假日高速服务区可能排队，建议多留一段余量。" }; } });

  add({ cat: "auto", id: "ebike-cost", name: "电动自行车充电费用", desc: "电动车每次充电多少钱、每百公里多少钱", kw: "电动车 电瓶车 充电 电费",
    fields: [{ k: "v", l: "电池电压", u: "V", v: 48 }, { k: "ah", l: "电池容量", u: "Ah", v: 24 }, { k: "km", l: "满电续航", u: "km", v: 60 }, { k: "p", l: "电价", u: "元/kWh", v: 0.6 }],
    run: function (v) { pos(v.v, v.ah, v.km); need(v.p); var k = v.v * v.ah / 1000 / .85; return { big: ["每次充满", y(k * v.p)], kv: [["耗电", f(k, 2) + " 度"], ["每百公里", y(k * v.p / v.km * 100)]], note: "按充电效率 85%。新国标电动自行车最高 25 km/h、整车不超过 55 kg（锂电）；严禁在楼道和室内充电。" }; } });

  add({ cat: "auto", id: "travel-time-compare", name: "自驾 vs 高铁 门到门对比", desc: "把去车站、候车、换乘都算上，比较自驾和高铁的时间和花费", kw: "自驾 高铁 对比 出行方式",
    fields: [{ k: "d", l: "驾车里程", u: "km", v: 350 }, { k: "s", l: "驾车平均速度", u: "km/h", v: 85 }, { k: "dc", l: "自驾总费用（油/电 + 过路费）", u: "元", v: 380 }, { k: "t", l: "高铁乘车时间", u: "分钟", v: 110 }, { k: "e", l: "去车站 + 候车 + 出站到目的地", u: "分钟", v: 100 }, { k: "tc", l: "高铁票价（单人）", u: "元", v: 220 }, { k: "n", l: "人数", v: 2 }],
    run: function (v) { pos(v.d, v.s, v.n); need(v.dc, v.t, v.e, v.tc); var dr = v.d / v.s * 60, tr = v.t + v.e; return { table: { h: ["方式", "门到门用时", "总花费（元）"], r: [["自驾", f(dr / 60, 1) + " 小时", f(v.dc, 0)], ["高铁", f(tr / 60, 1) + " 小时", f(v.tc * v.n, 0)]] }, kv: [[dr < tr ? "自驾快" : "高铁快", f(Math.abs(dr - tr), 0) + " 分钟"], [v.dc < v.tc * v.n ? "自驾省" : "高铁省", y(Math.abs(v.dc - v.tc * v.n))]] }; } });

  /* ======================= 健康健身 ======================= */
  add({ cat: "health", id: "race-predictor", name: "跑步成绩预测", desc: "按一个距离的成绩预测 5 公里、10 公里、半马、全马成绩（Riegel 公式）", kw: "马拉松 成绩预测 半马 全马 跑步",
    fields: [{ k: "d", l: "已知距离", u: "km", v: 10 }, { k: "t", l: "成绩（时:分:秒）", t: "text", v: "55:00" }],
    run: function (v) { pos(v.d); var T = parseT(v.t); if (T <= 0) throw "请输入成绩"; return { table: { h: ["距离", "预测成绩", "配速 /km"], r: [[5, "5 公里"], [10, "10 公里"], [21.0975, "半程马拉松"], [42.195, "全程马拉松"]].map(function (x) { var t = T * Math.pow(x[0] / v.d, 1.06); return [x[1], hms(t), hms(t / x[0])]; }) }, note: "预测假设有相应距离的训练量，全马通常比预测慢 5%–10%。" }; } });

  add({ cat: "health", id: "swim-pace", name: "游泳配速计算器", desc: "按距离和用时算每 100 米配速，预测其他距离成绩", kw: "游泳 配速 100米",
    fields: [{ k: "d", l: "距离", u: "米", v: 1000 }, { k: "t", l: "用时（时:分:秒 或 分:秒）", t: "text", v: "25:00" }],
    run: function (v) { pos(v.d); var T = parseT(v.t); if (T <= 0) throw "请输入用时"; var p = T / v.d * 100; return { big: ["配速", hms(p) + " /100m"], kv: [["速度", f(v.d / T * 3.6, 2) + " km/h"], ["1500 米预计", hms(T * Math.pow(1500 / v.d, 1.06))], ["3.8 公里（铁三全程）", hms(T * Math.pow(3800 / v.d, 1.06))]] }; } });

  add({ cat: "health", id: "skinfold", name: "皮褶厚度测体脂（3 点法）", desc: "用皮脂钳测 3 个部位，按 Jackson-Pollock 公式算体脂率", kw: "皮脂钳 皮褶 体脂率",
    fields: [{ k: "s", l: "性别", t: "sel", o: ["男", "女"] }, { k: "a", l: "年龄", u: "岁", v: 30 }, { k: "x1", l: "男：胸部 / 女：肱三头肌", u: "mm", v: 12 }, { k: "x2", l: "男：腹部 / 女：髂骨上", u: "mm", v: 20 }, { k: "x3", l: "大腿", u: "mm", v: 15 }],
    run: function (v) { pos(v.a, v.x1, v.x2, v.x3); var S = v.x1 + v.x2 + v.x3, bd = v.s === "男" ? 1.10938 - .0008267 * S + .0000016 * S * S - .0002574 * v.a : 1.0994921 - .0009929 * S + .0000023 * S * S - .0001392 * v.a, bf = 495 / bd - 450; return { big: ["体脂率", f(bf, 1) + "%"], kv: [["皮褶总和", S + " mm"], ["身体密度", f(bd, 4) + " g/cm³"]], note: "在身体右侧测量，每个部位测 2–3 次取平均。" }; } });

  add({ cat: "health", id: "sodium-salt", name: "钠与盐换算", desc: "营养成分表上的钠换算成食盐克数，对照每日建议", kw: "钠 盐 营养成分表 nrv",
    fields: [{ k: "na", l: "钠含量", u: "mg（每 100g 或每份）", v: 800 }, { k: "q", l: "吃了多少", u: "g（按每份填 100）", v: 100 }],
    run: function (v) { need(v.na, v.q); var na = v.na * v.q / 100, salt = na * 2.54 / 1000; return { big: ["相当于盐", f(salt, 2) + " g"], kv: [["钠", f(na, 0) + " mg"], ["占每日建议（5 g 盐）", pct(salt / 5, 0)], ["钠 NRV%", pct(na / 2000, 0)]], note: "《中国居民膳食指南（2022）》建议成人每天食盐不超过 5 g。1 g 钠 ≈ 2.54 g 盐。" }; } });

  add({ cat: "health", id: "vitamin-units", name: "维生素单位换算", desc: "维生素 D、A、E 的 IU 与微克、毫克互换", kw: "维生素d iu 微克 维生素a",
    fields: [{ k: "t", l: "维生素", t: "sel", o: [[0.025, "维生素 D（1 IU = 0.025 μg）"], [0.3, "维生素 A 视黄醇（1 IU = 0.3 μg）"], [0.67, "维生素 E 天然（1 IU = 0.67 mg）"], [0.45, "维生素 E 合成（1 IU = 0.45 mg）"]], v: 0.025 }, { k: "m", l: "已知", t: "sel", o: ["IU", "μg / mg"] }, { k: "x", l: "数值", v: 1000 }],
    run: function (v) { pos(v.x); var u = v.t >= .45 ? "mg" : "μg", r = v.m === "IU" ? v.x * v.t : v.x / v.t; return { big: ["换算结果", v.m === "IU" ? g(r, 6) + " " + u : g(r, 6) + " IU"], note: v.t === .025 ? "成人维生素 D 推荐 400 IU（10 μg）/天，可耐受上限 2000 IU（50 μg）。" : null }; } });

  add({ cat: "health", id: "myopia-diopter", name: "近视度数 / 屈光度", desc: "度数与屈光度 D 互换，算等效球镜和近视程度", kw: "近视 度数 散光 屈光度 等效球镜",
    fields: [{ k: "s", l: "球镜（近视度数，近视填负）", u: "度", v: -350 }, { k: "c", l: "柱镜（散光度数，填负）", u: "度", v: -75 }],
    run: function (v) { need(v.s, v.c); var se = v.s + v.c / 2, a = Math.abs(se); return { big: ["等效球镜", g(se, 4) + " 度（" + g(se / 100, 4) + " D）"], tag: se >= 0 ? "非近视" : a < 300 ? "低度近视" : a <= 600 ? "中度近视" : "高度近视", kv: [["球镜", g(v.s / 100, 4) + " D"], ["柱镜", g(v.c / 100, 4) + " D"]], note: "等效球镜 = 球镜 + 柱镜 ÷ 2。高度近视建议每年查眼底。" }; } });

  add({ cat: "health", id: "meal-calories", name: "三餐热量分配", desc: "按每日总热量分配早、午、晚餐和加餐", kw: "三餐 热量 分配 减脂餐",
    fields: [{ k: "k", l: "每日总热量", u: "kcal", v: 1800 }, { k: "m", l: "方案", t: "sel", o: ["三餐 3:4:3", "三餐 + 加餐"] }],
    run: function (v) { pos(v.k); var P = v.m === "三餐 3:4:3" ? [["早餐", .3], ["午餐", .4], ["晚餐", .3]] : [["早餐", .25], ["上午加餐", .1], ["午餐", .35], ["下午加餐", .05], ["晚餐", .25]]; return { table: { h: ["餐次", "比例", "热量（kcal）"], r: P.map(function (p) { return [p[0], pct(p[1], 0), f(v.k * p[1], 0)]; }) } }; } });

  /* ======================= 数学计算 ======================= */
  add({ cat: "math", id: "bigint", name: "大数计算器", desc: "任意位数整数的加减乘除、取余和乘方，精确不丢位", kw: "大数 高精度 大整数",
    fields: [{ k: "a", l: "整数 A", t: "text", v: "123456789012345678901234567890" }, { k: "op", l: "运算", t: "sel", o: ["+", "−", "×", "÷（整除）", "取余", "A 的 B 次方"] }, { k: "b", l: "整数 B", t: "text", v: "987654321" }],
    run: function (v) { var s1 = String(v.a).replace(/[,\s]/g, ""), s2 = String(v.b).replace(/[,\s]/g, ""); if (!/^-?\d+$/.test(s1) || !/^-?\d+$/.test(s2)) throw "请输入整数"; var A = BigInt(s1), B = BigInt(s2), r;
      switch (v.op) { case "+": r = A + B; break; case "−": r = A - B; break; case "×": r = A * B; break; case "÷（整除）": if (B === 0n) throw "除数不能为 0"; r = A / B; break; case "取余": if (B === 0n) throw "除数不能为 0"; r = A % B; break; default: if (B < 0n || B > 10000n) throw "指数 0–10000"; r = A ** B; }
      var s = r.toString(); return { big: ["结果", s.length > 60 ? s.slice(0, 30) + "…" + s.slice(-20) : s], kv: [["位数", s.replace("-", "").length], ["完整结果", s.length > 2000 ? s.slice(0, 2000) + "…" : s]] }; } });

  add({ cat: "math", id: "digit-sum", name: "数字各位和 / 数字根", desc: "各位数字之和、数字根、倒序、是否回文数", kw: "各位数字和 数字根 回文数",
    fields: [{ k: "n", l: "整数", t: "text", v: "20261009" }],
    run: function (v) { var s = String(v.n).replace(/[,\s-]/g, ""); if (!/^\d+$/.test(s)) throw "请输入非负整数"; var sum = s.split("").reduce(function (a, d) { return a + +d; }, 0), dr = +s === 0 ? 0 : 1 + (sum - 1) % 9, rev = s.split("").reverse().join(""); return { kv: [["各位和", sum], ["数字根", dr], ["位数", s.length], ["倒序", rev], ["回文数", s === rev ? "是" : "否"], ["能被 3 / 9 整除", (sum % 3 ? "否" : "是") + " / " + (sum % 9 ? "否" : "是")]] }; } });

  add({ cat: "math", id: "fibonacci", name: "斐波那契数列", desc: "第 n 项斐波那契数、前 n 项和与黄金比例逼近", kw: "斐波那契 黄金分割 数列",
    fields: [{ k: "n", l: "第几项", v: 50 }],
    run: function (v) { if (!Number.isInteger(v.n) || v.n < 1 || v.n > 5000) throw "n 为 1–5000"; var a = 0n, b = 1n; for (var i = 1; i < v.n; i++) { var t = a + b; a = b; b = t; } var s = b.toString(), sum = (function () { var x = 0n, y2 = 1n; for (var i = 0; i < v.n + 1; i++) { var t = x + y2; x = y2; y2 = t; } return (y2 - 1n).toString(); })(); return { big: ["F(" + v.n + ")", s.length > 40 ? s.slice(0, 20) + "…（" + s.length + " 位）" : s], kv: [["前 " + v.n + " 项和", sum.length > 40 ? sum.slice(0, 20) + "…" : sum], ["F(n)/F(n−1)", v.n > 1 ? (Number(b) / Number(a) || 1.618033988749895).toFixed(12) : "—"]], note: "按 F(1) = F(2) = 1。" }; } });

  add({ cat: "math", id: "pascal", name: "杨辉三角", desc: "生成前 n 行杨辉三角（帕斯卡三角）", kw: "杨辉三角 帕斯卡 二项式系数",
    fields: [{ k: "n", l: "行数", v: 10 }],
    run: function (v) { if (!Number.isInteger(v.n) || v.n < 1 || v.n > 30) throw "行数 1–30"; var rs = [], row = [1n]; for (var i = 0; i < v.n; i++) { rs.push(["第 " + i + " 行", row.join(" "), row.reduce(function (a, b) { return a + b; }, 0n).toString()]); var nx = [1n]; for (var j = 1; j < row.length; j++) nx.push(row[j - 1] + row[j]); nx.push(1n); row = nx; } return { table: { h: ["行", "系数", "和"], r: rs } }; } });

  add({ cat: "math", id: "set-ops", name: "集合运算", desc: "两个集合的并集、交集、差集和对称差", kw: "集合 并集 交集 差集",
    fields: [{ k: "a", l: "集合 A（空格或逗号分隔）", t: "text", v: "1 2 3 4 5" }, { k: "b", l: "集合 B", t: "text", v: "4 5 6 7" }],
    run: function (v) { var A = Array.from(new Set(list(v.a))), B = Array.from(new Set(list(v.b))); if (!A.length && !B.length) throw "请输入元素"; var inB = function (x) { return B.indexOf(x) >= 0; }, inA = function (x) { return A.indexOf(x) >= 0; }, fmt = function (s) { return "{ " + s.join(", ") + " }"; }; return { kv: [["A ∪ B", fmt(A.concat(B.filter(function (x) { return !inA(x); })))], ["A ∩ B", fmt(A.filter(inB))], ["A − B", fmt(A.filter(function (x) { return !inB(x); }))], ["B − A", fmt(B.filter(function (x) { return !inA(x); }))], ["对称差", fmt(A.filter(function (x) { return !inB(x); }).concat(B.filter(function (x) { return !inA(x); })))], ["|A| / |B|", A.length + " / " + B.length]] }; } });

  add({ cat: "math", id: "percentile", name: "百分位数 / 四分位数", desc: "一组数据的任意百分位、四分位数、四分位距和异常值界限", kw: "百分位 四分位 箱线图 iqr",
    fields: [{ k: "s", l: "数据", t: "area", v: "12, 15, 18, 22, 25, 28, 31, 35, 40, 95" }, { k: "p", l: "百分位", u: "%", v: 90 }],
    run: function (v) { var a = nums(v.s).sort(function (x, z) { return x - z; }); need(v.p); function q(p) { var i = (a.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); } var q1 = q(.25), q3 = q(.75), iqr = q3 - q1, lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr, out = a.filter(function (x) { return x < lo || x > hi; }); return { big: ["P" + v.p, g(q(Math.min(Math.max(v.p, 0), 100) / 100), 8)], kv: [["Q1 / 中位数 / Q3", g(q1, 6) + " / " + g(q(.5), 6) + " / " + g(q3, 6)], ["四分位距 IQR", g(iqr, 6)], ["异常值界限", g(lo, 6) + " ~ " + g(hi, 6)], ["异常值", out.length ? out.join(", ") : "无"]] }; } });

  add({ cat: "math", id: "line-intersection", name: "两直线交点", desc: "两条直线 y = kx + b 的交点和夹角", kw: "直线 交点 夹角",
    fields: [{ k: "k1", l: "直线 1 斜率 k₁", v: 2 }, { k: "b1", l: "截距 b₁", v: 1 }, { k: "k2", l: "直线 2 斜率 k₂", v: -1 }, { k: "b2", l: "截距 b₂", v: 4 }],
    run: function (v) { need(v.k1, v.b1, v.k2, v.b2); if (v.k1 === v.k2) return { big: [v.b1 === v.b2 ? "重合" : "平行", "没有唯一交点"] }; var x = (v.b2 - v.b1) / (v.k1 - v.k2), ang = Math.abs(Math.atan(v.k1) - Math.atan(v.k2)) * 180 / Math.PI; if (ang > 90) ang = 180 - ang; return { big: ["交点", "(" + g(x, 8) + ", " + g(v.k1 * x + v.b1, 8) + ")"], kv: [["夹角", g(ang, 6) + "°"], ["是否垂直", Math.abs(v.k1 * v.k2 + 1) < 1e-12 ? "是" : "否"]] }; } });

  /* ======================= 单位换算 ======================= */
  unit("luminance", "亮度单位换算", "坎德拉/平方米（尼特）、英尺朗伯等", "亮度 尼特 nit 屏幕亮度", [["cd/m²（nit）", 1], ["英尺朗伯 fL", 3.42626], ["熙提 sb", 1e4], ["朗伯 L", 3183.099]], "cd/m²（nit）");

  add({ cat: "convert", id: "richter", name: "地震震级与能量", desc: "震级换算释放能量、TNT 当量，比较两次地震相差多少倍", kw: "地震 震级 里氏 能量",
    fields: [{ k: "m", l: "震级", v: 6.5 }, { k: "m2", l: "对比震级（可选）", v: 5 }],
    run: function (v) { need(v.m); var E = Math.pow(10, 1.5 * v.m + 4.8), kv = [["TNT 当量", E / 4.184e9 >= 1e3 ? g(E / 4.184e12, 4) + " 千吨" : g(E / 4.184e9, 4) + " 吨"], ["相当于广岛原子弹", g(E / 6.3e13, 4) + " 颗"]]; if (ok(v.m2)) { kv.push(["能量是对比的", g(Math.pow(10, 1.5 * (v.m - v.m2)), 4) + " 倍"]); kv.push(["振幅是对比的", g(Math.pow(10, v.m - v.m2), 4) + " 倍"]); } return { big: ["释放能量", E.toExponential(3).replace("e+", " × 10^") + " J"], kv: kv, note: "震级每增加 1 级，能量约增加 31.6 倍。" }; } });

  add({ cat: "convert", id: "dms-decimal", name: "经纬度度分秒换算", desc: "十进制度与度°分′秒″互换", kw: "经纬度 度分秒 坐标",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["十进制度", "度分秒"] }, { k: "x", l: "十进制度", v: 39.9042, show: function (v) { return v.m === "十进制度"; } }, { k: "d", l: "度", v: 116, show: function (v) { return v.m !== "十进制度"; } }, { k: "mi", l: "分", v: 24, show: function (v) { return v.m !== "十进制度"; } }, { k: "s", l: "秒", v: 26.6, show: function (v) { return v.m !== "十进制度"; } }],
    run: function (v) { if (v.m === "十进制度") { need(v.x); var a = Math.abs(v.x), d = Math.floor(a), m = Math.floor((a - d) * 60), s = ((a - d) * 60 - m) * 60; if (+s.toFixed(3) === 60) { s = 0; m++; } return { big: ["度分秒", (v.x < 0 ? "−" : "") + d + "° " + m + "′ " + f(s, 3) + "″"] }; } need(v.d, v.mi, v.s); var x = Math.abs(v.d) + v.mi / 60 + v.s / 3600; return { big: ["十进制度", g(v.d < 0 ? -x : x, 8) + "°"] }; } });

  add({ cat: "convert", id: "bra-size", name: "内衣尺码换算", desc: "按下胸围和上胸围算国内 / 欧码、美码、英码", kw: "内衣 尺码 罩杯 75b",
    fields: [{ k: "u", l: "下胸围", u: "cm", v: 74 }, { k: "b", l: "上胸围", u: "cm", v: 88 }],
    run: function (v) { pos(v.u, v.b); var band = Math.round(v.u / 5) * 5, diff = v.b - v.u; if (diff < 7.5) throw "上下胸围差太小"; var i = Math.min(Math.max(Math.round((diff - 10) / 2.5), 0), 7), EU = "AA A B C D E F G".split(" "), US = "AA A B C D DD DDD G".split(" "), UK = "AA A B C D DD E F".split(" "), cup = Math.min(i + 1, 7); return { big: ["国内 / 欧码", band + EU[cup]], kv: [["美码", (band + 10) / 2.5 + US[cup]], ["英码", (band + 10) / 2.5 + UK[cup]], ["上下胸围差", f(diff, 1) + " cm"]], note: "罩杯每差 2.5 cm 一档（A 约 10 cm）。不同品牌版型不同，以试穿为准。" }; } });

  var NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  add({ cat: "convert", id: "note-frequency", name: "音符与频率换算", desc: "音名（如 A4、C#5）与频率互换，十二平均律", kw: "音符 频率 a4 440 音高 调音",
    fields: [{ k: "s", l: "音名或频率（Hz）", t: "text", v: "A4" }, { k: "a", l: "A4 标准音", u: "Hz", v: 440 }],
    run: function (v) { pos(v.a); var s = String(v.s).trim().toUpperCase().replace("♯", "#"), m = s.match(/^([A-G])(#|B)?(-?\d)$/); if (m) { var n = NOTES.indexOf(m[1]) + (m[2] === "#" ? 1 : m[2] === "B" ? -1 : 0) + (+m[3] + 1) * 12, fr = v.a * Math.pow(2, (n - 69) / 12); return { big: ["频率", g(fr, 6) + " Hz"], kv: [["MIDI 编号", n], ["波长（空气中）", g(343 / fr, 4) + " m"]] }; } var x = Number(s.replace(/HZ$/, "")); if (!(x > 0)) throw "请输入音名（如 C4、F#3）或频率"; var k = 69 + 12 * Math.log2(x / v.a), r = Math.round(k), cents = (k - r) * 100; return { big: ["最接近", NOTES[(r % 12 + 12) % 12] + (Math.floor(r / 12) - 1)], kv: [["音分偏差", (cents >= 0 ? "+" : "") + f(cents, 1) + " 音分"], ["MIDI 编号", r]] }; } });

  add({ cat: "convert", id: "gas-price-convert", name: "美元/加仑 ↔ 元/升 油价换算", desc: "国外油价每加仑美元和国内每升人民币互换", kw: "油价 加仑 美元 换算",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["美元/加仑", "元/升"] }, { k: "x", l: "价格", v: 4.5 }, { k: "r", l: "汇率（1 美元 = ? 元）", v: 7.1 }],
    run: function (v) { pos(v.x, v.r); return v.m === "美元/加仑" ? { big: ["元/升", f(v.x * v.r / 3.78541, 2)], kv: [["美元/升", f(v.x / 3.78541, 3)]] } : { big: ["美元/加仑", f(v.x / v.r * 3.78541, 2)] }; } });

  add({ cat: "convert", id: "base64", name: "Base64 编码 / 解码", desc: "文字与 Base64 互转（UTF-8），支持 URL 安全格式", kw: "base64 编码 解码",
    fields: [{ k: "m", l: "方向", t: "sel", o: ["编码", "解码"] }, { k: "s", l: "内容", t: "area", v: "你好，Hark" }],
    run: function (v) { var s = String(v.s); if (!s) throw "请输入内容"; if (v.m === "编码") { var bin = Array.from(new TextEncoder().encode(s)).map(function (b) { return String.fromCharCode(b); }).join(""), b64 = btoa(bin); return { kv: [["Base64", b64], ["URL 安全", b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")]] }; } try { var t = s.trim().replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "="; var raw = atob(t); return { big: ["解码结果", new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(raw, function (c) { return c.charCodeAt(0); }))] }; } catch (e) { throw "不是有效的 Base64 文本"; } } });

  /* ======================= 日期时间 ======================= */
  add({ cat: "date", id: "planet-age", name: "你在其他星球几岁", desc: "按出生日期算你在水星、金星、火星、木星上的年龄", kw: "星球 年龄 火星 木星",
    fields: [{ k: "b", l: "出生日期", t: "date", v: "2000-06-15" }],
    run: function (v) { var d = dayDiff(D(v.b), today()) / 365.256; if (d < 0) throw "出生日期在未来"; return { table: { h: ["星球", "公转周期（地球年）", "你的年龄"], r: [["水星", .2408], ["金星", .6152], ["地球", 1], ["火星", 1.8808], ["木星", 11.862], ["土星", 29.457], ["天王星", 84.02], ["海王星", 164.8]].map(function (p) { return [p[0], p[1], f(d / p[1], 2) + " 岁"]; }) } }; } });

  add({ cat: "date", id: "date-format", name: "日期格式转换", desc: "一个日期的各种写法：中文、英文、美式、农历、时间戳", kw: "日期格式 英文日期 美式",
    fields: [{ k: "d", l: "日期", t: "date", v: "today" }],
    run: function (v) { var d = D(v.d), M = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], W = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], lu = H.lunar(d), dd = d.getDate(), sf = dd % 10 === 1 && dd !== 11 ? "st" : dd % 10 === 2 && dd !== 12 ? "nd" : dd % 10 === 3 && dd !== 13 ? "rd" : "th"; return { kv: [["ISO", iso(d)], ["中文", d.getFullYear() + " 年 " + (d.getMonth() + 1) + " 月 " + dd + " 日 " + WK[d.getDay()]], ["农历", lu.gz + "年" + lu.s], ["英式", dd + " " + M[d.getMonth()] + " " + d.getFullYear()], ["美式", W[d.getDay()] + ", " + M[d.getMonth()] + " " + dd + sf + ", " + d.getFullYear()], ["数字（美 / 欧）", (d.getMonth() + 1) + "/" + dd + "/" + d.getFullYear() + " · " + dd + "/" + (d.getMonth() + 1) + "/" + d.getFullYear()], ["Unix 时间戳（当日 0 点，本地）", Math.floor(d.getTime() / 1000)]] }; } });

  add({ cat: "date", id: "payday-adjust", name: "发薪日 / 还款日遇周末调整", desc: "每月固定日期遇到周六日提前或顺延后的实际日期", kw: "发薪日 还款日 周末 顺延 提前",
    fields: [{ k: "d", l: "每月几号", v: 10 }, { k: "r", l: "遇周末", t: "sel", o: ["提前到周五", "顺延到周一"] }, { k: "n", l: "列出几个月", v: 12 }],
    run: function (v) { if (!Number.isInteger(v.d) || v.d < 1 || v.d > 31) throw "日期 1–31"; var t = today(), out = []; for (var i = 0; i < Math.min(Math.max(v.n | 0, 1), 36); i++) { var base = new Date(t.getFullYear(), t.getMonth() + i, 1), last = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate(), x = new Date(base.getFullYear(), base.getMonth(), Math.min(v.d, last)), o = new Date(x), w = x.getDay(); if (w === 6) x = plus(x, v.r[0] === "提" ? -1 : 2); else if (w === 0) x = plus(x, v.r[0] === "提" ? -2 : 1); out.push([base.getFullYear() + "-" + String(base.getMonth() + 1).padStart(2, "0"), day(x), +x === +o ? "" : "已调整"]); } return { table: { h: ["月份", "实际日期", "备注"], r: out }, note: "未考虑法定节假日和调休，遇长假请以单位或银行通知为准。" }; } });

  add({ cat: "date", id: "time-progress", name: "时间进度条", desc: "今天、本周、本月、今年分别过去了多少", kw: "时间进度 年进度 本月 本周",
    fields: [{ k: "t", l: "时间", t: "dt", v: nowDT() }],
    run: function (v) { var n = new Date(v.t); if (isNaN(n)) throw "请选择时间"; var d0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()), w0 = plus(d0, -((n.getDay() + 6) % 7)), m0 = new Date(n.getFullYear(), n.getMonth(), 1), m1 = new Date(n.getFullYear(), n.getMonth() + 1, 1), y0 = new Date(n.getFullYear(), 0, 1), y1 = new Date(n.getFullYear() + 1, 0, 1), p = function (a, b) { return pct((n - a) / (b - a), 1); }; return { kv: [["今天", p(d0, plus(d0, 1))], ["本周（周一起）", p(w0, plus(w0, 7))], ["本月", p(m0, m1)], ["本季度", p(new Date(n.getFullYear(), Math.floor(n.getMonth() / 3) * 3, 1), new Date(n.getFullYear(), Math.floor(n.getMonth() / 3) * 3 + 3, 1))], ["今年", p(y0, y1)]] }; } });

  var ZONES = [["Asia/Shanghai", "北京"], ["Asia/Tokyo", "东京"], ["Asia/Singapore", "新加坡"], ["Asia/Dubai", "迪拜"], ["Europe/London", "伦敦"], ["Europe/Paris", "巴黎"], ["Europe/Berlin", "柏林"], ["America/New_York", "纽约"], ["America/Chicago", "芝加哥"], ["America/Los_Angeles", "洛杉矶 / 旧金山"], ["Australia/Sydney", "悉尼"]];
  add({ cat: "date", id: "meeting-planner", name: "跨时区会议时间表", desc: "选一个北京时间，看全球主要城市对应几点，是否在工作时间", kw: "时区 会议 跨国 时差",
    fields: [{ k: "t", l: "北京时间", t: "dt", v: "2026-10-12T21:00" }],
    run: function (v) { var u = Date.parse(v.t + ":00+08:00"); if (isNaN(u)) throw "请选择时间"; var d = new Date(u); return { table: { h: ["城市", "当地时间", "状态"], r: ZONES.map(function (z) { var s = new Intl.DateTimeFormat("zh-CN", { timeZone: z[0], month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" }).format(d), h = +new Intl.DateTimeFormat("en-US", { timeZone: z[0], hour: "numeric", hourCycle: "h23" }).format(d); return [z[1], s, h >= 9 && h < 18 ? "✅ 工作时间" : h >= 7 && h < 23 ? "🟡 非工作时间" : "🌙 睡觉时间"]; }) }, note: "已自动处理各地夏令时。" }; } });

  /* ======================= 生活实用 ======================= */
  add({ cat: "life", id: "party-food", name: "聚会备菜量计算", desc: "火锅、烧烤、家宴按人数算肉、菜、主食和饮料要准备多少", kw: "火锅 烧烤 聚会 备菜 几斤肉",
    fields: [{ k: "n", l: "成人人数", v: 8 }, { k: "k", l: "儿童人数", v: 0 }, { k: "t", l: "类型", t: "sel", o: ["火锅", "烧烤", "家宴"] }],
    run: function (v) { need(v.n, v.k); var P = v.n + v.k * .5, T = { "火锅": [["肉类（牛羊肉卷等）", 250], ["丸滑 / 豆制品", 120], ["蔬菜菌菇", 200], ["主食（面、粉）", 50]], "烧烤": [["肉串 / 鸡翅", 350], ["海鲜", 100], ["蔬菜", 150], ["主食（馒头片、饭团）", 80]], "家宴": [["荤菜", 300], ["素菜", 200], ["主食", 100], ["汤", 250]] }[v.t]; return { table: { h: ["食材", "每人", "合计"], r: T.map(function (x) { return [x[0], x[1] + " g", f(x[1] * P / 500, 1) + " 斤"]; }).concat([["饮料 / 啤酒", "2 瓶", Math.ceil(v.n * 2 + v.k) + " 瓶"]]) }, note: "按儿童半份计算。男生多、饭量大的话加 20%。" }; } });

  add({ cat: "life", id: "moving-boxes", name: "搬家纸箱 / 车型估算", desc: "按户型和物品多少估算要几个纸箱、多大的车", kw: "搬家 纸箱 货车",
    fields: [{ k: "r", l: "户型", t: "sel", o: [[1, "单间 / 一室"], [2, "两室"], [3, "三室"], [4, "四室及以上"]], v: 2 }, { k: "s", l: "物品多少", t: "sel", o: [[.7, "精简"], [1, "一般"], [1.4, "很多"]], v: 1 }],
    run: function (v) { var n = Math.round((10 + v.r * 12) * v.s); return { big: ["纸箱约", n + " 个"], kv: [["大箱 / 中箱 / 小箱", Math.round(n * .3) + " / " + Math.round(n * .5) + " / " + Math.round(n * .2)], ["胶带", Math.ceil(n / 15) + " 卷"], ["建议车型", v.r <= 1 ? "小面包车" : v.r <= 2 ? "中面 / 4.2 米厢货" : "4.2 米厢货，家具多需 2 趟或更大车"]], note: "书籍装小箱，被褥衣物装大箱或压缩袋。" }; } });

  add({ cat: "life", id: "diaper", name: "纸尿裤用量计算", desc: "按宝宝月龄估算每天几片、每月几包", kw: "纸尿裤 尿不湿 用量 宝宝",
    fields: [{ k: "m", l: "月龄", u: "月", v: 3 }, { k: "p", l: "每包片数", v: 60 }, { k: "pr", l: "每包价格", u: "元", v: 120 }],
    run: function (v) { need(v.m); pos(v.p); var d = v.m < 1 ? 10 : v.m < 3 ? 8 : v.m < 6 ? 7 : v.m < 12 ? 6 : v.m < 24 ? 5 : 4, mo = d * 30; return { big: ["每天约", d + " 片"], kv: [["每月", mo + " 片 ≈ " + Math.ceil(mo / v.p) + " 包"], ["每月花费", y(mo / v.p * v.pr)], ["单片价格", y(v.pr / v.p)]], note: "尺码按体重选，比按月龄更准；囤货不要囤太多小码。" }; } });

  add({ cat: "life", id: "baggage-fee", name: "行李超重费估算", desc: "国内航班按超重公斤数和经济舱全价估算逾重行李费", kw: "行李 超重 托运 逾重",
    fields: [{ k: "w", l: "行李总重", u: "kg", v: 28 }, { k: "a", l: "免费额度", u: "kg", v: 20 }, { k: "p", l: "该航线经济舱全价", u: "元", v: 1700 }],
    run: function (v) { need(v.w, v.a); pos(v.p); var ex = Math.max(Math.ceil(v.w - v.a), 0); return { big: ["超重费约", y(ex * v.p * .015)], kv: [["超重", ex + " kg"], ["每公斤", y(v.p * .015)]], note: "国内航线传统算法为每公斤收经济舱全价的 1.5%，现在多数航司改为按区域、按件计费，提前在 App 购买预付行李通常更便宜。" }; } });

  add({ cat: "life", id: "fridge-size", name: "冰箱容量怎么选", desc: "按家庭人数和囤货习惯推荐冰箱容量", kw: "冰箱 容量 升 选购",
    fields: [{ k: "n", l: "家庭人数", v: 3 }, { k: "h", l: "囤货习惯", t: "sel", o: [[0, "随买随吃"], [1, "一般"], [2, "爱囤货 / 常做饭"]], v: 1 }],
    run: function (v) { pos(v.n); var c = 100 + v.n * (60 + v.h * 20); return { big: ["建议容量", f(c, 0) + " – " + f(c + 100, 0) + " L"], kv: [["推荐门型", c < 250 ? "双门 / 三门" : c < 450 ? "法式多门 / 十字对开" : "对开门 / 十字对开"]], note: "嵌入式冰箱注意预留散热空间，买之前量好位置的宽深高。" }; } });

  add({ cat: "life", id: "tv-size", name: "电视尺寸怎么选", desc: "按观看距离推荐电视尺寸，或按尺寸算最佳距离", kw: "电视 尺寸 观看距离 英寸",
    fields: [{ k: "d", l: "沙发到电视距离", u: "m", v: 3 }, { k: "r", l: "观看偏好", t: "sel", o: [[30, "日常（视角 30°）"], [40, "4K 沉浸（视角 40°）"]], v: 30 }],
    run: function (v) { pos(v.d); var w = 2 * v.d * Math.tan(v.r / 2 * Math.PI / 180), diag = w / .8716 / .0254; return { big: ["推荐", Math.round(diag / 5) * 5 + " 英寸"], kv: [["屏幕宽度约", f(w * 100, 0) + " cm"], ["可选范围", Math.round(diag * .8 / 5) * 5 + " – " + Math.round(diag * 1.15 / 5) * 5 + " 英寸"]], note: "按 16:9 屏幕计算。电视比你想的大一号通常不会后悔。" }; } });

  add({ cat: "life", id: "lumen-watt", name: "灯泡流明 / 瓦数换算", desc: "LED、节能灯、白炽灯的瓦数与亮度（流明）互换，房间需要多亮", kw: "流明 瓦数 led 灯泡 亮度",
    fields: [{ k: "m", l: "计算", t: "sel", o: ["瓦数 → 流明", "房间需要多少流明"] }, { k: "w", l: "LED 瓦数", u: "W", v: 9, show: function (v) { return v.m[0] === "瓦"; } }, { k: "a", l: "房间面积", u: "㎡", v: 15, show: function (v) { return v.m[0] !== "瓦"; } }, { k: "lx", l: "用途", t: "sel", o: [[100, "卧室 100 lx"], [150, "客厅 150 lx"], [300, "书房 / 厨房 300 lx"], [500, "工作台 500 lx"]], v: 150, show: function (v) { return v.m[0] !== "瓦"; } }],
    run: function (v) { if (v.m[0] === "瓦") { pos(v.w); var lm = v.w * 100; return { big: ["约", f(lm, 0) + " 流明"], kv: [["相当于白炽灯", f(lm / 12, 0) + " W"], ["相当于节能灯", f(lm / 60, 0) + " W"]] }; } pos(v.a); var L = v.a * v.lx / .6; return { big: ["需要约", f(L, 0) + " 流明"], kv: [["LED 总功率约", f(L / 100, 0) + " W"]], note: "已按 0.6 的利用系数考虑灯具和墙面损失。" }; } });

  add({ cat: "life", id: "rice-water", name: "煮饭米水比例", desc: "按米的种类和用量算加多少水", kw: "米水比例 煮饭 加多少水 粥",
    fields: [{ k: "g", l: "大米", u: "g", v: 300 }, { k: "t", l: "种类", t: "sel", drop: true, o: [[1.2, "东北大米 / 粳米"], [1.4, "南方籼米 / 长粒米"], [1.3, "泰国香米"], [1.8, "糙米 / 杂粮米（先泡 2 小时）"], [8, "白粥（稠）"], [12, "白粥（稀）"]], v: 1.2 }],
    run: function (v) { pos(v.g); return { big: ["加水", f(v.g * v.t, 0) + " ml"], kv: [["约可盛", f(v.g * (v.t >= 8 ? 6 : 2.3) / 150, 0) + " 碗"], ["米", f(v.g / 150 * 1, 1) + " 量杯（150 g）"]], note: "新米少放一点水，陈米多放一点。电饭煲可直接对照内胆刻度。" }; } });

  /* ======================= 教育学业 ======================= */
  add({ cat: "edu", id: "gaokao-tiers", name: "高考志愿冲稳保位次", desc: "按你的全省位次给出冲、稳、保三档院校的往年最低位次区间", kw: "高考志愿 冲稳保 位次 填报",
    fields: [{ k: "r", l: "你的全省位次", v: 25000 }],
    run: function (v) { pos(v.r); return { table: { h: ["档位", "院校往年最低位次区间", "建议志愿数"], r: [["冲", f(v.r * .85, 0) + " – " + f(v.r * .97, 0), "约 20%"], ["稳", f(v.r * .97, 0) + " – " + f(v.r * 1.1, 0), "约 40%"], ["保", f(v.r * 1.1, 0) + " – " + f(v.r * 1.35, 0), "约 40%"]] }, note: "用位次比用分数更稳定。参考近三年数据并留意招生计划变化；新高考按专业组填报，以当地考试院为准。" }; } });

  add({ cat: "edu", id: "plagiarism-rate", name: "论文查重率计算", desc: "按重复字数和总字数算重复率，要降到目标需要改写多少", kw: "查重 重复率 论文 降重",
    fields: [{ k: "t", l: "总字数", v: 15000 }, { k: "d", l: "重复字数", v: 3300 }, { k: "g", l: "目标重复率", u: "%", v: 15 }],
    run: function (v) { pos(v.t); need(v.d, v.g); var r = v.d / v.t, need0 = Math.max(v.d - v.t * v.g / 100, 0); return { big: ["重复率", pct(r, 1)], kv: [["至少改写", f(need0, 0) + " 字"], ["约占全文", pct(need0 / v.t, 1)]], note: "本科一般要求 30% 以下，硕士 10%–15%，以学校规定和指定系统为准。" }; } });

  add({ cat: "edu", id: "paper-pages", name: "论文字数 ↔ 页数", desc: "按字号和行距估算多少字一页、写满几页", kw: "字数 页数 a4 小四 1.5倍行距",
    fields: [{ k: "w", l: "字数", v: 8000 }, { k: "f", l: "字号", t: "sel", o: [[10.5, "五号"], [12, "小四"], [14, "四号"]], v: 12 }, { k: "l", l: "行距", t: "sel", o: [[1, "单倍"], [1.25, "1.25 倍"], [1.5, "1.5 倍"], [2, "2 倍"]], v: 1.5 }],
    run: function (v) { pos(v.w); var cpl = Math.floor(453 / v.f), lpp = Math.floor(680 / (v.f * 1.3 * v.l)), per = cpl * lpp * .9; return { big: ["约", f(Math.ceil(v.w / per), 0) + " 页"], kv: [["每页约", f(per, 0) + " 字"], ["每行 / 每页行数", cpl + " 字 / " + lpp + " 行"]], note: "按 A4、上下 2.54 cm、左右 3.17 cm 页边距（Word 默认），含段落空行折损 10%。" }; } });

  add({ cat: "edu", id: "composite-score", name: "综合测评 / 保研成绩", desc: "按学业成绩、科研竞赛、综合素质的权重算综合成绩", kw: "综测 保研 综合成绩 推免",
    fields: [{ k: "a", l: "学业成绩（百分制）", v: 88 }, { k: "wa", l: "学业权重", u: "%", v: 80 }, { k: "b", l: "科研 / 竞赛加分（折百分制）", v: 70 }, { k: "wb", l: "科研权重", u: "%", v: 15 }, { k: "c", l: "综合素质（百分制）", v: 90 }, { k: "wc", l: "综合素质权重", u: "%", v: 5 }],
    run: function (v) { need(v.a, v.wa, v.b, v.wb, v.c, v.wc); var W = v.wa + v.wb + v.wc; if (Math.abs(W - 100) > .01) throw "权重合计应为 100%"; return { big: ["综合成绩", f((v.a * v.wa + v.b * v.wb + v.c * v.wc) / 100, 2)], kv: [["学业贡献", f(v.a * v.wa / 100, 2)], ["科研贡献", f(v.b * v.wb / 100, 2)], ["素质贡献", f(v.c * v.wc / 100, 2)]], note: "各校推免办法不同，权重以本院系当年文件为准。" }; } });

  add({ cat: "edu", id: "class-stats", name: "班级成绩统计", desc: "一组成绩的平均分、及格率、优秀率、最高最低分和标准差", kw: "成绩统计 及格率 优秀率 平均分",
    fields: [{ k: "s", l: "成绩（空格或逗号分隔）", t: "area", v: "92 85 78 66 59 88 73 95 81 47 70 84" }, { k: "p", l: "及格线", v: 60 }, { k: "e", l: "优秀线", v: 90 }],
    run: function (v) { var a = nums(v.s); need(v.p, v.e); var n = a.length, avg = a.reduce(function (s, x) { return s + x; }, 0) / n, sd = Math.sqrt(a.reduce(function (s, x) { return s + (x - avg) * (x - avg); }, 0) / n), so = a.slice().sort(function (x, z) { return x - z; }), med = n % 2 ? so[(n - 1) / 2] : (so[n / 2 - 1] + so[n / 2]) / 2; return { big: ["平均分", f(avg, 2)], kv: [["人数", n], ["及格率", pct(a.filter(function (x) { return x >= v.p; }).length / n, 1)], ["优秀率", pct(a.filter(function (x) { return x >= v.e; }).length / n, 1)], ["最高 / 最低", g(so[n - 1], 6) + " / " + g(so[0], 6)], ["中位数", g(med, 6)], ["标准差", f(sd, 2)]] }; } });

  add({ cat: "edu", id: "grade-by-age", name: "孩子现在该读几年级", desc: "按出生日期和 8 月 31 日入学截止，算现在读幼儿园还是几年级", kw: "几年级 年级 入学年龄",
    fields: [{ k: "b", l: "出生日期", t: "date", v: "2017-05-20" }],
    run: function (v) { var b = D(v.b), t = today(), entry = b.getFullYear() + 6 + (b.getMonth() > 7 ? 1 : 0), sy = t.getFullYear() - (t.getMonth() < 8 ? 1 : 0), k = sy - entry + 1, G = ["小班", "中班", "大班"], txt = k <= -3 ? "未到入园年龄" : k <= 0 ? "幼儿园" + G[k + 2] : k <= 6 ? "小学 " + k + " 年级" : k <= 9 ? "初" + "一二三"[k - 7] : k <= 12 ? "高" + "一二三"[k - 10] : "已高中毕业（大学 / 工作）"; return { big: ["现在应读", txt], kv: [["上小学", entry + " 年 9 月"]], note: "按满 6 周岁、8 月 31 日截止和六三三学制，实际以当地入学政策为准。" }; } });

  /* ======================= 商业财税 ======================= */
  add({ cat: "biz", id: "turnover-rate", name: "员工离职率计算", desc: "按期初、期末人数和离职人数算离职率、年化离职率", kw: "离职率 流失率 人力资源",
    fields: [{ k: "a", l: "期初人数", v: 120 }, { k: "b", l: "期末人数", v: 126 }, { k: "l", l: "期间离职人数", v: 9 }, { k: "m", l: "统计期", u: "月", v: 3 }],
    run: function (v) { pos(v.a, v.b, v.m); need(v.l); var r = v.l / ((v.a + v.b) / 2); return { big: ["离职率", pct(r, 2)], kv: [["年化离职率", pct(1 - Math.pow(1 - r, 12 / v.m), 1)], ["月均离职率", pct(r / v.m, 2)]] }; } });

  add({ cat: "biz", id: "retention", name: "用户留存率", desc: "次日、7 日、30 日留存和对应流失率", kw: "留存率 次留 七留 流失",
    fields: [{ k: "n", l: "首日新增用户", v: 10000 }, { k: "r", l: "各日留存（第几天, 活跃人数）", t: "list", cols: [{ k: "d", l: "第几天", nv: "" }, { k: "c", l: "活跃人数", nv: "" }], v: [[1, 4200], [7, 2100], [30, 1100]] }],
    run: function (v) { pos(v.n); var rs = v.r.filter(function (r) { return ok(r[0]) && ok(r[1]); }); if (!rs.length) throw "至少一行"; return { table: { h: ["第几天", "留存人数", "留存率", "流失率"], r: rs.map(function (r) { return ["第 " + r[0] + " 天", f(r[1], 0), pct(r[1] / v.n, 1), pct(1 - r[1] / v.n, 1)]; }) } }; } });

  add({ cat: "biz", id: "nps", name: "NPS 净推荐值", desc: "按 0–10 分调查结果算推荐者、贬损者比例和 NPS", kw: "nps 净推荐值 满意度",
    fields: [{ k: "p", l: "推荐者（9–10 分）人数", v: 120 }, { k: "m", l: "中立者（7–8 分）人数", v: 50 }, { k: "d", l: "贬损者（0–6 分）人数", v: 30 }],
    run: function (v) { need(v.p, v.m, v.d); var t = v.p + v.m + v.d; if (!t) throw "请填写人数"; var n = (v.p - v.d) / t * 100; return { big: ["NPS", f(n, 1)], tag: n >= 50 ? "优秀" : n >= 30 ? "良好" : n >= 0 ? "一般" : "较差", kv: [["推荐者", pct(v.p / t, 1)], ["贬损者", pct(v.d / t, 1)], ["样本量", t]] }; } });

  add({ cat: "biz", id: "delivery-platform", name: "外卖商家到手计算", desc: "外卖订单扣掉平台佣金、配送费、满减和成本后商家实际赚多少", kw: "外卖 美团 饿了么 佣金 商家",
    fields: [{ k: "p", l: "菜品原价", u: "元", v: 50 }, { k: "dis", l: "商家承担满减 / 折扣", u: "元", v: 8 }, { k: "c", l: "平台佣金率", u: "%", v: 18 }, { k: "dl", l: "商家承担配送费", u: "元", v: 3 }, { k: "pk", l: "包装成本", u: "元", v: 1.5 }, { k: "fc", l: "食材成本率（按原价）", u: "%", v: 35 }],
    run: function (v) { pos(v.p); need(v.dis, v.c, v.dl, v.pk, v.fc); var paid = v.p - v.dis, com = paid * v.c / 100, inc = paid - com - v.dl, prof = inc - v.pk - v.p * v.fc / 100; return { big: ["每单利润", y(prof)], kv: [["顾客实付（菜品部分）", y(paid)], ["平台佣金", y(com)], ["商家实收", y(inc)], ["利润率（对原价）", pct(prof / v.p, 1)]], note: "未计房租、人工和推广费，各平台佣金和配送费规则以后台为准。" }; } });

  add({ cat: "biz", id: "livestream-commission", name: "直播带货佣金计算", desc: "按成交额、退货率、佣金率和坑位费算主播收入和商家投产比", kw: "直播带货 佣金 坑位费 退货率",
    fields: [{ k: "g", l: "直播成交额（GMV）", u: "元", v: 200000 }, { k: "r", l: "退货率", u: "%", v: 30 }, { k: "c", l: "佣金率", u: "%", v: 20 }, { k: "s", l: "坑位费", u: "元", v: 10000 }, { k: "pf", l: "平台技术服务费", u: "%", v: 5 }, { k: "m", l: "商家毛利率（扣佣金前）", u: "%", v: 60 }],
    run: function (v) { pos(v.g); need(v.r, v.c, v.s, v.pf, v.m); var net = v.g * (1 - v.r / 100), com = net * v.c / 100, merch = net * v.m / 100 - com - net * v.pf / 100 - v.s; return { big: ["主播收入", y(com + v.s)], kv: [["实际成交（扣退货）", y(net)], ["商家净利", y(merch)], ["商家 ROI（实际成交 / 坑位费 + 佣金）", g(net / (v.s + com), 3)]] }; } });

  add({ cat: "biz", id: "individual-invoice", name: "个人代开发票税费", desc: "个人去税务局或电子税务局代开发票要交的增值税、附加税和个税估算", kw: "代开发票 个人 增值税 1%",
    fields: [{ k: "a", l: "开票金额（含税）", u: "元", v: 50000 }, { k: "t", l: "个税预征 / 核定率", u: "%", v: 1, hint: "各地 0.5%–1.5%，劳务报酬需另按劳务报酬所得申报" }, { k: "e", l: "是否月销售额 10 万以下", t: "sel", o: ["否", "是（按次 500 元以上起征的地区可能免增值税）"] }],
    run: function (v) { pos(v.a); need(v.t); var vat = v.e === "否" ? v.a / 1.01 * .01 : 0, sur = vat * .06, it = v.a / 1.01 * v.t / 100, tot = vat + sur + it; return { big: ["税费合计约", y(tot)], kv: [["增值税（1%）", y(vat)], ["附加税（减半后约 6%）", y(sur)], ["个税", y(it)], ["实得", y(v.a - tot)]], note: "小规模纳税人减按 1% 征收增值税的政策执行至 2027 年底，附加税费减半。各地政策差异大，以当地税务局为准。" }; } });

  add({ cat: "biz", id: "cpm-cpc", name: "CPM / CPC / CTR 互算", desc: "千次展示成本、单次点击成本和点击率互相换算", kw: "cpm cpc ctr 广告 千次展示",
    fields: [{ k: "c", l: "广告花费", u: "元", v: 3000 }, { k: "i", l: "展示次数", v: 500000 }, { k: "k", l: "点击次数", v: 6000 }],
    run: function (v) { pos(v.c, v.i); need(v.k); return { kv: [["CPM（千次展示成本）", y(v.c / v.i * 1000)], ["CPC（单次点击成本）", v.k ? y(v.c / v.k) : "—"], ["CTR（点击率）", pct(v.k / v.i, 2)]] }; } });

  /* ======================= 工程建筑 ======================= */
  add({ cat: "build", id: "baseboard", name: "踢脚线用量", desc: "按房间周长扣除门洞算踢脚线根数", kw: "踢脚线 用量 周长",
    fields: [{ k: "p", l: "房间周长合计", u: "m", v: 46 }, { k: "d", l: "门洞宽度合计", u: "m", v: 3.6 }, { k: "l", l: "每根长度", u: "m", v: 2.4 }, { k: "pr", l: "单价", u: "元/米", v: 15 }],
    run: function (v) { pos(v.p, v.l); need(v.d, v.pr); var L = Math.max(v.p - v.d, 0); return { big: ["需要", Math.ceil(L * 1.08 / v.l) + " 根"], kv: [["净长", f(L, 1) + " m"], ["费用约", y(L * 1.08 * v.pr)]], note: "含 8% 损耗（阴阳角切割）。" }; } });

  add({ cat: "build", id: "self-leveling", name: "自流平用量", desc: "按面积和厚度算自流平水泥用量和袋数", kw: "自流平 找平 地面",
    fields: [{ k: "a", l: "面积", u: "㎡", v: 60 }, { k: "t", l: "厚度", u: "mm", v: 3 }, { k: "k", l: "每 ㎡·mm 用量", u: "kg", v: 1.7 }, { k: "b", l: "每袋", u: "kg", v: 25 }],
    run: function (v) { pos(v.a, v.t, v.k, v.b); var kg = v.a * v.t * v.k; return { big: ["需要", Math.ceil(kg * 1.05 / v.b) + " 袋"], kv: [["用量", f(kg, 0) + " kg"], ["界面剂约", f(v.a * .15, 1) + " kg"]], note: "含 5% 损耗。铺木地板前一般做 3–5 mm。" }; } });

  add({ cat: "build", id: "railing-balusters", name: "栏杆立柱数量", desc: "按栏杆长度和净距算立杆根数，符合防攀爬间距", kw: "栏杆 护栏 立杆 间距 阳台",
    fields: [{ k: "l", l: "栏杆总长", u: "m", v: 6 }, { k: "w", l: "立杆宽度", u: "mm", v: 20 }, { k: "g", l: "最大净距", u: "mm", v: 110 }],
    run: function (v) { pos(v.l, v.w, v.g); var n = Math.ceil((v.l * 1000 - v.w) / (v.g + v.w)) + 1, gap = (v.l * 1000 - n * v.w) / (n - 1); return { big: ["立杆", n + " 根"], kv: [["实际净距", f(gap, 1) + " mm"]], note: "住宅栏杆垂直杆件净距不应大于 110 mm（GB 50352），临空高度 24 m 以下栏杆高度不低于 1.05 m。" }; } });

  add({ cat: "build", id: "insulation-board", name: "外墙保温板用量", desc: "按墙面积和板材规格算保温板块数、方量和锚栓", kw: "保温板 挤塑板 外墙保温 岩棉",
    fields: [{ k: "a", l: "墙面积（扣除门窗）", u: "㎡", v: 200 }, { k: "t", l: "厚度", u: "mm", v: 50 }, { k: "l", l: "板长", u: "mm", v: 1200 }, { k: "w", l: "板宽", u: "mm", v: 600 }],
    run: function (v) { pos(v.a, v.t, v.l, v.w); var n = Math.ceil(v.a / (v.l * v.w / 1e6) * 1.05); return { big: ["保温板", n + " 块"], kv: [["方量", f(v.a * v.t / 1000 * 1.05, 2) + " m³"], ["锚栓（6 个/㎡）", Math.ceil(v.a * 6) + " 个"], ["粘结砂浆约", f(v.a * 5, 0) + " kg"]] }; } });

  add({ cat: "build", id: "concrete-curing", name: "混凝土强度发展", desc: "按养护天数和温度估算混凝土达到设计强度的百分比", kw: "混凝土 养护 强度 拆模 天数",
    fields: [{ k: "d", l: "养护天数", u: "天", v: 7 }, { k: "t", l: "平均气温", u: "°C", v: 20 }, { k: "c", l: "设计强度等级", t: "sel", o: [[25, "C25"], [30, "C30"], [35, "C35"], [40, "C40"]], v: 30 }],
    run: function (v) { pos(v.d); need(v.t); if (v.t <= -10) throw "气温过低，需冬期施工措施"; var eq = v.d * (v.t + 10) / 30, s = Math.min(eq / (4 + .85 * eq), 1.15); return { big: ["约达", pct(s, 0) + " 设计强度"], kv: [["约", f(v.c * s, 1) + " MPa"], ["等效 20 °C 龄期", f(eq, 1) + " 天"]], note: "按 ACI 209 经验公式和成熟度估算，仅作参考。楼板底模拆除一般要求达到 75%–100%（视跨度），以同条件试块为准。" }; } });

  add({ cat: "build", id: "glass-weight", name: "玻璃重量计算", desc: "按面积和厚度算玻璃、中空玻璃的重量", kw: "玻璃 重量 中空玻璃 钢化",
    fields: [{ k: "w", l: "宽", u: "mm", v: 1500 }, { k: "h", l: "高", u: "mm", v: 2000 }, { k: "t", l: "各层厚度（如 5+5，单层填一个）", t: "text", v: "6+6" }, { k: "n", l: "块数", v: 1 }],
    run: function (v) { pos(v.w, v.h); need(v.n); var T = String(v.t).split(/[+＋,，\s]+/).map(Number).filter(function (x) { return x > 0; }); if (!T.length) throw "请填写厚度"; var A = v.w * v.h / 1e6, t = T.reduce(function (s, x) { return s + x; }, 0), kg = A * t * 2.5; return { big: ["总重", f(kg * v.n, 1) + " kg"], kv: [["单块", f(kg, 1) + " kg"], ["面积", f(A, 2) + " ㎡"]], note: "玻璃密度按 2.5 g/cm³（每平方米每毫米 2.5 kg），中空层空气重量忽略。" }; } });

  add({ cat: "build", id: "aluminum-ceiling", name: "铝扣板吊顶用量", desc: "按面积和板子规格算铝扣板、三角龙骨和边角线", kw: "铝扣板 集成吊顶 厨房 卫生间",
    fields: [{ k: "l", l: "房间长", u: "m", v: 3 }, { k: "w", l: "房间宽", u: "m", v: 2 }, { k: "s", l: "板子规格", t: "sel", o: [[0.09, "300 × 300"], [0.18, "300 × 600"], [0.36, "600 × 600"]], v: 0.09 }],
    run: function (v) { pos(v.l, v.w); var A = v.l * v.w; return { big: ["扣板", Math.ceil(A / v.s * 1.05) + " 块"], kv: [["面积", f(A, 2) + " ㎡"], ["边角线", f(2 * (v.l + v.w) * 1.05, 1) + " m"], ["三角龙骨", f(A / .3 * 1.05, 1) + " m"]], note: "浴霸、灯、排风扇位置的板子由电器替代，可相应减少。" }; } });

  /* ======================= 科学工程 ======================= */
  add({ cat: "science", id: "newton2", name: "牛顿第二定律 F = ma", desc: "力、质量、加速度三者知二求一", kw: "牛顿第二定律 加速度 力 质量",
    fields: [{ k: "f", l: "力 F（N，未知填 0）", v: 0 }, { k: "m", l: "质量 m（kg，未知填 0）", v: 10 }, { k: "a", l: "加速度 a（m/s²，未知填 0）", v: 2 }],
    run: function (v) { need(v.f, v.m, v.a); var z = [v.f, v.m, v.a].filter(function (x) { return x === 0; }).length; if (z !== 1) throw "恰好留一个为 0"; return v.f === 0 ? { big: ["F", g(v.m * v.a, 8) + " N"] } : v.m === 0 ? { big: ["m", g(v.f / v.a, 8) + " kg"] } : { big: ["a", g(v.f / v.m, 8) + " m/s²"] }; } });

  add({ cat: "science", id: "work-power", name: "功和功率计算器", desc: "W = Fs·cosθ，P = W / t，含机械效率", kw: "功 功率 效率 焦耳 瓦特",
    fields: [{ k: "f", l: "力", u: "N", v: 500 }, { k: "s", l: "位移", u: "m", v: 10 }, { k: "a", l: "力与位移夹角", u: "°", v: 0 }, { k: "t", l: "用时", u: "s", v: 20 }, { k: "e", l: "机械效率", u: "%", v: 80 }],
    run: function (v) { need(v.f, v.s, v.a, v.e); pos(v.t); var W = v.f * v.s * Math.cos(v.a * Math.PI / 180), P = W / v.t; return { big: ["功", g(W, 8) + " J"], kv: [["功率", g(P, 8) + " W"], ["所需输入功率", v.e > 0 ? g(P / (v.e / 100), 8) + " W" : "—"], ["马力", g(P / 735.5, 6) + " 马力"]] }; } });

  add({ cat: "science", id: "electrolysis", name: "电解 / 电镀质量（法拉第定律）", desc: "按电流、时间算电解析出或电镀沉积的质量", kw: "电解 电镀 法拉第 析出",
    fields: [{ k: "i", l: "电流", u: "A", v: 2 }, { k: "t", l: "时间", u: "分钟", v: 60 }, { k: "e", l: "物质", t: "sel", drop: true, o: [["63.55,2", "铜 Cu²⁺"], ["58.69,2", "镍 Ni²⁺"], ["107.87,1", "银 Ag⁺"], ["65.38,2", "锌 Zn²⁺"], ["52,3", "铬 Cr³⁺"], ["1.008,1", "氢 H₂"]], v: "63.55,2" }, { k: "eff", l: "电流效率", u: "%", v: 95 }],
    run: function (v) { pos(v.i, v.t); need(v.eff); var p = String(v.e).split(",").map(Number), Q = v.i * v.t * 60, m = Q * p[0] / (p[1] * 96485.33) * v.eff / 100; return { big: ["析出质量", g(m, 6) + " g"], kv: [["电量", g(Q, 6) + " C（" + g(Q / 3600, 4) + " Ah）"], ["物质的量", g(m / p[0], 6) + " mol"]] }; } });

  add({ cat: "science", id: "coulomb", name: "库仑定律", desc: "两个点电荷之间的静电力 F = kq₁q₂/r²", kw: "库仑定律 静电力 电荷",
    fields: [{ k: "q1", l: "电荷 q₁", u: "μC", v: 2 }, { k: "q2", l: "电荷 q₂", u: "μC", v: -3 }, { k: "r", l: "距离", u: "m", v: 0.1 }],
    run: function (v) { need(v.q1, v.q2); pos(v.r); var F = 8.9875517923e9 * v.q1 * v.q2 * 1e-12 / (v.r * v.r); return { big: ["静电力", g(Math.abs(F), 6) + " N"], kv: [["性质", F > 0 ? "斥力" : F < 0 ? "引力" : "无"], ["q₁ 在 q₂ 处的场强", g(8.9875517923e9 * Math.abs(v.q1) * 1e-6 / (v.r * v.r), 6) + " N/C"]] }; } });

  add({ cat: "science", id: "wire-resistance", name: "导线电阻计算", desc: "按材料电阻率、长度和截面积算导线电阻、压降和损耗", kw: "导线电阻 电阻率 铜线 铝线",
    fields: [{ k: "m", l: "材料", t: "sel", o: [[0.0172, "铜"], [0.0282, "铝"], [0.0159, "银"], [0.098, "铁"], [1.1, "镍铬合金"]], v: 0.0172 }, { k: "l", l: "长度", u: "m", v: 100 }, { k: "s", l: "截面积", u: "㎟", v: 2.5 }, { k: "i", l: "电流（可选）", u: "A", v: 10 }],
    run: function (v) { pos(v.l, v.s); var R = v.m * v.l / v.s, kv = []; if (ok(v.i) && v.i > 0) { kv.push(["压降", g(R * v.i, 5) + " V"]); kv.push(["损耗功率", g(R * v.i * v.i, 5) + " W"]); } return { big: ["电阻", g(R, 6) + " Ω"], kv: kv, note: "电阻率为 20 °C 值（Ω·㎟/m）。回路电流经过两根导线时长度要乘 2。" }; } });

  add({ cat: "science", id: "mass-fraction", name: "溶液质量分数配制", desc: "已知溶质和溶剂算质量分数，或按目标浓度算各称多少", kw: "质量分数 溶液 配制 百分比浓度",
    fields: [{ k: "m", l: "计算", t: "sel", o: ["求质量分数", "按浓度配制"] }, { k: "a", l: "溶质质量 / 目标浓度（%）", v: 10 }, { k: "b", l: "溶剂质量 / 溶液总质量（g）", v: 500 }],
    run: function (v) { pos(v.a, v.b); if (v.m === "求质量分数") return { big: ["质量分数", pct(v.a / (v.a + v.b), 3)], kv: [["溶液总质量", g(v.a + v.b, 6) + " g"]] }; if (v.a >= 100) throw "浓度需小于 100%"; return { kv: [["溶质", g(v.b * v.a / 100, 6) + " g"], ["溶剂（水）", g(v.b * (1 - v.a / 100), 6) + " g"]] }; } });

  add({ cat: "science", id: "kepler", name: "开普勒第三定律 / 公转周期", desc: "按轨道半长轴算绕太阳公转周期（T² ∝ a³）", kw: "开普勒 公转周期 天文单位",
    fields: [{ k: "a", l: "轨道半长轴", u: "AU（天文单位）", v: 1.524 }, { k: "m", l: "中心天体质量", u: "倍太阳质量", v: 1 }],
    run: function (v) { pos(v.a, v.m); var T = Math.sqrt(Math.pow(v.a, 3) / v.m); return { big: ["公转周期", g(T, 6) + " 年"], kv: [["天数", g(T * 365.256, 6) + " 天"], ["平均轨道速度", g(2 * Math.PI * v.a * 1.495978707e8 / (T * 365.256 * 86400), 5) + " km/s"]], note: "1 AU = 1.496 亿 km。火星约 1.524 AU。" }; } });

  add({ cat: "science", id: "magnetic-force", name: "洛伦兹力 / 安培力", desc: "运动电荷在磁场中受力 F = qvB·sinθ，通电导线受力 F = BIL·sinθ", kw: "洛伦兹力 安培力 磁场",
    fields: [{ k: "m", l: "计算", t: "sel", o: ["洛伦兹力（电荷）", "安培力（导线）"] }, { k: "q", l: "电荷量 q（C）/ 电流 I（A）", v: 1.602e-19 }, { k: "v", l: "速度 v（m/s）/ 导线长 L（m）", v: 1e6 }, { k: "b", l: "磁感应强度 B", u: "T", v: 0.5 }, { k: "a", l: "夹角 θ", u: "°", v: 90 }],
    run: function (v) { need(v.q, v.v, v.b, v.a); var F = Math.abs(v.q * v.v * v.b * Math.sin(v.a * Math.PI / 180)); return { big: ["受力", g(F, 6) + " N"], note: v.m[0] === "洛" ? "方向用左手定则（正电荷），洛伦兹力不做功。" : "方向用左手定则。" }; } });
})();
