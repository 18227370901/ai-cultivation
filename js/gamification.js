/* ================= 游戏化系统: 经验 / 等级 / 成就 / 连击 ================= */
const LEVELS = ["凡人", "练气", "筑基", "金丹", "元婴", "化神", "炼虚", "合体", "大乘", "真仙"];
const XP_RULES = { comic: 10, test: 15, boss: 50, clear: 100, peek: -20, allgreen: 50 };

const BADGES = [
  { id: "b_first",  name: "首胜",       icon: "🏅", desc: "首次通关「数值茅洞」" },
  { id: "b_green",  name: "一发入魂",   icon: "🎯", desc: "某章节试炼首次运行全部全绿" },
  { id: "b_pure",   name: "清白之身",   icon: "🕊️", desc: "未看解答、未失败, 直接通关" },
  { id: "b_streak", name: "修行不辍",   icon: "🔥", desc: "连续 3 天登录" },
  { id: "b_ascend", name: "飞升",       icon: "🌈", desc: "全部境界 + 飞升试炼通关" }
];

const LS_KEY = "ai-cultivation-state-v1";
const STATE_VERSION = 1;   // 改 state 结构时 +1, 旧存档自动作废(回到初始状态)
let state = {
  v: STATE_VERSION,
  xp: 0,
  comicRead: {},     // chId -> true
  testsPassed: {},   // chId -> { testId: true }
  peeked: {},        // chId -> true (看过完整解答)
  failedRuns: {},    // chId -> 失败次数
  bossDone: {},      // chId -> true
  cleared: {},       // chId -> true
  badges: [],
  streak: { last: "", days: 0 },
  code: {}           // chId -> 编辑器当前代码
};

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // 版本不匹配 / 结构损坏 → 丢弃旧档, 使用初始状态
      if (data && data.v === STATE_VERSION) state = Object.assign(state, data);
      else console.warn("[存档] 版本不符, 已重置为初始状态");
    }
  } catch (e) {
    console.warn("[存档] 读取失败, 使用初始状态", e);
  }
}
function saveState() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }

function todayStr() { return new Date().toISOString().slice(0, 10); }

function touchStreak() {
  const t = todayStr();
  if (state.streak.last === t) return;
  const y = new Date(Date.now() - 86400e3).toISOString().slice(0, 10);
  state.streak.days = (state.streak.last === y) ? state.streak.days + 1 : 1;
  state.streak.last = t;
  if (state.streak.days >= 3) awardBadge("b_streak");
  saveState();
}

function levelOf(xp) { return Math.min(Math.floor(xp / 100), LEVELS.length - 1); }
function xpInLevel(xp) { return xp % 100; }

function addXP(n, reason) {
  state.xp = Math.max(0, state.xp + n);
  saveState();
  renderXpBar();
  const cls = n > 0 ? "xp" : "xp-neg";
  toast(`<span class="${cls}">${n > 0 ? "+" : ""}${n} XP</span> ${reason}`);
}

function toast(html) {
  const box = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = html;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

function awardBadge(id) {
  if (state.badges.includes(id)) return;
  state.badges.push(id);
  const b = BADGES.find(x => x.id === id);
  saveState();
  toast(`${b.icon} <b>成就达成</b> ${b.name} —— ${b.desc}`);
}

/* 章节进度与结算 */
function chPassCount(ch) {
  const p = state.testsPassed[ch.id] || {};
  return ch.tests.filter(t => p[t.id]).length;
}
function chAllPassed(ch) {
  const p = state.testsPassed[ch.id] || {};
  return ch.tests.every(t => p[t.id]);
}
function checkChapterClear(ch) {
  if (state.cleared[ch.id]) return;
  if (!chAllPassed(ch) || !state.bossDone[ch.id]) return;
  state.cleared[ch.id] = true;
  saveState();
  addXP(XP_RULES.clear, `境界通关奖励 · ${ch.realm}`);
  if (ch.id === "ch0") awardBadge("b_first");
  if (!state.peeked[ch.id] && !(state.failedRuns[ch.id] > 0)) awardBadge("b_pure");
  if (CHAPTERS.every(c => state.cleared[c.id])) awardBadge("b_ascend");
}

/* 小白吐槽语录 */
const MASCOT_LINES = [
  "主人, 这章的 TODO 还空着, 我的机械爪已经开始写代码了。",
  "别刷漫画了, 先写代码。剧情是安慰剂, 测试全绿才是解药。",
  "梯度下降 1000 次没学会? 你背 30 页 PPT 才学一次, 它更努力。",
  "B 矩阵记得置零, 不然上车就毁法。",
  "检索错了别先怪 LLM, 先看看你喂的是不是错的那页。"
];
