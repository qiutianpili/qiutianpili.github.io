/* Calculator registry, batch 6 (2026-10). Uses helpers exported by calcs.js / calcs2.js. */
(function () {
  "use strict";
  var H = window.CX.h, add = H.add, ok = H.ok, need = H.need, pos = H.pos, f = H.f, g = H.g, y = H.y, wy = H.wy, pct = H.pct,
    D = H.D, iso = H.iso, WK = H.WK, dayDiff = H.dayDiff, addMonths = H.addMonths, pmt = H.pmt, unit = H.unit;
  function nums(s) { var a = String(s).split(/[\s,，;；]+/).filter(Boolean).map(Number); if (!a.length || a.some(isNaN)) throw "请输入数字，用逗号或空格分隔"; return a; }
  function today() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
  function nowDT() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
  function plus(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function day(d) { return iso(d) + " " + WK[d.getDay()]; }
  function hm(min) { min = ((Math.round(min) % 1440) + 1440) % 1440; return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0"); }
  function rows(list, n) { return (list || []).filter(function (r) { return ok(r[n == null ? 1 : n]); }); }
  function irr(cf) { var lo = -0.99, hi = 1; function npv(r) { return cf.reduce(function (s, c, i) { return s + c / Math.pow(1 + r, i); }, 0); } if (npv(lo) * npv(hi) > 0) return NaN; for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (npv(lo) * npv(m) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; }
  var MARG = [[3, "3%"], [10, "10%"], [20, "20%"], [25, "25%"], [30, "30%"], [35, "35%"], [45, "45%"]];

  /* ======================= 财务理财 ======================= */
  add({ cat: "finance", id: "interest-only-loan", name: "先息后本 / 到期还本", desc: "每月只还利息、到期一次还本的月供和总利息，与等额本息对比", kw: "先息后本 经营贷 到期还本",
    fields: [{ k: "p", l: "贷款金额", u: "万元", v: 50 }, { k: "r", l: "年利率", u: "%", v: 3.5 }, { k: "n", l: "期限", u: "月", v: 36 }],
    run: function (v) { pos(v.p, v.n); need(v.r); var P = v.p * 1e4, i = P * v.r / 1200, e = pmt(P, v.r / 1200, v.n); return { big: ["每月利息", y(i)], kv: [["总利息", y(i * v.n)], ["到期还本", wy(P)], ["等额本息月供", y(e)], ["等额本息总利息", y(e * v.n - P)]], note: "先息后本资金占用更长，总利息更高，但前期压力小，适合有到期还款来源的经营周转。" }; } });

  add({ cat: "finance", id: "cash-advance", name: "信用卡取现利息", desc: "信用卡取现的日息、手续费和真实成本", kw: "取现 预借现金 日息 万五",
    fields: [{ k: "a", l: "取现金额", u: "元", v: 5000 }, { k: "d", l: "天数（取现到还清）", u: "天", v: 30 }, { k: "r", l: "日利率", u: "‱", v: 5 }, { k: "fee", l: "手续费率", u: "%", v: 1 }, { k: "min", l: "最低手续费", u: "元", v: 10 }],
    run: function (v) { pos(v.a, v.d); need(v.r, v.fee, v.min); var it = v.a * v.r / 1e4 * v.d, fe = Math.max(v.a * v.fee / 100, v.min), tot = it + fe; return { big: ["总成本", y(tot)], kv: [["利息", y(it)], ["手续费", y(fe)], ["折合年化", pct(tot / v.a / v.d * 365, 1)]], note: "取现不享免息期，从取现当天起按日计息。" }; } });

  add({ cat: "finance", id: "simple-interest", name: "单利计算器", desc: "本金 × 利率 × 时间，按年、月或天计息", kw: "单利 利息 本息",
    fields: [{ k: "p", l: "本金", u: "元", v: 100000 }, { k: "r", l: "年利率", u: "%", v: 2 }, { k: "t", l: "期限", v: 18 }, { k: "u", l: "单位", t: "sel", o: [[12, "月"], [1, "年"], [365, "天"]], v: 12 }],
    run: function (v) { pos(v.p, v.t); need(v.r); var i = v.p * v.r / 100 * v.t / v.u; return { big: ["利息", y(i)], kv: [["本息合计", y(v.p + i)], ["同期复利（年复利）", y(v.p * (Math.pow(1 + v.r / 100, v.t / v.u) - 1))]] }; } });

  add({ cat: "finance", id: "pv-fv", name: "现值 / 终值计算器", desc: "未来一笔钱折到今天值多少，或今天的钱将来值多少", kw: "现值 终值 折现 货币时间价值",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["现值求终值", "终值求现值"] }, { k: "a", l: "金额", u: "元", v: 100000 }, { k: "r", l: "年利率 / 折现率", u: "%", v: 4 }, { k: "n", l: "年数", u: "年", v: 10 }],
    run: function (v) { pos(v.a); need(v.r, v.n); var k = Math.pow(1 + v.r / 100, v.n); return v.m[0] === "现" ? { big: ["终值", wy(v.a * k)], kv: [["增值", wy(v.a * (k - 1))]] } : { big: ["现值", wy(v.a / k)], kv: [["折扣", pct(1 - 1 / k, 1)]] }; } });

  add({ cat: "finance", id: "personal-pension", name: "个人养老金节税计算器", desc: "每年存入个人养老金账户能少交多少个税", kw: "个人养老金 节税 12000",
    fields: [{ k: "a", l: "每年缴存", u: "元", v: 12000 }, { k: "t", l: "你的个税边际税率", t: "sel", o: MARG, v: 10 }, { k: "n", l: "距领取年数", u: "年", v: 25 }, { k: "r", l: "预期年化收益", u: "%", v: 2.5 }],
    run: function (v) { need(v.a, v.n, v.r); if (v.a > 12000) throw "每年上限 12000 元"; var save = v.a * v.t / 100, fv = v.r ? v.a * (Math.pow(1 + v.r / 100, v.n) - 1) / (v.r / 100) : v.a * v.n; return { big: ["每年少交个税", y(save)], kv: [["领取时缴税（3%）", y(fv * .03)], ["累计节税", y(save * v.n)], ["到期账户约", wy(fv)]], tag: v.t <= 3 ? "税率 3% 时基本不划算" : null, note: "缴存额每年 12000 元内税前扣除，领取时单独按 3% 计税。资金要到退休才能领取。" }; } });

  add({ cat: "finance", id: "salary-raise", name: "涨薪幅度 / 实际购买力", desc: "涨薪百分比，扣掉通胀后的实际涨幅", kw: "涨薪 加薪 通胀 实际工资",
    fields: [{ k: "a", l: "原月薪", u: "元", v: 12000 }, { k: "b", l: "新月薪", u: "元", v: 13500 }, { k: "i", l: "通胀率", u: "%", v: 0.5 }],
    run: function (v) { pos(v.a); need(v.b, v.i); var r = v.b / v.a - 1; return { big: ["涨薪", pct(r, 1)], kv: [["每月多", y(v.b - v.a)], ["每年多", y((v.b - v.a) * 12)], ["扣除通胀实际涨幅", pct((1 + r) / (1 + v.i / 100) - 1, 1)]] }; } });

  add({ cat: "finance", id: "debt-payoff", name: "多笔债务还款规划", desc: "雪崩法（先还高息）和雪球法（先还小额）还清所有债务要多久", kw: "还债 雪球法 雪崩法 负债",
    fields: [{ k: "d", l: "债务（余额, 年利率%, 最低月还）", t: "list", cols: [{ k: "n", l: "名称", t: "text", nv: "" }, { k: "b", l: "余额", nv: "" }, { k: "r", l: "年利率%", nv: "" }, { k: "m", l: "最低还", nv: "" }], v: [["信用卡", 20000, 18, 1000], ["网贷", 30000, 12, 1500], ["车贷", 50000, 5, 2000]] }, { k: "x", l: "每月额外可还", u: "元", v: 2000 }],
    run: function (v) {
      need(v.x); var base = v.d.filter(function (r) { return ok(r[1]) && r[1] > 0 && ok(r[2]) && ok(r[3]); }).map(function (r, i) { return { n: String(r[0]).trim() || "债务" + (i + 1), b: r[1], r: r[2] / 1200, m: r[3] }; }); if (!base.length) throw "至少一笔债务";
      function sim(order) { var ds = base.map(function (d) { return { n: d.n, b: d.b, r: d.r, m: d.m }; }), mo = 0, it = 0, budget = ds.reduce(function (s, d) { return s + d.m; }, 0) + v.x, fin = {};
        while (ds.some(function (d) { return d.b > 0.005; }) && mo < 600) { mo++; ds.forEach(function (d) { if (d.b > 0) { var x = d.b * d.r; it += x; d.b += x; } }); var left = budget;
          ds.forEach(function (d) { if (d.b > 0) { var p = Math.min(d.m, d.b); d.b -= p; left -= p; } });
          ds.slice().sort(order).forEach(function (d) { if (d.b > 0 && left > 0) { var p = Math.min(left, d.b); d.b -= p; left -= p; } });
          ds.forEach(function (d) { if (d.b <= 0.005 && !fin[d.n]) fin[d.n] = mo; }); }
        return { mo: mo, it: it, fin: fin }; }
      var A = sim(function (a, b) { return b.r - a.r; }), S = sim(function (a, b) { return a.b - b.b; });
      if (A.mo >= 600) throw "还款额不够覆盖利息，债务越滚越多";
      return { big: ["雪崩法还清", A.mo + " 个月"], kv: [["雪崩法总利息", y(A.it)], ["雪球法还清", S.mo + " 个月"], ["雪球法总利息", y(S.it)]], table: { h: ["债务", "雪崩法第几月还清", "雪球法第几月还清"], r: base.map(function (d) { return [d.n, A.fin[d.n] || "—", S.fin[d.n] || "—"]; }) }, note: "雪崩法利息最少；雪球法先清掉小额债务，更有成就感。" };
    } });

  /* ======================= 房产置业 ======================= */
  add({ cat: "property", id: "housing-deduction", name: "房贷利息 / 住房租金个税扣除", desc: "专项附加扣除每年能少交多少个税", kw: "专项附加扣除 房贷利息 住房租金 个税",
    fields: [{ k: "t", l: "类型", t: "sel", o: [[1000, "首套房贷利息（1000/月）"], [1500, "租房：直辖市、省会、计划单列市（1500/月）"], [1100, "租房：人口超 100 万城市（1100/月）"], [800, "租房：其他城市（800/月）"]], v: 1000 }, { k: "s", l: "本人扣除比例", t: "sel", o: [[100, "100%"], [50, "50%（夫妻各扣一半）"]], v: 100 }, { k: "r", l: "你的个税边际税率", t: "sel", o: MARG, v: 10 }],
    run: function (v) { var d = v.t === 1000 ? v.t * v.s / 100 : v.t; return { big: ["每年少交", y(d * 12 * v.r / 100)], kv: [["每月扣除额", y(d)]], note: "房贷利息和住房租金只能二选一。租房扣除只能由签订租赁合同的承租人扣除；房贷利息夫妻可选一方全扣或婚前各自首套各扣 50%。" }; } });

  add({ cat: "property", id: "agency-fee", name: "二手房中介费计算器", desc: "按成交价和费率算中介费，买卖双方分担", kw: "中介费 佣金 链家 二手房",
    fields: [{ k: "p", l: "成交价", u: "万元", v: 300 }, { k: "r", l: "中介费率", u: "%", v: 2 }, { k: "b", l: "买方承担比例", u: "%", v: 100 }],
    run: function (v) { pos(v.p); need(v.r, v.b); var f0 = v.p * 1e4 * v.r / 100; return { big: ["中介费", y(f0)], kv: [["买方", y(f0 * v.b / 100)], ["卖方", y(f0 * (1 - v.b / 100))]], note: "大型中介一般 2%–3%（部分城市已降至 1.5% 以下），可协商；另有贷款服务费、权证费等可能单独收取。" }; } });

  add({ cat: "property", id: "loan-progress", name: "房贷已还进度", desc: "还了几期后，已还本金、利息和剩余本金", kw: "已还本金 剩余本金 还款进度",
    fields: [{ k: "p", l: "贷款金额", u: "万元", v: 150 }, { k: "r", l: "年利率", u: "%", v: 3.1 }, { k: "n", l: "贷款年限", u: "年", v: 30 }, { k: "k", l: "已还期数", u: "期", v: 36 }, { k: "m", l: "还款方式", t: "sel", o: ["等额本息", "等额本金"] }],
    run: function (v) {
      pos(v.p, v.n); need(v.r, v.k); var P = v.p * 1e4, r = v.r / 1200, N = v.n * 12, k = Math.min(v.k, N), bal, paidI;
      if (v.m === "等额本息") { var m = pmt(P, r, N); bal = r ? P * Math.pow(1 + r, k) - m * (Math.pow(1 + r, k) - 1) / r : P - m * k; paidI = m * k - (P - bal); }
      else { var pr = P / N; bal = P - pr * k; paidI = r * (P * k - pr * k * (k - 1) / 2); }
      return { big: ["剩余本金", wy(bal)], kv: [["已还本金", wy(P - bal)], ["已还利息", wy(paidI)], ["本金进度", pct((P - bal) / P, 1)], ["剩余期数", N - k + " 期"]] };
    } });

  add({ cat: "property", id: "home-value-comps", name: "房屋估价（同小区成交对比）", desc: "按同小区近期成交单价，修正楼层、朝向、装修后估算总价", kw: "房屋估价 二手房 成交价",
    fields: [{ k: "c", l: "近期成交单价（元/㎡）", t: "text", v: "32000, 33500, 31000, 34000" }, { k: "a", l: "面积", u: "㎡", v: 89 }, { k: "adj", l: "修正（楼层、朝向、装修等）", u: "%", v: 0, hint: "比参考房源好填正数" }],
    run: function (v) { var C = nums(v.c); pos(v.a); need(v.adj); C.sort(function (a, b) { return a - b; }); var avg = C.reduce(function (s, x) { return s + x; }, 0) / C.length, med = C.length % 2 ? C[(C.length - 1) / 2] : (C[C.length / 2 - 1] + C[C.length / 2]) / 2, u = med * (1 + v.adj / 100); return { big: ["估价约", wy(u * v.a)], kv: [["参考单价（中位数）", y(u) + "/㎡"], ["平均单价", y(avg) + "/㎡"], ["区间", wy(C[0] * v.a * (1 + v.adj / 100)) + " – " + wy(C[C.length - 1] * v.a * (1 + v.adj / 100))]] }; } });

  add({ cat: "property", id: "maintenance-fund", name: "住宅专项维修资金", desc: "买房时要交的公共维修基金估算", kw: "维修基金 维修资金 交房",
    fields: [{ k: "m", l: "计算方式", t: "sel", o: ["按每平方米", "按房价比例"] }, { k: "a", l: "建筑面积", u: "㎡", v: 100 }, { k: "u", l: "每平方米标准", u: "元", v: 100, show: function (v) { return v.m === "按每平方米"; } }, { k: "p", l: "房价", u: "万元", v: 300, show: function (v) { return v.m !== "按每平方米"; } }, { k: "r", l: "比例", u: "%", v: 2, show: function (v) { return v.m !== "按每平方米"; } }],
    run: function (v) { pos(v.a); var x = v.m === "按每平方米" ? v.a * v.u : v.p * 1e4 * v.r / 100; if (!ok(x)) throw "请填写完整"; return { big: ["维修资金", y(x)], note: "一般为当地住宅建筑安装工程每平方米造价的 5%–8%，具体标准以当地住建部门为准。" }; } });

  add({ cat: "property", id: "building-depreciation", name: "房屋成新率 / 折旧", desc: "按建筑结构和已使用年限估算房屋成新率", kw: "成新率 房屋折旧 房龄",
    fields: [{ k: "s", l: "结构", t: "sel", o: [[60, "钢筋混凝土（60 年）"], [50, "砖混（50 年）"], [40, "砖木（40 年）"]], v: 60 }, { k: "y", l: "已使用年限", u: "年", v: 18 }, { k: "c", l: "重置造价", u: "元/㎡", v: 3000 }, { k: "a", l: "建筑面积", u: "㎡", v: 90 }],
    run: function (v) { need(v.y, v.c, v.a); var r = Math.max(1 - v.y / v.s, 0); return { big: ["成新率", pct(r, 0)], kv: [["剩余经济寿命", Math.max(v.s - v.y, 0) + " 年"], ["建筑物现值", wy(v.c * v.a * r)]], note: "按直线法估算，不含土地价值。" }; } });

  /* ======================= 汽车出行 ======================= */
  add({ cat: "auto", id: "ncd", name: "车险无赔款优待系数（NCD）", desc: "按出险次数和连续未出险年数估算商业险折扣", kw: "ncd 车险 出险 系数 续保",
    fields: [{ k: "s", l: "情况", t: "sel", drop: true, o: [[0.5, "连续 4 年及以上未出险"], [0.6, "连续 3 年未出险"], [0.7, "连续 2 年未出险"], [0.8, "上年未出险"], [1, "新车 / 上年出险 1 次"], [1.2, "上年出险 2 次"], [1.4, "上年出险 3 次"], [1.6, "上年出险 4 次"], [2, "上年出险 5 次及以上"]], v: 0.8 }, { k: "b", l: "商业险基准保费", u: "元", v: 4000 }],
    run: function (v) { need(v.b); return { big: ["NCD 系数", v.s], kv: [["商业险约", y(v.b * v.s)], ["与系数 1.0 相比", (v.s <= 1 ? "省 " : "多 ") + y(Math.abs(v.b * (1 - v.s)))]], note: "2020 年车险综改后全国统一 NCD 0.5–2.0（北京、厦门等少数地区不同），最终保费还乘以自主定价系数。小剐蹭自己付钱往往比出险划算。" }; } });

  add({ cat: "auto", id: "vehicle-tax", name: "车船税查询", desc: "按排量查乘用车每年车船税范围", kw: "车船税 排量 交强险",
    fields: [{ k: "d", l: "排量", t: "sel", drop: true, o: [["60-360", "1.0 L 及以下"], ["300-540", "1.0–1.6 L"], ["360-660", "1.6–2.0 L"], ["660-1200", "2.0–2.5 L"], ["1200-2400", "2.5–3.0 L"], ["2400-3600", "3.0–4.0 L"], ["3600-5400", "4.0 L 以上"], ["0-0", "纯电 / 插混 / 燃料电池"]], v: "360-660" }],
    run: function (v) { var r = String(v.d).split("-").map(Number); return { big: ["每年", r[1] ? r[0] + " – " + r[1] + " 元" : "免征"], note: r[1] ? "具体金额由各省在法定幅度内确定（如 1.6–2.0 L 多数省份 420–480 元），随交强险一起缴纳。" : "新能源车免征车船税。" }; } });

  add({ cat: "auto", id: "annual-inspection", name: "汽车年检时间", desc: "非营运小客车按注册日期算哪年上线检测、哪年免检领标", kw: "年检 免检 6年 上线",
    fields: [{ k: "d", l: "初次登记日期", t: "date", v: "2020-05-20" }],
    run: function (v) {
      var r0 = D(v.d), rs = [], t = today(); for (var yr = 2; yr <= 20; yr += (yr < 10 ? 2 : yr < 15 ? 1 : 0.5)) { var x = addMonths(r0, Math.round(yr * 12)); if (x < plus(t, -366)) continue; rs.push([iso(x), yr < 10 ? (yr === 6 ? "上线检验" : "免检，申领检验标志") : yr === 10 ? "上线检验" : "上线检验（" + (yr < 15 ? "每年" : "每半年") + "）"]); if (rs.length >= 6) break; }
      var nx = rs.filter(function (r) { return D(r[0]) >= t; })[0];
      return { big: ["下次", nx ? nx[0] + " " + nx[1] : "—"], table: { h: ["到期日", "方式"], r: rs }, note: "2022 年 10 月起：非营运小微型载客汽车 10 年内第 6、10 年上线检验，其余年份免检领标；10–15 年每年一次，15 年以上每半年一次。可在到期前 3 个月内办理。" };
    } });

  add({ cat: "auto", id: "license-renewal", name: "驾照换证时间", desc: "按初次领证日期算有效期和换证时间", kw: "驾照 换证 有效期 6年 10年",
    fields: [{ k: "d", l: "初次领证日期", t: "date", v: "2021-07-15" }],
    run: function (v) { var a = D(v.d), b = addMonths(a, 72), c = addMonths(b, 120), t = today(), nx = t < b ? b : c; return { big: ["下次换证", iso(nx)], kv: [["第一个有效期（6 年）到", iso(b)], ["第二个有效期（10 年）到", iso(c)], ["可提前办理", "到期前 90 天内，即 " + iso(plus(nx, -90)) + " 起"]], note: "每个记分周期都未记满 12 分的，换发 10 年有效期，再之后换发长期有效。可在交管 12123 App 办理。" }; } });

  add({ cat: "auto", id: "ev-winter-range", name: "电车冬季续航估算", desc: "按标称续航和气温估算冬季实际能跑多远", kw: "冬季续航 掉电 电车 低温",
    fields: [{ k: "r", l: "CLTC 标称续航", u: "km", v: 550 }, { k: "t", l: "气温", u: "°C", v: -5 }, { k: "h", l: "热管理", t: "sel", o: [[1, "热泵空调"], [0, "PTC 加热"]], v: 1 }, { k: "s", l: "主要路况", t: "sel", o: [[0.85, "城市"], [0.75, "高速 110 km/h"]], v: 0.85 }],
    run: function (v) { pos(v.r); need(v.t); var loss = v.t >= 20 ? 0 : v.t >= 10 ? .08 : v.t >= 0 ? .18 : v.t >= -10 ? .3 : .42; loss *= v.h ? .8 : 1.15; var real = v.r * v.s * (1 - Math.min(loss, .6)); return { big: ["实际续航约", f(real, 0) + " km"], kv: [["相比标称", pct(real / v.r, 0)]], note: "CLTC 本身偏乐观，常温实际约 75%–85%。冬季提前预热电池、座椅加热代替暖风能明显减少掉电。" }; } });

  add({ cat: "auto", id: "tire-life", name: "轮胎更换提醒", desc: "按花纹深度、生产日期和里程判断轮胎该不该换", kw: "轮胎 花纹深度 dot 更换",
    fields: [{ k: "d", l: "花纹深度", u: "mm", v: 3.5 }, { k: "w", l: "生产周年（DOT 后四位）", t: "text", v: "2321" }, { k: "km", l: "已行驶", u: "km", v: 45000 }],
    run: function (v) {
      need(v.d, v.km); var m = String(v.w).match(/^(\d{2})(\d{2})$/); if (!m) throw "DOT 后四位如 2321（2021 年第 23 周）"; var mfg = new Date(2000 + +m[2], 0, 1 + (+m[1] - 1) * 7), age = dayDiff(mfg, today()) / 365.25;
      var why = []; if (v.d <= 1.6) why.push("花纹已到 1.6 mm 磨损标记"); else if (v.d < 3) why.push("花纹低于 3 mm，雨天抓地明显下降"); if (age >= 6) why.push("胎龄超过 6 年"); if (v.km >= 60000) why.push("里程超过 6 万公里");
      return { big: [why.length ? "建议更换" : "暂时不用换", why.join("；") || "状态良好"], kv: [["生产日期", "20" + m[2] + " 年第 " + +m[1] + " 周"], ["胎龄", f(age, 1) + " 年"]], note: "法规最低花纹深度 1.6 mm。新胎约 8 mm。" };
    } });

  add({ cat: "auto", id: "car-loan-real-rate", name: "车贷真实年化利率", desc: "按贷款额、月供或手续费算真实年化（IRR）", kw: "车贷 真实利率 手续费 0息",
    fields: [{ k: "p", l: "贷款金额", u: "元", v: 100000 }, { k: "n", l: "期数", u: "月", v: 36 }, { k: "m", l: "月供", u: "元", v: 3000 }, { k: "fee", l: "一次性手续费 / 金融服务费 / GPS 费", u: "元", v: 3000 }],
    run: function (v) { pos(v.p, v.n, v.m); need(v.fee); var cf = [-(v.p - v.fee)]; for (var i = 0; i < v.n; i++) cf.push(v.m); var r = irr(cf); if (!ok(r)) throw "数据不合理，月供总额低于到手金额"; return { big: ["真实年化", pct(Math.pow(1 + r, 12) - 1)], kv: [["名义年化（APR）", pct(r * 12)], ["总利息 + 费用", y(v.m * v.n - v.p + v.fee)]], note: "“0 息”“低息”车贷常把成本藏在手续费里，按实际到手金额算才是真实利率。" }; } });

  /* ======================= 健康健身 ======================= */
  add({ cat: "health", id: "lipid-convert", name: "血脂单位换算", desc: "胆固醇、甘油三酯 mmol/L 与 mg/dL 互换并判断是否偏高", kw: "血脂 胆固醇 甘油三酯 低密度",
    fields: [{ k: "t", l: "项目", t: "sel", o: [["tc", "总胆固醇 TC"], ["ldl", "低密度脂蛋白 LDL-C"], ["hdl", "高密度脂蛋白 HDL-C"], ["tg", "甘油三酯 TG"]], v: "ldl" }, { k: "x", l: "数值", v: 3.6 }, { k: "u", l: "单位", t: "sel", o: ["mmol/L", "mg/dL"] }],
    run: function (v) {
      pos(v.x); var k = v.t === "tg" ? 88.57 : 38.67, mm = v.u === "mmol/L" ? v.x : v.x / k, R = { tc: [5.2, 6.2, "理想 < 5.2"], ldl: [3.4, 4.1, "理想 < 3.4（有心血管风险者更低）"], hdl: [1.0, null, "≥ 1.0 为宜"], tg: [1.7, 2.3, "理想 < 1.7"] }[v.t];
      var lv = v.t === "hdl" ? (mm < 1 ? "偏低" : "合适") : mm < R[0] ? "合适" : mm < R[1] ? "边缘升高" : "升高";
      return { big: [lv, f(mm, 2) + " mmol/L · " + f(mm * k, 0) + " mg/dL"], kv: [["参考", R[2]]], note: "参考《中国血脂管理指南（2023 年）》。" };
    } });

  add({ cat: "health", id: "uric-acid", name: "尿酸单位换算", desc: "μmol/L 与 mg/dL 互换，判断高尿酸血症", kw: "尿酸 痛风 高尿酸",
    fields: [{ k: "x", l: "尿酸值", v: 450 }, { k: "u", l: "单位", t: "sel", o: ["μmol/L", "mg/dL"] }],
    run: function (v) { pos(v.x); var um = v.u === "μmol/L" ? v.x : v.x * 59.48; return { big: [um > 420 ? "高尿酸血症" : um >= 360 ? "偏高" : "正常", f(um, 0) + " μmol/L · " + f(um / 59.48, 1) + " mg/dL"], note: "非同日两次空腹血尿酸 > 420 μmol/L 诊断高尿酸血症。痛风患者建议控制在 360 以下。" }; } });

  add({ cat: "health", id: "egfr", name: "肾小球滤过率 eGFR", desc: "按血肌酐、年龄、性别估算 eGFR（CKD-EPI 2021）", kw: "肾功能 肌酐 egfr ckd",
    fields: [{ k: "c", l: "血肌酐", u: "μmol/L", v: 80 }, { k: "a", l: "年龄", u: "岁", v: 40 }, { k: "s", l: "性别", t: "sel", o: ["男", "女"] }],
    run: function (v) { pos(v.c, v.a); var scr = v.c / 88.4, fm = v.s === "女", k = fm ? .7 : .9, al = fm ? -.241 : -.302, e = 142 * Math.pow(Math.min(scr / k, 1), al) * Math.pow(Math.max(scr / k, 1), -1.2) * Math.pow(.9938, v.a) * (fm ? 1.012 : 1); var st = e >= 90 ? "G1 正常或偏高" : e >= 60 ? "G2 轻度下降" : e >= 45 ? "G3a 轻到中度下降" : e >= 30 ? "G3b 中到重度下降" : e >= 15 ? "G4 重度下降" : "G5 肾衰竭"; return { big: ["eGFR", f(e, 0) + " mL/min/1.73㎡"], tag: st, note: "仅供参考，需结合尿蛋白等由医生判断。" }; } });

  add({ cat: "health", id: "vital-signs", name: "各年龄正常心率 / 呼吸", desc: "新生儿到成人的正常心率、呼吸频率参考", kw: "心率 呼吸频率 正常值 儿童",
    fields: [{ k: "a", l: "年龄段", t: "sel", drop: true, o: [["120-160,30-60", "新生儿（0–28 天）"], ["100-160,30-40", "婴儿（1–12 月）"], ["90-150,24-40", "幼儿（1–3 岁）"], ["80-140,22-34", "学龄前（3–6 岁）"], ["70-120,18-30", "学龄（6–12 岁）"], ["60-100,12-20", "青少年 / 成人"]], v: "60-100,12-20" }, { k: "hr", l: "实测心率（可选）", u: "次/分", v: 72 }],
    run: function (v) { var p = String(v.a).split(","), hr = p[0].split("-").map(Number), kv = [["正常心率", p[0] + " 次/分"], ["正常呼吸", p[1] + " 次/分"]]; var tag = ok(v.hr) ? (v.hr < hr[0] ? "心率偏慢" : v.hr > hr[1] ? "心率偏快" : "心率正常") : null; return { big: ["参考范围", p[0] + " 次/分"], tag: tag, kv: kv, note: "安静、清醒状态下测量。哭闹、发热、运动后会升高。" }; } });

  add({ cat: "health", id: "sleep-efficiency", name: "睡眠效率计算器", desc: "躺床时间和实际睡着时间，算睡眠效率", kw: "睡眠效率 失眠 睡眠质量",
    fields: [{ k: "b", l: "上床时间", t: "text", v: "23:00" }, { k: "w", l: "起床时间", t: "text", v: "07:30" }, { k: "l", l: "入睡用时", u: "分钟", v: 30 }, { k: "a", l: "夜里醒着的时间", u: "分钟", v: 20 }],
    run: function (v) {
      function p(s) { var m = String(s).match(/^(\d{1,2})[:：](\d{2})$/); if (!m) throw "时间格式如 23:00"; return +m[1] * 60 + +m[2]; } need(v.l, v.a); var bed = (p(v.w) - p(v.b) + 1440) % 1440 || 1440, sl = bed - v.l - v.a; if (sl <= 0) throw "睡着时间为负"; var e = sl / bed;
      return { big: ["睡眠效率", pct(e, 0)], tag: e >= .85 ? "良好" : e >= .75 ? "一般" : "偏低", kv: [["在床", f(bed / 60, 1) + " 小时"], ["实际睡着", f(sl / 60, 1) + " 小时"]], note: "睡眠效率 ≥ 85% 为好。效率低时，缩短躺床时间、睡不着就起床，反而有助于改善。" };
    } });

  add({ cat: "health", id: "fetal-weight", name: "胎儿体重估算", desc: "按 B 超双顶径、腹围、股骨长估算胎儿体重（Hadlock）", kw: "胎儿体重 b超 双顶径 腹围 股骨长",
    fields: [{ k: "bpd", l: "双顶径 BPD", u: "mm", v: 85 }, { k: "ac", l: "腹围 AC", u: "mm", v: 300 }, { k: "fl", l: "股骨长 FL", u: "mm", v: 65 }],
    run: function (v) { pos(v.bpd, v.ac, v.fl); var b = v.bpd / 10, a = v.ac / 10, l = v.fl / 10, w = Math.pow(10, 1.335 - .0034 * a * l + .0316 * b + .0457 * a + .1623 * l); return { big: ["估计体重", f(w, 0) + " g"], kv: [["误差范围（±15%）", f(w * .85, 0) + " – " + f(w * 1.15, 0) + " g"]], note: "B 超估重误差一般在 10%–15%，以产检医生判断为准。" }; } });

  add({ cat: "health", id: "weight-loss-percent", name: "减重百分比", desc: "已经减了多少百分比，离目标还差多少", kw: "减重 减肥 百分比 进度",
    fields: [{ k: "a", l: "起始体重", u: "kg", v: 80 }, { k: "b", l: "当前体重", u: "kg", v: 74 }, { k: "t", l: "目标体重", u: "kg", v: 68 }, { k: "w", l: "已经过周数", u: "周", v: 8 }],
    run: function (v) { pos(v.a, v.b); need(v.t, v.w); var lost = v.a - v.b, kv = [["已减", f(lost, 1) + " kg"], ["目标进度", v.a !== v.t ? pct(lost / (v.a - v.t), 0) : "—"], ["还差", f(v.b - v.t, 1) + " kg"]]; if (v.w > 0) { var rate = lost / v.w; kv.push(["平均每周", f(rate, 2) + " kg"]); if (rate > 0 && v.b > v.t) kv.push(["按此速度还需", f((v.b - v.t) / rate, 0) + " 周"]); } return { big: ["已减重", pct(lost / v.a, 1)], kv: kv, note: "减掉体重的 5%–10% 就能明显改善血压、血糖。每周 0.5–1 kg 较健康。" }; } });

  /* ======================= 数学计算 ======================= */
  add({ cat: "math", id: "percent-error", name: "百分比误差 / 相对误差", desc: "测量值与真实值的绝对误差、相对误差", kw: "误差 相对误差 百分比误差",
    fields: [{ k: "m", l: "测量值", v: 9.6 }, { k: "t", l: "真实值 / 理论值", v: 9.8 }],
    run: function (v) { need(v.m, v.t); if (!v.t) throw "真实值不能为 0"; return { big: ["相对误差", pct(Math.abs(v.m - v.t) / Math.abs(v.t), 3)], kv: [["绝对误差", g(Math.abs(v.m - v.t), 10)], ["偏差方向", v.m > v.t ? "偏大" : v.m < v.t ? "偏小" : "无偏差"]] }; } });

  add({ cat: "math", id: "map-scale", name: "比例尺计算器", desc: "图上距离与实际距离互换", kw: "比例尺 图上距离 实际距离",
    fields: [{ k: "s", l: "比例尺 1 :", v: 50000 }, { k: "m", l: "已知", t: "sel", o: ["图上距离（cm）", "实际距离（km）"] }, { k: "x", l: "数值", v: 4 }],
    run: function (v) { pos(v.s, v.x); return v.m[0] === "图" ? { big: ["实际距离", g(v.x * v.s / 1e5, 6) + " km"], kv: [["米", g(v.x * v.s / 100, 6) + " m"]] } : { big: ["图上距离", g(v.x * 1e5 / v.s, 6) + " cm"] }; } });

  add({ cat: "math", id: "pythagorean", name: "勾股定理计算器", desc: "已知直角三角形任意两边求第三边", kw: "勾股定理 直角三角形 斜边",
    fields: [{ k: "a", l: "直角边 a（未知填 0）", v: 3 }, { k: "b", l: "直角边 b（未知填 0）", v: 4 }, { k: "c", l: "斜边 c（未知填 0）", v: 0 }],
    run: function (v) {
      need(v.a, v.b, v.c); var a = v.a, b = v.b, c = v.c, z = [a, b, c].filter(function (x) { return x === 0; }).length; if (z !== 1) throw "恰好留一个为 0";
      if (!c) c = Math.hypot(a, b); else if (!a) { if (c <= b) throw "斜边必须最长"; a = Math.sqrt(c * c - b * b); } else { if (c <= a) throw "斜边必须最长"; b = Math.sqrt(c * c - a * a); }
      return { kv: [["a", g(a, 10)], ["b", g(b, 10)], ["c", g(c, 10)], ["面积", g(a * b / 2, 10)], ["斜边上的高", g(a * b / c, 10)], ["锐角", g(Math.atan(a / b) * 180 / Math.PI, 6) + "° / " + g(Math.atan(b / a) * 180 / Math.PI, 6) + "°"]] };
    } });

  add({ cat: "math", id: "cubic", name: "一元三次方程求解", desc: "ax³ + bx² + cx + d = 0 的全部根（含复数根）", kw: "三次方程 求根 卡尔达诺",
    fields: [{ k: "a", l: "a", v: 1 }, { k: "b", l: "b", v: -6 }, { k: "c", l: "c", v: 11 }, { k: "d", l: "d", v: -6 }],
    run: function (v) {
      need(v.a, v.b, v.c, v.d); if (!v.a) throw "a 不能为 0（那是二次方程）"; var A = v.b / v.a, B = v.c / v.a, C = v.d / v.a, p = B - A * A / 3, q = 2 * A * A * A / 27 - A * B / 3 + C, dsc = q * q / 4 + p * p * p / 27, s = -A / 3, R = [];
      if (Math.abs(dsc) < 1e-12) { var u = Math.cbrt(-q / 2); R = [2 * u + s, -u + s, -u + s]; }
      else if (dsc > 0) { var u1 = Math.cbrt(-q / 2 + Math.sqrt(dsc)), v1 = Math.cbrt(-q / 2 - Math.sqrt(dsc)), re = -(u1 + v1) / 2 + s, im = Math.sqrt(3) / 2 * (u1 - v1); R = [u1 + v1 + s, g(re, 8) + " + " + g(Math.abs(im), 8) + "i", g(re, 8) + " − " + g(Math.abs(im), 8) + "i"]; }
      else { var r = Math.sqrt(-p / 3), ph = Math.acos(Math.max(-1, Math.min(1, -q / (2 * r * r * r)))); R = [0, 1, 2].map(function (k) { return 2 * r * Math.cos((ph + 2 * Math.PI * k) / 3) + s; }).sort(function (a, b) { return a - b; }); }
      return { kv: R.map(function (x, i) { return ["x" + "₁₂₃"[i], typeof x === "number" ? g(Math.abs(x) < 1e-10 ? 0 : x, 10) : x]; }), note: dsc > 1e-12 ? "一个实根、两个共轭复根。" : "三个实根。" };
    } });

  add({ cat: "math", id: "sort-numbers", name: "数字排序 / 去重", desc: "一串数字升序、降序排列，去重并求和", kw: "排序 去重 数字 从小到大",
    fields: [{ k: "s", l: "数字（空格或逗号分隔）", t: "area", v: "5, 3, 9, 3, 1, 7, 9" }, { k: "o", l: "顺序", t: "sel", o: ["从小到大", "从大到小"] }],
    run: function (v) { var a = nums(v.s), sorted = a.slice().sort(function (x, y2) { return v.o === "从小到大" ? x - y2 : y2 - x; }), u = sorted.filter(function (x, i) { return !i || x !== sorted[i - 1]; }); return { kv: [["排序", sorted.join(", ")], ["去重后", u.join(", ")], ["个数 / 去重后", a.length + " / " + u.length], ["和", g(a.reduce(function (s, x) { return s + x; }, 0), 10)], ["最大 / 最小", g(Math.max.apply(null, a), 10) + " / " + g(Math.min.apply(null, a), 10)]] }; } });

  add({ cat: "math", id: "weighted-average", name: "加权平均数", desc: "按各数值和权重算加权平均", kw: "加权平均 权重",
    fields: [{ k: "r", l: "数值, 权重", t: "list", cols: [{ k: "x", l: "数值", nv: "" }, { k: "w", l: "权重", nv: "" }], v: [[85, 3], [92, 2], [78, 4]] }],
    run: function (v) { var rs = v.r.filter(function (r) { return ok(r[0]) && ok(r[1]); }), W = rs.reduce(function (s, r) { return s + r[1]; }, 0); if (!rs.length || !W) throw "至少一行，权重和不能为 0"; return { big: ["加权平均", g(rs.reduce(function (s, r) { return s + r[0] * r[1]; }, 0) / W, 8)], kv: [["简单平均", g(rs.reduce(function (s, r) { return s + r[0]; }, 0) / rs.length, 8)], ["权重合计", g(W, 8)]] }; } });

  add({ cat: "math", id: "simplify-sqrt", name: "根式化简", desc: "把 √n 化成最简根式 a√b", kw: "根式 化简 最简根式 根号",
    fields: [{ k: "n", l: "根号下的数", v: 72 }, { k: "k", l: "几次根", v: 2 }],
    run: function (v) { if (!Number.isInteger(v.n) || v.n < 1 || v.n > 1e12) throw "请输入正整数"; if (!Number.isInteger(v.k) || v.k < 2 || v.k > 10) throw "次数 2–10"; var a = 1, b = v.n; for (var p = 2; Math.pow(p, v.k) <= b; p++) { var pk = Math.pow(p, v.k); while (b % pk === 0) { a *= p; b /= pk; } } var rt = v.k === 2 ? "√" : v.k === 3 ? "∛" : v.k + "√"; return { big: ["化简", b === 1 ? String(a) : (a === 1 ? "" : a) + rt + b], kv: [["近似值", g(Math.pow(v.n, 1 / v.k), 10)]] }; } });

  add({ cat: "math", id: "divisors", name: "约数 / 因数列表", desc: "列出一个数的所有约数、个数、约数和，判断完全数", kw: "约数 因数 完全数",
    fields: [{ k: "n", l: "正整数", v: 360 }],
    run: function (v) { if (!Number.isInteger(v.n) || v.n < 1 || v.n > 1e12) throw "请输入正整数"; var a = [], b = []; for (var i = 1; i * i <= v.n; i++) if (v.n % i === 0) { a.push(i); if (i * i !== v.n) b.unshift(v.n / i); } var all = a.concat(b), s = all.reduce(function (x, y2) { return x + y2; }, 0); return { big: ["约数个数", all.length], kv: [["约数", all.length > 200 ? all.slice(0, 200).join(", ") + " …" : all.join(", ")], ["约数和", s.toLocaleString()], ["类型", s - v.n === v.n ? "完全数" : s - v.n > v.n ? "过剩数" : "不足数"], ["是否质数", all.length === 2 ? "是" : "否"]] }; } });

  /* ======================= 单位换算 ======================= */
  unit("angular-velocity", "角速度换算器", "弧度/秒、转/分、度/秒、转/秒", "角速度 转速 rpm", [["rad/s", 1], ["转/分 rpm", 2 * Math.PI / 60], ["转/秒", 2 * Math.PI], ["度/秒", Math.PI / 180]], "转/分 rpm");
  unit("capacitance", "电容单位换算", "法拉、毫法、微法、纳法、皮法", "电容 法拉 微法 pf", [["F", 1], ["mF", 1e-3], ["μF", 1e-6], ["nF", 1e-9], ["pF", 1e-12]], "μF");
  unit("magnetic", "磁感应强度换算", "特斯拉、毫特、微特、高斯", "磁感应强度 特斯拉 高斯", [["T", 1], ["mT", 1e-3], ["μT", 1e-6], ["nT", 1e-9], ["高斯 Gs", 1e-4]], "mT");

  add({ cat: "convert", id: "video-size", name: "视频文件大小 / 码率", desc: "按码率和时长算文件大小，或按大小反推码率", kw: "码率 视频大小 比特率 mbps",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["码率求大小", "大小求码率"] }, { k: "t", l: "时长", u: "分钟", v: 60 }, { k: "b", l: "总码率（视频 + 音频）", u: "Mbps", v: 8, show: function (v) { return v.m[0] === "码"; } }, { k: "s", l: "文件大小", u: "GB", v: 2, show: function (v) { return v.m[0] !== "码"; } }],
    run: function (v) { pos(v.t); if (v.m[0] === "码") { pos(v.b); var gb = v.b * v.t * 60 / 8 / 1024; return { big: ["文件约", f(gb, 2) + " GB"], kv: [["MB", f(gb * 1024, 0) + " MB"]], note: "参考：1080p 约 5–10 Mbps，4K 约 20–50 Mbps。" }; } pos(v.s); return { big: ["平均码率", f(v.s * 1024 * 8 / (v.t * 60), 2) + " Mbps"] }; } });

  var ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" "), TENS = "  twenty thirty forty fifty sixty seventy eighty ninety".split(" ");
  function en3(n) { var s = []; if (n >= 100) { s.push(ONES[Math.floor(n / 100)] + " hundred"); n %= 100; if (n) s.push("and"); } if (n >= 20) s.push(TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "")); else if (n || !s.length) s.push(ONES[n]); return s.join(" "); }
  add({ cat: "convert", id: "number-english", name: "数字转英文", desc: "阿拉伯数字转英文读法和支票大写", kw: "数字 英文 读法 支票",
    fields: [{ k: "n", l: "数字", t: "text", v: "1234567.89" }],
    run: function (v) {
      var s = String(v.n).replace(/[,\s]/g, ""); if (!/^-?\d+(\.\d+)?$/.test(s)) throw "请输入数字"; var neg = s[0] === "-", p = s.replace("-", "").split("."), n = Number(p[0]); if (n >= 1e15) throw "不超过千万亿";
      var U = ["", " thousand", " million", " billion", " trillion"], out = [], i = 0; if (n === 0) out = ["zero"]; while (n > 0) { var c = n % 1000; if (c) out.unshift(en3(c) + U[i]); n = Math.floor(n / 1000); i++; }
      var w = (neg ? "minus " : "") + out.join(", "), dec = p[1] ? " point " + p[1].split("").map(function (d) { return ONES[+d]; }).join(" ") : "", cents = p[1] ? Math.round(Number("0." + p[1]) * 100) : 0;
      return { kv: [["英文", w + dec], ["支票写法", (out.join(" ") || "zero").toUpperCase() + " AND " + String(cents).padStart(2, "0") + "/100 ONLY"]] };
    } });

  var MORSE = { A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.", ".": ".-.-.-", ",": "--..--", "?": "..--..", "/": "-..-.", "@": ".--.-.", "!": "-.-.--", "-": "-....-", "=": "-...-", ":": "---...", "'": ".----." };
  add({ cat: "convert", id: "morse", name: "摩尔斯电码转换", desc: "英文、数字与摩尔斯电码互转", kw: "摩尔斯 摩斯密码 电码",
    fields: [{ k: "s", l: "文字或电码（电码用空格分字母、/ 分单词）", t: "area", v: "SOS HELLO" }],
    run: function (v) {
      var s = String(v.s).trim(); if (!s) throw "请输入内容";
      if (/^[.\-\s/]+$/.test(s)) { var inv = {}; for (var k in MORSE) inv[MORSE[k]] = k; return { big: ["文字", s.split(/\s*\/\s*/).map(function (w) { return w.split(/\s+/).map(function (c) { return inv[c] || "?"; }).join(""); }).join(" ")] }; }
      return { big: ["电码", s.toUpperCase().split(/\s+/).map(function (w) { return w.split("").map(function (c) { return MORSE[c] || "?"; }).join(" "); }).join(" / ")], note: "仅支持英文字母、数字和常用标点。" };
    } });

  add({ cat: "convert", id: "text-binary", name: "文字 ↔ 二进制 / 十六进制", desc: "文字按 UTF-8 转成二进制、十六进制，或反向解码", kw: "二进制 十六进制 utf8 编码",
    fields: [{ k: "m", l: "方向", t: "sel", o: ["文字 → 编码", "二进制 → 文字", "十六进制 → 文字"] }, { k: "s", l: "内容", t: "area", v: "Hi 你好" }],
    run: function (v) {
      var s = String(v.s); if (!s.trim()) throw "请输入内容";
      if (v.m[0] === "文") { var b = Array.from(new TextEncoder().encode(s)); return { kv: [["二进制", b.map(function (x) { return x.toString(2).padStart(8, "0"); }).join(" ")], ["十六进制", b.map(function (x) { return x.toString(16).padStart(2, "0").toUpperCase(); }).join(" ")], ["字节数", b.length], ["Unicode", Array.from(s).map(function (c) { return "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"); }).join(" ")]] }; }
      var base = v.m[0] === "二" ? 2 : 16, parts = base === 2 ? s.replace(/[^01]/g, "").match(/.{1,8}/g) : s.replace(/[^0-9a-f]/gi, "").match(/.{1,2}/g); if (!parts) throw "没有可解码的内容";
      try { return { big: ["文字", new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(parts.map(function (p) { return parseInt(p, base); })))] }; } catch (e) { throw "不是有效的 UTF-8 编码"; }
    } });

  /* ======================= 日期时间 ======================= */
  add({ cat: "date", id: "duration-sum", name: "时长累加计算器", desc: "把多个时:分:秒加起来，比如视频、课时、工时总长", kw: "时长 累加 总时长 时分秒",
    fields: [{ k: "s", l: "每行一个时长（如 1:23:45 或 12:30）", t: "area", v: "1:23:45\n45:10\n2:05:00\n38:20" }],
    run: function (v) {
      var L = String(v.s).split(/[\n,，]+/).map(function (x) { return x.trim(); }).filter(Boolean); if (!L.length) throw "请输入时长"; var tot = 0;
      L.forEach(function (x) { var p = x.split(/[:：]/).map(Number); if (p.some(isNaN) || p.length > 3) throw "无法识别：" + x; tot += p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? p[0] * 60 + p[1] : p[0] * 60; });
      var h = Math.floor(tot / 3600), m = Math.floor(tot % 3600 / 60), s = Math.round(tot % 60);
      return { big: ["合计", h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0")], kv: [["共", L.length + " 段"], ["小时", g(tot / 3600, 4)], ["分钟", g(tot / 60, 4)], ["平均每段", (function () { var a = tot / L.length; return Math.floor(a / 3600) + ":" + String(Math.floor(a % 3600 / 60)).padStart(2, "0") + ":" + String(Math.round(a % 60)).padStart(2, "0"); })()]], note: "两段式按 分:秒 理解，单个数字按分钟。" };
    } });

  add({ cat: "date", id: "recurring-dates", name: "周期日期列表", desc: "每隔几天、几周或几个月重复的日期，比如吃药、换滤芯、还款", kw: "周期 重复 每隔 提醒日期",
    fields: [{ k: "d", l: "开始日期", t: "date", v: "today" }, { k: "n", l: "每隔", v: 2 }, { k: "u", l: "单位", t: "sel", o: ["周", "天", "月"] }, { k: "c", l: "列出几次", v: 10 }],
    run: function (v) { pos(v.n); if (!Number.isInteger(v.c) || v.c < 1 || v.c > 100) throw "次数 1–100"; var s = D(v.d), r = []; for (var i = 0; i < v.c; i++) { var x = v.u === "月" ? addMonths(s, v.n * i) : plus(s, v.n * i * (v.u === "周" ? 7 : 1)); r.push(["第 " + (i + 1) + " 次", day(x)]); } return { table: { h: ["次数", "日期"], r: r } }; } });

  add({ cat: "date", id: "birthday-weekdays", name: "未来生日是星期几", desc: "列出未来十年生日分别是星期几，找周末的那年", kw: "生日 星期几 周末",
    fields: [{ k: "d", l: "生日（公历）", t: "date", v: "2000-06-15" }, { k: "n", l: "列出几年", v: 10 }],
    run: function (v) { var b = D(v.d), Y = today().getFullYear(), n = Math.min(Math.max(Math.round(v.n) || 10, 1), 50), r = []; for (var i = 0; i < n; i++) { var x = new Date(Y + i, b.getMonth(), b.getDate()); if (x.getMonth() !== b.getMonth()) x = new Date(Y + i, b.getMonth() + 1, 0); r.push([Y + i, iso(x), WK[x.getDay()] + (x.getDay() % 6 === 0 ? " 🎉" : ""), Y + i - b.getFullYear() + " 岁"]); } return { table: { h: ["年份", "日期", "星期", "满"], r: r } }; } });

  add({ cat: "date", id: "julian-day", name: "儒略日计算器", desc: "日期时间与儒略日（JD）、简化儒略日（MJD）互换", kw: "儒略日 jd mjd 天文",
    fields: [{ k: "m", l: "方向", t: "sel", o: ["日期 → 儒略日", "儒略日 → 日期"] }, { k: "t", l: "UTC 时间", t: "dt", v: nowDT(), show: function (v) { return v.m[0] === "日"; } }, { k: "j", l: "儒略日", v: 2461322.5, show: function (v) { return v.m[0] !== "日"; } }],
    run: function (v) { if (v.m[0] === "日") { var t = Date.parse(v.t + ":00Z"); if (isNaN(t)) throw "请选择时间"; var jd = t / 864e5 + 2440587.5; return { big: ["儒略日 JD", g(jd, 6)], kv: [["简化儒略日 MJD", g(jd - 2400000.5, 6)]] }; } need(v.j); var d = new Date((v.j - 2440587.5) * 864e5); if (isNaN(d)) throw "超出范围"; return { big: ["UTC", d.toISOString().replace("T", " ").slice(0, 19)] }; } });

  add({ cat: "date", id: "flight-arrival", name: "跨时区到达时间", desc: "按出发当地时间、飞行时长和两地时区算到达当地时间", kw: "航班 到达时间 时差 飞行",
    fields: [{ k: "t", l: "出发时间（出发地当地）", t: "dt", v: "2026-12-20T13:30" }, { k: "a", l: "出发地 UTC 偏移", u: "小时", v: 8 }, { k: "b", l: "到达地 UTC 偏移", u: "小时", v: -8, hint: "北京 +8，东京 +9，伦敦 0（夏令时 +1），洛杉矶 −8（夏令时 −7）" }, { k: "h", l: "飞行时长 时", v: 11 }, { k: "m", l: "分", v: 20 }],
    run: function (v) { need(v.a, v.b, v.h, v.m); var t = Date.parse(v.t + ":00Z"); if (isNaN(t)) throw "请选择出发时间"; var arr = new Date(t + (v.h * 60 + v.m) * 6e4 + (v.b - v.a) * 36e5), dd = Math.round((Date.UTC(arr.getUTCFullYear(), arr.getUTCMonth(), arr.getUTCDate()) - Date.UTC(+v.t.slice(0, 4), +v.t.slice(5, 7) - 1, +v.t.slice(8, 10))) / 864e5); return { big: ["到达当地时间", arr.toISOString().slice(0, 16).replace("T", " ")], kv: [["日期变化", dd === 0 ? "当天到达" : (dd > 0 ? "+" : "") + dd + " 天"], ["时差", (v.b - v.a > 0 ? "+" : "") + (v.b - v.a) + " 小时"]] }; } });

  var CITIES = [["39.9042,116.4074,8", "北京"], ["31.2304,121.4737,8", "上海"], ["23.1291,113.2644,8", "广州"], ["22.5431,114.0579,8", "深圳"], ["30.5728,104.0668,8", "成都"], ["29.563,106.5516,8", "重庆"], ["30.2741,120.1551,8", "杭州"], ["34.3416,108.9398,8", "西安"], ["30.5928,114.3055,8", "武汉"], ["45.8038,126.5349,8", "哈尔滨"], ["43.8256,87.6168,8", "乌鲁木齐"], ["29.65,91.1,8", "拉萨"], ["18.2528,109.5119,8", "三亚"], ["22.3193,114.1694,8", "香港"], ["35.6762,139.6503,9", "东京"], ["37.3541,-121.9552,-7", "圣克拉拉（夏令时）"]];
  add({ cat: "date", id: "sunrise-sunset", name: "日出日落时间", desc: "按城市或经纬度算某天的日出、日落、正午和白昼时长", kw: "日出 日落 白昼 黄金时刻",
    fields: [{ k: "c", l: "城市", t: "sel", drop: true, o: CITIES.concat([["custom", "自定义经纬度"]]), v: "39.9042,116.4074,8" }, { k: "lat", l: "纬度", v: 30, show: function (v) { return v.c === "custom"; } }, { k: "lng", l: "经度（东经为正）", v: 120, show: function (v) { return v.c === "custom"; } }, { k: "tz", l: "时区 UTC+", v: 8, show: function (v) { return v.c === "custom"; } }, { k: "d", l: "日期", t: "date", v: "today" }],
    run: function (v) {
      var p = v.c === "custom" ? [v.lat, v.lng, v.tz] : String(v.c).split(",").map(Number); need(p[0], p[1], p[2]); var d = D(v.d), N = dayDiff(new Date(d.getFullYear(), 0, 1), d) + 1, gm = 2 * Math.PI / 365 * (N - 1), rad = Math.PI / 180;
      var eq = 229.18 * (.000075 + .001868 * Math.cos(gm) - .032077 * Math.sin(gm) - .014615 * Math.cos(2 * gm) - .040849 * Math.sin(2 * gm)), dec = .006918 - .399912 * Math.cos(gm) + .070257 * Math.sin(gm) - .006758 * Math.cos(2 * gm) + .000907 * Math.sin(2 * gm) - .002697 * Math.cos(3 * gm) + .00148 * Math.sin(3 * gm);
      var cosH = Math.cos(90.833 * rad) / (Math.cos(p[0] * rad) * Math.cos(dec)) - Math.tan(p[0] * rad) * Math.tan(dec), noon = 720 - 4 * p[1] - eq + p[2] * 60;
      if (cosH > 1) return { big: ["极夜", "当天太阳不升起"], kv: [["正午", hm(noon)]] }; if (cosH < -1) return { big: ["极昼", "当天太阳不落"], kv: [["正午", hm(noon)]] };
      var ha = Math.acos(cosH) / rad, rise = noon - 4 * ha, set = noon + 4 * ha;
      return { big: ["日出 " + hm(rise), "日落 " + hm(set)], kv: [["正午（太阳最高）", hm(noon)], ["白昼时长", Math.floor(8 * ha / 60) + " 小时 " + Math.round(8 * ha % 60) + " 分"], ["正午太阳高度角", f(90 - Math.abs(p[0] - dec / rad), 1) + "°"]], note: "按 NOAA 算法估算，误差约 1–2 分钟；山区、高楼遮挡会让实际看到的时间更晚。" };
    } });

  add({ cat: "date", id: "moon-phase", name: "月相查询", desc: "某天的月相、月龄和亮面比例，下一次满月和新月", kw: "月相 满月 新月 月龄",
    fields: [{ k: "d", l: "日期", t: "date", v: "today" }],
    run: function (v) {
      var P = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14), t = D(v.d).getTime() + 12 * 36e5, age = (((t - ref) / 864e5) % P + P) % P, ill = (1 - Math.cos(2 * Math.PI * age / P)) / 2;
      var names = [[1.85, "🌑 新月（朔）"], [5.54, "🌒 娥眉月"], [9.23, "🌓 上弦月"], [12.92, "🌔 盈凸月"], [16.61, "🌕 满月（望）"], [20.3, "🌖 亏凸月"], [23.99, "🌗 下弦月"], [27.68, "🌘 残月"], [P + 1, "🌑 新月（朔）"]], nm = names.filter(function (n) { return age < n[0]; })[0][1];
      var full = new Date(t + ((14.765 - age + P) % P) * 864e5), nw = new Date(t + ((P - age) % P) * 864e5);
      return { big: ["月相", nm], kv: [["月龄", f(age, 1) + " 天"], ["亮面", pct(ill, 0)], ["下次满月约", iso(full)], ["下次新月约", iso(nw)]], note: "按平均朔望月推算，误差可能有半天左右。" };
    } });

  /* ======================= 生活实用 ======================= */
  add({ cat: "life", id: "budget-503020", name: "50/30/20 预算分配", desc: "把收入分成必要开支、想要的、储蓄三份", kw: "预算 记账 50 30 20 存钱",
    fields: [{ k: "i", l: "月税后收入", u: "元", v: 12000 }, { k: "a", l: "必要开支比例", u: "%", v: 50 }, { k: "b", l: "弹性消费比例", u: "%", v: 30 }],
    run: function (v) { pos(v.i); need(v.a, v.b); var c = 100 - v.a - v.b; if (c < 0) throw "两项合计不能超过 100%"; return { table: { h: ["类别", "比例", "每月（元）"], r: [["必要开支（房租、餐饮、交通、保险）", v.a + "%", f(v.i * v.a / 100, 0)], ["弹性消费（娱乐、购物、旅行）", v.b + "%", f(v.i * v.b / 100, 0)], ["储蓄 / 还债 / 投资", c + "%", f(v.i * c / 100, 0)]] }, kv: [["一年可存", y(v.i * c / 100 * 12)]] }; } });

  add({ cat: "life", id: "water-heating-cost", name: "热水器费用对比", desc: "电热水器、燃气热水器、空气能热水器每月洗澡要花多少", kw: "热水器 燃气 电热水器 空气能",
    fields: [{ k: "l", l: "每天热水用量", u: "升", v: 150 }, { k: "dt", l: "升温（出水 − 进水）", u: "°C", v: 30 }, { k: "e", l: "电价", u: "元/kWh", v: 0.6 }, { k: "gp", l: "燃气价", u: "元/m³", v: 3 }],
    run: function (v) { need(v.l, v.dt, v.e, v.gp); var kwh = v.l * 4.186 * v.dt / 3600, m = 30; return { table: { h: ["类型", "每月（元）", "每年（元）"], r: [["电热水器（效率 95%）", f(kwh / .95 * v.e * m, 0), f(kwh / .95 * v.e * 365, 0)], ["燃气热水器（效率 88%）", f(kwh * 3.6 / 36 / .88 * v.gp * m, 0), f(kwh * 3.6 / 36 / .88 * v.gp * 365, 0)], ["空气能热水器（COP 3.5）", f(kwh / 3.5 * v.e * m, 0), f(kwh / 3.5 * v.e * 365, 0)]] }, kv: [["每天加热能耗", f(kwh, 2) + " kWh"]], note: "天然气热值按 36 MJ/m³。一人洗澡约 40–60 升 40 °C 热水。" }; } });

  add({ cat: "life", id: "cadr", name: "空气净化器 CADR 选购", desc: "按房间面积算需要多大 CADR，或按 CADR 算适用面积", kw: "空气净化器 cadr 适用面积",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["房间面积", "净化器 CADR"] }, { k: "x", l: "面积（㎡）/ CADR（m³/h）", v: 25 }, { k: "h", l: "层高", u: "m", v: 2.7 }],
    run: function (v) { pos(v.x, v.h); return v.m === "房间面积" ? { big: ["建议 CADR ≥", f(v.x * v.h * 5, 0) + " m³/h"], kv: [["国标估算", f(v.x / .1, 0) + " m³/h"]], note: "按每小时换气 5 次估算。有过敏或想快速净化，选更大一档。" } : { big: ["适用面积", f(v.x * .07, 0) + " – " + f(v.x * .12, 0) + " ㎡"], kv: [["按 5 次/时换气", f(v.x / v.h / 5, 0) + " ㎡"]], note: "GB/T 18801 适用面积 = CADR × (0.07–0.12)。" }; } });

  add({ cat: "life", id: "taxi-fare", name: "出租车打车费估算", desc: "按起步价、里程费、低速费和夜间加价估算车费", kw: "打车 出租车 车费 起步价",
    fields: [{ k: "d", l: "里程", u: "km", v: 12 }, { k: "w", l: "低速 / 等候时间", u: "分钟", v: 10 }, { k: "b", l: "起步价", u: "元", v: 13 }, { k: "bk", l: "起步里程", u: "km", v: 3 }, { k: "p", l: "每公里", u: "元", v: 2.3 }, { k: "lw", l: "每分钟低速费", u: "元", v: 0.5 }, { k: "far", l: "远途加价（超 15 km 部分）", u: "%", v: 50 }, { k: "n", l: "夜间加价", t: "sel", o: [[0, "否"], [20, "是（+20%）"]], v: 0 }],
    run: function (v) { pos(v.d); need(v.w, v.b, v.bk, v.p, v.lw, v.far); var k = Math.max(v.d - v.bk, 0), far = Math.max(v.d - 15, 0), fare = (v.b + k * v.p + far * v.p * v.far / 100) * (1 + v.n / 100) + v.w * v.lw; return { big: ["车费约", y(fare)], kv: [["每公里约", y(fare / v.d)]], note: "默认按北京标准（起步 13 元 3 公里，2.3 元/公里），各城市不同；另有燃油附加费、过路费。" }; } });

  add({ cat: "life", id: "utility-split", name: "水电费按天分摊", desc: "合租时按每人实际住的天数分摊水电燃气费", kw: "水电费 分摊 合租 按天",
    fields: [{ k: "t", l: "账单总额", u: "元", v: 450 }, { k: "p", l: "每人（名字, 住了几天）", t: "list", cols: [{ k: "n", l: "名字", t: "text", nv: "" }, { k: "d", l: "天数", nv: "" }], v: [["A", 30], ["B", 30], ["C", 12]] }],
    run: function (v) { pos(v.t); var rs = rows(v.p).filter(function (r) { return r[1] > 0; }), td = rs.reduce(function (s, r) { return s + r[1]; }, 0); if (!rs.length) throw "至少一人"; return { table: { h: ["名字", "天数", "应付（元）"], r: rs.map(function (r, i) { return [String(r[0]).trim() || "室友" + (i + 1), r[1], f(v.t * r[1] / td)]; }) }, kv: [["每人每天", y(v.t / td)]] }; } });

  add({ cat: "life", id: "resale-value", name: "二手转卖估价", desc: "按购买价、使用时长和品类折旧估算二手能卖多少", kw: "二手 转卖 闲鱼 折旧 估价",
    fields: [{ k: "p", l: "购买价", u: "元", v: 6000 }, { k: "m", l: "已使用", u: "月", v: 18 }, { k: "c", l: "品类", t: "sel", drop: true, o: [[35, "手机（年贬值约 35%）"], [25, "笔记本 / 平板（约 25%）"], [30, "相机机身（约 30%）"], [15, "镜头（约 15%）"], [20, "家电（约 20%）"], [10, "大牌包表（约 10%）"], [40, "游戏机 / 显卡（约 40%）"]], v: 35 }, { k: "q", l: "成色", t: "sel", o: [[1, "几乎全新"], [.9, "轻微使用痕迹"], [.75, "明显磨损"]], v: .9 }],
    run: function (v) { pos(v.p); need(v.m); var val = v.p * Math.pow(1 - v.c / 100, v.m / 12) * v.q; return { big: ["估计售价", y(val)], kv: [["保值率", pct(val / v.p, 0)], ["每月使用成本", y((v.p - val) / Math.max(v.m, 1))]], note: "按品类经验折旧率估算，热门型号、带包装配件更保值。挂价可比估价高 5%–10% 留砍价空间。" }; } });

  add({ cat: "life", id: "cost-per-use", name: "单次使用成本", desc: "贵的东西用得多可能更划算：按价格和使用次数算每次成本", kw: "单次成本 划算 性价比",
    fields: [{ k: "a", l: "A 价格", u: "元", v: 1200 }, { k: "au", l: "A 预计使用次数", v: 300 }, { k: "b", l: "B 价格", u: "元", v: 300 }, { k: "bu", l: "B 预计使用次数", v: 50 }],
    run: function (v) { pos(v.a, v.au, v.b, v.bu); var x = v.a / v.au, z = v.b / v.bu; return { big: [x < z ? "A 更划算" : x > z ? "B 更划算" : "一样", "每次省 " + y(Math.abs(x - z))], kv: [["A 每次", y(x)], ["B 每次", y(z)], ["A 用多少次才比 B 划算", Math.ceil(v.a / z) + " 次"]] }; } });

  /* ======================= 教育学业 ======================= */
  var IT = [[9, "118–120"], [8.5, "115–117"], [8, "110–114"], [7.5, "102–109"], [7, "94–101"], [6.5, "79–93"], [6, "60–78"], [5.5, "46–59"], [5, "35–45"], [4.5, "32–34"], [4, "0–31"]];
  add({ cat: "edu", id: "ielts-toefl", name: "雅思托福分数对照", desc: "雅思总分与托福 iBT 分数互查（ETS 官方对照）", kw: "雅思 托福 对照 换算",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["雅思", "托福"] }, { k: "x", l: "分数", v: 7 }],
    run: function (v) { need(v.x); if (v.m === "雅思") { var r = IT.filter(function (t) { return v.x >= t[0]; })[0]; return { big: ["托福约", r ? r[1] : "低于 32"] }; } var hit = IT.filter(function (t) { var a = t[1].split("–").map(Number); return v.x >= a[0] && v.x <= a[1]; })[0]; if (!hit) throw "托福 0–120"; return { big: ["雅思约", String(hit[0])] }; } });

  var SA = [[36, 1590], [35, 1540], [34, 1500], [33, 1460], [32, 1430], [31, 1400], [30, 1370], [29, 1340], [28, 1310], [27, 1280], [26, 1240], [25, 1210], [24, 1180], [23, 1140], [22, 1110], [21, 1080], [20, 1040], [19, 1010], [18, 970], [17, 930], [16, 890], [15, 850], [14, 800], [13, 760], [12, 710], [11, 670], [10, 630], [9, 590]];
  add({ cat: "edu", id: "sat-act", name: "SAT / ACT 分数换算", desc: "SAT 总分与 ACT 综合分对照（College Board 2018 对照表）", kw: "sat act 美本 换算",
    fields: [{ k: "m", l: "已知", t: "sel", o: ["SAT", "ACT"] }, { k: "x", l: "分数", v: 1400 }],
    run: function (v) { need(v.x); if (v.m === "SAT") { if (v.x < 400 || v.x > 1600) throw "SAT 400–1600"; var r = SA.filter(function (s) { return v.x >= s[1] - 20; })[0]; return { big: ["ACT 约", r ? String(r[0]) : "9 以下"] }; } var a = SA.filter(function (s) { return s[0] === Math.round(v.x); })[0]; if (!a) throw "ACT 9–36"; return { big: ["SAT 约", String(a[1])] }; } });

  add({ cat: "edu", id: "study-abroad-cost", name: "留学费用估算", desc: "学费、生活费、机票按汇率折成人民币总预算", kw: "留学 费用 学费 生活费",
    fields: [{ k: "t", l: "每年学费（外币）", v: 40000 }, { k: "l", l: "每月生活费（外币）", v: 1800 }, { k: "n", l: "年数", v: 2 }, { k: "x", l: "汇率（1 外币 = ? 元）", v: 7.1 }, { k: "f", l: "每年往返机票（人民币）", v: 12000 }, { k: "o", l: "一次性（签证、保证金外的杂费，人民币）", v: 20000 }],
    run: function (v) { pos(v.n, v.x); need(v.t, v.l, v.f, v.o); var a = (v.t + v.l * 12) * v.x + v.f, tot = a * v.n + v.o; return { big: ["总预算约", wy(tot)], kv: [["每年约", wy(a)], ["学费占比", pct(v.t * v.x * v.n / tot, 0)]], note: "签证资金证明一般要求覆盖第一年学费加生活费。" }; } });

  add({ cat: "edu", id: "gaokao-countdown", name: "高考倒计时", desc: "离高考还有多少天、多少周，按每天学习时长算剩余学习时间", kw: "高考 倒计时 考试",
    fields: [{ k: "d", l: "考试日期", t: "date", v: (function () { var t = new Date(), yr = t.getMonth() > 5 || (t.getMonth() === 5 && t.getDate() > 7) ? t.getFullYear() + 1 : t.getFullYear(); return yr + "-06-07"; })() }, { k: "h", l: "每天有效学习", u: "小时", v: 10 }],
    run: function (v) { need(v.h); var n = dayDiff(today(), D(v.d)); if (n < 0) throw "考试日期已过"; return { big: ["还有", n + " 天"], kv: [["约", f(n / 7, 1) + " 周"], ["剩余学习时间", f(n * v.h, 0) + " 小时"], ["周末", Math.floor(n / 7) + " 个"]] }; } });

  add({ cat: "edu", id: "graduation-year", name: "毕业时间 / 现在几年级", desc: "按入学年份和学制算毕业时间和当前年级", kw: "毕业 学制 几年级 本科 硕士",
    fields: [{ k: "y", l: "入学年份", v: 2024 }, { k: "s", l: "学制", t: "sel", o: [[4, "本科 4 年"], [5, "本科 5 年（医学、建筑）"], [3, "专科 / 硕士 3 年"], [2, "硕士 2 年"], [6, "小学 6 年"], [4.01, "博士 4 年"]], v: 4 }],
    run: function (v) { need(v.y); var len = Math.round(v.s), t = today(), cur = t.getFullYear() - v.y + (t.getMonth() >= 8 ? 1 : 0); return { big: ["毕业", v.y + len + " 年 6–7 月"], kv: [["当前", cur < 1 ? "尚未入学" : cur > len ? "已毕业" : (v.s === 6 ? cur + " 年级" : "第 " + cur + " 学年（大" + "一二三四五六"[cur - 1] + "）")], ["秋招季", v.y + len - 1 + " 年 9–11 月"]] }; } });

  add({ cat: "edu", id: "attendance-rate", name: "出勤率 / 还能缺几次", desc: "按总课时和缺勤次数算出勤率，按学校规定算还能请几次假", kw: "出勤率 缺勤 旷课 取消考试资格",
    fields: [{ k: "t", l: "总课次", v: 32 }, { k: "a", l: "已缺勤", v: 4 }, { k: "r", l: "缺勤超过多少取消考试资格", u: "%", v: 33.3 }],
    run: function (v) { pos(v.t, v.r); need(v.a); var lim = Math.floor(v.t * v.r / 100); return { big: ["出勤率", pct((v.t - v.a) / v.t, 1)], kv: [["最多可缺", lim + " 次"], ["还能缺", Math.max(lim - v.a, 0) + " 次"]], tag: v.a > lim ? "已超限" : null, note: "多数高校规定缺课超过该课程学时 1/3 不能参加考试，以本校规定为准。" }; } });

  /* ======================= 商业财税 ======================= */
  add({ cat: "biz", id: "daily-wage", name: "日工资 / 请假扣款", desc: "按 21.75 天计薪日算日薪、时薪和请假扣款", kw: "日工资 21.75 请假 扣款 时薪",
    fields: [{ k: "s", l: "月工资", u: "元", v: 10000 }, { k: "d", l: "请假天数", u: "天", v: 2 }, { k: "m", l: "扣款基数", t: "sel", o: [[21.75, "21.75 计薪日"], [0, "当月应出勤天数"]], v: 21.75 }, { k: "w", l: "当月应出勤天数", v: 22, show: function (v) { return Number(v.m) === 0; } }],
    run: function (v) { pos(v.s); need(v.d); var base = Number(v.m) || v.w; pos(base); var dw = v.s / base; return { big: ["日工资", y(dw)], kv: [["时薪", y(dw / 8)], ["请假扣款", y(dw * v.d)], ["实发约", y(v.s - dw * v.d)]], note: "人社部规定月计薪天数为 21.75 天，加班费按此计算；请假扣款口径以公司制度为准。" }; } });

  add({ cat: "biz", id: "probation-pay", name: "试用期工资 / 期限", desc: "按合同期限算试用期最长多久，试用期工资最低多少", kw: "试用期 工资 80% 劳动合同",
    fields: [{ k: "c", l: "劳动合同期限", t: "sel", o: [[0, "不满 3 个月"], [1, "3 个月以上不满 1 年"], [2, "1 年以上不满 3 年"], [6, "3 年以上或无固定期限"]], v: 6 }, { k: "s", l: "约定转正工资", u: "元", v: 10000 }, { k: "m", l: "当地最低工资", u: "元", v: 2420 }],
    run: function (v) { need(v.s, v.m); return { big: ["试用期最长", v.c ? v.c + " 个月" : "不得约定试用期"], kv: [["试用期工资不低于", y(Math.max(v.s * .8, v.m))]], note: "《劳动合同法》第 19、20 条：同一用人单位与同一劳动者只能约定一次试用期；试用期工资不得低于本单位相同岗位最低档工资或约定工资的 80%，且不低于当地最低工资。" }; } });

  add({ cat: "biz", id: "maternity-allowance", name: "生育津贴计算器", desc: "按单位上年度职工月平均工资和产假天数算生育津贴", kw: "生育津贴 产假工资 生育保险",
    fields: [{ k: "w", l: "单位上年度职工月平均工资", u: "元", v: 12000 }, { k: "d", l: "产假天数", u: "天", v: 158, hint: "国家 98 天 + 各省延长（多为 158 天左右）；难产 +15，多胞胎每多 1 个 +15" }, { k: "s", l: "本人月工资（对比）", u: "元", v: 10000 }],
    run: function (v) { pos(v.w, v.d); need(v.s); var a = v.w / 30 * v.d; return { big: ["生育津贴", y(a)], kv: [["日津贴", y(v.w / 30)], ["产假期间工资（对比）", y(v.s / 30 * v.d)]], note: "生育津贴高于本人工资的按津贴发；低于本人工资的，多数地区由单位补足差额。具体以当地医保局政策为准。" }; } });

  add({ cat: "biz", id: "safety-stock", name: "安全库存 / 再订货点", desc: "按日均销量波动和到货周期算安全库存和再订货点", kw: "安全库存 再订货点 补货",
    fields: [{ k: "a", l: "日均销量", v: 50 }, { k: "s", l: "日销量标准差", v: 12 }, { k: "l", l: "补货周期", u: "天", v: 7 }, { k: "z", l: "服务水平", t: "sel", o: [[1.28, "90%"], [1.65, "95%"], [2.05, "98%"], [2.33, "99%"]], v: 1.65 }],
    run: function (v) { need(v.a, v.s); pos(v.l); var ss = v.z * v.s * Math.sqrt(v.l); return { big: ["安全库存", f(Math.ceil(ss), 0)], kv: [["再订货点", f(Math.ceil(v.a * v.l + ss), 0)], ["周期内平均需求", f(v.a * v.l, 0)]] }; } });

  add({ cat: "biz", id: "equity-dilution", name: "融资股权稀释", desc: "按投前估值和融资额算投资人占比，以及创始人被稀释后的股份", kw: "股权稀释 投前估值 融资 期权池",
    fields: [{ k: "pre", l: "投前估值", u: "万元", v: 4000 }, { k: "i", l: "本轮融资", u: "万元", v: 1000 }, { k: "o", l: "新增期权池（投后）", u: "%", v: 0 }, { k: "f", l: "你本轮前的持股", u: "%", v: 60 }],
    run: function (v) { pos(v.pre, v.i); need(v.o, v.f); var post = v.pre + v.i, inv = v.i / post, keep = 1 - inv - v.o / 100; return { big: ["投后估值", f(post, 0) + " 万元"], kv: [["投资人占", pct(inv, 2)], ["你稀释后", pct(v.f / 100 * keep, 2)], ["稀释比例", pct(1 - keep, 2)]] }; } });

  add({ cat: "biz", id: "valuation-multiple", name: "市盈率 / 市销率估值", desc: "按净利润 × PE、营收 × PS 估算公司估值和每股价值", kw: "市盈率 pe ps 估值 市值",
    fields: [{ k: "p", l: "年净利润", u: "万元", v: 2000 }, { k: "pe", l: "市盈率 PE", v: 20 }, { k: "r", l: "年营收", u: "万元", v: 15000 }, { k: "ps", l: "市销率 PS", v: 3 }, { k: "sh", l: "总股本（可选）", u: "万股", v: 10000 }],
    run: function (v) { need(v.p, v.pe, v.r, v.ps); var a = v.p * v.pe, b = v.r * v.ps, kv = [["按 PE", f(a, 0) + " 万元"], ["按 PS", f(b, 0) + " 万元"]]; if (ok(v.sh) && v.sh > 0) { kv.push(["每股（PE）", y(a / v.sh)]); kv.push(["每股（PS）", y(b / v.sh)]); } return { big: ["估值区间", f(Math.min(a, b), 0) + " – " + f(Math.max(a, b), 0) + " 万元"], kv: kv }; } });

  add({ cat: "biz", id: "partner-split", name: "合伙人利润分配", desc: "按出资比例和人力占比分配利润", kw: "合伙 分红 利润分配 股份",
    fields: [{ k: "p", l: "可分配利润", u: "元", v: 300000 }, { k: "w", l: "出资部分占比（其余按人力分）", u: "%", v: 60 }, { k: "r", l: "合伙人（名字, 出资, 人力份额）", t: "list", cols: [{ k: "n", l: "名字", t: "text", nv: "" }, { k: "c", l: "出资", nv: "" }, { k: "l", l: "人力份额", nv: "" }], v: [["A", 300000, 1], ["B", 100000, 2], ["C", 100000, 1]] }],
    run: function (v) { pos(v.p); need(v.w); var rs = v.r.filter(function (r) { return ok(r[1]) && ok(r[2]); }); if (rs.length < 2) throw "至少两位"; var C = rs.reduce(function (s, r) { return s + r[1]; }, 0), L = rs.reduce(function (s, r) { return s + r[2]; }, 0); return { table: { h: ["合伙人", "占比", "分得（元）"], r: rs.map(function (r, i) { var s = (C ? r[1] / C : 0) * v.w / 100 + (L ? r[2] / L : 0) * (1 - v.w / 100); return [String(r[0]).trim() || "合伙人" + (i + 1), pct(s, 1), f(v.p * s, 0)]; }) } }; } });

  add({ cat: "biz", id: "runway", name: "现金跑道（Runway）", desc: "按账上现金和每月净烧钱算还能撑几个月", kw: "runway 烧钱 现金流 创业",
    fields: [{ k: "c", l: "账上现金", u: "万元", v: 500 }, { k: "e", l: "每月支出", u: "万元", v: 60 }, { k: "r", l: "每月收入", u: "万元", v: 20 }, { k: "g", l: "收入月增长", u: "%", v: 5 }],
    run: function (v) { pos(v.c); need(v.e, v.r, v.g); var cash = v.c, rev = v.r, m = 0; while (cash > 0 && m < 240) { cash -= v.e - rev; rev *= 1 + v.g / 100; m++; if (rev >= v.e) break; } var be = rev >= v.e; return { big: [be && cash > 0 ? "第 " + m + " 个月盈亏平衡" : "还能撑", be && cash > 0 ? "现金不会耗尽" : m + " 个月"], kv: [["当前月净烧", f(v.e - v.r, 1) + " 万元"], ["不增长时可撑", v.e > v.r ? f(v.c / (v.e - v.r), 1) + " 个月" : "不烧钱"], ["耗尽日期约", be && cash > 0 ? "—" : iso(addMonths(today(), m))]], note: "一般建议在跑道剩 6–9 个月前启动下一轮融资。" }; } });

  /* ======================= 工程建筑 ======================= */
  add({ cat: "build", id: "steel-weight", name: "钢材重量计算器", desc: "钢板、圆钢、钢管、方管的理论重量", kw: "钢材重量 钢板 钢管 圆钢 理论重量",
    fields: [{ k: "t", l: "类型", t: "sel", o: ["钢板", "圆钢", "圆钢管", "方管"] }, { k: "a", l: "宽 / 直径 / 外径 / 边长", u: "mm", v: 50 }, { k: "b", l: "厚度 / 壁厚（圆钢不填）", u: "mm", v: 3 }, { k: "l", l: "长度", u: "m", v: 6 }, { k: "n", l: "数量", v: 1 }],
    run: function (v) { pos(v.a, v.l); need(v.n); var kgm; if (v.t === "钢板") { pos(v.b); kgm = v.a / 1000 * v.b * 7.85; } else if (v.t === "圆钢") kgm = .00617 * v.a * v.a; else { pos(v.b); if (v.b * 2 >= v.a) throw "壁厚太大"; kgm = v.t === "圆钢管" ? .02466 * (v.a - v.b) * v.b : .0157 * v.b * (2 * v.a - 2.86 * v.b); } return { big: ["总重", f(kgm * v.l * v.n, 2) + " kg"], kv: [["每米重", f(kgm, 3) + " kg/m"], ["单根重", f(kgm * v.l, 2) + " kg"]], note: "钢密度按 7.85 g/cm³。不锈钢约乘 1.01，铝约乘 0.345。" }; } });

  add({ cat: "build", id: "lumber-volume", name: "木材方数计算器", desc: "按长宽厚和根数算木材立方数和价格", kw: "木材 方数 立方 木方",
    fields: [{ k: "l", l: "长", u: "m", v: 4 }, { k: "w", l: "宽", u: "cm", v: 10 }, { k: "t", l: "厚", u: "cm", v: 5 }, { k: "n", l: "根数", v: 50 }, { k: "p", l: "单价", u: "元/m³", v: 2200 }],
    run: function (v) { pos(v.l, v.w, v.t, v.n); need(v.p); var m3 = v.l * v.w / 100 * v.t / 100 * v.n; return { big: ["总方数", f(m3, 3) + " m³"], kv: [["单根", f(m3 / v.n, 4) + " m³"], ["总价", y(m3 * v.p)], ["1 方可出", f(1 / (m3 / v.n), 1) + " 根"]] }; } });

  add({ cat: "build", id: "tank-volume", name: "水箱 / 水池容积", desc: "圆柱形、长方体水箱的容积和装水重量", kw: "水箱 水池 容积 水塔",
    fields: [{ k: "s", l: "形状", t: "sel", o: ["圆柱（立式）", "长方体"] }, { k: "a", l: "直径 / 长", u: "m", v: 1.2 }, { k: "b", l: "宽（圆柱不填）", u: "m", v: 1 }, { k: "h", l: "高度 / 水深", u: "m", v: 1.5 }],
    run: function (v) { pos(v.a, v.h); var V = v.s[0] === "圆" ? Math.PI * v.a * v.a / 4 * v.h : (pos(v.b), v.a * v.b * v.h); return { big: ["容积", f(V, 3) + " m³"], kv: [["升", f(V * 1000, 0) + " L"], ["装满水重", f(V, 2) + " 吨"]] }; } });

  add({ cat: "build", id: "breaker-size", name: "空开 / 电线选型", desc: "按用电功率算电流，推荐空气开关和铜线规格", kw: "空开 断路器 电线 平方 功率 电流",
    fields: [{ k: "p", l: "总功率", u: "W", v: 5500 }, { k: "u", l: "电压", t: "sel", o: [[220, "220 V 单相"], [380, "380 V 三相"]], v: 220 }, { k: "pf", l: "功率因数", v: 0.9 }],
    run: function (v) { pos(v.p, v.pf); var I = v.u === 380 ? v.p / (Math.sqrt(3) * 380 * v.pf) : v.p / (220 * v.pf), need0 = I * 1.25, br = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100].filter(function (b) { return b >= need0; })[0], W = [[16, "1.5 ㎟"], [25, "2.5 ㎟"], [32, "4 ㎟"], [40, "6 ㎟"], [63, "10 ㎟"], [80, "16 ㎟"], [100, "25 ㎟"]], w = (W.filter(function (x) { return x[0] >= (br || 999); })[0] || [0, "需专业设计"])[1]; return { big: ["工作电流", f(I, 1) + " A"], kv: [["推荐空开", br ? br + " A" : "超过 100 A，需专业设计"], ["铜线建议", w]], note: "按 1.25 倍余量选空开，电线按家装明敷 / 穿管经验载流量。电热水器、空调等大功率电器建议单独回路。" }; } });

  add({ cat: "build", id: "aac-block", name: "加气块 / 砌块用量", desc: "按墙面积和砌块规格算加气块数量和立方数", kw: "加气块 砌块 隔墙 轻质砖",
    fields: [{ k: "l", l: "墙长", u: "m", v: 5 }, { k: "h", l: "墙高", u: "m", v: 2.8 }, { k: "o", l: "门窗洞口面积", u: "㎡", v: 2 }, { k: "t", l: "砌块厚度", t: "sel", o: [[100, "100 mm"], [150, "150 mm"], [200, "200 mm"], [240, "240 mm"]], v: 200 }],
    run: function (v) { pos(v.l, v.h); need(v.o); var A = v.l * v.h - v.o, n = Math.ceil(A / (.6 * .2) * 1.05); return { big: ["加气块", n + " 块"], kv: [["砌筑面积", f(A, 2) + " ㎡"], ["体积", f(A * v.t / 1000, 2) + " m³"], ["专用粘结剂约", f(A * v.t / 1000 * 25, 0) + " kg"]], note: "按 600 × 200 mm 规格、5% 损耗。" }; } });

  add({ cat: "build", id: "pipe-flow", name: "管道流量 / 流速", desc: "按管径和流速算流量，或按流量算流速", kw: "流量 流速 管径 水泵",
    fields: [{ k: "d", l: "管道内径", u: "mm", v: 50 }, { k: "m", l: "已知", t: "sel", o: ["流速（m/s）", "流量（m³/h）"] }, { k: "x", l: "数值", v: 1.5 }],
    run: function (v) { pos(v.d, v.x); var A = Math.PI * Math.pow(v.d / 2000, 2); return v.m[0] === "流" && v.m[1] === "速" ? { big: ["流量", f(A * v.x * 3600, 2) + " m³/h"], kv: [["升/秒", f(A * v.x * 1000, 2) + " L/s"]], note: "给水管经济流速一般 1.0–2.0 m/s。" } : { big: ["流速", f(v.x / 3600 / A, 2) + " m/s"], kv: [["升/秒", f(v.x / 3.6, 2) + " L/s"]] }; } });

  /* ======================= 科学工程 ======================= */
  add({ cat: "science", id: "lc-resonance", name: "LC 谐振频率", desc: "f = 1 / (2π√LC)，按电感电容算谐振频率", kw: "谐振 lc 电感 电容 频率",
    fields: [{ k: "l", l: "电感", u: "μH", v: 10 }, { k: "c", l: "电容", u: "pF", v: 100 }],
    run: function (v) { pos(v.l, v.c); var L = v.l * 1e-6, C = v.c * 1e-12, fr = 1 / (2 * Math.PI * Math.sqrt(L * C)); return { big: ["谐振频率", fr >= 1e6 ? g(fr / 1e6, 6) + " MHz" : fr >= 1e3 ? g(fr / 1e3, 6) + " kHz" : g(fr, 6) + " Hz"], kv: [["特性阻抗 √(L/C)", g(Math.sqrt(L / C), 6) + " Ω"], ["波长", g(299792458 / fr, 6) + " m"]] }; } });

  add({ cat: "science", id: "reactance", name: "感抗 / 容抗计算器", desc: "XL = 2πfL，XC = 1/(2πfC)", kw: "感抗 容抗 阻抗 交流",
    fields: [{ k: "f", l: "频率", u: "Hz", v: 50 }, { k: "l", l: "电感", u: "mH", v: 100 }, { k: "c", l: "电容", u: "μF", v: 10 }, { k: "r", l: "电阻（算串联阻抗）", u: "Ω", v: 20 }],
    run: function (v) { pos(v.f); need(v.l, v.c, v.r); var XL = 2 * Math.PI * v.f * v.l / 1000, XC = v.c > 0 ? 1 / (2 * Math.PI * v.f * v.c * 1e-6) : Infinity, X = XL - XC, Z = Math.hypot(v.r, X); return { kv: [["感抗 XL", g(XL, 6) + " Ω"], ["容抗 XC", ok(XC) ? g(XC, 6) + " Ω" : "—"], ["RLC 串联阻抗 |Z|", ok(Z) ? g(Z, 6) + " Ω" : "—"], ["相位角", ok(X) ? g(Math.atan2(X, v.r) * 180 / Math.PI, 5) + "°" : "—"]] }; } });

  add({ cat: "science", id: "time-dilation", name: "相对论时间膨胀", desc: "按速度算洛伦兹因子、时间膨胀和长度收缩", kw: "相对论 时间膨胀 洛伦兹 光速",
    fields: [{ k: "v", l: "速度（光速的百分之几）", u: "%", v: 90 }, { k: "t", l: "运动者经历的时间", u: "年", v: 1 }],
    run: function (v) { pos(v.v, v.t); if (v.v >= 100) throw "速度必须小于光速"; var b = v.v / 100, gm = 1 / Math.sqrt(1 - b * b); return { big: ["洛伦兹因子 γ", g(gm, 8)], kv: [["静止者经历", g(v.t * gm, 8) + " 年"], ["长度收缩为", pct(1 / gm, 3)], ["速度", g(b * 299792.458, 8) + " km/s"]] }; } });

  add({ cat: "science", id: "photon-energy", name: "光子能量计算器", desc: "按波长或频率算光子能量 E = hν", kw: "光子能量 波长 电子伏 普朗克",
    fields: [{ k: "l", l: "波长", u: "nm", v: 550 }],
    run: function (v) { pos(v.l); var h = 6.62607015e-34, c = 299792458, E = h * c / (v.l * 1e-9), band = v.l < 10 ? "X 射线" : v.l < 380 ? "紫外" : v.l < 450 ? "紫光" : v.l < 495 ? "蓝光" : v.l < 570 ? "绿光" : v.l < 590 ? "黄光" : v.l < 620 ? "橙光" : v.l < 750 ? "红光" : v.l < 1e6 ? "红外" : "微波"; return { big: ["能量", g(E / 1.602176634e-19, 6) + " eV"], kv: [["焦耳", g(E, 6) + " J"], ["频率", g(c / (v.l * 1e-9) / 1e12, 6) + " THz"], ["波段", band]] }; } });

  add({ cat: "science", id: "heat-conduction", name: "热传导计算器", desc: "按材料导热系数、面积、厚度和温差算传热功率", kw: "热传导 导热系数 保温 傅里叶",
    fields: [{ k: "k", l: "材料", t: "sel", drop: true, o: [[0.03, "聚氨酯 / 挤塑板 0.03"], [0.04, "岩棉 0.04"], [0.17, "木材 0.17"], [0.8, "红砖 0.8"], [1.7, "混凝土 1.7"], [0.96, "玻璃 0.96"], [50, "钢 50"], [237, "铝 237"], [401, "铜 401"]], v: 0.03 }, { k: "a", l: "面积", u: "㎡", v: 10 }, { k: "d", l: "厚度", u: "mm", v: 50 }, { k: "dt", l: "两侧温差", u: "°C", v: 20 }],
    run: function (v) { pos(v.a, v.d); need(v.dt); var Q = v.k * v.a * v.dt / (v.d / 1000); return { big: ["传热功率", g(Q, 6) + " W"], kv: [["每天热量", g(Q * 24 / 1000, 6) + " kWh"], ["热阻 R", g(v.d / 1000 / v.k, 5) + " ㎡·K/W"]] }; } });

  add({ cat: "science", id: "power-factor", name: "功率因数补偿", desc: "按有功功率和功率因数算视在功率、无功功率和电容补偿量", kw: "功率因数 无功补偿 电容 kvar",
    fields: [{ k: "p", l: "有功功率", u: "kW", v: 100 }, { k: "a", l: "当前功率因数", v: 0.75 }, { k: "b", l: "目标功率因数", v: 0.95 }],
    run: function (v) { pos(v.p, v.a, v.b); if (v.a > 1 || v.b > 1) throw "功率因数 ≤ 1"; var t = function (x) { return Math.tan(Math.acos(x)); }; return { big: ["需补偿", f(v.p * (t(v.a) - t(v.b)), 1) + " kvar"], kv: [["视在功率（补偿前）", f(v.p / v.a, 1) + " kVA"], ["视在功率（补偿后）", f(v.p / v.b, 1) + " kVA"], ["无功功率（补偿前）", f(v.p * t(v.a), 1) + " kvar"], ["电流降低", pct(1 - v.a / v.b, 1)]] }; } });

  add({ cat: "science", id: "battery-pack", name: "电池组串并联计算", desc: "按单体电压、容量和串并数算电池组电压、容量和能量", kw: "电池组 串联 并联 18650 锂电池",
    fields: [{ k: "v", l: "单体标称电压", u: "V", v: 3.7 }, { k: "c", l: "单体容量", u: "mAh", v: 3000 }, { k: "s", l: "串联数 S", v: 13 }, { k: "p", l: "并联数 P", v: 4 }],
    run: function (v) { pos(v.v, v.c, v.s, v.p); var V = v.v * v.s, Ah = v.c * v.p / 1000; return { big: [v.s + "S" + v.p + "P", g(V, 4) + " V · " + g(Ah, 4) + " Ah"], kv: [["能量", g(V * Ah, 5) + " Wh"], ["电芯总数", v.s * v.p + " 节"], ["满电电压（锂电 4.2 V）", g(4.2 * v.s, 4) + " V"]], note: "民航规定充电宝 ≤ 100 Wh 可随身携带，100–160 Wh 需航空公司批准。" }; } });

  add({ cat: "science", id: "wien", name: "维恩位移 / 黑体辐射", desc: "按温度算黑体辐射峰值波长和单位面积辐射功率", kw: "维恩 黑体 色温 斯特藩",
    fields: [{ k: "t", l: "温度", u: "K", v: 5778 }],
    run: function (v) { pos(v.t); var lm = 2.897771955e-3 / v.t; return { big: ["峰值波长", g(lm * 1e9, 6) + " nm"], kv: [["辐射功率（斯特藩-玻尔兹曼）", g(5.670374419e-8 * Math.pow(v.t, 4), 6) + " W/㎡"], ["摄氏温度", g(v.t - 273.15, 6) + " °C"]], note: "太阳表面约 5778 K，人体约 310 K（峰值约 9.3 μm 红外）。" }; } });
})();
