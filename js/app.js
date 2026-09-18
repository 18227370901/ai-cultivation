/* ================= 路由 + 世界地图 + 排行榜 + 个人道行 ================= */
const BOTS = [
  { name: "松鼠(机器学习_bot)", xp: 480, emoji: "🐿️" },
  { name: "熊猫(炼丹炉管理员)", xp: 360, emoji: "🐼" },
  { name: "小白本狗", xp: 300, emoji: "🐕" },
  { name: "卷王阿伟", xp: 215, emoji: "📈" },
  { name: "摸鱼道人", xp: 88, emoji: "🐟" }
];

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  touchStreak();
  window.addEventListener("hashchange", route);
  document.getElementById("nav").addEventListener("click", e => {
    if (e.target.closest("a")) { /* hash 自动跳 */ }
  });
  initMascot();
  route();
});

function chapterById(id) { return CHAPTERS.find(c => c.id === id); }
function isUnlocked(ch) {
  const i = CHAPTERS.indexOf(ch);
  if (i <= 0) return true;
  return !!state.cleared[CHAPTERS[i - 1].id];
}

function route() {
  const h = location.hash.replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  document.querySelectorAll("#nav a").forEach(a => a.classList.remove("on"));
  const target = parts[0];
  const navBtn = document.querySelector(`#nav a[data-route="${target || ""}"]`);
  if (navBtn) navBtn.classList.add("on");
  if (target === "ch" && chapterById(parts[1])) renderChapter(parts[1]);
  else if (target === "rank") renderRank();
  else if (target === "profile") renderProfile();
  else renderMap();
  renderXpBar();
}

function renderXpBar() {
  const el = document.getElementById("lvBox");
  if (!el) return;
  const lv = levelOf(state.xp);
  el.innerHTML = `<b>${LEVELS[lv]}</b> 期 · ${state.xp} XP
    <div class="xpbar"><i style="width:${xpInLevel(state.xp)}%"></i></div>`;
}

/* ---------- 世界地图 ---------- */
function renderMap() {
  const main = document.getElementById("main");
  let html = `<h1>🗺️ 修真界 · 世界地图</h1>
    <p class="sub">凡人入世九境, 从数值茅洞一路修到飞升试炼。通关前一境界, 解锁下一道门。</p>`;
  CHAPTERS.forEach(ch => {
    const unlocked = isUnlocked(ch);
    const pass = chPassCount(ch), total = ch.tests.length;
    const cls = state.cleared[ch.id] ? "cleared" : (unlocked ? "" : "locked");
    html += `
    <a class="map-item ${cls}" href="#/ch/${ch.id}">
      <div class="mi-emoji">${unlocked ? ch.emoji : "🔒"}</div>
      <div>
        <div class="mi-realm">${ch.realm}</div>
        <div class="mi-title">${ch.title}</div>
        <div class="muted">${ch.tagline}</div>
      </div>
      <div class="mi-prog">
        试炼 ${pass}/${total} ${state.bossDone[ch.id] ? '· Boss✔' : ''}
        <div class="pbar"><i style="width:${Math.round(pass / total * 100)}%"></i></div>
      </div>
    </a>`;
  });
  html += `<div class="card gold"><h3>📖 入门心法</h3>
    <p class="muted">每一境界四件套: 漫画讲经(剧情) → 功法修炼(浏览器里直接跑 Python) → 境界试炼(测试全绿) → 击败 Boss(概念题)。全绿 + Boss 即通关发令牌。</p>
    <p class="muted">提示: 代码在本页浏览器里运行(Pyodide), 不装任何东西; 点「完整解答」会扣 20 XP, 靠自己不扣。</p></div>`;
  main.innerHTML = html;
}

/* ---------- 排行榜 ---------- */
function renderRank() {
  const main = document.getElementById("main");
  const all = BOTS.map(b => ({ ...b, me: false }))
    .concat([{ name: "你(凡人)", xp: state.xp, emoji: "🧒", me: true }]);
  all.sort((a, b) => b.xp - a.xp);
  const medals = ["🥇", "🥈", "🥉", "4.", "5.", "6.", "7."];
  let html = `<h1>🏆 修真榜</h1><p class="sub">本地模拟榜: 其他修士的实力是写死的, 只有你的 XP 是真的。超过所有人, 你就是榜一。</p>`;
  all.forEach((r, i) => {
    html += `<div class="rank-row ${r.me ? "me" : ""}">
      <span class="medal">${medals[i] || (i + 1) + "."}</span>
      <span>${r.emoji} ${r.name}</span>
      <span class="r-xp">${r.xp} XP</span>
    </div>`;
  });
  main.innerHTML = html;
}

/* ---------- 个人道行 ---------- */
function renderProfile() {
  const main = document.getElementById("main");
  const lv = levelOf(state.xp);
  let html = `<h1>🧘 我的道行</h1><p class="sub">
    ${LEVELS[lv]} 期 · ${state.xp} XP · 连修 ${state.streak.days} 天 · 徽章 ${state.badges.length}/${BADGES.length}</p>`;
  html += `<div class="card"><h3>境界进度</h3>`;
  CHAPTERS.forEach(ch => {
    const p = chPassCount(ch), t = ch.tests.length;
    const done = state.cleared[ch.id];
    html += `<div class="test-item ${done ? "passed" : ""}">
      <span class="st">${done ? "✔" : isUnlocked(ch) ? "…" : "🔒"}</span>
      <span>${ch.emoji} ${ch.title}</span>
      <span style="margin-left:auto" class="muted">试炼 ${p}/${t}${state.bossDone[ch.id] ? " · Boss✔" : ""}</span>
    </div>`;
  });
  html += `</div><div class="card"><h3>🎖 成就徽章</h3><div class="badge-grid">`;
  BADGES.forEach(b => {
    const owned = state.badges.includes(b.id);
    html += `<div class="badge ${owned ? "owned" : ""}">
      <div class="b-icon">${b.icon}</div><div class="b-name">${b.name}</div>
      <div class="b-desc">${b.desc}</div></div>`;
  });
  html += `</div></div>
  <div class="card"><h3>💾 存档管理</h3>
    <div class="muted" style="margin-bottom:10px">进度只在本浏览器 localStorage。导出 JSON 可带走存档(换设备/备份), 导入会替换当前全部进度。</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" id="btn-export">⬇️ 导出存档 (JSON)</button>
      <button class="btn" id="btn-import">⬆️ 导入存档</button>
      <input type="file" id="file-import" accept=".json,.txt" style="display:none" />
    </div></div>
  <div class="card"><h3>⚠️ 危险操作</h3>
    <button class="btn" onclick="resetState()">重修一世(清空全部存档)</button>
    <span class="muted">点完就真的没了, 小白的吐槽也救不回来。真丢了可以「⬆️ 导入存档」救回。</span></div>`;
  main.innerHTML = html;

  // 导出/导入存档
  document.getElementById("btn-export").onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ai-cultivation-save.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast("存档已导出", "ok");
  };
  document.getElementById("btn-import").onclick = () => document.getElementById("file-import").click();
  document.getElementById("file-import").onchange = async e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || data.v !== STATE_VERSION) throw new Error("版本不符");
      if (!confirm(`导入存档: XP=${data.xp || 0}, 徽章${(data.badges || []).length}枚, 通关${Object.keys(data.cleared || {}).length}境。确认替换当前进度?`)) return;
      Object.assign(state, data);
      saveState();
      toast("✅ 存档已导入!", "ok");
      setTimeout(() => location.reload(), 600);
    } catch (err) {
      toast("导入失败: 存档损坏或版本不符(需 v=" + STATE_VERSION + ")", "err");
    }
  };
}

function resetState() {
  if (!confirm("确定清空全部存档重修一世? 此操作不可撤销。")) return;
  localStorage.removeItem(LS_KEY);
  location.reload();
}

/* ---------- 小白(吉祥物) ---------- */
function initMascot() {
  const m = document.getElementById("mascot");
  const tip = document.getElementById("mascot-tip");
  let i = -1, timer = null;
  m.addEventListener("click", () => {
    i = (i + 1) % MASCOT_LINES.length;
    tip.textContent = MASCOT_LINES[i];
    tip.style.display = "block";
    clearTimeout(timer);
    timer = setTimeout(() => { tip.style.display = "none"; }, 5200);
  });
  m.title = "点小我会说真话";
}
