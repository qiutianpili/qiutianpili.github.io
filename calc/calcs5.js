/* Calculator registry, batch 5 (2026-10). Uses helpers exported by calcs.js / calcs2.js. */
(function () {
  "use strict";
  var H = window.CX.h, add = H.add, ok = H.ok, need = H.need, pos = H.pos, f = H.f, g = H.g, y = H.y, wy = H.wy, pct = H.pct,
    D = H.D, iso = H.iso, WK = H.WK, dayDiff = H.dayDiff, addMonths = H.addMonths, pmt = H.pmt, unit = H.unit;
  function nums(s) { var a = String(s).split(/[\s,，;；]+/).filter(Boolean).map(Number); if (!a.length || a.some(isNaN)) throw "请输入数字，用逗号或空格分隔"; return a; }
  function today() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
  function todayS() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  function plus(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function day(d) { return iso(d) + " " + WK[d.getDay()]; }
  var MT = [[3000, .03, 0], [12000, .1, 210], [25000, .2, 1410], [35000, .25, 2660], [55000, .3, 4410], [80000, .35, 7160], [Infinity, .45, 15160]];
  var AT = [[36000, .03, 0], [144000, .1, 2520], [300000, .2, 16920], [420000, .25, 31920], [660000, .3, 52920], [960000, .35, 85920], [Infinity, .45, 181920]];
  function annTax(x) { if (x <= 0) return 0; for (var i = 0; i < AT.length; i++) if (x <= AT[i][0]) return x * AT[i][1] - AT[i][2]; }

  /* ======================= 财务理财 ======================= */
  add({ cat: "finance", id: "year-end-bonus", name: "年终奖个税计算器", desc: "年终奖单独计税和并入综合所得哪个更省", kw: "年终奖 个税 单独计税",
    fields: [{ k: "b", l: "年终奖", u: "元", v: 50000 }, { k: "s", l: "全年工资应纳税所得额", u: "元", v: 100000, hint: "全年工资 − 6 万起征 − 社保公积金 − 专项附加扣除" }],
    run: function (v) {
      need(v.b, v.s); if (v.b < 0) throw "年终奖不能为负"; var r = MT.filter(function (t) { return v.b / 12 <= t[0]; })[0], sep = Math.max(v.b * r[1] - r[2], 0) + annTax(v.s), mer = annTax(v.s + v.b);
      var cliff = [36000, 144000, 300000, 420000, 660000, 960000].filter(function (c) { return v.b > c && v.b < c * 1.15; })[0];
      return { big: [sep <= mer ? "单独计税更省" : "并入综合所得更省", y(Math.abs(sep - mer))], kv: [["单独计税总税额", y(sep)], ["  其中年终奖税额", y(Math.max(v.b * r[1] - r[2], 0)) + "（" + r[1] * 100 + "%）"], ["并入综合所得总税额", y(mer)]], note: (cliff ? "年终奖刚超过 " + f(cliff, 0) + " 元，落在“多发少得”区间，少发到 " + f(cliff, 0) + " 元反而到手更多。" : "") + "单独计税政策执行至 2027 年 12 月 31 日，在个税 App 年度汇算时可以选择。" };
    } });

  add({ cat: "finance", id: "net-to-gross", name: "税后倒推税前工资", desc: "想要到手多少，反推税前月薪", kw: "税后 税前 倒推 到手",
    fields: [{ k: "n", l: "期望税后月薪", u: "元", v: 15000 }, { k: "r", l: "个人社保公积金比例", u: "%", v: 22.5, hint: "养老 8% + 医疗 2% + 失业 0.5% + 公积金 12%" }, { k: "cap", l: "社保公积金基数上限", u: "元", v: 35000 }, { k: "d", l: "每月专项附加扣除", u: "元", v: 0 }],
    run: function (v) {
      pos(v.n); need(v.r, v.cap, v.d); function net(gs) { var ss = Math.min(gs, v.cap) * v.r / 100; return gs - ss - annTax((gs - ss - 5000 - v.d) * 12) / 12; }
      var lo = v.n, hi = v.n * 3; for (var i = 0; i < 80; i++) { var m = (lo + hi) / 2; if (net(m) < v.n) lo = m; else hi = m; }
      var gs = hi, ss = Math.min(gs, v.cap) * v.r / 100;
      return { big: ["税前月薪约", y(gs)], kv: [["社保公积金", y(ss)], ["月均个税", y(gs - ss - v.n)], ["税前年薪", wy(gs * 12)]], note: "按全年平均计算个税；实际按累计预扣，年初少扣、年底多扣。" };
    } });

  add({ cat: "finance", id: "exchange-rate", name: "汇率换算（自填汇率）", desc: "按银行牌价和手续费换算人民币与外币", kw: "汇率 换汇 美元 日元",
    fields: [{ k: "a", l: "金额", v: 1000 }, { k: "d", l: "方向", t: "sel", o: ["人民币 → 外币", "外币 → 人民币"] }, { k: "r", l: "1 外币 = 多少人民币", v: 7.1, hint: "以银行当日现汇或现钞牌价为准" }, { k: "fee", l: "手续费", u: "%", v: 0 }],
    run: function (v) { pos(v.a, v.r); need(v.fee); var k = 1 - v.fee / 100, out = v.d[0] === "人" ? v.a / v.r * k : v.a * v.r * k; return { big: ["可得", g(out, 4) + (v.d[0] === "人" ? " 外币" : " 元")], kv: [["手续费", g(v.a * v.fee / 100, 4) + (v.d[0] === "人" ? " 元" : " 外币")], ["反向汇率", "1 元 = " + g(1 / v.r, 6) + " 外币"]], note: "个人每年便利化结售汇额度为等值 5 万美元。" }; } });

  add({ cat: "finance", id: "card-free-period", name: "信用卡免息期计算器", desc: "按账单日和还款日算某天刷卡能免息多少天", kw: "信用卡 免息期 账单日 还款日",
    fields: [{ k: "b", l: "账单日（每月几号）", v: 5 }, { k: "g", l: "账单日后几天到期还款", u: "天", v: 20 }, { k: "d", l: "刷卡日期", t: "date", v: "today" }],
    run: function (v) {
      if (!Number.isInteger(v.b) || v.b < 1 || v.b > 28) throw "账单日 1–28"; pos(v.g); var p = D(v.d), bill = new Date(p.getFullYear(), p.getMonth(), v.b); if (p > bill) bill = new Date(p.getFullYear(), p.getMonth() + 1, v.b);
      var due = plus(bill, v.g);
      return { big: ["免息", dayDiff(p, due) + " 天"], kv: [["记入账单", day(bill)], ["最后还款日", day(due)], ["最长免息期", (v.g + 30) + " 天左右（账单日次日刷卡）"]], note: "部分银行账单日当天消费记入下期，以发卡行规则为准。" };
    } });

  add({ cat: "finance", id: "insurance-need", name: "保险保额测算", desc: "按“双十原则”算寿险、重疾险保额和保费预算", kw: "保险 保额 双十原则 寿险 重疾",
    fields: [{ k: "i", l: "家庭税后年收入", u: "万元", v: 30 }, { k: "e", l: "家庭年支出", u: "万元", v: 15 }, { k: "l", l: "房贷等负债", u: "万元", v: 100 }, { k: "k", l: "子女教育预留", u: "万元", v: 50 }, { k: "s", l: "已有存款理财", u: "万元", v: 20 }],
    run: function (v) {
      pos(v.i); need(v.e, v.l, v.k, v.s); var life = Math.max(v.e * 10 + v.l + v.k - v.s, 0);
      return { big: ["家庭支柱寿险保额", f(life, 0) + " 万元"], kv: [["按收入 10 倍", f(v.i * 10, 0) + " 万元"], ["重疾险保额", f(v.i * 3, 0) + " – " + f(v.i * 5, 0) + " 万元"], ["年保费预算上限", f(v.i * 1e4 * .1, 0) + " 元"]], note: "双十原则：保额约为年收入 10 倍，保费不超过年收入 10%。重疾险覆盖 3–5 年收入损失。" };
    } });

  add({ cat: "finance", id: "money-fund", name: "货币基金 / 余额宝收益", desc: "按七日年化或万份收益算每天、每月能赚多少", kw: "余额宝 货币基金 七日年化 万份收益",
    fields: [{ k: "p", l: "本金", u: "元", v: 50000 }, { k: "r", l: "七日年化", u: "%", v: 1.2 }, { k: "d", l: "持有天数", u: "天", v: 30 }],
    run: function (v) { pos(v.p, v.r); need(v.d); var dr = v.r / 100 / 365; return { big: ["收益约", y(v.p * (Math.pow(1 + dr, v.d) - 1))], kv: [["每天约", y(v.p * dr)], ["万份收益", f(dr * 1e4, 4) + " 元"], ["一年约", y(v.p * (Math.pow(1 + dr, 365) - 1))]] }; } });

  /* ======================= 房产置业 ======================= */
  add({ cat: "property", id: "switch-to-hpf", name: "商贷转公积金能省多少", desc: "剩余商贷转成公积金贷款后月供和利息的变化", kw: "商转公 公积金 转贷",
    fields: [{ k: "b", l: "剩余本金", u: "万元", v: 80 }, { k: "n", l: "剩余年限", u: "年", v: 25 }, { k: "r1", l: "商贷利率", u: "%", v: 3.1 }, { k: "r2", l: "公积金利率", u: "%", v: 2.6, hint: "首套 5 年以上 2.6%（2025 年 5 月起）" }],
    run: function (v) { pos(v.b, v.n); need(v.r1, v.r2); var P = v.b * 1e4, N = v.n * 12, a = pmt(P, v.r1 / 1200, N), b = pmt(P, v.r2 / 1200, N); return { big: ["总共省", wy((a - b) * N)], kv: [["月供（商贷）", y(a)], ["月供（公积金）", y(b)], ["每月少还", y(a - b)]], note: "商转公一般需先筹资结清商贷，过桥费、担保费等要算进去；多数城市要求公积金额度足够覆盖剩余本金。" }; } });

  add({ cat: "property", id: "old-house-loan-term", name: "二手房最长贷款年限", desc: "按房龄和借款人年龄算最长能贷几年", kw: "二手房 房龄 贷款年限",
    fields: [{ k: "b", l: "房屋建成年份", v: 2005 }, { k: "a", l: "主贷人年龄", u: "岁", v: 35 }, { k: "h", l: "银行房龄规则", t: "sel", o: [[50, "房龄 + 贷款年限 ≤ 50"], [40, "房龄 + 贷款年限 ≤ 40"]], v: 50 }, { k: "m", l: "年龄规则", t: "sel", o: [[70, "年龄 + 贷款年限 ≤ 70"], [65, "年龄 + 贷款年限 ≤ 65"]], v: 70 }],
    run: function (v) {
      need(v.b, v.a); var age = today().getFullYear() - v.b, byH = v.h - age, byA = v.m - v.a, n = Math.min(30, byH, byA);
      return { big: ["最长可贷", n > 0 ? n + " 年" : "可能无法贷款"], kv: [["房龄", age + " 年"], ["受房龄限制", byH + " 年"], ["受年龄限制", byA + " 年"], ["政策上限", "30 年"]], note: "不同银行规则不同，房龄超过 30 年的房子较难贷款。" };
    } });

  add({ cat: "property", id: "leverage-return", name: "买房杠杆收益计算器", desc: "按首付、利率和房价涨跌算持有几年后的自有资金回报", kw: "杠杆 房价 投资回报",
    fields: [{ k: "p", l: "房价", u: "万元", v: 300 }, { k: "d", l: "首付比例", u: "%", v: 30 }, { k: "r", l: "贷款利率", u: "%", v: 3.1 }, { k: "t", l: "贷款年限", u: "年", v: 30 }, { k: "n", l: "持有年数", u: "年", v: 5 }, { k: "g", l: "房价年涨跌", u: "%", v: 0 }, { k: "rent", l: "月租金（自住填 0）", u: "元", v: 0 }],
    run: function (v) {
      pos(v.p, v.d, v.t, v.n); need(v.r, v.g, v.rent); var P = v.p * 1e4, L = P * (1 - v.d / 100), r = v.r / 1200, N = v.t * 12, m = pmt(L, r, N), k = Math.min(v.n * 12, N);
      var bal = r ? L * Math.pow(1 + r, k) - m * (Math.pow(1 + r, k) - 1) / r : L - m * k, sale = P * Math.pow(1 + v.g / 100, v.n), inv = P * v.d / 100 + m * k - v.rent * k, gain = sale - bal - inv;
      return { big: [gain >= 0 ? "盈利" : "亏损", wy(Math.abs(gain))], kv: [["自有资金回报率", pct(gain / (P * v.d / 100 + m * k))], ["卖出价", wy(sale)], ["剩余贷款", wy(bal)], ["已付月供", wy(m * k)]], note: "未计交易税费、装修和持有成本。" };
    } });

  add({ cat: "property", id: "rent-increase", name: "房租涨幅计算器", desc: "按每年涨租比例算未来几年的房租和总支出", kw: "涨租 房租 租金上涨",
    fields: [{ k: "r", l: "当前月租", u: "元", v: 4000 }, { k: "p", l: "每年涨幅", u: "%", v: 5 }, { k: "n", l: "年数", u: "年", v: 5 }],
    run: function (v) { pos(v.r, v.n); need(v.p); if (v.n > 50) throw "最多 50 年"; var rows = [], tot = 0; for (var i = 0; i < v.n; i++) { var m = v.r * Math.pow(1 + v.p / 100, i); tot += m * 12; rows.push(["第 " + (i + 1) + " 年", f(m, 0), f(tot, 0)]); } return { big: [v.n + " 年房租合计", wy(tot)], table: { h: ["年度", "月租（元）", "累计（元）"], r: rows } }; } });

  add({ cat: "property", id: "land-use-years", name: "土地产权剩余年限", desc: "按土地出让年份和用途算产权到期时间", kw: "产权 70年 40年 土地使用年限",
    fields: [{ k: "y", l: "土地出让年份", v: 2005 }, { k: "t", l: "用途", t: "sel", o: [[70, "住宅（70 年）"], [50, "综合 / 工业（50 年）"], [40, "商业 / 公寓（40 年）"]], v: 70 }],
    run: function (v) { need(v.y); var end = v.y + v.t, left = end - today().getFullYear(); return { big: ["剩余", Math.max(left, 0) + " 年"], kv: [["到期年份", end], ["已用", pct(Math.min((v.t - left) / v.t, 1), 0)]], note: v.t === 70 ? "《民法典》规定住宅建设用地使用权期限届满自动续期。" : "非住宅用地到期续期需申请，商业公寓贷款年限通常最长 10 年。" }; } });

  /* ======================= 汽车出行 ======================= */
  add({ cat: "auto", id: "highway-toll", name: "高速过路费估算", desc: "按里程和车型估算高速通行费，节假日小客车免费", kw: "高速费 过路费 通行费 etc",
    fields: [{ k: "d", l: "高速里程", u: "km", v: 300 }, { k: "r", l: "车型", t: "sel", o: [[0.45, "一类客车（7 座及以下）"], [0.9, "二类客车（8–19 座）"], [0.6, "一类货车（2 轴，≤4.5 吨）"], [1.2, "三类货车（3 轴）"]], v: 0.45 }, { k: "e", l: "ETC 优惠", u: "%", v: 5 }, { k: "h", l: "是否免费节假日", t: "sel", o: ["否", "是（春节、清明、五一、国庆）"] }],
    run: function (v) { pos(v.d); need(v.e); if (v.h !== "否" && v.r === 0.45) return { big: ["通行费", "0 元"], note: "重大节假日 7 座及以下小客车免费通行，从免费时段内驶入收费站开始计算。" }; var t = v.d * v.r; return { big: ["约", y(t * (1 - v.e / 100))], kv: [["不含 ETC 优惠", y(t)]], note: "各省收费标准不同（小客车约 0.35–0.6 元/km），桥隧另计，仅作估算。" }; } });

  add({ cat: "auto", id: "ev-peak-valley", name: "电车峰谷充电电费", desc: "家用充电桩峰谷电价下每月充电花多少", kw: "峰谷电价 充电 电车 谷电",
    fields: [{ k: "k", l: "每月充电量", u: "kWh", v: 300 }, { k: "p", l: "峰时电价", u: "元/kWh", v: 0.62 }, { k: "v", l: "谷时电价", u: "元/kWh", v: 0.32 }, { k: "s", l: "谷时充电占比", u: "%", v: 80 }, { k: "c", l: "公共快充单价（对比）", u: "元/kWh", v: 1.5 }],
    run: function (v) { need(v.k, v.p, v.v, v.s, v.c); var cost = v.k * (v.v * v.s / 100 + v.p * (1 - v.s / 100)); return { big: ["每月电费", y(cost)], kv: [["均价", f(v.k ? cost / v.k : 0, 3) + " 元/kWh"], ["比公共快充省", y(v.k * v.c - cost)], ["全部谷时充", y(v.k * v.v)]], note: "谷时一般为 22:00 – 次日 8:00，各地时段不同，可在充电桩 App 里设预约充电。" }; } });

  add({ cat: "auto", id: "accel-0-100", name: "百公里加速换算", desc: "按 0–100 km/h 加速时间算平均加速度、G 值和加速距离", kw: "百公里加速 零百 加速度",
    fields: [{ k: "t", l: "0–100 km/h 用时", u: "秒", v: 6.5 }],
    run: function (v) { pos(v.t); var a = 100 / 3.6 / v.t; return { big: ["平均加速度", f(a, 2) + " m/s²"], kv: [["约", f(a / 9.80665, 2) + " G"], ["加速距离约", f(.5 * a * v.t * v.t, 0) + " m"], ["级别", v.t < 4 ? "超跑级" : v.t < 6 ? "性能车" : v.t < 9 ? "较快" : v.t < 12 ? "普通家用" : "偏慢"]] }; } });

  add({ cat: "auto", id: "safe-following", name: "安全车距计算器", desc: "按车速算 2 秒、3 秒车距和高速法定车距", kw: "车距 跟车距离 安全距离",
    fields: [{ k: "s", l: "车速", u: "km/h", v: 110 }, { k: "w", l: "路况", t: "sel", o: [[1, "干燥路面"], [2, "雨天"], [3, "雪天 / 结冰"]], v: 1 }],
    run: function (v) { pos(v.s); var ms = v.s / 3.6, law = v.s > 100 ? "100 m 以上" : "不少于 50 m"; return { big: ["建议车距", f(ms * 3 * v.w, 0) + " m 以上"], kv: [["2 秒车距", f(ms * 2 * v.w, 0) + " m"], ["高速法定车距", law], ["每秒行驶", f(ms, 1) + " m"]], note: "高速公路上车速超过 100 km/h 时与同车道前车保持 100 米以上；雨雪雾天按路况加大车距。" }; } });

  add({ cat: "auto", id: "engine-displacement", name: "发动机排量计算器", desc: "按缸径、行程和缸数算排量", kw: "排量 缸径 行程",
    fields: [{ k: "b", l: "缸径", u: "mm", v: 82.5 }, { k: "s", l: "行程", u: "mm", v: 92.8 }, { k: "n", l: "气缸数", v: 4 }],
    run: function (v) { pos(v.b, v.s, v.n); var cc = Math.PI / 4 * Math.pow(v.b / 10, 2) * (v.s / 10) * v.n; return { big: ["排量", f(cc, 0) + " cc"], kv: [["升", f(cc / 1000, 2) + " L"], ["单缸排量", f(cc / v.n, 0) + " cc"], ["行程缸径比", f(v.s / v.b, 3) + (v.s > v.b ? "（长行程）" : "（短行程）")]] }; } });

  add({ cat: "auto", id: "oil-price-adjust", name: "油价调整影响计算器", desc: "按发改委每吨调价算每升和加满一箱多花或少花多少", kw: "油价 调价 每吨",
    fields: [{ k: "t", l: "每吨调整", u: "元", v: 100, hint: "上调填正数，下调填负数" }, { k: "o", l: "油品", t: "sel", o: [[1351, "92 号汽油"], [1351, "95 号汽油"], [1176, "0 号柴油"]], v: 1351 }, { k: "l", l: "油箱", u: "L", v: 50 }],
    run: function (v) { need(v.t); pos(v.l); var pl = v.t / v.o; return { big: ["每升", (pl >= 0 ? "+" : "") + f(pl, 2) + " 元"], kv: [["加满一箱", (pl >= 0 ? "多花 " : "少花 ") + y(Math.abs(pl * v.l))]], note: "1 吨 92 号汽油约 1351 升，0 号柴油约 1176 升。" }; } });

  /* ======================= 健康健身 ======================= */
  add({ cat: "health", id: "fever", name: "体温 / 发烧程度", desc: "摄氏与华氏互换，判断低热、中热、高热", kw: "发烧 体温 华氏 低烧",
    fields: [{ k: "t", l: "体温", v: 38.5 }, { k: "u", l: "单位", t: "sel", o: ["°C", "°F"] }, { k: "p", l: "测量部位", t: "sel", o: [[0, "腋下"], [0.3, "口腔"], [0.5, "耳温 / 肛温"]], v: 0 }],
    run: function (v) {
      need(v.t); var c = v.u === "°F" ? (v.t - 32) * 5 / 9 : v.t, ax = c - v.p, lv = ax < 35 ? "体温过低" : ax < 37.3 ? "正常" : ax <= 38 ? "低热" : ax <= 39 ? "中度发热" : ax <= 41 ? "高热" : "超高热";
      return { big: [lv, f(c, 1) + " °C · " + f(c * 9 / 5 + 32, 1) + " °F"], note: "按腋温分级。高热、持续 3 天以上发热、婴儿发热或伴随抽搐等请及时就医。" };
    } });

  add({ cat: "health", id: "pregnancy-weight", name: "孕期增重计算器", desc: "按孕前 BMI 算整个孕期和当前孕周的合理增重", kw: "孕期 增重 体重 孕妇",
    fields: [{ k: "h", l: "身高", u: "cm", v: 162 }, { k: "w", l: "孕前体重", u: "kg", v: 52 }, { k: "wk", l: "当前孕周", u: "周", v: 20 }],
    run: function (v) {
      pos(v.h, v.w); need(v.wk); var b = v.w / Math.pow(v.h / 100, 2), R = b < 18.5 ? [11, 16, .46, "偏瘦"] : b < 24 ? [8, 14, .37, "正常"] : b < 28 ? [7, 11, .3, "超重"] : [5, 9, .22, "肥胖"];
      var wk = Math.min(Math.max(v.wk, 0), 42), now = wk <= 13 ? [0, 2] : [0 + (wk - 13) * R[2] * .8, 2 + (wk - 13) * R[2] * 1.2];
      return { big: ["全孕期建议增重", R[0] + " – " + R[1] + " kg"], kv: [["孕前 BMI", f(b, 1) + "（" + R[3] + "）"], ["孕 " + wk + " 周时约增", f(now[0], 1) + " – " + f(now[1], 1) + " kg"], ["孕中晚期每周", f(R[2], 2) + " kg 左右"]], note: "依据《妊娠期妇女体重增长推荐值标准》（WS/T 801—2022），单胎。孕早期增重 0–2 kg。" };
    } });

  add({ cat: "health", id: "baby-milk", name: "婴儿奶量计算器", desc: "按宝宝体重和月龄算每天奶量和每顿奶量", kw: "奶量 婴儿 喂奶 奶粉",
    fields: [{ k: "w", l: "宝宝体重", u: "kg", v: 6 }, { k: "m", l: "月龄", u: "月", v: 3 }],
    run: function (v) {
      pos(v.w); need(v.m); var per = v.m < 6 ? 150 : 120, tot = Math.min(v.w * per, v.m < 6 ? 1000 : 900), n = v.m < 1 ? 8 : v.m < 3 ? 7 : v.m < 6 ? 6 : 5;
      return { big: ["每天奶量约", f(tot, 0) + " ml"], kv: [["每天喂", n + " 次左右"], ["每顿约", f(tot / n, 0) + " ml"]], note: "配方奶参考值，每天一般不超过 1000 ml。6 月龄起添加辅食。宝宝吃饱、体重稳步增长即可，不必严格按数字。" };
    } });

  add({ cat: "health", id: "vision-convert", name: "视力记录换算", desc: "小数视力（1.0）与五分记录（5.0）互换", kw: "视力 5.0 1.0 视力表",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["小数视力", "五分记录"] }, { k: "x", l: "数值", v: 0.6 }],
    run: function (v) {
      pos(v.x); var dec = v.m === "小数视力" ? v.x : Math.pow(10, v.x - 5), L = 5 + Math.log10(dec);
      return { big: ["五分记录 " + f(L, 1), "小数视力 " + g(dec, 2)], tag: L >= 5 ? "正常" : L >= 4.9 ? "轻度视力不良" : L >= 4.6 ? "中度视力不良" : "重度视力不良", note: "视力不良不等于近视度数，需验光确认。" };
    } });

  add({ cat: "health", id: "whtr", name: "腰围身高比", desc: "腰围 ÷ 身高，评估腹型肥胖风险", kw: "腰围 腰高比 腹型肥胖",
    fields: [{ k: "w", l: "腰围", u: "cm", v: 80 }, { k: "h", l: "身高", u: "cm", v: 170 }],
    run: function (v) { pos(v.w, v.h); var r = v.w / v.h; return { big: ["腰围身高比", f(r, 2)], tag: r < .4 ? "偏瘦" : r < .5 ? "健康" : r < .6 ? "风险增加" : "高风险", kv: [["健康腰围上限", f(v.h * .5, 0) + " cm"]], note: "简单规则：腰围不超过身高的一半。" }; } });

  add({ cat: "health", id: "hcg-doubling", name: "HCG 翻倍计算器", desc: "两次抽血 HCG 值算翻倍时间", kw: "hcg 翻倍 孕酮 早孕",
    fields: [{ k: "a", l: "第一次 HCG", u: "mIU/ml", v: 500 }, { k: "t1", l: "第一次抽血时间", t: "dt", v: "2026-10-01T09:00" }, { k: "b", l: "第二次 HCG", u: "mIU/ml", v: 1200 }, { k: "t2", l: "第二次抽血时间", t: "dt", v: "2026-10-03T09:00" }],
    run: function (v) {
      pos(v.a, v.b); var h = (new Date(v.t2) - new Date(v.t1)) / 36e5; if (!(h > 0)) throw "第二次时间需晚于第一次"; if (v.b <= v.a) return { big: ["未上升", "第二次未高于第一次"], note: "请及时咨询医生。" };
      var dt = h * Math.LN2 / Math.log(v.b / v.a);
      return { big: ["翻倍时间", f(dt, 1) + " 小时"], tag: dt <= 72 ? "在常见范围内" : "偏慢，建议咨询医生", kv: [["间隔", f(h, 0) + " 小时"], ["增长", pct(v.b / v.a - 1, 0)]], note: "孕早期 HCG 一般 48–72 小时翻倍，HCG 超过 6000 后翻倍会变慢。结果仅供参考，以医生判断为准。" };
    } });

  /* ======================= 数学计算 ======================= */
  add({ cat: "math", id: "sci-notation", name: "科学计数法转换", desc: "普通数字与科学计数法、工程计数法互换", kw: "科学计数法 e 指数",
    fields: [{ k: "s", l: "数字（可写 1.2e-5 或 3.5×10^8）", t: "text", v: "0.000123456" }, { k: "d", l: "有效数字", v: 4 }],
    run: function (v) {
      var s = String(v.s).replace(/\s|,/g, "").replace(/[×x\*]10\^/i, "e"), x = Number(s); if (!isFinite(x) || s === "") throw "无法识别的数字"; var d = Math.min(Math.max(Math.round(v.d) || 4, 1), 15);
      if (x === 0) return { big: ["科学计数法", "0"] }; var e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e), ee = Math.floor(e / 3) * 3;
      return { big: ["科学计数法", Number(m.toPrecision(d)) + " × 10^" + e], kv: [["e 记法", x.toExponential(d - 1)], ["工程计数法", Number((x / Math.pow(10, ee)).toPrecision(d)) + " × 10^" + ee], ["普通写法", Math.abs(e) < 21 ? Number(x.toPrecision(d)).toLocaleString("en-US", { maximumFractionDigits: 20 }) : "—"]] };
    } });

  add({ cat: "math", id: "polar-cart", name: "极坐标 / 直角坐标转换", desc: "(x, y) 与 (r, θ) 互换", kw: "极坐标 直角坐标",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["直角坐标 (x, y)", "极坐标 (r, θ°)"] }, { k: "a", l: "x 或 r", v: 3 }, { k: "b", l: "y 或 θ（度）", v: 4 }],
    run: function (v) { need(v.a, v.b); if (v.m[0] === "直") return { kv: [["r", g(Math.hypot(v.a, v.b), 10)], ["θ（度）", g(Math.atan2(v.b, v.a) * 180 / Math.PI, 8)], ["θ（弧度）", g(Math.atan2(v.b, v.a), 10)]] }; var t = v.b * Math.PI / 180; return { kv: [["x", g(v.a * Math.cos(t), 10)], ["y", g(v.a * Math.sin(t), 10)]] }; } });

  add({ cat: "math", id: "regular-polygon", name: "正多边形计算器", desc: "按边数和边长算面积、周长、内角、外接圆和内切圆半径", kw: "正多边形 正六边形 内角",
    fields: [{ k: "n", l: "边数", v: 6 }, { k: "a", l: "边长", v: 10 }],
    run: function (v) { if (!Number.isInteger(v.n) || v.n < 3) throw "边数为 ≥3 的整数"; pos(v.a); var t = Math.PI / v.n; return { big: ["面积", g(v.n * v.a * v.a / (4 * Math.tan(t)), 8)], kv: [["周长", g(v.n * v.a, 8)], ["内角", g((v.n - 2) * 180 / v.n, 8) + "°"], ["内角和", (v.n - 2) * 180 + "°"], ["外接圆半径", g(v.a / (2 * Math.sin(t)), 8)], ["内切圆半径", g(v.a / (2 * Math.tan(t)), 8)], ["对角线条数", v.n * (v.n - 3) / 2]] }; } });

  add({ cat: "math", id: "ellipse", name: "椭圆计算器", desc: "按长短半轴算面积、周长、离心率和焦距", kw: "椭圆 周长 离心率 焦点",
    fields: [{ k: "a", l: "长半轴 a", v: 5 }, { k: "b", l: "短半轴 b", v: 3 }],
    run: function (v) { pos(v.a, v.b); var a = Math.max(v.a, v.b), b = Math.min(v.a, v.b), h = Math.pow((a - b) / (a + b), 2), c = Math.sqrt(a * a - b * b); return { big: ["面积", g(Math.PI * a * b, 10)], kv: [["周长（拉马努金近似）", g(Math.PI * (a + b) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h))), 10)], ["离心率 e", g(c / a, 8)], ["焦距 2c", g(2 * c, 8)], ["标准方程", "x²/" + g(a * a, 6) + " + y²/" + g(b * b, 6) + " = 1"]] }; } });

  add({ cat: "math", id: "sector", name: "扇形 / 弓形计算器", desc: "按半径和圆心角算弧长、扇形面积、弦长和弓形面积", kw: "扇形 弧长 弓形 弦长",
    fields: [{ k: "r", l: "半径", v: 10 }, { k: "t", l: "圆心角", u: "°", v: 60 }],
    run: function (v) { pos(v.r, v.t); if (v.t > 360) throw "角度不超过 360°"; var t = v.t * Math.PI / 180, S = v.r * v.r * t / 2, seg = S - v.r * v.r * Math.sin(t) / 2; return { big: ["扇形面积", g(S, 8)], kv: [["弧长", g(v.r * t, 8)], ["弦长", g(2 * v.r * Math.sin(t / 2), 8)], ["弓形面积", g(seg, 8)], ["弓形高", g(v.r * (1 - Math.cos(t / 2)), 8)]] }; } });

  add({ cat: "math", id: "quadrilateral", name: "四边形面积计算器", desc: "梯形、平行四边形、菱形、矩形面积和周长", kw: "梯形 平行四边形 菱形 面积",
    fields: [{ k: "s", l: "形状", t: "sel", o: ["梯形", "平行四边形", "菱形", "矩形"] },
      { k: "a", l: "上底 / 底 / 对角线 1 / 长", v: 6 }, { k: "b", l: "下底 / 斜边 / 对角线 2 / 宽", v: 10 }, { k: "h", l: "高", v: 4, show: function (v) { return v.s === "梯形" || v.s === "平行四边形"; } }],
    run: function (v) {
      pos(v.a, v.b); if (v.s === "梯形") { pos(v.h); return { big: ["面积", g((v.a + v.b) * v.h / 2, 8)], kv: [["中位线", g((v.a + v.b) / 2, 8)], ["等腰时腰长", g(Math.hypot((v.b - v.a) / 2, v.h), 8)]] }; }
      if (v.s === "平行四边形") { pos(v.h); return { big: ["面积", g(v.a * v.h, 8)], kv: [["周长", g(2 * (v.a + v.b), 8)]] }; }
      if (v.s === "菱形") return { big: ["面积", g(v.a * v.b / 2, 8)], kv: [["边长", g(Math.hypot(v.a / 2, v.b / 2), 8)], ["周长", g(4 * Math.hypot(v.a / 2, v.b / 2), 8)]] };
      return { big: ["面积", g(v.a * v.b, 8)], kv: [["周长", g(2 * (v.a + v.b), 8)], ["对角线", g(Math.hypot(v.a, v.b), 8)]] };
    } });

  add({ cat: "math", id: "prob-at-least-once", name: "至少发生一次的概率", desc: "单次概率 p，重复 n 次至少成功一次的概率；要多少次才有把握", kw: "概率 至少一次 抽卡 中奖",
    fields: [{ k: "p", l: "单次概率", u: "%", v: 2 }, { k: "n", l: "尝试次数", v: 50 }, { k: "t", l: "目标把握", u: "%", v: 90 }],
    run: function (v) { pos(v.p, v.n); need(v.t); if (v.p > 100) throw "概率不超过 100%"; var q = 1 - v.p / 100, P = 1 - Math.pow(q, v.n); return { big: ["至少一次", pct(P)], kv: [["一次都没有", pct(1 - P)], ["期望次数", g(v.n * v.p / 100, 4)], [v.t + "% 把握需要", q > 0 && v.t > 0 && v.t < 100 ? Math.ceil(Math.log(1 - v.t / 100) / Math.log(q)) + " 次" : "—"]] }; } });

  add({ cat: "math", id: "expected-value", name: "期望值 / 方差计算器", desc: "按各结果和概率算期望、方差和标准差", kw: "期望 数学期望 方差 概率分布",
    fields: [{ k: "r", l: "结果（数值, 概率%）", t: "list", cols: [{ k: "x", l: "数值", nv: "" }, { k: "p", l: "概率 %", nv: "" }], v: [[100, 10], [10, 30], [0, 60]] }],
    run: function (v) {
      var rs = v.r.filter(function (r) { return ok(r[0]) && ok(r[1]); }); if (!rs.length) throw "至少一行"; var sp = rs.reduce(function (a, r) { return a + r[1]; }, 0); if (Math.abs(sp - 100) > .01) throw "概率合计应为 100%（现在 " + g(sp, 4) + "%）";
      var E = rs.reduce(function (a, r) { return a + r[0] * r[1] / 100; }, 0), V = rs.reduce(function (a, r) { return a + Math.pow(r[0] - E, 2) * r[1] / 100; }, 0);
      return { big: ["期望值", g(E, 8)], kv: [["方差", g(V, 8)], ["标准差", g(Math.sqrt(V), 8)]] };
    } });

  /* ======================= 单位换算 ======================= */
  unit("chinese-volume", "古代容量换算", "合、升、斗、石与公制升互换（市制）", "升 斗 石 合 市制", [["升", 1], ["合", 0.1], ["勺", 0.01], ["斗", 10], ["石", 100], ["毫升", 0.001]], "斗");
  unit("concentration", "浓度比例换算", "百分比、千分比、ppm、ppb 互换", "ppm ppb 浓度 百分比", [["百分比 %", 1e-2], ["千分比 ‰", 1e-3], ["ppm", 1e-6], ["ppb", 1e-9], ["小数", 1], ["mg/L（水溶液≈ppm）", 1e-6]], "ppm");

  add({ cat: "convert", id: "height-ft-cm", name: "身高英尺英寸换算", desc: "5'9\" 这种英尺英寸与厘米互换", kw: "英尺 英寸 身高 ft",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["英尺 + 英寸", "厘米"] }, { k: "ft", l: "英尺", v: 5, show: function (v) { return v.m !== "厘米"; } }, { k: "in", l: "英寸", v: 9, show: function (v) { return v.m !== "厘米"; } }, { k: "cm", l: "厘米", v: 175, show: function (v) { return v.m === "厘米"; } }],
    run: function (v) { if (v.m === "厘米") { pos(v.cm); var t = v.cm / 2.54, ft = Math.floor(t / 12), i = t - ft * 12; if (+i.toFixed(1) === 12) { ft++; i = 0; } return { big: ["英制", ft + "′ " + f(i, 1) + "″"], kv: [["总英寸", f(t, 1)]] }; } need(v.ft, v.in); var cm = (v.ft * 12 + v.in) * 2.54; return { big: ["厘米", f(cm, 1) + " cm"], kv: [["米", f(cm / 100, 3) + " m"]] }; } });

  add({ cat: "convert", id: "oven-temp", name: "烤箱温度换算", desc: "摄氏、华氏和英式燃气档（Gas Mark）互换", kw: "烤箱 华氏 gas mark 温度",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["°C", "°F", "Gas Mark"] }, { k: "x", l: "数值", v: 180 }],
    run: function (v) {
      need(v.x); var GM = [[.25, 110], [.5, 130], [1, 140], [2, 150], [3, 170], [4, 180], [5, 190], [6, 200], [7, 220], [8, 230], [9, 240]], c = v.m === "°C" ? v.x : v.m === "°F" ? (v.x - 32) * 5 / 9 : (GM.filter(function (x) { return x[0] === v.x; })[0] || [0, NaN])[1];
      if (!ok(c)) throw "Gas Mark 为 1/4、1/2、1–9"; var gm = GM.reduce(function (a, b) { return Math.abs(b[1] - c) < Math.abs(a[1] - c) ? b : a; });
      return { kv: [["摄氏", f(c, 0) + " °C"], ["华氏", f(c * 9 / 5 + 32, 0) + " °F"], ["Gas Mark", c < 100 || c > 260 ? "超出范围" : String(gm[0])], ["风扇烤箱", f(c - 20, 0) + " °C"]], note: "风扇（热风）烤箱一般比食谱温度低 20 °C。" };
    } });

  add({ cat: "convert", id: "pixel-cm", name: "像素 / 厘米 / DPI 换算", desc: "按分辨率换算像素和打印尺寸", kw: "像素 厘米 dpi 打印尺寸",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["像素", "厘米"] }, { k: "x", l: "数值", v: 3000 }, { k: "d", l: "DPI", v: 300 }],
    run: function (v) { pos(v.x, v.d); return v.m === "像素" ? { big: ["打印尺寸", f(v.x / v.d * 2.54, 2) + " cm"], kv: [["英寸", f(v.x / v.d, 2) + " in"]] } : { big: ["需要像素", Math.round(v.x / 2.54 * v.d) + " px"], kv: [["英寸", f(v.x / 2.54, 2) + " in"]], note: "冲印照片一般 300 DPI，海报 150 DPI 即可。" }; } });

  add({ cat: "convert", id: "si-prefix", name: "国际单位制词头换算", desc: "纳、微、毫、千、兆、吉等词头互换", kw: "词头 纳 微 毫 千 兆 吉",
    fields: [{ k: "x", l: "数值", v: 4.7 }, { k: "p", l: "词头", t: "sel", drop: true, o: [[1e12, "太 T"], [1e9, "吉 G"], [1e6, "兆 M"], [1e3, "千 k"], [1, "（无）"], [1e-3, "毫 m"], [1e-6, "微 μ"], [1e-9, "纳 n"], [1e-12, "皮 p"]], v: 1e-6 }],
    run: function (v) { need(v.x); var b = v.x * v.p; return { table: { h: ["词头", "数值"], r: [[1e12, "T"], [1e9, "G"], [1e6, "M"], [1e3, "k"], [1, "—"], [1e-3, "m"], [1e-6, "μ"], [1e-9, "n"], [1e-12, "p"]].map(function (p) { return [p[1], g(b / p[0], 10)]; }) } }; } });

  /* ======================= 日期时间 ======================= */
  add({ cat: "date", id: "nth-weekday", name: "某月第几个星期几", desc: "比如母亲节（5 月第二个星期日）、感恩节是哪天", kw: "第几个星期 母亲节 父亲节 感恩节",
    fields: [{ k: "y", l: "年份", v: new Date().getFullYear() }, { k: "m", l: "月份", v: 5 }, { k: "n", l: "第几个（−1 为最后一个）", v: 2 }, { k: "w", l: "星期", t: "sel", o: [[1, "星期一"], [2, "星期二"], [3, "星期三"], [4, "星期四"], [5, "星期五"], [6, "星期六"], [0, "星期日"]], v: 0 }],
    run: function (v) {
      if (!Number.isInteger(v.y) || !Number.isInteger(v.m) || v.m < 1 || v.m > 12) throw "请输入正确的年月"; if (!Number.isInteger(v.n) || v.n === 0 || v.n < -1 || v.n > 5) throw "第几个：1–5 或 −1"; var w = Number(v.w), d;
      if (v.n > 0) { d = new Date(v.y, v.m - 1, 1); d.setDate(1 + (w - d.getDay() + 7) % 7 + (v.n - 1) * 7); if (d.getMonth() !== v.m - 1) throw "这个月没有第 " + v.n + " 个"; }
      else { d = new Date(v.y, v.m, 0); d.setDate(d.getDate() - (d.getDay() - w + 7) % 7); }
      return { big: ["日期", day(d)], kv: [["距今", dayDiff(today(), d) + " 天"]], note: "母亲节：5 月第 2 个星期日；父亲节：6 月第 3 个星期日；感恩节（美国）：11 月第 4 个星期四。" };
    } });

  add({ cat: "date", id: "day-of-year", name: "今年第几天 / 季度", desc: "某天是一年中的第几天、第几季度、一年过去了多少", kw: "第几天 季度 年进度",
    fields: [{ k: "d", l: "日期", t: "date", v: "today" }],
    run: function (v) { var d = D(v.d), y0 = new Date(d.getFullYear(), 0, 1), n = dayDiff(y0, d) + 1, tot = dayDiff(y0, new Date(d.getFullYear() + 1, 0, 1)), q = Math.floor(d.getMonth() / 3), qe = new Date(d.getFullYear(), q * 3 + 3, 0); return { big: ["第", n + " 天"], kv: [["年进度", pct(n / tot, 1)], ["今年还剩", tot - n + " 天"], ["季度", "第 " + (q + 1) + " 季度，季末 " + iso(qe) + "（还有 " + dayDiff(d, qe) + " 天）"], [d.getMonth() < 6 ? "上半年" : "下半年", "第 " + (d.getMonth() < 6 ? 1 : 2) + " 个半年"]] }; } });

  add({ cat: "date", id: "birthday-countdown", name: "生日倒计时（公历 / 农历）", desc: "离下次生日还有几天，农历生日自动换算成今年的公历日期", kw: "生日 倒计时 农历生日",
    fields: [{ k: "t", l: "生日类型", t: "sel", o: ["公历", "农历"] }, { k: "m", l: "月", v: 8 }, { k: "d", l: "日", v: 15 }, { k: "b", l: "出生年份（算岁数，可不填）", v: 2000 }],
    run: function (v) {
      if (!Number.isInteger(v.m) || v.m < 1 || v.m > 12 || !Number.isInteger(v.d) || v.d < 1 || v.d > 31) throw "请输入正确的月日"; var t = today(), Y = t.getFullYear(), nx;
      function at(yr) { if (v.t === "公历") { var x = new Date(yr, v.m - 1, v.d); if (x.getMonth() !== v.m - 1) x = new Date(yr, v.m, 0); return x; } try { return H.lunar2solar(yr, v.m, v.d, false); } catch (e) { return H.lunar2solar(yr, v.m, Math.min(v.d, 29), false); } }
      for (var yr = (v.t === "公历" ? Y : Y - 1); yr <= Y + 1; yr++) { var c = at(yr); if (c >= t) { nx = c; break; } }
      var dd = dayDiff(t, nx), age = ok(v.b) && v.b > 1900 ? (v.t === "公历" ? nx.getFullYear() : H.lunar(nx).y) - v.b : null;
      return { big: [dd === 0 ? "就是今天 🎂" : "还有 " + dd + " 天", day(nx)], kv: age != null ? [["将满", age + " 周岁"]] : [], note: v.t === "农历" ? "农历生日每年对应的公历日期不同；遇到小月没有三十时按廿九过。" : (v.m === 2 && v.d === 29 ? "平年按 2 月 28 日计算。" : null) };
    } });

  add({ cat: "date", id: "shelf-life", name: "保质期计算器", desc: "按生产日期和保质期算到期日，还剩多少天", kw: "保质期 过期 生产日期",
    fields: [{ k: "d", l: "生产日期", t: "date", v: "2026-06-01" }, { k: "n", l: "保质期", v: 12 }, { k: "u", l: "单位", t: "sel", o: ["月", "天", "年"] }],
    run: function (v) { pos(v.n); var p = D(v.d), e = v.u === "天" ? plus(p, v.n - 1) : plus(addMonths(p, v.u === "年" ? v.n * 12 : v.n), -1), left = dayDiff(today(), e); return { big: [left < 0 ? "已过期" : "还剩 " + left + " 天", "到期 " + day(e)], tag: left < 0 ? "过期 " + -left + " 天" : left <= 7 ? "临期" : null, note: "按生产当天算第 1 天。包装另有“保质期至”的以包装为准。" }; } });

  /* ======================= 生活实用 ======================= */
  add({ cat: "life", id: "water-tiered", name: "阶梯水价计算器", desc: "按年度阶梯水量算水费", kw: "水费 阶梯水价",
    fields: [{ k: "w", l: "本期用水量", u: "吨", v: 20 }, { k: "used", l: "本年度此前已用", u: "吨", v: 100 }, { k: "t1", l: "第一阶梯上限（年）", u: "吨", v: 180 }, { k: "t2", l: "第二阶梯上限（年）", u: "吨", v: 260 }, { k: "p1", l: "一档单价", u: "元/吨", v: 3.5 }, { k: "p2", l: "二档单价", u: "元/吨", v: 4.83 }, { k: "p3", l: "三档单价", u: "元/吨", v: 8.3 }],
    run: function (v) {
      need(v.w, v.used, v.t1, v.t2, v.p1, v.p2, v.p3); function seg(a, b) { return Math.max(0, Math.min(v.used + v.w, b) - Math.max(v.used, a)); }
      var s1 = seg(0, v.t1), s2 = seg(v.t1, v.t2), s3 = seg(v.t2, Infinity), c = s1 * v.p1 + s2 * v.p2 + s3 * v.p3;
      return { big: ["水费", y(c)], kv: [["一档", f(s1, 1) + " 吨"], ["二档", f(s2, 1) + " 吨"], ["三档", f(s3, 1) + " 吨"], ["均价", f(v.w ? c / v.w : 0, 2) + " 元/吨"]], note: "默认值为常见一线城市标准（含污水处理费），各地不同，以水费单为准。" };
    } });

  add({ cat: "life", id: "express-fee", name: "快递运费计算器", desc: "按首重续重和体积重量算运费", kw: "快递 运费 首重 续重 体积重",
    fields: [{ k: "w", l: "实际重量", u: "kg", v: 2.3 }, { k: "l", l: "长", u: "cm", v: 40 }, { k: "wd", l: "宽", u: "cm", v: 30 }, { k: "h", l: "高", u: "cm", v: 20 }, { k: "div", l: "体积重系数", t: "sel", o: [[6000, "÷ 6000（多数快递）"], [8000, "÷ 8000"], [12000, "÷ 12000（部分电商件）"]], v: 6000 }, { k: "f", l: "首重价（1 kg）", u: "元", v: 12 }, { k: "a", l: "续重价（每 kg）", u: "元", v: 5 }],
    run: function (v) { pos(v.w); need(v.l, v.wd, v.h, v.f, v.a); var vw = v.l * v.wd * v.h / v.div, cw = Math.ceil(Math.max(v.w, vw)); return { big: ["运费", y(v.f + Math.max(cw - 1, 0) * v.a)], kv: [["体积重", f(vw, 2) + " kg"], ["计费重量", cw + " kg（取大值，向上取整）"]] }; } });

  add({ cat: "life", id: "wedding-tables", name: "婚宴桌数 / 预算", desc: "按宾客人数算桌数、酒水和总预算", kw: "婚宴 酒席 桌数 婚礼预算",
    fields: [{ k: "g", l: "宾客人数", u: "人", v: 180 }, { k: "s", l: "每桌人数", t: "sel", o: [[10, "10 人"], [12, "12 人"], [8, "8 人"]], v: 10 }, { k: "b", l: "备用桌比例", u: "%", v: 10 }, { k: "p", l: "每桌价格", u: "元", v: 4000 }, { k: "d", l: "每桌酒水", u: "元", v: 600 }, { k: "o", l: "其他（婚庆、摄影等）", u: "元", v: 30000 }],
    run: function (v) { pos(v.g); need(v.b, v.p, v.d, v.o); var t = Math.ceil(v.g / v.s), tb = Math.ceil(t * v.b / 100), tot = (t + tb) * (v.p + v.d) + v.o; return { big: ["总预算", wy(tot)], kv: [["正桌", t + " 桌"], ["备用桌", tb + " 桌"], ["酒席 + 酒水", y((t + tb) * (v.p + v.d))], ["人均", y(tot / v.g)]], note: "备桌一般按 5%–10% 准备，提前和酒店确认未使用备桌是否收费。" }; } });

  add({ cat: "life", id: "travel-budget", name: "旅行预算计算器", desc: "按天数、人数和住宿交通餐饮算旅行总花费", kw: "旅行 预算 旅游 出游",
    fields: [{ k: "p", l: "人数", v: 2 }, { k: "d", l: "天数", v: 5 }, { k: "t", l: "往返大交通（人均）", u: "元", v: 1200 }, { k: "h", l: "每晚住宿（每间）", u: "元", v: 400 }, { k: "r", l: "房间数", v: 1 }, { k: "f", l: "每天餐饮（人均）", u: "元", v: 150 }, { k: "l", l: "每天市内交通（人均）", u: "元", v: 50 }, { k: "a", l: "门票娱乐（人均总计）", u: "元", v: 600 }],
    run: function (v) { pos(v.p, v.d); need(v.t, v.h, v.r, v.f, v.l, v.a); var stay = v.h * v.r * Math.max(v.d - 1, 0), food = v.f * v.p * v.d, loc = v.l * v.p * v.d, tot = v.t * v.p + stay + food + loc + v.a * v.p; return { big: ["总预算", wy(tot)], kv: [["人均", y(tot / v.p)], ["大交通", y(v.t * v.p)], ["住宿（" + Math.max(v.d - 1, 0) + " 晚）", y(stay)], ["餐饮", y(food)], ["市内交通 + 门票", y(loc + v.a * v.p)], ["建议再预留 10%", y(tot * .1)]] }; } });

  add({ cat: "life", id: "appliance-power", name: "家电耗电量计算器", desc: "按功率和使用时长算家电每天、每月、每年的电费", kw: "耗电 电费 功率 瓦",
    fields: [{ k: "a", l: "电器（功率 W, 每天小时）", t: "list", cols: [{ k: "n", l: "电器", t: "text", nv: "" }, { k: "w", l: "功率 W", nv: "" }, { k: "h", l: "小时/天", nv: "" }], v: [["电脑主机", 300, 6], ["冰箱", 150, 8], ["电视", 100, 3], ["路由器", 12, 24]] }, { k: "p", l: "电价", u: "元/kWh", v: 0.6 }],
    run: function (v) {
      need(v.p); var rs = v.a.filter(function (r) { return ok(r[1]) && ok(r[2]); }).map(function (r, i) { return [String(r[0]).trim() || "电器" + (i + 1), r[1] * r[2] / 1000]; }); if (!rs.length) throw "至少填一个电器";
      var k = rs.reduce(function (a, r) { return a + r[1]; }, 0);
      return { big: ["每月电费", y(k * 30 * v.p)], kv: [["每天耗电", f(k, 2) + " 度"], ["每年电费", y(k * 365 * v.p)]], table: { h: ["电器", "每天（度）", "每月（元）"], r: rs.map(function (r) { return [r[0], f(r[1], 2), f(r[1] * 30 * v.p)]; }) }, note: "冰箱等压缩机电器实际是间歇运行，“小时/天”按实际运转时间估。" };
    } });

  add({ cat: "life", id: "original-price", name: "折后价倒推原价", desc: "已知折后价和折扣，倒推原价和省了多少", kw: "原价 折扣 倒推 打折",
    fields: [{ k: "p", l: "折后价", u: "元", v: 168 }, { k: "d", l: "折扣（几折）", v: 7, hint: "7 折填 7，85 折填 8.5" }],
    run: function (v) { pos(v.p, v.d); if (v.d >= 10) throw "折扣应小于 10 折"; var o = v.p / (v.d / 10); return { big: ["原价", y(o)], kv: [["省了", y(o - v.p)], ["相当于减", pct(1 - v.d / 10, 0)]] }; } });

  add({ cat: "life", id: "random-group", name: "随机分组 / 抽签", desc: "把名单随机分成几组，或抽出几个人", kw: "分组 抽签 随机 点名",
    fields: [{ k: "l", l: "名单（每行或逗号分隔一个）", t: "area", v: "张三, 李四, 王五, 赵六, 孙七, 周八, 吴九, 郑十" }, { k: "m", l: "方式", t: "sel", o: ["分组", "抽人"] }, { k: "n", l: "组数 / 抽几人", v: 2 }],
    run: function (v) {
      var a = String(v.l).split(/[\n,，、;；]+/).map(function (s) { return s.trim(); }).filter(Boolean); if (a.length < 2) throw "至少两个名字"; if (!Number.isInteger(v.n) || v.n < 1 || v.n > a.length) throw "数量 1–" + a.length;
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
      if (v.m === "抽人") return { big: ["抽中", a.slice(0, v.n).join("、")], note: "每次重新计算都会重新抽。" };
      var G = []; for (i = 0; i < v.n; i++) G.push([]); a.forEach(function (x, k) { G[k % v.n].push(x); });
      return { table: { h: ["组", "成员"], r: G.map(function (gp, k) { return ["第 " + (k + 1) + " 组", gp.join("、")]; }) }, note: "每次重新计算都会重新分。" };
    } });

  /* ======================= 教育学业 ======================= */
  add({ cat: "edu", id: "ebbinghaus", name: "艾宾浩斯复习日期", desc: "按学习日期排出第 1、2、4、7、15、30 天的复习计划", kw: "艾宾浩斯 遗忘曲线 复习",
    fields: [{ k: "d", l: "首次学习日期", t: "date", v: "today" }],
    run: function (v) { var d = D(v.d), t = today(); return { table: { h: ["第几次复习", "日期", "状态"], r: [1, 2, 4, 7, 15, 30, 60].map(function (n, i) { var x = plus(d, n), k = dayDiff(t, x); return ["第 " + (i + 1) + " 次（+" + n + " 天）", day(x), k < 0 ? "已过" : k === 0 ? "今天" : k + " 天后"]; }) }, note: "学完当天睡前再过一遍效果更好。" }; } });

  add({ cat: "edu", id: "guess-score", name: "选择题蒙题期望得分", desc: "按题数、选项数和会做的题算期望得分和及格概率", kw: "选择题 蒙题 期望 及格",
    fields: [{ k: "n", l: "选择题总数", v: 40 }, { k: "k", l: "确定会做的题", v: 25 }, { k: "o", l: "选项数", v: 4 }, { k: "s", l: "每题分值", v: 2 }, { k: "p", l: "目标分数", v: 60 }],
    run: function (v) {
      if (![v.n, v.k, v.o].every(Number.isInteger) || v.k > v.n || v.o < 2) throw "请检查题数和选项数"; pos(v.s); need(v.p); var m = v.n - v.k, q = 1 / v.o, need0 = Math.ceil(v.p / v.s - v.k), P = 0, c = 1;
      for (var i = 0; i <= m; i++) { if (i > 0) c = c * (m - i + 1) / i; if (i >= need0) P += c * Math.pow(q, i) * Math.pow(1 - q, m - i); }
      return { big: ["期望得分", f((v.k + m * q) * v.s, 1)], kv: [["蒙的题", m + " 道，期望对 " + f(m * q, 1) + " 道"], ["达到 " + v.p + " 分的概率", need0 <= 0 ? "100%" : pct(P, 1)]] };
    } });

  add({ cat: "edu", id: "student-loan", name: "国家助学贷款还款", desc: "生源地 / 校园地助学贷款在校贴息、毕业后月供和利息", kw: "助学贷款 生源地 还款",
    fields: [{ k: "a", l: "每年贷款", u: "元", v: 12000 }, { k: "n", l: "贷款学年数", u: "年", v: 4 }, { k: "g", l: "毕业后宽限期", u: "年", v: 5, hint: "宽限期内只还利息" }, { k: "t", l: "宽限期后还本年数", u: "年", v: 10 }, { k: "r", l: "利率", u: "%", v: 2.4, hint: "5 年期 LPR − 60 个基点" }],
    run: function (v) { pos(v.a, v.n, v.t); need(v.g, v.r); var P = v.a * v.n, r = v.r / 1200, m = pmt(P, r, v.t * 12); return { big: ["本金合计", y(P)], kv: [["宽限期每月利息", y(P * r)], ["还本期月供", y(m)], ["毕业后总利息", y(P * r * v.g * 12 + m * v.t * 12 - P)]], note: "在校期间利息由财政全额贴息。2021 年起本科生每年最高 1.6 万元，研究生 2 万元，还款期限为学制加 15 年、最长 22 年。" }; } });

  add({ cat: "edu", id: "exam-time", name: "考试时间分配", desc: "按各部分分值分配答题时间，留出检查时间", kw: "考试 时间分配 答题",
    fields: [{ k: "t", l: "考试时长", u: "分钟", v: 150 }, { k: "c", l: "留出检查时间", u: "分钟", v: 10 }, { k: "s", l: "各部分（名称, 分值）", t: "list", cols: [{ k: "n", l: "部分", t: "text", nv: "" }, { k: "p", l: "分值", nv: "" }], v: [["选择题", 40], ["填空题", 20], ["解答题", 90]] }],
    run: function (v) { pos(v.t); need(v.c); var rs = v.s.filter(function (r) { return ok(r[1]) && r[1] > 0; }); if (!rs.length) throw "至少一部分"; var tot = rs.reduce(function (a, r) { return a + r[1]; }, 0), use = v.t - v.c; if (use <= 0) throw "检查时间太长"; return { big: ["每分约", f(use / tot, 2) + " 分钟"], table: { h: ["部分", "分值", "建议用时（分钟）"], r: rs.map(function (r) { return [r[0], r[1], f(use * r[1] / tot, 0)]; }) } }; } });

  add({ cat: "edu", id: "putonghua", name: "普通话等级查询", desc: "按普通话水平测试分数查等级", kw: "普通话 等级 一乙 二甲",
    fields: [{ k: "s", l: "测试分数", v: 88.5 }],
    run: function (v) { need(v.s); if (v.s < 0 || v.s > 100) throw "分数 0–100"; var L = [[97, "一级甲等"], [92, "一级乙等"], [87, "二级甲等"], [80, "二级乙等"], [70, "三级甲等"], [60, "三级乙等"]], x = L.filter(function (l) { return v.s >= l[0]; })[0]; return { big: ["等级", x ? x[1] : "不入级"], kv: [["距离下一级", (function () { var i = x ? L.indexOf(x) : L.length; return i > 0 ? f(L[i - 1][0] - v.s, 1) + " 分（" + L[i - 1][1] + "）" : "已是最高级"; })()]], note: "语文教师一般要求二级甲等以上，播音主持一级乙等以上。" }; } });

  /* ======================= 商业财税 ======================= */
  add({ cat: "biz", id: "severance", name: "离职经济补偿金（N / N+1 / 2N）", desc: "按工作年限和月工资算被辞退的经济补偿", kw: "经济补偿金 n+1 辞退 裁员 2n",
    fields: [{ k: "s", l: "离职前 12 个月平均工资", u: "元", v: 12000 }, { k: "y", l: "工作年限", u: "年", v: 3.4, hint: "满 6 个月按 1 年，不满 6 个月按半年" }, { k: "c", l: "当地上年社平工资 × 3（封顶）", u: "元", v: 36000 }, { k: "t", l: "情形", t: "sel", o: ["N（协商解除、经济裁员等）", "N+1（未提前 30 天通知）", "2N（违法解除）"] }],
    run: function (v) {
      pos(v.s); need(v.y, v.c); var cap = v.c > 0 && v.s > v.c, base = cap ? v.c : v.s, whole = Math.floor(v.y), frac = v.y - whole, N = whole + (frac >= .5 ? 1 : frac > 0 ? .5 : 0); if (cap) N = Math.min(N, 12);
      var k = v.t[0] === "2" ? 2 * N * base : N * base + (v.t.indexOf("N+1") === 0 ? v.s : 0);
      return { big: ["补偿金", y(k)], kv: [["N", g(N, 2) + " 个月"], ["计算基数", y(base) + (cap ? "（按 3 倍社平封顶，年限最多 12 年）" : "")]], note: "依据《劳动合同法》第 47、40、87 条。“+1”的代通知金按上月工资计。经济补偿金在当地上年职工平均工资 3 倍以内部分免个税。" };
    } });

  add({ cat: "biz", id: "annual-leave", name: "带薪年假天数", desc: "按累计工龄和入职日期算今年能休几天年假", kw: "年假 带薪年休假 工龄",
    fields: [{ k: "w", l: "累计工作年限", u: "年", v: 6 }, { k: "d", l: "本单位入职日期", t: "date", v: "2026-03-01" }],
    run: function (v) {
      need(v.w); var full = v.w < 1 ? 0 : v.w < 10 ? 5 : v.w < 20 ? 10 : 15, j = D(v.d), Y = today().getFullYear(), ys = new Date(Y, 0, 1), from = j > ys ? j : ys, left = dayDiff(from, new Date(Y + 1, 0, 1)), tot = dayDiff(ys, new Date(Y + 1, 0, 1));
      var thisY = Math.floor(left / tot * full);
      return { big: ["今年可休", thisY + " 天"], kv: [["满年应休", full + " 天"]], note: "《职工带薪年休假条例》：累计工作满 1 年不满 10 年 5 天，满 10 年不满 20 年 10 天，满 20 年 15 天。新入职当年按剩余天数折算，不足 1 整天不享受。未休年假按日工资 300% 补偿（含已发的 100%）。" };
    } });

  add({ cat: "biz", id: "gmv", name: "GMV / 销售额拆解", desc: "流量 × 转化率 × 客单价，看哪个环节提升最有效", kw: "gmv 销售额 客单价 转化率 流量",
    fields: [{ k: "u", l: "访客数 UV", v: 20000 }, { k: "c", l: "转化率", u: "%", v: 2.5 }, { k: "a", l: "客单价", u: "元", v: 120 }, { k: "up", l: "假设某项提升", u: "%", v: 10 }],
    run: function (v) { need(v.u, v.c, v.a, v.up); var G = v.u * v.c / 100 * v.a, k = 1 + v.up / 100; return { big: ["GMV", wy(G)], kv: [["订单数", f(v.u * v.c / 100, 0)], ["UV 价值", y(v.u ? G / v.u : 0)], ["任一项提升 " + v.up + "% 后", wy(G * k)], ["三项都提升后", wy(G * k * k * k)]] }; } });

  add({ cat: "biz", id: "discount-volume", name: "打折需要多卖多少才不亏", desc: "按毛利率和折扣算销量要涨多少才能保持毛利", kw: "打折 促销 销量 毛利",
    fields: [{ k: "m", l: "原毛利率", u: "%", v: 40 }, { k: "d", l: "降价幅度", u: "%", v: 15 }],
    run: function (v) { pos(v.m); need(v.d); if (v.d >= v.m) return { big: ["每卖一件都亏", "降价幅度 ≥ 毛利率"] }; var inc = v.m / (v.m - v.d) - 1; return { big: ["销量需增加", pct(inc, 1)], kv: [["降价后毛利率", pct((v.m - v.d) / (100 - v.d), 1)]], note: "比如毛利 40% 打 85 折，销量要涨 60% 毛利额才不变。" }; } });

  add({ cat: "biz", id: "sales-per-sqm", name: "坪效 / 人效计算器", desc: "门店每平方米、每个员工、每小时的销售额", kw: "坪效 人效 门店 时效",
    fields: [{ k: "s", l: "月销售额", u: "元", v: 300000 }, { k: "a", l: "营业面积", u: "㎡", v: 120 }, { k: "p", l: "员工数", v: 6 }, { k: "h", l: "每天营业小时", v: 12 }, { k: "d", l: "每月营业天数", v: 30 }],
    run: function (v) { need(v.s); pos(v.a, v.p, v.h, v.d); return { big: ["月坪效", y(v.s / v.a) + "/㎡"], kv: [["年坪效", y(v.s * 12 / v.a) + "/㎡"], ["月人效", y(v.s / v.p)], ["时效", y(v.s / v.d / v.h) + "/小时"], ["日均销售", y(v.s / v.d)]] }; } });

  add({ cat: "biz", id: "fob-cif", name: "外贸报价 EXW / FOB / CIF", desc: "按成本、运费、保险和利润算各贸易术语报价", kw: "fob cif exw 外贸 报价",
    fields: [{ k: "c", l: "货物成本（含税）", u: "元", v: 100000 }, { k: "t", l: "出口退税率", u: "%", v: 13 }, { k: "v", l: "增值税率", u: "%", v: 13 }, { k: "l", l: "国内运杂费", u: "元", v: 3000 }, { k: "fr", l: "海运费", u: "元", v: 8000 }, { k: "i", l: "保险费率", u: "%", v: 0.3 }, { k: "p", l: "利润率", u: "%", v: 10 }, { k: "x", l: "汇率（1 美元 = ? 元）", v: 7.1 }],
    run: function (v) {
      pos(v.c, v.x); need(v.t, v.v, v.l, v.fr, v.i, v.p); var refund = v.c / (1 + v.v / 100) * v.t / 100, base = v.c - refund, k = 1 - v.p / 100, exw = base / k, fob = (base + v.l) / k, cif = (base + v.l + v.fr) / (k - 1.1 * v.i / 100);
      return { table: { h: ["术语", "人民币", "美元"], r: [["EXW", f(exw), f(exw / v.x)], ["FOB", f(fob), f(fob / v.x)], ["CIF", f(cif), f(cif / v.x)]] }, kv: [["出口退税", y(refund)]], note: "利润率按报价计算，CIF 保险按发票金额 110% 投保。" };
    } });

  /* ======================= 工程建筑 ======================= */
  add({ cat: "build", id: "floor-heating", name: "地暖盘管用量", desc: "按面积和管间距算地暖管长度、回路数", kw: "地暖 盘管 管间距",
    fields: [{ k: "a", l: "铺设面积", u: "㎡", v: 90 }, { k: "s", l: "管间距", t: "sel", o: [[150, "150 mm"], [200, "200 mm"], [250, "250 mm"], [300, "300 mm"]], v: 200 }, { k: "d", l: "到分集水器平均距离", u: "m", v: 6 }],
    run: function (v) { pos(v.a); need(v.d); var L = v.a * 1000 / v.s, loops = Math.max(1, Math.ceil(L / 100)), tot = L + loops * v.d * 2; return { big: ["地暖管", f(tot * 1.05, 0) + " m"], kv: [["盘管部分", f(L, 0) + " m"], ["回路数（每路 ≤ 100 m）", loops + " 路"], ["分集水器", loops + " 路"]], note: "含 5% 损耗。单回路一般不超过 120 m，卫生间、客厅外墙侧可适当加密。" }; } });

  add({ cat: "build", id: "waterproof", name: "防水涂料用量", desc: "卫生间、厨房、阳台防水面积和涂料用量", kw: "防水 涂料 卫生间 闭水",
    fields: [{ k: "l", l: "长", u: "m", v: 2.4 }, { k: "w", l: "宽", u: "m", v: 1.8 }, { k: "h", l: "墙面上翻高度", u: "m", v: 1.8, hint: "淋浴区 1.8 m，其余 0.3 m" }, { k: "t", l: "涂膜厚度", u: "mm", v: 1.5 }, { k: "k", l: "涂料", t: "sel", o: [[1.5, "JS / 聚合物水泥（约 1.5 kg/㎡·mm）"], [1.7, "聚氨酯（约 1.7 kg/㎡·mm）"]], v: 1.5 }],
    run: function (v) { pos(v.l, v.w, v.t); need(v.h); var A = v.l * v.w + 2 * (v.l + v.w) * v.h; return { big: ["涂料", f(A * v.t * v.k * 1.1, 1) + " kg"], kv: [["防水面积", f(A, 2) + " ㎡"]], note: "含 10% 损耗。做完闭水试验 48 小时。" }; } });

  add({ cat: "build", id: "mortar", name: "水泥砂浆用量", desc: "按砂浆体积和配合比算水泥和砂子用量", kw: "砂浆 水泥 沙子 配比 找平",
    fields: [{ k: "a", l: "面积", u: "㎡", v: 30 }, { k: "t", l: "厚度", u: "cm", v: 3 }, { k: "r", l: "配合比（水泥 : 砂）", t: "sel", o: [[2, "1 : 2"], [2.5, "1 : 2.5"], [3, "1 : 3"], [4, "1 : 4"]], v: 3 }],
    run: function (v) { pos(v.a, v.t); var V = v.a * v.t / 100, dry = V * 1.3, c = dry / (1 + v.r) * 1300, s = dry * v.r / (1 + v.r); return { big: ["水泥", Math.ceil(c / 50) + " 袋（50 kg）"], kv: [["砂浆体积", f(V, 2) + " m³"], ["水泥", f(c, 0) + " kg"], ["砂子", f(s, 2) + " m³ ≈ " + f(s * 1.5, 1) + " 吨"]], note: "按体积比、干料系数 1.3、水泥堆积密度 1300 kg/m³ 估算。" }; } });

  add({ cat: "build", id: "grout", name: "美缝剂用量", desc: "按瓷砖规格、缝宽和面积算美缝剂支数", kw: "美缝 填缝剂 瓷砖缝",
    fields: [{ k: "a", l: "铺贴面积", u: "㎡", v: 60 }, { k: "l", l: "瓷砖长", u: "mm", v: 800 }, { k: "w", l: "瓷砖宽", u: "mm", v: 800 }, { k: "g", l: "缝宽", u: "mm", v: 2 }, { k: "d", l: "填缝深度", u: "mm", v: 3 }, { k: "c", l: "每支容量", u: "ml", v: 400 }],
    run: function (v) { pos(v.a, v.l, v.w, v.g, v.d, v.c); var len = v.a * (1000 / v.l + 1000 / v.w), ml = len * v.g * v.d * 1.1; return { big: ["需要", Math.ceil(ml / v.c) + " 支"], kv: [["缝总长", f(len, 0) + " m"], ["用量", f(ml, 0) + " ml"]], note: "含 10% 损耗。美缝前缝深需清理到 2–3 mm。" }; } });

  add({ cat: "build", id: "radiator", name: "暖气片片数计算", desc: "按房间面积和热负荷算暖气片需要多少片", kw: "暖气片 散热器 片数",
    fields: [{ k: "a", l: "房间面积", u: "㎡", v: 20 }, { k: "q", l: "单位面积热负荷", t: "sel", o: [[60, "节能建筑 60 W/㎡"], [80, "一般 80 W/㎡"], [100, "顶层 / 边户 100 W/㎡"], [120, "老房 / 保温差 120 W/㎡"]], v: 80 }, { k: "p", l: "每片散热量", u: "W", v: 130 }],
    run: function (v) { pos(v.a, v.p); var W = v.a * v.q; return { big: ["需要", Math.ceil(W / v.p) + " 片"], kv: [["总热负荷", f(W, 0) + " W"]], note: "每片散热量看产品标注（ΔT=64.5 °C 工况），单组一般不超过 25 片。" }; } });

  add({ cat: "build", id: "voltage-drop", name: "电缆压降计算器", desc: "按电流、长度和线径算线路压降，判断线径是否够用", kw: "压降 电缆 线径 平方",
    fields: [{ k: "i", l: "电流", u: "A", v: 32 }, { k: "l", l: "线路长度（单程）", u: "m", v: 50 }, { k: "s", l: "线径", t: "sel", o: [[1.5, "1.5 ㎟"], [2.5, "2.5 ㎟"], [4, "4 ㎟"], [6, "6 ㎟"], [10, "10 ㎟"], [16, "16 ㎟"], [25, "25 ㎟"]], v: 6 }, { k: "m", l: "材质", t: "sel", o: [[0.0175, "铜"], [0.0283, "铝"]], v: 0.0175 }, { k: "u", l: "电压", t: "sel", o: [[220, "220 V 单相"], [380, "380 V 三相"]], v: 220 }],
    run: function (v) { pos(v.i, v.l); var k = v.u === 380 ? Math.sqrt(3) : 2, dv = k * v.m * v.l * v.i / v.s, p = dv / v.u; return { big: ["压降", f(dv, 2) + " V（" + pct(p, 2) + "）"], tag: p <= .05 ? "合格（≤ 5%）" : "压降过大，建议加粗线径", kv: [["线路损耗", f(dv * v.i * (v.u === 380 ? Math.sqrt(3) : 1), 0) + " W"]], note: "照明线路一般要求压降 ≤ 3%，动力线路 ≤ 5%。" }; } });

  /* ======================= 科学工程 ======================= */
  add({ cat: "science", id: "dew-point", name: "露点 / 湿度计算器", desc: "按温度和相对湿度算露点、绝对湿度和体感", kw: "露点 湿度 结露 回南天",
    fields: [{ k: "t", l: "气温", u: "°C", v: 25 }, { k: "rh", l: "相对湿度", u: "%", v: 70 }],
    run: function (v) { need(v.t); pos(v.rh); if (v.rh > 100) throw "湿度不超过 100%"; var a = 17.62, b = 243.12, gm = Math.log(v.rh / 100) + a * v.t / (b + v.t), dp = b * gm / (a - gm), es = 6.112 * Math.exp(a * v.t / (b + v.t)), ah = 216.7 * es * v.rh / 100 / (273.15 + v.t); return { big: ["露点", f(dp, 1) + " °C"], kv: [["绝对湿度", f(ah, 1) + " g/m³"], ["结露风险", "墙面、地面低于 " + f(dp, 1) + " °C 会结露"], ["舒适度", dp < 10 ? "干爽" : dp < 16 ? "舒适" : dp < 21 ? "有点闷" : "闷热潮湿"]] }; } });

  add({ cat: "science", id: "thermal-expansion", name: "热胀冷缩计算器", desc: "按线膨胀系数和温差算长度变化", kw: "热膨胀 线膨胀系数 伸缩缝",
    fields: [{ k: "l", l: "原长", u: "m", v: 100 }, { k: "m", l: "材料", t: "sel", drop: true, o: [[12e-6, "钢 12×10⁻⁶"], [23e-6, "铝 23×10⁻⁶"], [17e-6, "铜 17×10⁻⁶"], [10e-6, "混凝土 10×10⁻⁶"], [9e-6, "玻璃 9×10⁻⁶"], [150e-6, "PPR 管 150×10⁻⁶"], [70e-6, "PVC 70×10⁻⁶"]], v: 12e-6 }, { k: "dt", l: "温差", u: "°C", v: 40 }],
    run: function (v) { pos(v.l); need(v.dt); var d = v.l * v.m * v.dt; return { big: ["长度变化", g(d * 1000, 5) + " mm"], kv: [["变化后长度", g(v.l + d, 8) + " m"]] }; } });

  add({ cat: "science", id: "molarity", name: "溶液浓度配制", desc: "按物质的量浓度和体积算称多少克；或按克数算浓度", kw: "摩尔浓度 溶液配制 mol/L 称量",
    fields: [{ k: "m", l: "计算", t: "sel", o: ["配制：需称多少克", "已称：浓度是多少"] }, { k: "mw", l: "摩尔质量", u: "g/mol", v: 58.44, hint: "NaCl 58.44，NaOH 40.00，葡萄糖 180.16" }, { k: "v", l: "溶液体积", u: "mL", v: 500 }, { k: "c", l: "浓度", u: "mol/L", v: 0.1, show: function (v) { return v.m[0] === "配"; } }, { k: "g", l: "称量质量", u: "g", v: 2.922, show: function (v) { return v.m[0] !== "配"; } }],
    run: function (v) { pos(v.mw, v.v); if (v.m[0] === "配") { pos(v.c); var gr = v.c * v.v / 1000 * v.mw; return { big: ["称取", g(gr, 5) + " g"], kv: [["物质的量", g(v.c * v.v / 1000, 5) + " mol"], ["质量浓度", g(gr / v.v * 1000, 5) + " g/L"]] }; } pos(v.g); var c = v.g / v.mw / (v.v / 1000); return { big: ["浓度", g(c, 5) + " mol/L"], kv: [["质量浓度", g(v.g / v.v * 1000, 5) + " g/L"]] }; } });

  add({ cat: "science", id: "centripetal", name: "向心力 / 圆周运动", desc: "按质量、速度和半径算向心力、向心加速度和周期", kw: "向心力 圆周运动 角速度",
    fields: [{ k: "m", l: "质量", u: "kg", v: 1 }, { k: "v", l: "线速度", u: "m/s", v: 10 }, { k: "r", l: "半径", u: "m", v: 5 }],
    run: function (v) { pos(v.m, v.v, v.r); var a = v.v * v.v / v.r; return { big: ["向心力", g(v.m * a, 6) + " N"], kv: [["向心加速度", g(a, 6) + " m/s²（" + g(a / 9.80665, 4) + " g）"], ["角速度", g(v.v / v.r, 6) + " rad/s"], ["周期", g(2 * Math.PI * v.r / v.v, 6) + " s"], ["转速", g(v.v / (2 * Math.PI * v.r) * 60, 6) + " r/min"]] }; } });

  add({ cat: "science", id: "sound-speed", name: "声速 / 打雷距离", desc: "按气温算声速；按闪电和雷声间隔算距离", kw: "声速 打雷 闪电 距离",
    fields: [{ k: "t", l: "气温", u: "°C", v: 20 }, { k: "s", l: "闪电到雷声间隔（可选）", u: "秒", v: 5 }],
    run: function (v) { need(v.t); var c = 331.3 * Math.sqrt(1 + v.t / 273.15), kv = [["每秒", f(c, 1) + " m"]]; if (ok(v.s) && v.s > 0) kv.unshift(["雷电距离", f(c * v.s / 1000, 2) + " km"]); return { big: ["声速", f(c, 1) + " m/s"], kv: kv, note: "雷声间隔小于 30 秒（约 10 km）就在雷击范围内，应进入室内。" }; } });

  add({ cat: "science", id: "incline", name: "斜面受力计算器", desc: "斜面上物体的下滑力、正压力、摩擦力和加速度", kw: "斜面 摩擦力 受力分析",
    fields: [{ k: "m", l: "质量", u: "kg", v: 10 }, { k: "a", l: "倾角", u: "°", v: 30 }, { k: "u", l: "动摩擦因数 μ", v: 0.2 }],
    run: function (v) { pos(v.m); need(v.a, v.u); var G = 9.8, t = v.a * Math.PI / 180, Fd = v.m * G * Math.sin(t), N = v.m * G * Math.cos(t), fr = v.u * N, slide = Fd > fr; return { big: [slide ? "下滑加速度" : "静止（不下滑）", slide ? g((Fd - fr) / v.m, 5) + " m/s²" : "下滑力 ≤ 最大摩擦力"], kv: [["重力沿斜面分力", g(Fd, 5) + " N"], ["正压力", g(N, 5) + " N"], ["摩擦力（滑动）", g(fr, 5) + " N"], ["匀速拉上去需", g(Fd + fr, 5) + " N"]], note: "g 取 9.8 m/s²，按最大静摩擦 ≈ 滑动摩擦估算。" }; } });

  add({ cat: "science", id: "carnot", name: "卡诺效率 / 制冷系数", desc: "按高低温热源温度算热机最高效率和制冷、制热 COP", kw: "卡诺 热机效率 cop 热泵",
    fields: [{ k: "th", l: "高温热源", u: "°C", v: 45 }, { k: "tc", l: "低温热源", u: "°C", v: 7 }],
    run: function (v) { need(v.th, v.tc); var H2 = v.th + 273.15, C = v.tc + 273.15; if (H2 <= C || C <= 0) throw "高温需高于低温"; return { big: ["卡诺效率", pct(1 - C / H2, 1)], kv: [["理想制冷 COP", g(C / (H2 - C), 4)], ["理想制热 COP", g(H2 / (H2 - C), 4)]], note: "实际热泵 COP 约为理想值的 40%–60%。" }; } });

  add({ cat: "science", id: "beer-lambert", name: "朗伯-比尔定律", desc: "吸光度、透光率、浓度互算 A = εbc", kw: "吸光度 透光率 比尔定律 分光光度",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["吸光度 A", "透光率 T%", "浓度 c"] }, { k: "x", l: "数值", v: 0.5 }, { k: "e", l: "摩尔吸光系数 ε", u: "L/(mol·cm)", v: 6220 }, { k: "b", l: "光程", u: "cm", v: 1 }],
    run: function (v) { pos(v.e, v.b); need(v.x); var A = v.m[0] === "吸" ? v.x : v.m[0] === "透" ? (v.x > 0 ? -Math.log10(v.x / 100) : NaN) : v.e * v.b * v.x; if (!ok(A)) throw "透光率需大于 0"; return { kv: [["吸光度 A", g(A, 6)], ["透光率 T", g(Math.pow(10, -A) * 100, 6) + "%"], ["浓度 c", g(A / v.e / v.b, 6) + " mol/L"]] }; } });
})();
