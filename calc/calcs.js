/* Calculator registry for /calc/. Each entry: {cat, id, name, desc, kw?, fields:[...], run(v) -> {big, kv, tag, table, note} | throws "message"}.
   Field: {k, l, t: num|sel|date|dt|text|area|list, u, v, o, cols, show(v), hint}. Batch 1 (2026-10). */
(function () {
  "use strict";
  var L = [];
  function add(c) { L.push(c); }

  /* ---------- helpers ---------- */
  function ok(x) { return typeof x === "number" && isFinite(x); }
  function need() { for (var i = 0; i < arguments.length; i++) if (!ok(arguments[i])) throw "请填写完整的数字"; }
  function pos() { for (var i = 0; i < arguments.length; i++) if (!ok(arguments[i]) || arguments[i] <= 0) throw "请填写大于 0 的数字"; }
  function f(x, d) {
    if (!ok(x)) return "—";
    d = d == null ? 2 : d;
    var s = (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
    var p = s.split("."); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return p.join(".");
  }
  function g(x, d) { // trimmed number
    if (!ok(x)) return "—";
    if (x !== 0 && (Math.abs(x) >= 1e15 || Math.abs(x) < 1e-6)) return x.toExponential(6).replace(/\.?0+e/, "e");
    var s = Number(x.toFixed(d == null ? 6 : d)).toString();
    var p = s.split("."); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); return p.join(".");
  }
  function y(x) { return f(x) + " 元"; }
  function wy(x) { return Math.abs(x) >= 1e4 ? f(x / 1e4, 2) + " 万元" : y(x); }
  function pct(x, d) { return f(x * 100, d == null ? 2 : d) + "%"; }
  function D(s) { if (!s) throw "请选择日期"; var p = String(s).split("-"); var d = new Date(+p[0], +p[1] - 1, +p[2]); if (isNaN(d)) throw "日期无效"; return d; }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  var WK = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  function dayDiff(a, b) { return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5); }
  function addMonths(d, m) { var r = new Date(d.getFullYear(), d.getMonth() + m, 1); var last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate(); r.setDate(Math.min(d.getDate(), last)); return r; }
  function ymd(a, b) { // whole years, months, days from a to b (a<=b)
    var yy = b.getFullYear() - a.getFullYear(), mm = b.getMonth() - a.getMonth(), dd = b.getDate() - a.getDate();
    if (dd < 0) { mm--; dd += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); }
    if (mm < 0) { yy--; mm += 12; }
    return [yy, mm, dd];
  }
  function pmt(P, r, n) { return r === 0 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1); }

  /* Individual income tax (综合所得 annual brackets, 2019 rules still in force) */
  var IIT = [[36000, .03, 0], [144000, .10, 2520], [300000, .20, 16920], [420000, .25, 31920], [660000, .30, 52920], [960000, .35, 85920], [Infinity, .45, 181920]];
  var IIT_M = [[3000, .03, 0], [12000, .10, 210], [25000, .20, 1410], [35000, .25, 2660], [55000, .30, 4410], [80000, .35, 7160], [Infinity, .45, 15160]];
  function taxBy(t, table) { if (t <= 0) return [0, 0]; for (var i = 0; i < table.length; i++) if (t <= table[i][0]) return [t * table[i][1] - table[i][2], table[i][1]]; }
  /* 经营所得 */
  var BIZ = [[30000, .05, 0], [90000, .10, 1500], [300000, .20, 10500], [500000, .30, 40500], [Infinity, .35, 65500]];

  /* ======================= 财务理财 ======================= */
  add({ cat: "finance", id: "mortgage", name: "房贷计算器", desc: "等额本息 / 等额本金月供、总利息、逐月明细", kw: "贷款 月供 lpr 公积金",
    fields: [
      { k: "p", l: "贷款金额", u: "万元", v: 100 },
      { k: "n", l: "贷款年限", u: "年", v: 30 },
      { k: "r", l: "年利率", u: "%", v: 3.05, hint: "商贷按 LPR 加减点后的实际利率填写；公积金填公积金利率" },
      { k: "m", l: "还款方式", t: "sel", o: ["等额本息", "等额本金"] }
    ],
    run: function (v) {
      pos(v.p, v.n); need(v.r);
      var P = v.p * 1e4, n = Math.round(v.n * 12), r = v.r / 100 / 12, rows = [], tot = 0, bal = P;
      if (v.m === "等额本息") {
        var m = pmt(P, r, n);
        for (var i = 1; i <= n; i++) { var it = bal * r, pr = m - it; bal -= pr; tot += it; rows.push([i, f(m), f(pr), f(it), f(Math.max(bal, 0))]); }
        return { big: ["每月月供", y(m)], kv: [["贷款总额", wy(P)], ["支付利息", wy(tot)], ["还款总额", wy(P + tot)], ["还款月数", n + " 个月"]],
          table: { h: ["期数", "月供", "本金", "利息", "剩余本金"], r: rows } };
      }
      var base = P / n, first = 0, last = 0;
      for (var j = 1; j <= n; j++) { var it2 = bal * r, m2 = base + it2; bal -= base; tot += it2; if (j === 1) first = m2; last = m2; rows.push([j, f(m2), f(base), f(it2), f(Math.max(bal, 0))]); }
      return { big: ["首月月供", y(first)], kv: [["每月递减", y(base * r)], ["末月月供", y(last)], ["支付利息", wy(tot)], ["还款总额", wy(P + tot)]],
        table: { h: ["期数", "月供", "本金", "利息", "剩余本金"], r: rows } };
    } });

  add({ cat: "finance", id: "prepay", name: "提前还款计算器", desc: "部分提前还款后，缩短年限或减少月供各省多少利息", kw: "房贷 提前还贷",
    fields: [
      { k: "b", l: "当前剩余本金", u: "万元", v: 80 },
      { k: "n", l: "剩余期数", u: "个月", v: 300 },
      { k: "r", l: "年利率", u: "%", v: 3.05 },
      { k: "a", l: "提前还款金额", u: "万元", v: 20 },
      { k: "m", l: "还款后", t: "sel", o: ["缩短年限", "减少月供"] }
    ],
    run: function (v) {
      pos(v.b, v.n, v.a); need(v.r);
      var B = v.b * 1e4, A = v.a * 1e4, n = Math.round(v.n), r = v.r / 1200;
      if (A >= B) return { big: ["一次还清", "可节省利息 " + wy(pmt(B, r, n) * n - B)], note: "提前还款金额不小于剩余本金，即一次性结清。" };
      var m0 = pmt(B, r, n), int0 = m0 * n - B, B2 = B - A, m1, n1, int1;
      if (v.m === "减少月供") { n1 = n; m1 = pmt(B2, r, n); int1 = m1 * n - B2; }
      else { m1 = m0; n1 = r === 0 ? Math.ceil(B2 / m0) : Math.ceil(-Math.log(1 - B2 * r / m0) / Math.log(1 + r)); int1 = pmt(B2, r, n1) * n1 - B2; m1 = pmt(B2, r, n1); }
      return { big: ["节省利息", wy(int0 - int1)], kv: [["原月供", y(m0)], ["新月供", y(m1)], ["原剩余期数", n + " 个月"], ["新剩余期数", n1 + " 个月"], ["原剩余利息", wy(int0)], ["新剩余利息", wy(int1)]],
        note: "按等额本息计算。部分银行对提前还款有违约金或预约要求，以贷款合同为准。" };
    } });

  add({ cat: "finance", id: "income-tax", name: "个税计算器", desc: "综合所得年度个税、年终奖单独计税与并入对比", kw: "个人所得税 年终奖 综合所得 汇算",
    fields: [
      { k: "s", l: "年度工资薪金收入（税前）", u: "元", v: 240000 },
      { k: "i", l: "全年个人缴纳五险一金", u: "元", v: 36000 },
      { k: "d", l: "全年专项附加扣除", u: "元", v: 24000, hint: "子女教育、住房贷款利息/租金、赡养老人、继续教育、婴幼儿照护等合计" },
      { k: "o", l: "其他扣除（企业年金、个人养老金等）", u: "元", v: 0 },
      { k: "b", l: "全年一次性奖金", u: "元", v: 30000 }
    ],
    run: function (v) {
      need(v.s, v.i, v.d, v.o, v.b);
      var base = v.s - 60000 - v.i - v.d - v.o;
      var t1 = taxBy(base, IIT)[0];
      var bt = taxBy(v.b / 12, IIT_M), bonusTax = v.b > 0 ? v.b * bt[1] - IIT_M.filter(function (x) { return x[1] === bt[1]; })[0][2] : 0;
      var sep = t1 + bonusTax, merged = taxBy(base + v.b, IIT)[0];
      var best = sep <= merged ? "年终奖单独计税更省" : "并入综合所得更省";
      return { big: ["全年应纳个税（选更省的方式）", y(Math.min(sep, merged))], tag: best,
        kv: [["应纳税所得额", y(Math.max(base, 0))], ["工资部分个税", y(t1)], ["年终奖单独计税", y(bonusTax)], ["单独计税合计", y(sep)], ["并入综合所得合计", y(merged)], ["税后年收入", y(v.s + v.b - v.i - Math.min(sep, merged))]],
        note: "基本减除费用每年 6 万元。全年一次性奖金单独计税政策执行至 2027 年 12 月 31 日。" };
    } });

  add({ cat: "finance", id: "salary", name: "工资到手计算器", desc: "五险一金个人部分 + 累计预扣个税，逐月到手工资", kw: "税后 社保 公积金 月薪",
    fields: [
      { k: "g", l: "税前月薪", u: "元", v: 15000 },
      { k: "b", l: "社保公积金缴费基数", u: "元", v: 15000, hint: "多数城市有上下限，不清楚就填月薪" },
      { k: "p", l: "养老保险", u: "%", v: 8 },
      { k: "m", l: "医疗保险", u: "%", v: 2 },
      { k: "u", l: "失业保险", u: "%", v: 0.5 },
      { k: "h", l: "住房公积金", u: "%", v: 7, hint: "5%–12%，以单位为准" },
      { k: "d", l: "每月专项附加扣除", u: "元", v: 0 }
    ],
    run: function (v) {
      pos(v.g); need(v.b, v.p, v.m, v.u, v.h, v.d);
      var ins = v.b * (v.p + v.m + v.u) / 100, fund = v.b * v.h / 100, deduct = ins + fund;
      var rows = [], cumTax = 0, sumNet = 0;
      for (var i = 1; i <= 12; i++) {
        var cum = taxBy(i * (v.g - deduct - 5000 - v.d), IIT)[0], t = Math.max(cum - cumTax, 0); cumTax += t;
        var net = v.g - deduct - t; sumNet += net; rows.push([i + " 月", f(t), f(net)]);
      }
      return { big: ["首月到手", y(v.g - deduct - (+rows[0][1].replace(/,/g, "")))], kv: [["社保个人", y(ins)], ["公积金个人", y(fund)], ["全年个税", y(cumTax)], ["月均到手", y(sumNet / 12)], ["全年到手", y(sumNet)], ["公积金账户/年（含单位同比例）", y(fund * 24)]],
        table: { h: ["月份", "当月个税", "到手"], r: rows }, note: "按累计预扣法计算，收入越往后税率可能跳档，下半年到手会变少。各地缴费比例略有差异。" };
    } });

  add({ cat: "finance", id: "auto-loan", name: "车贷计算器", desc: "首付比例、贷款月供、利息与总花费", kw: "汽车 贷款 月供",
    fields: [
      { k: "p", l: "车价", u: "元", v: 200000 },
      { k: "d", l: "首付比例", u: "%", v: 30 },
      { k: "n", l: "贷款期限", t: "sel", o: [[12, "1 年"], [24, "2 年"], [36, "3 年"], [60, "5 年"]], v: 36 },
      { k: "r", l: "年利率", u: "%", v: 4 }
    ],
    run: function (v) {
      pos(v.p); need(v.d, v.r);
      var L0 = v.p * (1 - v.d / 100), m = pmt(L0, v.r / 1200, v.n), it = m * v.n - L0;
      return { big: ["每月月供", y(m)], kv: [["首付", y(v.p - L0)], ["贷款金额", y(L0)], ["支付利息", y(it)], ["总花费", y(v.p + it)]], note: "不含购置税、保险、上牌等费用，可用“购车落地价计算器”计算。" };
    } });

  add({ cat: "finance", id: "compound-interest", name: "复利计算器", desc: "本金 + 每期定投的复利终值与逐年明细", kw: "定投 理财 收益",
    fields: [
      { k: "p", l: "初始本金", u: "元", v: 10000 },
      { k: "a", l: "每月追加", u: "元", v: 1000 },
      { k: "r", l: "年化收益率", u: "%", v: 5 },
      { k: "n", l: "投资年限", u: "年", v: 10 },
      { k: "t", l: "追加时点", t: "sel", o: ["月初", "月末"] }
    ],
    run: function (v) {
      need(v.p, v.a, v.r); pos(v.n);
      var r = v.r / 1200, bal = v.p, inv = v.p, rows = [], months = Math.round(v.n * 12);
      for (var i = 1; i <= months; i++) {
        if (v.t === "月初") { bal += v.a; bal *= 1 + r; } else { bal *= 1 + r; bal += v.a; }
        inv += v.a;
        if (i % 12 === 0 || i === months) rows.push(["第 " + Math.ceil(i / 12) + " 年", f(inv), f(bal - inv), f(bal)]);
      }
      return { big: ["期末总额", wy(bal)], kv: [["累计投入", wy(inv)], ["收益", wy(bal - inv)], ["收益率", pct((bal - inv) / inv)]], table: { h: ["年份", "累计投入", "累计收益", "账户余额"], r: rows } };
    } });

  add({ cat: "finance", id: "inflation", name: "通货膨胀计算器", desc: "按通胀率算未来等值金额与购买力缩水", kw: "购买力 cpi 贬值",
    fields: [
      { k: "a", l: "金额", u: "元", v: 10000 },
      { k: "r", l: "年通胀率", u: "%", v: 2 },
      { k: "n", l: "年数", u: "年", v: 20 }
    ],
    run: function (v) {
      need(v.a, v.r, v.n);
      var k = Math.pow(1 + v.r / 100, v.n);
      return { big: [v.n + " 年后同等购买力需要", y(v.a * k)], kv: [["今天的钱届时价值", y(v.a / k)], ["购买力下降", pct(1 - 1 / k)], ["物价累计上涨", pct(k - 1)]] };
    } });

  add({ cat: "finance", id: "deposit", name: "存款利息计算器", desc: "定期 / 活期存款到期利息与本息合计", kw: "银行 定期 利率",
    fields: [
      { k: "p", l: "存入金额", u: "元", v: 100000 },
      { k: "r", l: "年利率", u: "%", v: 1.5 },
      { k: "n", l: "存期", u: "月", v: 12 },
      { k: "m", l: "到期后", t: "sel", o: ["不转存", "自动转存（按存期复利）"], v: "不转存" },
      { k: "c", l: "转存总时长", u: "年", v: 3, show: function (v) { return v.m !== "不转存"; } }
    ],
    run: function (v) {
      pos(v.p, v.n); need(v.r);
      if (v.m === "不转存") { var it = v.p * v.r / 100 * v.n / 12; return { big: ["到期利息", y(it)], kv: [["本息合计", y(v.p + it)], ["日均利息", y(it / (v.n * 30))]] }; }
      pos(v.c); var times = Math.floor(v.c * 12 / v.n), bal = v.p * Math.pow(1 + v.r / 100 * v.n / 12, times);
      return { big: ["转存 " + times + " 次后本息", y(bal)], kv: [["累计利息", y(bal - v.p)]], note: "假设每次转存利率不变。" };
    } });

  /* ======================= 房产置业 ======================= */
  add({ cat: "property", id: "deed-tax", name: "契税计算器", desc: "首套 / 二套 / 三套以上，按 140㎡ 分界计算契税", kw: "购房 税费",
    fields: [
      { k: "p", l: "计税价格（不含增值税）", u: "万元", v: 300 },
      { k: "a", l: "面积", u: "㎡", v: 100 },
      { k: "s", l: "家庭第几套住房", t: "sel", o: ["首套", "二套", "三套及以上"] }
    ],
    run: function (v) {
      pos(v.p, v.a);
      var rate = v.s === "首套" ? (v.a <= 140 ? .01 : .015) : v.s === "二套" ? (v.a <= 140 ? .01 : .02) : .03;
      return { big: ["应缴契税", wy(v.p * 1e4 * rate)], kv: [["适用税率", pct(rate, 1)], ["计税价格", wy(v.p * 1e4)]],
        note: "按 2024 年 12 月起施行的个人住房契税优惠：首套 140㎡ 及以下 1%、以上 1.5%；二套 140㎡ 及以下 1%、以上 2%。三套及以上按 3%（各省 3%–5%）。" };
    } });

  add({ cat: "property", id: "down-payment", name: "购房首付计算器", desc: "首付款、贷款金额、月供，或按预算反推房价", kw: "首付 预算",
    fields: [
      { k: "p", l: "房屋总价", u: "万元", v: 300 },
      { k: "d", l: "首付比例", u: "%", v: 15 },
      { k: "n", l: "贷款年限", u: "年", v: 30 },
      { k: "r", l: "年利率", u: "%", v: 3.05 },
      { k: "t", l: "契税税率", u: "%", v: 1 }
    ],
    run: function (v) {
      pos(v.p, v.n); need(v.d, v.r, v.t);
      var P = v.p * 1e4, dp = P * v.d / 100, loan = P - dp, m = pmt(loan, v.r / 1200, v.n * 12);
      return { big: ["首付款", wy(dp)], kv: [["贷款金额", wy(loan)], ["月供（等额本息）", y(m)], ["契税", wy(P * v.t / 100)], ["首期现金合计", wy(dp + P * v.t / 100)]], note: "首期现金另需预留中介费、维修基金、装修等。" };
    } });

  add({ cat: "property", id: "rent-yield", name: "租金回报率计算器", desc: "租售比、年化租金回报率与回本年数", kw: "租售比 投资",
    fields: [
      { k: "p", l: "房屋总价", u: "万元", v: 300 },
      { k: "r", l: "月租金", u: "元", v: 6000 },
      { k: "c", l: "每年持有成本（物业、维修等）", u: "元", v: 6000 },
      { k: "v", l: "每年空置", u: "月", v: 1 }
    ],
    run: function (v) {
      pos(v.p, v.r); need(v.c, v.v);
      var inc = v.r * (12 - v.v) - v.c, P = v.p * 1e4;
      return { big: ["净租金回报率", pct(inc / P)], kv: [["毛回报率", pct(v.r * 12 / P)], ["租售比", "1 : " + f(P / v.r, 0)], ["年净租金", y(inc)], ["回本年数", inc > 0 ? f(P / inc, 1) + " 年" : "—"]] };
    } });

  add({ cat: "property", id: "rent-vs-buy", name: "租房还是买房", desc: "同样年限下租房与买房的总成本对比", kw: "买房 租房 对比",
    fields: [
      { k: "p", l: "房屋总价", u: "万元", v: 300 },
      { k: "d", l: "首付比例", u: "%", v: 30 },
      { k: "r", l: "房贷年利率", u: "%", v: 3.05 },
      { k: "rent", l: "同类房月租金", u: "元", v: 6000 },
      { k: "rg", l: "租金年涨幅", u: "%", v: 2 },
      { k: "hg", l: "房价年涨幅", u: "%", v: 0 },
      { k: "inv", l: "首付若拿去理财的年化收益", u: "%", v: 2.5 },
      { k: "n", l: "比较年限", u: "年", v: 10 }
    ],
    run: function (v) {
      pos(v.p, v.rent, v.n); need(v.d, v.r, v.rg, v.hg, v.inv);
      var P = v.p * 1e4, dp = P * v.d / 100, loan = P - dp, m = pmt(loan, v.r / 1200, 360), months = v.n * 12, bal = loan, paid = 0;
      for (var i = 0; i < months; i++) { var it = bal * v.r / 1200; bal -= m - it; paid += m; }
      var house = P * Math.pow(1 + v.hg / 100, v.n);
      var buyCost = dp + paid - (house - bal);
      var rentCost = 0; for (var k = 0; k < v.n; k++) rentCost += v.rent * 12 * Math.pow(1 + v.rg / 100, k);
      var opp = dp * (Math.pow(1 + v.inv / 100, v.n) - 1);
      var rentNet = rentCost - opp;
      return { big: [v.n + " 年后更划算", buyCost < rentNet ? "买房" : "租房"], kv: [["买房净成本", wy(buyCost)], ["租房净成本", wy(rentNet)], ["届时房屋价值", wy(house)], ["剩余贷款", wy(bal)]],
        note: "买房净成本 = 首付 + 已还月供 − 房屋净值；租房净成本 = 累计租金 − 首付理财收益。未计税费、装修与持有成本，仅作粗略参考。" };
    } });

  add({ cat: "property", id: "area-ratio", name: "得房率计算器", desc: "建筑面积、套内面积与公摊比例互算", kw: "公摊 套内",
    fields: [
      { k: "b", l: "建筑面积", u: "㎡", v: 100 },
      { k: "i", l: "套内面积", u: "㎡", v: 78 },
      { k: "u", l: "单价（按建筑面积）", u: "元/㎡", v: 30000 }
    ],
    run: function (v) {
      pos(v.b, v.i); need(v.u);
      if (v.i > v.b) throw "套内面积不能大于建筑面积";
      return { big: ["得房率", pct(v.i / v.b, 1)], kv: [["公摊面积", f(v.b - v.i) + " ㎡"], ["公摊比例", pct(1 - v.i / v.b, 1)], ["套内实际单价", f(v.u * v.b / v.i, 0) + " 元/㎡"], ["公摊花费", wy((v.b - v.i) * v.u)]] };
    } });

  /* ======================= 汽车出行 ======================= */
  function purchaseTax(price, nev) {
    var full = price / 1.13 * 0.10;
    if (!nev) return full;
    return full - Math.min(full / 2, 15000);
  }
  add({ cat: "auto", id: "purchase-tax", name: "车辆购置税计算器", desc: "含税裸车价换算，燃油车 10%，新能源 2026 年减半", kw: "购置税 新能源",
    fields: [
      { k: "p", l: "含税裸车价（发票价）", u: "元", v: 200000 },
      { k: "t", l: "车辆类型", t: "sel", o: ["燃油车", "新能源（2026–2027 减半）"] }
    ],
    run: function (v) {
      pos(v.p);
      var nev = v.t !== "燃油车", tax = purchaseTax(v.p, nev), full = v.p / 1.13 * .1;
      return { big: ["应缴购置税", y(tax)], kv: [["不含税价", y(v.p / 1.13)], ["全额税款", y(full)], ["减免金额", y(full - tax)]],
        note: nev ? "2026–2027 年购置的新能源乘用车减半征收，每辆减税额不超过 1.5 万元，且需在《减免车辆购置税的新能源汽车车型目录》内。" : "购置税 = 发票价 ÷ 1.13 × 10%。" };
    } });

  add({ cat: "auto", id: "on-road-price", name: "购车落地价计算器", desc: "裸车价 + 购置税 + 保险 + 上牌，全款落地价", kw: "落地价 买车",
    fields: [
      { k: "p", l: "裸车价", u: "元", v: 150000 },
      { k: "t", l: "车辆类型", t: "sel", o: ["燃油车", "新能源"] },
      { k: "ci", l: "交强险", u: "元", v: 950 },
      { k: "bi", l: "商业险", u: "元", v: 4000 },
      { k: "vt", l: "车船税（新能源免征）", u: "元", v: 360, show: function (v) { return v.t === "燃油车"; } },
      { k: "o", l: "上牌及其他费用", u: "元", v: 500 }
    ],
    run: function (v) {
      pos(v.p); need(v.ci, v.bi, v.o);
      var nev = v.t === "新能源", tax = purchaseTax(v.p, nev), vt = nev ? 0 : (ok(v.vt) ? v.vt : 0);
      var tot = v.p + tax + v.ci + v.bi + vt + v.o;
      return { big: ["落地价", y(tot)], kv: [["购置税", y(tax)], ["保险合计", y(v.ci + v.bi)], ["车船税", y(vt)], ["比裸车价多", y(tot - v.p)]] };
    } });

  add({ cat: "auto", id: "fuel-cost", name: "油费计算器", desc: "按油耗和油价算行程油费与每公里成本", kw: "油耗 加油 自驾",
    fields: [
      { k: "d", l: "行驶里程", u: "km", v: 500 },
      { k: "c", l: "百公里油耗", u: "L", v: 7 },
      { k: "p", l: "油价", u: "元/L", v: 7.5 },
      { k: "n", l: "分摊人数", u: "人", v: 1 }
    ],
    run: function (v) {
      pos(v.d, v.c, v.p); var L0 = v.d * v.c / 100, cost = L0 * v.p, n = v.n > 0 ? v.n : 1;
      return { big: ["油费", y(cost)], kv: [["耗油量", f(L0) + " L"], ["每公里", y(cost / v.d)], ["每人分摊", y(cost / n)]] };
    } });

  add({ cat: "auto", id: "ev-cost", name: "电车充电费用计算器", desc: "电耗 × 电价，对比同级燃油车每公里成本", kw: "新能源 充电 电费",
    fields: [
      { k: "d", l: "行驶里程", u: "km", v: 1000 },
      { k: "e", l: "百公里电耗", u: "kWh", v: 15 },
      { k: "p", l: "充电单价（含服务费）", u: "元/kWh", v: 1.2 },
      { k: "fc", l: "对比燃油车百公里油耗", u: "L", v: 7 },
      { k: "fp", l: "油价", u: "元/L", v: 7.5 }
    ],
    run: function (v) {
      pos(v.d, v.e, v.p); need(v.fc, v.fp);
      var ev = v.d * v.e / 100 * v.p, ice = v.d * v.fc / 100 * v.fp;
      return { big: ["充电费用", y(ev)], kv: [["每公里", y(ev / v.d)], ["同里程油费", y(ice)], ["节省", y(ice - ev)]] };
    } });

  add({ cat: "auto", id: "car-cost", name: "养车成本计算器", desc: "油费、保险、保养、停车、折旧，每年和每公里花多少", kw: "养车 用车成本",
    fields: [
      { k: "km", l: "年行驶里程", u: "km", v: 15000 },
      { k: "e", l: "每公里能耗费用", u: "元", v: 0.5 },
      { k: "ins", l: "年保险", u: "元", v: 5000 },
      { k: "mt", l: "年保养维修", u: "元", v: 2000 },
      { k: "pk", l: "年停车过路", u: "元", v: 3600 },
      { k: "p", l: "购车价", u: "元", v: 150000 },
      { k: "dep", l: "年折旧率", u: "%", v: 10 }
    ],
    run: function (v) {
      pos(v.km); need(v.e, v.ins, v.mt, v.pk, v.p, v.dep);
      var energy = v.km * v.e, dep = v.p * v.dep / 100, tot = energy + v.ins + v.mt + v.pk + dep;
      return { big: ["每年用车成本", y(tot)], kv: [["每月", y(tot / 12)], ["每公里", y(tot / v.km)], ["能耗", y(energy)], ["折旧", y(dep)]] };
    } });

  /* ======================= 健康健身 ======================= */
  add({ cat: "health", id: "bmi", name: "BMI 计算器", desc: "身体质量指数 · 中国成人标准 · 健康体重区间", kw: "体重 胖 瘦",
    fields: [{ k: "h", l: "身高", u: "cm", v: 170 }, { k: "w", l: "体重", u: "kg", v: 65 }],
    run: function (v) {
      pos(v.h, v.w); var m = v.h / 100, b = v.w / m / m;
      var tag = b < 18.5 ? "偏瘦" : b < 24 ? "正常" : b < 28 ? "超重" : "肥胖";
      return { big: ["BMI", f(b, 1)], tag: tag, kv: [["健康体重区间", f(18.5 * m * m, 1) + " – " + f(23.9 * m * m, 1) + " kg"], ["距正常上限", b >= 24 ? "需减 " + f(v.w - 23.9 * m * m, 1) + " kg" : "—"]],
        note: "中国成人标准：<18.5 偏瘦，18.5–23.9 正常，24–27.9 超重，≥28 肥胖。不适用于孕妇、儿童和肌肉量特别大的人。" };
    } });

  add({ cat: "health", id: "bmr", name: "基础代谢 / 每日热量", desc: "Mifflin-St Jeor 基础代谢率与每日总消耗 TDEE", kw: "bmr tdee 卡路里 减脂",
    fields: [
      { k: "s", l: "性别", t: "sel", o: ["男", "女"] },
      { k: "a", l: "年龄", u: "岁", v: 25 }, { k: "h", l: "身高", u: "cm", v: 170 }, { k: "w", l: "体重", u: "kg", v: 65 },
      { k: "act", l: "活动水平", t: "sel", drop: true, o: [[1.2, "久坐不动"], [1.375, "轻度（每周运动 1–3 天）"], [1.55, "中度（每周 3–5 天）"], [1.725, "高强度（每周 6–7 天）"], [1.9, "体力劳动 / 专业训练"]], v: 1.375 }
    ],
    run: function (v) {
      pos(v.a, v.h, v.w);
      var b = 10 * v.w + 6.25 * v.h - 5 * v.a + (v.s === "男" ? 5 : -161), t = b * v.act;
      return { big: ["每日总消耗 TDEE", f(t, 0) + " kcal"], kv: [["基础代谢 BMR", f(b, 0) + " kcal"], ["减脂（-500）", f(t - 500, 0) + " kcal"], ["增肌（+300）", f(t + 300, 0) + " kcal"], ["维持", f(t, 0) + " kcal"]] };
    } });

  add({ cat: "health", id: "body-fat", name: "体脂率计算器", desc: "美国海军围度法估算体脂率、脂肪量和瘦体重", kw: "体脂 围度",
    fields: [
      { k: "s", l: "性别", t: "sel", o: ["男", "女"] },
      { k: "h", l: "身高", u: "cm", v: 175 }, { k: "w", l: "体重", u: "kg", v: 70 },
      { k: "n", l: "颈围", u: "cm", v: 37 }, { k: "wa", l: "腰围（肚脐处）", u: "cm", v: 82 },
      { k: "hip", l: "臀围", u: "cm", v: 95, show: function (v) { return v.s === "女"; } }
    ],
    run: function (v) {
      pos(v.h, v.w, v.n, v.wa); var bf;
      if (v.s === "男") { if (v.wa <= v.n) throw "腰围需大于颈围"; bf = 495 / (1.0324 - 0.19077 * Math.log10(v.wa - v.n) + 0.15456 * Math.log10(v.h)) - 450; }
      else { pos(v.hip); bf = 495 / (1.29579 - 0.35004 * Math.log10(v.wa + v.hip - v.n) + 0.221 * Math.log10(v.h)) - 450; }
      var m = v.s === "男", tag = bf < (m ? 6 : 14) ? "必需脂肪" : bf < (m ? 14 : 21) ? "运动员" : bf < (m ? 18 : 25) ? "健康" : bf < (m ? 25 : 32) ? "一般" : "偏高";
      return { big: ["体脂率", f(bf, 1) + "%"], tag: tag, kv: [["脂肪量", f(v.w * bf / 100, 1) + " kg"], ["瘦体重", f(v.w * (1 - bf / 100), 1) + " kg"]], note: "分级参考 ACE 标准。围度法误差约 ±3%。" };
    } });

  add({ cat: "health", id: "waist-hip-ratio", name: "腰臀比计算器", desc: "WHR 与腹型肥胖风险参考", kw: "whr 腰围",
    fields: [{ k: "s", l: "性别", t: "sel", o: ["男", "女"] }, { k: "w", l: "腰围", u: "cm", v: 82 }, { k: "h", l: "臀围", u: "cm", v: 95 }],
    run: function (v) {
      pos(v.w, v.h); var r = v.w / v.h, lim = v.s === "男" ? 0.9 : 0.85;
      var waistLim = v.s === "男" ? 90 : 85;
      return { big: ["腰臀比", f(r, 2)], tag: r >= lim ? "腹型肥胖风险偏高" : "正常", kv: [["参考上限", f(lim, 2)], ["腰围（中国标准）", v.w >= waistLim ? "≥" + waistLim + " cm，属中心型肥胖" : "正常"]], note: "WHO：男性 ≥0.90、女性 ≥0.85 提示腹型肥胖。" };
    } });

  add({ cat: "health", id: "bsa", name: "体表面积计算器", desc: "Mosteller / Du Bois / 许文生公式体表面积", kw: "bsa 用药 剂量",
    fields: [{ k: "h", l: "身高", u: "cm", v: 170 }, { k: "w", l: "体重", u: "kg", v: 65 }],
    run: function (v) {
      pos(v.h, v.w); var mo = Math.sqrt(v.h * v.w / 3600), db = 0.007184 * Math.pow(v.w, 0.425) * Math.pow(v.h, 0.725), xu = 0.0061 * v.h + 0.0128 * v.w - 0.1529;
      return { big: ["体表面积（Mosteller）", f(mo, 3) + " m²"], kv: [["Du Bois", f(db, 3) + " m²"], ["许文生（中国人）", f(xu, 3) + " m²"], ["与 1.73 m² 之比", f(mo / 1.73, 3)]], note: "仅供参考，临床用药请遵医嘱。" };
    } });

  add({ cat: "health", id: "heart-rate", name: "心率区间计算器", desc: "最大心率与燃脂、有氧、无氧训练区间（储备心率法）", kw: "跑步 燃脂 心率",
    fields: [{ k: "a", l: "年龄", u: "岁", v: 25 }, { k: "r", l: "静息心率", u: "次/分", v: 65 }],
    run: function (v) {
      pos(v.a, v.r); var mx = 208 - 0.7 * v.a, hrr = mx - v.r;
      function z(a, b) { return f(v.r + hrr * a, 0) + " – " + f(v.r + hrr * b, 0); }
      return { big: ["最大心率", f(mx, 0) + " 次/分"], table: { h: ["区间", "强度", "心率（次/分）"], r: [["Z1 热身恢复", "50–60%", z(.5, .6)], ["Z2 燃脂", "60–70%", z(.6, .7)], ["Z3 有氧", "70–80%", z(.7, .8)], ["Z4 乳酸阈", "80–90%", z(.8, .9)], ["Z5 无氧极限", "90–100%", z(.9, 1)]] }, note: "最大心率用 Tanaka 公式 208 − 0.7 × 年龄。" };
    } });

  add({ cat: "health", id: "due-date", name: "预产期计算器", desc: "按末次月经推算预产期和当前孕周", kw: "怀孕 孕周",
    fields: [{ k: "d", l: "末次月经第一天", t: "date", v: function () { var d = new Date(); d.setDate(d.getDate() - 70); return iso(d); } }, { k: "c", l: "月经周期", u: "天", v: 28 }],
    run: function (v) {
      var d = D(v.d), c = ok(v.c) ? v.c : 28, due = new Date(d); due.setDate(due.getDate() + 280 + (c - 28));
      var g = dayDiff(d, new Date()) - (c - 28);
      return { big: ["预产期", iso(due) + " " + WK[due.getDay()]], kv: [["当前孕周", g >= 0 ? Math.floor(g / 7) + " 周 " + (g % 7) + " 天" : "—"], ["距预产期", dayDiff(new Date(), due) + " 天"]], note: "仅为推算，以医院 B 超核对为准。" };
    } });

  add({ cat: "health", id: "water", name: "每日饮水量计算器", desc: "按体重和运动量估算每天该喝多少水", kw: "喝水",
    fields: [{ k: "w", l: "体重", u: "kg", v: 65 }, { k: "e", l: "每日运动时长", u: "分钟", v: 30 }],
    run: function (v) { pos(v.w); need(v.e); var ml = v.w * 33 + v.e / 30 * 350; return { big: ["每日建议饮水", f(ml / 1000, 1) + " L"], kv: [["约合 250 ml 杯", f(ml / 250, 0) + " 杯"]], note: "《中国居民膳食指南》建议成人每天饮水 1.5–1.7 L，天热或运动多时适当增加。" }; } });

  /* ======================= 数学计算 ======================= */
  add({ cat: "math", id: "standard", name: "常规 / 科学计算器", desc: "加减乘除、三角、对数、阶乘，支持键盘输入", href: "/hark/calculator.html", fields: [], run: function () {} });

  add({ cat: "math", id: "percentage", name: "百分比计算器", desc: "求百分之几、占比、变化率、增减后的值", kw: "百分数 涨幅",
    fields: [
      { k: "m", l: "计算类型", t: "sel", drop: true, o: ["A 的 B% 是多少", "A 占 B 的百分之几", "从 A 变到 B 的变化率", "A 增加 B%", "A 减少 B%"] },
      { k: "a", l: "A", v: 200 }, { k: "b", l: "B", v: 15 }
    ],
    run: function (v) {
      need(v.a, v.b);
      switch (v.m) {
        case "A 的 B% 是多少": return { big: ["结果", g(v.a * v.b / 100)] };
        case "A 占 B 的百分之几": if (!v.b) throw "B 不能为 0"; return { big: ["结果", g(v.a / v.b * 100, 4) + "%"] };
        case "从 A 变到 B 的变化率": if (!v.a) throw "A 不能为 0"; return { big: ["变化率", (v.b >= v.a ? "+" : "") + g((v.b - v.a) / Math.abs(v.a) * 100, 4) + "%"], kv: [["差值", g(v.b - v.a)]] };
        case "A 增加 B%": return { big: ["结果", g(v.a * (1 + v.b / 100))] };
        default: return { big: ["结果", g(v.a * (1 - v.b / 100))] };
      }
    } });

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }
  function frac(s) {
    s = String(s).trim(); var m;
    if ((m = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/))) { var w = +m[1]; return [w * +m[3] + (w < 0 ? -1 : 1) * +m[2], +m[3]]; }
    if ((m = s.match(/^(-?\d+)\/(-?\d+)$/))) return [+m[1], +m[2]];
    if ((m = s.match(/^-?\d+(\.\d+)?$/))) { var dp = (m[1] || "").length - (m[1] ? 1 : 0), den = Math.pow(10, dp); return [Math.round(+s * den), den]; }
    throw "分数格式示例：3/4、1 1/2、0.25";
  }
  function fstr(n, d) {
    if (!d) throw "分母不能为 0"; var k = gcd(n, d); n /= k; d /= k; if (d < 0) { n = -n; d = -d; }
    if (d === 1) return String(n);
    var w = Math.trunc(n / d), r = Math.abs(n % d);
    return n + "/" + d + (w ? "（带分数 " + w + " " + r + "/" + d + "）" : "");
  }
  add({ cat: "math", id: "fraction", name: "分数计算器", desc: "分数加减乘除、约分、带分数与小数", kw: "通分 约分",
    fields: [{ k: "a", l: "第一个分数", t: "text", v: "3/4" }, { k: "o", l: "运算", t: "sel", o: ["+", "−", "×", "÷"] }, { k: "b", l: "第二个分数", t: "text", v: "1 1/2" }],
    run: function (v) {
      var A = frac(v.a), B = frac(v.b), n, d;
      if (v.o === "+") { n = A[0] * B[1] + B[0] * A[1]; d = A[1] * B[1]; }
      else if (v.o === "−") { n = A[0] * B[1] - B[0] * A[1]; d = A[1] * B[1]; }
      else if (v.o === "×") { n = A[0] * B[0]; d = A[1] * B[1]; }
      else { if (!B[0]) throw "不能除以 0"; n = A[0] * B[1]; d = A[1] * B[0]; }
      return { big: ["结果", fstr(n, d)], kv: [["小数", g(n / d, 10)]] };
    } });

  add({ cat: "math", id: "gcd-lcm", name: "最大公约数 / 最小公倍数", desc: "多个整数的 GCD、LCM 与质因数分解", kw: "公约数 公倍数 质因数",
    fields: [{ k: "s", l: "整数（逗号或空格分隔）", t: "text", v: "12, 18, 30" }],
    run: function (v) {
      var a = String(v.s).split(/[\s,，]+/).filter(Boolean).map(Number);
      if (!a.length || a.some(function (x) { return !Number.isInteger(x) || x <= 0 || x > 1e12; })) throw "请输入正整数";
      var G = a.reduce(gcd), Lc = a.reduce(function (x, y2) { return x / gcd(x, y2) * y2; });
      return { big: ["最大公约数", String(G)], kv: [["最小公倍数", g(Lc, 0)]], table: { h: ["数", "质因数分解"], r: a.map(function (x) { return [x, factor(x)]; }) } };
    } });
  function factor(n) {
    if (n < 2) return String(n); var out = [], p = 2;
    while (p * p <= n) { var c = 0; while (n % p === 0) { n /= p; c++; } if (c) out.push(p + (c > 1 ? "^" + c : "")); p += p === 2 ? 1 : 2; }
    if (n > 1) out.push(n); return out.join(" × ");
  }

  add({ cat: "math", id: "quadratic", name: "一元二次方程", desc: "ax² + bx + c = 0 求根（含复数根）、判别式、顶点", kw: "方程 求根公式",
    fields: [{ k: "a", l: "a", v: 1 }, { k: "b", l: "b", v: -3 }, { k: "c", l: "c", v: 2 }],
    run: function (v) {
      need(v.a, v.b, v.c); if (!v.a) { if (!v.b) throw "a、b 不能同时为 0"; return { big: ["一次方程的根", "x = " + g(-v.c / v.b)] }; }
      var d = v.b * v.b - 4 * v.a * v.c, kv = [["判别式 Δ", g(d)], ["顶点", "(" + g(-v.b / 2 / v.a) + ", " + g(v.c - v.b * v.b / 4 / v.a) + ")"]];
      if (d >= 0) { var s = Math.sqrt(d); return { big: [d === 0 ? "两个相等实根" : "两个实根", "x₁ = " + g((-v.b + s) / 2 / v.a) + "，x₂ = " + g((-v.b - s) / 2 / v.a)], kv: kv }; }
      var re = -v.b / 2 / v.a, im = Math.sqrt(-d) / 2 / Math.abs(v.a);
      return { big: ["两个共轭复根", "x = " + g(re) + " ± " + g(im) + "i"], kv: kv };
    } });

  add({ cat: "math", id: "statistics", name: "平均数 / 方差 / 标准差", desc: "一组数据的平均数、中位数、众数、方差、标准差", kw: "统计 均值 中位数",
    fields: [{ k: "s", l: "数据（逗号、空格或换行分隔）", t: "area", v: "3, 7, 7, 2, 9, 4" }],
    run: function (v) {
      var a = String(v.s).split(/[\s,，;；]+/).filter(Boolean).map(Number);
      if (!a.length || a.some(isNaN)) throw "请输入数字";
      var n = a.length, sum = a.reduce(function (x, y2) { return x + y2; }, 0), mean = sum / n, s = a.slice().sort(function (x, y2) { return x - y2; });
      var med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2, ss = a.reduce(function (x, y2) { return x + (y2 - mean) * (y2 - mean); }, 0);
      var cnt = {}, mx = 0; a.forEach(function (x) { cnt[x] = (cnt[x] || 0) + 1; mx = Math.max(mx, cnt[x]); });
      var mode = mx > 1 ? Object.keys(cnt).filter(function (k) { return cnt[k] === mx; }).join("、") : "无";
      return { big: ["平均数", g(mean)], kv: [["个数", n], ["总和", g(sum)], ["中位数", g(med)], ["众数", mode], ["最小 / 最大", g(s[0]) + " / " + g(s[n - 1])], ["总体方差", g(ss / n)], ["总体标准差", g(Math.sqrt(ss / n))], ["样本标准差", n > 1 ? g(Math.sqrt(ss / (n - 1))) : "—"]] };
    } });

  add({ cat: "math", id: "base", name: "进制转换", desc: "二进制、八进制、十进制、十六进制及任意 2–36 进制互转", kw: "二进制 十六进制 hex",
    fields: [{ k: "s", l: "数值", t: "text", v: "255" }, { k: "b", l: "输入进制", u: "进制", v: 10 }],
    run: function (v) {
      var b = v.b; if (!Number.isInteger(b) || b < 2 || b > 36) throw "进制需在 2–36 之间";
      var s = String(v.s).trim().toLowerCase().replace(/^0[xbo]/, ""), neg = s[0] === "-"; if (neg) s = s.slice(1);
      if (!s) throw "请输入数值"; var n = 0n, B = BigInt(b);
      for (var i = 0; i < s.length; i++) { var d = parseInt(s[i], 36); if (isNaN(d) || d >= b) throw "“" + s[i] + "”不是 " + b + " 进制数字"; n = n * B + BigInt(d); }
      function to(k) { return (neg ? "-" : "") + n.toString(k).toUpperCase(); }
      return { big: ["十进制", to(10)], kv: [["二进制", to(2)], ["八进制", to(8)], ["十六进制", to(16)], ["三十六进制", to(36)]] };
    } });

  add({ cat: "math", id: "permutation", name: "排列组合计算器", desc: "排列数 A(n,m)、组合数 C(n,m)、阶乘", kw: "阶乘 组合数",
    fields: [{ k: "n", l: "n（总数）", v: 10 }, { k: "m", l: "m（选取数）", v: 3 }],
    run: function (v) {
      if (!Number.isInteger(v.n) || !Number.isInteger(v.m) || v.n < 0 || v.m < 0) throw "请输入非负整数";
      if (v.m > v.n) throw "m 不能大于 n"; if (v.n > 1000) throw "n 最大 1000";
      var A = 1n, C = 1n, F = 1n, i;
      for (i = 0; i < v.m; i++) A *= BigInt(v.n - i);
      for (i = 1; i <= v.m; i++) C = C * BigInt(v.n - v.m + i) / BigInt(i);
      for (i = 2; i <= v.n; i++) F *= BigInt(i);
      function s(x) { var t = x.toString(); return t.length > 40 ? t.slice(0, 12) + "…（" + t.length + " 位）" : t; }
      return { big: ["组合数 C(" + v.n + "," + v.m + ")", s(C)], kv: [["排列数 A(" + v.n + "," + v.m + ")", s(A)], [v.n + "!", s(F)]] };
    } });

  /* ======================= 单位换算 ======================= */
  function unit(id, name, desc, kw, units, def) {
    add({ cat: "convert", id: id, name: name, desc: desc, kw: kw,
      fields: [{ k: "x", l: "数值", v: 1 }, { k: "u", l: "单位", t: "sel", drop: true, o: units.map(function (u) { return u[0]; }), v: def || units[0][0] }],
      run: function (v) {
        need(v.x); var base = 0; units.forEach(function (u) { if (u[0] === v.u) base = v.x * u[1]; });
        return { table: { h: ["单位", "数值"], r: units.map(function (u) { return [u[0], g(base / u[1], 8)]; }) } };
      } });
  }
  unit("length", "长度换算器", "米、厘米、公里、市尺市里、英寸英尺英里、海里", "米 尺 英寸", [["米 m", 1], ["千米 km", 1000], ["厘米 cm", .01], ["毫米 mm", .001], ["微米 μm", 1e-6], ["纳米 nm", 1e-9], ["里", 500], ["丈", 10 / 3], ["尺", 1 / 3], ["寸", 1 / 30], ["英里 mi", 1609.344], ["码 yd", .9144], ["英尺 ft", .3048], ["英寸 in", .0254], ["海里 nmi", 1852], ["光年", 9.4607304725808e15]]);
  unit("weight", "重量换算器", "公斤、斤、两、克、吨、磅、盎司、克拉", "公斤 斤 磅", [["千克 kg", 1], ["克 g", .001], ["毫克 mg", 1e-6], ["吨 t", 1000], ["斤", .5], ["两", .05], ["钱", .005], ["磅 lb", .45359237], ["盎司 oz", .028349523125], ["英石 st", 6.35029318], ["克拉 ct", .0002]]);
  unit("area", "面积换算器", "平方米、亩、公顷、平方公里、平方英尺、英亩", "亩 公顷 平方", [["平方米 ㎡", 1], ["平方千米 k㎡", 1e6], ["公顷 ha", 1e4], ["亩", 10000 / 15], ["分（地）", 1000 / 15], ["平方厘米", 1e-4], ["平方英尺 ft²", .09290304], ["平方英寸 in²", .00064516], ["平方码 yd²", .83612736], ["英亩 acre", 4046.8564224], ["平方英里", 2589988.110336]]);
  unit("volume", "体积换算器", "升、毫升、立方米、美/英加仑、液盎司、石油桶", "升 加仑", [["升 L", 1], ["毫升 mL", .001], ["立方米 m³", 1000], ["立方厘米 cm³", .001], ["美制加仑", 3.785411784], ["英制加仑", 4.54609], ["美制液盎司", .0295735295625], ["英制液盎司", .0284130625], ["美制杯", .2365882365], ["立方英尺", 28.316846592], ["石油桶 bbl", 158.987294928]]);
  unit("speed", "速度换算器", "公里/小时、米/秒、英里/小时、节、马赫", "速度 节 马赫", [["千米/时 km/h", 1 / 3.6], ["米/秒 m/s", 1], ["英里/时 mph", .44704], ["节 kn", 1852 / 3600], ["英尺/秒", .3048], ["马赫（海平面）", 340.3], ["光速 c", 299792458]], "千米/时 km/h");
  unit("data", "数据存储换算器", "B、KB、MB、GB、TB 与 KiB、MiB、GiB（1024 进制）", "存储 硬盘 gb", [["字节 B", 1], ["比特 bit", .125], ["KB（1000）", 1e3], ["MB（1000）", 1e6], ["GB（1000）", 1e9], ["TB（1000）", 1e12], ["KiB（1024）", 1024], ["MiB（1024）", 1048576], ["GiB（1024）", 1073741824], ["TiB（1024）", 1099511627776]], "GB（1000）");
  unit("time-unit", "时间单位换算", "秒、分钟、小时、天、周、月、年", "秒 小时", [["秒", 1], ["毫秒", .001], ["分钟", 60], ["小时", 3600], ["天", 86400], ["周", 604800], ["月（30.44 天）", 2629746], ["年（365.2425 天）", 31556952]], "小时");
  unit("pressure", "压强换算器", "帕、千帕、兆帕、标准大气压、bar、psi、毫米汞柱", "胎压 bar psi", [["帕 Pa", 1], ["千帕 kPa", 1e3], ["兆帕 MPa", 1e6], ["标准大气压 atm", 101325], ["巴 bar", 1e5], ["psi", 6894.757293168], ["毫米汞柱 mmHg", 133.322387415], ["千克力/平方厘米", 98066.5]], "巴 bar");
  unit("energy", "能量 / 功率换算", "焦耳、千卡、千瓦时、英热单位，瓦与马力", "卡路里 千瓦时 马力", [["焦耳 J", 1], ["千焦 kJ", 1e3], ["卡 cal", 4.184], ["千卡 kcal", 4184], ["千瓦时 kWh（度）", 3.6e6], ["英热单位 BTU", 1055.05585262], ["电子伏 eV", 1.602176634e-19]], "千卡 kcal");
  add({ cat: "convert", id: "temperature", name: "温度换算器", desc: "摄氏度、华氏度、开尔文、兰氏度互换", kw: "摄氏 华氏",
    fields: [{ k: "x", l: "数值", v: 37 }, { k: "u", l: "单位", t: "sel", o: ["℃", "℉", "K", "°R"] }],
    run: function (v) {
      need(v.x); var c = v.u === "℃" ? v.x : v.u === "℉" ? (v.x - 32) / 1.8 : v.u === "K" ? v.x - 273.15 : (v.x - 491.67) / 1.8;
      if (c < -273.15) throw "低于绝对零度";
      return { table: { h: ["单位", "数值"], r: [["摄氏度 ℃", g(c, 4)], ["华氏度 ℉", g(c * 1.8 + 32, 4)], ["开尔文 K", g(c + 273.15, 4)], ["兰氏度 °R", g((c + 273.15) * 1.8, 4)]] } };
    } });

  /* ======================= 日期时间 ======================= */
  add({ cat: "date", id: "age", name: "年龄计算器", desc: "周岁、虚岁、活了多少天、下次生日倒计时、生肖星座", kw: "周岁 虚岁 生日",
    fields: [{ k: "b", l: "出生日期", t: "date", v: "2000-01-01" }, { k: "t", l: "计算到", t: "date", v: "today" }],
    run: function (v) {
      var b = D(v.b), t = D(v.t); if (t < b) throw "计算日期早于出生日期";
      var a = ymd(b, t), days = dayDiff(b, t), nb = new Date(t.getFullYear(), b.getMonth(), b.getDate()); if (nb < t) nb.setFullYear(nb.getFullYear() + 1);
      var zod = "鼠牛虎兔龙蛇马羊猴鸡狗猪"[((b.getFullYear() - 4) % 12 + 12) % 12];
      var md = (b.getMonth() + 1) * 100 + b.getDate(), stars = [[120, "摩羯座"], [219, "水瓶座"], [320, "双鱼座"], [420, "白羊座"], [521, "金牛座"], [621, "双子座"], [722, "巨蟹座"], [823, "狮子座"], [923, "处女座"], [1023, "天秤座"], [1122, "天蝎座"], [1221, "射手座"], [1231, "摩羯座"]];
      var star = stars.filter(function (s) { return md <= s[0]; })[0][1];
      return { big: ["周岁", a[0] + " 岁 " + a[1] + " 个月 " + a[2] + " 天"], kv: [["虚岁（按公历年）", (t.getFullYear() - b.getFullYear() + 1) + " 岁"], ["已活天数", f(days, 0) + " 天"], ["约合周数", f(days / 7, 0) + " 周"], ["距下次生日", dayDiff(t, nb) + " 天"], ["生肖（按公历年）", zod], ["星座", star]], note: "虚岁、生肖严格应以春节为界，这里按公历年份粗算。" };
    } });

  add({ cat: "date", id: "date-add", name: "日期推算计算器", desc: "某天加减 N 天 / 周 / 月 / 年后是几号、星期几", kw: "几天后 日期加减",
    fields: [{ k: "d", l: "起始日期", t: "date", v: "today" }, { k: "n", l: "加减数量（负数为往前）", v: 100 }, { k: "u", l: "单位", t: "sel", o: ["天", "周", "月", "年"] }],
    run: function (v) {
      var d = D(v.d); need(v.n); var n = Math.trunc(v.n), r;
      if (v.u === "天") { r = new Date(d); r.setDate(r.getDate() + n); } else if (v.u === "周") { r = new Date(d); r.setDate(r.getDate() + n * 7); }
      else r = addMonths(d, v.u === "月" ? n : n * 12);
      return { big: ["结果日期", iso(r) + " " + WK[r.getDay()]], kv: [["相差天数", dayDiff(d, r) + " 天"], ["当年第几天", dayDiff(new Date(r.getFullYear(), 0, 1), r) + 1 + " 天"]] };
    } });

  add({ cat: "date", id: "date-diff", name: "日期间隔计算器", desc: "两个日期相差几天、几周、几个月、几年", kw: "相差 天数",
    fields: [{ k: "a", l: "开始日期", t: "date", v: "today" }, { k: "b", l: "结束日期", t: "date", v: function () { return new Date().getFullYear() + 1 + "-01-01"; } }, { k: "i", l: "是否包含结束当天", t: "sel", o: ["不包含", "包含"] }],
    run: function (v) {
      var a = D(v.a), b = D(v.b), s = 1; if (b < a) { var t = a; a = b; b = t; s = -1; }
      var n = dayDiff(a, b) + (v.i === "包含" ? 1 : 0), p = ymd(a, b);
      return { big: ["相差", (s < 0 ? "-" : "") + f(n, 0) + " 天"], kv: [["约合", p[0] + " 年 " + p[1] + " 个月 " + p[2] + " 天"], ["周数", Math.floor(n / 7) + " 周 " + (n % 7) + " 天"], ["小时", f(n * 24, 0)], ["分钟", f(n * 1440, 0)]] };
    } });

  add({ cat: "date", id: "workdays", name: "工作日计算器", desc: "两个日期之间有多少个工作日（周一到周五）", kw: "上班 工作日 双休",
    fields: [{ k: "a", l: "开始日期", t: "date", v: "today" }, { k: "b", l: "结束日期", t: "date", v: function () { var d = new Date(); d.setDate(d.getDate() + 30); return iso(d); } }, { k: "h", l: "其中法定假日（工作日内）", u: "天", v: 0 }, { k: "w", l: "调休上班（周末）", u: "天", v: 0 }],
    run: function (v) {
      var a = D(v.a), b = D(v.b); if (b < a) throw "结束日期需晚于开始日期";
      var wd = 0, we = 0; for (var d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) { var k = d.getDay(); if (k === 0 || k === 6) we++; else wd++; }
      var h = ok(v.h) ? v.h : 0, w = ok(v.w) ? v.w : 0;
      return { big: ["工作日", (wd - h + w) + " 天"], kv: [["总天数（含首尾）", wd + we + " 天"], ["周一至周五", wd + " 天"], ["周末", we + " 天"]], note: "法定节假日和调休每年由国务院办公厅公布，请按当年安排填入。" };
    } });

  add({ cat: "date", id: "weekday", name: "星期几查询", desc: "任意日期是星期几、第几周、当年第几天", kw: "星期 周数",
    fields: [{ k: "d", l: "日期", t: "date", v: "today" }],
    run: function (v) {
      var d = D(v.d), doy = dayDiff(new Date(d.getFullYear(), 0, 1), d) + 1;
      var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), dn = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dn);
      var wk = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
      var leap = new Date(d.getFullYear(), 1, 29).getMonth() === 1;
      return { big: [iso(d), WK[d.getDay()]], kv: [["当年第几天", doy + " 天"], ["ISO 周数", "第 " + wk + " 周"], ["当年剩余", (leap ? 366 : 365) - doy + " 天"], ["是否闰年", leap ? "是" : "否"]] };
    } });

  add({ cat: "date", id: "countdown", name: "倒计时计算器", desc: "距离某个日期时间还有多少天、小时、分钟", kw: "倒数日 考试 纪念日",
    fields: [{ k: "t", l: "目标时间", t: "dt", v: new Date().getFullYear() + 1 + "-01-01T00:00" }],
    run: function (v) {
      if (!v.t) throw "请选择时间"; var t = new Date(v.t), ms = t - new Date(); if (isNaN(ms)) throw "时间无效";
      var past = ms < 0; ms = Math.abs(ms); var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
      return { big: [past ? "已经过去" : "还剩", d + " 天 " + h + " 小时 " + m + " 分"], kv: [["合计小时", f(ms / 36e5, 1)], ["合计分钟", f(ms / 6e4, 0)], ["目标是", WK[t.getDay()]]] };
    } });

  add({ cat: "date", id: "timestamp", name: "时间戳转换", desc: "Unix 时间戳（秒 / 毫秒）与北京时间互转", kw: "unix timestamp 时间戳",
    fields: [{ k: "m", l: "方向", t: "sel", o: ["时间戳 → 日期", "日期 → 时间戳"] },
      { k: "s", l: "时间戳", t: "text", v: String(Math.floor(Date.now() / 1000)), show: function (v) { return v.m !== "日期 → 时间戳"; } },
      { k: "d", l: "北京时间", t: "dt", v: (function () { var d = new Date(Date.now() + 8 * 36e5); return d.toISOString().slice(0, 16); })(), show: function (v) { return v.m === "日期 → 时间戳"; } }],
    run: function (v) {
      function bj(ms) { var d = new Date(ms + 8 * 36e5); return d.toISOString().replace("T", " ").slice(0, 19); }
      if (v.m === "日期 → 时间戳") { if (!v.d) throw "请选择时间"; var p = v.d.split(/[-T:]/).map(Number), ms = Date.UTC(p[0], p[1] - 1, p[2], p[3] - 8, p[4] || 0); return { big: ["秒级时间戳", String(ms / 1000)], kv: [["毫秒级", String(ms)]] }; }
      var s = String(v.s).trim(); if (!/^-?\d+$/.test(s)) throw "请输入整数时间戳"; var n = Number(s), ms2 = s.replace("-", "").length > 11 ? n : n * 1000;
      return { big: ["北京时间（UTC+8）", bj(ms2)], kv: [["UTC", new Date(ms2).toISOString().replace("T", " ").slice(0, 19)], ["识别为", ms2 === n ? "毫秒" : "秒"]] };
    } });

  /* ======================= 生活实用 ======================= */
  add({ cat: "life", id: "aa-split", name: "AA 制分账计算器", desc: "聚餐出游谁垫付了多少，算出谁该转给谁", kw: "分账 平摊 聚餐",
    fields: [{ k: "p", l: "每个人垫付的金额", t: "list", cols: [{ k: "n", l: "姓名", t: "text", nv: "" }, { k: "a", l: "垫付（元）", nv: "" }], v: [["小明", 300], ["小红", 0], ["小刚", 120]] }],
    run: function (v) {
      var ps = v.p.filter(function (r) { return String(r[0]).trim() || ok(r[1]); }).map(function (r, i) { return { n: String(r[0]).trim() || "第" + (i + 1) + "人", a: ok(r[1]) ? r[1] : 0 }; });
      if (ps.length < 2) throw "至少需要 2 个人";
      var tot = ps.reduce(function (s, p) { return s + p.a; }, 0), each = tot / ps.length;
      var cr = [], db = []; ps.forEach(function (p) { var d = Math.round((p.a - each) * 100) / 100; if (d > 0) cr.push({ n: p.n, d: d }); else if (d < 0) db.push({ n: p.n, d: -d }); });
      var tr = [], i = 0, j = 0;
      while (i < db.length && j < cr.length) { var m = Math.min(db[i].d, cr[j].d); tr.push([db[i].n, cr[j].n, f(m)]); db[i].d -= m; cr[j].d -= m; if (db[i].d < .005) i++; if (cr[j].d < .005) j++; }
      return { big: ["每人应付", y(each)], kv: [["总花费", y(tot)], ["人数", ps.length + " 人"]], table: tr.length ? { h: ["谁", "转给", "金额（元）"], r: tr } : null, note: tr.length ? "" : "已经平了，不用转账。" };
    } });

  add({ cat: "life", id: "discount", name: "打折 / 满减计算器", desc: "折扣价、满减到手价、实际折扣率对比", kw: "优惠 满减 折扣",
    fields: [{ k: "p", l: "原价", u: "元", v: 399 }, { k: "d", l: "折扣（如 8.5 折填 8.5，不打折填 10）", u: "折", v: 8.5 }, { k: "t", l: "满减门槛", u: "元", v: 300 }, { k: "c", l: "减", u: "元", v: 40 }],
    run: function (v) {
      pos(v.p, v.d); need(v.t, v.c);
      var after = v.p * v.d / 10, times = v.t > 0 ? Math.floor(after / v.t) : 0, fin = after - times * v.c;
      return { big: ["到手价", y(fin)], kv: [["折后价", y(after)], ["满减", times ? "减 " + y(times * v.c) + "（" + times + " 次）" : "未达门槛"], ["共省", y(v.p - fin)], ["实际折扣", f(fin / v.p * 10, 2) + " 折"]], note: times ? "" : "还差 " + y(v.t - after) + " 可用满减。" };
    } });

  add({ cat: "life", id: "electricity", name: "电费计算器", desc: "电器功率 × 使用时长，算每天每月电费", kw: "耗电 功率 空调",
    fields: [{ k: "w", l: "功率", u: "W", v: 1500 }, { k: "h", l: "每天使用", u: "小时", v: 8 }, { k: "p", l: "电价", u: "元/度", v: 0.56 }, { k: "n", l: "数量", u: "台", v: 1 }],
    run: function (v) { pos(v.w, v.h, v.p); var n = v.n > 0 ? v.n : 1, kwh = v.w / 1000 * v.h * n; return { big: ["每月电费（30 天）", y(kwh * 30 * v.p)], kv: [["每天耗电", f(kwh) + " 度"], ["每天电费", y(kwh * v.p)], ["每年电费", y(kwh * 365 * v.p)]] }; } });

  add({ cat: "life", id: "tiered-power", name: "阶梯电价计算器", desc: "按年度三档阶梯电价计算居民电费", kw: "阶梯电价 居民用电",
    fields: [{ k: "u", l: "用电量", u: "度", v: 3000 }, { k: "t1", l: "第一档上限", u: "度", v: 2160 }, { k: "t2", l: "第二档上限", u: "度", v: 4200 }, { k: "p1", l: "第一档电价", u: "元", v: 0.5224 }, { k: "p2", l: "第二档电价", u: "元", v: 0.5724 }, { k: "p3", l: "第三档电价", u: "元", v: 0.8224 }],
    run: function (v) {
      need(v.u, v.t1, v.t2, v.p1, v.p2, v.p3);
      var a = Math.min(v.u, v.t1), b = Math.max(Math.min(v.u, v.t2) - v.t1, 0), c = Math.max(v.u - v.t2, 0), cost = a * v.p1 + b * v.p2 + c * v.p3;
      return { big: ["电费", y(cost)], table: { h: ["档位", "电量（度）", "金额（元）"], r: [["第一档", f(a, 0), f(a * v.p1)], ["第二档", f(b, 0), f(b * v.p2)], ["第三档", f(c, 0), f(c * v.p3)]] }, kv: [["平均电价", f(v.u ? cost / v.u : 0, 4) + " 元/度"]], note: "默认值为常见年度阶梯示例，各省档位和电价不同，请按当地标准修改。" };
    } });

  add({ cat: "life", id: "hourly-wage", name: "时薪计算器", desc: "月薪 / 年薪换算成时薪、日薪，含加班费", kw: "时薪 日薪 加班",
    fields: [{ k: "m", l: "月薪", u: "元", v: 10000 }, { k: "d", l: "每月工作日", u: "天", v: 21.75 }, { k: "h", l: "每天工作时长", u: "小时", v: 8 }],
    run: function (v) {
      pos(v.m, v.d, v.h); var day = v.m / v.d, hr = day / v.h;
      return { big: ["时薪", y(hr)], kv: [["日薪", y(day)], ["年薪", y(v.m * 12)], ["工作日加班（1.5 倍）/时", y(hr * 1.5)], ["休息日加班（2 倍）/时", y(hr * 2)], ["法定假日加班（3 倍）/时", y(hr * 3)]], note: "法定月计薪天数为 21.75 天。" };
    } });

  add({ cat: "life", id: "unit-price", name: "单价比较计算器", desc: "大包装还是小包装更划算，按每单位价格比较", kw: "性价比 超市",
    fields: [{ k: "it", l: "商品", t: "list", cols: [{ k: "n", l: "名称", t: "text", nv: "" }, { k: "p", l: "价格", nv: "" }, { k: "q", l: "容量/数量", nv: "" }], v: [["小瓶", 5.9, 500], ["大瓶", 15.9, 1500]] }],
    run: function (v) {
      var r = v.it.filter(function (x) { return ok(x[1]) && ok(x[2]) && x[2] > 0; }).map(function (x, i) { return { n: x[0] || "商品" + (i + 1), u: x[1] / x[2], p: x[1], q: x[2] }; });
      if (!r.length) throw "请至少填一个商品的价格和容量"; var best = r.reduce(function (a, b) { return b.u < a.u ? b : a; });
      return { big: ["最划算", best.n], table: { h: ["商品", "单价（元/单位）", "每 100 单位"], r: r.map(function (x) { return [x.n, g(x.u, 4), f(x.u * 100)]; }) } };
    } });

  /* ======================= 教育学业 ======================= */
  var GP = {
    "标准 4.0（90+ = 4）": function (s) { return s >= 90 ? 4 : s >= 80 ? 3 : s >= 70 ? 2 : s >= 60 ? 1 : 0; },
    "北大 4.0": function (s) { return s >= 60 ? 4 - 3 * (100 - s) * (100 - s) / 1600 : 0; },
    "改进 4.0（85+ = 4）": function (s) { return s >= 85 ? 4 : s >= 75 ? 3 : s >= 60 ? 2 : 0; },
    "5.0 制（分数 ÷ 10 − 5）": function (s) { return s >= 60 ? s / 10 - 5 : 0; }
  };
  add({ cat: "edu", id: "gpa", name: "GPA 计算器", desc: "按学分加权算平均绩点，支持多种 4.0 / 5.0 算法", kw: "绩点 学分",
    fields: [{ k: "m", l: "算法", t: "sel", drop: true, o: Object.keys(GP) },
      { k: "c", l: "课程", t: "list", cols: [{ k: "s", l: "成绩", nv: "" }, { k: "c", l: "学分", nv: "" }], v: [[92, 4], [85, 3], [78, 2], [88, 3]] }],
    run: function (v) {
      var fn = GP[v.m], tc = 0, tp = 0, ts = 0, rows = [];
      v.c.forEach(function (r, i) { if (!ok(r[0]) || !ok(r[1])) return; var gp = fn(r[0]); tc += r[1]; tp += gp * r[1]; ts += r[0] * r[1]; rows.push(["第 " + (i + 1) + " 门", r[0], r[1], f(gp, 2)]); });
      if (!tc) throw "请填写成绩和学分";
      return { big: ["平均绩点 GPA", f(tp / tc, 2)], kv: [["加权平均分", f(ts / tc, 2)], ["总学分", g(tc)], ["总学分绩点", f(tp, 2)]], table: { h: ["课程", "成绩", "学分", "绩点"], r: rows } };
    } });

  add({ cat: "edu", id: "weighted-grade", name: "加权平均分计算器", desc: "按学分或占比加权，对照算术平均", kw: "加权 平均分 总评",
    fields: [{ k: "c", l: "项目", t: "list", cols: [{ k: "s", l: "分数", nv: "" }, { k: "w", l: "权重（学分或 %）", nv: "" }], v: [[85, 30], [90, 30], [78, 40]] }],
    run: function (v) {
      var tw = 0, ts = 0, n = 0, sum = 0;
      v.c.forEach(function (r) { if (ok(r[0]) && ok(r[1])) { tw += r[1]; ts += r[0] * r[1]; n++; sum += r[0]; } });
      if (!tw) throw "请填写分数和权重";
      return { big: ["加权平均分", f(ts / tw, 2)], kv: [["算术平均", f(sum / n, 2)], ["权重合计", g(tw)]] };
    } });

  add({ cat: "edu", id: "cet-score", name: "四六级估分计算器", desc: "按各题型答对数估算 710 分制总分", kw: "四级 六级 cet 估分",
    fields: [{ k: "t", l: "考试", t: "sel", o: ["四级", "六级"] },
      { k: "w", l: "写作（满分 15）", u: "分", v: 9 }, { k: "l1", l: "听力 · 7.1 分/题的答对数", u: "题", v: 10, hint: "四级：短篇新闻 7 题 + 长对话 8 题；六级：长对话 8 题 + 短文 7 题" },
      { k: "l2", l: "听力 · 14.2 分/题的答对数（共 10 题）", u: "题", v: 6 },
      { k: "r1", l: "选词填空答对（共 10 题，3.55 分/题）", u: "题", v: 6 }, { k: "r2", l: "长篇阅读答对（共 10 题，7.1 分/题）", u: "题", v: 6 },
      { k: "r3", l: "仔细阅读答对（共 10 题，14.2 分/题）", u: "题", v: 6 }, { k: "tr", l: "翻译（满分 15）", u: "分", v: 9 }],
    run: function (v) {
      need(v.w, v.l1, v.l2, v.r1, v.r2, v.r3, v.tr);
      if (v.l1 > 15 || v.l2 > 10 || v.r1 > 10 || v.r2 > 10 || v.r3 > 10 || v.w > 15 || v.tr > 15) throw "答对题数或分数超出范围";
      var L0 = v.l1 * 7.1 + v.l2 * 14.2, R = v.r1 * 3.55 + v.r2 * 7.1 + v.r3 * 14.2, W = v.w / 15 * 106.5 + v.tr / 15 * 106.5, tot = L0 + R + W;
      return { big: ["估算总分", f(tot, 0) + " / 710"], tag: tot >= 425 ? "过 425 线" : "未到 425", kv: [["听力", f(L0, 1) + " / 248.5"], ["阅读", f(R, 1) + " / 248.5"], ["写作与翻译", f(W, 1) + " / 213"]], note: "官方成绩为常模参照的等值分，此处按原始分比例估算，仅供参考。" };
    } });

  add({ cat: "edu", id: "final-needed", name: "期末需要考多少分", desc: "已知平时成绩和占比，算期末至少要考几分", kw: "期末 总评 及格",
    fields: [{ k: "u", l: "平时成绩", u: "分", v: 80 }, { k: "w", l: "期末占比", u: "%", v: 60 }, { k: "g", l: "目标总评", u: "分", v: 60 }],
    run: function (v) {
      need(v.u, v.w, v.g); if (v.w <= 0 || v.w > 100) throw "期末占比需在 0–100% 之间";
      var need2 = (v.g - v.u * (1 - v.w / 100)) / (v.w / 100);
      return { big: ["期末至少要考", need2 <= 0 ? "0 分就够" : f(need2, 1) + " 分"], tag: need2 > 100 ? "满分也达不到" : null, kv: [["期末考 100 分时总评", f(v.u * (1 - v.w / 100) + v.w, 1)]] };
    } });

  add({ cat: "edu", id: "study-plan", name: "备考天数规划", desc: "距考试还有几天，每天要学多少页 / 题", kw: "复习 计划 考研",
    fields: [{ k: "d", l: "考试日期", t: "date", v: function () { var d = new Date(); d.setDate(d.getDate() + 60); return iso(d); } }, { k: "t", l: "总任务量（页 / 题 / 小时）", v: 1200 }, { k: "r", l: "每周休息", u: "天", v: 1 }],
    run: function (v) {
      var d = D(v.d), n = dayDiff(new Date(), d); if (n <= 0) throw "考试日期需在今天之后"; pos(v.t); need(v.r);
      var study = Math.max(Math.round(n * (7 - v.r) / 7), 1);
      return { big: ["每天需完成", f(v.t / study, 1)], kv: [["距考试", n + " 天"], ["可学习天数", study + " 天"]] };
    } });

  /* ======================= 商业财税 ======================= */
  add({ cat: "biz", id: "vat", name: "增值税 / 价税分离", desc: "含税价、不含税价、税额互算", kw: "增值税 含税 不含税 开票",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["含税价", "不含税价"] }, { k: "a", l: "金额", u: "元", v: 11300 },
      { k: "r", l: "税率", t: "sel", drop: true, o: [[13, "13%（货物、加工修理）"], [9, "9%（交通、建筑、不动产、农产品）"], [6, "6%（现代服务、金融）"], [3, "3%（小规模纳税人）"], [1, "1%（小规模减按）"], [5, "5%（简易计税不动产）"], [0, "0%"]], v: 13 }],
    run: function (v) {
      need(v.a); var ex = v.m === "含税价" ? v.a / (1 + v.r / 100) : v.a, inc = ex * (1 + v.r / 100);
      return { big: ["税额", y(inc - ex)], kv: [["不含税金额", y(ex)], ["价税合计", y(inc)]] };
    } });

  add({ cat: "biz", id: "margin", name: "毛利率 / 加价率", desc: "成本、售价、毛利率、加价率互算定价", kw: "利润 定价 毛利",
    fields: [{ k: "c", l: "成本", u: "元", v: 60 }, { k: "m", l: "已知", t: "sel", o: ["售价", "目标毛利率", "加价率"] }, { k: "x", l: "数值（售价填元，比率填 %）", v: 100 }],
    run: function (v) {
      pos(v.c); need(v.x); var p;
      if (v.m === "售价") p = v.x; else if (v.m === "目标毛利率") { if (v.x >= 100) throw "毛利率需小于 100%"; p = v.c / (1 - v.x / 100); } else p = v.c * (1 + v.x / 100);
      return { big: ["售价", y(p)], kv: [["毛利", y(p - v.c)], ["毛利率", pct((p - v.c) / p)], ["加价率", pct((p - v.c) / v.c)]] };
    } });

  add({ cat: "biz", id: "break-even", name: "盈亏平衡计算器", desc: "固定成本、单价、单位变动成本，算保本销量", kw: "保本 盈亏",
    fields: [{ k: "f", l: "每月固定成本", u: "元", v: 30000 }, { k: "p", l: "单价", u: "元", v: 50 }, { k: "c", l: "单位变动成本", u: "元", v: 20 }, { k: "t", l: "目标利润", u: "元", v: 10000 }],
    run: function (v) {
      need(v.f, v.p, v.c, v.t); var m = v.p - v.c; if (m <= 0) throw "单价需高于单位变动成本";
      return { big: ["保本销量", f(Math.ceil(v.f / m), 0) + " 件"], kv: [["保本销售额", y(Math.ceil(v.f / m) * v.p)], ["单位边际贡献", y(m)], ["达成目标利润需卖", f(Math.ceil((v.f + v.t) / m), 0) + " 件"]] };
    } });

  add({ cat: "biz", id: "biz-income-tax", name: "经营所得个税", desc: "个体户 / 个人独资经营所得 5%–35% 五级累进", kw: "个体户 经营所得",
    fields: [{ k: "i", l: "全年收入总额", u: "元", v: 300000 }, { k: "c", l: "成本费用及损失", u: "元", v: 150000 }, { k: "d", l: "可扣除（无综合所得时 6 万 + 专项等）", u: "元", v: 60000 }],
    run: function (v) {
      need(v.i, v.c, v.d); var t = v.i - v.c - v.d, r = taxBy(t, BIZ), tax = r[0];
      var relief = t <= 2e6 ? tax * 0.5 : 0;
      return { big: ["应纳税额（减半后）", y(tax - relief)], kv: [["应纳税所得额", y(Math.max(t, 0))], ["适用税率", pct(r[1], 0)], ["按税率计算", y(tax)], ["个体户减半优惠", y(relief)]], note: "个体工商户年应纳税所得额不超过 200 万元的部分减半征收，政策执行至 2027 年底；个人独资、合伙企业不适用该减半。" };
    } });

  add({ cat: "biz", id: "annualized", name: "年化收益率计算器", desc: "持有期收益换算成年化收益率（单利 / 复利）", kw: "年化 理财 收益率",
    fields: [{ k: "p", l: "投入本金", u: "元", v: 10000 }, { k: "e", l: "到期金额", u: "元", v: 10350 }, { k: "d", l: "持有天数", u: "天", v: 180 }],
    run: function (v) {
      pos(v.p, v.e, v.d); var r = v.e / v.p - 1;
      return { big: ["年化收益率（单利）", pct(r * 365 / v.d)], kv: [["持有期收益率", pct(r)], ["年化（复利）", pct(Math.pow(v.e / v.p, 365 / v.d) - 1)], ["收益", y(v.e - v.p)], ["日均收益", y((v.e - v.p) / v.d)]] };
    } });

  /* ======================= 工程建筑 ======================= */
  add({ cat: "build", id: "tile-quantity", name: "瓷砖用量计算器", desc: "按铺贴面积和砖规格算片数、箱数和总价", kw: "地砖 墙砖",
    fields: [{ k: "a", l: "铺贴面积", u: "㎡", v: 20 }, { k: "l", l: "砖长", u: "mm", v: 800 }, { k: "w", l: "砖宽", u: "mm", v: 800 }, { k: "lo", l: "损耗", u: "%", v: 5 }, { k: "b", l: "每箱片数", u: "片", v: 3 }, { k: "p", l: "单价（每片）", u: "元", v: 60 }],
    run: function (v) {
      pos(v.a, v.l, v.w); need(v.lo, v.p); var per = v.l * v.w / 1e6, n = Math.ceil(v.a / per * (1 + v.lo / 100)), bx = v.b > 0 ? Math.ceil(n / v.b) : 0;
      return { big: ["需要瓷砖", n + " 片"], kv: [["约合箱数", bx ? bx + " 箱" : "—"], ["单片面积", g(per, 4) + " ㎡"], ["约总价", y(n * v.p)]] };
    } });

  add({ cat: "build", id: "flooring", name: "地板用量计算器", desc: "按房间面积和地板规格算平米、片数、箱数", kw: "木地板 复合地板",
    fields: [{ k: "l", l: "房间长", u: "m", v: 4.5 }, { k: "w", l: "房间宽", u: "m", v: 3.6 }, { k: "pl", l: "地板长", u: "mm", v: 1215 }, { k: "pw", l: "地板宽", u: "mm", v: 195 }, { k: "lo", l: "损耗", u: "%", v: 5 }, { k: "b", l: "每箱片数", u: "片", v: 8 }, { k: "p", l: "单价（每㎡）", u: "元", v: 120 }],
    run: function (v) {
      pos(v.l, v.w, v.pl, v.pw); need(v.lo, v.p); var a = v.l * v.w, per = v.pl * v.pw / 1e6, n = Math.ceil(a * (1 + v.lo / 100) / per), bx = v.b > 0 ? Math.ceil(n / v.b) : 0;
      return { big: ["需要地板", n + " 片"], kv: [["房间面积", f(a) + " ㎡"], ["箱数", bx ? bx + " 箱（" + f(bx * v.b * per) + " ㎡）" : "—"], ["约总价", y((bx ? bx * v.b * per : n * per) * v.p)]] };
    } });

  add({ cat: "build", id: "paint", name: "墙漆用量计算器", desc: "按房间尺寸扣除门窗，算乳胶漆升数和桶数", kw: "乳胶漆 刷墙",
    fields: [{ k: "l", l: "房间长", u: "m", v: 4.5 }, { k: "w", l: "房间宽", u: "m", v: 3.6 }, { k: "h", l: "层高", u: "m", v: 2.7 }, { k: "dw", l: "门窗面积合计", u: "㎡", v: 4 }, { k: "c", l: "含天花板", t: "sel", o: ["是", "否"] }, { k: "n", l: "涂刷遍数", u: "遍", v: 2 }, { k: "r", l: "涂布率", u: "㎡/L", v: 10 }, { k: "b", l: "每桶容量", u: "L", v: 5 }],
    run: function (v) {
      pos(v.l, v.w, v.h, v.n, v.r); need(v.dw); var a = 2 * (v.l + v.w) * v.h - v.dw + (v.c === "是" ? v.l * v.w : 0), L0 = a * v.n / v.r;
      return { big: ["需要墙漆", f(L0, 1) + " L"], kv: [["涂刷面积", f(a) + " ㎡"], ["桶数", v.b > 0 ? Math.ceil(L0 / v.b) + " 桶" : "—"]], note: "涂布率以产品说明为准，深色墙面或新墙建议多备 10%。" };
    } });

  add({ cat: "build", id: "wallpaper", name: "墙纸用量计算器", desc: "按墙面周长和墙纸规格算需要几卷", kw: "壁纸",
    fields: [{ k: "p", l: "墙面周长（扣除门窗宽度）", u: "m", v: 14 }, { k: "h", l: "层高", u: "m", v: 2.7 }, { k: "w", l: "墙纸宽", u: "m", v: 0.53 }, { k: "l", l: "每卷长", u: "m", v: 10 }, { k: "r", l: "花距（对花损耗）", u: "cm", v: 0 }],
    run: function (v) {
      pos(v.p, v.h, v.w, v.l); need(v.r); var strip = v.h + v.r / 100 + 0.1, per = Math.floor(v.l / strip); if (per < 1) throw "层高超过单卷长度";
      var strips = Math.ceil(v.p / v.w);
      return { big: ["需要墙纸", Math.ceil(strips / per) + " 卷"], kv: [["总幅数", strips + " 幅"], ["每卷可裁", per + " 幅"]] };
    } });

  add({ cat: "build", id: "concrete", name: "混凝土方量计算器", desc: "板、梁、圆柱的混凝土立方数与水泥砂石用量", kw: "混凝土 方量 水泥",
    fields: [{ k: "s", l: "形状", t: "sel", o: ["长方体（板 / 梁）", "圆柱"] }, { k: "a", l: "长 / 直径", u: "m", v: 5 }, { k: "b", l: "宽（圆柱不填）", u: "m", v: 4, show: function (v) { return v.s !== "圆柱"; } }, { k: "h", l: "厚度 / 高度", u: "m", v: 0.12 }, { k: "n", l: "数量", u: "个", v: 1 }],
    run: function (v) {
      pos(v.a, v.h); var n = v.n > 0 ? v.n : 1, vol = (v.s === "圆柱" ? Math.PI * v.a * v.a / 4 * v.h : (pos(v.b), v.a * v.b * v.h)) * n;
      return { big: ["混凝土", f(vol, 3) + " m³"], kv: [["C30 水泥约", f(vol * 380, 0) + " kg"], ["砂约", f(vol * 0.48, 2) + " m³"], ["石子约", f(vol * 0.86, 2) + " m³"]], note: "材料用量按常见 C30 配合比粗估，实际以配合比设计为准。" };
    } });

  /* ======================= 科学工程 ======================= */
  add({ cat: "science", id: "ohms-law", name: "欧姆定律计算器", desc: "电压、电流、电阻、功率任意两项互求", kw: "电压 电流 电阻",
    fields: [{ k: "m", l: "已知", t: "sel", drop: true, o: ["电压 + 电流", "电压 + 电阻", "电流 + 电阻", "功率 + 电压", "功率 + 电流"] }, { k: "a", l: "第一个值（V / A / W）", v: 12 }, { k: "b", l: "第二个值（A / Ω / V）", v: 2 }],
    run: function (v) {
      pos(v.a, v.b); var U, I, R, P, a = v.a, b = v.b;
      switch (v.m) { case "电压 + 电流": U = a; I = b; break; case "电压 + 电阻": U = a; I = a / b; break; case "电流 + 电阻": I = a; U = a * b; break; case "功率 + 电压": U = b; I = a / b; break; default: I = b; U = a / b; }
      R = U / I; P = U * I;
      return { kv: [["电压 U", g(U, 4) + " V"], ["电流 I", g(I, 4) + " A"], ["电阻 R", g(R, 4) + " Ω"], ["功率 P", g(P, 4) + " W"]] };
    } });

  add({ cat: "science", id: "resistor-network", name: "电阻串并联计算器", desc: "多个电阻（或电容）串联、并联等效值", kw: "电阻 电容 并联 串联",
    fields: [{ k: "t", l: "元件", t: "sel", o: ["电阻", "电容"] }, { k: "s", l: "各元件数值（逗号分隔，同一单位）", t: "text", v: "100, 220, 470" }],
    run: function (v) {
      var a = String(v.s).split(/[\s,，]+/).filter(Boolean).map(Number); if (!a.length || a.some(function (x) { return !(x > 0); })) throw "请输入正数";
      var sum = a.reduce(function (x, y2) { return x + y2; }, 0), inv = 1 / a.reduce(function (x, y2) { return x + 1 / y2; }, 0);
      var res = v.t === "电阻";
      return { kv: [["串联等效", g(res ? sum : inv, 6)], ["并联等效", g(res ? inv : sum, 6)]], note: res ? "电阻：串联相加，并联取倒数和的倒数。" : "电容：并联相加，串联取倒数和的倒数。" };
    } });

  add({ cat: "science", id: "electric-power", name: "三相 / 单相功率计算", desc: "直流、单相、三相电路功率与电流互求", kw: "三相电 功率因数",
    fields: [{ k: "t", l: "电路", t: "sel", o: ["直流", "单相交流", "三相交流"] }, { k: "u", l: "电压（三相填线电压）", u: "V", v: 380 }, { k: "i", l: "电流", u: "A", v: 10 }, { k: "pf", l: "功率因数 cosφ", v: 0.85, show: function (v) { return v.t !== "直流"; } }],
    run: function (v) {
      pos(v.u, v.i); var pf = v.t === "直流" ? 1 : (ok(v.pf) ? v.pf : 1), k = v.t === "三相交流" ? Math.sqrt(3) : 1, P = k * v.u * v.i * pf, S = k * v.u * v.i;
      return { big: ["有功功率", g(P / 1000, 3) + " kW"], kv: [["视在功率", g(S / 1000, 3) + " kVA"], ["每小时耗电", g(P / 1000, 3) + " 度"]] };
    } });

  add({ cat: "science", id: "free-fall", name: "自由落体计算器", desc: "下落高度、时间、落地速度互求", kw: "重力 物理",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["高度", "时间"] }, { k: "x", l: "数值（米 / 秒）", v: 20 }, { k: "g", l: "重力加速度", u: "m/s²", v: 9.8 }],
    run: function (v) {
      pos(v.x, v.g); var t = v.m === "高度" ? Math.sqrt(2 * v.x / v.g) : v.x, h = v.g * t * t / 2;
      return { kv: [["高度", g(h, 4) + " m"], ["时间", g(t, 4) + " s"], ["落地速度", g(v.g * t, 4) + " m/s（" + g(v.g * t * 3.6, 3) + " km/h）"]], note: "忽略空气阻力。" };
    } });

  add({ cat: "science", id: "kinetic", name: "动能 / 势能 / 动量", desc: "按质量、速度、高度计算动能、重力势能和动量", kw: "能量 动量",
    fields: [{ k: "m", l: "质量", u: "kg", v: 1500 }, { k: "v", l: "速度", u: "km/h", v: 60 }, { k: "h", l: "高度", u: "m", v: 0 }],
    run: function (v) {
      pos(v.m); need(v.v, v.h); var s = v.v / 3.6, ek = v.m * s * s / 2;
      return { big: ["动能", g(ek / 1000, 4) + " kJ"], kv: [["重力势能", g(v.m * 9.8 * v.h / 1000, 4) + " kJ"], ["动量", g(v.m * s, 4) + " kg·m/s"], ["速度", g(s, 4) + " m/s"]] };
    } });

  add({ cat: "science", id: "density", name: "密度 / 质量 / 体积", desc: "ρ = m / V，任意两项求第三项，含常见材料密度", kw: "密度",
    fields: [{ k: "t", l: "求", t: "sel", o: ["质量", "密度", "体积"] }, { k: "a", l: "质量（kg）或密度（kg/m³）", v: 7850 }, { k: "b", l: "体积（m³）或质量（kg）", v: 0.01 }],
    run: function (v) {
      pos(v.a, v.b); var r;
      if (v.t === "密度") r = ["密度", g(v.a / v.b, 6) + " kg/m³（第一项为质量、第二项为体积）"];
      else if (v.t === "质量") r = ["质量", g(v.a * v.b, 6) + " kg（第一项为密度、第二项为体积）"];
      else r = ["体积", g(v.b / v.a, 6) + " m³（第一项为密度、第二项为质量）"];
      return { big: r, table: { h: ["常见材料", "密度 kg/m³"], r: [["水", "1,000"], ["钢", "7,850"], ["铝", "2,700"], ["铜", "8,960"], ["混凝土", "2,400"], ["空气（20℃）", "1.205"]] } };
    } });

  window.CX = {
    cats: { finance: "财务理财", property: "房产置业", auto: "汽车出行", health: "健康健身", math: "数学计算", convert: "单位换算", date: "日期时间", life: "生活实用", edu: "教育学业", biz: "商业财税", build: "工程建筑", science: "科学工程" },
    list: L
  };
})();
