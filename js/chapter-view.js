/* ================= 章节视图: 讲经 / 修炼 / 试炼 / 道心笔记 ================= */
let _curCh = null;

function renderChapter(id) {
  const ch = chapterById(id);
  if (!ch || !isUnlocked(ch)) { location.hash = ""; return; }
  _curCh = ch;
  const main = document.getElementById("main");
  const tab = sessionTab(ch.id);

  let testsHtml = ch.tests.map((t, i) =>
    `<div class="test-item" id="ti-${t.id}">
      <span class="st">${state.testsPassed[ch.id] && state.testsPassed[ch.id][t.id] ? "✔" : "…"}</span>
      <span><b>${String.fromCharCode(65 + i)}</b> ${t.name}</span></div>`
  ).join("");

  main.innerHTML = `
    <div class="ch-head">
      <div class="ch-emoji">${ch.emoji}</div>
      <div>
        <div class="realm">${ch.realm}</div>
        <h2>${ch.title}</h2>
        <div class="muted">${ch.tagline}</div>
      </div>
    </div>
    <div class="tabs">
      <button class="tab ${tab === 0 ? "on" : ""}" data-tab="0">📖 讲经</button>
      <button class="tab ${tab === 1 ? "on" : ""}" data-tab="1">🐍 修炼</button>
      <button class="tab ${tab === 2 ? "on" : ""}" data-tab="2">🎯 试炼</button>
      <button class="tab ${tab === 3 ? "on" : ""}" data-tab="3">🧠 道心笔记</button>
    </div>

    <div id="pane-0" class="${tab === 0 ? "" : "hide"}">
      <div class="mode-bar">剧情基调:
        <button class="btn" id="mode-normal">🧘 正经点</button>
        <button class="btn on" id="mode-roast">🤢 欠揍点(默认)</button>
      </div>
      <div class="card"><h3>🎬 开卷</h3><div id="comic"></div></div>
      <div class="card"><h3>📜 讲经(本境三句)</h3><div id="lessons"></div></div>
      <div class="card"><button class="btn primary" id="btn-lecture">读完了, 去修炼(${state.comicRead[ch.id] ? "已领 10 XP" : "+10 XP, 只领一次"})</button></div>
    </div>

    <div id="pane-1" class="${tab === 1 ? "" : "hide"}">
      <div class="card">
        <div class="code-head">
          <span class="muted">修炼区 · 浏览器内直接运行 (Pyodide)</span>
          <span><button class="btn" id="btn-reset">重置</button>
              <button class="btn" id="btn-peek">看完整解答 ${state.peeked[ch.id] ? "" : "(扣 20 XP)"}</button></span>
        </div>
        <textarea id="editor" spellcheck="false">${(state.code[ch.id] || ch.starter).replace(/</g, "&lt;")}</textarea>
        <div class="btns">
          <button class="btn primary" id="btn-run">▶ 运行(看输出)</button>
        </div>
        <pre class="console" id="console"></pre>
        <pre id="solution" class="hide">${ch.solution.replace(/</g, "&lt;")}</pre>
      </div>
    </div>

    <div id="pane-2" class="${tab === 2 ? "" : "hide"}">
      <div class="clear-banner" id="clear-banner" style="display:none"></div>
      <div class="trial-success" id="trial-success" style="display:none">⚡ 本境试炼全绿!Boss 之门已开 👿</div>
      <div class="trial-fail-note" id="trial-fail-note" style="display:none">❌ 试炼未全绿 —— <button class="btn" id="btn-go-cultivate">🐍 回修炼区改代码</button></div>
      <div class="card"><h3>🧪 试炼 (${ch.tests.length} 条)</h3>
        ${testsHtml}
        <div class="btns"><button class="btn primary" id="btn-trial">⚡ 开始试炼(跑内置测试)</button>
        <span class="muted">全部全绿 + 击败 Boss = 通关本境</span></div>
      </div>
      <div class="card gold" id="boss-card">
        <h3>👿 击败本境 Boss · ${ch.realm}(50 XP)</h3>
        <div id="boss-body">${chAllPassed(ch) ? bossBodyHtml(ch) : `<div class="boss-locked">🔒 Boss 试炼锁:先让试炼 <b>全部全绿</b> 才会现身(目前 ${chPassCount(ch)}/${ch.tests.length})。</div>`}</div>
      </div>
    </div>

    <div id="pane-3" class="${tab === 3 ? "" : "hide"}">
      <div class="card gold"><h3>🧠 口诀</h3><pre style="text-align:center;font-size:1.1em">${ch.mantra}</pre></div>
      <div class="card"><h3>📌 要点</h3><ul>${ch.notes.map(n => `<li>${n}</li>`).join("")}</ul></div>
    </div>`;

  renderComic(ch, document.getElementById("comic"));
  bindChapter(ch);
}

function sessionTab(id) {
  try { const t = sessionStorage.getItem("tab-" + id); return t ? +t : 0; } catch (e) { return 0; }
}
function saveTab(id, t) { try { sessionStorage.setItem("tab-" + id, t); } catch (e) {} }

function bindChapter(ch) {
  const main = document.getElementById("main");
  main.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => {
    const i = +b.dataset.tab;
    saveTab(ch.id, i);
    for (let k = 0; k < 4; k++) document.getElementById("pane-" + k).classList.toggle("hide", k !== i);
    main.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x === b));
  }));

  const mN = document.getElementById("mode-normal"), mR = document.getElementById("mode-roast");
  const applyMode = roast => {
    mR.classList.toggle("on", roast); mN.classList.toggle("on", !roast);
    document.getElementById("lessons").innerHTML = ch.lesson.map(l =>
      `<h4>${l.title}</h4><div class="l-normal">${l.normal}</div><div class="l-roast ${roast ? "" : "hide"}">${l.roast}</div>`
    ).join("");
  };
  mN.addEventListener("click", () => applyMode(false));
  mR.addEventListener("click", () => applyMode(true));
  applyMode(true);

  document.getElementById("btn-lecture").addEventListener("click", () => {
    if (!state.comicRead[ch.id]) {
      state.comicRead[ch.id] = true; saveState();
      addXP(XP_RULES.comic, "读完讲经");
    } else toast("这段讲经领过了, 别刷 XP —— 小白看着呢。");
  });

  const ed = document.getElementById("editor");
  ed.addEventListener("input", () => { state.code[ch.id] = ed.value; saveState(); });
  document.getElementById("btn-reset").addEventListener("click", () => {
    ed.value = ch.starter; state.code[ch.id] = ch.starter; saveState();
    document.getElementById("console").textContent = "";
  });
  document.getElementById("btn-run").addEventListener("click", async () => {
    const c = document.getElementById("console");
    c.textContent = "⏳ 运行中…";
    c.classList.remove("hide");
    const out = await runUserCode(ch, ed.value);
    c.textContent = out || "(无输出)";
  });
  document.getElementById("btn-peek").addEventListener("click", () => {
    const s = document.getElementById("solution");
    s.classList.toggle("hide");
    if (!state.peeked[ch.id]) {
      state.peeked[ch.id] = true; saveState();
      addXP(XP_RULES.peek, "看了完整解答(靠抄不靠练)");
    }
  });

  document.getElementById("btn-trial").addEventListener("click", () => runChapterTrial(ch));
  bindBoss(ch);

  // C2: 试炼失败 → 一键回修炼区
  const goCult = document.getElementById("btn-go-cultivate");
  if (goCult) goCult.addEventListener("click", () => switchToTab(1));

  // B2: 已通关章节重进时, 通关横幅直接挂着
  if (state.cleared[ch.id]) showClearBanner(ch);
}

/* C2: 切到指定 tab (与顶部 tab 按钮同逻辑) */
function switchToTab(i) {
  const main = document.getElementById("main");
  const tabBtns = main.querySelectorAll(".tab");
  if (tabBtns[i]) tabBtns[i].click();
}

/* ---------- 漫画卡片 ---------- */
function renderComic(ch, el) {
  el.innerHTML = ch.comic.map(c =>
    `<div class="comic-card"><div class="c-emoji">${c.emoji}</div>
      <div class="c-who">${c.who}</div><div class="c-say">${c.say}</div></div>`
  ).join("");
}

/* ---------- 试炼 ---------- */
async function runChapterTrial(ch) {
  const code = state.code[ch.id] || ch.starter;
  state.code[ch.id] = code;
  const btn = document.getElementById("btn-trial");
  btn.disabled = true; btn.textContent = "⏳ 试炼中…(首次跑 Python 需几秒)";

  const pyRes = await runTrial(ch, code);
  const srcRes = runSrcTests(ch, code);

  const pyTests = ch.tests.filter(t => t.type === "py");
  const results = ch.tests.map(t => {
    if (t.type === "src") return srcRes.find(r => r.id === t.id) || { id: t.id, ok: false, msg: "src 检查器故障" };
    const idx = pyTests.indexOf(t);
    if (pyRes.error) return { id: t.id, ok: false, msg: pyRes.error };
    const r = pyRes.results ? pyRes.results[idx] : null;
    if (!r) return { id: t.id, ok: false, msg: "沙箱未返回结果" };
    return { id: t.id, ok: r.ok, msg: r.msg };
  });

  const allPass = results.every(r => r.ok);
  const hadPassBefore = chPassCount(ch) > 0;
  if (!allPass) state.failedRuns[ch.id] = (state.failedRuns[ch.id] || 0) + 1;

  results.forEach(r => {
    const el = document.getElementById("ti-" + r.id);
    if (!el) return;
    const st = el.querySelector(".st");
    if (r.ok) {
      st.textContent = "✔";
      el.classList.add("passed");
      const old = el.querySelector(".fail-msg");
      if (old) old.remove();
      if (!(state.testsPassed[ch.id] || {})[r.id]) {
        state.testsPassed[ch.id] = state.testsPassed[ch.id] || {};
        state.testsPassed[ch.id][r.id] = true;
        saveState();
        addXP(XP_RULES.test, "试炼通过 1 条");
      }
    } else {
      st.textContent = "✘";
      el.classList.add("failed");
      // A1: 失败原因直接亮在条目下面, 不用悬停 tooltip 瞎猜
      let msg = el.querySelector(".fail-msg");
      if (!msg) { msg = document.createElement("div"); msg.className = "fail-msg"; el.appendChild(msg); }
      msg.textContent = r.msg || "未通过";
      msg.style.display = "block";
    }
  });

  btn.disabled = false;
  const succEl = document.getElementById("trial-success");
  const failEl = document.getElementById("trial-fail-note");
  if (allPass) {
    btn.textContent = "⚡ 试炼全绿! 去找 Boss";
    if (!hadPassBefore && !(state.failedRuns[ch.id] > 1)) {
      awardBadge("b_green");
      addXP(XP_RULES.allgreen, "一发入魂(首次全绿)");
    }
    // B6/C2: 全绿横幅 + 解锁 Boss 门
    if (succEl) succEl.style.display = "block";
    if (failEl) failEl.style.display = "none";
    revealBossIfLocked(ch);
    checkChapterClear(ch);
  } else {
    btn.textContent = "⚡ 还有没过, 修完再战";
    if (succEl) succEl.style.display = "none";
    if (failEl) failEl.style.display = "flex";   // C2: 提示条 + 回修炼区按钮
    saveState();
  }
}

/* A2: 试炼全绿后, 把锁着的 Boss 卡换成答题表单 */
function revealBossIfLocked(ch) {
  const body = document.getElementById("boss-body");
  if (!body || !body.querySelector(".boss-locked")) return;
  body.innerHTML = bossBodyHtml(ch);
  bindBoss(ch);
}

/* B2: 通关横幅 (通关时弹, 重进已通关章节时常驻) */
function showClearBanner(ch) {
  const b = document.getElementById("clear-banner");
  if (!b) return;
  const idx = CHAPTERS.indexOf(ch);
  const next = CHAPTERS[idx + 1];
  const label = next ? "⚔️ 去「" + next.realm + "」" : "🏆 去个人道行";
  b.innerHTML = `<b>🏆 ${ch.realm} 通关!</b> ${next ? "下一境已开启。" : "九境皆毕, 大道已成。"}
    <span class="btns"><button class="btn" id="cb-next">${label}</button>
    <button class="btn" id="cb-stay">留在这再修会儿</button></span>`;
  b.style.display = "block";
  b.querySelector("#cb-stay").onclick = () => { b.style.display = "none"; };
  b.querySelector("#cb-next").onclick = () => { location.hash = next ? "#/ch/" + next.id : "#/profile"; };
  b.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ---------- Boss ---------- */
function bossQuestionsHtml(ch, addSubmit) {
  let body = "";
  ch.boss.forEach((q, qi) => {
    body += `<div class="boss-q" data-q="${qi}"><b>${qi + 1}. ${q.q}</b><div>`;
    q.options.forEach((opt, oi) => {
      body += `<label><input type="radio" name="bq${qi}" value="${oi}"> ${opt}</label>`;
    });
    body += `<div class="boss-why hide">${q.why}</div></div></div>`;
  });
  if (addSubmit) body += `<button class="btn primary" id="boss-submit">👿 迎战</button> <span class="muted" id="boss-msg"></span>`;
  return body;
}

function bossBodyHtml(ch) {
  if (state.bossDone[ch.id]) {
    return `<div class="boss-done">🏵 已击败 · Boss 跪地: 「算你狠, 令牌收好。」</div>
      <button class="btn" id="boss-again">重答一遍(看解析)</button>`;
  }
  return bossQuestionsHtml(ch, true);
}

function bindBoss(ch) {
  const body = document.getElementById("boss-body");
  const sub = body.querySelector("#boss-submit");
  if (sub) { sub.addEventListener("click", () => judgeBoss(ch, body, false)); return; }
  const again = body.querySelector("#boss-again");
  if (again) again.addEventListener("click", () => {
    document.getElementById("boss-body").outerHTML =
      '<div id="boss-body">' + bossQuestionsHtml(ch, true) + '</div>';
    const fresh = document.getElementById("boss-body");
    fresh.querySelector("#boss-submit").addEventListener("click", () => judgeBoss(ch, fresh, true));
  });
}

function judgeBoss(ch, body, silent) {
  let right = 0;
  ch.boss.forEach((q, qi) => {
    const box = body.querySelector(`[data-q="${qi}"]`);
    const sel = body.querySelector(`input[name="bq${qi}"]:checked`);
    const ok = sel && +sel.value === q.answer;
    if (ok) right++;
    box.querySelector(".boss-why").classList.remove("hide");
    box.querySelectorAll("label").forEach(l => {
      const v = +l.querySelector("input").value;
      l.classList.toggle("ans-correct", v === q.answer);
      l.classList.toggle("ans-wrong", sel && v === +sel.value && !ok);
    });
  });
  const msg = body.querySelector("#boss-msg");
  if (!msg) return;
  if (right < ch.boss.length) {
    msg.textContent = `答对 ${right}/${ch.boss.length} —— 看解析再战(不扣 XP, 但丢人)。`;
    return;
  }
  msg.textContent = `全对(${right}/${ch.boss.length})!`;
  if (!silent && !state.bossDone[ch.id]) {
    state.bossDone[ch.id] = true; saveState();
    addXP(XP_RULES.boss, "击败 Boss");
  }
  checkChapterClear(ch);
  // B2: 通关横幅取代旧 confirm 弹窗
  if (state.cleared[ch.id] && !silent) setTimeout(() => showClearBanner(ch), 400);
}

