/* ================= Pyodide 浏览器沙箱: 用户代码 + 试炼用例 ================= */
const PY_VERSION = "0.26.4";
let _pyo = null;

function showPyOverlay(on, msg) {
  const ov = document.getElementById("py-overlay");
  if (!ov) return;
  ov.style.display = on ? "flex" : "none";
  const m = document.getElementById("py-overlay-msg");
  if (m) m.textContent = msg || "";
}

async function getPyodide() {
  if (_pyo) return _pyo;
  showPyOverlay(true, "正在召唤 Python 灵体 (Pyodide / WASM)…");
  // A3: 双 CDN 容错, jsdelivr 抽风时自动切 unpkg
  const CDNS = [
    { script: `https://cdn.jsdelivr.net/pyodide/v${PY_VERSION}/full/pyodide.js`, index: `https://cdn.jsdelivr.net/pyodide/v${PY_VERSION}/full/` },
    { script: `https://unpkg.com/pyodide@${PY_VERSION}/pyodide.js`,           index: `https://unpkg.com/pyodide@${PY_VERSION}/` }
  ];
  let lastErr = null;
  for (const c of CDNS) {
    try {
      showPyOverlay(true, `正在召唤 Python 灵体 (${c.index.replace("https://", "").slice(0, 14)}…)`);
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = c.script;
        s.onload = res;
        s.onerror = () => { s.remove(); rej(new Error("脚本加载失败: " + c.script)); };
        document.head.appendChild(s);
      });
      const py = await loadPyodide({ indexURL: c.index });
      await py.loadPackage(["numpy"]);
      _pyo = py;
      break;
    } catch (e) {
      lastErr = e;
      console.warn("[Pyodide] 当前 CDN 失败, 尝试下一个:", c.index, e);
    }
  }
  showPyOverlay(false);
  if (!_pyo) throw new Error("Pyodide 运行时装备召唤失败(全部 CDN 不可用, 请检查网络): " + (lastErr && lastErr.message));
  return _pyo;
}

/* A6: 各章用户级全局变量名 —— 每次「运行/试炼」前清掉, 防止旧版代码残留变量污染新 run */
const USER_GLOBALS = {
  ch0: ["a", "b", "sum_vec", "dot", "cosine_similarity", "v_cat_dog", "v_dog_cat", "v_cat_fridge", "sim_similar", "sim_diff"],
  ch1: ["orders", "top", "refund"],
  ch2: ["rng", "X", "y", "w", "b", "lr", "epochs", "pred", "err", "final_loss", "knn_predict", "train_x", "train_y"],
  ch3: ["rng", "dirs", "X_out", "X_in", "X", "y", "W1", "b1", "W2", "b2", "forward", "accuracy", "lr", "acc"],
  ch4: ["img", "conv2d", "k", "edges"],
  ch5: ["softmax", "self_attention", "query", "keys", "values", "out", "weights"],
  ch6: ["my_prompt"],
  ch7: ["KB", "VOCAB", "embed", "cos", "rag_answer"],
  ch8: ["rng", "W", "r", "A", "B", "alpha", "forward_with_lora", "x"],
  ch9: ["KB", "VOCAB", "mini_embed", "mini_rag"]
};
function purgeUserGlobals(chapter) {
  if (!_pyo) return;
  const names = USER_GLOBALS[chapter.id] || [];
  if (!names.length) return;
  const lit = names.map(n => "'" + n + "'").join(",");
  try {
    _pyo.runPython("for _n in [" + lit + "]: globals().pop(_n, None)");
  } catch (e) { /* 尽力而为, 不阻塞运行 */ }
}

function _indent(src, n) {
  const p = " ".repeat(n);
  return src.split("\n").map(l => (l ? p + l : l)).join("\n");
}

/* 运行用户代码(修炼区「运行」按钮) */
async function runUserCode(chapter, code) {
  const py = await getPyodide();
  purgeUserGlobals(chapter);   // A6: 清掉上一版残留变量
  let out = "";
  py.setStdout({ batched: s => { out += s + "\n"; } });
  try {
    await py.runPythonAsync(
      "try:\n" + _indent(code, 4) +
      "\nexcept Exception as __e:\n" +
      '    print("[修炼区] 运行时错误:", repr(__e))\n'
    );
  } catch (e) {
    out += "\n[沙箱错误] " + e.message;
  } finally {
    py.setStdout({ batched: () => {} });
  }
  return out;
}

/* 运行试炼: 用户代码 + 内置 py 测试, 返回逐条结果 */
async function runTrial(chapter, code) {
  const py = await getPyodide();
  if (chapter.id === "ch1") {
    showPyOverlay(true, "加载 Pandas 秘籍 (首次约 30MB, 请稍等)…");
    try { await py.loadPackage(["pandas"]); }
    catch (e) { showPyOverlay(false); return { ok: false, error: "Pandas 加载失败: " + e.message, raw: "" }; }
    showPyOverlay(false);
  }
  purgeUserGlobals(chapter);   // A6: 清掉上一版残留变量
  const pyTests = chapter.tests.filter(t => t.type === "py");
  const defs = pyTests.map(t => t.py).join("\n\n");
  const fnList = pyTests.map(t => t.fn).join(", ");
  let out = "";
  py.setStdout({ batched: s => { out += s + "\n"; } });
  let results = null;
  try {
    await py.runPythonAsync(
      'import json as __json\n__res = []\ntry:\n' +
      _indent(code, 4) +
      '\nexcept Exception as __e:\n    print("[修炼区] 代码未成功运行:", repr(__e))\n\n' +
      defs + "\n" +
      "__fns = [" + fnList + "]\n" +
      "for __i, __f in enumerate(__fns):\n" +
      "    try:\n        __f()\n        __res.append({\"id\": __i, \"ok\": True, \"msg\": \"\"})\n" +
      "    except AssertionError as __a:\n        __res.append({\"id\": __i, \"ok\": False, \"msg\": str(__a) or \"断言失败\"})\n" +
      "    except Exception as __e:\n        __res.append({\"id\": __i, \"ok\": False, \"msg\": \"运行时错误: \" + repr(__e)})\n" +
      'print("__RESULT__" + __json.dumps(__res))\n'
    );
  } catch (e) {
    out += "\n[沙箱错误] " + e.message;
  } finally {
    py.setStdout({ batched: () => {} });
  }
  const line = out.split("\n").filter(l => l.startsWith("__RESULT__")).pop();
  if (line) {
    try { results = JSON.parse(line.slice(9)); } catch (e) { /* keep null */ }
  }
  return { ok: results !== null, results, raw: out };
}

/* 源码检查(src 类测试): 在 JS 侧执行 */
function runSrcTests(chapter, code) {
  return chapter.tests.filter(t => t.type === "src").map(t => {
    try {
      const f = new Function("code", "return (" + t.expr + ");");
      const ok = !!f(code);
      return { id: t.id, name: t.name, ok, msg: ok ? "" : "源码检查未通过: " + t.name };
    } catch (e) {
      return { id: t.id, name: t.name, ok: false, msg: "检查器错误: " + e.message };
    }
  });
}
