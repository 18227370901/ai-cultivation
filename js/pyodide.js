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
  try {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = `https://cdn.jsdelivr.net/pyodide/v${PY_VERSION}/full/pyodide.js`;
      s.onload = res;
      s.onerror = () => rej(new Error("Pyodide 加载失败, 请检查网络(CDN)后刷新页面"));
      document.head.appendChild(s);
    });
    const py = await loadPyodide({ indexURL: `https://cdn.jsdelivr.net/pyodide/v${PY_VERSION}/full/` });
    await py.loadPackage(["numpy"]);
    _pyo = py;
  } finally {
    showPyOverlay(false);
  }
  return _pyo;
}

function _indent(src, n) {
  const p = " ".repeat(n);
  return src.split("\n").map(l => (l ? p + l : l)).join("\n");
}

/* 运行用户代码(修炼区「运行」按钮) */
async function runUserCode(chapter, code) {
  const py = await getPyodide();
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
