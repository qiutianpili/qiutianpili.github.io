/* 站内搜索：首页与 404 共用。新增页面时在 IDX 加一行；新增文章时把路径放到 LATEST 最前面。 */
(function () {
  var IDX = [["近期站点更新汇总（2026 年 10 月）", "站点更新 汇总 计算器 Any Music Any Listen 文档查看器 搜索 新样式 导航", "/dryitem/site-update-2026-10.html"], ["彻底关闭 VBS：手动五步法", "bcdedit hypervisorlaunchtype 组策略 注册表 内存完整性 msinfo32 关闭 VBS", "/dryitem/disable-vbs-manual.html"], ["关闭基于虚拟化的安全性（VBS）", "DG_Readiness 内存完整性 Credential Guard Hyper-V 关闭 VBS", "/dryitem/disable-vbs.html"], ["用一行 PowerShell 命令激活 Windows / Office（MAS）", "irm https://get.activated.win | iex 激活 Windows Office", "/dryitem/mas-activate.html"], ["视频", "站内视频合集，在线播放或直接下载。", "/videos/"], ["资源中心", "秋天霹雳的资源与帮助中心。", "/assist.html"], ["计算器中心", "房贷、个税、工资到手、BMI、单位换算、日期推算等常用在线计算器，打开即用，全部在浏览器本地计算。", "/calc/"], ["Claude Desktop 对接第三方 Deepseek API Key", "Claude Desktop 对接第三方 Deepseek API Key 的图文教程。", "/claude-deepseek-apikey.html"], ["复制链接", "新年祝福分享页，一键复制分享链接。", "/copylink.html"], ["下载", "秋天霹雳的下载入口。", "/download.html"], ["PowerShell 修改文件日期方法", "用 PowerShell 修改文件的创建、修改、访问时间。", "/dryitem/PowerShellEditFileDate.html"], ["共青团基本知识", "共青团基本知识：团的性质、入团条件、团员权利义务、团旗团徽与团费，附自测题。", "/dryitem/cyl-basics.html"], ["断开远程桌面但保持会话不锁屏（tscon）", "用一行 tscon 命令把当前远程桌面会话切回本机控制台，断开 RDP 后程序继续在桌面上运行、不锁屏。", "/dryitem/rdp-tscon-console.html"], ["烟花", "在浏览器里放烟花，点击屏幕即可。", "/firework.html"], ["友链", "秋天霹雳的友链页面。", "/friends.html"], ["计算器", "在浏览器里运行的计算器，支持科学函数、亲戚称呼与年龄计算、键盘输入和历史记录。", "/hark/calculator.html"], ["项目", "秋天霹雳的全部项目：在线工具、互动小作品、专题页面与资源。", "/hark/"], ["Miku 甩葱舞", "跟着 Ievan Polkka 一起甩葱的 Miku 互动小作品。", "/hark/miku.html"], ["本地音乐播放器", "本地音乐播放器：把 MP3 拖进来直接播放，不上传任何文件。", "/hark/music-player.html"], ["太阳出逃 · 互动引力", "太阳出逃：拖动太阳甩出太阳系，长按制造引力井的互动小作品。", "/hark/sun-escape.html"], ["在线文档查看器", "在线查看 Word DOCX、Excel XLSX XLS CSV、PDF、TXT 文件，不上传。", "/hark/doc-viewer.html"], ["本地视频播放器", "本地视频播放器：拖入视频即可播放，支持字幕与截图。", "/hark/video-player.html"], ["帮助页", "常用软件与站点的快捷链接：7-Zip、Steam、微信、QQ 等。", "/help/"], ["帮助中心", "常用软件与站点的快捷链接。", "/help/main.html"], ["秋天霹雳 | 个人主页", "秋天霹雳的个人主页，收集文章、工具、下载和日常项目。", "/"], ["Be My POI by Kiku", "Be My POI by Kiku。", "/kiku/bemypoi.html"], ["Kiku", "Kiku 页面收藏。", "/kiku/"], ["项目和任务的描述及解决办法", "Linux 赛项各任务的初始化命令与配置思路整理。", "/linux/ALinux.html"], ["模块 A Linux 2 小时基础分抢分手册", "模块 A Linux 2 小时基础分抢分手册：VMware + Debian 12，按时间轴拿分，每项附验收命令。", "/linux/BLinux.html"], ["Vim 编辑器常用命令指南", "Vim 编辑器常用命令：三种模式、移动、编辑、搜索替换。", "/linux/vim.html"], ["Linux yum 命令核心指南", "Linux yum 命令核心指南：安装、更新、查询、仓库与缓存管理。", "/linux/yum.html"], ["MC HACK", "Minecraft 常见客户端合集与下载入口。", "/mchack/"], ["毛概复习资料（客观题）", "毛概客观题 249 道：单选 117、多选 72、判断 60，附正确答案，可点选自测。", "/mgtest.html"], ["文章", "秋天霹雳的全部文章、学习资料和站点更新记录。", "/posts.html"], ["性压抑指数测评", "性心理自评工具，快测与完整版", "/sri/"], ["Any Music", "在线音乐站，白名单账号登录", "https://music.20610728.xyz/"]];
  var LATEST = ["/dryitem/site-update-2026-10.html", "/dryitem/disable-vbs-manual.html", "/dryitem/disable-vbs.html", "/dryitem/mas-activate.html", "/dryitem/rdp-tscon-console.html", "/dryitem/cyl-basics.html"];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function find(v) {
    v = String(v || "").trim().toLowerCase();
    if (!v) return LATEST.map(function (u) { for (var i = 0; i < IDX.length; i++) if (IDX[i][2] === u) return IDX[i]; return null; }).filter(Boolean);
    var words = v.split(/\s+/);
    return IDX.map(function (r) {
      var t = r[0].toLowerCase(), all = (r[0] + " " + r[1] + " " + r[2]).toLowerCase(), s = 0;
      for (var i = 0; i < words.length; i++) { if (all.indexOf(words[i]) < 0) return null; s += t.indexOf(words[i]) >= 0 ? 2 : 1; }
      return [s, r];
    }).filter(Boolean).sort(function (a, b) { return b[0] - a[0]; }).slice(0, 12).map(function (x) { return x[1]; });
  }
  function html(rows, v) {
    if (!rows.length) return '<li><a href="/posts.html"><b>没有找到相关内容</b><small>去文章页看看全部内容</small></a></li>';
    return rows.map(function (r) {
      var ext = /^https?:/.test(r[2]);
      return '<li><a href="' + esc(r[2]) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + '><b>' + esc(r[0]) + "</b><small>" + esc(r[1]) + "</small></a></li>";
    }).join("");
  }
  window.SiteSearch = { IDX: IDX, LATEST: LATEST, find: find, html: html };
})();
