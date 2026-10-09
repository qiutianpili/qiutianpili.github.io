/* Calculator registry, batch 4 (2026-10). Uses helpers exported by calcs.js / calcs2.js. */
(function () {
  "use strict";
  var H = window.CX.h, add = H.add, ok = H.ok, need = H.need, pos = H.pos, f = H.f, g = H.g, y = H.y, wy = H.wy, pct = H.pct,
    D = H.D, iso = H.iso, WK = H.WK, dayDiff = H.dayDiff, addMonths = H.addMonths, ymd = H.ymd, pmt = H.pmt, unit = H.unit;
  function nums(s) { var a = String(s).split(/[\s,，;；]+/).filter(Boolean).map(Number); if (!a.length || a.some(isNaN)) throw "请输入数字，用逗号或空格分隔"; return a; }
  function today() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
  function plus(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function day(d) { return iso(d) + " " + WK[d.getDay()]; }
  function rnd() { if (window.crypto && crypto.getRandomValues) { var u = new Uint32Array(1); crypto.getRandomValues(u); return u[0] / 4294967296; } return Math.random(); }

  /* ======================= 财务理财 ======================= */
  add({ cat: "finance", id: "stock-trade", name: "股票交易费用 / 盈亏计算器", desc: "A 股买卖佣金、印花税、过户费，算净盈亏和保本价", kw: "股票 佣金 印花税 保本价",
    fields: [{ k: "b", l: "买入价", u: "元", v: 10 }, { k: "s", l: "卖出价", u: "元", v: 11 }, { k: "q", l: "股数", u: "股", v: 1000 }, { k: "c", l: "佣金费率", u: "‱", v: 2.5 }, { k: "min", l: "最低佣金（免五填 0）", u: "元", v: 5 }],
    run: function (v) {
      pos(v.b, v.q); need(v.s, v.c, v.min); var B = v.b * v.q, S = v.s * v.q, cm = function (x) { return Math.max(x * v.c / 1e4, v.min); };
      var fb = cm(B) + B * 1e-5, fs = cm(S) + S * 1e-5 + S * 5e-4, pl = S - B - fb - fs, be = (B + fb + v.min) / v.q / (1 - v.c / 1e4 - 1e-5 - 5e-4);
      return { big: [pl >= 0 ? "净盈利" : "净亏损", y(Math.abs(pl))], kv: [["收益率", pct(pl / (B + fb))], ["买入费用", y(fb)], ["卖出费用（含印花税）", y(fs)], ["保本卖出价约", f(be, 3) + " 元"]], note: "印花税 0.05% 仅卖出时收取（2023 年 8 月 28 日起减半），过户费双向 0.001%。" };
    } });

  add({ cat: "finance", id: "stock-avg-cost", name: "股票补仓 / 摊薄成本", desc: "多次买入后的持仓均价；补多少股能把成本降到目标价", kw: "补仓 摊薄 均价 成本价",
    fields: [{ k: "p", l: "每次买入（价格, 股数）", t: "list", cols: [{ k: "pr", l: "价格", nv: "" }, { k: "q", l: "股数", nv: "" }], v: [[12, 1000], [10, 1000]] }, { k: "now", l: "现价（算补到目标需要多少）", u: "元", v: 9 }, { k: "t", l: "目标成本价", u: "元", v: 10.5 }],
    run: function (v) {
      var rs = v.p.filter(function (r) { return ok(r[0]) && ok(r[1]) && r[1] > 0; }); if (!rs.length) throw "至少填一笔买入";
      var q = rs.reduce(function (s, r) { return s + r[1]; }, 0), c = rs.reduce(function (s, r) { return s + r[0] * r[1]; }, 0), avg = c / q, kv = [["持仓股数", q + " 股"], ["总成本", y(c)]];
      if (ok(v.now) && ok(v.t) && v.now > 0) { kv.push(["按现价市值盈亏", y((v.now - avg) * q)]); if (v.t > v.now && v.t < avg) kv.push(["降到 " + v.t + " 元需补", Math.ceil((c - v.t * q) / (v.t - v.now) / 100) * 100 + " 股"]); }
      return { big: ["持仓均价", f(avg, 3) + " 元"], kv: kv };
    } });

  add({ cat: "finance", id: "rule-72", name: "72 法则 / 翻倍时间", desc: "按年化收益算资产翻倍需要几年，或按年限反推收益率", kw: "72法则 翻倍",
    fields: [{ k: "r", l: "年化收益率", u: "%", v: 6 }],
    run: function (v) { pos(v.r); var ex = Math.log(2) / Math.log(1 + v.r / 100); return { big: ["翻倍需要", f(ex, 1) + " 年"], kv: [["72 法则估算", f(72 / v.r, 1) + " 年"], ["翻 3 倍", f(Math.log(3) / Math.log(1 + v.r / 100), 1) + " 年"], ["翻 10 倍", f(Math.log(10) / Math.log(1 + v.r / 100), 1) + " 年"]] }; } });

  add({ cat: "finance", id: "roi", name: "投资回报率 ROI", desc: "总回报率和年化回报率", kw: "roi 回报率 年化",
    fields: [{ k: "a", l: "投入", u: "元", v: 50000 }, { k: "b", l: "回收（含收益）", u: "元", v: 68000 }, { k: "n", l: "持有时间", u: "年", v: 3 }],
    run: function (v) { pos(v.a, v.n); need(v.b); var r = v.b / v.a - 1; return { big: ["年化回报率", pct(Math.pow(v.b / v.a, 1 / v.n) - 1)], kv: [["总回报率", pct(r)], ["净收益", y(v.b - v.a)]] }; } });

  add({ cat: "finance", id: "savings-goal", name: "存钱目标计算器", desc: "想在几个月内存够一笔钱，每月要存多少", kw: "存钱 攒钱 目标",
    fields: [{ k: "t", l: "目标金额", u: "元", v: 50000 }, { k: "h", l: "已存", u: "元", v: 5000 }, { k: "n", l: "计划月数", u: "月", v: 18 }, { k: "r", l: "存款 / 理财年化", u: "%", v: 1.5 }],
    run: function (v) { pos(v.t, v.n); need(v.h, v.r); var r = v.r / 1200, gap = v.t - v.h * Math.pow(1 + r, v.n); if (gap <= 0) return { big: ["已经够了", "不用再存"] }; var m = r ? gap * r / (Math.pow(1 + r, v.n) - 1) : gap / v.n; return { big: ["每月存", y(m)], kv: [["每周约", y(m * 12 / 52)], ["每天约", y(m * 12 / 365)]] }; } });

  add({ cat: "finance", id: "loan-afford", name: "能贷多少钱（按月供反推）", desc: "按每月能承受的还款额反推贷款额度", kw: "贷款额度 月供反推",
    fields: [{ k: "m", l: "每月可承受还款", u: "元", v: 6000 }, { k: "r", l: "年利率", u: "%", v: 3.1 }, { k: "n", l: "贷款年限", u: "年", v: 30 }],
    run: function (v) { pos(v.m, v.n); need(v.r); var r = v.r / 1200, N = v.n * 12, P = r ? v.m * (1 - Math.pow(1 + r, -N)) / r : v.m * N; return { big: ["可贷款", wy(P)], kv: [["总利息", wy(v.m * N - P)], ["月收入建议不低于", y(v.m * 2)]], note: "银行一般要求月供不超过月收入的 50%。" }; } });

  add({ cat: "finance", id: "dividend-yield", name: "股息率计算器", desc: "按每股分红和股价算股息率，算每年能领多少分红", kw: "股息率 分红 红利",
    fields: [{ k: "d", l: "每股年度分红（税前）", u: "元", v: 0.5 }, { k: "p", l: "股价", u: "元", v: 10 }, { k: "q", l: "持股数", u: "股", v: 10000 }, { k: "h", l: "持有期限", t: "sel", o: [[0, "超过 1 年（免税）"], [0.1, "1 个月至 1 年（10%）"], [0.2, "1 个月以内（20%）"]], v: 0 }],
    run: function (v) { pos(v.p); need(v.d, v.q); var gross = v.d * v.q; return { big: ["股息率", pct(v.d / v.p)], kv: [["税前分红", y(gross)], ["税后到手", y(gross * (1 - v.h))]], note: "A 股红利税实行差别化：持股超 1 年免征，1 个月至 1 年按 10%，1 个月以内按 20%，卖出时补扣。" }; } });

  add({ cat: "finance", id: "pension-estimate", name: "养老金估算", desc: "按缴费年限、缴费指数和个人账户估算退休后每月养老金", kw: "养老金 退休金 社保",
    fields: [{ k: "w", l: "退休时当地社平工资（计发基数）", u: "元/月", v: 9000 }, { k: "i", l: "平均缴费指数", v: 1, hint: "按社平工资缴费为 1，最低档 0.6" }, { k: "n", l: "累计缴费年限", u: "年", v: 30 }, { k: "acc", l: "个人账户累计储存额", u: "元", v: 200000 }, { k: "a", l: "退休年龄", t: "sel", o: [[195, "50 岁"], [170, "55 岁"], [164, "56 岁"], [158, "57 岁"], [152, "58 岁"], [145, "59 岁"], [139, "60 岁"], [132, "61 岁"], [125, "62 岁"], [117, "63 岁"]], v: 139 }],
    run: function (v) {
      pos(v.w, v.i, v.n); need(v.acc); var base = v.w * (1 + v.i) / 2 * v.n / 100, per = v.acc / v.a;
      return { big: ["每月约", y(base + per)], kv: [["基础养老金", y(base)], ["个人账户养老金", y(per)], ["计发月数", v.a + " 个月"], ["替代率（对社平）", pct((base + per) / v.w, 0)]], note: "按城镇职工基本养老保险通用公式估算，未含过渡性养老金和地方补贴，以当地社保部门核定为准。" };
    } });

  /* ======================= 房产置业 ======================= */
  add({ cat: "property", id: "hpf-deposit", name: "公积金月缴存额计算器", desc: "按缴存基数和比例算个人、单位每月缴存额", kw: "公积金 缴存 比例",
    fields: [{ k: "b", l: "缴存基数", u: "元", v: 10000 }, { k: "p", l: "个人比例", u: "%", v: 12 }, { k: "c", l: "单位比例", u: "%", v: 12 }],
    run: function (v) { pos(v.b); need(v.p, v.c); var a = v.b * v.p / 100, b = v.b * v.c / 100; return { big: ["每月入账", y(a + b)], kv: [["个人缴存", y(a)], ["单位缴存", y(b)], ["每年入账", y((a + b) * 12)]], note: "缴存比例 5%–12%，基数上下限以当地公积金中心每年公布为准。" }; } });

  add({ cat: "property", id: "loan-term-compare", name: "贷款年限对比", desc: "同样的贷款额，10 / 15 / 20 / 25 / 30 年的月供和总利息", kw: "贷款年限 30年 20年",
    fields: [{ k: "p", l: "贷款金额", u: "万元", v: 100 }, { k: "r", l: "年利率", u: "%", v: 3.1 }],
    run: function (v) { pos(v.p); need(v.r); var P = v.p * 1e4; return { table: { h: ["年限", "月供（元）", "总利息（万元）"], r: [10, 15, 20, 25, 30].map(function (n) { var m = pmt(P, v.r / 1200, n * 12); return [n + " 年", f(m, 0), f((m * n * 12 - P) / 1e4, 2)]; }) }, note: "等额本息。年限越长月供越低、总利息越高；可先贷长年限，有闲钱再提前还。" }; } });

  add({ cat: "property", id: "house-affordability", name: "买得起多少钱的房", desc: "按收入、存款和利率算能买的总价和面积", kw: "买房 预算 能买多大",
    fields: [{ k: "inc", l: "家庭月收入", u: "元", v: 20000 }, { k: "debt", l: "其他月负债", u: "元", v: 0 }, { k: "s", l: "可用于首付的存款", u: "万元", v: 60 }, { k: "d", l: "首付比例", u: "%", v: 20 }, { k: "r", l: "房贷利率", u: "%", v: 3.1 }, { k: "n", l: "贷款年限", u: "年", v: 30 }, { k: "up", l: "目标区域单价", u: "元/㎡", v: 30000 }],
    run: function (v) {
      pos(v.inc, v.d, v.n); need(v.debt, v.s, v.r, v.up); var m = Math.max(v.inc * .5 - v.debt, 0), r = v.r / 1200, N = v.n * 12, L = r ? m * (1 - Math.pow(1 + r, -N)) / r : m * N;
      var bySave = v.s * 1e4 * 0.95 / (v.d / 100), byLoan = L / (1 - v.d / 100), price = Math.min(bySave, byLoan);
      return { big: ["可承受总价", wy(price)], kv: [["受限于", bySave < byLoan ? "首付存款" : "月供能力"], ["月供", y(pmt(price * (1 - v.d / 100), r, N))], ["对应面积", v.up ? f(price / v.up, 0) + " ㎡" : "—"]], note: "按月供不超过收入 50%，首付外预留 5% 用于税费。" };
    } });

  add({ cat: "property", id: "rental-income-tax", name: "个人出租房屋税费", desc: "个人出租住房的个税、房产税估算", kw: "出租 房租 个税 房产税",
    fields: [{ k: "r", l: "月租金", u: "元", v: 5000 }, { k: "rep", l: "当月修缮费（每月最多扣 800）", u: "元", v: 0 }],
    run: function (v) {
      pos(v.r); need(v.rep); var hp = v.r * .04, base = v.r - hp - Math.min(v.rep, 800), taxable = base <= 4000 ? base - 800 : base * .8, it = Math.max(taxable, 0) * .1;
      return { big: ["每月税费约", y(hp + it)], kv: [["房产税（4%）", y(hp)], ["个税（10%）", y(it)], ["综合税负", pct((hp + it) / v.r, 1)], ["增值税", v.r <= 1e5 ? "月租 10 万以下免征" : "需缴纳"]], note: "个人出租住房房产税减按 4%、个税减按 10%。很多城市对个人出租实行综合征收率，以当地税务局为准。" };
    } });

  add({ cat: "property", id: "unit-total-price", name: "单价 / 总价换算", desc: "单价、面积、总价互算，比较两套房的实际单价", kw: "单价 总价 每平米",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["总价 + 面积", "单价 + 面积"] }, { k: "a", l: "面积", u: "㎡", v: 89 }, { k: "x", l: "总价（万元）/ 单价（元/㎡）", v: 260 }],
    run: function (v) { pos(v.a, v.x); return v.m[0] === "总" ? { big: ["单价", y(v.x * 1e4 / v.a) + "/㎡"] } : { big: ["总价", wy(v.x * v.a)] }; } });

  add({ cat: "property", id: "rent-split", name: "合租房租分摊", desc: "按房间面积和独卫、阳台等加权分摊房租", kw: "合租 分摊 房租",
    fields: [{ k: "t", l: "整套月租", u: "元", v: 6000 }, { k: "p", l: "公共区域按人均分摊的比例", u: "%", v: 30 },
      { k: "r", l: "房间（面积㎡, 加权系数）", t: "list", cols: [{ k: "n", l: "房间", t: "text", nv: "" }, { k: "a", l: "面积", nv: "" }, { k: "w", l: "系数（独卫 1.2）", nv: 1 }], v: [["主卧", 18, 1.2], ["次卧", 12, 1], ["小卧", 9, 1]] }],
    run: function (v) {
      pos(v.t); need(v.p); var rs = v.r.filter(function (r) { return ok(r[1]) && r[1] > 0; }).map(function (r, i) { return { n: String(r[0]).trim() || "房间" + (i + 1), s: r[1] * (ok(r[2]) ? r[2] : 1) }; }); if (rs.length < 2) throw "至少两个房间";
      var tot = rs.reduce(function (a, r) { return a + r.s; }, 0), pub = v.t * v.p / 100 / rs.length, priv = v.t * (1 - v.p / 100);
      return { table: { h: ["房间", "每月房租（元）"], r: rs.map(function (r) { return [r.n, f(pub + priv * r.s / tot, 0)]; }) } };
    } });

  /* ======================= 汽车出行 ======================= */
  add({ cat: "auto", id: "trip-time", name: "行车时间计算器", desc: "按里程和平均车速算到达时间，含疲劳驾驶休息", kw: "行车时间 到达时间 高速",
    fields: [{ k: "d", l: "里程", u: "km", v: 600 }, { k: "s", l: "平均车速", u: "km/h", v: 90 }, { k: "t", l: "出发时间", t: "dt", v: (function () { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); })() }],
    run: function (v) {
      pos(v.d, v.s); var h = v.d / v.s, rests = Math.max(Math.ceil(h / 4) - 1, 0), tot = h + rests / 3, t0 = new Date(v.t); if (isNaN(t0)) throw "请选择出发时间"; var a = new Date(t0.getTime() + tot * 36e5);
      return { big: ["预计到达", iso(a) + " " + String(a.getHours()).padStart(2, "0") + ":" + String(a.getMinutes()).padStart(2, "0")], kv: [["纯驾驶", f(h, 1) + " 小时"], ["休息次数（每 4 小时 20 分钟）", rests + " 次"], ["总用时", f(tot, 1) + " 小时"]], note: "连续驾驶超过 4 小时未停车休息或停车休息少于 20 分钟属疲劳驾驶。" };
    } });

  add({ cat: "auto", id: "overspeed", name: "超速比例计算器", desc: "按限速和实际车速算超速百分比和大致处罚档位", kw: "超速 百分比 扣分",
    fields: [{ k: "l", l: "限速", u: "km/h", v: 120 }, { k: "s", l: "实际车速", u: "km/h", v: 145 }, { k: "r", l: "道路", t: "sel", o: ["高速 / 城市快速路", "其他道路"] }],
    run: function (v) {
      pos(v.l, v.s); var p = (v.s - v.l) / v.l, hw = v.r[0] === "高", t;
      if (p <= 0) t = "未超速"; else if (p < .2) t = hw ? "可能记 3 分或警告" : "可能记 1 分或警告"; else if (p < .5) t = hw ? "记 6 分" : "记 3 分"; else t = hw ? "记 12 分，可能吊销驾照" : "记 6 分，可能吊销驾照";
      return { big: ["超速", p > 0 ? pct(p, 1) : "0%"], tag: t, note: "按小型汽车《道路交通安全违法行为记分管理办法》档位估算，罚款金额各省不同，以交管部门处罚为准。" };
    } });

  add({ cat: "auto", id: "fuel-range", name: "剩余续航计算器", desc: "按油箱容量、剩余油量和油耗算还能跑多远", kw: "续航 剩余油量 油箱",
    fields: [{ k: "t", l: "油箱容量", u: "L", v: 50 }, { k: "p", l: "剩余油量", u: "%", v: 25 }, { k: "c", l: "百公里油耗", u: "L", v: 7.5 }, { k: "pr", l: "油价", u: "元/L", v: 7.5 }],
    run: function (v) { pos(v.t, v.c); need(v.p, v.pr); var left = v.t * v.p / 100; return { big: ["还能跑约", f(left / v.c * 100, 0) + " km"], kv: [["剩余油量", f(left, 1) + " L"], ["加满需要", f(v.t - left, 1) + " L，约 " + y((v.t - left) * v.pr)], ["满箱续航", f(v.t / v.c * 100, 0) + " km"]], note: "油表低于 1/4 时建议尽快加油，长期低油量行驶不利于油泵散热。" }; } });

  add({ cat: "auto", id: "oil-change", name: "保养里程 / 日期提醒", desc: "按上次保养里程和日期算下次保养", kw: "保养 机油 换油",
    fields: [{ k: "km", l: "上次保养里程", u: "km", v: 25000 }, { k: "d", l: "上次保养日期", t: "date", v: "2026-05-01" }, { k: "o", l: "机油类型", t: "sel", o: [[5000, "矿物油 5000 km / 6 个月"], [7500, "半合成 7500 km / 6 个月"], [10000, "全合成 10000 km / 12 个月"]], v: 10000 }, { k: "now", l: "当前里程", u: "km", v: 31000 }],
    run: function (v) {
      need(v.km, v.now); var mo = v.o === 10000 ? 12 : 6, nk = v.km + v.o, nd = addMonths(D(v.d), mo), left = nk - v.now, dl = dayDiff(today(), nd);
      return { big: ["下次保养", f(nk, 0) + " km 或 " + iso(nd)], tag: left <= 0 || dl <= 0 ? "已到期" : left < 1000 || dl < 30 ? "快到了" : null, kv: [["还剩里程", f(left, 0) + " km"], ["还剩天数", dl + " 天"]], note: "里程和时间以先到者为准。具体以车辆保养手册为准。" };
    } });

  add({ cat: "auto", id: "car-carbon", name: "出行碳排放计算器", desc: "燃油车、电车、公交、地铁、飞机出行的二氧化碳排放", kw: "碳排放 碳足迹 二氧化碳",
    fields: [{ k: "m", l: "出行方式", t: "sel", drop: true, o: [[0, "燃油车（按油耗）"], [1, "电动车（按电耗）"], [0.06, "公交（每人公里）"], [0.04, "地铁（每人公里）"], [0.15, "飞机（国内，每人公里）"], [0.03, "高铁（每人公里）"]], v: 0 }, { k: "d", l: "距离", u: "km", v: 100 }, { k: "c", l: "百公里油耗 L / 电耗 kWh", v: 7, show: function (v) { return Number(v.m) === 0 || Number(v.m) === 1; } }],
    run: function (v) {
      pos(v.d); var m = Number(v.m), kg = m === 0 ? v.d * v.c / 100 * 2.31 : m === 1 ? v.d * v.c / 100 * 0.57 : v.d * m;
      return { big: ["二氧化碳", f(kg, 1) + " kg"], kv: [["相当于一棵树吸收", f(kg / 18, 1) + " 年"]], note: "汽油约 2.31 kg CO₂/L；电网按全国平均约 0.57 kg/kWh；公共交通为人均估算。" };
    } });

  /* ======================= 健康健身 ======================= */
  add({ cat: "health", id: "ovulation", name: "排卵期 / 安全期计算器", desc: "按月经周期推算排卵日、易孕期和下次月经", kw: "排卵期 安全期 月经 经期",
    fields: [{ k: "l", l: "上次月经第一天", t: "date", v: function () { return iso(plus(today(), -10)); } }, { k: "c", l: "月经周期", u: "天", v: 28 }, { k: "p", l: "经期天数", u: "天", v: 5 }],
    run: function (v) {
      pos(v.c, v.p); if (v.c < 21 || v.c > 45) throw "周期一般为 21–45 天"; var l = D(v.l), rows = [];
      for (var i = 0; i < 3; i++) { var s = plus(l, v.c * i), nx = plus(s, v.c), ov = plus(nx, -14); rows.push([iso(s), iso(ov), iso(plus(ov, -5)) + " ~ " + iso(plus(ov, 1))]); }
      var nx0 = plus(l, v.c), ov0 = plus(nx0, -14);
      return { big: ["排卵日约", day(ov0)], kv: [["易孕期", iso(plus(ov0, -5)) + " ~ " + iso(plus(ov0, 1))], ["下次月经", day(nx0)]], table: { h: ["月经开始", "排卵日", "易孕期"], r: rows }, note: "按排卵日在下次月经前 14 天推算。周期不规律时误差较大，“安全期”避孕并不可靠。" };
    } });

  add({ cat: "health", id: "one-rep-max", name: "最大重量 1RM 计算器", desc: "按做组重量和次数估算 1RM，给出各百分比训练重量", kw: "1rm 卧推 深蹲 硬拉 力量",
    fields: [{ k: "w", l: "重量", u: "kg", v: 80 }, { k: "r", l: "完成次数", v: 6 }],
    run: function (v) {
      pos(v.w, v.r); if (v.r > 15) throw "次数超过 15 时估算误差较大"; var e = v.w * (1 + v.r / 30), b = v.w * 36 / (37 - v.r), m = (e + b) / 2;
      return { big: ["1RM 约", f(m, 1) + " kg"], kv: [["Epley 公式", f(e, 1) + " kg"], ["Brzycki 公式", f(b, 1) + " kg"]], table: { h: ["强度", "重量（kg）", "大约次数"], r: [[.95, 2], [.9, 4], [.85, 6], [.8, 8], [.75, 10], [.7, 12], [.6, 15]].map(function (x) { return [x[0] * 100 + "%", f(m * x[0], 1), x[1]]; }) } };
    } });

  add({ cat: "health", id: "height-prediction", name: "孩子遗传身高预测", desc: "按父母身高预测孩子成年身高（靶身高）", kw: "遗传身高 身高预测 孩子",
    fields: [{ k: "s", l: "孩子性别", t: "sel", o: ["男孩", "女孩"] }, { k: "f", l: "父亲身高", u: "cm", v: 175 }, { k: "m", l: "母亲身高", u: "cm", v: 162 }],
    run: function (v) { pos(v.f, v.m); var t = (v.f + v.m + (v.s === "男孩" ? 13 : -13)) / 2; return { big: ["预测成年身高", f(t, 1) + " cm"], kv: [["正常范围", f(t - 5, 0) + " – " + f(t + 5, 0) + " cm"]], note: "遗传约决定 70% 左右，营养、睡眠、运动也很重要。" }; } });

  add({ cat: "health", id: "caffeine", name: "咖啡因摄入计算器", desc: "统计一天喝的咖啡、茶、可乐里的咖啡因，对照建议上限", kw: "咖啡因 咖啡 茶",
    fields: [{ k: "a", l: "美式 / 拿铁（中杯）", u: "杯", v: 1 }, { k: "e", l: "浓缩（单份）", u: "份", v: 0 }, { k: "t", l: "茶（一杯）", u: "杯", v: 1 }, { k: "c", l: "可乐（330ml）", u: "罐", v: 0 }, { k: "r", l: "功能饮料（250ml）", u: "罐", v: 0 }, { k: "w", l: "体重", u: "kg", v: 60 }, { k: "p", l: "孕期 / 哺乳期", t: "sel", o: ["否", "是"] }],
    run: function (v) {
      need(v.a, v.e, v.t, v.c, v.r); pos(v.w); var mg = v.a * 150 + v.e * 64 + v.t * 40 + v.c * 34 + v.r * 80, cap = v.p === "是" ? 200 : Math.min(400, v.w * 6);
      return { big: ["今日咖啡因", f(mg, 0) + " mg"], tag: mg > cap ? "超过建议上限" : "在建议范围内", kv: [["建议上限", cap + " mg"], ["约多久代谢掉一半", "5 小时左右"]], note: "健康成年人每天不超过 400 mg，孕期不超过 200 mg。睡前 6 小时尽量不摄入。" };
    } });

  add({ cat: "health", id: "steps", name: "步数换算距离 / 热量", desc: "按步数、身高和体重算走了多远、消耗多少热量", kw: "步数 走路 一万步",
    fields: [{ k: "s", l: "步数", v: 10000 }, { k: "h", l: "身高", u: "cm", v: 170 }, { k: "w", l: "体重", u: "kg", v: 65 }],
    run: function (v) { pos(v.s, v.h, v.w); var km = v.s * v.h * .415 / 1e5; return { big: ["距离约", f(km, 2) + " km"], kv: [["消耗约", f(km * v.w * .5, 0) + " kcal"], ["用时约（每分钟 100 步）", f(v.s / 100, 0) + " 分钟"], ["步幅", f(v.h * .415, 0) + " cm"]] }; } });

  add({ cat: "health", id: "smoking-cost", name: "吸烟花费计算器", desc: "按每天抽多少、烟价和年限算花了多少钱，戒烟能省多少", kw: "吸烟 戒烟 香烟",
    fields: [{ k: "n", l: "每天抽", u: "支", v: 10 }, { k: "p", l: "每包价格（20 支）", u: "元", v: 25 }, { k: "y", l: "已抽烟年数", u: "年", v: 5 }],
    run: function (v) { pos(v.n, v.p); need(v.y); var dy = v.n / 20 * v.p; return { big: ["已花费", wy(dy * 365 * v.y)], kv: [["每月", y(dy * 30)], ["每年", y(dy * 365)], ["戒烟 10 年可省", wy(dy * 3650)], ["已抽", f(v.n * 365 * v.y, 0) + " 支"]], note: "戒烟 20 分钟心率血压下降，1 年后冠心病风险降一半。可拨打戒烟热线 400-888-5531。" }; } });

  add({ cat: "health", id: "lean-body-mass", name: "去脂体重计算器", desc: "按身高体重估算去脂体重（Boer 公式）和体脂量", kw: "去脂体重 瘦体重 lbm",
    fields: [{ k: "s", l: "性别", t: "sel", o: ["男", "女"] }, { k: "h", l: "身高", u: "cm", v: 175 }, { k: "w", l: "体重", u: "kg", v: 70 }],
    run: function (v) { pos(v.h, v.w); var l = v.s === "男" ? .407 * v.w + .267 * v.h - 19.2 : .252 * v.w + .473 * v.h - 48.3; return { big: ["去脂体重", f(l, 1) + " kg"], kv: [["脂肪重量", f(v.w - l, 1) + " kg"], ["估算体脂率", pct((v.w - l) / v.w, 1)]] }; } });

  add({ cat: "health", id: "vo2max", name: "最大摄氧量（库珀 12 分钟跑）", desc: "按 12 分钟跑的距离估算 VO₂max 和心肺水平", kw: "最大摄氧量 vo2max 库珀 心肺",
    fields: [{ k: "d", l: "12 分钟跑距离", u: "米", v: 2400 }, { k: "a", l: "年龄", u: "岁", v: 28 }, { k: "s", l: "性别", t: "sel", o: ["男", "女"] }],
    run: function (v) {
      pos(v.d, v.a); var vo = (v.d - 504.9) / 44.73, adj = v.s === "男" ? 0 : -5, x = vo - adj + (v.a - 30) * .3;
      var lv = x >= 48 ? "优秀" : x >= 42 ? "良好" : x >= 36 ? "一般" : x >= 30 ? "偏低" : "较差";
      return { big: ["VO₂max", f(vo, 1) + " ml/kg/min"], tag: lv, note: "库珀测试：尽全力跑 12 分钟记录距离。评级为大致参考。" };
    } });

  /* ======================= 数学计算 ======================= */
  add({ cat: "math", id: "points-line", name: "两点距离 / 中点 / 直线方程", desc: "平面两点的距离、中点、斜率和直线方程", kw: "两点距离 中点 斜率 直线方程",
    fields: [{ k: "x1", l: "x₁", v: 1 }, { k: "y1", l: "y₁", v: 2 }, { k: "x2", l: "x₂", v: 4 }, { k: "y2", l: "y₂", v: 6 }],
    run: function (v) {
      need(v.x1, v.y1, v.x2, v.y2); var dx = v.x2 - v.x1, dy = v.y2 - v.y1; if (!dx && !dy) throw "两点重合";
      var k = dx ? dy / dx : null, b = dx ? v.y1 - k * v.x1 : null;
      return { big: ["距离", g(Math.hypot(dx, dy), 10)], kv: [["中点", "(" + g((v.x1 + v.x2) / 2, 8) + ", " + g((v.y1 + v.y2) / 2, 8) + ")"], ["斜率", dx ? g(k, 10) : "不存在（竖直线）"], ["直线方程", dx ? "y = " + g(k, 8) + "x " + (b < 0 ? "− " : "+ ") + g(Math.abs(b), 8) : "x = " + g(v.x1, 8)], ["倾斜角", g(Math.atan2(dy, dx) * 180 / Math.PI, 6) + "°"]] };
    } });

  add({ cat: "math", id: "polygon-area", name: "多边形面积（坐标法）", desc: "按顶点坐标算任意多边形面积和周长（鞋带公式）", kw: "多边形面积 坐标 鞋带公式 地块",
    fields: [{ k: "p", l: "顶点坐标（按顺序）", t: "list", cols: [{ k: "x", l: "x", nv: "" }, { k: "y", l: "y", nv: "" }], v: [[0, 0], [4, 0], [4, 3], [0, 3]] }],
    run: function (v) {
      var P = v.p.filter(function (r) { return ok(r[0]) && ok(r[1]); }); if (P.length < 3) throw "至少 3 个顶点"; var A = 0, L = 0;
      for (var i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; A += a[0] * b[1] - b[0] * a[1]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); }
      return { big: ["面积", g(Math.abs(A) / 2, 10)], kv: [["周长", g(L, 10)], ["顶点数", P.length]] };
    } });

  add({ cat: "math", id: "roman", name: "罗马数字转换", desc: "阿拉伯数字与罗马数字互转", kw: "罗马数字",
    fields: [{ k: "s", l: "数字或罗马数字", t: "text", v: "2026" }],
    run: function (v) {
      var s = String(v.s).trim().toUpperCase(), M = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
      if (/^\d+$/.test(s)) { var n = +s; if (n < 1 || n > 3999) throw "范围 1–3999"; var r = ""; M.forEach(function (m) { while (n >= m[0]) { r += m[1]; n -= m[0]; } }); return { big: ["罗马数字", r] }; }
      if (!/^[MDCLXVI]+$/.test(s)) throw "请输入数字或罗马数字";
      var t = 0, i = 0; M.forEach(function (m) { while (s.indexOf(m[1], i) === i) { t += m[0]; i += m[1].length; } }); if (i !== s.length) throw "不是规范的罗马数字";
      return { big: ["阿拉伯数字", t] };
    } });

  add({ cat: "math", id: "power-root", name: "乘方 / 开方计算器", desc: "x 的 n 次方、n 次方根、平方根立方根", kw: "乘方 开方 平方根 立方根 次方",
    fields: [{ k: "x", l: "x", v: 2 }, { k: "n", l: "n", v: 10 }],
    run: function (v) {
      need(v.x, v.n); var root = v.x < 0 && Number.isInteger(v.n) && v.n % 2 ? -Math.pow(-v.x, 1 / v.n) : Math.pow(v.x, 1 / v.n);
      return { kv: [["xⁿ", g(Math.pow(v.x, v.n), 12)], ["ⁿ√x", v.n ? (isNaN(root) ? "无实数解" : g(root, 12)) : "—"], ["√x", v.x >= 0 ? g(Math.sqrt(v.x), 12) : "无实数解"], ["∛x", g(Math.cbrt(v.x), 12)], ["x²", g(v.x * v.x, 12)], ["x³", g(v.x * v.x * v.x, 12)]] };
    } });

  add({ cat: "math", id: "complex", name: "复数计算器", desc: "复数加减乘除、模、辐角和共轭", kw: "复数 虚数 模 辐角",
    fields: [{ k: "a", l: "z₁ 实部", v: 3 }, { k: "b", l: "z₁ 虚部", v: 4 }, { k: "c", l: "z₂ 实部", v: 1 }, { k: "d", l: "z₂ 虚部", v: -2 }],
    run: function (v) {
      need(v.a, v.b, v.c, v.d); function s(re, im) { re = +g(re, 10); im = +g(im, 10); return im === 0 ? String(re) : (re ? re + (im < 0 ? " − " : " + ") : (im < 0 ? "−" : "")) + (Math.abs(im) === 1 ? "" : Math.abs(im)) + "i"; }
      var dn = v.c * v.c + v.d * v.d;
      return { kv: [["z₁ + z₂", s(v.a + v.c, v.b + v.d)], ["z₁ − z₂", s(v.a - v.c, v.b - v.d)], ["z₁ × z₂", s(v.a * v.c - v.b * v.d, v.a * v.d + v.b * v.c)], ["z₁ ÷ z₂", dn ? s((v.a * v.c + v.b * v.d) / dn, (v.b * v.c - v.a * v.d) / dn) : "除数为 0"], ["|z₁|", g(Math.hypot(v.a, v.b), 10)], ["arg z₁", g(Math.atan2(v.b, v.a) * 180 / Math.PI, 8) + "°"], ["z₁ 共轭", s(v.a, -v.b)]] };
    } });

  add({ cat: "math", id: "vector", name: "向量计算器", desc: "三维向量的模、点积、叉积和夹角", kw: "向量 点积 叉积 夹角",
    fields: [{ k: "a", l: "向量 a（x y z）", t: "text", v: "1 2 3" }, { k: "b", l: "向量 b（x y z）", t: "text", v: "4 5 6" }],
    run: function (v) {
      var A = nums(v.a), B = nums(v.b); if (A.length === 2) A.push(0); if (B.length === 2) B.push(0); if (A.length !== 3 || B.length !== 3) throw "每个向量 2 或 3 个分量";
      var dot = A[0] * B[0] + A[1] * B[1] + A[2] * B[2], ma = Math.hypot.apply(null, A), mb = Math.hypot.apply(null, B), cr = [A[1] * B[2] - A[2] * B[1], A[2] * B[0] - A[0] * B[2], A[0] * B[1] - A[1] * B[0]];
      return { kv: [["|a|", g(ma, 10)], ["|b|", g(mb, 10)], ["a · b", g(dot, 10)], ["a × b", "(" + cr.map(function (x) { return g(x, 10); }).join(", ") + ")"], ["夹角", ma && mb ? g(Math.acos(Math.max(-1, Math.min(1, dot / ma / mb))) * 180 / Math.PI, 8) + "°" : "—"], ["a + b", "(" + A.map(function (x, i) { return g(x + B[i], 10); }).join(", ") + ")"]] };
    } });

  add({ cat: "math", id: "aspect-ratio", name: "宽高比 / 等比缩放", desc: "算图片、屏幕的宽高比，按比例缩放尺寸", kw: "宽高比 比例 缩放 16:9",
    fields: [{ k: "w", l: "原始宽", v: 1920 }, { k: "h", l: "原始高", v: 1080 }, { k: "nw", l: "新宽（算新高）", v: 1280 }],
    run: function (v) { pos(v.w, v.h); var k = H.gcd(Math.round(v.w), Math.round(v.h)) || 1; return { big: ["宽高比", Math.round(v.w) / k + " : " + Math.round(v.h) / k], kv: [["小数比", g(v.w / v.h, 6) + " : 1"], ["新高", ok(v.nw) && v.nw > 0 ? g(v.nw * v.h / v.w, 6) : "—"]] }; } });

  /* ======================= 单位换算 ======================= */
  unit("acceleration", "加速度换算器", "米/秒²、g、厘米/秒²、英尺/秒²", "加速度 g", [["m/s²", 1], ["重力加速度 g", 9.80665], ["cm/s²（伽）", 0.01], ["ft/s²", 0.3048], ["km/h/s", 1 / 3.6]], "m/s²");
  unit("charge", "电荷 / 电池容量换算", "库仑、安时、毫安时", "电荷 库仑 mah", [["库仑 C", 1], ["毫安时 mAh", 3.6], ["安时 Ah", 3600], ["法拉第", 96485.33]], "毫安时 mAh");

  var FS = [["初号", 42], ["小初", 36], ["一号", 26], ["小一", 24], ["二号", 22], ["小二", 18], ["三号", 16], ["小三", 15], ["四号", 14], ["小四", 12], ["五号", 10.5], ["小五", 9], ["六号", 7.5], ["小六", 6.5], ["七号", 5.5], ["八号", 5]];
  add({ cat: "convert", id: "font-size", name: "字号换算（号 / 磅 / 像素）", desc: "Word 中文字号、磅 pt、像素 px、毫米互换", kw: "字号 小四 磅 pt px",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["中文字号", "磅 pt", "像素 px"] }, { k: "z", l: "字号", t: "sel", drop: true, o: FS.map(function (x) { return [x[1], x[0] + "（" + x[1] + " pt）"]; }), v: 12, show: function (v) { return v.m === "中文字号"; } }, { k: "x", l: "数值", v: 16, show: function (v) { return v.m !== "中文字号"; } }],
    run: function (v) {
      var pt = v.m === "中文字号" ? v.z : v.m === "磅 pt" ? v.x : v.x * .75; pos(pt); var near = FS.reduce(function (a, b) { return Math.abs(b[1] - pt) < Math.abs(a[1] - pt) ? b : a; });
      return { kv: [["磅 pt", g(pt, 6)], ["像素 px（96 dpi）", g(pt / .75, 6)], ["毫米", g(pt * .3528, 4)], ["最接近的中文字号", near[0]], ["CSS rem（基准 16px）", g(pt / .75 / 16, 4)]] };
    } });

  add({ cat: "convert", id: "ring-size", name: "戒指尺寸换算", desc: "按手指周长换算港码（国内号）、美码、日码", kw: "戒指 指圈 港码 美码",
    fields: [{ k: "c", l: "手指周长", u: "mm", v: 52 }],
    run: function (v) { pos(v.c); if (v.c < 40 || v.c > 75) throw "周长一般在 40–75 mm"; return { big: ["港码（国内号）", Math.round(v.c - 40) + " 号"], kv: [["美码", g(Math.round((v.c - 36.5) / 2.55 * 2) / 2, 3)], ["日码", Math.round(v.c - 38)], ["内直径", f(v.c / Math.PI, 1) + " mm"]], note: "用细纸条绕手指一圈量周长，晚上手指略粗时量更准。宽戒面建议大半号。" }; } });

  add({ cat: "convert", id: "paper-size", name: "纸张尺寸查询", desc: "A、B 系列和信纸的毫米、英寸和 300 dpi 像素尺寸", kw: "纸张 a4 尺寸 像素",
    fields: [{ k: "p", l: "纸张", t: "sel", drop: true, o: [["841x1189", "A0"], ["594x841", "A1"], ["420x594", "A2"], ["297x420", "A3"], ["210x297", "A4"], ["148x210", "A5"], ["105x148", "A6"], ["250x353", "B4"], ["176x250", "B5"], ["257x364", "B4（国内 JIS）"], ["182x257", "B5（国内 JIS 16 开）"], ["216x279", "Letter 信纸"], ["216x356", "Legal"]], v: "210x297" }, { k: "d", l: "分辨率", u: "dpi", v: 300 }],
    run: function (v) { pos(v.d); var s = String(v.p).split("x").map(Number); return { big: ["尺寸", s[0] + " × " + s[1] + " mm"], kv: [["英寸", f(s[0] / 25.4, 2) + " × " + f(s[1] / 25.4, 2) + " in"], ["像素（" + v.d + " dpi）", Math.round(s[0] / 25.4 * v.d) + " × " + Math.round(s[1] / 25.4 * v.d)], ["厘米", s[0] / 10 + " × " + s[1] / 10 + " cm"]] }; } });

  add({ cat: "convert", id: "wind-scale", name: "风力等级换算", desc: "风速（米/秒、公里/时）与蒲福风级互换", kw: "风力 风级 蒲福 台风",
    fields: [{ k: "s", l: "风速", v: 10 }, { k: "u", l: "单位", t: "sel", o: [[1, "米/秒"], [1 / 3.6, "公里/时"], [0.514444, "节"]], v: 1 }],
    run: function (v) {
      need(v.s); var ms = v.s * v.u, T = [[0.2, "0 级 无风"], [1.5, "1 级 软风"], [3.3, "2 级 轻风"], [5.4, "3 级 微风"], [7.9, "4 级 和风"], [10.7, "5 级 清劲风"], [13.8, "6 级 强风"], [17.1, "7 级 疾风"], [20.7, "8 级 大风"], [24.4, "9 级 烈风"], [28.4, "10 级 狂风"], [32.6, "11 级 暴风"], [36.9, "12 级 台风（飓风）"], [41.4, "13 级"], [46.1, "14 级"], [50.9, "15 级"], [56, "16 级"], [61.2, "17 级"]];
      var lv = (T.filter(function (t) { return ms <= t[0]; })[0] || [0, "17 级以上"])[1];
      return { big: ["风力", lv], kv: [["米/秒", g(ms, 4)], ["公里/时", g(ms * 3.6, 4)], ["节", g(ms / .514444, 4)]], note: "台风等级：热带风暴 8–9 级，强热带风暴 10–11 级，台风 12–13 级，强台风 14–15 级，超强台风 16 级以上。" };
    } });

  /* ======================= 日期时间 ======================= */
  var STARS = [[120, "摩羯座"], [219, "水瓶座"], [321, "双鱼座"], [420, "白羊座"], [521, "金牛座"], [622, "双子座"], [723, "巨蟹座"], [823, "狮子座"], [923, "处女座"], [1024, "天秤座"], [1123, "天蝎座"], [1222, "射手座"], [1232, "摩羯座"]];
  add({ cat: "date", id: "constellation", name: "星座查询", desc: "按生日查星座、对应日期范围和生肖", kw: "星座 生日",
    fields: [{ k: "d", l: "生日", t: "date", v: "2000-06-15" }],
    run: function (v) {
      var d = D(v.d), md = (d.getMonth() + 1) * 100 + d.getDate(), s = STARS.filter(function (x) { return md < x[0]; })[0][1], lu = H.lunar(d), zod = "鼠牛虎兔龙蛇马羊猴鸡狗猪"[((lu.y - 4) % 12 + 12) % 12];
      return { big: ["星座", s], kv: [["生肖", zod + "（" + lu.gz + "年）"], ["农历生日", lu.s]] };
    } });

  add({ cat: "date", id: "shichen", name: "时辰查询", desc: "钟点与十二时辰、更、刻互换", kw: "时辰 子时 午时 几更",
    fields: [{ k: "t", l: "时间（时:分）", t: "text", v: "23:30" }],
    run: function (v) {
      var m = String(v.t).match(/^(\d{1,2})[:：](\d{1,2})$/); if (!m || +m[1] > 23 || +m[2] > 59) throw "格式如 23:30"; var h = +m[1], mi = +m[2], i = Math.floor(((h + 1) % 24) / 2), ZZ = "子丑寅卯辰巳午未申酉戌亥";
      var start = (i * 2 + 23) % 24, into = ((h - start + 24) % 24) * 60 + mi, ke = Math.floor(into / 15) + 1;
      var geng = h >= 19 || h < 5 ? ["一更", "二更", "三更", "四更", "五更"][Math.floor(((h + 5) % 24) / 2)] : "白天，无更";
      return { big: ["时辰", ZZ[i] + "时" + (into < 60 ? "（初）" : "（正）")], kv: [["时段", String(start).padStart(2, "0") + ":00 – " + String((start + 2) % 24).padStart(2, "0") + ":00"], ["刻", "第 " + ke + " 刻"], ["更", geng]] };
    } });

  add({ cat: "date", id: "life-progress", name: "人生进度条", desc: "按出生日期和预期寿命算已经度过的天数、周数和百分比", kw: "人生进度 活了多少天",
    fields: [{ k: "b", l: "出生日期", t: "date", v: "2000-06-15" }, { k: "e", l: "预期寿命", u: "岁", v: 79 }],
    run: function (v) { pos(v.e); var b = D(v.b), t = today(), lived = dayDiff(b, t); if (lived < 0) throw "出生日期在未来"; var end = addMonths(b, v.e * 12), tot = dayDiff(b, end); return { big: ["人生进度", pct(Math.min(lived / tot, 1), 1)], kv: [["已度过", lived.toLocaleString() + " 天 · " + Math.floor(lived / 7).toLocaleString() + " 周"], ["还剩约", Math.max(tot - lived, 0).toLocaleString() + " 天 · " + Math.max(Math.floor((tot - lived) / 7), 0).toLocaleString() + " 周"], ["下个整万天", (function () { var k = Math.ceil((lived + 1) / 1e4) * 1e4; return k + " 天 · " + iso(plus(b, k)); })()]], note: "中国居民人均预期寿命 2024 年为 79 岁。" }; } });

  add({ cat: "date", id: "leap-year", name: "闰年判断", desc: "判断某年是不是闰年，列出前后闰年", kw: "闰年 2月29日",
    fields: [{ k: "y", l: "年份", v: 2028 }],
    run: function (v) { if (!Number.isInteger(v.y)) throw "请输入整数年份"; var L = function (x) { return x % 4 === 0 && x % 100 !== 0 || x % 400 === 0; }, a = v.y, b = v.y; do a--; while (!L(a)); do b++; while (!L(b)); return { big: [v.y + " 年", L(v.y) ? "是闰年（366 天）" : "平年（365 天）"], kv: [["上一个闰年", a], ["下一个闰年", b]], note: "四年一闰，百年不闰，四百年再闰。" }; } });

  add({ cat: "date", id: "age-gap", name: "年龄差计算器", desc: "两个人的年龄差、谁大，以及一些有趣的日子", kw: "年龄差 相差几岁",
    fields: [{ k: "a", l: "甲的生日", t: "date", v: "1998-03-12" }, { k: "b", l: "乙的生日", t: "date", v: "2000-11-05" }],
    run: function (v) { var a = D(v.a), b = D(v.b), old = a <= b ? a : b, yng = a <= b ? b : a, d = ymd(old, yng); return { big: ["相差", d[0] + " 年 " + d[1] + " 个月 " + d[2] + " 天"], kv: [[a <= b ? "甲更大" : "乙更大", dayDiff(old, yng) + " 天"], ["大的那位年龄是小的两倍那天", iso(plus(yng, dayDiff(old, yng)))]] }; } });

  add({ cat: "date", id: "month-calendar", name: "万年历（含农历）", desc: "查任意月份的公历、农历和节气", kw: "万年历 日历 农历 月历",
    fields: [{ k: "m", l: "月份", t: "text", v: (function () { var t = new Date(); return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0"); })() }],
    run: function (v) {
      var m = String(v.m).match(/^(\d{4})[-/.年](\d{1,2})/); if (!m) throw "格式如 2026-10"; var Y = +m[1], M = +m[2] - 1; if (Y < 1901 || Y > 2099 || M < 0 || M > 11) throw "支持 1901–2099 年";
      var first = new Date(Y, M, 1), n = new Date(Y, M + 1, 0).getDate(), rows = [], row = [], pad = (first.getDay() + 6) % 7;
      for (var i = 0; i < pad; i++) row.push("");
      for (var d = 1; d <= n; d++) { var lu = H.lunar(new Date(Y, M, d)); row.push(d + " " + (lu.d === 1 ? lu.m : lu.s.slice(-2))); if (row.length === 7) { rows.push(row); row = []; } }
      if (row.length) { while (row.length < 7) row.push(""); rows.push(row); }
      var l1 = H.lunar(first); return { big: [Y + " 年 " + (M + 1) + " 月", l1.gz + "年"], table: { h: ["一", "二", "三", "四", "五", "六", "日"], r: rows } };
    } });

  /* ======================= 生活实用 ======================= */
  add({ cat: "life", id: "tip", name: "小费计算器", desc: "出国吃饭按比例算小费，含税前税后和人均", kw: "小费 tip 美国",
    fields: [{ k: "b", l: "账单金额", v: 86 }, { k: "t", l: "小费比例", t: "sel", o: [[15, "15%"], [18, "18%"], [20, "20%"], [22, "22%"], [25, "25%"]], v: 18 }, { k: "n", l: "人数", v: 2 }],
    run: function (v) { pos(v.b, v.n); var tip = v.b * v.t / 100; return { big: ["小费", f(tip, 2)], kv: [["合计", f(v.b + tip, 2)], ["人均", f((v.b + tip) / v.n, 2)]], note: "美国餐厅通常 18%–22%，按税前金额计算；日本、中国一般不需要小费。" }; } });

  add({ cat: "life", id: "recipe-scale", name: "菜谱用量换算", desc: "按份数等比缩放菜谱用量", kw: "菜谱 用量 份数 食谱",
    fields: [{ k: "a", l: "原菜谱份数", v: 4 }, { k: "b", l: "想做份数", v: 6 }, { k: "i", l: "食材（名称, 用量, 单位）", t: "list", cols: [{ k: "n", l: "食材", t: "text", nv: "" }, { k: "q", l: "用量", nv: "" }, { k: "u", l: "单位", t: "text", nv: "g" }], v: [["五花肉", 500, "g"], ["生抽", 2, "勺"], ["冰糖", 30, "g"]] }],
    run: function (v) { pos(v.a, v.b); var k = v.b / v.a, rs = v.i.filter(function (r) { return String(r[0]).trim() && ok(r[1]); }); if (!rs.length) throw "至少填一种食材"; return { big: ["换算倍数", g(k, 4) + " 倍"], table: { h: ["食材", "原用量", "新用量"], r: rs.map(function (r) { return [r[0], g(r[1], 6) + " " + (r[2] || ""), g(r[1] * k, 4) + " " + (r[2] || "")]; }) }, note: "盐和调料可先放 90%，尝过再补；烹饪时间不随份数等比增加。" }; } });

  add({ cat: "life", id: "lucky-money", name: "拼手气红包模拟", desc: "按总金额和个数随机拆分红包（二倍均值法）", kw: "红包 拼手气 随机",
    fields: [{ k: "t", l: "总金额", u: "元", v: 100 }, { k: "n", l: "红包个数", v: 8 }],
    run: function (v) {
      pos(v.t); if (!Number.isInteger(v.n) || v.n < 1 || v.n > 200) throw "个数 1–200"; var c = Math.round(v.t * 100); if (c < v.n) throw "每个红包至少 0.01 元";
      var out = [], left = c; for (var i = v.n; i > 1; i--) { var mx = Math.floor(left / i * 2) - 1, x = Math.max(1, Math.floor(rnd() * mx) + 1); x = Math.min(x, left - (i - 1)); out.push(x); left -= x; } out.push(left);
      var best = Math.max.apply(null, out);
      return { big: ["手气最佳", y(best / 100)], table: { h: ["第几个", "金额（元）"], r: out.map(function (x, i) { return [i + 1 + (x === best ? " 👑" : ""), f(x / 100)]; }) }, note: "每次重新计算都会重新拆。" };
    } });

  add({ cat: "life", id: "dog-food", name: "猫狗每日喂食量", desc: "按体重和状态算宠物每天需要的热量和粮食克数", kw: "狗粮 猫粮 喂食量 宠物",
    fields: [{ k: "s", l: "宠物", t: "sel", o: ["狗", "猫"] }, { k: "w", l: "体重", u: "kg", v: 10 }, { k: "k", l: "状态", t: "sel", drop: true, o: [[1.6, "已绝育成年"], [1.8, "未绝育成年"], [1.2, "需要减肥"], [3, "幼年（4 个月以下）"], [2, "幼年（4 个月以上）"], [1.4, "老年 / 活动少"]], v: 1.6 }, { k: "kc", l: "粮食热量", u: "kcal/100g", v: 380 }],
    run: function (v) { pos(v.w, v.kc); var rer = 70 * Math.pow(v.w, .75), k = v.s === "猫" ? Math.max(v.k - .4, 1) : v.k, mer = rer * k; return { big: ["每天约", f(mer / v.kc * 100, 0) + " g 粮"], kv: [["每日热量", f(mer, 0) + " kcal"], ["静息热量 RER", f(rer, 0) + " kcal"]], note: "零食不超过每日热量的 10%。以包装推荐量和体型变化为准，有疾病请遵兽医建议。" }; } });

  add({ cat: "life", id: "commute-cost", name: "通勤成本计算器", desc: "每月通勤花费和时间，算上时间价值后的真实成本", kw: "通勤 上班 地铁 打车",
    fields: [{ k: "c", l: "单程费用", u: "元", v: 6 }, { k: "t", l: "单程时间", u: "分钟", v: 50 }, { k: "d", l: "每月通勤天数", u: "天", v: 22 }, { k: "h", l: "你的时薪（算时间成本）", u: "元", v: 50 }],
    run: function (v) { need(v.c, v.t, v.h); pos(v.d); var money = v.c * 2 * v.d, hrs = v.t * 2 * v.d / 60; return { big: ["每月通勤", f(hrs, 1) + " 小时 · " + y(money)], kv: [["每年通勤时间", f(hrs * 12 / 24, 1) + " 天"], ["每月时间成本", y(hrs * v.h)], ["每月真实成本", y(money + hrs * v.h)]] }; } });

  add({ cat: "life", id: "subscriptions", name: "订阅费用汇总", desc: "把各种会员、App 订阅汇总成每月、每年花费", kw: "订阅 会员 自动续费",
    fields: [{ k: "s", l: "订阅（名称, 价格, 每几个月扣一次）", t: "list", cols: [{ k: "n", l: "名称", t: "text", nv: "" }, { k: "p", l: "价格", nv: "" }, { k: "m", l: "周期（月）", nv: 1 }], v: [["视频会员", 25, 1], ["音乐", 15, 1], ["网盘", 298, 12], ["云服务器", 60, 12]] }],
    run: function (v) {
      var rs = v.s.filter(function (r) { return ok(r[1]) && r[1] > 0; }).map(function (r, i) { var m = ok(r[2]) && r[2] > 0 ? r[2] : 1; return [String(r[0]).trim() || "订阅" + (i + 1), r[1] / m]; }); if (!rs.length) throw "至少填一项";
      var mon = rs.reduce(function (a, r) { return a + r[1]; }, 0); rs.sort(function (a, b) { return b[1] - a[1]; });
      return { big: ["每年", y(mon * 12)], kv: [["每月", y(mon)]], table: { h: ["订阅", "折合每月（元）", "占比"], r: rs.map(function (r) { return [r[0], f(r[1]), pct(r[1] / mon, 0)]; }) } };
    } });

  /* ======================= 教育学业 ======================= */
  add({ cat: "edu", id: "z-score", name: "标准分 / Z 分数", desc: "按平均分和标准差算 Z 分、T 分和大约超过多少人", kw: "标准分 z分数 t分数 百分位",
    fields: [{ k: "x", l: "你的分数", v: 82 }, { k: "m", l: "平均分", v: 70 }, { k: "s", l: "标准差", v: 8 }],
    run: function (v) {
      need(v.x, v.m); pos(v.s); var z = (v.x - v.m) / v.s, t = 1 / (1 + .2316419 * Math.abs(z)), p = 1 - .3989423 * Math.exp(-z * z / 2) * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      if (z < 0) p = 1 - p;
      return { big: ["Z 分数", g(z, 4)], kv: [["T 分数", g(50 + 10 * z, 4)], ["约超过", pct(p, 1) + " 的人"]], note: "假设成绩服从正态分布。" };
    } });

  add({ cat: "edu", id: "school-entry", name: "入学年龄计算器", desc: "按出生日期算哪年上小学、初中、高中、大学", kw: "入学 上小学 几岁上学",
    fields: [{ k: "b", l: "孩子出生日期", t: "date", v: "2021-07-20" }, { k: "c", l: "入学截止日", t: "sel", o: [["8-31", "8 月 31 日（大多数地区）"], ["9-1", "9 月 1 日"]], v: "8-31" }],
    run: function (v) {
      var b = D(v.b), c = String(v.c).split("-").map(Number), yr = b.getFullYear() + 6; if (b.getMonth() + 1 > c[0] || (b.getMonth() + 1 === c[0] && b.getDate() > c[1])) yr++;
      return { big: ["上小学", yr + " 年 9 月"], kv: [["幼儿园小班", yr - 3 + " 年 9 月"], ["初中", yr + 6 + " 年 9 月"], ["高中", yr + 9 + " 年 9 月"], ["大学", yr + 12 + " 年 9 月"]], note: "义务教育法规定年满 6 周岁入学。截止日以当地教育局为准，按六三三学制计算。" };
    } });

  add({ cat: "edu", id: "credit-progress", name: "学分进度计算器", desc: "已修学分、毕业要求和剩余学期，算每学期要修多少", kw: "学分 毕业 选课",
    fields: [{ k: "t", l: "毕业要求学分", v: 160 }, { k: "d", l: "已修学分", v: 98 }, { k: "s", l: "剩余学期数", v: 3 }],
    run: function (v) { pos(v.t, v.s); need(v.d); var left = Math.max(v.t - v.d, 0); return { big: ["每学期需修", f(left / v.s, 1) + " 学分"], kv: [["还差", left + " 学分"], ["完成度", pct(Math.min(v.d / v.t, 1), 1)]] }; } });

  add({ cat: "edu", id: "reading-time", name: "阅读时间计算器", desc: "按字数和阅读速度算读完要多久，每天读多少能按时读完", kw: "阅读 读书 读完",
    fields: [{ k: "w", l: "总字数", u: "万字", v: 30 }, { k: "s", l: "阅读速度", u: "字/分钟", v: 400 }, { k: "d", l: "计划几天读完", u: "天", v: 14 }],
    run: function (v) { pos(v.w, v.s, v.d); var min = v.w * 1e4 / v.s; return { big: ["总用时", f(min / 60, 1) + " 小时"], kv: [["每天读", f(min / v.d, 0) + " 分钟"], ["每天字数", f(v.w * 1e4 / v.d, 0) + " 字"]], note: "中文一般阅读速度 300–500 字/分钟，精读教材约 150–250。" }; } });

  add({ cat: "edu", id: "pomodoro", name: "番茄钟学习计划", desc: "按要学习的总时长排出番茄钟和休息时间", kw: "番茄钟 学习 专注",
    fields: [{ k: "h", l: "要学习的时长", u: "小时", v: 4 }, { k: "w", l: "每个番茄", u: "分钟", v: 25 }, { k: "s", l: "短休息", u: "分钟", v: 5 }, { k: "l", l: "每 4 个番茄长休息", u: "分钟", v: 20 }, { k: "t", l: "开始时间", t: "text", v: "09:00" }],
    run: function (v) {
      pos(v.h, v.w); need(v.s, v.l); var m = String(v.t).match(/^(\d{1,2})[:：](\d{2})$/); if (!m) throw "开始时间格式如 09:00"; var n = Math.ceil(v.h * 60 / v.w), cur = +m[1] * 60 + +m[2], rows = [];
      function hm(x) { x = ((x % 1440) + 1440) % 1440; return String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0"); }
      for (var i = 1; i <= n && i <= 40; i++) { var rest = i === n ? 0 : i % 4 ? v.s : v.l; rows.push(["🍅 " + i, hm(cur) + " – " + hm(cur + v.w), rest ? rest + " 分钟" : "完成"]); cur += v.w + rest; }
      return { big: ["共", n + " 个番茄"], kv: [["预计结束", hm(cur)]], table: { h: ["番茄", "时间", "之后休息"], r: rows } };
    } });

  /* ======================= 商业财税 ======================= */
  add({ cat: "biz", id: "depreciation", name: "固定资产折旧计算器", desc: "直线法、双倍余额递减法、年数总和法折旧表", kw: "折旧 固定资产 双倍余额",
    fields: [{ k: "c", l: "资产原值", u: "元", v: 100000 }, { k: "s", l: "预计净残值", u: "元", v: 5000 }, { k: "n", l: "使用年限", u: "年", v: 5 }, { k: "m", l: "方法", t: "sel", o: ["直线法", "双倍余额递减法", "年数总和法"] }],
    run: function (v) {
      pos(v.c); need(v.s); if (!Number.isInteger(v.n) || v.n < 2 || v.n > 50) throw "年限 2–50 的整数"; var rows = [], bv = v.c, sum = v.n * (v.n + 1) / 2;
      var tail = 0;
      for (var i = 1; i <= v.n; i++) {
        var d;
        if (v.m === "直线法") d = (v.c - v.s) / v.n;
        else if (v.m === "年数总和法") d = (v.c - v.s) * (v.n - i + 1) / sum;
        else if (i <= v.n - 2) d = bv * 2 / v.n;
        else { if (i === v.n - 1) tail = (bv - v.s) / 2; d = tail; }
        bv -= d; rows.push(["第 " + i + " 年", f(d), f(bv)]);
      }
      return { table: { h: ["年度", "折旧额（元）", "期末净值（元）"], r: rows }, note: "双倍余额递减法最后两年改为直线法摊销。" };
    } });

  add({ cat: "biz", id: "npv", name: "净现值 NPV 计算器", desc: "按折现率算一系列现金流的净现值和现值指数", kw: "npv 净现值 折现",
    fields: [{ k: "r", l: "折现率", u: "%", v: 8 }, { k: "c", l: "各期现金流（第 0 期起，逗号分隔）", t: "area", v: "-100000, 30000, 35000, 40000, 45000" }],
    run: function (v) {
      need(v.r); var C = nums(v.c); if (C.length < 2) throw "至少两期现金流"; var r = v.r / 100, npv = 0, pin = 0, out = 0;
      C.forEach(function (c, i) { var pv = c / Math.pow(1 + r, i); npv += pv; if (c > 0) pin += pv; else out -= pv; });
      return { big: ["NPV", y(npv)], tag: npv >= 0 ? "可行" : "不可行", kv: [["现值指数 PI", out ? g(pin / out, 4) : "—"]] };
    } });

  add({ cat: "biz", id: "payback", name: "投资回收期计算器", desc: "静态和动态（折现）投资回收期", kw: "回收期 回本 payback",
    fields: [{ k: "i", l: "初始投资", u: "元", v: 200000 }, { k: "c", l: "之后每年净现金流（逗号分隔）", t: "area", v: "50000, 60000, 70000, 80000, 80000" }, { k: "r", l: "折现率", u: "%", v: 8 }],
    run: function (v) {
      pos(v.i); need(v.r); var C = nums(v.c);
      function pb(disc) { var left = v.i; for (var k = 0; k < C.length; k++) { var c = disc ? C[k] / Math.pow(1 + v.r / 100, k + 1) : C[k]; if (c >= left && c > 0) return k + left / c; left -= c; } return null; }
      var s = pb(false), d = pb(true);
      return { big: ["静态回收期", s == null ? "期内无法回本" : f(s, 2) + " 年"], kv: [["动态回收期", d == null ? "期内无法回本" : f(d, 2) + " 年"]] };
    } });

  add({ cat: "biz", id: "eoq", name: "经济订货量 EOQ", desc: "按年需求、订货成本和存储成本算最优订货量", kw: "eoq 订货 库存 采购",
    fields: [{ k: "d", l: "年需求量", u: "件", v: 12000 }, { k: "s", l: "每次订货成本", u: "元", v: 200 }, { k: "h", l: "单件年存储成本", u: "元", v: 3 }],
    run: function (v) { pos(v.d, v.s, v.h); var q = Math.sqrt(2 * v.d * v.s / v.h); return { big: ["最优订货量", f(q, 0) + " 件"], kv: [["每年订货次数", f(v.d / q, 1) + " 次"], ["订货间隔", f(365 / (v.d / q), 0) + " 天"], ["年总库存成本", y(Math.sqrt(2 * v.d * v.s * v.h))]] }; } });

  add({ cat: "biz", id: "funnel", name: "转化漏斗计算器", desc: "各环节人数，算每一步转化率和整体转化率", kw: "漏斗 转化率 运营",
    fields: [{ k: "s", l: "环节（名称, 人数）", t: "list", cols: [{ k: "n", l: "环节", t: "text", nv: "" }, { k: "c", l: "人数", nv: "" }], v: [["曝光", 100000], ["点击", 5000], ["加购", 800], ["下单", 300], ["支付", 240]] }],
    run: function (v) {
      var rs = v.s.filter(function (r) { return ok(r[1]) && r[1] >= 0; }); if (rs.length < 2) throw "至少两个环节"; pos(rs[0][1]);
      return { big: ["整体转化率", pct(rs[rs.length - 1][1] / rs[0][1], 3)], table: { h: ["环节", "人数", "环节转化", "累计转化"], r: rs.map(function (r, i) { return [r[0], f(r[1], 0), i ? (rs[i - 1][1] ? pct(r[1] / rs[i - 1][1], 1) : "—") : "—", pct(r[1] / rs[0][1], 2)]; }) } };
    } });

  add({ cat: "biz", id: "roas", name: "广告投放 ROAS / ROI", desc: "按花费、点击、转化和客单价算 ROAS、CPC、CPA 和保本 ROAS", kw: "roas 广告 投放 cpa cpc",
    fields: [{ k: "c", l: "广告花费", u: "元", v: 5000 }, { k: "k", l: "点击数", v: 2500 }, { k: "o", l: "成交单数", v: 100 }, { k: "a", l: "客单价", u: "元", v: 150 }, { k: "m", l: "毛利率", u: "%", v: 40 }],
    run: function (v) { pos(v.c, v.m); need(v.k, v.o, v.a); var rev = v.o * v.a, roas = rev / v.c; return { big: ["ROAS", g(roas, 3)], tag: roas >= 100 / v.m ? "盈利" : "亏损", kv: [["保本 ROAS", g(100 / v.m, 3)], ["CPC", v.k ? y(v.c / v.k) : "—"], ["CPA", v.o ? y(v.c / v.o) : "—"], ["转化率", v.k ? pct(v.o / v.k) : "—"], ["毛利 − 广告费", y(rev * v.m / 100 - v.c)]] }; } });

  /* ======================= 工程建筑 ======================= */
  add({ cat: "build", id: "gravel-sand", name: "砂石 / 回填土用量", desc: "按面积和厚度算砂、石子、土方的体积和吨数", kw: "砂石 石子 沙子 回填",
    fields: [{ k: "a", l: "面积", u: "㎡", v: 50 }, { k: "t", l: "厚度", u: "cm", v: 10 }, { k: "m", l: "材料", t: "sel", o: [[1.5, "中砂（1.5 t/m³）"], [1.6, "碎石（1.6 t/m³）"], [1.8, "压实土（1.8 t/m³）"], [1.35, "卵石（1.35 t/m³）"]], v: 1.5 }],
    run: function (v) { pos(v.a, v.t); var vol = v.a * v.t / 100; return { big: ["需要", f(vol * v.m, 2) + " 吨"], kv: [["体积", f(vol, 2) + " m³"], ["含 5% 损耗", f(vol * v.m * 1.05, 2) + " 吨"]] }; } });

  add({ cat: "build", id: "gypsum-board", name: "吊顶石膏板 / 龙骨用量", desc: "按吊顶面积算石膏板张数和主副龙骨米数", kw: "吊顶 石膏板 龙骨",
    fields: [{ k: "a", l: "吊顶面积", u: "㎡", v: 30 }, { k: "p", l: "房间周长（边龙骨）", u: "m", v: 22 }],
    run: function (v) { pos(v.a); need(v.p); return { big: ["石膏板", Math.ceil(v.a / 2.88 * 1.1) + " 张"], kv: [["主龙骨（间距 1.2 m）", f(v.a / 1.2 * 1.05, 1) + " m"], ["副龙骨（间距 0.4 m）", f(v.a / 0.4 * 1.05, 1) + " m"], ["边龙骨", f(v.p * 1.05, 1) + " m"], ["吊杆约", Math.ceil(v.a / 1.2) + " 根"]], note: "石膏板按 1.2 × 2.4 m 一张，含 10% 损耗。" }; } });

  add({ cat: "build", id: "cabinet-meter", name: "橱柜延米计算器", desc: "按地柜、吊柜长度和单价算橱柜总价", kw: "橱柜 延米 台面",
    fields: [{ k: "b", l: "地柜长度", u: "m", v: 4.2 }, { k: "w", l: "吊柜长度", u: "m", v: 3 }, { k: "pb", l: "地柜单价（含台面）", u: "元/延米", v: 2500 }, { k: "pw", l: "吊柜单价", u: "元/延米", v: 1500 }, { k: "e", l: "五金 / 水槽 / 拉篮等", u: "元", v: 3000 }],
    run: function (v) { need(v.b, v.w, v.pb, v.pw, v.e); var t = v.b * v.pb + v.w * v.pw + v.e; return { big: ["橱柜总价", y(t)], kv: [["地柜", y(v.b * v.pb)], ["吊柜", y(v.w * v.pw)]], note: "L 型转角按两边长度相加，转角处有的商家只计一次进深。高柜通常按 2–3 倍延米价单独计。" }; } });

  add({ cat: "build", id: "fresh-air", name: "新风量计算器", desc: "按人数或换气次数算新风机所需风量", kw: "新风 换气 风量",
    fields: [{ k: "a", l: "面积", u: "㎡", v: 100 }, { k: "h", l: "层高", u: "m", v: 2.8 }, { k: "n", l: "常住人数", v: 3 }, { k: "c", l: "换气次数", u: "次/时", v: 0.7 }],
    run: function (v) { pos(v.a, v.h); need(v.n, v.c); var byAc = v.a * v.h * v.c, byP = v.n * 30, q = Math.max(byAc, byP); return { big: ["建议新风量", f(q * 1.2, 0) + " m³/h"], kv: [["按换气次数", f(byAc, 0) + " m³/h"], ["按人数（30 m³/h·人）", f(byP, 0) + " m³/h"]], note: "已加 20% 管路损耗余量。住宅换气次数参考 GB 50736 取 0.45–0.7 次/时。" }; } });

  add({ cat: "build", id: "roof-area", name: "坡屋顶面积计算器", desc: "按投影面积和坡度算屋面实际面积和瓦片数量", kw: "屋顶 坡度 瓦片",
    fields: [{ k: "a", l: "水平投影面积", u: "㎡", v: 120 }, { k: "d", l: "坡度", u: "°", v: 30 }, { k: "t", l: "每平方米瓦片数", u: "片", v: 15 }],
    run: function (v) { pos(v.a); need(v.d, v.t); if (v.d >= 80) throw "坡度需小于 80°"; var r = v.a / Math.cos(v.d * Math.PI / 180); return { big: ["屋面面积", f(r, 1) + " ㎡"], kv: [["坡度比", "1 : " + f(1 / Math.tan(v.d * Math.PI / 180 || 1e-9), 2)], ["瓦片（含 5% 损耗）", Math.ceil(r * v.t * 1.05) + " 片"]] }; } });

  add({ cat: "build", id: "pipe-volume", name: "管道容积 / 水量计算器", desc: "按管径和长度算管内水量、重量", kw: "管道 容积 水管 管径",
    fields: [{ k: "d", l: "管道内径", u: "mm", v: 20 }, { k: "l", l: "长度", u: "m", v: 50 }],
    run: function (v) { pos(v.d, v.l); var L = Math.PI * Math.pow(v.d / 2000, 2) * v.l * 1000; return { big: ["容积", g(L, 5) + " L"], kv: [["水重", g(L, 5) + " kg"], ["每米容积", g(L / v.l, 4) + " L/m"]], note: "常见 PPR 管 DN20（外径 25 mm）内径约 18–20 mm。" }; } });

  /* ======================= 科学工程 ======================= */
  add({ cat: "science", id: "voltage-divider", name: "分压电路计算器", desc: "两电阻分压的输出电压、电流和功耗", kw: "分压 电阻 分压电路",
    fields: [{ k: "v", l: "输入电压", u: "V", v: 12 }, { k: "r1", l: "R1（上）", u: "Ω", v: 10000 }, { k: "r2", l: "R2（下）", u: "Ω", v: 4700 }],
    run: function (v) { pos(v.v, v.r1, v.r2); var i = v.v / (v.r1 + v.r2); return { big: ["输出电压", g(v.v * v.r2 / (v.r1 + v.r2), 5) + " V"], kv: [["电流", g(i * 1000, 5) + " mA"], ["R1 功耗", g(i * i * v.r1 * 1000, 5) + " mW"], ["R2 功耗", g(i * i * v.r2 * 1000, 5) + " mW"]], note: "接负载后输出电压会下降，负载电阻应远大于 R2。" }; } });

  add({ cat: "science", id: "decibel", name: "分贝计算器", desc: "功率比、电压比与分贝互换；多个声源叠加", kw: "分贝 db 声压 叠加",
    fields: [{ k: "m", l: "计算", t: "sel", o: ["比值 → 分贝", "分贝 → 比值", "声源叠加"] }, { k: "x", l: "数值（比值或 dB）", v: 2, show: function (v) { return v.m !== "声源叠加"; } }, { k: "l", l: "各声源分贝（逗号分隔）", t: "text", v: "60, 60, 65", show: function (v) { return v.m === "声源叠加"; } }],
    run: function (v) {
      if (v.m === "声源叠加") { var L = nums(v.l), s = L.reduce(function (a, x) { return a + Math.pow(10, x / 10); }, 0); return { big: ["叠加后", f(10 * Math.log10(s), 1) + " dB"], note: "两个相同声源叠加约增加 3 dB。" }; }
      need(v.x); if (v.m === "比值 → 分贝") { pos(v.x); return { kv: [["功率比 → dB", g(10 * Math.log10(v.x), 6) + " dB"], ["电压 / 声压比 → dB", g(20 * Math.log10(v.x), 6) + " dB"]] }; }
      return { kv: [["功率比", g(Math.pow(10, v.x / 10), 6)], ["电压 / 声压比", g(Math.pow(10, v.x / 20), 6)]] };
    } });

  add({ cat: "science", id: "pendulum", name: "单摆周期计算器", desc: "T = 2π√(L/g)，按摆长算周期或按周期算摆长", kw: "单摆 周期 摆长",
    fields: [{ k: "l", l: "摆长", u: "m", v: 1 }, { k: "g", l: "重力加速度", u: "m/s²", v: 9.8 }],
    run: function (v) { pos(v.l, v.g); var T = 2 * Math.PI * Math.sqrt(v.l / v.g); return { big: ["周期", g(T, 5) + " s"], kv: [["频率", g(1 / T, 5) + " Hz"], ["周期 1 秒的摆长", g(v.g / (4 * Math.PI * Math.PI), 5) + " m"]], note: "小角度（< 5°）近似。" }; } });

  add({ cat: "science", id: "hooke", name: "胡克定律 / 弹簧", desc: "F = kx，弹力、伸长量和弹性势能；弹簧串并联", kw: "胡克定律 弹簧 劲度系数",
    fields: [{ k: "k", l: "劲度系数 k", u: "N/m", v: 200 }, { k: "x", l: "形变量 x", u: "cm", v: 5 }, { k: "k2", l: "第二根弹簧 k₂（可选）", u: "N/m", v: 300 }],
    run: function (v) { pos(v.k); need(v.x); var x = v.x / 100, kv = [["弹力 F", g(v.k * x, 6) + " N"], ["弹性势能", g(.5 * v.k * x * x, 6) + " J"]]; if (ok(v.k2) && v.k2 > 0) { kv.push(["串联 k", g(v.k * v.k2 / (v.k + v.k2), 6) + " N/m"]); kv.push(["并联 k", g(v.k + v.k2, 6) + " N/m"]); } return { kv: kv }; } });

  add({ cat: "science", id: "snell", name: "折射定律计算器", desc: "n₁sinθ₁ = n₂sinθ₂，求折射角和全反射临界角", kw: "折射 斯涅尔 全反射 临界角",
    fields: [{ k: "n1", l: "入射介质折射率 n₁", t: "sel", o: [[1, "空气 1.00"], [1.33, "水 1.33"], [1.5, "玻璃 1.50"], [2.42, "钻石 2.42"]], v: 1 }, { k: "n2", l: "折射介质折射率 n₂", t: "sel", o: [[1, "空气 1.00"], [1.33, "水 1.33"], [1.5, "玻璃 1.50"], [2.42, "钻石 2.42"]], v: 1.5 }, { k: "a", l: "入射角", u: "°", v: 30 }],
    run: function (v) {
      need(v.a); var s = v.n1 * Math.sin(v.a * Math.PI / 180) / v.n2, crit = v.n1 > v.n2 ? Math.asin(v.n2 / v.n1) * 180 / Math.PI : null;
      return { big: ["折射角", Math.abs(s) > 1 ? "发生全反射" : g(Math.asin(s) * 180 / Math.PI, 6) + "°"], kv: [["临界角", crit ? g(crit, 6) + "°" : "光疏→光密，不会全反射"]] };
    } });

  add({ cat: "science", id: "gravitation", name: "万有引力计算器", desc: "F = Gm₁m₂/r²，以及星球表面重力加速度", kw: "万有引力 引力常量",
    fields: [{ k: "m1", l: "质量 m₁", u: "kg", v: 5.972e24 }, { k: "m2", l: "质量 m₂", u: "kg", v: 70 }, { k: "r", l: "距离 r", u: "m", v: 6.371e6 }],
    run: function (v) { pos(v.m1, v.m2, v.r); var G = 6.6743e-11, F = G * v.m1 * v.m2 / (v.r * v.r); return { big: ["引力", g(F, 6) + " N"], kv: [["m₁ 处重力加速度", g(G * v.m1 / (v.r * v.r), 6) + " m/s²"], ["相当于", g(F / 9.80665, 6) + " kgf"]] }; } });

  add({ cat: "science", id: "doppler", name: "多普勒效应计算器", desc: "声源或观察者运动时听到的频率", kw: "多普勒 频率 声音",
    fields: [{ k: "f", l: "声源频率", u: "Hz", v: 440 }, { k: "vs", l: "声源速度（朝观察者为正）", u: "m/s", v: 30 }, { k: "vo", l: "观察者速度（朝声源为正）", u: "m/s", v: 0 }, { k: "c", l: "声速", u: "m/s", v: 340 }],
    run: function (v) { pos(v.f, v.c); need(v.vs, v.vo); if (v.vs >= v.c) throw "声源速度需小于声速"; var fo = v.f * (v.c + v.vo) / (v.c - v.vs); return { big: ["听到的频率", g(fo, 6) + " Hz"], kv: [["频率变化", g(fo - v.f, 6) + " Hz"], ["远离时", g(v.f * (v.c - v.vo) / (v.c + v.vs), 6) + " Hz"]] }; } });

  add({ cat: "science", id: "escape-velocity", name: "宇宙速度计算器", desc: "各星球的第一宇宙速度（环绕）和第二宇宙速度（逃逸）", kw: "宇宙速度 逃逸速度 第一宇宙速度",
    fields: [{ k: "p", l: "天体", t: "sel", drop: true, o: [["5.972e24,6.371e6", "地球"], ["7.342e22,1.7374e6", "月球"], ["6.417e23,3.3895e6", "火星"], ["1.898e27,6.9911e7", "木星"], ["1.989e30,6.957e8", "太阳"]], v: "5.972e24,6.371e6" }, { k: "h", l: "离地高度", u: "km", v: 0 }],
    run: function (v) { need(v.h); var p = String(v.p).split(",").map(Number), G = 6.6743e-11, r = p[1] + v.h * 1000, v1 = Math.sqrt(G * p[0] / r); return { big: ["第一宇宙速度", f(v1 / 1000, 2) + " km/s"], kv: [["第二宇宙速度（逃逸）", f(v1 * Math.SQRT2 / 1000, 2) + " km/s"], ["环绕周期", f(2 * Math.PI * r / v1 / 60, 1) + " 分钟"], ["表面重力", g(G * p[0] / (r * r), 4) + " m/s²"]] }; } });
})();
