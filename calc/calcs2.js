/* Calculator registry, batch 2 (2026-10). Uses helpers exported by calcs.js. */
(function () {
  "use strict";
  var H = window.CX.h, add = H.add, ok = H.ok, need = H.need, pos = H.pos, f = H.f, g = H.g, y = H.y, wy = H.wy, pct = H.pct,
    D = H.D, iso = H.iso, WK = H.WK, dayDiff = H.dayDiff, addMonths = H.addMonths, ymd = H.ymd, pmt = H.pmt, taxBy = H.taxBy, IIT = H.IIT, unit = H.unit;
  function irr(flows) { // periodic IRR by bisection
    var lo = -0.99, hi = 10;
    function npv(r) { return flows.reduce(function (s, c, i) { return s + c / Math.pow(1 + r, i); }, 0); }
    if (npv(lo) * npv(hi) > 0) throw "现金流无法求出收益率（需有正有负）";
    for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (npv(lo) * npv(m) <= 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }
  function nums(s) { var a = String(s).split(/[\s,，;；]+/).filter(Boolean).map(Number); if (!a.length || a.some(isNaN)) throw "请输入数字，用逗号或空格分隔"; return a; }
  var GAN = "甲乙丙丁戊己庚辛壬癸", ZHI = "子丑寅卯辰巳午未申酉戌亥", SX = "鼠牛虎兔龙蛇马羊猴鸡狗猪";
  function jdn(d) { return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5) + 2440588; }
  function dayGz(d) { var i = (jdn(d) + 49) % 60; return GAN[i % 10] + ZHI[i % 12]; }
  function yearGz(yr) { var i = ((yr - 4) % 60 + 60) % 60; return GAN[i % 10] + ZHI[i % 12]; }
  var TERMS = [["小寒", 5.4055], ["大寒", 20.12], ["立春", 3.87], ["雨水", 18.73], ["惊蛰", 5.63], ["春分", 20.646], ["清明", 4.81], ["谷雨", 20.1], ["立夏", 5.52], ["小满", 21.04], ["芒种", 5.678], ["夏至", 21.37], ["小暑", 7.108], ["大暑", 22.83], ["立秋", 7.5], ["处暑", 23.13], ["白露", 7.646], ["秋分", 23.042], ["寒露", 8.318], ["霜降", 23.438], ["立冬", 7.438], ["小雪", 22.36], ["大雪", 7.18], ["冬至", 21.94]];
  function termDate(yr, i) { var Y = yr - 2000, L = i < 4 ? Math.floor((Y - 1) / 4) : Math.floor(Y / 4); return new Date(yr, Math.floor(i / 2), Math.floor(Y * 0.2422 + TERMS[i][1]) - L); }
  var CN_D = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十", "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];
  /* Lunar calendar 1900–2100 from the standard lunarInfo table (Intl's chinese calendar is wrong for some years). */
  var LI = [0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,0x0ea50,0x16a95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06aa0,0x1a6c4,0x0aae0,0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,0x0d520];
  function lyDays(y) { var s = 348; for (var i = 0x8000; i > 0x8; i >>= 1) s += (LI[y - 1900] & i) ? 1 : 0; return s + leapDays(y); }
  function leapMonth(y) { return LI[y - 1900] & 0xf; }
  function leapDays(y) { return leapMonth(y) ? ((LI[y - 1900] & 0x10000) ? 30 : 29) : 0; }
  function monthDays(y, m) { return (LI[y - 1900] & (0x10000 >> m)) ? 30 : 29; }
  var MN = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"];
  function lunar(d) {
    var off = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1900, 0, 31)) / 864e5);
    if (off < 0 || d.getFullYear() > 2100) throw "仅支持 1900–2100 年";
    var yr = 1900, t; for (; yr < 2101 && off > 0; yr++) { t = lyDays(yr); off -= t; } if (off < 0) { off += t; yr--; }
    var leap = leapMonth(yr), isLeap = false, m = 1;
    for (; m < 13 && off > 0; m++) {
      if (leap > 0 && m === leap + 1 && !isLeap) { --m; isLeap = true; t = leapDays(yr); } else t = monthDays(yr, m);
      if (isLeap && m === leap + 1) isLeap = false; off -= t;
    }
    if (off === 0 && leap > 0 && m === leap + 1) { if (isLeap) isLeap = false; else { isLeap = true; --m; } }
    if (off < 0) { off += t; --m; }
    var day = off + 1;
    return { y: yr, gz: yearGz(yr), m: MN[m - 1], mi: m, leap: isLeap, d: day, s: (isLeap ? "闰" : "") + MN[m - 1] + CN_D[day - 1] };
  }
  function lunar2solar(y, m, d, isLeap) {
    if (y < 1900 || y > 2100) throw "仅支持 1900–2100 年"; var lm = leapMonth(y);
    if (isLeap && lm !== m) throw "该年没有闰" + MN[m - 1];
    var days = isLeap ? leapDays(y) : monthDays(y, m); if (d > days) throw "该月只有 " + days + " 天";
    var off = 0, i; for (i = 1900; i < y; i++) off += lyDays(i);
    var passLeap = false; for (i = 1; i < m; i++) { if (!passLeap && lm && i === lm) { off += leapDays(y); } off += monthDays(y, i); }
    if (isLeap) off += monthDays(y, m);
    var r = new Date(1900, 0, 31); r.setDate(r.getDate() + off + d - 1); return r;
  }

  H.lunar = lunar; H.lunar2solar = lunar2solar;

  /* ======================= 财务理财 ======================= */
  add({ cat: "finance", id: "combo-loan", name: "组合贷款计算器", desc: "商业贷款 + 公积金贷款组合，合计月供与利息", kw: "公积金 组合贷 房贷",
    fields: [{ k: "c", l: "商业贷款金额", u: "万元", v: 70 }, { k: "cr", l: "商贷年利率", u: "%", v: 3.05 }, { k: "h", l: "公积金贷款金额", u: "万元", v: 50 }, { k: "hr", l: "公积金年利率", u: "%", v: 2.6 }, { k: "n", l: "贷款年限", u: "年", v: 30 }],
    run: function (v) {
      need(v.c, v.cr, v.h, v.hr); pos(v.n); var n = v.n * 12, mc = v.c > 0 ? pmt(v.c * 1e4, v.cr / 1200, n) : 0, mh = v.h > 0 ? pmt(v.h * 1e4, v.hr / 1200, n) : 0;
      var it = (mc + mh) * n - (v.c + v.h) * 1e4;
      return { big: ["合计月供（等额本息）", y(mc + mh)], kv: [["商贷月供", y(mc)], ["公积金月供", y(mh)], ["支付利息", wy(it)], ["还款总额", wy((mc + mh) * n)]] };
    } });

  add({ cat: "finance", id: "credit-installment", name: "信用卡 / 花呗分期计算器", desc: "按每期手续费率算月还款和真实年化利率", kw: "分期 手续费 花呗 年化",
    fields: [{ k: "p", l: "分期金额", u: "元", v: 12000 }, { k: "n", l: "分期期数", t: "sel", o: [[3, "3 期"], [6, "6 期"], [12, "12 期"], [24, "24 期"]], v: 12 }, { k: "r", l: "每期手续费率", u: "%", v: 0.6 }],
    run: function (v) {
      pos(v.p); need(v.r); var fee = v.p * v.r / 100, m = v.p / v.n + fee, fl = [v.p]; for (var i = 0; i < v.n; i++) fl.push(-m);
      var mr = irr(fl);
      return { big: ["真实年化利率", pct(mr * 12)], kv: [["每月还款", y(m)], ["每期手续费", y(fee)], ["总手续费", y(fee * v.n)], ["名义年费率", pct(v.r / 100 * 12)]], note: "分期本金逐月减少但手续费按全额收，真实年化大约是名义费率的 1.8 倍。" };
    } });

  add({ cat: "finance", id: "irr", name: "内部收益率 (IRR) 计算器", desc: "按每期现金流算 IRR、NPV，判断投资回报", kw: "irr npv 收益率",
    fields: [{ k: "c", l: "各期现金流（第 0 期为投入，记负数）", t: "area", v: "-10000, 3000, 4000, 4000, 2000" }, { k: "d", l: "折现率（算 NPV 用）", u: "%", v: 5 }, { k: "p", l: "每期长度", t: "sel", o: ["年", "月"] }],
    run: function (v) {
      var fl = nums(v.c); if (fl.length < 2) throw "至少需要两期现金流"; var r = irr(fl), dr = ok(v.d) ? v.d / 100 : 0;
      var npv = fl.reduce(function (s, c, i) { return s + c / Math.pow(1 + dr, i); }, 0);
      return { big: ["IRR（每" + v.p + "）", pct(r)], kv: [["年化 IRR", v.p === "月" ? pct(Math.pow(1 + r, 12) - 1) : pct(r)], ["NPV", y(npv)], ["现金流合计", y(fl.reduce(function (a, b) { return a + b; }, 0))]] };
    } });

  add({ cat: "finance", id: "interest-rate-convert", name: "月息 / 年息 / 日息换算", desc: "月利率、年利率、日利率、“几厘几分”互换", kw: "厘 分 利息 月息",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["年利率 %", "月利率 %", "日利率 ‱"] }, { k: "x", l: "数值", v: 1 }],
    run: function (v) {
      need(v.x); var yr = v.m === "年利率 %" ? v.x : v.m === "月利率 %" ? v.x * 12 : v.x / 100 * 360;
      return { big: ["年利率", f(yr, 4) + "%"], kv: [["月利率", f(yr / 12, 4) + "%"], ["日利率（按 360 天）", f(yr / 360 * 100, 4) + "‱"], ["每万元每年利息", y(yr * 100)], ["每万元每月利息", y(yr * 100 / 12)], ["俗称", "月息 " + f(yr / 12 * 10, 2) + " 厘"]], note: "民间“月息 1 分”= 月利率 1%，“1 厘”= 0.1%。" };
    } });

  add({ cat: "finance", id: "financial-freedom", name: "财务自由计算器", desc: "按年支出和 4% 法则算目标本金，以及还要存几年", kw: "fire 退休 4%",
    fields: [{ k: "e", l: "每年生活支出", u: "元", v: 120000 }, { k: "w", l: "安全提取率", u: "%", v: 4 }, { k: "s", l: "现有投资资产", u: "元", v: 300000 }, { k: "m", l: "每月可储蓄投资", u: "元", v: 8000 }, { k: "r", l: "预期年化收益", u: "%", v: 5 }],
    run: function (v) {
      pos(v.e, v.w); need(v.s, v.m, v.r); var goal = v.e / (v.w / 100), bal = v.s, mo = 0, r = v.r / 1200;
      while (bal < goal && mo < 1200) { bal = bal * (1 + r) + v.m; mo++; }
      return { big: ["目标本金", wy(goal)], kv: [["还差", wy(Math.max(goal - v.s, 0))], ["预计还需", mo >= 1200 ? "超过 100 年" : Math.floor(mo / 12) + " 年 " + (mo % 12) + " 个月"]], note: "4% 法则来自美股历史回测，A 股或低利率环境建议用 3%–3.5% 更稳妥。" };
    } });

  add({ cat: "finance", id: "emergency-fund", name: "应急储备金计算器", desc: "按每月刚性支出和工作稳定性算应急金", kw: "应急金 储蓄",
    fields: [{ k: "e", l: "每月刚性支出（房贷房租、生活、保险）", u: "元", v: 8000 }, { k: "s", l: "收入稳定性", t: "sel", o: [[3, "稳定（体制内）"], [6, "一般（企业）"], [12, "不稳定（自由职业）"]], v: 6 }, { k: "h", l: "现有可随时取用存款", u: "元", v: 20000 }],
    run: function (v) { pos(v.e); need(v.h); var t = v.e * v.s; return { big: ["建议应急金", y(t)], kv: [["覆盖月数", v.s + " 个月"], ["还差", y(Math.max(t - v.h, 0))]] }; } });

  add({ cat: "finance", id: "dti", name: "债务收入比计算器", desc: "每月还款占收入比例，评估负债压力和贷款审批", kw: "负债率 月供收入比",
    fields: [{ k: "i", l: "税后月收入", u: "元", v: 15000 }, { k: "d", l: "每月各类还款合计", u: "元", v: 6000 }],
    run: function (v) { pos(v.i); need(v.d); var r = v.d / v.i; return { big: ["债务收入比", pct(r, 1)], tag: r <= .3 ? "健康" : r <= .5 ? "偏高" : "压力过大", kv: [["月结余", y(v.i - v.d)], ["按 50% 上限还可承担", y(Math.max(v.i * .5 - v.d, 0))]], note: "银行审批房贷一般要求月供不超过月收入的 50%。" }; } });

  /* ======================= 房产置业 ======================= */
  add({ cat: "property", id: "resale-tax", name: "二手房交易税费计算器", desc: "契税、增值税及附加、个税，按满二满五唯一计算", kw: "二手房 满五唯一 增值税 个税",
    fields: [{ k: "p", l: "成交价（网签价）", u: "万元", v: 300 }, { k: "o", l: "原购入价", u: "万元", v: 200 }, { k: "a", l: "面积", u: "㎡", v: 90 },
      { k: "y", l: "卖家持有年限", t: "sel", o: ["不满 2 年", "满 2 年不满 5 年", "满 5 年"] }, { k: "u", l: "是否卖家家庭唯一住房", t: "sel", o: ["是", "否"] },
      { k: "b", l: "买家家庭第几套", t: "sel", o: ["首套", "二套", "三套及以上"] }, { k: "it", l: "个税计征方式", t: "sel", o: ["核定 1%", "差额 20%"] }],
    run: function (v) {
      pos(v.p, v.a); need(v.o); var P = v.p * 1e4, O = v.o * 1e4;
      var vat = v.y === "不满 2 年" ? P / 1.05 * 0.05 : 0, sur = vat * 0.06;
      var free = v.y === "满 5 年" && v.u === "是", tax = free ? 0 : v.it === "核定 1%" ? P * 0.01 : Math.max(P - vat - O, 0) * 0.2;
      var dr = v.b === "首套" ? (v.a <= 140 ? .01 : .015) : v.b === "二套" ? (v.a <= 140 ? .01 : .02) : .03, deed = (P - vat) * dr;
      return { big: ["税费合计", wy(vat + sur + tax + deed)], kv: [["契税（买方）", wy(deed)], ["增值税（卖方）", wy(vat)], ["附加税费（卖方）", wy(sur)], ["个人所得税（卖方）", wy(tax)]],
        note: "增值税：住房持有满 2 年免征，不满 2 年按 5% 征收（附加按 6% 估算，小规模可减半）。个税：满五唯一免征。实际以当地税务核定为准。" };
    } });

  add({ cat: "property", id: "new-house-tax", name: "新房购房税费计算器", desc: "契税、维修基金、登记费等新房入住前费用", kw: "新房 维修基金 登记费",
    fields: [{ k: "p", l: "房屋总价", u: "万元", v: 300 }, { k: "a", l: "建筑面积", u: "㎡", v: 100 }, { k: "b", l: "家庭第几套", t: "sel", o: ["首套", "二套", "三套及以上"] }, { k: "m", l: "维修基金标准", u: "元/㎡", v: 100 }, { k: "pf", l: "预交物业费", u: "元", v: 3000 }],
    run: function (v) {
      pos(v.p, v.a); need(v.m, v.pf); var P = v.p * 1e4, dr = v.b === "首套" ? (v.a <= 140 ? .01 : .015) : v.b === "二套" ? (v.a <= 140 ? .01 : .02) : .03;
      var deed = P / 1.09 * dr, fund = v.a * v.m, reg = 80, tot = deed + fund + reg + v.pf;
      return { big: ["税费合计", y(tot)], kv: [["契税", y(deed)], ["维修基金", y(fund)], ["不动产登记费", y(reg)], ["预交物业费", y(v.pf)]], note: "契税计税价按不含增值税价（总价 ÷ 1.09）。维修基金各地标准不同，一般为房价的 2%–3% 或每平方米几十到一百多元。" };
    } });

  add({ cat: "property", id: "repay-compare", name: "等额本息 vs 等额本金", desc: "两种还款方式的月供、总利息和差额对比", kw: "还款方式 对比",
    fields: [{ k: "p", l: "贷款金额", u: "万元", v: 100 }, { k: "n", l: "贷款年限", u: "年", v: 30 }, { k: "r", l: "年利率", u: "%", v: 3.05 }],
    run: function (v) {
      pos(v.p, v.n); need(v.r); var P = v.p * 1e4, n = v.n * 12, r = v.r / 1200, m = pmt(P, r, n), i1 = m * n - P, i2 = P * r * (n + 1) / 2;
      return { big: ["等额本金少付利息", wy(i1 - i2)], table: { h: ["项目", "等额本息", "等额本金"], r: [["首月月供", f(m), f(P / n + P * r)], ["末月月供", f(m), f(P / n * (1 + r))], ["支付利息", f(i1), f(i2)], ["还款总额", f(P + i1), f(P + i2)]] }, note: "等额本金前期压力大、总利息少；等额本息月供固定，适合收入稳定、想留现金流的人。" };
    } });

  add({ cat: "property", id: "rent-covers-loan", name: "以租养贷计算器", desc: "租金能覆盖多少月供，每月还要贴多少", kw: "以租养贷 投资房",
    fields: [{ k: "m", l: "每月月供", u: "元", v: 8000 }, { k: "r", l: "月租金", u: "元", v: 5500 }, { k: "c", l: "每月物业及维护", u: "元", v: 400 }, { k: "v", l: "每年空置", u: "月", v: 1 }],
    run: function (v) { pos(v.m); need(v.r, v.c, v.v); var net = v.r * (12 - v.v) / 12 - v.c; return { big: ["租金覆盖率", pct(net / v.m, 1)], kv: [["月均净租金", y(net)], ["每月需自付", y(Math.max(v.m - net, 0))], ["每年需自付", y(Math.max(v.m - net, 0) * 12)]] }; } });

  add({ cat: "property", id: "sale-proceeds", name: "卖房到手价计算器", desc: "成交价扣除剩余房贷、税费、中介费后实际到手", kw: "卖房 到手",
    fields: [{ k: "p", l: "成交价", u: "万元", v: 300 }, { k: "l", l: "剩余房贷本金", u: "万元", v: 80 }, { k: "t", l: "卖方税费", u: "万元", v: 3 }, { k: "a", l: "中介费（卖方承担）", u: "%", v: 1 }, { k: "o", l: "其他（提前还贷违约金等）", u: "万元", v: 0 }],
    run: function (v) { pos(v.p); need(v.l, v.t, v.a, v.o); var ag = v.p * v.a / 100, net = v.p - v.l - v.t - ag - v.o; return { big: ["实际到手", f(net, 2) + " 万元"], kv: [["中介费", f(ag, 2) + " 万元"], ["扣除合计", f(v.p - net, 2) + " 万元"]] }; } });

  add({ cat: "property", id: "mortgage-income-ratio", name: "购房预算计算器", desc: "按收入、首付和月供上限反推能买多少钱的房", kw: "预算 买得起 月供收入比",
    fields: [{ k: "i", l: "家庭税后月收入", u: "元", v: 20000 }, { k: "q", l: "月供占收入上限", u: "%", v: 40 }, { k: "c", l: "可用于首付的现金", u: "万元", v: 60 }, { k: "d", l: "首付比例", u: "%", v: 15 }, { k: "r", l: "年利率", u: "%", v: 3.05 }, { k: "n", l: "贷款年限", u: "年", v: 30 }],
    run: function (v) {
      pos(v.i, v.q, v.c, v.d, v.n); need(v.r); var m = v.i * v.q / 100, r = v.r / 1200, n = v.n * 12;
      var loanMax = r === 0 ? m * n : m * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)), byCash = v.c * 1e4 / (v.d / 100) , byLoan = loanMax / (1 - v.d / 100) , P = Math.min(byCash, byLoan);
      return { big: ["可负担总价", wy(P)], kv: [["月供上限", y(m)], ["可贷款上限", wy(loanMax)], ["受限于", byCash < byLoan ? "首付现金" : "月供能力"], ["对应月供", y(pmt(P * (1 - v.d / 100), r, n))]] };
    } });

  /* ======================= 汽车出行 ======================= */
  add({ cat: "auto", id: "fuel-consumption", name: "油耗计算器", desc: "按加油量和里程算百公里油耗、每公里油费", kw: "百公里油耗 加满",
    fields: [{ k: "l", l: "加油量", u: "L", v: 45 }, { k: "d", l: "两次加满之间里程", u: "km", v: 600 }, { k: "p", l: "油价", u: "元/L", v: 7.5 }],
    run: function (v) { pos(v.l, v.d); need(v.p); var c = v.l / v.d * 100; return { big: ["百公里油耗", f(c, 2) + " L"], kv: [["每公里油费", y(v.l * v.p / v.d)], ["每升可跑", f(v.d / v.l, 2) + " km"], ["本次油费", y(v.l * v.p)]] }; } });

  add({ cat: "auto", id: "braking-distance", name: "刹车距离计算器", desc: "反应距离 + 制动距离，看不同车速要多远停下", kw: "制动 安全车距",
    fields: [{ k: "v", l: "车速", u: "km/h", v: 100 }, { k: "t", l: "反应时间", u: "秒", v: 1 }, { k: "r", l: "路面", t: "sel", drop: true, o: [[0.7, "干燥沥青"], [0.5, "湿滑路面"], [0.2, "积雪"], [0.1, "结冰"]], v: 0.7 }],
    run: function (v) {
      pos(v.v, v.t); var s = v.v / 3.6, re = s * v.t, br = s * s / (2 * v.r * 9.8);
      return { big: ["总停车距离", f(re + br, 1) + " 米"], kv: [["反应距离", f(re, 1) + " 米"], ["制动距离", f(br, 1) + " 米"]], note: "按理想制动估算，实际受轮胎、刹车、载重影响。高速上建议与前车保持 100 米以上。" };
    } });

  add({ cat: "auto", id: "car-depreciation", name: "汽车折旧 / 二手车估值", desc: "按车龄和里程粗估二手车残值", kw: "二手车 残值 保值率",
    fields: [{ k: "p", l: "新车购入价", u: "元", v: 200000 }, { k: "a", l: "车龄", u: "年", v: 3 }, { k: "km", l: "行驶里程", u: "万公里", v: 6 }, { k: "t", l: "车型", t: "sel", o: [[0.12, "燃油车"], [0.16, "新能源"]], v: 0.12 }],
    run: function (v) {
      pos(v.p); need(v.a, v.km); var first = v.t + 0.06, val = v.p * (v.a >= 1 ? (1 - first) * Math.pow(1 - v.t, v.a - 1) : 1 - first * v.a);
      var norm = v.a * 2, adj = Math.max(Math.min((norm - v.km) * 0.01, 0.1), -0.15); val *= 1 + adj;
      return { big: ["估算残值", y(val)], kv: [["保值率", pct(val / v.p, 1)], ["累计折旧", y(v.p - val)], ["里程修正", (adj >= 0 ? "+" : "") + pct(adj, 0)]], note: "按首年约 " + Math.round(first * 100) + "%、之后每年约 " + Math.round(v.t * 100) + "% 折旧，年均 2 万公里为基准。品牌、车况差异很大，仅供参考。" };
    } });

  add({ cat: "auto", id: "ev-charging-time", name: "电车充电时间计算器", desc: "按电池容量、充电功率和电量区间算充电时长", kw: "充电桩 快充 慢充",
    fields: [{ k: "c", l: "电池容量", u: "kWh", v: 60 }, { k: "a", l: "当前电量", u: "%", v: 20 }, { k: "b", l: "目标电量", u: "%", v: 80 }, { k: "p", l: "充电功率", u: "kW", v: 7 }, { k: "e", l: "充电效率", u: "%", v: 90 }],
    run: function (v) {
      pos(v.c, v.p, v.e); need(v.a, v.b); if (v.b <= v.a) throw "目标电量需高于当前电量"; var kwh = v.c * (v.b - v.a) / 100, h = kwh / (v.p * v.e / 100);
      return { big: ["约需", Math.floor(h) + " 小时 " + Math.round(h % 1 * 60) + " 分钟"], kv: [["充入电量", f(kwh, 1) + " kWh"], ["从电网取电", f(kwh / (v.e / 100), 1) + " kWh"]], note: "快充在 80% 以后会明显降速，实际时间会更长。" };
    } });

  add({ cat: "auto", id: "cash-vs-loan-car", name: "全款 vs 贷款买车", desc: "贷款利息与首付省下来拿去理财的收益对比", kw: "全款 贷款 买车",
    fields: [{ k: "p", l: "车价", u: "元", v: 200000 }, { k: "d", l: "首付比例", u: "%", v: 30 }, { k: "r", l: "贷款年利率", u: "%", v: 4 }, { k: "n", l: "贷款期限", u: "月", v: 36 }, { k: "i", l: "闲钱理财年化", u: "%", v: 2 }, { k: "fee", l: "贷款手续费 / 金融服务费", u: "元", v: 0 }],
    run: function (v) {
      pos(v.p, v.n); need(v.d, v.r, v.i, v.fee); var L0 = v.p * (1 - v.d / 100), m = pmt(L0, v.r / 1200, v.n), cost = m * v.n - L0 + v.fee;
      var bal = L0, gain = 0; for (var k = 0; k < v.n; k++) { gain += bal * v.i / 1200; bal = bal * (1 + v.i / 1200) - m; } // keep the loan amount invested, pay installments from it
      return { big: ["更划算", cost > gain ? "全款" : "贷款"], kv: [["贷款总成本", y(cost)], ["留存资金理财收益", y(gain)], ["差额", y(Math.abs(cost - gain))]] };
    } });

  add({ cat: "auto", id: "tire-size", name: "轮胎规格计算器", desc: "解读 205/55 R16 等规格：外径、胎壁高、周长", kw: "轮胎 尺寸",
    fields: [{ k: "w", l: "胎宽", u: "mm", v: 205 }, { k: "a", l: "扁平比", u: "%", v: 55 }, { k: "r", l: "轮毂直径", u: "英寸", v: 16 }],
    run: function (v) {
      pos(v.w, v.a, v.r); var side = v.w * v.a / 100, dia = v.r * 25.4 + 2 * side;
      return { big: ["轮胎外径", f(dia, 1) + " mm"], kv: [["胎壁高度", f(side, 1) + " mm"], ["周长", f(dia * Math.PI, 0) + " mm"], ["每公里转数", f(1e6 / (dia * Math.PI), 0)], ["规格", v.w + "/" + v.a + " R" + v.r]], note: "换装其他规格时，外径差最好控制在 ±3% 以内。" };
    } });

  add({ cat: "auto", id: "own-vs-ridehailing", name: "养车 vs 打车", desc: "每年养车总成本和打车花费对比", kw: "打车 网约车 养车",
    fields: [{ k: "c", l: "每年养车总成本（含折旧）", u: "元", v: 30000 }, { k: "t", l: "每月出行次数", u: "次", v: 40 }, { k: "f", l: "平均每次打车费", u: "元", v: 30 }],
    run: function (v) { pos(v.c); need(v.t, v.f); var r = v.t * v.f * 12; return { big: ["更划算", r < v.c ? "打车" : "养车"], kv: [["每年打车", y(r)], ["每年养车", y(v.c)], ["打车可坐次数", f(v.c / v.f, 0) + " 次/年"]] }; } });

  /* ======================= 健康健身 ======================= */
  add({ cat: "health", id: "ideal-weight", name: "理想体重计算器", desc: "多种公式的标准体重与 BMI 健康区间", kw: "标准体重",
    fields: [{ k: "s", l: "性别", t: "sel", o: ["男", "女"] }, { k: "h", l: "身高", u: "cm", v: 170 }],
    run: function (v) {
      pos(v.h); var m = v.s === "男", inch = v.h / 2.54 - 60, rob = (m ? 52 : 49) + (m ? 1.9 : 1.7) * inch, dev = (m ? 50 : 45.5) + 2.3 * inch, bz = (v.h - 100) * (m ? 0.9 : 0.85), cn = m ? v.h - 105 : v.h - 100 - 2.5;
      return { big: ["标准体重（中国常用）", f(bz, 1) + " kg"], kv: [["Devine 公式", f(dev, 1) + " kg"], ["Robinson 公式", f(rob, 1) + " kg"], ["简易法", f(cn, 1) + " kg"], ["BMI 健康区间", f(18.5 * v.h * v.h / 1e4, 1) + " – " + f(23.9 * v.h * v.h / 1e4, 1) + " kg"]] };
    } });

  add({ cat: "health", id: "blood-pressure", name: "血压分级计算器", desc: "按收缩压 / 舒张压判断血压水平（中国指南）", kw: "高血压 血压",
    fields: [{ k: "s", l: "收缩压（高压）", u: "mmHg", v: 128 }, { k: "d", l: "舒张压（低压）", u: "mmHg", v: 82 }],
    run: function (v) {
      pos(v.s, v.d); var s = v.s, d = v.d, lv;
      if (s >= 180 || d >= 110) lv = "3 级高血压（重度）"; else if (s >= 160 || d >= 100) lv = "2 级高血压（中度）"; else if (s >= 140 || d >= 90) lv = (s >= 140 && d < 90) ? "单纯收缩期高血压 / 1 级" : "1 级高血压（轻度）";
      else if (s >= 120 || d >= 80) lv = "正常高值"; else if (s < 90 || d < 60) lv = "偏低"; else lv = "正常";
      return { big: ["血压水平", lv], kv: [["脉压差", (s - d) + " mmHg"], ["平均动脉压", f(d + (s - d) / 3, 0) + " mmHg"]], note: "参考《中国高血压防治指南》：正常 <120/80，正常高值 120–139/80–89，高血压 ≥140/90。需非同日 3 次测量确诊。" };
    } });

  add({ cat: "health", id: "blood-glucose", name: "血糖 / 糖化血红蛋白换算", desc: "mmol/L 与 mg/dL 互换，HbA1c 估算平均血糖", kw: "血糖 hba1c 糖化",
    fields: [{ k: "m", l: "换算", t: "sel", drop: true, o: ["mmol/L → mg/dL", "mg/dL → mmol/L", "HbA1c % → 平均血糖"] }, { k: "x", l: "数值", v: 6.1 }],
    run: function (v) {
      pos(v.x);
      if (v.m === "mmol/L → mg/dL") return { big: ["mg/dL", f(v.x * 18.016, 1)], note: "空腹血糖正常 3.9–6.1 mmol/L；≥7.0 提示糖尿病。" };
      if (v.m === "mg/dL → mmol/L") return { big: ["mmol/L", f(v.x / 18.016, 2)] };
      var mg = 28.7 * v.x - 46.7; return { big: ["估算平均血糖", f(mg / 18.016, 1) + " mmol/L"], kv: [["mg/dL", f(mg, 0)]], note: "ADAG 公式：平均血糖(mg/dL) = 28.7 × HbA1c − 46.7。HbA1c ≥6.5% 为糖尿病诊断标准之一。" };
    } });

  add({ cat: "health", id: "macros", name: "宏量营养素计算器", desc: "按每日热量和目标分配碳水、蛋白质、脂肪克数", kw: "碳水 蛋白质 脂肪 减脂 增肌",
    fields: [{ k: "k", l: "每日热量", u: "kcal", v: 2000 }, { k: "w", l: "体重", u: "kg", v: 65 }, { k: "g", l: "目标", t: "sel", o: ["减脂", "维持", "增肌"] }],
    run: function (v) {
      pos(v.k, v.w); var p = v.w * (v.g === "减脂" ? 2 : v.g === "增肌" ? 1.8 : 1.4), fat = v.k * (v.g === "减脂" ? .25 : .28) / 9, carb = (v.k - p * 4 - fat * 9) / 4;
      if (carb < 0) throw "热量太低，无法满足蛋白质需求";
      return { table: { h: ["营养素", "克数", "热量占比"], r: [["蛋白质", f(p, 0) + " g", pct(p * 4 / v.k, 0)], ["脂肪", f(fat, 0) + " g", pct(fat * 9 / v.k, 0)], ["碳水", f(carb, 0) + " g", pct(carb * 4 / v.k, 0)]] }, note: "蛋白质按体重计（减脂 2 g/kg、增肌 1.8 g/kg、维持 1.4 g/kg），其余热量分给脂肪和碳水。" };
    } });

  add({ cat: "health", id: "bedtime", name: "最佳入睡时间计算器", desc: "按 90 分钟睡眠周期，算几点睡 / 几点起最清醒", kw: "睡眠 起床 周期",
    fields: [{ k: "m", l: "我想", t: "sel", o: ["按起床时间算入睡", "按入睡时间算起床"] }, { k: "t", l: "时间（HH:MM）", t: "text", v: "07:00" }, { k: "l", l: "入睡需要", u: "分钟", v: 15 }],
    run: function (v) {
      var mm = String(v.t).match(/^(\d{1,2})[:：](\d{2})$/); if (!mm) throw "时间格式如 07:00"; var base = +mm[1] * 60 + +mm[2], lat = ok(v.l) ? v.l : 15, rows = [];
      function hm(x) { x = ((x % 1440) + 1440) % 1440; return String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0"); }
      for (var c = 6; c >= 3; c--) rows.push([c + " 个周期（" + c * 1.5 + " 小时）", v.m === "按起床时间算入睡" ? hm(base - c * 90 - lat) : hm(base + lat + c * 90)]);
      return { big: [v.m === "按起床时间算入睡" ? "建议上床时间" : "建议起床时间", rows[1][1]], table: { h: ["睡眠时长", v.m === "按起床时间算入睡" ? "上床时间" : "起床时间"], r: rows }, note: "成年人建议睡 5–6 个周期（7.5–9 小时）。" };
    } });

  add({ cat: "health", id: "blood-type", name: "血型遗传计算器", desc: "父母 ABO 血型推算孩子可能的血型及概率", kw: "abo 血型",
    fields: [{ k: "a", l: "父亲血型", t: "sel", o: ["A", "B", "AB", "O"] }, { k: "b", l: "母亲血型", t: "sel", o: ["A", "B", "AB", "O"] }],
    run: function (v) {
      var G = { A: [["AA", .25], ["AO", .75]], B: [["BB", .25], ["BO", .75]], AB: [["AB", 1]], O: [["OO", 1]] }, P = { A: 0, B: 0, AB: 0, O: 0 };
      G[v.a].forEach(function (x) { G[v.b].forEach(function (z) { for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) { var s = [x[0][i], z[0][j]].sort().join(""), t = s === "AB" ? "AB" : s.indexOf("A") > -1 ? "A" : s.indexOf("B") > -1 ? "B" : "O"; P[t] += x[1] * z[1] / 4; } }); });
      var possible = Object.keys(P).filter(function (k) { return P[k] > 0; });
      return { big: ["孩子可能的血型", possible.join("、")], table: { h: ["血型", "大致概率"], r: Object.keys(P).map(function (k) { return [k, P[k] > 0 ? pct(P[k], 0) : "不可能"]; }) }, note: "概率按人群中 A、B 型杂合子比例约 3:1 粗略估计；孟买型等罕见情况除外。" };
    } });

  var MET = [[3.5, "散步（4 km/h）"], [4.3, "快走（5.6 km/h）"], [8.3, "慢跑（8 km/h）"], [11, "跑步（11 km/h）"], [7.5, "骑行（中速）"], [6, "游泳（休闲）"], [10, "游泳（自由泳快速）"], [5, "羽毛球"], [6.5, "篮球"], [7, "足球"], [8, "跳绳"], [5, "力量训练"], [3, "瑜伽"], [7.3, "有氧操"], [8, "爬山"]];
  add({ cat: "health", id: "exercise-calories", name: "运动卡路里计算器", desc: "按运动类型（MET）、体重和时长估算消耗热量", kw: "消耗 热量 运动",
    fields: [{ k: "m", l: "运动", t: "sel", drop: true, o: MET.map(function (x, i) { return [i, x[1]]; }), v: 2 }, { k: "w", l: "体重", u: "kg", v: 65 }, { k: "t", l: "时长", u: "分钟", v: 30 }],
    run: function (v) { pos(v.w, v.t); var met = MET[v.m][0], k = met * 3.5 * v.w / 200 * v.t; return { big: ["消耗约", f(k, 0) + " kcal"], kv: [["MET 值", met], ["约合米饭", f(k / 116, 1) + " 碗（150g）"], ["约合脂肪", f(k / 7.7, 0) + " g"]] }; } });

  add({ cat: "health", id: "ffmi", name: "FFMI 计算器", desc: "去脂体重指数，判断肌肉量水平", kw: "肌肉 健身 ffmi",
    fields: [{ k: "h", l: "身高", u: "cm", v: 175 }, { k: "w", l: "体重", u: "kg", v: 72 }, { k: "bf", l: "体脂率", u: "%", v: 15 }, { k: "s", l: "性别", t: "sel", o: ["男", "女"] }],
    run: function (v) {
      pos(v.h, v.w); need(v.bf); var m = v.h / 100, lean = v.w * (1 - v.bf / 100), ff = lean / m / m, adj = ff + 6.1 * (1.8 - m), male = v.s === "男";
      var tag = male ? (adj < 18 ? "低于平均" : adj < 20 ? "平均" : adj < 22 ? "高于平均" : adj < 23 ? "优秀" : adj < 26 ? "非常优秀" : "接近自然极限以上") : (adj < 15 ? "低于平均" : adj < 17 ? "平均" : adj < 18 ? "高于平均" : adj < 19 ? "优秀" : "非常优秀");
      return { big: ["校正 FFMI", f(adj, 1)], tag: tag, kv: [["FFMI", f(ff, 1)], ["去脂体重", f(lean, 1) + " kg"]], note: "男性自然训练上限通常在 25 左右。" };
    } });

  add({ cat: "health", id: "bac", name: "血液酒精浓度估算", desc: "Widmark 公式估算饮酒后 BAC，对照酒驾醉驾标准", kw: "酒驾 醉驾 喝酒",
    fields: [{ k: "s", l: "性别", t: "sel", o: ["男", "女"] }, { k: "w", l: "体重", u: "kg", v: 70 }, { k: "ml", l: "饮酒量", u: "ml", v: 500 }, { k: "abv", l: "酒精度", u: "%", v: 4 }, { k: "h", l: "饮酒后经过", u: "小时", v: 1 }],
    run: function (v) {
      pos(v.w, v.ml, v.abv); need(v.h); var g0 = v.ml * v.abv / 100 * 0.789, r = v.s === "男" ? .68 : .55, bac = Math.max(g0 / (v.w * 1000 * r) * 100000 - 15 * v.h, 0); // mg/100ml
      return { big: ["估算血液酒精浓度", f(bac, 0) + " mg/100ml"], tag: bac >= 80 ? "醉驾标准" : bac >= 20 ? "酒驾标准" : "低于 20", kv: [["纯酒精", f(g0, 1) + " g"], ["约需代谢至 0", f(bac / 15, 1) + " 小时"]], note: "仅为粗略估算，个体差异很大。喝酒不开车。" };
    } });

  /* ======================= 数学计算 ======================= */
  add({ cat: "math", id: "circle", name: "圆 / 球计算器", desc: "按半径或直径算圆面积、周长，球体积、表面积", kw: "圆面积 周长 球",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["半径", "直径", "周长", "面积"] }, { k: "x", l: "数值", v: 5 }],
    run: function (v) {
      pos(v.x); var r = v.m === "半径" ? v.x : v.m === "直径" ? v.x / 2 : v.m === "周长" ? v.x / 2 / Math.PI : Math.sqrt(v.x / Math.PI), P = Math.PI;
      return { kv: [["半径", g(r)], ["直径", g(2 * r)], ["周长", g(2 * P * r)], ["圆面积", g(P * r * r)], ["球体积", g(4 / 3 * P * r * r * r)], ["球表面积", g(4 * P * r * r)]] };
    } });

  add({ cat: "math", id: "solid", name: "立体体积计算器", desc: "圆柱、圆锥、长方体、正方体的体积与表面积", kw: "圆柱 圆锥 长方体 体积",
    fields: [{ k: "s", l: "形状", t: "sel", o: ["圆柱", "圆锥", "长方体"] }, { k: "a", l: "半径 / 长", v: 3 }, { k: "b", l: "宽（长方体）", v: 4, show: function (v) { return v.s === "长方体"; } }, { k: "h", l: "高", v: 10 }],
    run: function (v) {
      pos(v.a, v.h); var P = Math.PI, r = v.a, h = v.h;
      if (v.s === "圆柱") return { kv: [["体积", g(P * r * r * h)], ["侧面积", g(2 * P * r * h)], ["表面积", g(2 * P * r * (r + h))]] };
      if (v.s === "圆锥") { var l = Math.sqrt(r * r + h * h); return { kv: [["体积", g(P * r * r * h / 3)], ["母线长", g(l)], ["侧面积", g(P * r * l)], ["表面积", g(P * r * (r + l))]] }; }
      pos(v.b); return { kv: [["体积", g(v.a * v.b * h)], ["表面积", g(2 * (v.a * v.b + v.a * h + v.b * h))], ["体对角线", g(Math.sqrt(v.a * v.a + v.b * v.b + h * h))]] };
    } });

  add({ cat: "math", id: "triangle", name: "三角形计算器", desc: "三边求面积（海伦公式）、角度、周长，勾股定理", kw: "三角形 海伦 勾股",
    fields: [{ k: "a", l: "边 a", v: 3 }, { k: "b", l: "边 b", v: 4 }, { k: "c", l: "边 c（直角三角形求斜边可留空）", v: 5 }],
    run: function (v) {
      pos(v.a, v.b); var a = v.a, b = v.b, c = ok(v.c) && v.c > 0 ? v.c : Math.sqrt(a * a + b * b);
      if (a + b <= c || a + c <= b || b + c <= a) throw "三条边无法构成三角形";
      var s = (a + b + c) / 2, A = Math.sqrt(s * (s - a) * (s - b) * (s - c)), dg = 180 / Math.PI;
      var al = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * dg, be = Math.acos((a * a + c * c - b * b) / (2 * a * c)) * dg;
      return { big: ["面积", g(A)], kv: [["周长", g(2 * s)], ["边 c", g(c)], ["角 A", g(al, 3) + "°"], ["角 B", g(be, 3) + "°"], ["角 C", g(180 - al - be, 3) + "°"]] };
    } });

  add({ cat: "math", id: "sequence", name: "等差 / 等比数列", desc: "首项、公差（公比）、项数求第 n 项和前 n 项和", kw: "数列 等差 等比",
    fields: [{ k: "t", l: "类型", t: "sel", o: ["等差", "等比"] }, { k: "a", l: "首项 a₁", v: 1 }, { k: "d", l: "公差 d / 公比 q", v: 2 }, { k: "n", l: "项数 n", v: 10 }],
    run: function (v) {
      need(v.a, v.d); if (!Number.isInteger(v.n) || v.n < 1 || v.n > 10000) throw "项数需为 1–10000 的整数"; var an, sn, list = [];
      if (v.t === "等差") { an = v.a + (v.n - 1) * v.d; sn = v.n * (v.a + an) / 2; for (var i = 0; i < Math.min(v.n, 12); i++) list.push(g(v.a + i * v.d)); }
      else { an = v.a * Math.pow(v.d, v.n - 1); sn = v.d === 1 ? v.a * v.n : v.a * (1 - Math.pow(v.d, v.n)) / (1 - v.d); for (var j = 0; j < Math.min(v.n, 12); j++) list.push(g(v.a * Math.pow(v.d, j))); }
      return { big: ["第 " + v.n + " 项", g(an)], kv: [["前 " + v.n + " 项和", g(sn)], ["前几项", list.join(", ") + (v.n > 12 ? " …" : "")]] };
    } });

  add({ cat: "math", id: "logarithm", name: "对数 / 指数 / 开方", desc: "log、ln、任意底对数，幂运算与 n 次方根", kw: "log ln 根号 次方",
    fields: [{ k: "x", l: "x", v: 1024 }, { k: "b", l: "底数 / 次数 n", v: 2 }],
    run: function (v) {
      pos(v.x); need(v.b);
      return { kv: [["log_n(x)", v.b > 0 && v.b !== 1 ? g(Math.log(v.x) / Math.log(v.b), 10) : "—"], ["lg x（以 10 为底）", g(Math.log10(v.x), 10)], ["ln x", g(Math.log(v.x), 10)], ["x 的 n 次方", g(Math.pow(v.x, v.b), 10)], ["x 的 n 次方根", v.b ? g(Math.pow(v.x, 1 / v.b), 10) : "—"], ["√x", g(Math.sqrt(v.x), 10)]] };
    } });

  add({ cat: "math", id: "chicken-rabbit", name: "鸡兔同笼计算器", desc: "已知头数和脚数，求鸡和兔各有多少只", kw: "奥数 鸡兔",
    fields: [{ k: "h", l: "头的总数", v: 35 }, { k: "f", l: "脚的总数", v: 94 }],
    run: function (v) {
      need(v.h, v.f); var r = (v.f - 2 * v.h) / 2, c = v.h - r; if (r < 0 || c < 0 || !Number.isInteger(r)) throw "无整数解，请检查头数和脚数";
      return { big: ["鸡 / 兔", c + " 只鸡，" + r + " 只兔"], note: "假设全是鸡：脚数应为 " + 2 * v.h + "，多出的 " + (v.f - 2 * v.h) + " 只脚每 2 只对应一只兔。" };
    } });

  add({ cat: "math", id: "regression", name: "线性回归 / 相关系数", desc: "两组数据的回归方程 y = ax + b、相关系数 r、R²", kw: "回归 相关 协方差",
    fields: [{ k: "x", l: "X 数据", t: "area", v: "1, 2, 3, 4, 5" }, { k: "y", l: "Y 数据", t: "area", v: "2.1, 3.9, 6.2, 7.8, 10.1" }],
    run: function (v) {
      var X = nums(v.x), Y = nums(v.y); if (X.length !== Y.length) throw "X 和 Y 的个数需相同"; if (X.length < 2) throw "至少 2 组数据";
      var n = X.length, mx = X.reduce(function (a, b) { return a + b; }) / n, my = Y.reduce(function (a, b) { return a + b; }) / n, sxy = 0, sxx = 0, syy = 0;
      for (var i = 0; i < n; i++) { sxy += (X[i] - mx) * (Y[i] - my); sxx += (X[i] - mx) * (X[i] - mx); syy += (Y[i] - my) * (Y[i] - my); }
      if (!sxx) throw "X 不能全相同"; var a = sxy / sxx, b = my - a * mx, r = syy ? sxy / Math.sqrt(sxx * syy) : 1;
      return { big: ["回归方程", "y = " + g(a, 6) + "x " + (b >= 0 ? "+ " : "− ") + g(Math.abs(b), 6)], kv: [["相关系数 r", g(r, 6)], ["决定系数 R²", g(r * r, 6)], ["协方差（样本）", g(sxy / (n - 1), 6)]] };
    } });

  add({ cat: "math", id: "cagr", name: "增长率 / CAGR 计算器", desc: "增长率、复合年均增长率、翻倍所需年数", kw: "cagr 年均增长 翻倍",
    fields: [{ k: "a", l: "期初值", v: 100 }, { k: "b", l: "期末值", v: 250 }, { k: "n", l: "年数", v: 5 }],
    run: function (v) { pos(v.a, v.n); need(v.b); var c = Math.pow(v.b / v.a, 1 / v.n) - 1; return { big: ["复合年均增长率", pct(c)], kv: [["总增长率", pct(v.b / v.a - 1)], ["按此增速翻倍需要", c > 0 ? f(Math.log(2) / Math.log(1 + c), 1) + " 年" : "—"]] }; } });

  add({ cat: "math", id: "matrix", name: "行列式 / 矩阵计算器", desc: "2×2、3×3 矩阵行列式、逆矩阵", kw: "行列式 矩阵 逆矩阵",
    fields: [{ k: "m", l: "矩阵（每行一行，空格分隔）", t: "area", v: "2 1 3\n0 -1 4\n1 2 0" }],
    run: function (v) {
      var M = String(v.m).trim().split(/\n+/).map(function (r) { return nums(r); }), n = M.length;
      if (!(n === 2 || n === 3) || M.some(function (r) { return r.length !== n; })) throw "请输入 2×2 或 3×3 方阵";
      var det = n === 2 ? M[0][0] * M[1][1] - M[0][1] * M[1][0] : M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
      if (!det) return { big: ["行列式", "0"], note: "行列式为 0，矩阵不可逆。" };
      var inv;
      if (n === 2) inv = [[M[1][1], -M[0][1]], [-M[1][0], M[0][0]]];
      else { inv = []; for (var i = 0; i < 3; i++) { inv.push([]); for (var j = 0; j < 3; j++) { var r = [0, 1, 2].filter(function (k) { return k !== j; }), c = [0, 1, 2].filter(function (k) { return k !== i; }); inv[i].push(((i + j) % 2 ? -1 : 1) * (M[r[0]][c[0]] * M[r[1]][c[1]] - M[r[0]][c[1]] * M[r[1]][c[0]])); } } }
      return { big: ["行列式", g(det, 8)], table: { h: ["逆矩阵"].concat(inv[0].map(function (_, j) { return "第 " + (j + 1) + " 列"; })), r: inv.map(function (row, i) { return ["第 " + (i + 1) + " 行"].concat(row.map(function (x) { return g(x / det, 6); })); }) } };
    } });

  add({ cat: "math", id: "binomial-distribution", name: "二项分布 / 概率计算器", desc: "n 次试验恰好 / 至少 k 次成功的概率", kw: "概率 二项分布",
    fields: [{ k: "n", l: "试验次数 n", v: 10 }, { k: "k", l: "成功次数 k", v: 3 }, { k: "p", l: "单次成功概率", u: "%", v: 30 }],
    run: function (v) {
      if (!Number.isInteger(v.n) || !Number.isInteger(v.k) || v.n < 0 || v.k < 0 || v.k > v.n || v.n > 1000) throw "请输入 0 ≤ k ≤ n ≤ 1000 的整数"; need(v.p);
      var p = v.p / 100, lc = function (n, k) { var s = 0; for (var i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i); return s; };
      function P(k) { if (p === 0) return k === 0 ? 1 : 0; if (p === 1) return k === v.n ? 1 : 0; return Math.exp(lc(v.n, k) + k * Math.log(p) + (v.n - k) * Math.log(1 - p)); }
      var eq = P(v.k), atl = 0, atm = 0; for (var i = 0; i <= v.n; i++) { if (i >= v.k) atl += P(i); if (i <= v.k) atm += P(i); }
      return { big: ["恰好 " + v.k + " 次", pct(eq, 4)], kv: [["至少 " + v.k + " 次", pct(atl, 4)], ["至多 " + v.k + " 次", pct(atm, 4)], ["期望次数", g(v.n * p)], ["标准差", g(Math.sqrt(v.n * p * (1 - p)))]] };
    } });

  /* ======================= 单位换算 ======================= */
  unit("angle", "角度换算器", "度、弧度、分、秒、百分度、圈", "角度 弧度", [["度 °", 1], ["弧度 rad", 180 / Math.PI], ["分 ′", 1 / 60], ["秒 ″", 1 / 3600], ["百分度 gon", 0.9], ["圈", 360], ["毫弧度 mrad", 0.18 / Math.PI]], "度 °");
  unit("power", "功率换算器", "瓦、千瓦、马力（公制/英制）、BTU/h、匹（空调）", "马力 千瓦 匹", [["瓦 W", 1], ["千瓦 kW", 1000], ["公制马力 PS", 735.49875], ["英制马力 hp", 745.69987], ["BTU/h", 0.29307107], ["千卡/时", 1.163], ["空调匹（制冷约 2500W）", 2500]], "千瓦 kW");
  unit("force", "力换算器", "牛顿、千牛、千克力、磅力、达因", "牛顿 千克力", [["牛顿 N", 1], ["千牛 kN", 1000], ["千克力 kgf", 9.80665], ["克力 gf", .00980665], ["磅力 lbf", 4.4482216], ["达因 dyn", 1e-5]], "牛顿 N");
  unit("data-rate", "网速 / 传输速率换算", "Mbps 宽带对应多少 MB/s 下载速度", "网速 宽带 mbps", [["Mbps（兆比特/秒）", 1e6], ["Kbps", 1e3], ["Gbps", 1e9], ["bps", 1], ["MB/s（兆字节/秒）", 8e6], ["KB/s", 8e3], ["GB/s", 8e9]], "Mbps（兆比特/秒）");
  unit("cooking", "烹饪计量换算", "杯、汤匙、茶匙、毫升、液盎司", "烘焙 汤匙 茶匙", [["毫升 mL", 1], ["升 L", 1000], ["美式杯 cup", 236.588], ["公制杯（250ml）", 250], ["汤匙 tbsp", 14.787], ["茶匙 tsp", 4.929], ["美制液盎司", 29.574], ["品脱 pint", 473.176]], "美式杯 cup");
  unit("frequency", "频率换算器", "赫兹、千赫、兆赫、吉赫、转每分钟", "赫兹 频率 rpm", [["赫兹 Hz", 1], ["千赫 kHz", 1e3], ["兆赫 MHz", 1e6], ["吉赫 GHz", 1e9], ["转/分 rpm", 1 / 60]], "兆赫 MHz");

  add({ cat: "convert", id: "fuel-efficiency", name: "燃油效率换算器", desc: "L/100km、km/L、美制 / 英制 MPG 互换", kw: "mpg 油耗",
    fields: [{ k: "x", l: "数值", v: 7 }, { k: "u", l: "单位", t: "sel", drop: true, o: ["L/100km", "km/L", "MPG（美制）", "MPG（英制）"] }],
    run: function (v) {
      pos(v.x); var l100 = v.u === "L/100km" ? v.x : v.u === "km/L" ? 100 / v.x : v.u === "MPG（美制）" ? 235.214583 / v.x : 282.480936 / v.x;
      return { table: { h: ["单位", "数值"], r: [["L/100km", g(l100, 4)], ["km/L", g(100 / l100, 4)], ["MPG（美制）", g(235.214583 / l100, 4)], ["MPG（英制）", g(282.480936 / l100, 4)]] } };
    } });

  function rmb(n) {
    if (!ok(n)) throw "请输入金额"; if (Math.abs(n) >= 1e16) throw "金额过大";
    var neg = n < 0; n = Math.round(Math.abs(n) * 100);
    var D2 = "零壹贰叁肆伍陆柒捌玖", U = ["", "拾", "佰", "仟"], B = ["", "万", "亿", "万亿"], intp = Math.floor(n / 100), jiao = Math.floor(n / 10) % 10, fen = n % 10, s = "";
    if (intp > 0) {
      var str = String(intp), groups = []; while (str.length) { groups.unshift(str.slice(-4)); str = str.slice(0, -4); }
      var zero = false;
      groups.forEach(function (gp, gi) {
        var gs = "", gz = false, val = +gp; gp = gp.padStart(4, "0");
        if (val === 0) { zero = true; return; }
        for (var i = 0; i < 4; i++) { var d = +gp[i]; if (d === 0) { gz = true; } else { if ((gz || zero) && (s || gs)) gs += "零"; gz = false; zero = false; gs += D2[d] + U[3 - i]; } }
        if (gz) zero = true;
        s += gs + B[groups.length - 1 - gi];
      });
      s += "元";
    }
    if (!jiao && !fen) s += (s ? "" : "零元") + "整";
    else { if (jiao) s += D2[jiao] + "角"; else if (intp) s += "零"; if (fen) s += D2[fen] + "分"; }
    return (neg ? "负" : "") + s;
  }
  add({ cat: "convert", id: "chinese-number", name: "人民币金额大写转换", desc: "数字金额转财务大写（壹贰叁…元角分整）", kw: "大写 金额 发票 支票",
    fields: [{ k: "x", l: "金额（元）", v: 10086.5 }],
    run: function (v) { return { big: ["大写", rmb(v.x)], kv: [["小写", "¥" + f(v.x, 2)]] }; } });

  add({ cat: "convert", id: "screen-ppi", name: "屏幕 PPI / 尺寸计算器", desc: "按分辨率和对角线尺寸算 PPI、屏幕宽高、长宽比", kw: "ppi dpi 分辨率 显示器",
    fields: [{ k: "w", l: "横向像素", u: "px", v: 2560 }, { k: "h", l: "纵向像素", u: "px", v: 1440 }, { k: "d", l: "对角线尺寸", u: "英寸", v: 27 }],
    run: function (v) {
      pos(v.w, v.h, v.d); var diag = Math.sqrt(v.w * v.w + v.h * v.h), ppi = diag / v.d, k = H.gcd(v.w, v.h);
      return { big: ["像素密度", f(ppi, 1) + " PPI"], kv: [["长宽比", v.w / k + ":" + v.h / k], ["屏幕宽", f(v.w / ppi * 2.54, 1) + " cm"], ["屏幕高", f(v.h / ppi * 2.54, 1) + " cm"], ["点距", f(25.4 / ppi, 4) + " mm"], ["总像素", f(v.w * v.h / 1e6, 2) + " 百万"]] };
    } });

  /* ======================= 日期时间 ======================= */
  add({ cat: "date", id: "lunar-solar", name: "农历公历转换器", desc: "公历转农历（含干支、生肖），农历查公历", kw: "农历 阴历 公历 阳历",
    fields: [{ k: "m", l: "方向", t: "sel", o: ["公历 → 农历", "农历 → 公历"] },
      { k: "d", l: "公历日期", t: "date", v: "today", show: function (v) { return v.m !== "农历 → 公历"; } },
      { k: "ly", l: "农历年", v: new Date().getFullYear(), show: function (v) { return v.m === "农历 → 公历"; } },
      { k: "lm", l: "农历月", t: "sel", drop: true, o: ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"], show: function (v) { return v.m === "农历 → 公历"; } },
      { k: "ll", l: "闰月", t: "sel", o: ["否", "是"], show: function (v) { return v.m === "农历 → 公历"; } },
      { k: "ld", l: "农历日", v: 1, show: function (v) { return v.m === "农历 → 公历"; } }],
    run: function (v) {
      if (v.m !== "农历 → 公历") { var d = D(v.d), L0 = lunar(d); return { big: ["农历", L0.gz + "年 " + L0.s], kv: [["生肖", SX[((L0.y - 4) % 12 + 12) % 12]], ["日干支", dayGz(d)], ["星期", WK[d.getDay()]]] }; }
      if (!Number.isInteger(v.ly) || v.ly < 1900 || v.ly > 2100) throw "农历年需在 1900–2100"; if (!Number.isInteger(v.ld) || v.ld < 1 || v.ld > 30) throw "农历日需在 1–30";
      var x = lunar2solar(v.ly, MN.indexOf(v.lm) + 1, v.ld, v.ll === "是"), t = lunar(x);
      return { big: ["公历", iso(x) + " " + WK[x.getDay()]], kv: [["农历", t.gz + "年 " + t.s], ["生肖", SX[((t.y - 4) % 12 + 12) % 12]]] };
    } });

  add({ cat: "date", id: "solar-term", name: "二十四节气计算器", desc: "某年 24 个节气的日期", kw: "节气 立春 冬至",
    fields: [{ k: "y", l: "年份", v: new Date().getFullYear() }],
    run: function (v) {
      if (!Number.isInteger(v.y) || v.y < 1901 || v.y > 2099) throw "年份需在 1901–2099"; var now = new Date(), next = null;
      var rows = TERMS.map(function (t, i) { var d = termDate(v.y, i); if (!next && d >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) next = [t[0], d]; return [t[0], iso(d), WK[d.getDay()]]; });
      return { big: next ? ["下一个节气", next[0] + " · " + iso(next[1])] : null, table: { h: ["节气", "日期", "星期"], r: rows }, note: "按寿星公式推算，个别年份可能与天文台公布相差 1 天。" };
    } });

  add({ cat: "date", id: "sanfu", name: "三伏天计算器", desc: "初伏、中伏、末伏起止日期和三伏总天数", kw: "三伏 入伏 出伏",
    fields: [{ k: "y", l: "年份", v: new Date().getFullYear() }],
    run: function (v) {
      if (!Number.isInteger(v.y) || v.y < 1901 || v.y > 2099) throw "年份需在 1901–2099";
      function nthGeng(from, n) { var d = new Date(from), c = 0; while (true) { if ((jdn(d) + 49) % 10 === 6) { c++; if (c === n) return d; } d.setDate(d.getDate() + 1); } }
      var xz = termDate(v.y, 11), lq = termDate(v.y, 14), c1 = nthGeng(xz, 3), c2 = nthGeng(xz, 4), m = nthGeng(lq, 1);
      var end = new Date(m); end.setDate(end.getDate() + 10); var mid = dayDiff(c2, m);
      function dd(a, n) { var x = new Date(a); x.setDate(x.getDate() + n); return iso(x); }
      return { big: ["三伏共", dayDiff(c1, end) + " 天"], table: { h: ["伏", "开始", "结束"], r: [["初伏", iso(c1), dd(c1, 9)], ["中伏（" + mid + " 天）", iso(c2), dd(c2, mid - 1)], ["末伏", iso(m), dd(m, 9)]] }, note: "夏至后第 3 个庚日入伏，立秋后第 1 个庚日为末伏。" };
    } });

  add({ cat: "date", id: "zodiac", name: "生肖 / 干支 / 星座查询", desc: "按出生日期查生肖、年月日干支（按立春 / 节气）、星座", kw: "生肖 干支 八字 星座",
    fields: [{ k: "d", l: "出生日期", t: "date", v: "2000-01-01" }],
    run: function (v) {
      var d = D(v.d), yr = d.getFullYear(); if (yr < 1901 || yr > 2099) throw "年份需在 1901–2099";
      var gy = d < termDate(yr, 2) ? yr - 1 : yr, br = 0; // 子
      for (var i = 0; i < 12; i++) if (d >= termDate(yr, i * 2)) br = (i + 1) % 12;
      var mIdx = (br + 10) % 12, yStem = ((gy - 4) % 10 + 10) % 10, mStem = ((yStem % 5) * 2 + 2 + mIdx) % 10, mBr = br;
      var lu = lunar(d);
      return { big: ["生肖（按立春）", SX[((gy - 4) % 12 + 12) % 12]], kv: [["年柱", yearGz(gy)], ["月柱", GAN[mStem] + ZHI[mBr]], ["日柱", dayGz(d)], ["农历", lu.gz + "年 " + lu.s], ["按农历春节的生肖", SX[((lu.y - 4) % 12 + 12) % 12]]], note: "八字年柱以立春为界，民间生肖常以春节为界，两者在 1–2 月出生时可能不同。" };
    } });

  add({ cat: "date", id: "timezone", name: "时区换算 / 世界时间", desc: "北京时间与纽约、伦敦、东京等城市时间互换（含夏令时）", kw: "时差 时区 世界时间",
    fields: [{ k: "t", l: "时间", t: "dt", v: (function () { var d = new Date(Date.now() + 8 * 36e5); return d.toISOString().slice(0, 16); })() },
      { k: "z", l: "该时间所在时区", t: "sel", drop: true, o: [["Asia/Shanghai", "北京 / 上海"], ["Asia/Tokyo", "东京"], ["Asia/Singapore", "新加坡"], ["Europe/London", "伦敦"], ["Europe/Paris", "巴黎"], ["America/New_York", "纽约"], ["America/Los_Angeles", "洛杉矶"], ["Australia/Sydney", "悉尼"], ["UTC", "UTC"]] }],
    run: function (v) {
      if (!v.t) throw "请选择时间"; var p = v.t.split(/[-T:]/).map(Number), guess = Date.UTC(p[0], p[1] - 1, p[2], p[3], p[4] || 0);
      function off(zone, ms) { var o = {}; new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(ms)).forEach(function (x) { o[x.type] = x.value; }); return Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour % 24, +o.minute) - ms; }
      var ms = guess - off(v.z, guess); ms = guess - off(v.z, ms);
      var Z = [["北京", "Asia/Shanghai"], ["东京", "Asia/Tokyo"], ["新加坡", "Asia/Singapore"], ["迪拜", "Asia/Dubai"], ["莫斯科", "Europe/Moscow"], ["柏林 / 巴黎", "Europe/Paris"], ["伦敦", "Europe/London"], ["纽约", "America/New_York"], ["芝加哥", "America/Chicago"], ["洛杉矶", "America/Los_Angeles"], ["悉尼", "Australia/Sydney"], ["UTC", "UTC"]];
      var fmt = function (zone) { return new Intl.DateTimeFormat("zh-CN", { timeZone: zone, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" }).format(new Date(ms)); };
      return { table: { h: ["城市", "当地时间", "与北京时差"], r: Z.map(function (z) { var h = (off(z[1], ms) - off("Asia/Shanghai", ms)) / 36e5; return [z[0], fmt(z[1]), h === 0 ? "—" : (h > 0 ? "+" : "") + h + " 小时"]; }) } };
    } });

  add({ cat: "date", id: "baby-months", name: "宝宝月龄 / 满月百日", desc: "宝宝出生多少天、几个月，满月、百日、周岁日期", kw: "月龄 满月 百天 百日",
    fields: [{ k: "b", l: "出生日期", t: "date", v: function () { var d = new Date(); d.setDate(d.getDate() - 75); return iso(d); } }],
    run: function (v) {
      var b = D(v.b), t = new Date(); t = new Date(t.getFullYear(), t.getMonth(), t.getDate()); if (t < b) throw "出生日期在未来"; var a = ymd(b, t);
      function plus(n) { var x = new Date(b); x.setDate(x.getDate() + n); return iso(x) + " " + WK[x.getDay()]; }
      return { big: ["月龄", (a[0] * 12 + a[1]) + " 个月 " + a[2] + " 天"], kv: [["出生第", dayDiff(b, t) + 1 + " 天"], ["满月（第 30 天）", plus(29)], ["百日（第 100 天）", plus(99)], ["周岁", iso(addMonths(b, 12))]], note: "民间满月、百日多按出生当天算第 1 天。" };
    } });

  add({ cat: "date", id: "work-years", name: "工龄 / 司龄计算器", desc: "入职至今多少年月日，对应法定年休假天数", kw: "工龄 司龄 年假 入职",
    fields: [{ k: "a", l: "参加工作 / 入职日期", t: "date", v: "2020-07-01" }, { k: "b", l: "计算到", t: "date", v: "today" }],
    run: function (v) {
      var a = D(v.a), b = D(v.b); if (b < a) throw "结束日期早于入职日期"; var p = ymd(a, b), yrs = p[0], leave = yrs >= 20 ? 15 : yrs >= 10 ? 10 : yrs >= 1 ? 5 : 0;
      return { big: ["工龄", p[0] + " 年 " + p[1] + " 个月 " + p[2] + " 天"], kv: [["合计天数", f(dayDiff(a, b), 0) + " 天"], ["约合", f(dayDiff(a, b) / 365.2425, 2) + " 年"], ["法定年休假（按累计工龄）", leave + " 天"]], note: "《职工带薪年休假条例》：累计工作满 1 年不满 10 年 5 天，满 10 年不满 20 年 10 天，满 20 年 15 天。" };
    } });

  add({ cat: "date", id: "retirement-age", name: "退休年龄计算器", desc: "按 2025 年渐进式延迟退休政策算法定退休年龄和日期", kw: "延迟退休 退休",
    fields: [{ k: "b", l: "出生年月", t: "date", v: "1980-06-01" }, { k: "t", l: "类别", t: "sel", drop: true, o: ["男职工（原 60 岁）", "女职工（原 50 岁）", "女干部（原 55 岁）"] }],
    run: function (v) {
      var b = D(v.b), cfg = v.t[0] === "男" ? [60, 1965, 4, 36] : v.t.indexOf("50") > -1 ? [50, 1975, 2, 60] : [55, 1970, 4, 36];
      var idx = (b.getFullYear() - cfg[1]) * 12 + b.getMonth(), delay = idx < 0 ? 0 : Math.min(Math.floor(idx / cfg[2]) + 1, cfg[3]);
      var ret = addMonths(new Date(b.getFullYear(), b.getMonth(), 1), cfg[0] * 12 + delay);
      return { big: ["法定退休年龄", (cfg[0] + Math.floor(delay / 12)) + " 岁" + (delay % 12 ? " " + delay % 12 + " 个月" : "")], kv: [["延迟", delay + " 个月"], ["退休时间", ret.getFullYear() + " 年 " + (ret.getMonth() + 1) + " 月"], ["距今", Math.max(dayDiff(new Date(), ret), 0) + " 天"]], note: "依据 2025 年 1 月 1 日起施行的渐进式延迟退休办法：男 60→63、女 55→58 每 4 个月延 1 个月，女 50→55 每 2 个月延 1 个月。" };
    } });

  add({ cat: "date", id: "time-add", name: "时间加减 / 时长换算", desc: "时:分:秒相加减，秒数换算成时分秒", kw: "时分秒 时长 秒转换",
    fields: [{ k: "a", l: "时间 A（时:分:秒 或 秒数）", t: "text", v: "01:45:30" }, { k: "o", l: "运算", t: "sel", o: ["+", "−"] }, { k: "b", l: "时间 B", t: "text", v: "00:30:45" }],
    run: function (v) {
      function sec(s) { s = String(s).trim(); if (/^\d+(\.\d+)?$/.test(s)) return +s; var p = s.split(/[:：]/).map(Number); if (p.some(isNaN) || p.length > 3) throw "格式如 01:45:30"; while (p.length < 3) p.unshift(0); return p[0] * 3600 + p[1] * 60 + p[2]; }
      var r = v.o === "+" ? sec(v.a) + sec(v.b) : sec(v.a) - sec(v.b), neg = r < 0; r = Math.abs(r);
      var hms = Math.floor(r / 3600) + ":" + String(Math.floor(r / 60) % 60).padStart(2, "0") + ":" + String(Math.round(r % 60)).padStart(2, "0");
      return { big: ["结果", (neg ? "-" : "") + hms], kv: [["合计秒数", g(r)], ["合计分钟", g(r / 60, 4)], ["合计小时", g(r / 3600, 4)], ["约合天数", g(r / 86400, 4)]] };
    } });

  /* ======================= 生活实用 ======================= */
  add({ cat: "life", id: "kinship-title", name: "亲戚称呼计算器", desc: "爸爸的妈妈的弟弟叫什么？一键算出称呼", kw: "亲戚 称呼 过年", href: "/hark/calculator.html", fields: [], run: function () {} });

  add({ cat: "life", id: "pet-age", name: "猫狗年龄换算", desc: "猫咪、狗狗年龄相当于人类几岁", kw: "猫 狗 宠物 年龄",
    fields: [{ k: "p", l: "宠物", t: "sel", o: ["猫", "小型犬", "中型犬", "大型犬"] }, { k: "a", l: "宠物年龄", u: "岁", v: 3 }],
    run: function (v) {
      pos(v.a); var a = v.a, h;
      if (v.p === "猫") h = a <= 1 ? 15 * a : a <= 2 ? 15 + 9 * (a - 1) : 24 + 4 * (a - 2);
      else { var k = v.p === "小型犬" ? 4 : v.p === "中型犬" ? 5 : 6.5; h = a <= 1 ? 15 * a : a <= 2 ? 15 + 9 * (a - 1) : 24 + k * (a - 2); }
      return { big: ["相当于人类", f(h, 0) + " 岁"], note: "参考 AAHA / AAFP 通行换算：第 1 年约 15 岁、第 2 年再 +9 岁，之后猫每年 +4，狗按体型每年 +4 到 +7。" };
    } });

  add({ cat: "life", id: "gacha", name: "抽卡概率计算器", desc: "按单抽概率算 n 抽内至少出一次的概率、期望抽数", kw: "抽卡 保底 概率 原神",
    fields: [{ k: "p", l: "单抽出货概率", u: "%", v: 0.6 }, { k: "n", l: "抽数", u: "抽", v: 90 }, { k: "c", l: "每抽价格（可选）", u: "元", v: 16 }],
    run: function (v) {
      pos(v.p, v.n); var p = v.p / 100, at = 1 - Math.pow(1 - p, v.n), n50 = Math.ceil(Math.log(.5) / Math.log(1 - p)), n90 = Math.ceil(Math.log(.1) / Math.log(1 - p));
      return { big: [v.n + " 抽内至少出 1 次", pct(at, 2)], kv: [["期望抽数", f(1 / p, 0) + " 抽"], ["50% 把握需要", n50 + " 抽"], ["90% 把握需要", n90 + " 抽"], [v.n + " 抽花费", ok(v.c) ? y(v.c * v.n) : "—"]], note: "按每抽独立计算，不含保底和概率递增机制；有保底时最差情况即保底抽数。" };
    } });

  add({ cat: "life", id: "coffee-ratio", name: "咖啡粉水比计算器", desc: "按粉水比算手冲、冷萃、法压需要多少粉和水", kw: "手冲 咖啡 粉水比",
    fields: [{ k: "m", l: "方式", t: "sel", drop: true, o: [[15, "手冲 1:15"], [16, "手冲 1:16"], [12, "法压 1:12"], [8, "冷萃浓缩 1:8"], [2, "意式 1:2"]], v: 15 }, { k: "w", l: "想要的咖啡量", u: "ml", v: 300 }],
    run: function (v) { pos(v.w); var coffee = v.w / v.m; return { big: ["咖啡粉", f(coffee, 1) + " g"], kv: [["注水量", f(v.w, 0) + " ml"], ["粉水比", "1 : " + v.m]], note: v.m >= 15 ? "手冲建议水温 90–93℃，总时长 2–3 分钟。" : "" }; } });

  add({ cat: "life", id: "carpool-split", name: "拼车 / 自驾游费用分摊", desc: "油费、过路费、停车费按人数平摊", kw: "拼车 自驾 分摊",
    fields: [{ k: "d", l: "总里程", u: "km", v: 600 }, { k: "c", l: "百公里油耗", u: "L", v: 7.5 }, { k: "p", l: "油价", u: "元/L", v: 7.5 }, { k: "t", l: "过路费", u: "元", v: 280 }, { k: "o", l: "停车及其他", u: "元", v: 100 }, { k: "n", l: "人数（含司机）", u: "人", v: 4 }, { k: "dr", l: "司机是否分摊", t: "sel", o: ["分摊", "不分摊"] }],
    run: function (v) {
      pos(v.d, v.c, v.p, v.n); need(v.t, v.o); var fuel = v.d * v.c / 100 * v.p, tot = fuel + v.t + v.o, k = v.dr === "分摊" ? v.n : v.n - 1; if (k < 1) throw "人数不足";
      return { big: ["每人分摊", y(tot / k)], kv: [["油费", y(fuel)], ["总费用", y(tot)], ["每公里", y(tot / v.d)]] };
    } });

  add({ cat: "life", id: "data-usage", name: "手机流量计算器", desc: "按每天刷视频、听歌、导航时长估算每月流量", kw: "流量 套餐 gb",
    fields: [{ k: "v", l: "短视频 / 视频（小时/天）", v: 1.5 }, { k: "q", l: "视频清晰度", t: "sel", o: [[0.7, "标清"], [1.5, "高清 1080P"], [3, "超清"]], v: 1.5 }, { k: "m", l: "听音乐（小时/天）", v: 1 }, { k: "s", l: "刷网页社交（小时/天）", v: 2 }, { k: "n", l: "导航（小时/天）", v: 0.5 }, { k: "g", l: "手游（小时/天）", v: 0.5 }],
    run: function (v) {
      need(v.v, v.m, v.s, v.n, v.g); var day = v.v * v.q + v.m * 0.07 + v.s * 0.15 + v.n * 0.02 + v.g * 0.05, mon = day * 30;
      return { big: ["每月约", f(mon, 1) + " GB"], kv: [["每天约", f(day * 1024, 0) + " MB"], ["建议套餐", (mon <= 30 ? 30 : mon <= 60 ? 60 : mon <= 100 ? 100 : Math.ceil(mon / 50) * 50) + " GB 以上"]], note: "估算：视频标清 0.7 GB/时、高清 1.5、超清 3；音乐 70 MB/时；社交 150 MB/时；导航 20 MB/时；手游 50 MB/时。" };
    } });

  add({ cat: "life", id: "gift-cash", name: "份子钱参考计算器", desc: "按关系亲疏和城市档位给出随礼参考区间", kw: "随礼 红包 婚礼",
    fields: [{ k: "r", l: "关系", t: "sel", drop: true, o: [[3, "直系亲属 / 至亲"], [2, "好朋友 / 近亲"], [1.3, "同事 / 同学"], [1, "一般朋友"]], v: 2 }, { k: "c", l: "城市", t: "sel", o: [[1.5, "一线城市"], [1.2, "省会 / 二线"], [1, "三四线 / 县城"]], v: 1.2 }, { k: "w", l: "是否携伴出席", t: "sel", o: ["否", "是"] }],
    run: function (v) {
      var base = 500 * v.r * v.c * (v.w === "是" ? 1.5 : 1), lo = Math.round(base * .8 / 100) * 100, hi = Math.round(base * 1.3 / 100) * 100;
      var lucky = [600, 666, 800, 888, 1000, 1200, 1314, 1600, 1666, 1888, 2000, 2666, 3000, 3666, 5000, 6666, 8888, 10000].filter(function (x) { return x >= lo && x <= hi; });
      return { big: ["参考区间", y(lo) + " – " + y(hi)], kv: [["吉利数", lucky.length ? lucky.join("、") : "—"]], note: "风俗因地而异：多数地方忌讳单数和带 4 的金额。最好参考对方之前给你的金额，礼尚往来。" };
    } });

  /* ======================= 教育学业 ======================= */
  add({ cat: "edu", id: "ielts-score", name: "雅思总分计算器", desc: "按听说读写四项算总分（官方 0.25 / 0.75 进位规则）", kw: "雅思 ielts",
    fields: [{ k: "l", l: "听力", v: 7 }, { k: "r", l: "阅读", v: 7.5 }, { k: "w", l: "写作", v: 6 }, { k: "s", l: "口语", v: 6 }],
    run: function (v) {
      need(v.l, v.r, v.w, v.s); [v.l, v.r, v.w, v.s].forEach(function (x) { if (x < 0 || x > 9 || x * 2 % 1) throw "单项分需为 0–9 的整数或 .5"; });
      var avg = (v.l + v.r + v.w + v.s) / 4, fl = Math.floor(avg), fr = avg - fl, tot = fr < .25 ? fl : fr < .75 ? fl + .5 : fl + 1;
      return { big: ["总分", g(tot)], kv: [["四项平均", g(avg, 3)], ["最低单项", g(Math.min(v.l, v.r, v.w, v.s))]] };
    } });

  add({ cat: "edu", id: "toefl-score", name: "托福 / 考研总分计算器", desc: "托福四项总分；考研各科总分与单科线对照", kw: "托福 toefl 考研 总分",
    fields: [{ k: "t", l: "考试", t: "sel", o: ["托福", "考研"] }, { k: "a", l: "托福阅读 / 考研政治", v: 26 }, { k: "b", l: "托福听力 / 考研英语", v: 25 }, { k: "c", l: "托福口语 / 考研数学或专业一", v: 22 }, { k: "d", l: "托福写作 / 考研专业课", v: 24 }, { k: "line", l: "考研国家线：总分", v: 0, show: function (v) { return v.t === "考研"; } }],
    run: function (v) {
      need(v.a, v.b, v.c, v.d); var s = v.a + v.b + v.c + v.d;
      if (v.t === "托福") { if ([v.a, v.b, v.c, v.d].some(function (x) { return x < 0 || x > 30; })) throw "托福单项 0–30"; return { big: ["托福总分", s + " / 120"], note: "托福 2026 年起改为 1–6 分制成绩时，可对照官方换算表。" }; }
      return { big: ["考研总分", s + " / 500"], kv: [["与国家线差", ok(v.line) && v.line > 0 ? (s - v.line >= 0 ? "+" : "") + (s - v.line) + " 分" : "未填写国家线"]] };
    } });

  add({ cat: "edu", id: "grade-convert", name: "百分制 / 五级制 / 等级换算", desc: "百分制成绩转优良中差、五分制、字母等级", kw: "等级 五分制 优秀",
    fields: [{ k: "s", l: "百分制成绩", v: 86 }],
    run: function (v) {
      need(v.s); if (v.s < 0 || v.s > 100) throw "成绩需在 0–100"; var s = v.s;
      return { kv: [["五级制", s >= 90 ? "优秀" : s >= 80 ? "良好" : s >= 70 ? "中等" : s >= 60 ? "及格" : "不及格"], ["五分制", s >= 90 ? 5 : s >= 80 ? 4 : s >= 70 ? 3 : s >= 60 ? 2 : 1], ["字母等级", s >= 93 ? "A" : s >= 90 ? "A-" : s >= 87 ? "B+" : s >= 83 ? "B" : s >= 80 ? "B-" : s >= 77 ? "C+" : s >= 73 ? "C" : s >= 70 ? "C-" : s >= 60 ? "D" : "F"], ["标准 4.0 绩点", s >= 90 ? 4 : s >= 80 ? 3 : s >= 70 ? 2 : s >= 60 ? 1 : 0]] };
    } });

  add({ cat: "edu", id: "civil-service-total", name: "公务员 / 事业编总成绩", desc: "笔试、面试按比例折算综合成绩", kw: "公务员 考公 事业编 面试",
    fields: [{ k: "w", l: "笔试成绩", v: 140 }, { k: "wf", l: "笔试满分", v: 200 }, { k: "ww", l: "笔试占比", u: "%", v: 50 }, { k: "i", l: "面试成绩", v: 82 }, { k: "if", l: "面试满分", v: 100 }],
    run: function (v) {
      need(v.w, v.ww, v.i); pos(v.wf, v.if); var t = v.w / v.wf * 100 * v.ww / 100 + v.i / v.if * 100 * (1 - v.ww / 100);
      return { big: ["综合成绩（百分制）", f(t, 2)], kv: [["笔试折算", f(v.w / v.wf * v.ww, 2)], ["面试折算", f(v.i / v.if * (100 - v.ww), 2)]], note: "国考常见算法：(行测 + 申论) ÷ 2 × 50% + 面试 × 50%，以当年公告为准。" };
    } });

  add({ cat: "edu", id: "typing-speed", name: "打字速度 / 阅读时间", desc: "字数和用时算每分钟字数，或估算一篇文章的阅读时长", kw: "打字 wpm 阅读",
    fields: [{ k: "m", l: "计算", t: "sel", o: ["打字速度", "阅读时间"] }, { k: "n", l: "字数", u: "字", v: 3000 }, { k: "t", l: "用时（打字速度用）", u: "分钟", v: 50, show: function (v) { return v.m === "打字速度"; } }, { k: "s", l: "阅读速度（每分钟字数）", v: 400, show: function (v) { return v.m === "阅读时间"; } }],
    run: function (v) {
      pos(v.n); if (v.m === "打字速度") { pos(v.t); var sp = v.n / v.t; return { big: ["打字速度", f(sp, 0) + " 字/分钟"], tag: sp >= 120 ? "专业" : sp >= 60 ? "熟练" : "入门" }; }
      pos(v.s); var min = v.n / v.s; return { big: ["阅读时间", min < 1 ? "不到 1 分钟" : Math.floor(min) + " 分 " + Math.round(min % 1 * 60) + " 秒"], kv: [["朗读约需", f(v.n / 200, 1) + " 分钟（200 字/分）"]] };
    } });

  add({ cat: "edu", id: "rank-percentile", name: "成绩排名百分位", desc: "按名次和总人数算超过了百分之多少的人", kw: "排名 百分位 位次",
    fields: [{ k: "r", l: "名次", v: 35 }, { k: "n", l: "总人数", v: 500 }],
    run: function (v) { pos(v.r, v.n); if (v.r > v.n) throw "名次不能大于总人数"; return { big: ["超过了", pct((v.n - v.r) / v.n, 1) + " 的人"], kv: [["位于前", pct(v.r / v.n, 1)], ["百分位", "P" + f((v.n - v.r) / v.n * 100, 0)]] }; } });

  /* ======================= 商业财税 ======================= */
  add({ cat: "biz", id: "labor-remuneration-tax", name: "劳务报酬个税计算器", desc: "劳务报酬 / 稿酬 / 特许权使用费单次预扣税额", kw: "劳务报酬 稿酬 兼职 个税",
    fields: [{ k: "t", l: "所得类型", t: "sel", o: ["劳务报酬", "稿酬", "特许权使用费"] }, { k: "x", l: "单次收入", u: "元", v: 10000 }],
    run: function (v) {
      pos(v.x); var base = v.x <= 4000 ? Math.max(v.x - 800, 0) : v.x * .8, tax;
      if (v.t === "稿酬") { base *= .7; tax = base * .2; } else if (v.t === "特许权使用费") tax = base * .2;
      else tax = base <= 20000 ? base * .2 : base <= 50000 ? base * .3 - 2000 : base * .4 - 7000;
      return { big: ["预扣个税", y(tax)], kv: [["应纳税所得额", y(base)], ["税后到手", y(v.x - tax)], ["实际税负", pct(tax / v.x)]], note: "此为支付方预扣预缴；年度汇算时劳务报酬按收入 80% 并入综合所得重新计税，可能退税或补税。" };
    } });

  add({ cat: "biz", id: "corporate-tax", name: "企业所得税计算器", desc: "一般企业 25%，小型微利企业实际 5% 优惠", kw: "企业所得税 小微企业",
    fields: [{ k: "p", l: "年应纳税所得额", u: "元", v: 2000000 }, { k: "t", l: "企业类型", t: "sel", drop: true, o: ["小型微利企业", "一般企业（25%）", "高新技术企业（15%）"] }],
    run: function (v) {
      need(v.p); var p = Math.max(v.p, 0), tax, note = "";
      if (v.t === "小型微利企业") { if (p > 3e6) { tax = p * .25; note = "应纳税所得额超过 300 万元，不再符合小型微利企业条件，按 25% 计算。"; } else { tax = p * .25 * .2; note = "小型微利企业减按 25% 计入所得额、按 20% 税率，实际税负 5%，政策执行至 2027 年 12 月 31 日。"; } }
      else tax = p * (v.t.indexOf("15") > -1 ? .15 : .25);
      return { big: ["应纳企业所得税", y(tax)], kv: [["实际税负", p ? pct(tax / p) : "—"], ["税后利润", y(p - tax)]], note: note };
    } });

  add({ cat: "biz", id: "stamp-tax", name: "印花税计算器", desc: "合同、产权转移、股票交易等印花税", kw: "印花税 合同",
    fields: [{ k: "a", l: "计税金额", u: "元", v: 1000000 }, { k: "t", l: "税目", t: "sel", drop: true, o: [[0.3, "买卖合同 0.3‰"], [0.3, "承揽 / 建设工程 / 技术合同 0.3‰"], [0.05, "借款合同 0.05‰"], [1, "租赁 / 仓储 / 保管 / 财产保险合同 1‰"], [0.3, "运输合同 0.3‰"], [0.5, "产权转移书据 0.5‰"], [0.25, "营业账簿（实收资本 + 资本公积）0.25‰"], [0.5, "证券交易（卖方）0.5‰"]], v: 0.3 }, { k: "h", l: "小规模 / 小微企业减半", t: "sel", o: ["否", "是"] }],
    run: function (v) { need(v.a); var tax = v.a * v.t / 1000 * (v.h === "是" ? .5 : 1); return { big: ["应纳印花税", y(tax)], kv: [["税率", v.t + "‰" + (v.h === "是" ? " × 50%" : "")]], note: "依据《印花税法》（2022 年 7 月起施行）。小规模纳税人、小型微利企业和个体户“六税两费”减半至 2027 年底（证券交易印花税除外）。" }; } });

  add({ cat: "biz", id: "surtax", name: "增值税附加税计算器", desc: "城建税、教育费附加、地方教育附加", kw: "附加税 城建税 教育费附加",
    fields: [{ k: "v", l: "实缴增值税（+ 消费税）", u: "元", v: 10000 }, { k: "c", l: "所在地", t: "sel", o: [[7, "市区 7%"], [5, "县城 / 镇 5%"], [1, "其他 1%"]], v: 7 }, { k: "h", l: "小规模 / 小微 / 个体户减半", t: "sel", o: ["否", "是"] }],
    run: function (v) {
      need(v.v); var k = v.h === "是" ? .5 : 1, a = v.v * v.c / 100 * k, b = v.v * .03 * k, c = v.v * .02 * k;
      return { big: ["附加税合计", y(a + b + c)], kv: [["城市维护建设税", y(a)], ["教育费附加 3%", y(b)], ["地方教育附加 2%", y(c)]], note: "月销售额 10 万元以下（季度 30 万）的小规模纳税人免征教育费附加和地方教育附加。" };
    } });

  add({ cat: "biz", id: "ecommerce-profit", name: "电商利润计算器", desc: "售价扣除成本、平台佣金、运费、推广后的单件利润", kw: "电商 淘宝 拼多多 抖音 利润",
    fields: [{ k: "p", l: "售价", u: "元", v: 99 }, { k: "c", l: "商品成本", u: "元", v: 35 }, { k: "cm", l: "平台佣金 / 技术服务费", u: "%", v: 5 }, { k: "sh", l: "快递 + 包装", u: "元", v: 6 }, { k: "ad", l: "推广费占比", u: "%", v: 15 }, { k: "rt", l: "退货率", u: "%", v: 10 }],
    run: function (v) {
      pos(v.p); need(v.c, v.cm, v.sh, v.ad, v.rt); var fee = v.p * v.cm / 100, ad = v.p * v.ad / 100, loss = (v.sh + v.sh) * v.rt / 100 / (1 - v.rt / 100);
      var profit = v.p - v.c - fee - v.sh - ad - loss;
      return { big: ["单件净利润", y(profit)], kv: [["净利率", pct(profit / v.p)], ["平台佣金", y(fee)], ["推广费", y(ad)], ["退货分摊", y(loss)], ["保本 ROI", (v.p - v.c - fee - v.sh - loss) > 0 ? f(v.p / (v.p - v.c - fee - v.sh - loss), 2) : "—"]] };
    } });

  add({ cat: "biz", id: "employer-cost", name: "企业用工成本计算器", desc: "工资 + 单位社保公积金，算公司每月实际支出", kw: "用工成本 社保 单位",
    fields: [{ k: "s", l: "员工税前月薪", u: "元", v: 10000 }, { k: "b", l: "缴费基数", u: "元", v: 10000 }, { k: "p", l: "单位养老", u: "%", v: 16 }, { k: "m", l: "单位医疗（含生育）", u: "%", v: 9.5 }, { k: "u", l: "单位失业", u: "%", v: 0.5 }, { k: "i", l: "工伤", u: "%", v: 0.4 }, { k: "h", l: "单位公积金", u: "%", v: 7 }],
    run: function (v) {
      pos(v.s); need(v.b, v.p, v.m, v.u, v.i, v.h); var soc = v.b * (v.p + v.m + v.u + v.i) / 100, fund = v.b * v.h / 100, tot = v.s + soc + fund;
      return { big: ["每月用工成本", y(tot)], kv: [["单位社保", y(soc)], ["单位公积金", y(fund)], ["为工资的", pct(tot / v.s, 1)], ["年度成本", y(tot * 12)]] };
    } });

  add({ cat: "biz", id: "cross-border-tax", name: "跨境电商综合税计算器", desc: "海淘跨境电商零售进口：增值税、消费税 7 折", kw: "海淘 跨境 进口税",
    fields: [{ k: "p", l: "完税价格（商品 + 运费 + 保费）", u: "元", v: 2000 }, { k: "v", l: "增值税率", t: "sel", o: [[13, "13%"], [9, "9%"]], v: 13 }, { k: "c", l: "消费税率（化妆品 15%、无则 0）", u: "%", v: 0 }],
    run: function (v) {
      pos(v.p); need(v.c); if (v.p > 5000) return { big: ["超过单次限值", "需按一般贸易缴税"], note: "跨境电商零售进口单次交易限值 5000 元、年度 26000 元。" };
      var ct = v.p / (1 - v.c / 100) * v.c / 100, vt = (v.p + ct) * v.v / 100, tot = (ct + vt) * .7;
      return { big: ["应缴税款", y(tot)], kv: [["综合税率", pct(tot / v.p)], ["含税总价", y(v.p + tot)]], note: "限值内关税为 0%，进口环节增值税、消费税按法定应纳税额的 70% 征收。" };
    } });

  /* ======================= 工程建筑 ======================= */
  add({ cat: "build", id: "brick", name: "砖块用量计算器", desc: "按墙面面积、墙厚和砖规格算砖数和砂浆", kw: "砖 砌墙 红砖",
    fields: [{ k: "a", l: "墙面面积（扣除门窗）", u: "㎡", v: 20 }, { k: "t", l: "墙厚", t: "sel", o: [[0.12, "12 墙（半砖）"], [0.24, "24 墙（一砖）"], [0.37, "37 墙"]], v: 0.24 }, { k: "l", l: "砖长", u: "mm", v: 240 }, { k: "w", l: "砖宽", u: "mm", v: 115 }, { k: "h", l: "砖高", u: "mm", v: 53 }, { k: "lo", l: "损耗", u: "%", v: 3 }],
    run: function (v) {
      pos(v.a, v.l, v.w, v.h); need(v.lo); var j = 10, vol = v.a * v.t, per = (v.l + j) * (v.w + j) * (v.h + j) / 1e9, n = Math.ceil(vol / per * (1 + v.lo / 100)), mortar = vol - n / (1 + v.lo / 100) * v.l * v.w * v.h / 1e9;
      return { big: ["需要砖", f(n, 0) + " 块"], kv: [["砌体体积", f(vol, 2) + " m³"], ["每立方约", f(1 / per, 0) + " 块"], ["砂浆约", f(mortar, 2) + " m³"]] };
    } });

  add({ cat: "build", id: "ac-btu", name: "空调匹数计算器", desc: "按房间面积、朝向、层高推荐空调匹数", kw: "空调 匹数 制冷量",
    fields: [{ k: "a", l: "房间面积", u: "㎡", v: 18 }, { k: "h", l: "层高", u: "m", v: 2.8 }, { k: "o", l: "房间情况", t: "sel", drop: true, o: [[160, "普通卧室 / 北向"], [190, "南向 / 西晒 / 顶楼"], [230, "客厅 / 人多 / 大窗"], [300, "餐厅 / 厨房 / 商铺"]], v: 160 }],
    run: function (v) {
      pos(v.a, v.h); var w = v.a * v.o * (v.h / 2.7), hp = w / 2500, opts = [1, 1.5, 2, 2.5, 3, 5], pick = opts.filter(function (x) { return x >= hp; })[0] || Math.ceil(hp);
      return { big: ["推荐", pick + " 匹"], kv: [["所需制冷量", f(w, 0) + " W"], ["计算匹数", f(hp, 2)]], note: "1 匹制冷量约 2500W，1.5 匹约 3500W，2 匹约 5000W，3 匹约 7200W。" };
    } });

  add({ cat: "build", id: "stair-steps", name: "楼梯踏步计算器", desc: "按层高和踏步高算踏步数、踏面宽、楼梯坡度", kw: "楼梯 踏步 复式",
    fields: [{ k: "h", l: "层高（楼面到楼面）", u: "cm", v: 290 }, { k: "r", l: "理想踏步高", u: "cm", v: 17 }],
    run: function (v) {
      pos(v.h, v.r); var n = Math.round(v.h / v.r), rh = v.h / n, t = 63 - 2 * rh, len = t * (n - 1), ang = Math.atan(rh / t) * 180 / Math.PI;
      return { big: ["踏步数", n + " 步"], kv: [["实际踏步高", f(rh, 1) + " cm"], ["建议踏面宽", f(t, 1) + " cm"], ["楼梯水平长度", f(len / 100, 2) + " m"], ["坡度", f(ang, 1) + "°"]], note: "按舒适步距公式 2 × 踏步高 + 踏面宽 ≈ 63 cm。住宅踏步高不宜大于 17.5 cm，坡度 30°–35° 较舒适。" };
    } });

  add({ cat: "build", id: "slope-grade", name: "坡度计算器", desc: "高差与水平距离求坡度百分比、角度、坡比", kw: "坡度 角度 坡比",
    fields: [{ k: "h", l: "高差", u: "m", v: 1 }, { k: "l", l: "水平距离", u: "m", v: 12 }],
    run: function (v) { pos(v.h, v.l); var a = Math.atan(v.h / v.l) * 180 / Math.PI; return { big: ["坡度", pct(v.h / v.l, 2)], kv: [["角度", f(a, 2) + "°"], ["坡比", "1 : " + f(v.l / v.h, 2)], ["斜面长度", f(Math.sqrt(v.h * v.h + v.l * v.l), 3) + " m"]], note: "无障碍坡道坡度不宜大于 1:12（约 8.33%）。" }; } });

  add({ cat: "build", id: "wire-load", name: "电线负荷 / 线径选择", desc: "按用电功率算电流，推荐铜线截面积和空开", kw: "电线 平方 空开 线径",
    fields: [{ k: "p", l: "总功率", u: "W", v: 5000 }, { k: "u", l: "电压", t: "sel", o: [[220, "单相 220V"], [380, "三相 380V"]], v: 220 }, { k: "pf", l: "功率因数", v: 0.9 }],
    run: function (v) {
      pos(v.p); var pf = ok(v.pf) && v.pf > 0 ? v.pf : 1, I = v.u === 380 ? v.p / (Math.sqrt(3) * 380 * pf) : v.p / (220 * pf);
      var T = [[1.5, 16, 10], [2.5, 25, 20], [4, 32, 25], [6, 40, 32], [10, 60, 50], [16, 80, 63], [25, 105, 80]], pick = T.filter(function (x) { return x[1] >= I * 1.25; })[0];
      return { big: ["工作电流", f(I, 1) + " A"], kv: [["推荐铜线", pick ? pick[0] + " mm²" : "大于 25 mm²，请咨询电工"], ["推荐空开", pick ? pick[2] + " A 及以上" : "—"]], note: "按 BV 铜芯线穿管敷设、留 25% 余量粗选。家装插座一般 2.5 mm²，空调、厨房、热水器 4 mm²，进户线 10 mm² 以上。" };
    } });

  add({ cat: "build", id: "solar-panel", name: "光伏发电收益计算器", desc: "装机容量、日照小时、电价，算年发电量和回本年限", kw: "光伏 太阳能 发电",
    fields: [{ k: "k", l: "装机容量", u: "kW", v: 10 }, { k: "h", l: "年均有效日照", u: "小时/天", v: 3.5 }, { k: "e", l: "系统效率", u: "%", v: 80 }, { k: "p", l: "电价 / 上网电价", u: "元/度", v: 0.4 }, { k: "c", l: "总投资", u: "元", v: 35000 }],
    run: function (v) { pos(v.k, v.h, v.e); need(v.p, v.c); var yr = v.k * v.h * 365 * v.e / 100, inc = yr * v.p; return { big: ["年发电量", f(yr, 0) + " 度"], kv: [["年收益", y(inc)], ["回本年限", inc > 0 ? f(v.c / inc, 1) + " 年" : "—"], ["25 年总收益", y(inc * 25 * 0.9)]], note: "25 年收益按组件衰减平均 10% 粗估。" }; } });

  add({ cat: "build", id: "water-heater-size", name: "热水器容量计算器", desc: "按家庭人数和洗浴习惯推荐电热水器升数", kw: "热水器 升",
    fields: [{ k: "n", l: "同时连续洗澡人数", u: "人", v: 3 }, { k: "m", l: "洗浴方式", t: "sel", o: [[50, "淋浴"], [150, "有浴缸"]], v: 50 }],
    run: function (v) { pos(v.n); var L0 = v.n * v.m * 0.75, opts = [40, 50, 60, 80, 100, 120, 150], pick = opts.filter(function (x) { return x >= L0; })[0] || Math.ceil(L0 / 10) * 10; return { big: ["推荐容量", pick + " L"], kv: [["估算需要", f(L0, 0) + " L"]], note: "按热水与冷水混合后约 1.3 倍出水量估算，每人淋浴约 50 L 温水。" }; } });

  add({ cat: "build", id: "putty", name: "腻子 / 防水涂料用量", desc: "按面积、厚度或遍数算腻子粉、防水涂料公斤数", kw: "腻子 防水 涂料",
    fields: [{ k: "t", l: "材料", t: "sel", o: ["腻子粉", "防水涂料"] }, { k: "a", l: "施工面积", u: "㎡", v: 60 }, { k: "n", l: "遍数", u: "遍", v: 2 }, { k: "r", l: "每遍每平方用量", u: "kg", v: 1, hint: "腻子粉约 1 kg/㎡/遍；JS 防水涂料约 1.5 kg/㎡（1 mm 厚）" }, { k: "b", l: "每包 / 桶重量", u: "kg", v: 20 }],
    run: function (v) { pos(v.a, v.n, v.r); var kg = v.a * v.n * v.r; return { big: ["需要" + v.t, f(kg, 1) + " kg"], kv: [["包 / 桶数", v.b > 0 ? Math.ceil(kg / v.b) + "" : "—"]], note: v.t === "防水涂料" ? "卫生间墙面防水建议上返 1.8 m 以上，地面与墙角加强处理。" : "" }; } });

  /* ======================= 科学工程 ======================= */
  add({ cat: "science", id: "ph", name: "pH 值计算器", desc: "氢离子浓度与 pH、pOH、OH⁻ 浓度互算（25℃）", kw: "ph 酸碱",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["pH", "[H⁺] mol/L", "[OH⁻] mol/L"] }, { k: "x", l: "数值", t: "text", v: "7" }],
    run: function (v) {
      var x = Number(v.x); if (!(x > 0) && !(v.m === "pH" && x === 0)) throw "请输入正数（可用 1e-5 这样的写法）"; var ph = v.m === "pH" ? x : v.m === "[H⁺] mol/L" ? -Math.log10(x) : 14 + Math.log10(x);
      return { big: ["pH", g(ph, 4)], tag: ph < 7 ? "酸性" : ph > 7 ? "碱性" : "中性", kv: [["pOH", g(14 - ph, 4)], ["[H⁺]", Math.pow(10, -ph).toExponential(3) + " mol/L"], ["[OH⁻]", Math.pow(10, ph - 14).toExponential(3) + " mol/L"]] };
    } });

  add({ cat: "science", id: "dilution", name: "溶液稀释计算器", desc: "C₁V₁ = C₂V₂，配制指定浓度需要多少原液和水", kw: "稀释 浓度 配比 消毒液",
    fields: [{ k: "c1", l: "原液浓度", u: "%", v: 75 }, { k: "c2", l: "目标浓度", u: "%", v: 5 }, { k: "v2", l: "目标体积", u: "ml", v: 1000 }],
    run: function (v) { pos(v.c1, v.c2, v.v2); if (v.c2 > v.c1) throw "目标浓度不能高于原液"; var v1 = v.c2 * v.v2 / v.c1; return { big: ["需要原液", f(v1, 1) + " ml"], kv: [["加水", f(v.v2 - v1, 1) + " ml"], ["稀释倍数", f(v.c1 / v.c2, 2) + " 倍"], ["原液 : 水", "1 : " + f((v.v2 - v1) / v1, 2)]] }; } });

  add({ cat: "science", id: "ideal-gas", name: "理想气体状态方程", desc: "PV = nRT，已知三项求第四项", kw: "pv nrt 气体",
    fields: [{ k: "t", l: "求", t: "sel", o: ["压强 P", "体积 V", "物质的量 n", "温度 T"] }, { k: "p", l: "压强 P", u: "kPa", v: 101.325 }, { k: "vv", l: "体积 V", u: "L", v: 22.4 }, { k: "n", l: "物质的量 n", u: "mol", v: 1 }, { k: "tt", l: "温度 T", u: "℃", v: 0 }],
    run: function (v) {
      var R = 8.314462618, P = v.p * 1000, V = v.vv / 1000, n = v.n, T = v.tt + 273.15, r;
      if (v.t === "压强 P") { pos(v.vv, n, T); r = ["压强", g(n * R * T / V / 1000, 6) + " kPa"]; }
      else if (v.t === "体积 V") { pos(v.p, n, T); r = ["体积", g(n * R * T / P * 1000, 6) + " L"]; }
      else if (v.t === "物质的量 n") { pos(v.p, v.vv, T); r = ["物质的量", g(P * V / R / T, 6) + " mol"]; }
      else { pos(v.p, v.vv, n); r = ["温度", g(P * V / n / R - 273.15, 6) + " ℃"]; }
      return { big: r, note: "R = 8.314 J/(mol·K)。所求那一项的输入会被忽略。" };
    } });

  add({ cat: "science", id: "led-resistor", name: "LED 限流电阻计算器", desc: "按电源电压、LED 压降和电流算限流电阻和功率", kw: "led 电阻 单片机",
    fields: [{ k: "vs", l: "电源电压", u: "V", v: 5 }, { k: "vf", l: "LED 正向压降", u: "V", v: 2, hint: "红 / 黄约 2V，绿 / 蓝 / 白约 3V" }, { k: "i", l: "工作电流", u: "mA", v: 10 }, { k: "n", l: "串联 LED 数", u: "个", v: 1 }],
    run: function (v) {
      pos(v.vs, v.vf, v.i); var n = v.n > 0 ? v.n : 1, ur = v.vs - v.vf * n; if (ur <= 0) throw "电源电压不足以点亮这么多 LED";
      var R = ur / (v.i / 1000), E = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82], dec = Math.pow(10, Math.floor(Math.log10(R))), std = E.map(function (e) { return e * dec / 10; }).concat([100 * dec / 10]).filter(function (x) { return x >= R; })[0];
      return { big: ["限流电阻", g(R, 4) + " Ω"], kv: [["推荐标准值（E12）", g(std, 4) + " Ω"], ["电阻功耗", g(ur * v.i / 1000 * 1000, 4) + " mW"], ["建议功率", ur * v.i / 1000 > .125 ? "1/2 W 以上" : "1/4 W"]] };
    } });

  var COLORS = ["黑", "棕", "红", "橙", "黄", "绿", "蓝", "紫", "灰", "白"], TOL = { "棕": "±1%", "红": "±2%", "绿": "±0.5%", "蓝": "±0.25%", "紫": "±0.1%", "金": "±5%", "银": "±10%" };
  add({ cat: "science", id: "resistor-color-code", name: "电阻色环计算器", desc: "四环 / 五环电阻按颜色读出阻值和误差", kw: "色环 电阻",
    fields: [{ k: "t", l: "色环数", t: "sel", o: ["四环", "五环"] }, { k: "a", l: "第 1 环", t: "sel", drop: true, o: COLORS, v: "棕" }, { k: "b", l: "第 2 环", t: "sel", drop: true, o: COLORS, v: "黑" },
      { k: "c", l: "第 3 环（五环为第三位数字）", t: "sel", drop: true, o: COLORS, v: "黑", show: function (v) { return v.t === "五环"; } },
      { k: "m", l: "倍率环", t: "sel", drop: true, o: COLORS.concat(["金", "银"]), v: "红" }, { k: "tol", l: "误差环", t: "sel", drop: true, o: Object.keys(TOL), v: "金" }],
    run: function (v) {
      var d = COLORS.indexOf(v.a) * 10 + COLORS.indexOf(v.b); if (v.t === "五环") d = d * 10 + COLORS.indexOf(v.c);
      var mul = v.m === "金" ? .1 : v.m === "银" ? .01 : Math.pow(10, COLORS.indexOf(v.m)), R = d * mul;
      var s = R >= 1e6 ? g(R / 1e6, 3) + " MΩ" : R >= 1e3 ? g(R / 1e3, 3) + " kΩ" : g(R, 3) + " Ω";
      return { big: ["阻值", s], kv: [["误差", TOL[v.tol]], ["精确值", g(R, 4) + " Ω"]] };
    } });

  add({ cat: "science", id: "wavelength-frequency", name: "波长 / 频率 / 光子能量", desc: "电磁波波长、频率、光子能量互算", kw: "波长 频率 光速",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["波长 nm", "频率 MHz"] }, { k: "x", l: "数值", v: 550 }],
    run: function (v) {
      pos(v.x); var c = 299792458, h = 6.62607015e-34, lam = v.m === "波长 nm" ? v.x * 1e-9 : c / (v.x * 1e6), fr = c / lam;
      return { kv: [["波长", lam >= 1 ? g(lam, 6) + " m" : g(lam * 1e9, 6) + " nm"], ["频率", fr >= 1e12 ? g(fr / 1e12, 6) + " THz" : g(fr / 1e6, 6) + " MHz"], ["光子能量", g(h * fr / 1.602176634e-19, 6) + " eV"]] };
    } });

  add({ cat: "science", id: "half-life", name: "半衰期计算器", desc: "按半衰期算经过一段时间后的剩余量", kw: "半衰期 衰变 药物代谢",
    fields: [{ k: "n", l: "初始量", v: 100 }, { k: "h", l: "半衰期", v: 5730 }, { k: "t", l: "经过时间（同单位）", v: 10000 }],
    run: function (v) { pos(v.n, v.h); need(v.t); var r = v.n * Math.pow(.5, v.t / v.h); return { big: ["剩余量", g(r, 6)], kv: [["剩余比例", pct(r / v.n, 4)], ["经过半衰期数", g(v.t / v.h, 4)], ["衰变常数 λ", g(Math.LN2 / v.h, 6)]] }; } });

  add({ cat: "science", id: "projectile", name: "抛体运动计算器", desc: "初速度和角度求射程、最大高度、飞行时间", kw: "平抛 斜抛 物理",
    fields: [{ k: "v", l: "初速度", u: "m/s", v: 20 }, { k: "a", l: "抛射角", u: "°", v: 45 }, { k: "h", l: "初始高度", u: "m", v: 0 }],
    run: function (v) {
      pos(v.v); need(v.a, v.h); var G = 9.8, r = v.a * Math.PI / 180, vx = v.v * Math.cos(r), vy = v.v * Math.sin(r), t = (vy + Math.sqrt(vy * vy + 2 * G * v.h)) / G;
      return { kv: [["飞行时间", g(t, 4) + " s"], ["水平射程", g(vx * t, 4) + " m"], ["最大高度", g(v.h + vy * vy / 2 / G, 4) + " m"], ["落地速度", g(Math.sqrt(vx * vx + Math.pow(vy - G * t, 2)), 4) + " m/s"]], note: "忽略空气阻力，g = 9.8 m/s²。" };
    } });

  add({ cat: "science", id: "specific-heat", name: "比热容 / 热量计算器", desc: "Q = cmΔt，加热一定质量的物质需要多少热量和电", kw: "比热容 热量 烧水",
    fields: [{ k: "c", l: "物质", t: "sel", drop: true, o: [[4186, "水"], [2100, "冰"], [900, "铝"], [460, "铁 / 钢"], [385, "铜"], [840, "玻璃"], [1005, "空气"], [2440, "酒精"]], v: 4186 }, { k: "m", l: "质量", u: "kg", v: 1 }, { k: "t1", l: "初始温度", u: "℃", v: 20 }, { k: "t2", l: "目标温度", u: "℃", v: 100 }, { k: "p", l: "加热功率（可选）", u: "W", v: 1800 }],
    run: function (v) {
      pos(v.m); need(v.t1, v.t2); var Q = v.c * v.m * (v.t2 - v.t1);
      return { big: ["所需热量", g(Q / 1000, 5) + " kJ"], kv: [["约合", g(Q / 4184, 5) + " kcal"], ["约合电量", g(Q / 3.6e6, 4) + " 度"], ["加热时间（不计损耗）", ok(v.p) && v.p > 0 ? f(Q / v.p / 60, 1) + " 分钟" : "—"]] };
    } });

  add({ cat: "science", id: "buoyancy", name: "浮力计算器", desc: "阿基米德原理 F = ρgV，判断物体沉浮", kw: "浮力 阿基米德",
    fields: [{ k: "r", l: "液体密度", u: "kg/m³", v: 1000 }, { k: "v", l: "排开液体体积", u: "m³", v: 0.002 }, { k: "m", l: "物体质量（判断沉浮）", u: "kg", v: 1.5 }],
    run: function (v) { pos(v.r, v.v); var F = v.r * 9.8 * v.v, W = ok(v.m) ? v.m * 9.8 : 0; return { big: ["浮力", g(F, 5) + " N"], tag: W ? (F > W ? "上浮" : F < W ? "下沉" : "悬浮") : null, kv: [["物体重力", W ? g(W, 5) + " N" : "—"]] }; } });

  add({ cat: "science", id: "molar-mass", name: "摩尔质量计算器", desc: "输入化学式（如 H2SO4、Ca(OH)2）算摩尔质量", kw: "摩尔质量 分子量 化学式",
    fields: [{ k: "s", l: "化学式", t: "text", v: "CuSO4·5H2O" }, { k: "g", l: "质量（可选，求物质的量）", u: "g", v: 10 }],
    run: function (v) {
      var M = { H: 1.008, He: 4.003, Li: 6.94, Be: 9.012, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.18, Na: 22.99, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.948, K: 39.098, Ca: 40.078, Ti: 47.867, Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38, Br: 79.904, Ag: 107.87, Sn: 118.71, I: 126.9, Ba: 137.33, Pt: 195.08, Au: 196.97, Hg: 200.59, Pb: 207.2, U: 238.03 };
      function parse(s) {
        var i = 0;
        function num() { var m = s.slice(i).match(/^\d+/); if (m) { i += m[0].length; return +m[0]; } return 1; }
        function group() { var tot = 0; while (i < s.length && s[i] !== ")") { if (s[i] === "(") { i++; var x = group(); if (s[i] !== ")") throw "括号不匹配"; i++; tot += x * num(); } else { var m = s.slice(i).match(/^[A-Z][a-z]?/); if (!m) throw "无法识别：" + s.slice(i, i + 3); if (!M[m[0]]) throw "暂不支持元素 " + m[0]; i += m[0].length; tot += M[m[0]] * num(); } } return tot; }
        var r = group(); if (i < s.length) throw "括号不匹配"; return r;
      }
      var parts = String(v.s).replace(/\s/g, "").split(/[·.*]/).filter(Boolean); if (!parts.length) throw "请输入化学式";
      var mm = parts.reduce(function (t, p) { var k = p.match(/^(\d+)(.*)$/); return t + (k ? +k[1] * parse(k[2]) : parse(p)); }, 0);
      return { big: ["摩尔质量", g(mm, 4) + " g/mol"], kv: [["物质的量", ok(v.g) && v.g > 0 ? g(v.g / mm, 6) + " mol" : "—"]] };
    } });
})();
