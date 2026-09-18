// 临时校验器: 提取每章 solution + 内置测试, 生成 verify_chX.py, 供本地 Python 执行
const fs = require("fs");
global.window = {};
["ch0","ch1","ch2","ch3","ch4","ch5","ch6","ch7","ch8","ch9"].forEach(f => {
  eval(fs.readFileSync(__dirname + "/js/chapters/" + f + ".js", "utf8"));
});
const chapters = window.CHAPTERS;
console.log("chapters:", chapters.length, chapters.map(c => c.id).join(","));
chapters.forEach(ch => {
  const parts = [ch.solution];
  ch.tests.filter(t => t.type === "py").forEach(t => parts.push(t.py));
  parts.push(`import sys as __sys
__fail = 0
for __f in sorted([k for k in dir() if k.startswith("test_")]):
    try:
        globals()[__f]()
        print("PASS", __f)
    except Exception as __e:
        print("FAIL", __f, repr(__e)); __fail = 1
__sys.exit(__fail)
`);
  fs.writeFileSync(__dirname + "/verify_" + ch.id + ".py", parts.join("\n\n") + "\n");
  // src 类测试在 Node 侧验证
  ch.tests.filter(t => t.type === "src").forEach(t => {
    let ok = false, err = null;
    try { ok = !!new Function("code", "return (" + t.expr + ");")(ch.solution); }
    catch (e) { err = e.message; }
    console.log(ch.id, "src", t.id, ok ? "PASS" : "FAIL: " + err);
  });
});
console.log("verify scripts written");
