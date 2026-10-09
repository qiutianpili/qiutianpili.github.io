/* Calculator registry, batch 3 (2026-10). Uses helpers exported by calcs.js. */
(function () {
  "use strict";
  var H = window.CX.h, add = H.add, ok = H.ok, need = H.need, pos = H.pos, f = H.f, g = H.g, y = H.y, wy = H.wy, pct = H.pct,
    D = H.D, iso = H.iso, WK = H.WK, dayDiff = H.dayDiff, addMonths = H.addMonths, ymd = H.ymd, pmt = H.pmt, taxBy = H.taxBy, IIT = H.IIT, IIT_M = H.IIT_M, unit = H.unit;
  function nums(s) { var a = String(s).split(/[\s,，;；]+/).filter(Boolean).map(Number); if (!a.length || a.some(isNaN)) throw "请输入数字，用逗号或空格分隔"; return a; }
  function hm(min) { min = Math.round(min); return Math.floor(min / 60) + " 小时 " + (min % 60) + " 分钟"; }
  function today() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }

  /* ======================= 财务理财 ======================= */
  add({ cat: "finance", id: "fund-sip", name: "基金定投计算器", desc: "每月定投金额、年化收益和年限，算期末资产和收益", kw: "定投 基金 指数",
    fields: [{ k: "m", l: "每月定投", u: "元", v: 1000 }, { k: "r", l: "预期年化收益", u: "%", v: 6 }, { k: "n", l: "定投年限", u: "年", v: 10 }, { k: "s", l: "初始投入", u: "元", v: 0 }],
    run: function (v) {
      pos(v.m, v.n); need(v.r, v.s); var r = v.r / 1200, n = Math.round(v.n * 12), bal = v.s;
      for (var i = 0; i < n; i++) bal = (bal + v.m) * (1 + r);
      var inv = v.s + v.m * n;
      return { big: ["期末资产", wy(bal)], kv: [["累计投入", wy(inv)], ["投资收益", wy(bal - inv)], ["总收益率", pct(bal / inv - 1)]], note: "按每月初扣款、月复利估算，实际收益随市场波动。" };
    } });

  add({ cat: "finance", id: "fund-fee", name: "基金费率计算器", desc: "申购费、赎回费、管理托管费，算持有成本", kw: "申购费 赎回费 管理费 c类 a类",
    fields: [{ k: "a", l: "投入金额", u: "元", v: 10000 }, { k: "b", l: "申购费率（打折后）", u: "%", v: 0.12 }, { k: "m", l: "管理费 + 托管费 + 销售服务费（年）", u: "%", v: 1.2 }, { k: "h", l: "持有时间", u: "年", v: 2 }, { k: "s", l: "赎回费率", u: "%", v: 0 }],
    run: function (v) {
      pos(v.a, v.h); need(v.b, v.m, v.s); var buy = v.a - v.a / (1 + v.b / 100), run = (v.a - buy) * v.m / 100 * v.h, sell = (v.a - buy - run) * v.s / 100, tot = buy + run + sell;
      return { big: ["总费用", y(tot)], kv: [["申购费（外扣法）", y(buy)], ["持有期运作费", y(run)], ["赎回费", y(sell)], ["年化费用率", pct(tot / v.a / v.h)]], note: "运作费已每日从净值中扣除，不另行收取。A 类有申购费、C 类有销售服务费，持有超 1 年通常 A 类更划算。" };
    } });

  add({ cat: "finance", id: "annuity-pv", name: "年金现值 / 终值计算器", desc: "每期等额收付的现值、终值；算一笔钱能领多少年", kw: "年金 现值 终值 pv fv",
    fields: [{ k: "p", l: "每期金额", u: "元", v: 5000 }, { k: "r", l: "每期利率", u: "%", v: 0.3 }, { k: "n", l: "期数", v: 120 }, { k: "t", l: "收付时点", t: "sel", o: ["期末（普通年金）", "期初（预付年金）"] }],
    run: function (v) {
      pos(v.p, v.n); need(v.r); var r = v.r / 100, k = v.t[0] === "期初" ? 1 + r : 1;
      var pv = r ? v.p * (1 - Math.pow(1 + r, -v.n)) / r * k : v.p * v.n, fv = r ? v.p * (Math.pow(1 + r, v.n) - 1) / r * k : v.p * v.n;
      return { big: ["现值 PV", wy(pv)], kv: [["终值 FV", wy(fv)], ["累计收付", wy(v.p * v.n)]] };
    } });

  add({ cat: "finance", id: "bond-yield", name: "债券收益率计算器", desc: "按买入价、票面利率、剩余年限算当期收益率和到期收益率", kw: "债券 ytm 国债",
    fields: [{ k: "pr", l: "买入价（每百元面值）", u: "元", v: 98 }, { k: "c", l: "票面利率", u: "%", v: 3 }, { k: "n", l: "剩余年限", u: "年", v: 5 }, { k: "fq", l: "付息频率", t: "sel", o: [[1, "每年一次"], [2, "每半年一次"]], v: 1 }],
    run: function (v) {
      pos(v.pr, v.n); need(v.c); var m = v.fq, N = Math.round(v.n * m), cp = v.c / m;
      function price(r) { var s = 0; for (var i = 1; i <= N; i++) s += cp / Math.pow(1 + r, i); return s + 100 / Math.pow(1 + r, N); }
      var lo = -0.5, hi = 1; for (var k = 0; k < 200; k++) { var mid = (lo + hi) / 2; if (price(mid) > v.pr) lo = mid; else hi = mid; }
      var ytm = (lo + hi) / 2 * m;
      return { big: ["到期收益率 YTM", pct(ytm, 3)], kv: [["当期收益率", pct(v.c / v.pr, 3)], ["到期总收益", y((cp * N + 100 - v.pr) * 1) + " / 百元"]] };
    } });

  add({ cat: "finance", id: "credit-min-pay", name: "信用卡最低还款计算器", desc: "只还最低还款额要多付多少利息", kw: "最低还款 循环利息 信用卡",
    fields: [{ k: "b", l: "账单金额", u: "元", v: 10000 }, { k: "p", l: "本期实际还款", u: "元", v: 1000 }, { k: "d", l: "计息天数（消费日到下期账单日）", u: "天", v: 45 }, { k: "r", l: "日利率", u: "‱", v: 5 }],
    run: function (v) {
      pos(v.b); need(v.p, v.d, v.r); if (v.p >= v.b) return { big: ["无循环利息", "已全额还款"] };
      var minPay = v.b * .1, it = (v.b * v.d + (v.b - v.p) * 25) * v.r / 1e4;
      return { big: ["产生利息约", y(it)], kv: [["最低还款额（10%）", y(minPay)], ["剩余未还", y(v.b - v.p)], ["折合年化", pct(v.r / 1e4 * 365, 1)]], note: "多数银行按全部账单金额从记账日起计息（全额罚息），日息万分之五约合年化 18.25%。" };
    } });

  add({ cat: "finance", id: "annual-tax-settlement", name: "个税年度汇算估算", desc: "全年收入、预缴税、专项附加扣除，估算退税还是补税", kw: "汇算清缴 退税 补税 个税",
    fields: [{ k: "s", l: "全年工资薪金（税前）", u: "元", v: 180000 }, { k: "l", l: "全年劳务报酬（税前）", u: "元", v: 20000 }, { k: "ins", l: "全年个人社保公积金", u: "元", v: 30000 }, { k: "sp", l: "全年专项附加扣除", u: "元", v: 36000 }, { k: "pre", l: "全年已预缴个税", u: "元", v: 6000 }],
    run: function (v) {
      need(v.s, v.l, v.ins, v.sp, v.pre); var taxable = v.s + v.l * .8 - 60000 - v.ins - v.sp, t = taxBy(Math.max(taxable, 0), IIT), due = t[0], diff = v.pre - due;
      return { big: [diff >= 0 ? "预计退税" : "预计补税", y(Math.abs(diff))], kv: [["应纳税所得额", y(Math.max(taxable, 0))], ["全年应纳税额", y(due)], ["适用税率", pct(t[1], 0)]], note: "劳务报酬按收入 80% 并入综合所得。补税不超过 400 元或年收入不超过 12 万元可免于补税。" };
    } });

  add({ cat: "finance", id: "gold-invest", name: "黄金投资计算器", desc: "买入金价、克数、卖出价和手续费，算盈亏", kw: "黄金 金价 积存金",
    fields: [{ k: "b", l: "买入价", u: "元/克", v: 760 }, { k: "w", l: "克数", u: "克", v: 20 }, { k: "s", l: "当前 / 卖出价", u: "元/克", v: 820 }, { k: "fee", l: "买卖手续费合计", u: "%", v: 0.5 }],
    run: function (v) { pos(v.b, v.w); need(v.s, v.fee); var cost = v.b * v.w, val = v.s * v.w, fee = (cost + val) * v.fee / 200, pl = val - cost - fee; return { big: [pl >= 0 ? "盈利" : "亏损", y(Math.abs(pl))], kv: [["收益率", pct(pl / cost)], ["保本卖出价", f(v.b * (1 + v.fee / 100), 2) + " 元/克"], ["手续费", y(fee)]], note: "金饰回收通常按大盘价减折旧，工艺费无法收回。" }; } });

  add({ cat: "finance", id: "child-edu-fund", name: "子女教育金计算器", desc: "按学费通胀算上大学时需要多少钱、每月要存多少", kw: "教育金 学费 储蓄",
    fields: [{ k: "c", l: "现在的教育总费用", u: "万元", v: 30 }, { k: "n", l: "距离上大学", u: "年", v: 12 }, { k: "i", l: "教育费用年增长", u: "%", v: 4 }, { k: "r", l: "投资年化收益", u: "%", v: 3 }, { k: "h", l: "已有准备", u: "万元", v: 2 }],
    run: function (v) {
      pos(v.c, v.n); need(v.i, v.r, v.h); var need0 = v.c * 1e4 * Math.pow(1 + v.i / 100, v.n), have = v.h * 1e4 * Math.pow(1 + v.r / 100, v.n), gap = Math.max(need0 - have, 0), r = v.r / 1200, N = v.n * 12;
      var mon = r ? gap * r / (Math.pow(1 + r, N) - 1) : gap / N;
      return { big: ["每月需存", y(mon)], kv: [["届时所需", wy(need0)], ["已有准备届时价值", wy(have)], ["缺口", wy(gap)]] };
    } });

  /* ======================= 房产置业 ======================= */
  add({ cat: "property", id: "housing-fund-loan", name: "公积金贷款额度计算器", desc: "按账户余额倍数和月缴存额估算可贷额度", kw: "公积金 额度 可贷",
    fields: [{ k: "b", l: "本人 + 配偶公积金余额", u: "元", v: 60000 }, { k: "k", l: "余额倍数（当地政策）", v: 15 }, { k: "m", l: "本人 + 配偶月缴存额（两边合计）", u: "元", v: 3000 }, { k: "a", l: "距法定退休剩余", u: "年", v: 30 }, { k: "cap", l: "当地最高额度", u: "万元", v: 120 }, { k: "p", l: "房价", u: "万元", v: 200 }, { k: "d", l: "首付比例", u: "%", v: 20 }],
    run: function (v) {
      pos(v.k, v.cap, v.p); need(v.b, v.m, v.a, v.d); var byBal = v.b * v.k, byDep = v.m / 0.24 * 0.5 * 12 * Math.min(v.a, 30) * 0.7, byPrice = v.p * 1e4 * (1 - v.d / 100), lim = Math.min(byBal, byPrice, v.cap * 1e4);
      return { big: ["估算可贷额度", wy(lim)], kv: [["按余额倍数", wy(byBal)], ["按房价成数", wy(byPrice)], ["当地上限", wy(v.cap * 1e4)], ["按缴存能力参考", wy(byDep)]], note: "各城市公式差异很大（余额倍数、缴存年限、还款能力系数），以当地公积金中心为准。" };
    } });

  add({ cat: "property", id: "property-fee", name: "物业费 / 取暖费计算器", desc: "按建筑面积和单价算每月、每年物业费或采暖费", kw: "物业费 取暖费 暖气费",
    fields: [{ k: "a", l: "建筑面积", u: "㎡", v: 100 }, { k: "p", l: "物业费单价", u: "元/㎡/月", v: 2.5 }, { k: "h", l: "取暖费单价（无则 0）", u: "元/㎡/采暖季", v: 25 }],
    run: function (v) { pos(v.a); need(v.p, v.h); return { big: ["每年物业费", y(v.a * v.p * 12)], kv: [["每月物业费", y(v.a * v.p)], ["每季取暖费", y(v.a * v.h)], ["合计每年", y(v.a * v.p * 12 + v.a * v.h)]] }; } });

  add({ cat: "property", id: "prepay-worth", name: "提前还房贷划算吗", desc: "比较提前还款省下的利息和这笔钱拿去理财的收益", kw: "提前还款 划算",
    fields: [{ k: "r", l: "房贷利率", u: "%", v: 3.1 }, { k: "a", l: "提前还款金额", u: "万元", v: 20 }, { k: "n", l: "剩余年限", u: "年", v: 20 }, { k: "i", l: "稳健理财年化", u: "%", v: 2 }, { k: "tax", l: "房贷利息个税抵扣", t: "sel", o: ["没有", "有（每月 1000 元扣除）"] }],
    run: function (v) {
      pos(v.a, v.n); need(v.r, v.i); var P = v.a * 1e4, save = P * (Math.pow(1 + v.r / 100, v.n) - 1), earn = P * (Math.pow(1 + v.i / 100, v.n) - 1);
      var eff = v.r; return { big: ["更划算", eff > v.i ? "提前还款" : "留着理财"], kv: [["提前还款省下利息（复利口径）", wy(save)], ["同期理财收益", wy(earn)], ["利差", f(v.r - v.i, 2) + " 个百分点"]], note: "只要房贷利率高于你能稳定拿到的收益率，提前还款就是“无风险收益”。但要留足应急金；有房贷利息扣除时，提前还清会失去这项扣除。" };
    } });

  add({ cat: "property", id: "house-area", name: "套内 / 建筑面积换算", desc: "按得房率在套内面积、建筑面积、公摊之间换算", kw: "得房率 公摊 套内面积",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["建筑面积", "套内面积"] }, { k: "a", l: "面积", u: "㎡", v: 100 }, { k: "r", l: "得房率", u: "%", v: 78 }, { k: "p", l: "单价（按建筑面积，可选）", u: "元/㎡", v: 30000 }],
    run: function (v) {
      pos(v.a, v.r); need(v.p); var b = v.m === "建筑面积" ? v.a : v.a / (v.r / 100), i = b * v.r / 100;
      return { big: [v.m === "建筑面积" ? "套内面积" : "建筑面积", f(v.m === "建筑面积" ? i : b, 2) + " ㎡"], kv: [["公摊面积", f(b - i, 2) + " ㎡"], ["套内实际单价", v.p ? y(v.p / (v.r / 100)) + "/㎡" : "—"]], note: "高层得房率约 70%–80%，多层约 85%–90%。" };
    } });

  add({ cat: "property", id: "rate-adjust", name: "房贷利率调整计算器", desc: "LPR 下调或转换后，月供和总利息变化多少", kw: "lpr 降息 存量房贷",
    fields: [{ k: "p", l: "剩余本金", u: "万元", v: 100 }, { k: "n", l: "剩余年限", u: "年", v: 25 }, { k: "a", l: "调整前利率", u: "%", v: 4.2 }, { k: "b", l: "调整后利率", u: "%", v: 3.1 }],
    run: function (v) {
      pos(v.p, v.n); need(v.a, v.b); var P = v.p * 1e4, N = v.n * 12, m1 = pmt(P, v.a / 1200, N), m2 = pmt(P, v.b / 1200, N);
      return { big: ["月供减少", y(m1 - m2)], kv: [["调整前月供", y(m1)], ["调整后月供", y(m2)], ["总利息节省", wy((m1 - m2) * N)]] };
    } });

  add({ cat: "property", id: "move-in-cost", name: "租房入住成本计算器", desc: "押金、首期房租、中介费等搬进去要准备多少钱", kw: "押一付三 中介费 租房",
    fields: [{ k: "r", l: "月租金", u: "元", v: 4000 }, { k: "d", l: "押几个月", v: 1 }, { k: "p", l: "付几个月", v: 3 }, { k: "a", l: "中介费（月租的倍数）", v: 0.5 }, { k: "o", l: "搬家 / 其他", u: "元", v: 800 }],
    run: function (v) { pos(v.r); need(v.d, v.p, v.a, v.o); var tot = v.r * (v.d + v.p + v.a) + v.o; return { big: ["入住需准备", y(tot)], kv: [["押金（可退）", y(v.r * v.d)], ["首期房租", y(v.r * v.p)], ["中介费", y(v.r * v.a)], ["不可退部分", y(v.r * v.a + v.o)]] }; } });

  /* ======================= 汽车出行 ======================= */
  add({ cat: "auto", id: "compulsory-insurance", name: "交强险 / 车船税计算器", desc: "按座位数、出险记录算交强险，按排量算车船税", kw: "交强险 车船税",
    fields: [{ k: "s", l: "车辆", t: "sel", o: [[950, "家用 6 座以下"], [1100, "家用 6 座及以上"]], v: 950 }, { k: "x", l: "出险记录", t: "sel", drop: true, o: [[-0.3, "连续 3 年未出险"], [-0.2, "连续 2 年未出险"], [-0.1, "上年未出险"], [0, "上年 1 次有责（无伤亡）"], [0.1, "上年 2 次及以上有责"], [0.3, "上年有有责死亡事故"]], v: -0.1 }, { k: "e", l: "排量", t: "sel", drop: true, o: [[300, "1.0L 及以下"], [420, "1.0–1.6L"], [480, "1.6–2.0L"], [900, "2.0–2.5L"], [1800, "2.5–3.0L"], [3000, "3.0–4.0L"], [4500, "4.0L 以上"], [0, "纯电 / 插混（免征）"]], v: 420 }],
    run: function (v) { var c = v.s * (1 + v.x); return { big: ["交强险", y(c)], kv: [["车船税（年，取中间值）", y(v.e)], ["合计", y(c + v.e)]], note: "交强险基础 950 / 1100 元，浮动系数各地略有不同。车船税各省在国家区间内自定，此处为常见标准。" }; } });

  add({ cat: "auto", id: "car-loan-monthly", name: "车贷月供计算器", desc: "按车价、首付和期数算月供；对比 0 息贷款的手续费", kw: "车贷 0首付 0利率",
    fields: [{ k: "p", l: "车价", u: "元", v: 150000 }, { k: "d", l: "首付比例", u: "%", v: 30 }, { k: "n", l: "期数", t: "sel", o: [[12, "12 期"], [24, "24 期"], [36, "36 期"], [48, "48 期"], [60, "60 期"]], v: 36 }, { k: "r", l: "年利率（0 息贷填 0）", u: "%", v: 3.5 }, { k: "fee", l: "手续费 / 金融服务费", u: "元", v: 0 }],
    run: function (v) {
      pos(v.p); need(v.d, v.r, v.fee); var L = v.p * (1 - v.d / 100), m = pmt(L, v.r / 1200, v.n), fl = [L - v.fee];
      for (var i = 0; i < v.n; i++) fl.push(-m);
      var lo = 0, hi = 1; function npv(r) { return fl.reduce(function (s, c, i) { return s + c / Math.pow(1 + r, i); }, 0); }
      for (var k = 0; k < 100; k++) { var mid = (lo + hi) / 2; if (npv(mid) > 0) hi = mid; else lo = mid; }
      return { big: ["月供", y(m)], kv: [["贷款金额", y(L)], ["利息 + 手续费", y(m * v.n - L + v.fee)], ["实际年化成本", pct((lo + hi) / 2 * 12)]] };
    } });

  add({ cat: "auto", id: "parking-fee", name: "停车费计算器", desc: "按首段价格、续时单价和封顶价算停车费", kw: "停车 封顶",
    fields: [{ k: "t", l: "停车时长", u: "分钟", v: 200 }, { k: "free", l: "免费时长", u: "分钟", v: 15 }, { k: "f1", l: "首段时长", u: "分钟", v: 60 }, { k: "p1", l: "首段价格", u: "元", v: 10 }, { k: "u", l: "之后每", u: "分钟", v: 30 }, { k: "p2", l: "每段价格", u: "元", v: 3 }, { k: "cap", l: "单日封顶（0 = 不封顶）", u: "元", v: 50 }],
    run: function (v) {
      need(v.t, v.free, v.f1, v.p1, v.p2, v.cap); pos(v.u); var fee = 0;
      if (v.t > v.free) { fee = v.p1; if (v.t > v.f1) fee += Math.ceil((v.t - v.f1) / v.u) * v.p2; }
      var days = Math.ceil(v.t / 1440); if (v.cap > 0) fee = Math.min(fee, v.cap * days);
      return { big: ["停车费", y(fee)], kv: [["停车时长", hm(v.t)]] };
    } });

  add({ cat: "auto", id: "road-trip-cost", name: "自驾游费用计算器", desc: "油/电费、过路费、住宿、餐饮，算总预算和人均", kw: "自驾游 预算",
    fields: [{ k: "d", l: "总里程", u: "km", v: 1200 }, { k: "c", l: "百公里油耗", u: "L", v: 7 }, { k: "p", l: "油价", u: "元/L", v: 7.5 }, { k: "t", l: "高速费（约 0.5 元/km 可估）", u: "元", v: 500 }, { k: "n", l: "天数", u: "天", v: 4 }, { k: "h", l: "每晚住宿", u: "元", v: 300 }, { k: "f", l: "每人每天餐饮", u: "元", v: 120 }, { k: "ppl", l: "人数", u: "人", v: 3 }],
    run: function (v) {
      pos(v.d, v.n, v.ppl); need(v.c, v.p, v.t, v.h, v.f); var fuel = v.d * v.c / 100 * v.p, hotel = v.h * Math.max(v.n - 1, 0), food = v.f * v.n * v.ppl, tot = fuel + v.t + hotel + food;
      return { big: ["总预算", y(tot)], kv: [["人均", y(tot / v.ppl)], ["油费", y(fuel)], ["高速费", y(v.t)], ["住宿", y(hotel)], ["餐饮", y(food)]] };
    } });

  add({ cat: "auto", id: "license-points", name: "驾照记分查询", desc: "常见交通违法的记分和罚款，算还剩多少分", kw: "扣分 违章 驾照 12分",
    fields: [{ k: "i", l: "违法行为", t: "sel", drop: true, o: [[0, "闯红灯 · 6 分"], [1, "未按规定让行斑马线行人 · 3 分"], [2, "开车打电话 · 3 分"], [3, "不系安全带 · 1 分"], [4, "高速超速 20%–50% · 6 分"], [5, "普通道路超速 20%–50% · 3 分"], [6, "超速 50% 以上 · 12 分"], [7, "违法占用应急车道 · 9 分"], [8, "饮酒驾驶 · 12 分"], [9, "不按导向车道行驶 · 2 分"], [10, "违法停车（驾驶人不在现场）· 0 分"]] }, { k: "u", l: "本周期已扣", u: "分", v: 0 }],
    run: function (v) {
      var P = [6, 3, 3, 1, 6, 3, 12, 9, 12, 2, 0], pts = P[v.i], left = 12 - v.u - pts;
      return { big: ["剩余", Math.max(left, 0) + " 分"], tag: left <= 0 ? "满 12 分需学习考试" : left <= 3 ? "注意" : null, kv: [["本次记分", pts + " 分"]], note: "依据 2022 年 4 月施行的《道路交通安全违法行为记分管理办法》。累积记分周期 12 个月；一个周期内未满 12 分且罚款缴清的，可通过“学法减分”减分。" };
    } });

  add({ cat: "auto", id: "fuel-vs-electric", name: "油车 vs 电车成本对比", desc: "按年里程比较燃油车、纯电车的能源、保险、保养成本", kw: "电车 油车 新能源 划算",
    fields: [{ k: "km", l: "年行驶里程", u: "km", v: 15000 }, { k: "yr", l: "使用年限", u: "年", v: 5 }, { k: "pa", l: "油车价格", u: "元", v: 150000 }, { k: "c", l: "油车百公里油耗", u: "L", v: 7 }, { k: "op", l: "油价", u: "元/L", v: 7.5 }, { k: "pb", l: "电车价格", u: "元", v: 170000 }, { k: "e", l: "电车百公里电耗", u: "kWh", v: 14 }, { k: "ep", l: "电价（家充 / 公充平均）", u: "元/度", v: 0.8 }],
    run: function (v) {
      pos(v.km, v.yr); need(v.pa, v.c, v.op, v.pb, v.e, v.ep);
      var fa = v.km * v.c / 100 * v.op, fb = v.km * v.e / 100 * v.ep, ma = 2500, mb = 1000, ta = v.pa + (fa + ma) * v.yr, tb = v.pb + (fb + mb) * v.yr;
      var be = (v.pb - v.pa) / ((fa + ma - fb - mb) / v.km);
      return { big: ["更省钱", ta > tb ? "电车" : "油车"], table: { h: ["项目", "油车", "电车"], r: [["每年能源", f(fa, 0), f(fb, 0)], ["每年保养（估）", f(ma, 0), f(mb, 0)], [v.yr + " 年总成本", f(ta, 0), f(tb, 0)]] }, kv: [["差价回本里程", be > 0 ? f(be, 0) + " km" : "电车更便宜，无需回本"]], note: "未计购置税：新能源车 2026–2027 年减半征收。保险电车通常略贵。" };
    } });

  add({ cat: "auto", id: "ridehailing-income", name: "网约车收入计算器", desc: "流水扣除平台抽成、油电费、车辆成本后的净收入", kw: "网约车 滴滴 跑车 收入",
    fields: [{ k: "g", l: "每天流水", u: "元", v: 600 }, { k: "c", l: "平台抽成", u: "%", v: 20 }, { k: "km", l: "每天里程", u: "km", v: 250 }, { k: "e", l: "每公里能源费", u: "元", v: 0.15 }, { k: "car", l: "每月租车 / 车贷 + 保险", u: "元", v: 3500 }, { k: "d", l: "每月出车天数", u: "天", v: 26 }, { k: "h", l: "每天在线时长", u: "小时", v: 10 }],
    run: function (v) {
      pos(v.g, v.d, v.h); need(v.c, v.km, v.e, v.car); var day = v.g * (1 - v.c / 100) - v.km * v.e, mon = day * v.d - v.car;
      return { big: ["月净收入", y(mon)], kv: [["每天到手（扣抽成和能源）", y(day)], ["时薪", y(mon / v.d / v.h)]] };
    } });

  /* ======================= 健康健身 ======================= */
  add({ cat: "health", id: "calorie-deficit", name: "减脂热量缺口计算器", desc: "按目标体重和期限算每天需要的热量缺口", kw: "减肥 热量缺口 减脂",
    fields: [{ k: "w", l: "当前体重", u: "kg", v: 75 }, { k: "t", l: "目标体重", u: "kg", v: 68 }, { k: "d", l: "计划用时", u: "周", v: 12 }, { k: "tdee", l: "每日总消耗 TDEE", u: "kcal", v: 2300 }],
    run: function (v) {
      pos(v.w, v.t, v.d, v.tdee); if (v.t >= v.w) throw "目标体重需低于当前体重"; var def = (v.w - v.t) * 7700 / (v.d * 7), eat = v.tdee - def, rate = (v.w - v.t) / v.d / v.w;
      return { big: ["每日缺口", f(def, 0) + " kcal"], tag: rate > .01 ? "速度过快" : "合理", kv: [["每日应摄入", f(eat, 0) + " kcal"], ["每周减重", f((v.w - v.t) / v.d, 2) + " kg"]], note: "1 kg 脂肪约 7700 kcal。每周减体重 0.5%–1% 较安全，摄入不建议低于基础代谢。" };
    } });

  add({ cat: "health", id: "heart-rate-zone", name: "心率区间计算器", desc: "按储备心率（Karvonen）划分 5 个训练区间", kw: "心率区间 燃脂心率 有氧",
    fields: [{ k: "a", l: "年龄", u: "岁", v: 28 }, { k: "r", l: "静息心率", u: "次/分", v: 65 }],
    run: function (v) {
      pos(v.a, v.r); var mx = 208 - 0.7 * v.a, hrr = mx - v.r, Z = [["Z1 恢复", .5, .6], ["Z2 燃脂 / 有氧基础", .6, .7], ["Z3 有氧耐力", .7, .8], ["Z4 乳酸阈", .8, .9], ["Z5 最大摄氧", .9, 1]];
      return { big: ["最大心率", f(mx, 0) + " 次/分"], table: { h: ["区间", "心率（次/分）"], r: Z.map(function (z) { return [z[0], f(v.r + hrr * z[1], 0) + " – " + f(v.r + hrr * z[2], 0)]; }) }, note: "最大心率按 Tanaka 公式 208 − 0.7 × 年龄。" };
    } });

  add({ cat: "health", id: "running-pace", name: "跑步配速计算器", desc: "距离和用时互算配速，预测 5K / 10K / 半马 / 全马成绩", kw: "配速 马拉松 跑步",
    fields: [{ k: "d", l: "距离", u: "km", v: 10 }, { k: "t", l: "用时（时:分:秒）", t: "text", v: "00:55:00" }],
    run: function (v) {
      pos(v.d); var p = String(v.t).split(/[:：]/).map(Number); if (p.some(isNaN) || p.length > 3) throw "用时格式如 00:55:00"; while (p.length < 3) p.unshift(0); var s = p[0] * 3600 + p[1] * 60 + p[2]; pos(s);
      function fmt(x) { x = Math.round(x); var h = Math.floor(x / 3600), m = Math.floor(x / 60) % 60, ss = x % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(ss).padStart(2, "0"); }
      var pace = s / v.d, R = [["5 公里", 5], ["10 公里", 10], ["半程马拉松", 21.0975], ["全程马拉松", 42.195]];
      return { big: ["配速", fmt(pace) + " /公里"], kv: [["时速", f(v.d / s * 3600, 2) + " km/h"]], table: { h: ["距离", "预测成绩（Riegel）"], r: R.map(function (r) { return [r[0], fmt(s * Math.pow(r[1] / v.d, 1.06))]; }) } };
    } });

  add({ cat: "health", id: "child-bmi", name: "儿童青少年 BMI 评价", desc: "按中国 6–18 岁标准判断超重、肥胖", kw: "儿童 bmi 肥胖 青少年",
    fields: [{ k: "s", l: "性别", t: "sel", o: ["男", "女"] }, { k: "a", l: "年龄", u: "岁", v: 10 }, { k: "h", l: "身高", u: "cm", v: 140 }, { k: "w", l: "体重", u: "kg", v: 38 }],
    run: function (v) {
      pos(v.h, v.w); if (!(v.a >= 6 && v.a <= 18)) throw "适用 6–18 岁";
      var M = { 6: [16.4, 17.7], 7: [17, 18.7], 8: [17.8, 19.7], 9: [18.5, 20.8], 10: [19.2, 21.9], 11: [19.9, 23], 12: [20.7, 24.1], 13: [21.4, 25.2], 14: [22.3, 26.1], 15: [22.9, 26.6], 16: [23.3, 27.1], 17: [23.7, 27.6], 18: [24, 28] },
        F = { 6: [16.2, 17.5], 7: [16.8, 18.5], 8: [17.6, 19.4], 9: [18.5, 20.4], 10: [19.5, 21.5], 11: [20.3, 22.7], 12: [21.1, 23.9], 13: [21.9, 25], 14: [22.6, 25.9], 15: [23.1, 26.6], 16: [23.5, 27.1], 17: [23.8, 27.6], 18: [24, 28] };
      var t = (v.s === "男" ? M : F)[Math.floor(v.a)], b = v.w / Math.pow(v.h / 100, 2);
      return { big: ["BMI", f(b, 1)], tag: b >= t[1] ? "肥胖" : b >= t[0] ? "超重" : "正常范围", kv: [["超重界值", t[0]], ["肥胖界值", t[1]]], note: "参考 WS/T 586—2018《学龄儿童青少年超重与肥胖筛查》，按整岁取界值。" };
    } });

  add({ cat: "health", id: "pregnancy-week", name: "孕周 / 产检时间计算器", desc: "按末次月经算现在孕几周，下次产检做什么", kw: "孕周 产检 怀孕",
    fields: [{ k: "l", l: "末次月经第一天", t: "date", v: function () { var d = today(); d.setDate(d.getDate() - 100); return iso(d); } }],
    run: function (v) {
      var l = D(v.l), t = today(), days = dayDiff(l, t); if (days < 0) throw "日期在未来"; if (days > 300) throw "已超过 42 周，请检查日期";
      var wk = Math.floor(days / 7), dd = days % 7, S = [[6, 8, "首次产检、B 超确认宫内孕"], [11, 13, "NT 检查、建档"], [15, 20, "唐筛 / 无创 DNA"], [20, 24, "大排畸 B 超"], [24, 28, "糖耐量（OGTT）"], [28, 32, "小排畸、血常规"], [32, 36, "胎心监护、B 超"], [37, 41, "每周产检、胎心监护"]];
      var next = S.filter(function (s) { return wk <= s[1]; })[0];
      function at(w) { var x = new Date(l); x.setDate(x.getDate() + w * 7); return iso(x); }
      return { big: ["当前孕周", "孕 " + wk + " 周 " + dd + " 天"], kv: [["孕期", wk < 14 ? "孕早期" : wk < 28 ? "孕中期" : "孕晚期"], ["预产期", at(40)], ["下次产检", next ? next[0] + "–" + next[1] + " 周（" + at(next[0]) + " 起）：" + next[2] : "临产，随时就医"]] };
    } });

  add({ cat: "health", id: "alcohol-units", name: "饮酒量 / 酒精克数计算", desc: "按酒类、容量、度数算纯酒精克数，对照每日建议上限", kw: "饮酒 酒精 白酒 啤酒",
    fields: [{ k: "ml", l: "饮用量", u: "ml", v: 100 }, { k: "abv", l: "酒精度", u: "%", v: 52 }],
    run: function (v) { pos(v.ml, v.abv); var gm = v.ml * v.abv / 100 * 0.8; return { big: ["纯酒精", f(gm, 1) + " g"], tag: gm > 15 ? "超过每日建议上限" : "在建议上限内", kv: [["相当于啤酒（3.5%）", f(gm / 0.8 / 0.035, 0) + " ml"], ["相当于红酒（12%）", f(gm / 0.8 / 0.12, 0) + " ml"]], note: "《中国居民膳食指南（2022）》：成年人一天饮酒的酒精量不超过 15 g，儿童、孕妇、哺乳期不饮酒。" }; } });

  add({ cat: "health", id: "protein-need", name: "每日蛋白质需求", desc: "按体重和活动强度算每天要吃多少蛋白质", kw: "蛋白质 增肌 鸡胸",
    fields: [{ k: "w", l: "体重", u: "kg", v: 65 }, { k: "a", l: "情况", t: "sel", drop: true, o: [[0.8, "久坐 / 一般成年人"], [1.2, "规律运动"], [1.6, "增肌训练"], [2, "减脂期保肌"], [1.2, "老年人（65 岁以上）"]], v: 0.8 }],
    run: function (v) { pos(v.w); var gm = v.w * v.a; return { big: ["每日蛋白质", f(gm, 0) + " g"], kv: [["约合鸡胸肉", f(gm / 0.24, 0) + " g"], ["约合鸡蛋", f(gm / 6.5, 0) + " 个"], ["约合牛奶", f(gm / 0.032, 0) + " ml"]], note: "实际饮食来源多样，按全天合计即可。肾病患者需遵医嘱。" }; } });

  add({ cat: "health", id: "sleep-debt", name: "睡眠债计算器", desc: "按一周实际睡眠和需要睡眠，算累计睡眠不足", kw: "睡眠不足 熬夜",
    fields: [{ k: "n", l: "每晚需要", u: "小时", v: 8 }, { k: "s", l: "最近 7 晚实际睡眠（小时）", t: "area", v: "6.5, 7, 6, 5.5, 7, 9, 8.5" }],
    run: function (v) {
      pos(v.n); var a = nums(v.s), debt = a.reduce(function (s, x) { return s + (v.n - x); }, 0), avg = a.reduce(function (s, x) { return s + x; }, 0) / a.length;
      return { big: ["累计睡眠债", f(Math.max(debt, 0), 1) + " 小时"], kv: [["平均每晚", f(avg, 2) + " 小时"], ["每晚多睡 1 小时可还清", f(Math.max(debt, 0), 0) + " 天"]] };
    } });

  /* ======================= 数学计算 ======================= */
  add({ cat: "math", id: "prime", name: "质数判断 / 分解质因数", desc: "判断是否质数，分解质因数，列出所有因数", kw: "质数 素数 因数 分解",
    fields: [{ k: "n", l: "整数", v: 360 }],
    run: function (v) {
      if (!Number.isInteger(v.n) || v.n < 2 || v.n > 1e12) throw "请输入 2 到 1 万亿之间的整数"; var n = v.n, fs = {}, x = n;
      for (var p = 2; p * p <= x; p++) while (x % p === 0) { fs[p] = (fs[p] || 0) + 1; x /= p; } if (x > 1) fs[x] = (fs[x] || 0) + 1;
      var ks = Object.keys(fs), cnt = ks.reduce(function (s, k) { return s * (fs[k] + 1); }, 1), divs = [];
      if (n <= 1e7) for (var i = 1; i * i <= n; i++) if (n % i === 0) { divs.push(i); if (i * i !== n) divs.push(n / i); }
      divs.sort(function (a, b) { return a - b; });
      return { big: [ks.length === 1 && fs[ks[0]] === 1 ? "是质数" : "合数", ks.map(function (k) { return k + (fs[k] > 1 ? "^" + fs[k] : ""); }).join(" × ")], kv: [["因数个数", cnt], ["全部因数", divs.length ? (divs.length > 60 ? divs.slice(0, 60).join(", ") + " …" : divs.join(", ")) : "数太大，不列出"]] };
    } });

  add({ cat: "math", id: "factorial", name: "阶乘 / 排列组合", desc: "n!、A(n,m)、C(n,m) 精确大数计算", kw: "阶乘 排列 组合 a c",
    fields: [{ k: "n", l: "n", v: 20 }, { k: "m", l: "m", v: 3 }],
    run: function (v) {
      if (!Number.isInteger(v.n) || !Number.isInteger(v.m) || v.n < 0 || v.m < 0 || v.m > v.n || v.n > 1000) throw "需 0 ≤ m ≤ n ≤ 1000 的整数";
      var B = typeof BigInt === "function" ? BigInt : null; if (!B) throw "浏览器不支持大数";
      function fac(a, b) { var r = B(1); for (var i = a; i <= b; i++) r *= B(i); return r; }
      function s(x) { x = x.toString(); return x.length > 60 ? x.slice(0, 20) + "…（共 " + x.length + " 位）" : x.replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
      var A = fac(v.n - v.m + 1, v.n), C = A / fac(1, v.m);
      return { kv: [["n!", s(fac(1, v.n))], ["排列 A(n,m)", s(A)], ["组合 C(n,m)", s(C)], ["m!", s(fac(1, v.m))]] };
    } });

  add({ cat: "math", id: "proportion", name: "比例 / 比例分配计算器", desc: "解比例式 a:b = c:x，按比例分配总数", kw: "比例 按比例分配 交叉相乘",
    fields: [{ k: "m", l: "类型", t: "sel", o: ["解比例 a:b = c:x", "按比例分配"] }, { k: "a", l: "a", v: 3, show: function (v) { return v.m[0] === "解"; } }, { k: "b", l: "b", v: 4, show: function (v) { return v.m[0] === "解"; } }, { k: "c", l: "c", v: 15, show: function (v) { return v.m[0] === "解"; } },
      { k: "t", l: "总数", v: 10000, show: function (v) { return v.m[0] !== "解"; } }, { k: "r", l: "比例（如 3:2:1）", t: "text", v: "3:2:1", show: function (v) { return v.m[0] !== "解"; } }],
    run: function (v) {
      if (v.m[0] === "解") { need(v.b, v.c); pos(v.a); return { big: ["x", g(v.b * v.c / v.a, 10)] }; }
      need(v.t); var rs = String(v.r).split(/[:：,，\s]+/).filter(Boolean).map(Number); if (rs.length < 2 || rs.some(function (x) { return !(x >= 0); })) throw "比例格式如 3:2:1"; var s = rs.reduce(function (a, b) { return a + b; }, 0); pos(s);
      return { table: { h: ["份", "比例", "分得"], r: rs.map(function (x, i) { return ["第 " + (i + 1) + " 份", g(x), g(v.t * x / s, 6)]; }) } };
    } });

  add({ cat: "math", id: "linear-system", name: "二元 / 三元一次方程组", desc: "克莱姆法则解二元或三元一次方程组", kw: "方程组 二元一次 三元一次",
    fields: [{ k: "e", l: "每行一个方程的系数和常数（ax + by + cz = d）", t: "area", v: "2 1 -1 8\n-3 -1 2 -11\n-2 1 2 -3" }],
    run: function (v) {
      var R = String(v.e).trim().split(/\n+/).map(nums), n = R.length;
      if (!(n === 2 || n === 3) || R.some(function (r) { return r.length !== n + 1; })) throw "二元请输入 2 行各 3 个数，三元 3 行各 4 个数";
      function det(M) { return M.length === 2 ? M[0][0] * M[1][1] - M[0][1] * M[1][0] : M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]); }
      var A = R.map(function (r) { return r.slice(0, n); }), d = det(A); if (Math.abs(d) < 1e-12) throw "系数行列式为 0：无解或有无穷多解";
      var names = ["x", "y", "z"], out = [];
      for (var j = 0; j < n; j++) { var Aj = A.map(function (r, i) { var c = r.slice(); c[j] = R[i][n]; return c; }); out.push([names[j], g(det(Aj) / d, 10)]); }
      return { big: ["解", out.map(function (o) { return o[0] + " = " + o[1]; }).join("，")] };
    } });

  add({ cat: "math", id: "trig", name: "三角函数计算器", desc: "sin、cos、tan 及反三角函数，角度 / 弧度", kw: "sin cos tan 三角函数",
    fields: [{ k: "x", l: "角度或数值", v: 30 }, { k: "u", l: "输入单位", t: "sel", o: ["角度", "弧度"] }],
    run: function (v) {
      need(v.x); var r = v.u === "角度" ? v.x * Math.PI / 180 : v.x, c = function (x) { return Math.abs(x) < 1e-12 ? 0 : x; };
      var dg = function (x) { return isNaN(x) ? "超出定义域" : g(x * 180 / Math.PI, 8) + "°"; };
      return { kv: [["sin", g(c(Math.sin(r)), 10)], ["cos", g(c(Math.cos(r)), 10)], ["tan", Math.abs(Math.cos(r)) < 1e-12 ? "不存在" : g(c(Math.tan(r)), 10)], ["arcsin(x)", dg(Math.asin(v.x))], ["arccos(x)", dg(Math.acos(v.x))], ["arctan(x)", dg(Math.atan(v.x))]] };
    } });

  add({ cat: "math", id: "decimal-fraction", name: "小数化分数 / 循环小数", desc: "小数（含循环小数）化成最简分数", kw: "小数 分数 循环小数",
    fields: [{ k: "s", l: "小数（循环节用括号，如 0.1(6)）", t: "text", v: "0.1(6)" }],
    run: function (v) {
      var m = String(v.s).trim().match(/^(-?)(\d*)\.?(\d*)(?:\((\d+)\))?$/); if (!m || (!m[2] && !m[3] && !m[4])) throw "格式如 0.75 或 0.1(6)";
      var neg = m[1] === "-", I = m[2] || "0", A = m[3] || "", R = m[4] || "", num, den;
      if (R) { num = Number(I + A + R) - Number(I + A); den = Number("9".repeat(R.length) + "0".repeat(A.length)); } else { num = Number(I + A); den = Math.pow(10, A.length); }
      var k = H.gcd(num, den) || 1; num /= k; den /= k;
      return { big: ["最简分数", (neg ? "-" : "") + num + (den === 1 ? "" : "/" + den)], kv: [["带分数", den !== 1 && num > den ? (neg ? "-" : "") + Math.floor(num / den) + " 又 " + num % den + "/" + den : "—"], ["小数值", g((neg ? -1 : 1) * num / den, 12)]] };
    } });

  add({ cat: "math", id: "random", name: "随机数 / 抽签生成器", desc: "指定范围生成不重复随机数，或从名单里随机抽取", kw: "随机数 抽签 抽奖",
    fields: [{ k: "m", l: "模式", t: "sel", o: ["数字", "名单"] }, { k: "a", l: "最小值", v: 1, show: function (v) { return v.m === "数字"; } }, { k: "b", l: "最大值", v: 100, show: function (v) { return v.m === "数字"; } }, { k: "l", l: "名单（每行或逗号分隔）", t: "area", v: "张三, 李四, 王五, 赵六", show: function (v) { return v.m === "名单"; } }, { k: "n", l: "抽取个数", v: 1 }],
    run: function (v) {
      var pool; if (v.m === "数字") { if (!Number.isInteger(v.a) || !Number.isInteger(v.b) || v.b < v.a || v.b - v.a > 1e6) throw "请输入整数范围（跨度不超过 100 万）"; pool = null; }
      else { pool = String(v.l).split(/[\n,，、]+/).map(function (s) { return s.trim(); }).filter(Boolean); if (!pool.length) throw "请输入名单"; }
      var size = pool ? pool.length : v.b - v.a + 1; if (!Number.isInteger(v.n) || v.n < 1 || v.n > Math.min(size, 1000)) throw "抽取个数需在 1–" + Math.min(size, 1000);
      function rnd(k) { if (window.crypto && crypto.getRandomValues) { var u = new Uint32Array(1); crypto.getRandomValues(u); return u[0] % k; } return Math.floor(Math.random() * k); }
      var picked = {}, out = []; while (out.length < v.n) { var i = rnd(size); if (!picked[i]) { picked[i] = 1; out.push(pool ? pool[i] : v.a + i); } }
      return { big: ["结果", out.join("、")], note: "每次点“计算”或修改输入都会重新抽取。" };
    } });

  add({ cat: "math", id: "rounding", name: "四舍五入 / 有效数字", desc: "按小数位、有效数字、四舍六入五成双取舍", kw: "四舍五入 有效数字 保留小数",
    fields: [{ k: "x", l: "数值", t: "text", v: "3.14159265" }, { k: "d", l: "保留", v: 2 }, { k: "m", l: "方式", t: "sel", o: ["小数位", "有效数字"] }],
    run: function (v) {
      var x = Number(v.x); if (isNaN(x)) throw "请输入数字"; if (!Number.isInteger(v.d) || v.d < 0 || v.d > 15) throw "保留位数 0–15";
      if (v.m === "有效数字") { if (v.d < 1) throw "有效数字至少 1 位"; return { big: ["结果", Number(x.toPrecision(v.d)).toString()], kv: [["科学计数法", x.toExponential(v.d - 1)]] }; }
      var k = Math.pow(10, v.d), s = x * k, fl = Math.floor(s), diff = s - fl, bank = Math.abs(diff - .5) < 1e-9 ? (fl % 2 === 0 ? fl : fl + 1) : Math.round(s);
      return { kv: [["四舍五入", (Math.round(s + (s > 0 ? 1e-9 : -1e-9)) / k).toFixed(v.d)], ["向上取（进一法）", (Math.ceil(s - 1e-9) / k).toFixed(v.d)], ["向下取（去尾法）", (Math.floor(s + 1e-9) / k).toFixed(v.d)], ["四舍六入五成双", (bank / k).toFixed(v.d)]] };
    } });

  /* ======================= 单位换算 ======================= */
  unit("density", "密度换算器", "千克/立方米、克/立方厘米、克/毫升、磅/立方英尺", "密度", [["kg/m³", 1], ["g/cm³", 1000], ["g/mL", 1000], ["g/L", 1], ["t/m³", 1000], ["lb/ft³", 16.018463], ["lb/in³", 27679.9047]], "g/cm³");
  unit("flow", "流量换算器", "立方米/时、升/分、升/秒、加仑/分", "流量 水泵", [["m³/h", 1 / 3600], ["m³/s", 1], ["L/min", 1 / 60000], ["L/s", 0.001], ["美制加仑/分 GPM", 6.30902e-5], ["吨/时（水）", 1 / 3600]], "m³/h");
  unit("illuminance", "照度换算器", "勒克斯、英尺烛光、辐透", "照度 lux", [["勒克斯 lx", 1], ["英尺烛光 fc", 10.7639104], ["辐透 ph", 1e4], ["毫辐透", 10]], "勒克斯 lx");
  unit("torque", "扭矩换算器", "牛·米、千克力·米、磅力·英尺", "扭矩 扭力 n·m", [["牛·米 N·m", 1], ["千克力·米 kgf·m", 9.80665], ["磅力·英尺 lbf·ft", 1.35581795], ["磅力·英寸 lbf·in", 0.112984829], ["千克力·厘米", 0.0980665]], "牛·米 N·m");
  unit("viscosity", "粘度换算器", "帕·秒、厘泊、泊、毫帕·秒", "粘度 cp", [["帕·秒 Pa·s", 1], ["毫帕·秒 mPa·s", 0.001], ["厘泊 cP", 0.001], ["泊 P", 0.1]], "厘泊 cP");
  unit("radiation", "辐射剂量换算", "希沃特、毫希、微希、雷姆", "辐射 希沃特", [["希沃特 Sv", 1], ["毫希 mSv", 1e-3], ["微希 μSv", 1e-6], ["雷姆 rem", 0.01], ["毫雷姆 mrem", 1e-5]], "毫希 mSv");
  unit("chinese-length", "市制单位换算", "里、丈、尺、寸、亩、斤、两与公制互换", "市尺 亩 斤 两 里 丈", [["米", 1], ["公里", 1000], ["里", 500], ["丈", 10 / 3], ["尺", 1 / 3], ["寸", 1 / 30], ["分", 1 / 300], ["英尺", 0.3048], ["英寸", 0.0254]], "尺");
  unit("chinese-mass", "斤两克换算", "斤、两、钱、公斤、克、磅、盎司", "斤 两 公斤 克 磅", [["克 g", 1], ["公斤 kg", 1000], ["斤", 500], ["两", 50], ["钱", 5], ["磅 lb", 453.59237], ["盎司 oz", 28.349523], ["金衡盎司 ozt", 31.1034768]], "斤");

  var SHOE = [[35, 220, 4, 5, 2.5], [36, 225, 4.5, 5.5, 3.5], [37, 230, 5, 6.5, 4], [38, 240, 6, 7.5, 5], [39, 245, 6.5, 8, 6], [40, 250, 7, 8.5, 6.5], [41, 255, 8, 9.5, 7], [42, 260, 8.5, 10, 8], [43, 265, 9.5, 11, 9], [44, 270, 10, 11.5, 9.5], [45, 275, 10.5, 12, 10], [46, 280, 11, 13, 11]];
  add({ cat: "convert", id: "shoe-size", name: "鞋码换算器", desc: "中国码、毫米、美码（男/女）、英码互换", kw: "鞋码 尺码 美码 欧码",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["中国 / 欧码", "脚长 mm"] }, { k: "x", l: "数值", v: 42 }],
    run: function (v) {
      pos(v.x); var i = v.m === "脚长 mm" ? 1 : 0, best = SHOE.reduce(function (a, b) { return Math.abs(b[i] - v.x) < Math.abs(a[i] - v.x) ? b : a; });
      return { big: ["中国 / 欧码", best[0]], kv: [["脚长", best[1] + " mm"], ["美码（男）", best[2]], ["美码（女）", best[3]], ["英码", best[4]]], note: "各品牌版型不同，同码可能相差半码，网购最好看品牌自己的尺码表。" };
    } });

  add({ cat: "convert", id: "clothing-size", name: "服装尺码换算", desc: "按身高体重推荐 S/M/L/XL 和国标号型", kw: "衣服 尺码 号型",
    fields: [{ k: "s", l: "性别", t: "sel", o: ["男", "女"] }, { k: "h", l: "身高", u: "cm", v: 175 }, { k: "w", l: "体重", u: "kg", v: 68 }],
    run: function (v) {
      pos(v.h, v.w); var male = v.s === "男", L = ["XS", "S", "M", "L", "XL", "XXL", "3XL"], base = male ? [160, 165, 170, 175, 180, 185, 190] : [150, 155, 160, 165, 170, 175, 180];
      var hi = base.reduce(function (b, x, i) { return v.h >= x - 2.5 ? i : b; }, 0), bmi = v.w / Math.pow(v.h / 100, 2), adj = bmi > 26 ? 2 : bmi > 23.5 ? 1 : bmi < 18.5 ? -1 : 0, idx = Math.max(0, Math.min(6, hi + adj));
      var chest = male ? 80 + idx * 4 : 76 + idx * 4;
      return { big: ["推荐尺码", L[idx]], kv: [["国标号型", base[Math.max(0, Math.min(6, hi))] + "/" + chest + (bmi > 24 ? "B" : "A")]], note: "按身高定码、体型（BMI）微调，宽松版可小一码，修身版可大一码。" };
    } });

  add({ cat: "convert", id: "byte-convert", name: "存储容量换算（硬盘缩水）", desc: "十进制 GB 与二进制 GiB 换算，算硬盘实际显示容量", kw: "硬盘 缩水 gib tb",
    fields: [{ k: "x", l: "标称容量", v: 1 }, { k: "u", l: "单位", t: "sel", o: [[1e9, "GB"], [1e12, "TB"]], v: 1e12 }],
    run: function (v) { pos(v.x); var b = v.x * v.u; return { big: ["系统显示约", g(b / Math.pow(1024, v.u === 1e12 ? 4 : 3), 4) + (v.u === 1e12 ? " TiB" : " GiB")], kv: [["字节", b.toLocaleString("en-US")], ["GiB", g(b / Math.pow(1024, 3), 6)], ["“缩水”比例", pct(1 - b / Math.pow(1024, v.u === 1e12 ? 4 : 3) / v.x, 1)]], note: "厂商按 1 TB = 10¹² 字节，Windows 按 1024 进位却仍显示 “GB/TB”，所以 1 TB 显示约 931 GB。" }; } });

  add({ cat: "convert", id: "color", name: "颜色值转换器", desc: "HEX、RGB、HSL 互转，预览颜色", kw: "颜色 hex rgb hsl 色值",
    fields: [{ k: "c", l: "颜色（#1d1d1f、rgb(29,29,31) 或 hsl(240,3%,12%)）", t: "text", v: "#1d1d1f" }],
    run: function (v) {
      var s = String(v.c).trim().toLowerCase(), r, gg, b, m;
      if ((m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/))) { var hx = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1]; r = parseInt(hx.slice(0, 2), 16); gg = parseInt(hx.slice(2, 4), 16); b = parseInt(hx.slice(4), 16); }
      else if ((m = s.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/))) { r = +m[1]; gg = +m[2]; b = +m[3]; }
      else if ((m = s.match(/^hsla?\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%/))) { var H0 = +m[1] / 360, S0 = +m[2] / 100, L0 = +m[3] / 100, q = L0 < .5 ? L0 * (1 + S0) : L0 + S0 - L0 * S0, p = 2 * L0 - q; var hue = function (t) { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; r = Math.round(hue(H0 + 1 / 3) * 255); gg = Math.round(hue(H0) * 255); b = Math.round(hue(H0 - 1 / 3) * 255); }
      else throw "无法识别的颜色格式";
      if ([r, gg, b].some(function (x) { return x > 255; })) throw "RGB 值需在 0–255";
      var R = r / 255, G = gg / 255, B = b / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, d = mx - mn, h = 0, sat = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
      if (d) h = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; h = Math.round((h * 60 + 360) % 360);
      var hex = "#" + [r, gg, b].map(function (x) { return x.toString(16).padStart(2, "0"); }).join("").toUpperCase();
      var lum = function (c) { return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }, Y = .2126 * lum(R) + .7152 * lum(G) + .0722 * lum(B);
      return { big: ["HEX", hex], kv: [["RGB", "rgb(" + r + ", " + gg + ", " + b + ")"], ["HSL", "hsl(" + h + ", " + Math.round(sat * 100) + "%, " + Math.round(l * 100) + "%)"], ["与白色对比度", f(1.05 / (Y + .05), 2) + " : 1"], ["与黑色对比度", f((Y + .05) / .05, 2) + " : 1"]] };
    } });

  /* ======================= 日期时间 ======================= */
  add({ cat: "date", id: "nominal-age", name: "虚岁 / 周岁计算器", desc: "按出生日期算周岁、虚岁（按农历春节）", kw: "虚岁 周岁 年龄",
    fields: [{ k: "b", l: "出生日期", t: "date", v: "2000-06-15" }],
    run: function (v) {
      var b = D(v.b), t = today(); if (b > t) throw "出生日期在未来"; var a = ymd(b, t);
      var diff = H.lunar(t).y - H.lunar(b).y;
      return { big: ["周岁", a[0] + " 岁"], kv: [["虚岁", diff + 1 + " 岁"], ["精确年龄", a[0] + " 岁 " + a[1] + " 个月 " + a[2] + " 天"]], note: "虚岁：出生即 1 岁，每过一次农历春节加 1 岁。" };
    } });

  add({ cat: "date", id: "love-days", name: "纪念日计算器", desc: "恋爱、结婚多少天，下一个整百天和周年是哪天", kw: "恋爱 纪念日 结婚 在一起",
    fields: [{ k: "d", l: "开始日期", t: "date", v: "2024-05-20" }, { k: "c", l: "第 1 天算", t: "sel", o: ["当天算第 1 天", "第二天算第 1 天"] }],
    run: function (v) {
      var s = D(v.d), t = today(); if (s > t) throw "日期在未来"; var n = dayDiff(s, t) + (v.c[0] === "当" ? 1 : 0), next100 = Math.ceil((n + 1) / 100) * 100;
      function on(k) { var x = new Date(s); x.setDate(x.getDate() + k - (v.c[0] === "当" ? 1 : 0)); return iso(x) + " " + WK[x.getDay()]; }
      var yrs = ymd(s, t)[0], anniv = addMonths(s, (yrs + 1) * 12);
      var M = [["一周年", 1, "纸婚"], ["二周年", 2, "布婚"], ["三周年", 3, "皮革婚"], ["五周年", 5, "木婚"], ["十周年", 10, "锡婚"], ["二十周年", 20, "瓷婚"], ["二十五周年", 25, "银婚"], ["五十周年", 50, "金婚"]];
      var nm = M.filter(function (m) { return m[1] === yrs + 1; })[0];
      return { big: ["在一起", n + " 天"], kv: [["第 " + next100 + " 天", on(next100) + "（还有 " + (next100 - n) + " 天）"], ["下一个周年", iso(anniv) + "（第 " + (yrs + 1) + " 年" + (nm ? " · " + nm[2] : "") + "）"], ["已经", ymd(s, t).join(" 年 ").replace(/ 年 (\d+) 年 (\d+)$/, " 年 $1 个月 $2 天")]] };
    } });

  add({ cat: "date", id: "maternity-leave", name: "产假计算器", desc: "按 98 天国家产假 + 地方奖励假算产假结束日期", kw: "产假 陪产假 生育",
    fields: [{ k: "d", l: "产假开始（生产日）", t: "date", v: "today" }, { k: "x", l: "地方奖励假", u: "天", v: 60, hint: "如北京 60 天、上海 60 天、广东 80 天、四川 60 天，以当地条例为准" }, { k: "e", l: "难产 / 多胞胎额外", t: "sel", o: [[0, "无"], [15, "难产 +15 天"], [15.1, "双胞胎 +15 天"], [30, "难产且双胞胎 +30 天"]], v: 0 }],
    run: function (v) { var s = D(v.d); need(v.x); var n = 98 + v.x + Math.round(v.e), e = new Date(s); e.setDate(e.getDate() + n - 1); return { big: ["产假共", n + " 天"], kv: [["结束日期", iso(e) + " " + WK[e.getDay()]], ["返岗日期", (function () { var r = new Date(e); r.setDate(r.getDate() + 1); return iso(r); })()]], note: "国家规定产假 98 天（产前可休 15 天），难产增加 15 天，多胞胎每多一个增加 15 天。产假按自然日计算，含节假日。" }; } });

  add({ cat: "date", id: "shift-schedule", name: "倒班排班计算器", desc: "按轮班周期（如两班倒、三班倒、做二休一）查某天上什么班", kw: "倒班 排班 轮班",
    fields: [{ k: "s", l: "某个已知是第 1 天的日期", t: "date", v: "2026-10-01" }, { k: "p", l: "轮班顺序（逗号分隔）", t: "text", v: "白, 白, 夜, 夜, 休, 休" }, { k: "q", l: "查询日期", t: "date", v: "today" }],
    run: function (v) {
      var P = String(v.p).split(/[,，、\s]+/).filter(Boolean); if (P.length < 2) throw "至少两个班次"; var s = D(v.s), q = D(v.q), n = dayDiff(s, q), i = ((n % P.length) + P.length) % P.length, rows = [];
      for (var k = 0; k < 14; k++) { var d = new Date(q); d.setDate(d.getDate() + k); rows.push([iso(d), WK[d.getDay()], P[(i + k) % P.length]]); }
      return { big: [iso(q) + " 是", P[i]], table: { h: ["日期", "星期", "班次"], r: rows } };
    } });

  add({ cat: "date", id: "week-number", name: "第几周 / 第几天计算器", desc: "某天是今年第几天、第几周（ISO 周），季度和剩余天数", kw: "第几周 第几天 周数",
    fields: [{ k: "d", l: "日期", t: "date", v: "today" }],
    run: function (v) {
      var d = D(v.d), yr = d.getFullYear(), doy = dayDiff(new Date(yr, 0, 1), d) + 1, leap = new Date(yr, 1, 29).getMonth() === 1;
      var t = new Date(Date.UTC(yr, d.getMonth(), d.getDate())), dn = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dn); var y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)), wk = Math.ceil(((t - y0) / 864e5 + 1) / 7);
      return { big: ["第 " + doy + " 天", "ISO 第 " + wk + " 周"], kv: [["星期", WK[d.getDay()]], ["季度", "第 " + (Math.floor(d.getMonth() / 3) + 1) + " 季度"], ["今年剩余", (leap ? 366 : 365) - doy + " 天"], ["全年进度", pct(doy / (leap ? 366 : 365), 1)]] };
    } });

  add({ cat: "date", id: "work-hours", name: "工时 / 加班费计算器", desc: "按上下班时间算工时，按工作日、休息日、法定节假日算加班费", kw: "工时 加班费 打卡",
    fields: [{ k: "s", l: "月工资（加班费计算基数）", u: "元", v: 8000 }, { k: "a", l: "工作日延时加班", u: "小时", v: 20 }, { k: "b", l: "休息日加班（未补休）", u: "小时", v: 8 }, { k: "c", l: "法定节假日加班", u: "小时", v: 0 }],
    run: function (v) {
      pos(v.s); need(v.a, v.b, v.c); var hr = v.s / 21.75 / 8, A = hr * 1.5 * v.a, B = hr * 2 * v.b, C = hr * 3 * v.c;
      return { big: ["加班费合计", y(A + B + C)], kv: [["小时工资", y(hr)], ["工作日 150%", y(A)], ["休息日 200%", y(B)], ["法定节假日 300%", y(C)]], note: "依据《劳动法》第 44 条，月计薪天数 21.75 天。休息日加班可安排补休代替加班费，法定节假日必须支付 300%。" };
    } });

  add({ cat: "date", id: "holiday-countdown", name: "节日倒计时", desc: "距离元旦、春节、清明、劳动节、端午、中秋、国庆还有几天", kw: "节日 倒计时 春节 国庆",
    fields: [],
    run: function () {
      var t = today(), rows = [];
      function lun(yr, m, d) { return H.lunar2solar(yr, m, d, false); }
      function qm(yr) { var Y = yr - 2000; return new Date(yr, 3, Math.floor(Y * 0.2422 + 4.81) - Math.floor(Y / 4)); }
      var F = [["元旦", function (yr) { return new Date(yr, 0, 1); }], ["春节", function (yr) { return lun(yr, 1, 1); }], ["元宵节", function (yr) { return lun(yr, 1, 15); }], ["清明节", qm], ["劳动节", function (yr) { return new Date(yr, 4, 1); }], ["端午节", function (yr) { return lun(yr, 5, 5); }], ["七夕", function (yr) { return lun(yr, 7, 7); }], ["中秋节", function (yr) { return lun(yr, 8, 15); }], ["国庆节", function (yr) { return new Date(yr, 9, 1); }], ["除夕", function (yr) { var d = lun(yr + 1, 1, 1); if (!d) return null; d.setDate(d.getDate() - 1); return d; }]];
      F.forEach(function (x) { var d = x[1](t.getFullYear()); if (d && d < t) d = x[1](t.getFullYear() + 1); if (d) rows.push([x[0], iso(d) + " " + WK[d.getDay()], dayDiff(t, d)]); });
      rows.sort(function (a, b) { return a[2] - b[2]; });
      return { big: ["下一个节日", rows[0][0] + (rows[0][2] ? " · 还有 " + rows[0][2] + " 天" : " · 就是今天")], table: { h: ["节日", "日期", "还有（天）"], r: rows } };
    } });

  /* ======================= 生活实用 ======================= */
  add({ cat: "life", id: "gas-bill", name: "燃气费 / 水费计算器", desc: "按阶梯价格算燃气费、水费", kw: "燃气费 水费 阶梯",
    fields: [{ k: "t", l: "类型", t: "sel", o: ["燃气（m³）", "水（吨）"] }, { k: "u", l: "本期用量", v: 30 }, { k: "p1", l: "第一档单价", u: "元", v: 2.6 }, { k: "l1", l: "第一档上限（本期）", v: 30 }, { k: "p2", l: "第二档单价", u: "元", v: 3.1 }, { k: "l2", l: "第二档上限（本期）", v: 50 }, { k: "p3", l: "第三档单价", u: "元", v: 3.9 }],
    run: function (v) {
      need(v.u, v.p1, v.l1, v.p2, v.l2, v.p3); var a = Math.min(v.u, v.l1), b = Math.max(Math.min(v.u, v.l2) - v.l1, 0), c = Math.max(v.u - v.l2, 0), tot = a * v.p1 + b * v.p2 + c * v.p3;
      return { big: ["费用", y(tot)], kv: [["第一档", f(a, 2) + " × " + v.p1], ["第二档", f(b, 2) + " × " + v.p2], ["第三档", f(c, 2) + " × " + v.p3], ["平均单价", v.u ? y(tot / v.u) : "—"]], note: "阶梯上限多按年度计算，按月或双月账单时请换算成本期上限。" };
    } });

  add({ cat: "life", id: "ac-cost", name: "电器耗电 / 电费计算器", desc: "按功率和每天使用时长算电器的耗电量和电费", kw: "空调 电费 耗电 功率",
    fields: [{ k: "e", l: "电器", t: "sel", drop: true, o: [[1000, "空调 1.5 匹（平均）"], [150, "冰箱（平均）"], [2000, "电热水器"], [1500, "电暖器"], [100, "电视"], [300, "台式电脑"], [60, "笔记本电脑"], [2000, "电磁炉"], [800, "洗衣机（洗涤）"], [10, "LED 灯"], [0, "自定义"]], v: 1000 }, { k: "w", l: "自定义功率", u: "W", v: 500, show: function (v) { return Number(v.e) === 0; } }, { k: "h", l: "每天使用", u: "小时", v: 8 }, { k: "p", l: "电价", u: "元/度", v: 0.56 }],
    run: function (v) { var w = Number(v.e) || v.w; pos(w); need(v.h, v.p); var kwh = w * v.h / 1000; return { big: ["每月电费", y(kwh * 30 * v.p)], kv: [["每天耗电", f(kwh, 2) + " 度"], ["每天电费", y(kwh * v.p)], ["每年电费", y(kwh * 365 * v.p)]], note: "空调、冰箱是压缩机间歇工作，实际平均功率低于额定功率。" }; } });

  add({ cat: "life", id: "coupon-stack", name: "满减 / 凑单计算器", desc: "多档满减取最优档，算凑单后实际折扣", kw: "满减 凑单 双十一 优惠券",
    fields: [{ k: "p", l: "商品原价合计", u: "元", v: 268 }, { k: "r", l: "满减规则（满X减Y，逗号分隔）", t: "text", v: "200-30, 300-50, 500-100" }, { k: "c", l: "另有无门槛券", u: "元", v: 0 }],
    run: function (v) {
      pos(v.p); need(v.c); var R = String(v.r).split(/[,，;；\s]+/).filter(Boolean).map(function (s) { var m = s.match(/(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/); if (!m) throw "格式如 300-50"; return [+m[1], +m[2]]; }).sort(function (a, b) { return a[0] - b[0]; });
      var hit = R.filter(function (r) { return v.p >= r[0]; }).pop(), off = hit ? hit[1] : 0, pay = Math.max(v.p - off - v.c, 0), next = R.filter(function (r) { return v.p < r[0]; })[0];
      var kv = [["适用档位", hit ? "满 " + hit[0] + " 减 " + hit[1] : "未达门槛"], ["实际折扣", f(pay / v.p * 10, 2) + " 折"]];
      if (next) { var payN = Math.max(next[0] - next[1] - v.c, 0); kv.push(["凑到 " + next[0] + " 元", "还差 " + y(next[0] - v.p) + "，付 " + y(payN) + (payN - pay < next[0] - v.p ? "（多买 " + y(next[0] - v.p) + " 东西只多付 " + y(payN - pay) + "）" : "")]); }
      return { big: ["到手价", y(pay)], kv: kv };
    } });

  add({ cat: "life", id: "dough-ratio", name: "烘焙面团配比计算器", desc: "按烘焙百分比算面粉、水、盐、酵母用量", kw: "烘焙 面包 披萨 含水量",
    fields: [{ k: "f", l: "面粉", u: "g", v: 500 }, { k: "w", l: "含水量", u: "%", v: 65 }, { k: "s", l: "盐", u: "%", v: 2 }, { k: "y", l: "干酵母", u: "%", v: 1 }, { k: "su", l: "糖", u: "%", v: 0 }, { k: "o", l: "油 / 黄油", u: "%", v: 0 }],
    run: function (v) {
      pos(v.f); need(v.w, v.s, v.y, v.su, v.o); var x = function (p) { return f(v.f * p / 100, 1) + " g"; }, tot = v.f * (100 + v.w + v.s + v.y + v.su + v.o) / 100;
      return { table: { h: ["材料", "用量"], r: [["面粉", f(v.f, 0) + " g"], ["水", x(v.w)], ["盐", x(v.s)], ["干酵母", x(v.y)], ["糖", x(v.su)], ["油 / 黄油", x(v.o)]] }, kv: [["面团总重", f(tot, 0) + " g"]], note: "参考：吐司 60%–65%，法棍 68%–75%，披萨 60%–65%。用鲜酵母时用量约为干酵母 3 倍。" };
    } });

  add({ cat: "life", id: "delivery-membership", name: "会员回本计算器", desc: "外卖、视频、超市会员按月使用次数算多久回本", kw: "会员 回本 外卖 88vip",
    fields: [{ k: "p", l: "会员费", u: "元", v: 15 }, { k: "per", l: "会员周期", t: "sel", o: [[1, "每月"], [3, "每季"], [12, "每年"]], v: 1 }, { k: "s", l: "每次能省", u: "元", v: 3 }, { k: "n", l: "每月使用次数", u: "次", v: 8 }],
    run: function (v) { pos(v.p, v.s); need(v.n); var mon = v.p / v.per, save = v.s * v.n, need0 = Math.ceil(mon / v.s); return { big: [save >= mon ? "划算" : "不划算", "每月净省 " + y(save - mon)], kv: [["每月会员成本", y(mon)], ["每月省下", y(save)], ["每月至少用", need0 + " 次才回本"]] }; } });

  add({ cat: "life", id: "freelance-income", name: "自由职业定价计算器", desc: "按目标年收入、可计费时长和成本反推时薪 / 日薪", kw: "自由职业 接单 报价 时薪",
    fields: [{ k: "t", l: "目标年收入（到手）", u: "元", v: 240000 }, { k: "c", l: "每年成本（社保、设备、软件）", u: "元", v: 30000 }, { k: "w", l: "每年工作周数", u: "周", v: 46 }, { k: "h", l: "每周可计费时长", u: "小时", v: 25 }, { k: "tax", l: "综合税费", u: "%", v: 10 }],
    run: function (v) { pos(v.t, v.w, v.h); need(v.c, v.tax); var gross = (v.t + v.c) / (1 - v.tax / 100), hrs = v.w * v.h, hr = gross / hrs; return { big: ["最低时薪", y(hr)], kv: [["日薪（8 小时）", y(hr * 8)], ["每年需开票", wy(gross)], ["每年可计费时长", hrs + " 小时"]], note: "自由职业通常只有 50%–70% 的时间能计费（沟通、找客户、休假不计费）。" }; } });

  add({ cat: "life", id: "phone-plan", name: "手机套餐对比", desc: "两个套餐按你的流量、通话用量比较每月实际花费", kw: "套餐 运营商 流量",
    fields: [{ k: "gb", l: "每月流量", u: "GB", v: 40 }, { k: "min", l: "每月通话", u: "分钟", v: 200 },
      { k: "a", l: "套餐 A 月费", u: "元", v: 59 }, { k: "ag", l: "A 含流量", u: "GB", v: 30 }, { k: "am", l: "A 含通话", u: "分钟", v: 100 },
      { k: "b", l: "套餐 B 月费", u: "元", v: 79 }, { k: "bg", l: "B 含流量", u: "GB", v: 60 }, { k: "bm", l: "B 含通话", u: "分钟", v: 300 },
      { k: "eg", l: "超出流量单价", u: "元/GB", v: 3 }, { k: "em", l: "超出通话单价", u: "元/分钟", v: 0.15 }],
    run: function (v) {
      need(v.gb, v.min, v.a, v.ag, v.am, v.b, v.bg, v.bm, v.eg, v.em);
      function cost(p, gb, mi) { return p + Math.max(v.gb - gb, 0) * v.eg + Math.max(v.min - mi, 0) * v.em; }
      var A = cost(v.a, v.ag, v.am), B = cost(v.b, v.bg, v.bm);
      return { big: ["更划算", A <= B ? "套餐 A" : "套餐 B"], kv: [["套餐 A 实付", y(A)], ["套餐 B 实付", y(B)], ["每年相差", y(Math.abs(A - B) * 12)]] };
    } });

  add({ cat: "life", id: "egg-boiling", name: "煮蛋时间计算器", desc: "按蛋的大小、初始温度和想要的熟度给出煮制时间", kw: "煮鸡蛋 溏心蛋 温泉蛋",
    fields: [{ k: "d", l: "熟度", t: "sel", drop: true, o: [[6, "溏心（流心）"], [7.5, "半熟（蛋黄软糯）"], [10, "全熟"], [13, "老一点"]], v: 7.5 }, { k: "s", l: "鸡蛋大小", t: "sel", o: [[-0.5, "小（< 50g）"], [0, "中（50–60g）"], [1, "大（> 60g）"]], v: 0 }, { k: "c", l: "鸡蛋来自", t: "sel", o: [[1, "冰箱冷藏"], [0, "室温"]], v: 1 }],
    run: function (v) { var m = v.d + v.s + v.c; return { big: ["沸水下锅煮", Math.floor(m) + " 分 " + (m % 1 ? "30 秒" : "0 秒")], note: "水开后用勺子轻放入鸡蛋，计时结束立刻捞出放冰水 2 分钟，好剥壳也能停止加热。" }; } });

  /* ======================= 教育学业 ======================= */
  add({ cat: "edu", id: "kaoyan-retest", name: "考研复试 / 综合成绩", desc: "初试、复试按权重算总成绩", kw: "考研 复试 总成绩",
    fields: [{ k: "a", l: "初试成绩", v: 380 }, { k: "af", l: "初试满分", v: 500 }, { k: "aw", l: "初试权重", u: "%", v: 60 }, { k: "b", l: "复试成绩", v: 85 }, { k: "bf", l: "复试满分", v: 100 }],
    run: function (v) { need(v.a, v.aw, v.b); pos(v.af, v.bf); var t = v.a / v.af * 100 * v.aw / 100 + v.b / v.bf * 100 * (1 - v.aw / 100); return { big: ["综合成绩（百分制）", f(t, 2)], kv: [["初试折算", f(v.a / v.af * v.aw, 2)], ["复试折算", f(v.b / v.bf * (100 - v.aw), 2)]], note: "复试权重一般为 30%–50%，以报考院校当年复试细则为准。" }; } });

  add({ cat: "edu", id: "vocab-plan", name: "背单词计划计算器", desc: "按词汇量、考试日期和复习轮数算每天背多少", kw: "背单词 四级 六级 考研词汇",
    fields: [{ k: "n", l: "词汇总量", u: "个", v: 4500 }, { k: "k", l: "已掌握", u: "个", v: 1500 }, { k: "d", l: "考试日期", t: "date", v: "2026-12-12" }, { k: "r", l: "计划复习轮数", v: 3 }],
    run: function (v) {
      pos(v.n, v.r); need(v.k); var days = dayDiff(today(), D(v.d)); if (days <= 0) throw "考试日期需在今天之后"; var left = Math.max(v.n - v.k, 0), learn = Math.max(days - 14, 1);
      return { big: ["每天新学", Math.ceil(left / learn * 1) + " 个"], kv: [["距考试", days + " 天"], ["每天总量（含复习）", Math.ceil(left * v.r / learn) + " 个"], ["新词学完日期", (function () { var x = today(); x.setDate(x.getDate() + learn); return iso(x); })()]], note: "最后两周留作冲刺复习。四级约 4500 词，六级约 6000 词，考研约 5500 词。" };
    } });

  add({ cat: "edu", id: "gaokao-scaled", name: "新高考赋分计算器", desc: "选考科目按等级比例赋分（等比例转换）", kw: "新高考 赋分 等级赋分",
    fields: [{ k: "x", l: "原始分", v: 72 }, { k: "lo", l: "所在等级原始分下限", v: 68 }, { k: "hi", l: "所在等级原始分上限", v: 79 }, { k: "g", l: "所在等级", t: "sel", drop: true, o: [["86-100", "A 等（86–100）"], ["71-85", "B 等（71–85）"], ["56-70", "C 等（56–70）"], ["41-55", "D 等（41–55）"], ["30-40", "E 等（30–40）"]], v: "71-85" }],
    run: function (v) {
      need(v.x, v.lo, v.hi); if (v.hi <= v.lo) throw "等级上限需大于下限"; if (v.x < v.lo || v.x > v.hi) throw "原始分需在所在等级区间内"; var t = String(v.g).split("-").map(Number);
      var s = t[0] + (v.x - v.lo) * (t[1] - t[0]) / (v.hi - v.lo);
      return { big: ["赋分", Math.round(s) + " 分"], kv: [["精确值", f(s, 2)]], note: "“3+1+2”模式下再选科目（化学、生物、政治、地理）按 A 15%、B 35%、C 35%、D 13%、E 2% 划等级，再按公式 (Y2−Y)/(Y−Y1) = (T2−T)/(T−T1) 转换，四舍五入取整。" };
    } });

  add({ cat: "edu", id: "word-count", name: "字数统计 / 论文页数", desc: "统计中英文字数、字符数、段落数，估算页数", kw: "字数 统计 论文 页数",
    fields: [{ k: "t", l: "粘贴文本", t: "area", v: "在这里粘贴你的文章。Hark 会统计中文字数、英文单词数和字符数。" }],
    run: function (v) {
      var s = String(v.t || ""), cn = (s.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length, en = (s.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length, num = (s.match(/\d+(?:\.\d+)?/g) || []).length;
      var punc = (s.match(/[，。！？、；：“”‘’（）《》【】…—,.!?;:'"()\[\]]/g) || []).length, paras = s.split(/\n\s*\n|\n/).filter(function (p) { return p.trim(); }).length, words = cn + en + num;
      return { big: ["字数（Word 口径）", words], kv: [["中文字", cn], ["英文单词", en], ["标点", punc], ["字符（不含空格）", s.replace(/\s/g, "").length], ["段落", paras], ["约合 A4 页（小四单倍行距）", f(words / 800, 1) + " 页"]] };
    } });

  add({ cat: "edu", id: "fitness-test", name: "大学体测 BMI / 肺活量评分", desc: "按《国家学生体质健康标准》大学组估算 BMI 和肺活量单项分", kw: "体测 肺活量 大学",
    fields: [{ k: "s", l: "性别", t: "sel", o: ["男", "女"] }, { k: "h", l: "身高", u: "cm", v: 175 }, { k: "w", l: "体重", u: "kg", v: 65 }, { k: "v", l: "肺活量", u: "ml", v: 4200 }],
    run: function (v) {
      pos(v.h, v.w, v.v); var m = v.s === "男", b = v.w / Math.pow(v.h / 100, 2), bs;
      if (m) bs = b <= 17.8 ? 80 : b <= 23.9 ? 100 : b <= 27.9 ? 80 : 60; else bs = b <= 17.1 ? 80 : b <= 23.9 ? 100 : b <= 27.9 ? 80 : 60;
      var T = m ? [[5040, 100], [4920, 95], [4800, 90], [4550, 85], [4300, 80], [4180, 78], [4060, 76], [3940, 74], [3820, 72], [3700, 70], [3580, 68], [3460, 66], [3340, 64], [3220, 62], [3100, 60], [2940, 50], [2780, 40], [2620, 30], [2460, 20], [2300, 10]]
        : [[3400, 100], [3350, 95], [3300, 90], [3150, 85], [3000, 80], [2900, 78], [2800, 76], [2700, 74], [2600, 72], [2500, 70], [2400, 68], [2300, 66], [2200, 64], [2100, 62], [2000, 60], [1960, 50], [1920, 40], [1880, 30], [1840, 20], [1800, 10]];
      var vs = (T.filter(function (t) { return v.v >= t[0]; })[0] || [0, 0])[1];
      return { kv: [["BMI", f(b, 1) + "（" + bs + " 分，" + (bs === 100 ? "正常" : b < 18 ? "低体重" : b >= 28 ? "肥胖" : "超重") + "）"], ["肺活量单项分", vs + " 分"], ["加权（BMI 15% + 肺活量 15%）", f(bs * .15 + vs * .15, 1) + " / 30"]], note: "按大一、大二标准。其余项目（50 米、立定跳远、坐位体前屈、长跑、引体 / 仰卧起坐）需另计。" };
    } });

  /* ======================= 商业财税 ======================= */
  add({ cat: "biz", id: "tax-exclusive", name: "价税分离 / 含税价换算", desc: "含税价拆分不含税价和税额，或不含税价加税", kw: "价税分离 含税 不含税 开票",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["含税价", "不含税价"] }, { k: "x", l: "金额", u: "元", v: 11300 }, { k: "r", l: "税率", t: "sel", o: [[13, "13%"], [9, "9%"], [6, "6%"], [3, "3%"], [1, "1%"]], v: 13 }],
    run: function (v) { pos(v.x); var ex = v.m === "含税价" ? v.x / (1 + v.r / 100) : v.x, tax = ex * v.r / 100; return { big: [v.m === "含税价" ? "不含税价" : "含税价", y(v.m === "含税价" ? ex : ex + tax)], kv: [["税额", y(tax)], ["税率", v.r + "%"]] }; } });

  add({ cat: "biz", id: "customs-duty", name: "进口关税 / 行邮税计算器", desc: "个人行李邮递物品行邮税（13% / 20% / 50%）", kw: "行邮税 关税 代购 入境",
    fields: [{ k: "p", l: "完税价格", u: "元", v: 3000 }, { k: "r", l: "税率档", t: "sel", drop: true, o: [[13, "13%：书报、食品、金银、家具、电子产品、药品"], [20, "20%：运动用品、钓具、纺织品、电器"], [50, "50%：烟、酒、贵重首饰、高档化妆品"]], v: 20 }, { k: "w", l: "入境方式", t: "sel", o: ["邮寄 / 快递", "旅客行李"] }],
    run: function (v) {
      pos(v.p); var tax = v.p * v.r / 100;
      if (v.w === "邮寄 / 快递") return { big: [tax <= 50 ? "免征" : "应缴行邮税", tax <= 50 ? "税额 ≤ 50 元" : y(tax)], kv: [["计算税额", y(tax)]], note: "个人邮递物品应征税额 50 元以下免征；个人寄自港澳台每次限值 800 元，其他地区 1000 元。" };
      return { big: [v.p <= 5000 ? "免税额度内" : "超出部分征税", v.p <= 5000 ? "无需缴税" : y((v.p - 5000) * v.r / 100)], note: "居民旅客境外获取的自用物品总值 5000 元以内免税（另可在口岸免税店购买 3000 元）。超出部分按单件计征，单一品种自用可整体免税的除外。" };
    } });

  add({ cat: "biz", id: "ltv-cac", name: "LTV / CAC 计算器", desc: "客户终身价值、获客成本和回本周期", kw: "ltv cac 获客 留存",
    fields: [{ k: "a", l: "每用户每月收入 ARPU", u: "元", v: 50 }, { k: "g", l: "毛利率", u: "%", v: 70 }, { k: "c", l: "月流失率", u: "%", v: 5 }, { k: "s", l: "营销总支出", u: "元", v: 100000 }, { k: "n", l: "新增客户数", v: 500 }],
    run: function (v) {
      pos(v.a, v.c, v.n); need(v.g, v.s); var life = 100 / v.c, ltv = v.a * v.g / 100 * life, cac = v.s / v.n;
      return { big: ["LTV / CAC", f(ltv / cac, 2)], tag: ltv / cac >= 3 ? "健康" : ltv / cac >= 1 ? "偏低" : "亏损获客", kv: [["LTV", y(ltv)], ["CAC", y(cac)], ["平均生命周期", f(life, 1) + " 个月"], ["回本周期", f(cac / (v.a * v.g / 100), 1) + " 个月"]], note: "一般认为 LTV/CAC ≥ 3、回本周期 ≤ 12 个月较健康。" };
    } });

  add({ cat: "biz", id: "inventory-turnover", name: "库存周转率计算器", desc: "库存周转次数、周转天数和安全库存", kw: "库存 周转 进销存",
    fields: [{ k: "c", l: "期间销售成本", u: "元", v: 1200000 }, { k: "a", l: "期初库存", u: "元", v: 200000 }, { k: "b", l: "期末库存", u: "元", v: 160000 }, { k: "d", l: "期间天数", u: "天", v: 365 }],
    run: function (v) { pos(v.c, v.d); need(v.a, v.b); var avg = (v.a + v.b) / 2; pos(avg); var t = v.c / avg; return { big: ["周转率", f(t, 2) + " 次"], kv: [["周转天数", f(v.d / t, 1) + " 天"], ["平均库存", y(avg)]] }; } });

  add({ cat: "biz", id: "commission", name: "阶梯提成计算器", desc: "按销售额分段累进或全额计提提成", kw: "提成 佣金 销售",
    fields: [{ k: "s", l: "销售额", u: "元", v: 180000 }, { k: "r", l: "阶梯（上限:比例%，逗号分隔，最后一档上限可写 0）", t: "text", v: "50000:2, 100000:3, 0:5" }, { k: "m", l: "计算方式", t: "sel", o: ["超额累进", "全额按所达档位"] }],
    run: function (v) {
      need(v.s); var T = String(v.r).split(/[,，;；\s]+/).filter(Boolean).map(function (x) { var m = x.split(/[:：]/).map(Number); if (m.length !== 2 || m.some(isNaN)) throw "格式如 50000:2"; return [m[0] || Infinity, m[1]]; });
      var rows = [], tot = 0, prev = 0;
      if (v.m === "超额累进") T.forEach(function (t) { var part = Math.max(Math.min(v.s, t[0]) - prev, 0); if (part > 0) { rows.push([f(prev, 0) + " – " + (t[0] === Infinity ? "以上" : f(t[0], 0)), t[1] + "%", f(part * t[1] / 100)]); tot += part * t[1] / 100; } prev = t[0]; });
      else { var hit = T.filter(function (t) { return v.s <= t[0]; })[0] || T[T.length - 1]; tot = v.s * hit[1] / 100; rows.push(["全额", hit[1] + "%", f(tot)]); }
      return { big: ["提成", y(tot)], kv: [["综合提成比例", v.s ? pct(tot / v.s) : "—"]], table: { h: ["区间", "比例", "提成（元）"], r: rows } };
    } });

  add({ cat: "biz", id: "gross-margin-pricing", name: "定价 / 加价率计算器", desc: "按成本和目标毛利率定价，毛利率与加价率互换", kw: "定价 加价率 毛利率 成本加成",
    fields: [{ k: "c", l: "成本", u: "元", v: 60 }, { k: "m", l: "已知", t: "sel", o: ["目标毛利率", "加价率"] }, { k: "x", l: "比例", u: "%", v: 40 }],
    run: function (v) {
      pos(v.c); need(v.x); var p; if (v.m === "目标毛利率") { if (v.x >= 100) throw "毛利率需小于 100%"; p = v.c / (1 - v.x / 100); } else p = v.c * (1 + v.x / 100);
      return { big: ["建议售价", y(p)], kv: [["毛利", y(p - v.c)], ["毛利率", pct((p - v.c) / p)], ["加价率", pct((p - v.c) / v.c)]] };
    } });

  add({ cat: "biz", id: "small-taxpayer", name: "小规模纳税人增值税", desc: "按季度销售额判断是否免征，算 1% 征收率应纳税额", kw: "小规模 增值税 免税 1%",
    fields: [{ k: "s", l: "本季度含税销售额", u: "元", v: 400000 }, { k: "r", l: "征收率", t: "sel", o: [[1, "1%（减按）"], [3, "3%"], [5, "5%（不动产）"]], v: 1 }, { k: "sp", l: "其中开具增值税专票的含税额", u: "元", v: 0 }],
    run: function (v) {
      need(v.s, v.sp); var ex = v.s / (1 + v.r / 100);
      if (ex <= 300000 && v.r !== 5) { var spTax = v.sp / (1 + v.r / 100) * v.r / 100; return { big: ["季度销售额未超 30 万", spTax ? "仅专票部分纳税 " + y(spTax) : "免征增值税"], kv: [["不含税销售额", y(ex)]], note: "小规模纳税人月销售额 10 万元（季度 30 万元）以下免征增值税，开具专票的部分需缴税。政策执行至 2027 年 12 月 31 日。" }; }
      var tax = ex * v.r / 100; return { big: ["应纳增值税", y(tax)], kv: [["不含税销售额", y(ex)], ["附加税（减半，市区）", y(tax * .12 * .5)]] };
    } });

  /* ======================= 工程建筑 ======================= */
  add({ cat: "build", id: "reno-budget", name: "装修预算计算器", desc: "按面积和装修档次估算硬装、软装、家电预算", kw: "装修 预算 硬装 软装",
    fields: [{ k: "a", l: "套内面积", u: "㎡", v: 90 }, { k: "l", l: "档次", t: "sel", o: [[1000, "简装"], [1600, "中档"], [2800, "中高档"], [4500, "高档"]], v: 1600 }, { k: "c", l: "城市", t: "sel", o: [[1.2, "一线"], [1, "二线"], [0.85, "三四线"]], v: 1 }],
    run: function (v) {
      pos(v.a); var hard = v.a * v.l * v.c, soft = hard * .35, app = hard * .2, tot = hard + soft + app;
      return { big: ["总预算约", wy(tot * 1.1)], table: { h: ["项目", "金额", "占比"], r: [["硬装（水电、泥瓦、木作、油漆）", f(hard, 0), pct(hard / tot, 0)], ["软装（家具、窗帘、灯具）", f(soft, 0), pct(soft / tot, 0)], ["家电", f(app, 0), pct(app / tot, 0)], ["预留 10% 超支", f(tot * .1, 0), "—"]] } };
    } });

  add({ cat: "build", id: "earthwork", name: "土方量计算器", desc: "基坑（含放坡）开挖土方量和运输车次", kw: "土方 基坑 挖方",
    fields: [{ k: "l", l: "坑底长", u: "m", v: 20 }, { k: "w", l: "坑底宽", u: "m", v: 10 }, { k: "h", l: "开挖深度", u: "m", v: 3 }, { k: "k", l: "放坡系数（1:k，0 为直壁）", v: 0.5 }, { k: "s", l: "松散系数", v: 1.3 }, { k: "t", l: "每车方量", u: "m³", v: 15 }],
    run: function (v) {
      pos(v.l, v.w, v.h); need(v.k, v.s, v.t); var L2 = v.l + 2 * v.k * v.h, W2 = v.w + 2 * v.k * v.h, A1 = v.l * v.w, A2 = L2 * W2, V = v.h / 6 * (A1 + A2 + (v.l + L2) * (v.w + W2)), loose = V * v.s;
      return { big: ["挖方量（自然方）", f(V, 1) + " m³"], kv: [["松方量", f(loose, 1) + " m³"], ["运输车次", v.t > 0 ? Math.ceil(loose / v.t) + " 车" : "—"], ["坑口尺寸", f(L2, 2) + " × " + f(W2, 2) + " m"]] };
    } });

  add({ cat: "build", id: "rebar", name: "钢筋重量计算器", desc: "按直径和长度算钢筋重量（0.00617 × d²）", kw: "钢筋 重量 螺纹钢",
    fields: [{ k: "d", l: "直径", u: "mm", v: 12 }, { k: "l", l: "单根长度", u: "m", v: 9 }, { k: "n", l: "根数", v: 100 }, { k: "p", l: "单价（可选）", u: "元/吨", v: 3500 }],
    run: function (v) { pos(v.d, v.l, v.n); need(v.p); var per = 0.00617 * v.d * v.d, t = per * v.l * v.n; return { big: ["总重量", f(t, 1) + " kg"], kv: [["每米重量", f(per, 3) + " kg/m"], ["约合", f(t / 1000, 3) + " 吨"], ["金额", v.p ? y(t / 1000 * v.p) : "—"]] }; } });

  add({ cat: "build", id: "curtain-fabric", name: "窗帘用布计算器", desc: "按窗宽、窗高和褶皱倍数算布料米数", kw: "窗帘 布料 褶皱",
    fields: [{ k: "w", l: "窗帘轨道长度", u: "m", v: 2.4 }, { k: "h", l: "窗帘高度", u: "m", v: 2.6 }, { k: "k", l: "褶皱倍数", t: "sel", o: [[1.5, "1.5 倍（简洁）"], [2, "2 倍（常用）"], [2.5, "2.5 倍（饱满）"]], v: 2 }, { k: "b", l: "布幅宽", t: "sel", o: [[2.8, "定高布 2.8 m（横向用）"], [1.45, "定宽布 1.45 m（竖向拼接）"]], v: 2.8 }],
    run: function (v) {
      pos(v.w, v.h); var need0 = v.w * v.k;
      if (v.b === 2.8) { if (v.h > 2.6 + 1e-9) return { big: ["布高不够", "改用定宽布"], note: "定高布高度 2.8 m，窗帘高度加上下折边超过 2.8 m 需要拼接。" }; return { big: ["需要布料", f(need0 + 0.2, 2) + " 米"], note: "定高布按横向长度购买，已加 0.2 m 侧边余量。" }; }
      var pieces = Math.ceil(need0 / 1.45); return { big: ["需要布料", f(pieces * (v.h + 0.3), 2) + " 米"], kv: [["拼接幅数", pieces + " 幅"]], note: "每幅加 0.3 m 上下折边。有花型对花时需再加一个花距。" };
    } });

  add({ cat: "build", id: "tile-adhesive", name: "瓷砖胶 / 美缝剂用量", desc: "按铺贴面积算瓷砖胶，按砖尺寸和缝宽算美缝剂", kw: "瓷砖胶 美缝 填缝",
    fields: [{ k: "a", l: "铺贴面积", u: "㎡", v: 30 }, { k: "t", l: "瓷砖胶用量", u: "kg/㎡", v: 5, hint: "薄贴约 4–6 kg/㎡，大板 6–8 kg/㎡" }, { k: "L", l: "砖长", u: "mm", v: 800 }, { k: "W", l: "砖宽", u: "mm", v: 800 }, { k: "j", l: "缝宽", u: "mm", v: 2 }, { k: "d", l: "缝深", u: "mm", v: 3 }],
    run: function (v) {
      pos(v.a, v.t, v.L, v.W, v.j, v.d); var glue = v.a * v.t, perM2 = (v.L + v.W) / (v.L * v.W) * v.j * v.d * 1.6, grout = v.a * perM2 * 1.1;
      return { big: ["瓷砖胶", f(glue, 0) + " kg（约 " + Math.ceil(glue / 20) + " 袋 20kg）"], kv: [["美缝剂", f(grout, 2) + " kg"], ["约合 400ml 支装", Math.ceil(grout / 0.6) + " 支"]], note: "美缝剂密度按 1.6 g/cm³，含 10% 损耗。" };
    } });

  add({ cat: "build", id: "lighting-watt", name: "照明 / 灯具瓦数计算器", desc: "按房间面积和用途算所需流明与 LED 瓦数", kw: "灯 照明 流明 瓦数",
    fields: [{ k: "a", l: "房间面积", u: "㎡", v: 20 }, { k: "r", l: "房间", t: "sel", drop: true, o: [[150, "客厅"], [100, "卧室"], [300, "书房 / 工作区"], [150, "餐厅"], [200, "厨房"], [100, "卫生间"]], v: 150 }],
    run: function (v) { pos(v.a); var lm = v.a * v.r / 0.7; return { big: ["需要光通量", f(lm, 0) + " 流明"], kv: [["约合 LED", f(lm / 100, 0) + " W（按 100 lm/W）"], ["照度目标", v.r + " lux"]], note: "照度参考《建筑照明设计标准》GB 50034，已考虑约 70% 利用系数。" }; } });

  add({ cat: "build", id: "socket-count", name: "开关插座数量参考", desc: "按户型各房间给出插座、开关的参考数量", kw: "插座 开关 水电 装修",
    fields: [{ k: "b", l: "卧室数量", v: 3 }, { k: "l", l: "卫生间数量", v: 2 }, { k: "bal", l: "阳台数量", v: 1 }],
    run: function (v) {
      need(v.b, v.l, v.bal); var R = [["客厅", 10, 3], ["餐厅", 4, 1], ["厨房", 10, 2], ["卧室 × " + v.b, 7 * v.b, 3 * v.b], ["卫生间 × " + v.l, 4 * v.l, 2 * v.l], ["阳台 × " + v.bal, 2 * v.bal, 1 * v.bal], ["玄关 / 走廊", 2, 2]];
      var s = R.reduce(function (a, r) { return a + r[1]; }, 0), k = R.reduce(function (a, r) { return a + r[2]; }, 0);
      return { big: ["插座约", s + " 个 · 开关约 " + k + " 个"], table: { h: ["区域", "插座", "开关"], r: R.map(function (r) { return [r[0], r[1], r[2]]; }) }, note: "插座宁多勿少：床头两侧、电视墙、厨房台面每 60–80 cm 一个，卫生间用防溅盒。" };
    } });

  /* ======================= 科学工程 ======================= */
  add({ cat: "science", id: "capacitor", name: "电容 / RC 时间常数", desc: "串并联电容、RC 充放电时间常数与电压", kw: "电容 rc 时间常数 充电",
    fields: [{ k: "c", l: "电容（逗号分隔多个）", u: "μF", t: "text", v: "10, 22" }, { k: "m", l: "连接", t: "sel", o: ["并联", "串联"] }, { k: "r", l: "电阻（算 RC）", u: "kΩ", v: 10 }, { k: "v", l: "电源电压", u: "V", v: 5 }],
    run: function (v) {
      var C = nums(v.c); if (C.some(function (x) { return x <= 0; })) throw "电容需为正数"; var tot = v.m === "并联" ? C.reduce(function (a, b) { return a + b; }) : 1 / C.reduce(function (a, b) { return a + 1 / b; }, 0);
      var tau = ok(v.r) && v.r > 0 ? v.r * 1e3 * tot * 1e-6 : 0;
      return { big: ["总电容", g(tot, 6) + " μF"], kv: [["时间常数 τ", tau ? g(tau * 1000, 5) + " ms" : "—"], ["充到 63%", tau ? g(tau * 1000, 5) + " ms" : "—"], ["充到 99%（5τ）", tau ? g(tau * 5000, 5) + " ms" : "—"], ["储能（满电）", ok(v.v) ? g(0.5 * tot * 1e-6 * v.v * v.v * 1000, 5) + " mJ" : "—"]] };
    } });

  add({ cat: "science", id: "battery-life", name: "电池续航 / 充电宝容量", desc: "按电池容量和负载电流算续航；充电宝能充几次手机", kw: "电池 续航 mah 充电宝",
    fields: [{ k: "m", l: "计算", t: "sel", o: ["设备续航", "充电宝能充几次"] }, { k: "c", l: "电池 / 充电宝容量", u: "mAh", v: 20000 }, { k: "v", l: "电池电压", u: "V", v: 3.7 }, { k: "i", l: "负载电流", u: "mA", v: 200, show: function (v) { return v.m === "设备续航"; } }, { k: "p", l: "手机电池容量", u: "mAh", v: 5000, show: function (v) { return v.m !== "设备续航"; } }, { k: "e", l: "转换效率", u: "%", v: 85 }],
    run: function (v) {
      pos(v.c, v.v, v.e); var wh = v.c * v.v / 1000;
      if (v.m === "设备续航") { pos(v.i); var h = v.c / v.i * v.e / 100; return { big: ["续航约", h >= 48 ? f(h / 24, 1) + " 天" : f(h, 1) + " 小时"], kv: [["电池能量", f(wh, 2) + " Wh"]] }; }
      pos(v.p); var n = wh * v.e / 100 / (v.p * 3.85 / 1000); return { big: ["约可充满", f(n, 1) + " 次"], kv: [["充电宝能量", f(wh, 1) + " Wh"], ["能否带上飞机", wh <= 100 ? "可以（≤ 100 Wh）" : wh <= 160 ? "需航司批准（100–160 Wh）" : "禁止（> 160 Wh）"]], note: "民航规定：充电宝只能随身携带不可托运；2025 年 6 月起国内航班须带 3C 标识。" };
    } });

  add({ cat: "science", id: "pressure-sci", name: "压强 / 液体压强计算器", desc: "p = F/S 与液体压强 p = ρgh", kw: "压强 液体压强 帕斯卡",
    fields: [{ k: "m", l: "类型", t: "sel", o: ["固体 p = F/S", "液体 p = ρgh"] }, { k: "a", l: "压力 F (N) / 液体密度 ρ (kg/m³)", v: 1000 }, { k: "b", l: "受力面积 S (m²) / 深度 h (m)", v: 10 }],
    run: function (v) { pos(v.a, v.b); var p = v.m[0] === "固" ? v.a / v.b : v.a * 9.8 * v.b; return { big: ["压强", g(p, 6) + " Pa"], kv: [["千帕", g(p / 1000, 6) + " kPa"], ["标准大气压", g(p / 101325, 6) + " atm"], ["米水柱", g(p / 9806.65, 6) + " mH₂O"]] }; } });

  add({ cat: "science", id: "momentum-energy", name: "动量 / 功 / 功率", desc: "动量 p = mv，功 W = Fs，功率 P = W/t", kw: "动量 功 功率 物理",
    fields: [{ k: "m", l: "质量", u: "kg", v: 60 }, { k: "v", l: "速度", u: "m/s", v: 5 }, { k: "F", l: "力", u: "N", v: 100 }, { k: "s", l: "位移", u: "m", v: 20 }, { k: "t", l: "时间", u: "s", v: 10 }],
    run: function (v) { need(v.m, v.v, v.F, v.s); var W = v.F * v.s; return { kv: [["动量 p = mv", g(v.m * v.v, 6) + " kg·m/s"], ["动能 ½mv²", g(.5 * v.m * v.v * v.v, 6) + " J"], ["功 W = Fs", g(W, 6) + " J"], ["功率 P = W/t", ok(v.t) && v.t > 0 ? g(W / v.t, 6) + " W" : "—"]] }; } });

  add({ cat: "science", id: "lens", name: "透镜成像计算器", desc: "1/f = 1/u + 1/v，求像距、放大率和像的性质", kw: "透镜 凸透镜 焦距 成像",
    fields: [{ k: "f", l: "焦距 f（凸透镜为正，凹透镜为负）", u: "cm", v: 10 }, { k: "u", l: "物距 u", u: "cm", v: 30 }],
    run: function (v) {
      pos(v.u); need(v.f); if (!v.f) throw "焦距不能为 0"; if (v.u === v.f) return { big: ["不成像", "物体在焦点上"] };
      var im = 1 / (1 / v.f - 1 / v.u), m = -im / v.u, real = im > 0;
      return { big: ["像距", g(im, 5) + " cm"], kv: [["放大率", g(Math.abs(m), 4) + " 倍"], ["像的性质", (real ? "倒立、实像" : "正立、虚像") + "、" + (Math.abs(m) > 1 ? "放大" : Math.abs(m) < 1 ? "缩小" : "等大")]] };
    } });

  add({ cat: "science", id: "transformer-ratio", name: "变压器匝数比计算器", desc: "U₁/U₂ = N₁/N₂，求匝数、电压、电流", kw: "变压器 匝数 线圈",
    fields: [{ k: "u1", l: "初级电压", u: "V", v: 220 }, { k: "u2", l: "次级电压", u: "V", v: 12 }, { k: "n1", l: "初级匝数", v: 1100 }, { k: "i2", l: "次级电流", u: "A", v: 2 }],
    run: function (v) { pos(v.u1, v.u2, v.n1); need(v.i2); var k = v.u1 / v.u2; return { big: ["次级匝数", f(v.n1 / k, 0) + " 匝"], kv: [["匝数比", g(k, 5) + " : 1"], ["初级电流（理想）", g(v.i2 / k, 5) + " A"], ["功率", g(v.u2 * v.i2, 5) + " W"]] }; } });

  add({ cat: "science", id: "light-distance", name: "光速 / 声速距离计算", desc: "按时间算光或声音传播距离；打雷时估算雷电距离", kw: "光速 声速 打雷 光年",
    fields: [{ k: "m", l: "类型", t: "sel", o: ["声音（空气 15℃）", "光（真空）"] }, { k: "t", l: "时间", u: "秒", v: 3 }],
    run: function (v) { pos(v.t); var sp = v.m[0] === "声" ? 340 : 299792458, d = sp * v.t; return { big: ["距离", d >= 1e9 ? g(d / 1e3, 6) + " km" : g(d, 6) + " m"], kv: [["约合", d >= 1e15 ? g(d / 9.4607e15, 6) + " 光年" : g(d / 1000, 6) + " km"]], note: v.m[0] === "声" ? "看到闪电后数秒数，乘以 340 米就是雷电大致距离，每 3 秒约 1 公里。" : "" }; } });
})();
