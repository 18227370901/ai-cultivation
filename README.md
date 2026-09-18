# ⚔️ AI 修仙模拟器 · 凡人到真仙九境

> 一个**零安装、纯浏览器**的 AI/ML 交互训练营:修真漫画剧情 + 浏览器内直接跑 Python(Pyodide/WASM)+ 内置测试试炼 + Boss 概念题 + 经验/徽章/连击游戏化。
>
> **别人打开就是初始状态** —— 进度只存在你自己的浏览器 localStorage,不发任何数据。

## 功能一览

| 模块 | 说明 |
|---|---|
| 🗺️ 世界地图 | 九境 + 飞升试炼,逐境解锁(通关前一境才开下一道门) |
| 🎬 讲经 | 修真漫画分镜剧情,每条 3~4 格,配「正经 / 欠揍」双轨讲解 |
| 🐍 修炼 | 代码编辑器**直接在浏览器里运行 Python**(Pyodide,无需装环境) |
| 🎯 试炼 | 每章内置自动测试(py 断言 + 源码审查),逐条亮绿 |
| 👿 Boss | 概念选择题,全对才算击败;答错即显示解析 |
| 🏆 修真榜 | 本地模拟排行榜(其他修士实力写死,只有你的 XP 是真的) |
| 🧘 个人道行 | 境界进度 / 成就徽章 / 连击 / 一键「重修一世」 |

## 怎么跑

无需安装任何依赖。Python 由 **Pyodide(WASM)** 在浏览器里运行,需要联网(CDN 首次下载约 10MB 运行时 + 数据坊(ch1)试炼首次下载 Pandas 约 30MB)。

```
方式一: 直接双击 index.html
方式二: 本地起个服务(推荐)
  cd ai-cultivation
  python -m http.server 8000
  # 浏览器打开 http://localhost:8000/
```

## 九境路线图

| 境 | 章节 | 内容 | 形式 |
|---|---|---|---|
| 一 | 数值茅洞 | 向量/点积/余弦(RAG 地基) | 手搓 Python |
| 二 | 数据坊 | pandas 清洗三件套 | pandas |
| 三 | 梯度神殿 | 梯度下降 + KNN | 手搓 Python |
| 四 | 炼丹炉 | 手搓 MLP(同心圆) | 手搓反向传播 |
| 五 | 万法宫·卷积 | 2D 卷积找边缘 | 手搓卷积 |
| 六 | 大语言仙宗 | Self-Attention | 手搓注意力 |
| 七 | Prompt 心法 | 四件套 | 判卷式(字符串检查) |
| 八 | RAG 秘境 | 最小 RAG(词频玩具版) | 纯 Python |
| 九 | LoRA 仙门 | ΔW = B·A 数学核心 | 手搓 LoRA |
| 终 | 飞升试炼 | mini RAG 综合 | 组合题 |

## 游戏规则

- 通关前一境, 解锁下一境
- 讲经 +10 / 每条测试 +15 / 击败 Boss +50 / 通关 +100 / 看完整解答 −20 / 首次全绿 +50
- 等级: 凡人→练气→筑基→金丹→元婴→化神→炼虚→合体→大乘→真仙(每 100 XP 升期)
- 徽章: 首胜 / 一发入魂 / 清白之身 / 修行不辍(3 天连击) / 飞升
- 进度存 localStorage(带版本号, 结构变更时旧档自动作废回到初始状态);「个人道行」页可一键「重修一世」清空

## 目录结构

```
index.html            入口
css/style.css         全部样式
js/chapters/chN.js    章节数据(漫画/讲经/starter/solution/tests/boss/口诀)
js/gamification.js    经验·等级·徽章·连击·存档(localStorage + 版本号)
js/pyodide.js         Pyodide 沙箱(运行用户代码 + 跑内置测试)
js/app.js             路由·世界地图·排行榜·个人道行
js/chapter-view.js    章节四 tab: 讲经/修炼/试炼/道心笔记
verify.js             [开发工具] 提取各章 solution+tests 生成 verify_chN.py, 供本地 Python 回归
```

## 本地回归校验(给维护者)

```
node verify.js              # 生成 verify_ch0.py ~ verify_ch9.py
python verify_ch0.py ...    # 逐章跑 solution + 内置测试, 全 PASS 才放行
node --check js/**/*.js     # JS 语法检查
```

## 试炼机制说明

- **py 测试**: 用户代码 + 内置断言函数, 打包送进 Pyodide 执行, 逐条返回 ✔/✘
- **src 测试**: 源码审查(如「不许出现 sklearn」「必须真的在算而不只是打印」), 在 JS 侧执行
- **判卷式(ch7)**: 不跑模型, 用字符串检查 Prompt 四大件是否齐全、是否精炼

## FAQ

- **必须联网吗?** 是。Pyodide 的 WASM 运行时和 numpy/pandas 包从 CDN(jsdelivr) 按需下载, 首次约 40MB, 之后浏览器缓存。
- **换电脑会丢进度吗?** 会。存档只在本浏览器 localStorage, 无云端同步(这是设计, 不是 bug)——但可以在「个人道行 → 存档管理」导出 JSON 带走, 在新设备导入即可。
- **浏览器支持?** 现代 Chromium / Firefox / Safari 均可; 首次运行数据坊(ch1)试炼时 Pandas 包下载约 30MB, 请耐心等待遮罩提示。

