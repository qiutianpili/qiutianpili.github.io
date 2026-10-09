/* Calculator registry, batch 8 (2026-10). Uses helpers exported by calcs.js / calcs2.js. */
(function () {
  "use strict";
  var H = window.CX.h, add = H.add, ok = H.ok, need = H.need, pos = H.pos, f = H.f, g = H.g, y = H.y, wy = H.wy, pct = H.pct,
    D = H.D, iso = H.iso, WK = H.WK, dayDiff = H.dayDiff, addMonths = H.addMonths, pmt = H.pmt, unit = H.unit;
  function nums(s) { var a = String(s).split(/[\s,，;；]+/).filter(Boolean).map(Number); if (!a.length || a.some(isNaN)) throw "请输入数字，用逗号或空格分隔"; return a; }
  function today() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
  function plus(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function day(d) { return iso(d) + " " + WK[d.getDay()]; }
  function hm(min) { min = ((Math.round(min) % 1440) + 1440) % 1440; return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0"); }
  function tmin(s) { var m = String(s).match(/^(\d{1,2})[:：](\d{2})$/); if (!m || +m[1] > 23 || +m[2] > 59) throw "时间格式如 07:30"; return +m[1] * 60 + +m[2]; }
  function irr(cf) { var lo = -0.99, hi = 1; function npv(r) { return cf.reduce(function (s, c, i) { return s + c / Math.pow(1 + r, i); }, 0); } if (npv(lo) * npv(hi) > 0) return NaN; for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (npv(lo) * npv(m) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; }
  function ncdf(z) { var t = 1 / (1 + .2316419 * Math.abs(z)), p = 1 - .3989423 * Math.exp(-z * z / 2) * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z >= 0 ? p : 1 - p; }

  /* ======================= 财务理财 ======================= */
  add({ cat: "finance", id: "stock-limit", name: "涨停价 / 跌停价计算", desc: "按昨收价和板块算今天的涨停价、跌停价", kw: "涨停 跌停 涨跌幅限制 创业板 科创板",
    fields: [{ k: "p", l: "昨日收盘价", u: "元", v: 12.34 }, { k: "b", l: "板块", t: "sel", o: [[10, "主板（±10%）"], [20, "创业板 / 科创板（±20%）"], [30, "北交所（±30%）"], [5, "主板 ST（±5%）"]], v: 10 }],
    run: function (v) { pos(v.p); var r = function (x) { return (Math.round(x * 100 + 1e-9) / 100).toFixed(2); }; return { big: ["涨停价", r(v.p * (1 + v.b / 100)) + " 元"], kv: [["跌停价", r(v.p * (1 - v.b / 100)) + " 元"], ["振幅上限", v.b * 2 + "%"]], note: "价格四舍五入到分。新股上市首日等情况涨跌幅另有规定。" }; } });

  add({ cat: "finance", id: "margin-ratio", name: "融资维持担保比例", desc: "算两融账户维持担保比例，股价跌多少会被预警、平仓", kw: "融资融券 两融 维持担保比例 平仓线",
    fields: [{ k: "a", l: "账户总资产（现金 + 股票市值）", u: "元", v: 300000 }, { k: "d", l: "融资负债（本金 + 利息）", u: "元", v: 150000 }, { k: "s", l: "其中股票市值", u: "元", v: 290000 }, { k: "w", l: "预警线", u: "%", v: 140 }, { k: "c", l: "平仓线", u: "%", v: 130 }],
    run: function (v) { pos(v.a, v.d); need(v.s, v.w, v.c); var r = v.a / v.d, cash = v.a - v.s, drop = function (t) { return v.s ? Math.max(0, 1 - (t / 100 * v.d - cash) / v.s) : 0; }; return { big: ["维持担保比例", pct(r, 1)], tag: r * 100 < v.c ? "已低于平仓线" : r * 100 < v.w ? "已低于预警线" : "安全", kv: [["股票再跌多少到预警", pct(drop(v.w), 1)], ["股票再跌多少到平仓", pct(drop(v.c), 1)]], note: "2023 年起交易所不再统一最低维持担保比例，由券商自行约定，以合同为准。" }; } });

  add({ cat: "finance", id: "gold-unit", name: "黄金克价 / 盎司价换算", desc: "国际金价美元/盎司与国内元/克互换，算首饰金价", kw: "金价 盎司 克 黄金 换算",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["美元/盎司", "元/克"] }, { k: "x", l: "价格", v: 2400 }, { k: "r", l: "汇率（1 美元 = ? 元）", v: 7.1 }, { k: "w", l: "克重（算首饰价）", u: "g", v: 10 }, { k: "fee", l: "工费", u: "元/克", v: 20 }],
    run: function (v) { pos(v.x, v.r); need(v.w, v.fee); var g1 = v.m === "美元/盎司" ? v.x * v.r / 31.1035 : v.x; return { big: ["元/克", f(g1, 2)], kv: [["美元/盎司", f(g1 * 31.1035 / v.r, 2)], ["元/两（50 g）", f(g1 * 50, 0)], [v.w + " g 首饰约", y(v.w * (g1 + v.fee))]], note: "1 金衡盎司 = 31.1035 克。品牌金店零售价通常比基础金价高 10%–20%。" }; } });

  add({ cat: "finance", id: "fund-dca-cost", name: "基金定投平均成本", desc: "每期固定金额买入，按各期净值算持有份额、平均成本和收益", kw: "定投 平均成本 份额 微笑曲线",
    fields: [{ k: "a", l: "每期投入", u: "元", v: 1000 }, { k: "n", l: "各期买入净值", t: "area", v: "1.20, 1.05, 0.92, 0.88, 0.95, 1.10" }, { k: "fee", l: "申购费率", u: "%", v: 0.12 }, { k: "now", l: "当前净值", v: 1.08 }],
    run: function (v) { pos(v.a); need(v.fee); var N = nums(v.n); if (N.some(function (x) { return x <= 0; })) throw "净值需大于 0"; var sh = N.reduce(function (s, x) { return s + v.a / (1 + v.fee / 100) / x; }, 0), inv = v.a * N.length, cost = inv / sh, mean = N.reduce(function (s, x) { return s + x; }, 0) / N.length, kv = [["持有份额", f(sh, 2)], ["总投入", y(inv)], ["净值算术平均", f(mean, 4)]]; if (ok(v.now) && v.now > 0) { kv.push(["当前市值", y(sh * v.now)]); kv.push(["收益率", pct(sh * v.now / inv - 1)]); } return { big: ["平均成本", f(cost, 4)], kv: kv, note: "定投的平均成本低于净值的算术平均，下跌时买到更多份额。" }; } });

  add({ cat: "finance", id: "fund-redeem", name: "基金赎回到账金额", desc: "按份额、净值和持有天数算赎回费和到账金额", kw: "基金赎回 赎回费 7天 到账",
    fields: [{ k: "s", l: "赎回份额", v: 10000 }, { k: "n", l: "赎回净值", v: 1.235 }, { k: "d", l: "持有天数", u: "天", v: 200 }, { k: "r", l: "该档赎回费率（7 天以上）", u: "%", v: 0.5 }],
    run: function (v) { pos(v.s, v.n); need(v.d, v.r); var rate = v.d < 7 ? 1.5 : v.r, gross = v.s * v.n, fee = gross * rate / 100; return { big: ["到账约", y(gross - fee)], kv: [["赎回总额", y(gross)], ["赎回费", y(fee) + "（" + rate + "%）"]], note: "持有不足 7 天统一收 1.5% 惩罚性赎回费；其他费率看基金合同，一般持有越久越低，C 类基金持有满 7 或 30 天常为 0。" }; } });

  add({ cat: "finance", id: "retirement-gap", name: "养老缺口计算器", desc: "按退休后每月开销和养老金，算需要自己准备多少钱", kw: "养老缺口 退休 储备",
    fields: [{ k: "e", l: "退休后每月开销（今天的钱）", u: "元", v: 6000 }, { k: "p", l: "预计每月养老金（今天的钱）", u: "元", v: 3500 }, { k: "n", l: "退休后生活年数", u: "年", v: 25 }, { k: "r", l: "退休后实际年化收益（扣通胀）", u: "%", v: 1.5 }, { k: "t", l: "离退休还有", u: "年", v: 25 }],
    run: function (v) { need(v.e, v.p, v.r, v.t); pos(v.n); var gap = Math.max(v.e - v.p, 0) * 12, r = v.r / 100, pv = r ? gap * (1 - Math.pow(1 + r, -v.n)) / r : gap * v.n; return { big: ["需自备（今天的钱）", wy(pv)], kv: [["每年缺口", y(gap)], ["从现在起每月需存（实际收益 3%）", y(v.t > 0 ? pv * .0025 / (Math.pow(1.0025, v.t * 12) - 1) : pv)]], note: "以今天的购买力计算，已扣除通胀影响。" }; } });

  add({ cat: "finance", id: "cd-ladder", name: "定期存款阶梯 / 组合", desc: "把钱分到不同期限的定期里，算平均利率和每年到期金额", kw: "定期 阶梯存款 大额存单 组合",
    fields: [{ k: "a", l: "总金额", u: "元", v: 400000 }, { k: "r", l: "各期限（年数, 年利率%）", t: "list", cols: [{ k: "y", l: "年数", nv: "" }, { k: "r", l: "年利率%", nv: "" }], v: [[1, 1.1], [2, 1.2], [3, 1.5], [5, 1.55]] }],
    run: function (v) { pos(v.a); var rs = v.r.filter(function (r) { return ok(r[0]) && ok(r[1]) && r[0] > 0; }); if (!rs.length) throw "至少一档"; var part = v.a / rs.length, tot = 0; var rows = rs.map(function (r) { var it = part * r[1] / 100 * r[0]; tot += it / r[0]; return [r[0] + " 年", f(part, 0), r[1] + "%", f(it, 0)]; }); return { big: ["每年利息约", y(tot)], kv: [["加权年利率", pct(tot / v.a)]], table: { h: ["期限", "存入（元）", "利率", "到期利息（元）"], r: rows }, note: "每笔到期后都转存为最长一档，之后每年都有一笔到期，兼顾流动性和利率。" }; } });

  add({ cat: "finance", id: "loan-compare", name: "多家贷款对比", desc: "把几家贷款的利率、手续费、期数放一起，比真实年化和总成本", kw: "贷款对比 利率 手续费 真实年化",
    fields: [{ k: "p", l: "贷款金额", u: "元", v: 100000 }, { k: "l", l: "贷款（名称, 年利率%, 一次性费用, 期数）", t: "list", cols: [{ k: "n", l: "名称", t: "text", nv: "" }, { k: "r", l: "年利率%", nv: "" }, { k: "f", l: "费用", nv: 0 }, { k: "m", l: "期数", nv: 36 }], v: [["银行 A", 3.8, 0, 36], ["银行 B", 3.2, 2000, 36], ["平台 C", 7.2, 0, 24]] }],
    run: function (v) { pos(v.p); var rs = v.l.filter(function (r) { return ok(r[1]) && ok(r[3]) && r[3] > 0; }); if (!rs.length) throw "至少一家"; return { table: { h: ["贷款", "月供（元）", "总成本（元）", "真实年化"], r: rs.map(function (r, i) { var fee = ok(r[2]) ? r[2] : 0, m = pmt(v.p, r[1] / 1200, r[3]), cf = [-(v.p - fee)]; for (var k = 0; k < r[3]; k++) cf.push(m); var ir = irr(cf); return [String(r[0]).trim() || "贷款" + (i + 1), f(m, 0), f(m * r[3] - v.p + fee, 0), ok(ir) ? pct(Math.pow(1 + ir, 12) - 1) : "—"]; }) }, note: "按等额本息、费用在放款时扣除计算。" }; } });

  /* ======================= 房产置业 ======================= */
  add({ cat: "property", id: "rent-to-income", name: "房租收入比", desc: "房租占收入多少，按 30% 原则算合理租金", kw: "房租 收入 比例 租房预算",
    fields: [{ k: "i", l: "月税后收入", u: "元", v: 12000 }, { k: "r", l: "月租金", u: "元", v: 3500 }],
    run: function (v) { pos(v.i); need(v.r); var x = v.r / v.i; return { big: ["房租占收入", pct(x, 1)], tag: x <= .3 ? "合理" : x <= .4 ? "偏高" : "压力大", kv: [["30% 原则下租金上限", y(v.i * .3)]] }; } });

  add({ cat: "property", id: "co-borrower-split", name: "夫妻 / 共同还贷分摊", desc: "按收入比例分摊月供和首付", kw: "共同还款 分摊 夫妻 aa",
    fields: [{ k: "m", l: "月供", u: "元", v: 9000 }, { k: "d", l: "首付", u: "万元", v: 90 }, { k: "p", l: "各人（名字, 月收入）", t: "list", cols: [{ k: "n", l: "名字", t: "text", nv: "" }, { k: "i", l: "月收入", nv: "" }], v: [["甲", 20000], ["乙", 12000]] }],
    run: function (v) { need(v.m, v.d); var rs = v.p.filter(function (r) { return ok(r[1]) && r[1] > 0; }); if (rs.length < 2) throw "至少两人"; var T = rs.reduce(function (s, r) { return s + r[1]; }, 0); return { table: { h: ["名字", "比例", "每月还（元）", "首付（万元）", "月供占收入"], r: rs.map(function (r, i) { var k = r[1] / T; return [String(r[0]).trim() || "第" + (i + 1) + "人", pct(k, 1), f(v.m * k, 0), f(v.d * k, 2), pct(v.m * k / r[1], 0)]; }) }, note: "按收入比例分摊，每个人的月供占收入相同。婚前出资建议书面约定。" }; } });

  add({ cat: "property", id: "property-appreciation", name: "房价涨跌年化", desc: "买入价、现价和年份，算房子总涨幅和年化涨幅", kw: "房价 涨幅 年化 升值",
    fields: [{ k: "a", l: "买入总价", u: "万元", v: 180 }, { k: "y", l: "买入年份", v: 2016 }, { k: "b", l: "现在估价", u: "万元", v: 240 }],
    run: function (v) { pos(v.a, v.b); need(v.y); var n = today().getFullYear() - v.y + .5; if (n <= 0) throw "买入年份不能是未来"; return { big: ["年化涨幅", pct(Math.pow(v.b / v.a, 1 / n) - 1)], kv: [["总涨幅", pct(v.b / v.a - 1, 1)], ["账面增值", f(v.b - v.a, 1) + " 万元"], ["持有约", f(n, 1) + " 年"]], note: "未计交易税费、利息和装修投入。" }; } });

  add({ cat: "property", id: "house-commute-tradeoff", name: "近房 vs 远房（算上通勤）", desc: "市区贵房和郊区便宜房，把多年通勤时间和钱算进去比较", kw: "通勤 远郊 市区 买房 选择",
    fields: [{ k: "a", l: "近处房价", u: "万元", v: 400 }, { k: "b", l: "远处房价", u: "万元", v: 280 }, { k: "t", l: "远处每天多通勤", u: "分钟（往返）", v: 80 }, { k: "c", l: "远处每天多花通勤费", u: "元", v: 20 }, { k: "h", l: "你的时间价值", u: "元/小时", v: 50 }, { k: "n", l: "打算住几年", u: "年", v: 10 }, { k: "d", l: "每年通勤天数", v: 250 }],
    run: function (v) { pos(v.a, v.b, v.n, v.d); need(v.t, v.c, v.h); var hrs = v.t / 60 * v.d * v.n, cost = hrs * v.h + v.c * v.d * v.n, diff = (v.a - v.b) * 1e4; return { big: [cost < diff ? "远房更划算" : "近房更划算", "差 " + wy(Math.abs(diff - cost))], kv: [["房价差", wy(diff)], ["多通勤总时长", f(hrs, 0) + " 小时（" + f(hrs / 24, 0) + " 天）"], ["通勤总成本（含时间）", wy(cost)]], note: "没算房价差省下的利息、两处房子未来涨跌的不同和生活配套。" }; } });

  add({ cat: "property", id: "effective-rent", name: "免租期折算实际月租", desc: "签约有免租期、中介费时，折算出真实的平均月租", kw: "免租期 实际租金 写字楼 中介费",
    fields: [{ k: "r", l: "合同月租", u: "元", v: 8000 }, { k: "n", l: "租期", u: "月", v: 24 }, { k: "f", l: "免租期", u: "月", v: 2 }, { k: "a", l: "中介费 / 其他一次性费用", u: "元", v: 8000 }],
    run: function (v) { pos(v.r, v.n); need(v.f, v.a); if (v.f >= v.n) throw "免租期不能超过租期"; var tot = v.r * (v.n - v.f) + v.a; return { big: ["实际平均月租", y(tot / v.n)], kv: [["总支出", y(tot)], ["相当于打", f(tot / v.n / v.r * 10, 2) + " 折"]] }; } });

  add({ cat: "property", id: "hpf-balance", name: "公积金账户余额增长", desc: "按每月缴存额和存款利率算几年后公积金账户有多少钱", kw: "公积金余额 账户 利息",
    fields: [{ k: "b", l: "当前余额", u: "元", v: 30000 }, { k: "m", l: "每月缴存（个人 + 单位）", u: "元", v: 2400 }, { k: "n", l: "年数", u: "年", v: 5 }, { k: "r", l: "公积金存款年利率", u: "%", v: 1.5, hint: "以当地公积金中心公布为准" }],
    run: function (v) { need(v.b, v.m, v.r); pos(v.n); var bal = v.b, r = v.r / 100; for (var i = 0; i < v.n; i++) { bal = bal * (1 + r) + v.m * 12 * (1 + r * 6.5 / 12); } return { big: [v.n + " 年后余额约", wy(bal)], kv: [["累计缴存", wy(v.m * 12 * v.n)], ["利息约", y(bal - v.b - v.m * 12 * v.n)]], note: "公积金每年 6 月 30 日结息，按年复利估算。" }; } });

  /* ======================= 汽车出行 ======================= */
  add({ cat: "auto", id: "interval-speed", name: "区间测速平均车速", desc: "按区间长度和通过时间算平均速度，判断是否超速", kw: "区间测速 平均速度 超速",
    fields: [{ k: "d", l: "区间长度", u: "km", v: 12.5 }, { k: "t", l: "通过用时（分:秒）", t: "text", v: "6:10" }, { k: "l", l: "限速", u: "km/h", v: 120 }],
    run: function (v) { pos(v.d, v.l); var p = String(v.t).split(/[:：]/).map(Number); if (p.length !== 2 || p.some(isNaN)) throw "用时格式如 6:10"; var s = p[0] * 60 + p[1]; if (s <= 0) throw "用时需大于 0"; var sp = v.d / (s / 3600), ov = sp / v.l - 1; return { big: ["平均速度", f(sp, 1) + " km/h"], tag: ov > 0 ? "超速 " + pct(ov, 1) : "未超速", kv: [["不超速最少用时", Math.floor(v.d / v.l * 60) + " 分 " + Math.ceil(v.d / v.l * 3600 % 60) + " 秒"]] }; } });

  add({ cat: "auto", id: "car-loan-prepay", name: "车贷提前还款划算吗", desc: "提前结清车贷能省多少利息，扣掉违约金还剩多少", kw: "车贷 提前还款 违约金 结清",
    fields: [{ k: "b", l: "剩余本金", u: "元", v: 60000 }, { k: "r", l: "年利率", u: "%", v: 4.5 }, { k: "n", l: "剩余期数", u: "月", v: 24 }, { k: "p", l: "违约金比例（按剩余本金）", u: "%", v: 3 }],
    run: function (v) { pos(v.b, v.n); need(v.r, v.p); var m = pmt(v.b, v.r / 1200, v.n), it = m * v.n - v.b, pen = v.b * v.p / 100; return { big: [it > pen ? "提前还款省" : "不建议提前还", y(Math.abs(it - pen))], kv: [["剩余利息", y(it)], ["违约金", y(pen)], ["当前月供", y(m)]], note: "很多“0 息”或“低息”车贷的利息前置在手续费里，提前还款省不了多少，先看合同。" }; } });

  add({ cat: "auto", id: "tire-pressure-temp", name: "胎压随温度变化", desc: "冷车 / 热车、冬夏温差下胎压会变多少", kw: "胎压 温度 冬天 bar",
    fields: [{ k: "p", l: "当前胎压", u: "bar", v: 2.5 }, { k: "t1", l: "当前温度", u: "°C", v: 25 }, { k: "t2", l: "目标温度", u: "°C", v: -5 }],
    run: function (v) { pos(v.p); need(v.t1, v.t2); var abs = (v.p + 1.013) * (v.t2 + 273.15) / (v.t1 + 273.15) - 1.013; return { big: ["变为", f(abs, 2) + " bar"], kv: [["变化", (abs >= v.p ? "+" : "") + f(abs - v.p, 2) + " bar"], ["psi", f(abs * 14.5038, 1)], ["kPa", f(abs * 100, 0)]], note: "温度每变化 10 °C 胎压约变化 0.1 bar。按冷车（静置 3 小时）标准胎压充气。" }; } });

  add({ cat: "auto", id: "car-trade-in", name: "以旧换新实际花费", desc: "新车价减去旧车估价和补贴，算置换要掏多少钱", kw: "以旧换新 置换 补贴 二手车",
    fields: [{ k: "n", l: "新车落地价", u: "万元", v: 18 }, { k: "o", l: "旧车估价", u: "万元", v: 5 }, { k: "s", l: "国家 / 地方补贴", u: "万元", v: 1.5 }, { k: "b", l: "厂家置换补贴", u: "万元", v: 0.5 }],
    run: function (v) { need(v.n, v.o, v.s, v.b); var x = v.n - v.o - v.s - v.b; return { big: ["还需支付", f(x, 2) + " 万元"], kv: [["优惠合计", f(v.o + v.s + v.b, 2) + " 万元"], ["相当于新车打", f(x / v.n * 10, 1) + " 折"]], note: "补贴政策和额度每年调整，需在商务部“汽车以旧换新”平台申请，以当年政策为准。" }; } });

  add({ cat: "auto", id: "claim-or-not", name: "小事故出险还是自己修", desc: "算出险后未来几年多交的保费，和自己掏钱修比", kw: "出险 理赔 保费上涨 小剐蹭",
    fields: [{ k: "c", l: "维修费用", u: "元", v: 1500 }, { k: "b", l: "商业险基准保费", u: "元", v: 4000 }, { k: "now", l: "现在的 NCD 系数", t: "sel", o: [[0.5, "0.5"], [0.6, "0.6"], [0.7, "0.7"], [0.8, "0.8"], [1, "1.0"]], v: 0.7 }],
    run: function (v) { pos(v.b); need(v.c); var L = [0.5, 0.6, 0.7, 0.8, 1, 1.2, 1.4, 1.6, 2], i = L.indexOf(Number(v.now)); var a = [L[Math.max(i - 1, 0)], L[Math.max(i - 2, 0)], L[Math.max(i - 3, 0)]], b = [1, 0.8, 0.7]; var sa = a.reduce(function (s, x) { return s + x; }, 0) * v.b, sb = b.reduce(function (s, x) { return s + x; }, 0) * v.b, extra = sb - sa; return { big: [extra > v.c ? "自己修更划算" : "出险更划算", "差 " + y(Math.abs(extra - v.c))], kv: [["出险后 3 年多交保费约", y(extra)], ["维修费", y(v.c)]], note: "按出险 1 次次年系数回到 1.0、之后每年无赔再下调一档估算，未含自主定价系数。" }; } });

  add({ cat: "auto", id: "rental-car-cost", name: "租车总费用", desc: "日租金、保险、手续费、油费和异地还车费加起来", kw: "租车 一嗨 神州 自驾游",
    fields: [{ k: "d", l: "租期", u: "天", v: 4 }, { k: "r", l: "日租金", u: "元", v: 180 }, { k: "i", l: "保障服务费（每天）", u: "元", v: 60 }, { k: "f", l: "手续费 / 车辆整备费", u: "元", v: 35 }, { k: "km", l: "预计行驶", u: "km", v: 800 }, { k: "c", l: "油耗", u: "L/100km", v: 7 }, { k: "p", l: "油价", u: "元/L", v: 7.5 }, { k: "o", l: "异地还车费", u: "元", v: 0 }],
    run: function (v) { pos(v.d); need(v.r, v.i, v.f, v.km, v.c, v.p, v.o); var fuel = v.km * v.c / 100 * v.p, tot = v.d * (v.r + v.i) + v.f + fuel + v.o; return { big: ["总费用约", y(tot)], kv: [["租金 + 保障", y(v.d * (v.r + v.i))], ["油费", y(fuel)], ["平均每天", y(tot / v.d)]], note: "还车前加满油，避免按高价补油费；押金一般信用免押或预授权 3000–5000 元。" }; } });

  /* ======================= 健康健身 ======================= */
  add({ cat: "health", id: "prenatal-schedule", name: "产检时间表", desc: "按末次月经推算 NT、唐筛、大排畸、糖耐等关键产检日期", kw: "产检 nt 唐筛 大排畸 糖耐",
    fields: [{ k: "l", l: "末次月经第一天", t: "date", v: "2026-08-01" }],
    run: function (v) { var l = D(v.l), w = function (a, b) { return iso(plus(l, a * 7)) + " ~ " + iso(plus(l, b * 7 - 1)); }; return { table: { h: ["项目", "孕周", "日期范围"], r: [["建档 / 第一次产检", "6–8 周", w(6, 9)], ["NT 检查", "11–13⁺⁶ 周", w(11, 14)], ["唐筛 / 无创 DNA", "15–20⁺⁶ 周", w(15, 21)], ["大排畸（系统超声）", "20–24 周", w(20, 25)], ["糖耐量（OGTT）", "24–28 周", w(24, 29)], ["小排畸 / 胎位", "28–32 周", w(28, 33)], ["胎心监护开始", "34–36 周", w(34, 37)], ["预产期", "40 周", iso(plus(l, 280))]] }, note: "依据《孕前和孕期保健指南》常规时间，具体按医院安排。" }; } });

  add({ cat: "health", id: "breastmilk-storage", name: "母乳储存时间", desc: "挤出的母乳在室温、冷藏、冷冻下能放多久", kw: "母乳 储存 冷藏 冷冻 背奶",
    fields: [{ k: "s", l: "储存方式", t: "sel", drop: true, o: [["4 小时", "室温（≤ 25 °C）"], ["24 小时", "保温包 + 冰袋"], ["4 天", "冷藏（≤ 4 °C）"], ["6 个月（最长 12 个月）", "冷冻（−18 °C 以下）"], ["24 小时内吃完，不可再冻", "冷冻后在冷藏室解冻"], ["1–2 小时内吃完", "解冻后回温 / 宝宝吃剩"]], v: "4 天" }, { k: "t", l: "挤奶时间", t: "dt", v: "2026-10-09T08:00" }],
    run: function (v) { var s = String(v.s), m = s.match(/^(\d+)\s*(小时|天|个月)/), t = new Date(v.t), until = null; if (m && !isNaN(t)) { var n = +m[1]; until = m[2] === "小时" ? new Date(t.getTime() + n * 36e5) : m[2] === "天" ? new Date(t.getTime() + n * 864e5) : addMonths(t, n); } return { big: ["可保存", s], kv: until ? [["最晚食用", iso(until) + (m[2] === "小时" ? " " + hm(until.getHours() * 60 + until.getMinutes()) : "")]] : [], note: "参考美国 CDC 母乳储存指南。袋上写好日期，先存先用；解冻用温水，不要微波加热。" }; } });

  add({ cat: "health", id: "sweat-rate", name: "运动出汗率 / 补水量", desc: "运动前后称重算每小时出汗量，确定比赛补水", kw: "出汗率 补水 马拉松 运动饮料",
    fields: [{ k: "a", l: "运动前体重", u: "kg", v: 70 }, { k: "b", l: "运动后体重", u: "kg", v: 69.1 }, { k: "d", l: "期间喝水", u: "ml", v: 500 }, { k: "u", l: "期间排尿", u: "ml", v: 0 }, { k: "t", l: "运动时长", u: "分钟", v: 75 }],
    run: function (v) { pos(v.a, v.b, v.t); need(v.d, v.u); var loss = (v.a - v.b) * 1000 + v.d - v.u, rate = loss / (v.t / 60), pl = (v.a - v.b) / v.a; return { big: ["出汗率", f(rate, 0) + " ml/小时"], tag: pl > .02 ? "失水超过 2%，表现会下降" : null, kv: [["失水", pct(pl, 1) + " 体重"], ["每 15 分钟建议补", f(rate / 4 * .8, 0) + " ml"], ["运动后补液", f((v.a - v.b) * 1500, 0) + " ml"]], note: "运动中补到出汗量的 70%–80%，超过 1 小时加电解质，别一次猛灌。" }; } });

  add({ cat: "health", id: "net-carbs", name: "净碳水计算", desc: "总碳水减膳食纤维和糖醇，算生酮 / 低碳饮食的净碳水", kw: "净碳水 生酮 低碳 膳食纤维",
    fields: [{ k: "c", l: "总碳水化合物", u: "g", v: 30 }, { k: "f", l: "膳食纤维", u: "g", v: 8 }, { k: "s", l: "糖醇（赤藓糖醇等）", u: "g", v: 5 }, { k: "q", l: "份数", v: 1 }],
    run: function (v) { need(v.c, v.f, v.s, v.q); var n = Math.max(v.c - v.f - v.s, 0) * v.q; return { big: ["净碳水", f(n, 1) + " g"], kv: [["生酮每日上限（20–50 g）", pct(n / 50, 0) + " 的 50 g"]], note: "麦芽糖醇等会升糖，只减一半更稳妥。" }; } });

  add({ cat: "health", id: "glycemic-load", name: "血糖负荷 GL", desc: "按食物升糖指数 GI 和碳水含量算血糖负荷", kw: "血糖负荷 gl gi 升糖指数 控糖",
    fields: [{ k: "gi", l: "升糖指数 GI", v: 83, hint: "白米饭约 83，全麦面包约 69，苹果约 36" }, { k: "c", l: "这份食物的可利用碳水", u: "g", v: 40 }],
    run: function (v) { need(v.gi, v.c); var gl = v.gi * v.c / 100; return { big: ["血糖负荷", f(gl, 1)], tag: gl <= 10 ? "低" : gl < 20 ? "中" : "高", kv: [["GI 等级", v.gi <= 55 ? "低 GI" : v.gi <= 69 ? "中 GI" : "高 GI"]], note: "GL ≤ 10 低，11–19 中，≥ 20 高。控糖看 GL 比只看 GI 更实际。" }; } });

  add({ cat: "health", id: "chol-ratio", name: "胆固醇比值", desc: "总胆固醇 / 高密度脂蛋白、低高比、非 HDL 胆固醇", kw: "胆固醇比值 tc/hdl ldl/hdl 非高密度",
    fields: [{ k: "tc", l: "总胆固醇 TC", u: "mmol/L", v: 5.2 }, { k: "hdl", l: "高密度 HDL-C", u: "mmol/L", v: 1.2 }, { k: "ldl", l: "低密度 LDL-C", u: "mmol/L", v: 3.3 }],
    run: function (v) { pos(v.tc, v.hdl); need(v.ldl); var r = v.tc / v.hdl; return { big: ["TC / HDL", f(r, 2)], tag: r < 4 ? "理想" : r < 5 ? "尚可" : "偏高", kv: [["LDL / HDL", f(v.ldl / v.hdl, 2) + (v.ldl / v.hdl < 2.5 ? "（理想）" : "（偏高）")], ["非 HDL 胆固醇", f(v.tc - v.hdl, 2) + " mmol/L" + (v.tc - v.hdl < 4.1 ? "（合适）" : "（偏高）")]] }; } });

  add({ cat: "health", id: "hemoglobin", name: "血红蛋白 / 贫血程度", desc: "按血红蛋白值和人群判断是否贫血及程度", kw: "血红蛋白 贫血 hb",
    fields: [{ k: "h", l: "血红蛋白", u: "g/L", v: 105 }, { k: "g", l: "人群", t: "sel", o: [[130, "成年男性"], [120, "成年女性"], [110, "孕妇"], [110, "6 月–6 岁儿童"], [120, "6–14 岁儿童"]], v: 120 }],
    run: function (v) { pos(v.h); var lv = v.h >= v.g ? "正常" : v.h >= 90 ? "轻度贫血" : v.h >= 60 ? "中度贫血" : v.h >= 30 ? "重度贫血" : "极重度贫血"; return { big: [lv, v.h + " g/L"], kv: [["贫血标准", "< " + v.g + " g/L"]], note: "需结合红细胞指标查原因，最常见为缺铁性贫血。" }; } });

  add({ cat: "health", id: "medication-times", name: "服药时间安排", desc: "按每天几次和作息，排出间隔均匀的吃药时间", kw: "吃药时间 一日三次 每8小时 服药",
    fields: [{ k: "n", l: "每天次数", t: "sel", o: [[1, "一日一次"], [2, "一日两次"], [3, "一日三次"], [4, "一日四次"]], v: 3 }, { k: "w", l: "起床时间", t: "text", v: "07:00" }, { k: "s", l: "睡觉时间", t: "text", v: "23:00" }, { k: "m", l: "方式", t: "sel", o: ["清醒时段内平均", "严格每隔 24/n 小时"] }],
    run: function (v) { var a = tmin(v.w), b = tmin(v.s); if (b <= a) b += 1440; var T = []; if (v.m[0] === "严") for (var i = 0; i < v.n; i++) T.push(a + i * 1440 / v.n); else if (v.n === 1) T.push(a + 60); else for (i = 0; i < v.n; i++) T.push(a + 30 + (b - a - 60) * i / (v.n - 1)); return { table: { h: ["第几次", "时间"], r: T.map(function (t, i) { return ["第 " + (i + 1) + " 次", hm(t)]; }) }, note: "饭前、饭后、睡前等特殊要求以说明书和医嘱为准；抗生素等需维持血药浓度的药按严格间隔服用。" }; } });

  add({ cat: "health", id: "sri", name: "性压抑指数（SRI）测评", desc: "基于 SIS/SES、Mosher 性内疚、KISS-9、SOS 量表的自评问卷，快测 39 题 / 完整版 117 题，数据只存本机", kw: "性压抑 sri 性心理 问卷 测评", href: "/sri/", fields: [], run: function () {} });

  /* ======================= 数学计算 ======================= */
  add({ cat: "math", id: "ratio-split", name: "按比例分配", desc: "把一个总数按 3:2:1 这样的比例分成几份", kw: "按比例分配 比例 分配",
    fields: [{ k: "t", l: "总数", v: 12000 }, { k: "r", l: "比例（如 3:2:1）", t: "text", v: "3:2:1" }],
    run: function (v) { need(v.t); var R = String(v.r).split(/[:：,，\s]+/).filter(Boolean).map(Number); if (R.length < 2 || R.some(function (x) { return !(x >= 0); })) throw "比例格式如 3:2:1"; var S = R.reduce(function (s, x) { return s + x; }, 0); if (!S) throw "比例不能全为 0"; return { table: { h: ["份", "比例", "分得"], r: R.map(function (x, i) { return ["第 " + (i + 1) + " 份", x, g(v.t * x / S, 8)]; }) } }; } });

  add({ cat: "math", id: "circle-3points", name: "三点确定圆", desc: "已知圆上三点坐标，求圆心、半径和圆方程", kw: "三点定圆 外接圆 圆心 半径",
    fields: [{ k: "a", l: "点 A（x y）", t: "text", v: "0 0" }, { k: "b", l: "点 B（x y）", t: "text", v: "4 0" }, { k: "c", l: "点 C（x y）", t: "text", v: "0 3" }],
    run: function (v) { var A = nums(v.a), B = nums(v.b), C = nums(v.c); if ([A, B, C].some(function (p) { return p.length !== 2; })) throw "每个点填两个数"; var d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1])); if (Math.abs(d) < 1e-12) throw "三点共线，无法确定圆"; var s = function (p) { return p[0] * p[0] + p[1] * p[1]; }, ux = (s(A) * (B[1] - C[1]) + s(B) * (C[1] - A[1]) + s(C) * (A[1] - B[1])) / d, uy = (s(A) * (C[0] - B[0]) + s(B) * (A[0] - C[0]) + s(C) * (B[0] - A[0])) / d, r = Math.hypot(A[0] - ux, A[1] - uy); return { big: ["圆心", "(" + g(ux, 8) + ", " + g(uy, 8) + ")"], kv: [["半径", g(r, 8)], ["方程", "(x − " + g(ux, 6) + ")² + (y − " + g(uy, 6) + ")² = " + g(r * r, 6)], ["面积", g(Math.PI * r * r, 8)]] }; } });

  add({ cat: "math", id: "points-3d", name: "空间两点距离", desc: "三维空间两点的距离、中点和方向向量", kw: "空间距离 三维 两点",
    fields: [{ k: "a", l: "点 A（x y z）", t: "text", v: "1 2 3" }, { k: "b", l: "点 B（x y z）", t: "text", v: "4 6 15" }],
    run: function (v) { var A = nums(v.a), B = nums(v.b); if (A.length !== 3 || B.length !== 3) throw "每个点填三个数"; var d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(d[0], d[1], d[2]); return { big: ["距离", g(L, 10)], kv: [["中点", "(" + A.map(function (x, i) { return g((x + B[i]) / 2, 8); }).join(", ") + ")"], ["方向向量", "(" + d.map(function (x) { return g(x, 8); }).join(", ") + ")"], ["单位向量", L ? "(" + d.map(function (x) { return g(x / L, 6); }).join(", ") + ")" : "—"]] }; } });

  add({ cat: "math", id: "modular", name: "模运算计算器", desc: "大数取模、快速幂取模 aᵇ mod m、模逆元", kw: "取模 模幂 逆元 同余",
    fields: [{ k: "a", l: "a", t: "text", v: "7" }, { k: "b", l: "指数 b", t: "text", v: "128" }, { k: "m", l: "模 m", t: "text", v: "13" }],
    run: function (v) { var s = [v.a, v.b, v.m].map(function (x) { return String(x).trim(); }); if (!s.every(function (x) { return /^-?\d+$/.test(x); })) throw "请输入整数"; var a = BigInt(s[0]), b = BigInt(s[1]), m = BigInt(s[2]); if (m <= 0n) throw "模需为正整数"; if (b < 0n) throw "指数不能为负"; var md = function (x) { return ((x % m) + m) % m; }, r = 1n, base = md(a), e = b; while (e > 0n) { if (e & 1n) r = r * base % m; base = base * base % m; e >>= 1n; } var g0 = m, x0 = 0n, x1 = 1n, aa = md(a); while (aa > 0n) { var q = g0 / aa, t = g0 - q * aa; g0 = aa; aa = t; t = x0 - q * x1; x0 = x1; x1 = t; } return { kv: [["a mod m", md(a).toString()], ["aᵇ mod m", r.toString()], ["a 的模逆元", g0 === 1n ? md(x0).toString() : "不存在（a 与 m 不互质）"]] }; } });

  add({ cat: "math", id: "golden-ratio", name: "黄金分割计算器", desc: "按总长求黄金分割点，或已知一段求另一段", kw: "黄金分割 0.618 黄金比例",
    fields: [{ k: "t", l: "总长度", v: 100 }],
    run: function (v) { pos(v.t); var p = (1 + Math.sqrt(5)) / 2; return { big: ["长段", g(v.t / p, 8)], kv: [["短段", g(v.t / p / p, 8)], ["以它为短段时的总长", g(v.t * p * p, 8)], ["以它为长段时的总长", g(v.t * p, 8)], ["φ", g(p, 12)]] }; } });

  add({ cat: "math", id: "percent-points", name: "百分点 vs 百分比变化", desc: "比率从 A% 变到 B%，是变了几个百分点，还是变了百分之几", kw: "百分点 百分比 增长率",
    fields: [{ k: "a", l: "原来", u: "%", v: 4 }, { k: "b", l: "现在", u: "%", v: 5 }],
    run: function (v) { need(v.a, v.b); return { kv: [["变化", (v.b >= v.a ? "上升 " : "下降 ") + g(Math.abs(v.b - v.a), 8) + " 个百分点"], ["相对变化", v.a ? (v.b >= v.a ? "增长 " : "下降 ") + pct(Math.abs(v.b - v.a) / v.a, 2) : "—"]], note: "利率从 4% 升到 5% 是上升 1 个百分点，也是上升了 25%。" }; } });

  add({ cat: "math", id: "normal-dist", name: "正态分布概率", desc: "已知均值和标准差，求小于、大于或落在区间内的概率", kw: "正态分布 概率 标准差",
    fields: [{ k: "m", l: "均值 μ", v: 100 }, { k: "s", l: "标准差 σ", v: 15 }, { k: "a", l: "下界 x₁", v: 85 }, { k: "b", l: "上界 x₂", v: 130 }],
    run: function (v) { need(v.m, v.a, v.b); pos(v.s); var pa = ncdf((v.a - v.m) / v.s), pb = ncdf((v.b - v.m) / v.s); return { big: ["P(x₁ < X < x₂)", pct(Math.abs(pb - pa), 3)], kv: [["P(X < x₁)", pct(pa, 3)], ["P(X > x₂)", pct(1 - pb, 3)], ["z₁ / z₂", g((v.a - v.m) / v.s, 4) + " / " + g((v.b - v.m) / v.s, 4)]] }; } });

  add({ cat: "math", id: "average-speed", name: "平均速度（往返）", desc: "去程和回程速度不同时的全程平均速度（调和平均）", kw: "平均速度 往返 调和平均",
    fields: [{ k: "a", l: "去程速度", v: 60 }, { k: "b", l: "回程速度", v: 40 }, { k: "d", l: "单程距离（可选）", v: 120 }],
    run: function (v) { pos(v.a, v.b); var av = 2 * v.a * v.b / (v.a + v.b), kv = [["不是简单平均", g((v.a + v.b) / 2, 6)]]; if (ok(v.d) && v.d > 0) kv.push(["总用时", g(v.d / v.a + v.d / v.b, 6) + " 小时"]); return { big: ["平均速度", g(av, 8)], kv: kv }; } });

  /* ======================= 单位换算 ======================= */
  unit("inductance", "电感单位换算", "亨、毫亨、微亨、纳亨", "电感 亨利 uh mh", [["H", 1], ["mH", 1e-3], ["μH", 1e-6], ["nH", 1e-9]], "μH");
  unit("resistance", "电阻单位换算", "欧、千欧、兆欧、毫欧", "电阻 欧姆 千欧 兆欧", [["Ω", 1], ["mΩ", 1e-3], ["kΩ", 1e3], ["MΩ", 1e6]], "kΩ");

  add({ cat: "convert", id: "alcohol-proof", name: "酒精度换算", desc: "酒精度（% vol）与美制、英制 Proof 互换，算一杯含多少纯酒精", kw: "酒精度 proof 度数 纯酒精",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["% vol", "美制 Proof", "英制 Proof"] }, { k: "x", l: "数值", v: 53 }, { k: "v", l: "饮用量", u: "ml", v: 50 }],
    run: function (v) { pos(v.x); need(v.v); var abv = v.m === "% vol" ? v.x : v.m === "美制 Proof" ? v.x / 2 : v.x / 1.75; if (abv > 100) throw "酒精度不超过 100%"; return { kv: [["% vol", g(abv, 4) + "%"], ["美制 Proof", g(abv * 2, 4)], ["英制 Proof", g(abv * 1.75, 4)], [v.v + " ml 含纯酒精", f(v.v * abv / 100 * .789, 1) + " g"]] }; } });

  add({ cat: "convert", id: "hat-size", name: "帽子尺码换算", desc: "按头围换算国内帽号、美码和 S/M/L", kw: "帽子 尺码 头围",
    fields: [{ k: "c", l: "头围", u: "cm", v: 57 }],
    run: function (v) { pos(v.c); if (v.c < 40 || v.c > 70) throw "头围一般在 40–70 cm"; var us = v.c / 2.54 / Math.PI, eighth = Math.round(us * 8) / 8, whole = Math.floor(eighth), frac = Math.round((eighth - whole) * 8); var fr = frac ? " " + (frac % 2 ? frac + "/8" : frac % 4 ? frac / 2 + "/4" : "1/2") : ""; return { big: ["国内帽号", Math.round(v.c) + " 号"], kv: [["美码", whole + fr], ["通用码", v.c < 55 ? "S" : v.c < 57 ? "M" : v.c < 59 ? "L" : v.c < 61 ? "XL" : "XXL"]], note: "软尺绕额头最宽处和后脑最突出处一圈。" }; } });

  add({ cat: "convert", id: "bed-size", name: "床和床品尺寸对照", desc: "按床宽查床单、被套、被子、床笠的常见尺寸", kw: "床单 被套 尺寸 1.8米 1.5米",
    fields: [{ k: "b", l: "床宽", t: "sel", o: [["1.2", "1.2 m 单人床"], ["1.5", "1.5 m 双人床"], ["1.8", "1.8 m 双人床"], ["2.0", "2.0 m 大床"]], v: "1.8" }],
    run: function (v) { var T = { "1.2": ["120 × 200", "150 × 200", "160 × 230", "120 × 200 × 30"], "1.5": ["150 × 200", "200 × 230", "230 × 250", "150 × 200 × 30"], "1.8": ["180 × 200", "220 × 240", "245 × 250", "180 × 200 × 30"], "2.0": ["200 × 220", "240 × 260", "270 × 280", "200 × 220 × 30"] }[v.b]; return { kv: [["床垫", T[0] + " cm"], ["被子 / 被套", T[1] + " cm"], ["床单", T[2] + " cm"], ["床笠（含高）", T[3] + " cm"]], note: "床垫厚度超过 25 cm 时，床笠高度、床单尺寸要相应加大。" }; } });

  add({ cat: "convert", id: "fullwidth", name: "全角 / 半角转换", desc: "中文排版里的全角字母数字标点与半角互转", kw: "全角 半角 标点 转换",
    fields: [{ k: "m", l: "方向", t: "sel", o: ["转半角", "转全角"] }, { k: "s", l: "文字", t: "area", v: "ＡＢＣ１２３，ｈｅｌｌｏ！" }],
    run: function (v) { var s = String(v.s); if (!s) throw "请输入文字"; var out = v.m === "转半角" ? s.replace(/[\uFF01-\uFF5E]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); }).replace(/\u3000/g, " ") : s.replace(/[\x21-\x7E]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) + 0xFEE0); }).replace(/ /g, "\u3000"); return { big: ["结果", out] }; } });

  add({ cat: "convert", id: "text-case", name: "英文大小写 / 命名格式转换", desc: "大写、小写、首字母大写、驼峰、下划线、短横线互转", kw: "大小写 驼峰 下划线 camelcase snake",
    fields: [{ k: "s", l: "文字", t: "text", v: "hello world from hark" }],
    run: function (v) { var s = String(v.s).trim(); if (!s) throw "请输入文字"; var w = s.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[\s_\-]+/).filter(Boolean).map(function (x) { return x.toLowerCase(); }), cap = function (x) { return x.charAt(0).toUpperCase() + x.slice(1); }; return { kv: [["全大写", s.toUpperCase()], ["全小写", s.toLowerCase()], ["首字母大写", w.map(cap).join(" ")], ["camelCase", w[0] + w.slice(1).map(cap).join("")], ["PascalCase", w.map(cap).join("")], ["snake_case", w.join("_")], ["kebab-case", w.join("-")], ["CONSTANT_CASE", w.join("_").toUpperCase()]] }; } });

  add({ cat: "convert", id: "big-number-units", name: "万 / 亿 与 million / billion 换算", desc: "中文数量单位和英文 thousand、million、billion 互换", kw: "万 亿 million billion 换算",
    fields: [{ k: "x", l: "数值", v: 3.5 }, { k: "u", l: "单位", t: "sel", drop: true, o: [[1e4, "万"], [1e8, "亿"], [1e12, "万亿"], [1e3, "thousand（千）"], [1e6, "million（百万）"], [1e9, "billion（十亿）"], [1e12, "trillion（万亿）"]], v: 1e8 }],
    run: function (v) { need(v.x); var n = v.x * v.u; return { kv: [["数字", n.toLocaleString("en-US", { maximumFractionDigits: 4 })], ["万", g(n / 1e4, 8)], ["亿", g(n / 1e8, 8)], ["million", g(n / 1e6, 8)], ["billion", g(n / 1e9, 8)]] }; } });

  add({ cat: "convert", id: "download-time", name: "下载时间计算器", desc: "按文件大小和网速算下载要多久", kw: "下载时间 网速 带宽 mbps",
    fields: [{ k: "s", l: "文件大小", v: 50 }, { k: "u", l: "单位", t: "sel", o: [[1, "GB"], [1 / 1024, "MB"], [1024, "TB"]], v: 1 }, { k: "b", l: "网速", u: "Mbps（宽带标称）", v: 500 }, { k: "e", l: "实际效率", u: "%", v: 85 }],
    run: function (v) { pos(v.s, v.b, v.e); var bits = v.s * v.u * 1024 * 1024 * 1024 * 8, sec = bits / (v.b * 1e6 * v.e / 100), h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = Math.round(sec % 60); return { big: ["约", (h ? h + " 小时 " : "") + (m ? m + " 分 " : "") + s + " 秒"], kv: [["实际下载速度", f(v.b * v.e / 100 / 8, 1) + " MB/s"]], note: "宽带标称单位是 Mbps（兆比特），除以 8 才是 MB/s。" }; } });

  /* ======================= 日期时间 ======================= */
  add({ cat: "date", id: "age-stats", name: "你活了多少秒", desc: "按出生时间算活了多少秒、心跳多少次、睡了多久", kw: "活了多少秒 心跳 有趣",
    fields: [{ k: "b", l: "出生时间", t: "dt", v: "2000-06-15T08:00" }],
    run: function (v) { var b = new Date(v.b); if (isNaN(b)) throw "请选择出生时间"; var s = (Date.now() - b) / 1000; if (s < 0) throw "出生时间在未来"; return { kv: [["秒", Math.floor(s).toLocaleString()], ["分钟", Math.floor(s / 60).toLocaleString()], ["小时", Math.floor(s / 3600).toLocaleString()], ["心跳约", (s / 60 * 75).toExponential(2).replace("e+", " × 10^") + " 次"], ["呼吸约", Math.floor(s / 60 * 16).toLocaleString() + " 次"], ["睡觉约", f(s / 86400 / 3 / 365.25, 1) + " 年"], ["下一个整亿秒", iso(new Date(b.getTime() + Math.ceil(s / 1e8) * 1e11))]] }; } });

  add({ cat: "date", id: "week-range", name: "第 N 周是哪几天", desc: "按 ISO 周数查某年第几周的起止日期", kw: "第几周 周数 日期范围",
    fields: [{ k: "y", l: "年份", v: new Date().getFullYear() }, { k: "w", l: "第几周", v: 42 }],
    run: function (v) { if (!Number.isInteger(v.y) || !Number.isInteger(v.w) || v.w < 1 || v.w > 53) throw "请输入正确的年份和周数"; var j4 = new Date(v.y, 0, 4), mon = plus(j4, -((j4.getDay() + 6) % 7) + (v.w - 1) * 7), sun = plus(mon, 6), last = new Date(v.y, 11, 28), maxW = Math.round((plus(last, -((last.getDay() + 6) % 7)) - plus(j4, -((j4.getDay() + 6) % 7))) / 6048e5) + 1; if (v.w > maxW) throw v.y + " 年只有 " + maxW + " 周"; return { big: ["第 " + v.w + " 周", iso(mon) + " ~ " + iso(sun)], kv: [["本年共", maxW + " 周"]], note: "按 ISO 8601：周一为一周开始，包含 1 月 4 日的那周为第 1 周。" }; } });

  add({ cat: "date", id: "lunar-year-info", name: "农历年份信息", desc: "某个农历年有没有闰月，每个月是大月还是小月", kw: "农历 闰月 大月 小月 年份",
    fields: [{ k: "y", l: "农历年份", v: 2026 }],
    run: function (v) { if (!Number.isInteger(v.y) || v.y < 1901 || v.y > 2099) throw "支持 1901–2099 年"; var L = function (yy, m, lp) { try { return H.lunar2solar(yy, m, 1, lp); } catch (e) { return null; } }, starts = []; for (var m = 1; m <= 12; m++) { starts.push([H.lunar(L(v.y, m)).m, L(v.y, m)]); var lp = L(v.y, m, true); if (lp) starts.push(["闰" + H.lunar(L(v.y, m)).m, lp]); } starts.push(["", L(v.y + 1, 1)]); var rows = [], leap = "无", tot = 0; for (var i = 0; i < starts.length - 1; i++) { var dd = dayDiff(starts[i][1], starts[i + 1][1]); tot += dd; if (starts[i][0][0] === "闰") leap = starts[i][0]; rows.push([starts[i][0], dd === 30 ? "大月（30 天）" : "小月（29 天）", iso(starts[i][1])]); } return { big: [v.y + " 年 · " + H.lunar(L(v.y, 1)).gz + "年", "闰月：" + leap], kv: [["全年", tot + " 天"], ["春节", iso(starts[0][1])]], table: { h: ["月份", "大小", "初一（公历）"], r: rows } }; } });

  var GAN = "甲乙丙丁戊己庚辛壬癸", ZHI = "子丑寅卯辰巳午未申酉戌亥";
  add({ cat: "date", id: "ganzhi-day", name: "干支纪日查询", desc: "查某天的干支日（日柱）、年干支和生肖", kw: "干支 日柱 甲子 天干地支",
    fields: [{ k: "d", l: "日期", t: "date", v: "today" }],
    run: function (v) { var d = D(v.d), n = ((dayDiff(new Date(1949, 9, 1), d) % 60) + 60) % 60, lu = H.lunar(d); return { big: ["日干支", GAN[n % 10] + ZHI[n % 12] + "日"], kv: [["年干支（农历年）", lu.gz + "年"], ["生肖", "鼠牛虎兔龙蛇马羊猴鸡狗猪"[((lu.y - 4) % 12 + 12) % 12]], ["农历", lu.s], ["六十甲子序号", n + 1]], note: "以 1949 年 10 月 1 日为甲子日推算。八字的年柱以立春为界，与农历年可能不同。" }; } });

  add({ cat: "date", id: "backward-schedule", name: "倒推日程表", desc: "从目标日期往前倒推各项准备事项的截止日期", kw: "倒推 日程 婚礼筹备 截止日期",
    fields: [{ k: "d", l: "目标日期", t: "date", v: "2027-05-01" }, { k: "t", l: "事项（提前几天）", t: "list", cols: [{ k: "n", l: "事项", t: "text", nv: "" }, { k: "b", l: "提前天数", nv: "" }], v: [["订场地", 180], ["拍婚纱照", 90], ["发请柬", 30], ["确认菜单", 14], ["最终彩排", 1]] }],
    run: function (v) { var T = D(v.d), rs = v.t.filter(function (r) { return String(r[0]).trim() && ok(r[1]); }).sort(function (a, b) { return b[1] - a[1]; }); if (!rs.length) throw "至少一个事项"; var t0 = today(); return { table: { h: ["事项", "截止日期", "距今"], r: rs.map(function (r) { var x = plus(T, -r[1]), k = dayDiff(t0, x); return [r[0], day(x), k < 0 ? "已过 " + -k + " 天" : k + " 天后"]; }) } }; } });

  add({ cat: "date", id: "weekday-list", name: "某段时间内的所有星期几", desc: "列出一段时间里所有的周三（或任意星期几），并计数", kw: "所有周三 星期几 列表 课表",
    fields: [{ k: "a", l: "开始", t: "date", v: "today" }, { k: "b", l: "结束", t: "date", v: "2026-12-31" }, { k: "w", l: "星期", t: "sel", o: [[1, "星期一"], [2, "星期二"], [3, "星期三"], [4, "星期四"], [5, "星期五"], [6, "星期六"], [0, "星期日"]], v: 3 }],
    run: function (v) { var a = D(v.a), b = D(v.b), w = Number(v.w); if (b < a) throw "结束日期需晚于开始"; var x = plus(a, (w - a.getDay() + 7) % 7), out = []; while (x <= b && out.length < 400) { out.push(iso(x)); x = plus(x, 7); } return { big: ["共", out.length + " 个" + WK[w]], kv: [["日期", out.join("、") || "无"]] }; } });

  /* ======================= 生活实用 ======================= */
  add({ cat: "life", id: "print-cost", name: "打印成本计算", desc: "按墨盒 / 硒鼓价格和打印页数算每页成本", kw: "打印 成本 墨盒 硒鼓 每页",
    fields: [{ k: "c", l: "墨盒 / 硒鼓价格", u: "元", v: 300 }, { k: "y", l: "标称打印页数", v: 1600 }, { k: "p", l: "纸张（每包 500 张）", u: "元", v: 25 }, { k: "n", l: "每月打印", u: "页", v: 300 }],
    run: function (v) { pos(v.c, v.y); need(v.p, v.n); var per = v.c / v.y + v.p / 500; return { big: ["每页", y(per)], kv: [["每月", y(per * v.n)], ["每年", y(per * v.n * 12)]], note: "标称页数按 5% 覆盖率，打照片和满页文字会少很多。" }; } });

  add({ cat: "life", id: "shower-water", name: "洗澡用水 / 费用", desc: "按花洒流量和洗澡时间算每月用水和水费、加热费", kw: "洗澡 用水 花洒 水费",
    fields: [{ k: "f", l: "花洒流量", u: "L/分钟", v: 9 }, { k: "t", l: "每次时长", u: "分钟", v: 12 }, { k: "n", l: "每天洗澡人次", v: 3 }, { k: "w", l: "水价", u: "元/吨", v: 5 }, { k: "e", l: "每吨热水加热费", u: "元", v: 15 }],
    run: function (v) { need(v.f, v.t, v.n, v.w, v.e); var L = v.f * v.t * v.n * 30, hot = L * .6 / 1000; return { big: ["每月用水", f(L / 1000, 2) + " 吨"], kv: [["水费", y(L / 1000 * v.w)], ["加热费（热水约 60%）", y(hot * v.e)], ["每次少洗 2 分钟，每月省", f(v.f * 2 * v.n * 30, 0) + " 升"]] }; } });

  add({ cat: "life", id: "pot-soil", name: "花盆土量计算", desc: "按花盆口径、底径和高度算需要几升营养土", kw: "花盆 营养土 土量 种花",
    fields: [{ k: "a", l: "盆口直径", u: "cm", v: 25 }, { k: "b", l: "盆底直径", u: "cm", v: 18 }, { k: "h", l: "盆高", u: "cm", v: 22 }, { k: "n", l: "盆数", v: 4 }],
    run: function (v) { pos(v.a, v.b, v.h, v.n); var R = v.a / 2, r = v.b / 2, V = Math.PI * v.h * (R * R + R * r + r * r) / 3 / 1000 * .9; return { big: ["需要土约", f(V * v.n, 1) + " L"], kv: [["每盆", f(V, 1) + " L"], ["按 50 L / 袋", Math.ceil(V * v.n / 50) + " 袋"]], note: "已按装到 90% 高度计算。底部铺 2–3 cm 陶粒利于排水。" }; } });

  add({ cat: "life", id: "aquarium", name: "鱼缸容积 / 重量", desc: "按长宽高算鱼缸水量、满水总重和大概能养多少鱼", kw: "鱼缸 水量 承重 养鱼",
    fields: [{ k: "l", l: "长", u: "cm", v: 80 }, { k: "w", l: "宽", u: "cm", v: 35 }, { k: "h", l: "高", u: "cm", v: 45 }, { k: "t", l: "玻璃厚度", u: "mm", v: 8 }],
    run: function (v) { pos(v.l, v.w, v.h, v.t); var tt = v.t / 10, L = (v.l - 2 * tt) * (v.w - 2 * tt) * (v.h - 5) / 1000, glass = (v.l * v.w + 2 * v.l * v.h + 2 * v.w * v.h) / 1e4 * v.t * 2.5; return { big: ["水量约", f(L, 0) + " L"], kv: [["满水总重（含玻璃）", f(L + glass, 0) + " kg"], ["玻璃重", f(glass, 0) + " kg"], ["小型鱼（按 1 cm 鱼长 / 升）", "约 " + f(L, 0) + " cm 总鱼长"], ["底柜承重至少", f((L + glass) * 1.3, 0) + " kg"]] }; } });

  add({ cat: "life", id: "pet-cost", name: "养宠物每年花多少钱", desc: "猫狗口粮、猫砂、疫苗驱虫、洗护、保险一年和一辈子的开销", kw: "养猫 养狗 花费 一年",
    fields: [{ k: "f", l: "口粮 / 罐头（每月）", u: "元", v: 300 }, { k: "l", l: "猫砂 / 尿垫（每月）", u: "元", v: 80 }, { k: "v", l: "疫苗 + 驱虫（每年）", u: "元", v: 800 }, { k: "g", l: "洗护美容（每月）", u: "元", v: 100 }, { k: "i", l: "宠物保险 / 医疗预留（每年）", u: "元", v: 1000 }, { k: "o", l: "玩具零食等（每月）", u: "元", v: 100 }, { k: "y", l: "预计寿命", u: "年", v: 15 }],
    run: function (v) { need(v.f, v.l, v.v, v.g, v.i, v.o); pos(v.y); var yr = (v.f + v.l + v.g + v.o) * 12 + v.v + v.i; return { big: ["每年约", y(yr)], kv: [["每月约", y(yr / 12)], ["一辈子约", wy(yr * v.y)]], note: "绝育、看病等一次性大额支出另算，建议单独留一笔应急金。" }; } });

  add({ cat: "life", id: "cake-pan", name: "蛋糕模具配方换算", desc: "6 寸方子换成 8 寸模具，材料要乘几倍", kw: "蛋糕 模具 6寸 8寸 配方 换算",
    fields: [{ k: "a", l: "原配方模具", u: "寸", v: 6 }, { k: "b", l: "你的模具", u: "寸", v: 8 }, { k: "ha", l: "原模具高度", u: "cm", v: 7 }, { k: "hb", l: "你的模具高度", u: "cm", v: 7 }],
    run: function (v) { pos(v.a, v.b, v.ha, v.hb); var k = Math.pow(v.b / v.a, 2) * v.hb / v.ha; return { big: ["材料乘以", g(k, 3) + " 倍"], kv: [["鸡蛋参考（原 3 个）", f(3 * k, 1) + " 个"]], note: "1 寸约 2.54 cm（6 寸直径约 15 cm）。模具变大后烤温略降 5–10 °C、时间延长 10–15 分钟。" }; } });

  add({ cat: "life", id: "lottery-odds", name: "彩票中奖概率", desc: "双色球、大乐透头奖概率，买多少注能有多大把握", kw: "双色球 大乐透 中奖概率 彩票",
    fields: [{ k: "t", l: "彩种", t: "sel", o: [[17721088, "双色球（6/33 + 1/16）"], [21425712, "大乐透（5/35 + 2/12）"], [1000, "福彩 3D 直选"], [100000, "排列 5"]], v: 17721088 }, { k: "n", l: "购买注数", v: 10 }],
    run: function (v) { pos(v.n); var p = 1 - Math.pow(1 - 1 / v.t, v.n); return { big: ["头奖概率", "1 / " + v.t.toLocaleString()], kv: [["买 " + v.n + " 注中头奖", pct(p, 6)], ["50% 把握需买", Math.ceil(Math.log(.5) / Math.log(1 - 1 / v.t)).toLocaleString() + " 注"], ["花费（2 元/注）", y(v.n * 2)]], note: "彩票是娱乐，返奖率约 50%，长期买必然亏钱。" }; } });

  add({ cat: "life", id: "work-hours-to-buy", name: "买这个要工作多久", desc: "按你的工资算买一样东西要上多少小时班", kw: "工作多久 时薪 消费 值不值",
    fields: [{ k: "p", l: "商品价格", u: "元", v: 8999 }, { k: "s", l: "月税后收入", u: "元", v: 12000 }, { k: "h", l: "每月工作小时", v: 174 }],
    run: function (v) { pos(v.p, v.s, v.h); var hr = v.p / (v.s / v.h); return { big: ["需要工作", f(hr, 1) + " 小时"], kv: [["约", f(hr / 8, 1) + " 个工作日"], ["占月收入", pct(v.p / v.s, 0)], ["你的时薪", y(v.s / v.h)]] }; } });

  /* ======================= 教育学业 ======================= */
  add({ cat: "edu", id: "cefr", name: "雅思 / 托福对应欧框等级", desc: "雅思、托福成绩对应 CEFR（A1–C2）等级", kw: "cefr 欧框 b2 c1 英语等级",
    fields: [{ k: "t", l: "考试", t: "sel", o: ["雅思", "托福 iBT"] }, { k: "s", l: "总分", v: 6.5 }],
    run: function (v) { need(v.s); var c = v.t === "雅思" ? (v.s >= 8.5 ? "C2" : v.s >= 7 ? "C1" : v.s >= 5.5 ? "B2" : v.s >= 4 ? "B1" : "A2 及以下") : (v.s >= 114 ? "C2" : v.s >= 95 ? "C1" : v.s >= 72 ? "B2" : v.s >= 42 ? "B1" : "A2 及以下"); return { big: ["CEFR", c], note: "依据 IELTS 和 ETS 官方对照。B2 大致相当于能用英语工作学习，C1 为流利熟练。" }; } });

  add({ cat: "edu", id: "kaoyan-target", name: "考研目标分拆解", desc: "把目标总分拆到政治、英语、数学 / 专业课各科", kw: "考研 目标分 分科 规划",
    fields: [{ k: "t", l: "目标总分", v: 380 }, { k: "s", l: "科目（名称, 满分, 你的把握 1–5）", t: "list", cols: [{ k: "n", l: "科目", t: "text", nv: "" }, { k: "f", l: "满分", nv: 150 }, { k: "c", l: "把握", nv: 3 }], v: [["政治", 100, 3], ["英语一", 100, 2], ["数学一", 150, 3], ["专业课", 150, 4]] }],
    run: function (v) { pos(v.t); var rs = v.s.filter(function (r) { return ok(r[1]) && r[1] > 0; }); if (!rs.length) throw "至少一科"; var full = rs.reduce(function (s, r) { return s + r[1]; }, 0); if (v.t > full) throw "目标超过满分 " + full; var w = rs.map(function (r) { return r[1] * (0.7 + 0.1 * (ok(r[2]) ? r[2] : 3)); }), W = w.reduce(function (s, x) { return s + x; }, 0); return { big: ["得分率", pct(v.t / full, 1)], table: { h: ["科目", "满分", "目标分"], r: rs.map(function (r, i) { return [r[0], r[1], f(Math.min(v.t * w[i] / W, r[1]), 0)]; }) }, note: "把握越大分得越多。注意每科还要过国家线单科线。" }; } });

  add({ cat: "edu", id: "jlpt", name: "日语能力考 JLPT 合格判定", desc: "按各部分得分判断 N1–N5 是否合格（总分线 + 单项线）", kw: "jlpt 日语 n1 n2 合格",
    fields: [{ k: "l", l: "级别", t: "sel", o: ["N1", "N2", "N3", "N4", "N5"] }, { k: "a", l: "言语知识（文字词汇语法）", v: 35 }, { k: "b", l: "读解（N4/N5 并入上项，填 0）", v: 30 }, { k: "c", l: "听解", v: 40 }],
    run: function (v) { need(v.a, v.b, v.c); var P = { N1: 100, N2: 90, N3: 95, N4: 90, N5: 80 }[v.l], hi = v.l === "N4" || v.l === "N5", tot = v.a + v.b + v.c, mins = hi ? [[v.a + v.b, 38, "言语知识·读解"], [v.c, 19, "听解"]] : [[v.a, 19, "言语知识"], [v.b, 19, "读解"], [v.c, 19, "听解"]], fail = mins.filter(function (m) { return m[0] < m[1]; }); return { big: [tot >= P && !fail.length ? "合格" : "不合格", "总分 " + tot + " / 180（合格线 " + P + "）"], kv: fail.length ? [["单项未过", fail.map(function (m) { return m[2] + " < " + m[1]; }).join("，")]] : [["单项", "全部达标"]] }; } });

  add({ cat: "edu", id: "gpa-target", name: "累计 GPA 还能拉到多少", desc: "已修学分和当前 GPA，剩下的学分要拿多少才能到目标", kw: "gpa 目标 累计 提升",
    fields: [{ k: "g", l: "当前累计 GPA", v: 3.2 }, { k: "c", l: "已修学分", v: 90 }, { k: "t", l: "目标 GPA", v: 3.5 }, { k: "r", l: "剩余学分", v: 40 }, { k: "m", l: "满分绩点", v: 4 }],
    run: function (v) { need(v.g, v.c, v.t); pos(v.r, v.m); var n = (v.t * (v.c + v.r) - v.g * v.c) / v.r; return { big: ["剩余课程需要", f(n, 2)], tag: n > v.m ? "目标无法达到" : n <= v.g ? "保持现状即可" : null, kv: [["全拿满分最高可到", f((v.g * v.c + v.m * v.r) / (v.c + v.r), 3)]] }; } });

  add({ cat: "edu", id: "pocket-money", name: "孩子零花钱参考", desc: "按年龄给零花钱的参考金额，和储蓄、花费、分享的分配", kw: "零花钱 孩子 财商 储蓄",
    fields: [{ k: "a", l: "孩子年龄", u: "岁", v: 9 }, { k: "k", l: "每岁每周", u: "元", v: 3 }],
    run: function (v) { pos(v.a); need(v.k); var w = v.a * v.k; return { big: ["每周", y(w)], kv: [["每月约", y(w * 4.3)], ["储蓄（50%）", y(w * .5)], ["自由花（40%）", y(w * .4)], ["分享 / 捐赠（10%）", y(w * .1)]], note: "常见做法是按“年龄 × 固定金额”每周给，从 5–6 岁开始，配合记账培养财商。" }; } });

  add({ cat: "edu", id: "homework-time", name: "作业时长规定（双减）", desc: "按年级查书面作业时长上限和睡眠时间要求", kw: "双减 作业时长 睡眠 小学 初中",
    fields: [{ k: "g", l: "年级", t: "sel", o: ["小学一、二年级", "小学三至六年级", "初中", "高中"] }],
    run: function (v) { var T = { "小学一、二年级": ["不布置家庭书面作业", "10 小时"], "小学三至六年级": ["平均不超过 60 分钟", "10 小时"], "初中": ["平均不超过 90 分钟", "9 小时"], "高中": ["合理安排（无统一上限）", "8 小时"] }[v.g]; return { kv: [["书面作业", T[0]], ["每天睡眠应达到", T[1]]], note: "依据《关于进一步减轻义务教育阶段学生作业负担和校外培训负担的意见》和教育部睡眠管理通知。" }; } });

  add({ cat: "edu", id: "speech-length", name: "演讲稿字数 / 时长", desc: "按演讲时长算稿子写多少字，或按字数算要讲多久", kw: "演讲稿 字数 时长 语速",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["时长（分钟）", "字数"] }, { k: "x", l: "数值", v: 5 }, { k: "s", l: "语速", t: "sel", o: [[200, "中文 · 偏慢 200 字/分"], [240, "中文 · 正常 240 字/分"], [280, "中文 · 偏快 280 字/分"], [130, "英文 130 词/分"]], v: 240 }],
    run: function (v) { pos(v.x); return v.m[0] === "时" ? { big: ["稿子约", f(v.x * v.s, 0) + (v.s === 130 ? " 词" : " 字")], note: "留 10% 给停顿和互动。" } : { big: ["约", f(v.x / v.s, 1) + " 分钟"] }; } });

  /* ======================= 商业财税 ======================= */
  add({ cat: "biz", id: "price-increase", name: "涨价后销量能掉多少", desc: "提价后销量下降多少以内毛利额仍不减少", kw: "涨价 提价 销量 毛利",
    fields: [{ k: "m", l: "原毛利率", u: "%", v: 30 }, { k: "i", l: "涨价幅度", u: "%", v: 10 }],
    run: function (v) { pos(v.m, v.i); var d = v.i / (v.m + v.i); return { big: ["销量最多可降", pct(d, 1)], kv: [["涨价后毛利率", pct((v.m + v.i) / (100 + v.i), 1)]], note: "毛利率越低，涨价的空间越大：毛利 30% 涨价 10%，销量掉 25% 以内都不亏毛利。" }; } });

  add({ cat: "biz", id: "staffing", name: "门店排班人数测算", desc: "按营业时长、每班岗位数和员工工时算需要招几个人", kw: "排班 人数 门店 人力",
    fields: [{ k: "h", l: "每天营业", u: "小时", v: 14 }, { k: "d", l: "每周营业", u: "天", v: 7 }, { k: "p", l: "同时在岗人数", v: 3 }, { k: "w", l: "每人每周工时", u: "小时", v: 44 }, { k: "r", l: "请假 / 培训余量", u: "%", v: 10 }],
    run: function (v) { pos(v.h, v.d, v.p, v.w); need(v.r); var need0 = v.h * v.d * v.p / v.w * (1 + v.r / 100); return { big: ["需要", Math.ceil(need0) + " 人"], kv: [["每周总工时", f(v.h * v.d * v.p, 0) + " 小时"]], note: "标准工时为每周 40 小时，超出部分需支付加班费；综合工时制需审批。" }; } });

  add({ cat: "biz", id: "payment-terms", name: "账期 / 付款到期日", desc: "按开票日期和账期（N 天、月结 N 天）算付款到期日", kw: "账期 月结 付款 到期日 应收",
    fields: [{ k: "d", l: "开票 / 交货日期", t: "date", v: "today" }, { k: "t", l: "账期类型", t: "sel", o: ["开票后 N 天", "月结 N 天（次月 1 日起算）"] }, { k: "n", l: "N", u: "天", v: 30 }],
    run: function (v) { pos(v.n); var d = D(v.d), base = v.t[0] === "月" ? new Date(d.getFullYear(), d.getMonth() + 1, 0) : d, due = plus(base, v.n), w = due.getDay(); return { big: ["到期日", day(due)], kv: [["距今", dayDiff(today(), due) + " 天"], ["遇周末", w === 6 || w === 0 ? "顺延到 " + day(plus(due, w === 6 ? 2 : 1)) : "—"]], note: "月结按当月最后一天加 N 天计算，部分公司口径不同，以合同为准。" }; } });

  add({ cat: "biz", id: "late-fee", name: "逾期违约金 / 滞纳金", desc: "按日费率（如万分之五）和逾期天数算违约金", kw: "滞纳金 违约金 万分之五 逾期",
    fields: [{ k: "a", l: "欠款金额", u: "元", v: 100000 }, { k: "r", l: "日费率", u: "‱（万分之）", v: 5 }, { k: "d1", l: "应付日期", t: "date", v: "2026-08-01" }, { k: "d2", l: "实际付款日期", t: "date", v: "today" }],
    run: function (v) { pos(v.a); need(v.r); var n = Math.max(dayDiff(D(v.d1), D(v.d2)), 0); return { big: ["违约金", y(v.a * v.r / 1e4 * n)], kv: [["逾期", n + " 天"], ["折合年化", pct(v.r / 1e4 * 365, 2)]], note: "税款、社保滞纳金按日加收万分之五。合同违约金过高的（超过损失 30%），可请求法院调低。" }; } });

  add({ cat: "biz", id: "saas-metrics", name: "订阅业务指标（MRR / ARR / LTV）", desc: "按月经常性收入、客户数和流失率算 ARR、ARPU、LTV", kw: "mrr arr saas 流失率 ltv",
    fields: [{ k: "m", l: "MRR（月经常性收入）", u: "元", v: 200000 }, { k: "c", l: "付费客户数", v: 400 }, { k: "ch", l: "月流失率", u: "%", v: 3 }, { k: "g", l: "毛利率", u: "%", v: 75 }, { k: "cac", l: "获客成本 CAC", u: "元", v: 5000 }],
    run: function (v) { pos(v.m, v.c, v.ch); need(v.g, v.cac); var arpu = v.m / v.c, ltv = arpu * v.g / 100 / (v.ch / 100); return { big: ["ARR", wy(v.m * 12)], kv: [["ARPU（每客户月收入）", y(arpu)], ["平均客户寿命", f(100 / v.ch, 1) + " 个月"], ["LTV", y(ltv)], ["LTV / CAC", v.cac ? g(ltv / v.cac, 3) : "—"], ["CAC 回收期", v.cac ? f(v.cac / (arpu * v.g / 100), 1) + " 个月" : "—"]], note: "LTV / CAC 大于 3、回收期小于 12 个月一般被认为健康。" }; } });

  add({ cat: "biz", id: "ab-test", name: "A/B 测试显著性", desc: "两个版本的转化率差异是否显著（双比例 z 检验）", kw: "ab测试 显著性 转化率 p值",
    fields: [{ k: "na", l: "A 组访客", v: 5000 }, { k: "ca", l: "A 组转化", v: 250 }, { k: "nb", l: "B 组访客", v: 5000 }, { k: "cb", l: "B 组转化", v: 300 }],
    run: function (v) { pos(v.na, v.nb); need(v.ca, v.cb); var pa = v.ca / v.na, pb = v.cb / v.nb, p = (v.ca + v.cb) / (v.na + v.nb), se = Math.sqrt(p * (1 - p) * (1 / v.na + 1 / v.nb)); if (!se) throw "转化数据不足"; var z = (pb - pa) / se, pv = 2 * (1 - ncdf(Math.abs(z))); return { big: [pv < .05 ? "差异显著" : "差异不显著", "p = " + g(pv, 4)], kv: [["A 转化率", pct(pa)], ["B 转化率", pct(pb)], ["相对提升", pa ? pct(pb / pa - 1, 1) : "—"], ["z 值", g(z, 4)]], note: "按 95% 置信度（p < 0.05）判断。样本太小时不要过早下结论。" }; } });

  add({ cat: "biz", id: "workstation-cost", name: "办公室工位成本", desc: "按租金单价、面积和人数算每个工位每月的成本", kw: "工位 办公室 租金 每平米每天",
    fields: [{ k: "r", l: "租金", u: "元/㎡/天", v: 5 }, { k: "a", l: "租赁面积", u: "㎡", v: 300 }, { k: "p", l: "物业费", u: "元/㎡/月", v: 25 }, { k: "o", l: "水电网络等每月", u: "元", v: 5000 }, { k: "n", l: "工位数", v: 40 }],
    run: function (v) { pos(v.a, v.n); need(v.r, v.p, v.o); var m = v.r * v.a * 365 / 12 + v.p * v.a + v.o; return { big: ["每工位每月", y(m / v.n)], kv: [["每月总成本", y(m)], ["人均面积", f(v.a / v.n, 1) + " ㎡"]], note: "写字楼报价“元/㎡/天”按建筑面积，实际得房率一般 60%–75%。" }; } });

  add({ cat: "biz", id: "cash-discount", name: "现金折扣年化成本", desc: "“2/10, n/30”这类付款条件，放弃折扣相当于多高的年化利率", kw: "现金折扣 2/10 n/30 应付账款",
    fields: [{ k: "d", l: "折扣", u: "%", v: 2 }, { k: "a", l: "折扣期", u: "天", v: 10 }, { k: "b", l: "信用期", u: "天", v: 30 }],
    run: function (v) { pos(v.d, v.b); need(v.a); if (v.b <= v.a) throw "信用期要长于折扣期"; var c = v.d / (100 - v.d) * 365 / (v.b - v.a); return { big: ["放弃折扣的年化成本", pct(c, 1)], kv: [["复利口径", pct(Math.pow(1 + v.d / (100 - v.d), 365 / (v.b - v.a)) - 1, 1)]], note: "年化成本高于贷款利率时，借钱提前付款拿折扣更划算。" }; } });

  /* ======================= 工程建筑 ======================= */
  add({ cat: "build", id: "deck-boards", name: "户外地板 / 防腐木用量", desc: "按面积和板材规格算防腐木地板块数和龙骨", kw: "防腐木 户外地板 塑木 龙骨 露台",
    fields: [{ k: "a", l: "铺设面积", u: "㎡", v: 20 }, { k: "w", l: "板宽", u: "mm", v: 140 }, { k: "g", l: "板缝", u: "mm", v: 5 }, { k: "l", l: "板长", u: "m", v: 4 }, { k: "j", l: "龙骨间距", u: "mm", v: 400 }],
    run: function (v) { pos(v.a, v.w, v.l, v.j); need(v.g); var per = (v.w + v.g) / 1000 * v.l; return { big: ["地板", Math.ceil(v.a / per * 1.08) + " 块"], kv: [["龙骨约", f(v.a / (v.j / 1000) * 1.05, 1) + " m"], ["不锈钢螺丝约", Math.ceil(v.a / per * 1.08 * v.l / (v.j / 1000) * 2) + " 颗"]], note: "含 8% 损耗。防腐木留 3–5 mm 缝，塑木留 5–8 mm。" }; } });

  add({ cat: "build", id: "window-floor-ratio", name: "窗地面积比（采光）", desc: "窗户面积和地面面积之比，判断采光是否达标", kw: "窗地比 采光 窗户面积",
    fields: [{ k: "w", l: "窗洞口面积", u: "㎡", v: 2.4 }, { k: "f", l: "房间地面面积", u: "㎡", v: 15 }],
    run: function (v) { pos(v.w, v.f); var r = v.w / v.f; return { big: ["窗地比", "1 : " + f(1 / r, 1)], tag: r >= 1 / 7 ? "达标" : "采光不足", kv: [["至少需要窗面积", f(v.f / 7, 2) + " ㎡"]], note: "《住宅设计规范》GB 50096：卧室、起居室、厨房侧面采光的窗地面积比不应低于 1/7。" }; } });

  add({ cat: "build", id: "rainwater", name: "屋面雨水流量", desc: "按屋面面积和暴雨强度算雨水流量，估算落水管数量", kw: "雨水 排水 落水管 屋面",
    fields: [{ k: "a", l: "屋面汇水面积", u: "㎡", v: 200 }, { k: "q", l: "设计暴雨强度", u: "mm/小时", v: 100 }, { k: "c", l: "径流系数", v: 0.9 }, { k: "p", l: "单根落水管排水能力", u: "L/s", v: 5, hint: "DN100 重力流约 5 L/s" }],
    run: function (v) { pos(v.a, v.q, v.c, v.p); var Q = v.a * v.q / 3600 * v.c; return { big: ["雨水流量", f(Q, 2) + " L/s"], kv: [["落水管", Math.ceil(Q / v.p) + " 根"], ["每小时雨水", f(Q * 3.6, 1) + " m³"]], note: "仅作估算，正式设计按当地暴雨强度公式和 GB 50015 计算。" }; } });

  add({ cat: "build", id: "septic-tank", name: "化粪池容积估算", desc: "按使用人数估算化粪池有效容积", kw: "化粪池 容积 农村 户厕",
    fields: [{ k: "n", l: "使用人数", v: 5 }, { k: "q", l: "每人每天污水量", u: "L", v: 40 }, { k: "t", l: "停留时间", u: "小时", v: 24 }, { k: "c", l: "清掏周期", u: "月", v: 12 }],
    run: function (v) { pos(v.n, v.q, v.t, v.c); var w = v.n * v.q * v.t / 24 / 1000, s = v.n * .4 * v.c * 30 / 1000 * 1.2; return { big: ["有效容积约", f(Math.max(w + s, 1.5), 2) + " m³"], kv: [["污水部分", f(w, 2) + " m³"], ["污泥部分", f(s, 2) + " m³"]], note: "农村三格式户厕有效容积一般不小于 1.5 m³。正式设计参照 GB 50015。" }; } });

  add({ cat: "build", id: "floor-load", name: "楼板承重估算", desc: "鱼缸、书柜、保险柜等重物放在楼板上，单位面积荷载是否超标", kw: "楼板承重 荷载 鱼缸 书柜",
    fields: [{ k: "w", l: "物品总重", u: "kg", v: 600 }, { k: "l", l: "底面长", u: "cm", v: 120 }, { k: "b", l: "底面宽", u: "cm", v: 50 }],
    run: function (v) { pos(v.w, v.l, v.b); var q = v.w * 9.8 / 1000 / (v.l * v.b / 1e4); return { big: ["局部荷载", f(q, 2) + " kN/㎡"], tag: q <= 2 ? "在住宅设计荷载内" : q <= 4 ? "超过设计值，建议靠墙或分散" : "明显超载，请咨询结构工程师", kv: [["住宅楼面活荷载标准", "2.0 kN/㎡（约 200 kg/㎡）"]], note: "依据 GB 50009。楼板实际有安全系数，但重物尽量放在承重墙或梁附近，用垫板扩大受力面积。" }; } });

  add({ cat: "build", id: "paver", name: "地面砖 / 透水砖块数", desc: "按面积和砖块规格算铺装砖块数", kw: "透水砖 广场砖 植草砖 铺装",
    fields: [{ k: "a", l: "铺装面积", u: "㎡", v: 50 }, { k: "l", l: "砖长", u: "mm", v: 200 }, { k: "w", l: "砖宽", u: "mm", v: 100 }, { k: "g", l: "砖缝", u: "mm", v: 3 }],
    run: function (v) { pos(v.a, v.l, v.w); need(v.g); var per = (v.l + v.g) * (v.w + v.g) / 1e6; return { big: ["砖块", Math.ceil(v.a / per * 1.05) + " 块"], kv: [["每平方米", f(1 / per, 1) + " 块"], ["垫层中砂（3 cm）", f(v.a * .03, 2) + " m³"]] }; } });

  add({ cat: "build", id: "door-opening", name: "门洞尺寸预留", desc: "按门扇尺寸算需要预留的门洞宽高", kw: "门洞 尺寸 室内门 预留",
    fields: [{ k: "w", l: "门扇宽", u: "mm", v: 800 }, { k: "h", l: "门扇高", u: "mm", v: 2050 }, { k: "t", l: "门型", t: "sel", o: [[60, "套装木门（含门套）"], [40, "铝合金 / 极简门"], [100, "推拉门（单扇，含搭接）"]], v: 60 }],
    run: function (v) { pos(v.w, v.h); return { big: ["门洞宽", v.w + v.t + " mm"], kv: [["门洞高（含地面找平）", v.h + 30 + " mm"]], note: "常用室内门扇：卧室 800–900 mm，卫生间 700–800 mm，高 2000–2100 mm。最终以门厂上门测量为准。" }; } });

  /* ======================= 科学工程 ======================= */
  add({ cat: "science", id: "combined-gas-law", name: "气体状态方程（P₁V₁/T₁ = P₂V₂/T₂）", desc: "一定量气体在压强、温度变化后的体积", kw: "气体 状态方程 波义耳 查理",
    fields: [{ k: "p1", l: "初始压强", u: "kPa", v: 101.3 }, { k: "v1", l: "初始体积", u: "L", v: 10 }, { k: "t1", l: "初始温度", u: "°C", v: 20 }, { k: "p2", l: "末态压强", u: "kPa", v: 200 }, { k: "t2", l: "末态温度", u: "°C", v: 80 }],
    run: function (v) { pos(v.p1, v.v1, v.p2); need(v.t1, v.t2); var T1 = v.t1 + 273.15, T2 = v.t2 + 273.15; if (T1 <= 0 || T2 <= 0) throw "温度低于绝对零度"; var V2 = v.p1 * v.v1 / T1 * T2 / v.p2; return { big: ["末态体积", g(V2, 6) + " L"], kv: [["体积变化", pct(V2 / v.v1 - 1, 1)]] }; } });

  add({ cat: "science", id: "boiling-point", name: "海拔与沸点", desc: "按海拔算大气压和水的沸点，高原煮饭参考", kw: "沸点 海拔 高原 气压",
    fields: [{ k: "h", l: "海拔", u: "m", v: 3650 }],
    run: function (v) { need(v.h); if (v.h > 9000) throw "海拔不超过 9000 m"; var P = 101.325 * Math.pow(1 - 2.25577e-5 * v.h, 5.25588), mm = P * 7.50062, T = 1730.63 / (8.07131 - Math.log10(mm)) - 233.426; return { big: ["水的沸点", f(T, 1) + " °C"], kv: [["大气压", f(P, 1) + " kPa"], ["含氧量相当于海平面的", pct(P / 101.325, 0)]], note: "拉萨约 3650 m，水约 88 °C 沸腾，需高压锅煮饭。" }; } });

  add({ cat: "science", id: "altitude-pressure", name: "气压与海拔互算", desc: "按海拔算气压，或按气压计读数算海拔", kw: "气压 海拔 高度计",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["海拔（m）", "气压（hPa）"] }, { k: "x", l: "数值", v: 1000 }, { k: "p0", l: "海平面气压", u: "hPa", v: 1013.25 }],
    run: function (v) { need(v.x); pos(v.p0); if (v.m[0] === "海") { var P = v.p0 * Math.pow(1 - 2.25577e-5 * v.x, 5.25588); return { big: ["气压", f(P, 1) + " hPa"], kv: [["mmHg", f(P * .750062, 1)]] }; } pos(v.x); return { big: ["海拔", f((1 - Math.pow(v.x / v.p0, 1 / 5.25588)) / 2.25577e-5, 0) + " m"], note: "气压随天气变化，用当天海平面气压校准更准。" }; } });

  add({ cat: "science", id: "hydro-power", name: "水力发电功率", desc: "按流量、水头和效率算小水电功率和年发电量", kw: "水力发电 水头 流量 功率",
    fields: [{ k: "q", l: "流量", u: "m³/s", v: 2 }, { k: "h", l: "有效水头", u: "m", v: 30 }, { k: "e", l: "总效率", u: "%", v: 85 }, { k: "t", l: "年利用小时", u: "小时", v: 4000 }],
    run: function (v) { pos(v.q, v.h, v.e); need(v.t); var P = 1000 * 9.81 * v.q * v.h * v.e / 100 / 1000; return { big: ["功率", f(P, 1) + " kW"], kv: [["年发电量", f(P * v.t / 1e4, 1) + " 万 kWh"]] }; } });

  add({ cat: "science", id: "wind-power", name: "风力发电功率", desc: "按风轮直径、风速和功率系数算风机功率", kw: "风力发电 风机 功率 贝兹极限",
    fields: [{ k: "d", l: "风轮直径", u: "m", v: 100 }, { k: "v", l: "风速", u: "m/s", v: 8 }, { k: "cp", l: "功率系数 Cp", v: 0.4 }, { k: "rho", l: "空气密度", u: "kg/m³", v: 1.225 }],
    run: function (v) { pos(v.d, v.v, v.cp, v.rho); if (v.cp > .593) throw "Cp 不能超过贝兹极限 0.593"; var A = Math.PI * v.d * v.d / 4, P = .5 * v.rho * A * Math.pow(v.v, 3) * v.cp; return { big: ["功率", P >= 1e6 ? f(P / 1e6, 2) + " MW" : f(P / 1e3, 1) + " kW"], kv: [["扫风面积", f(A, 0) + " ㎡"], ["风功率密度", f(.5 * v.rho * Math.pow(v.v, 3), 0) + " W/㎡"]], note: "功率与风速的三次方成正比，风速翻倍功率变 8 倍。" }; } });

  add({ cat: "science", id: "sound-distance", name: "声音随距离衰减", desc: "点声源在不同距离的声压级（每远一倍降 6 dB）", kw: "噪音 距离 衰减 分贝",
    fields: [{ k: "l", l: "已知声压级", u: "dB", v: 85 }, { k: "r1", l: "测量距离", u: "m", v: 1 }, { k: "r2", l: "目标距离", u: "m", v: 20 }],
    run: function (v) { need(v.l); pos(v.r1, v.r2); var L2 = v.l - 20 * Math.log10(v.r2 / v.r1); return { big: ["目标处约", f(L2, 1) + " dB"], kv: [["衰减", f(v.l - L2, 1) + " dB"], ["降到 55 dB 需要", f(v.r1 * Math.pow(10, (v.l - 55) / 20), 1) + " m"]], note: "按自由场点声源，墙体、障碍和地面吸收会让实际更低。居住区昼间噪声限值一般 55 dB。" }; } });

  add({ cat: "science", id: "reynolds", name: "雷诺数计算", desc: "按流速、管径和运动黏度算雷诺数，判断层流还是湍流", kw: "雷诺数 层流 湍流 流体",
    fields: [{ k: "v", l: "流速", u: "m/s", v: 1 }, { k: "d", l: "管径 / 特征长度", u: "mm", v: 50 }, { k: "n", l: "流体", t: "sel", o: [[1.004e-6, "水 20 °C"], [0.658e-6, "水 40 °C"], [1.5e-5, "空气 20 °C"], [1e-4, "轻质油"]], v: 1.004e-6 }],
    run: function (v) { pos(v.v, v.d); var Re = v.v * v.d / 1000 / v.n; return { big: ["雷诺数", g(Re, 6)], tag: Re < 2300 ? "层流" : Re < 4000 ? "过渡流" : "湍流" }; } });

  add({ cat: "science", id: "kettle-time", name: "烧水时间计算", desc: "按水量、功率和水温算电水壶烧开要多久、耗多少电", kw: "烧水 电水壶 时间 功率",
    fields: [{ k: "l", l: "水量", u: "L", v: 1.5 }, { k: "t", l: "初始水温", u: "°C", v: 20 }, { k: "e", l: "目标温度", u: "°C", v: 100 }, { k: "p", l: "功率", u: "W", v: 1800 }, { k: "eff", l: "效率", u: "%", v: 85 }],
    run: function (v) { pos(v.l, v.p, v.eff); need(v.t, v.e); var Q = v.l * 4186 * (v.e - v.t), s = Q / (v.p * v.eff / 100); return { big: ["约", Math.floor(s / 60) + " 分 " + Math.round(s % 60) + " 秒"], kv: [["耗电", f(Q / (v.eff / 100) / 3.6e6, 3) + " 度"], ["所需热量", f(Q / 1000, 0) + " kJ"]] }; } });
})();
