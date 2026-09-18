/* 境界八 · RAG 秘境: 手搓最小 RAG (纯 Python, 浏览器可跑) */
(window.CHAPTERS = window.CHAPTERS || []).push({
  id: "ch7",
  realm: "境界八 · RAG 秘境",
  title: "第 7 章 · 手搓最小 RAG(藏经阁翻书术)",
  tagline: "阁主: 背不下整卷, 就学会翻到哪页",
  emoji: "📚",
  comic: [
    { emoji: "📚", who: "阁主", say: "整个经卷塞进模型脑子? 塞不下, 塞得进去也会背串了。" },
    { emoji: "🧒", who: "凡人", say: "那...先找到那一页, 只把那一页给它?" },
    { emoji: "🐕", who: "小白", say: "对! RAG = 检索(R) + 增强(A) + 生成(G): 提问 → 向量检索相关经卷 → 塞进 Prompt → 生成答案。" },
    { emoji: "📚", who: "阁主", say: "切太大, 一页三万字, 重点被淹; 切太小, 半句没上下文。切分是 RAG 的第一道坎。" }
  ],
  lesson: [
    {
      title: "① RAG 全流程",
      normal: "离线: 文档切分 → 每段算 Embedding → 存向量库。在线: 提问向量化 → 余弦检索 Top-K → 拼进 Prompt → LLM 生成并引用来源。",
      roast: "RAG 就是'开卷考试': 不让你背全书, 只让你会翻到对的那页。"
    },
    {
      title: "② 切分的艺术",
      normal: "太大: 一段塞 10 页, 相关被稀释、爆上下文; 太小: 一句话没上下文, 检索命中但答不完整。常用 200~500 token/段, 可带重叠。",
      roast: "切分就像切瓜: 切太大一口咬不动, 切太小不成块。"
    },
    {
      title: "③ 检索准 ≠ 生成对",
      normal: "RAG 错了分两层: 检索错(找错页)→ 换更好的 embedding/切分; 检索对但生成错(找到页但没答对)→ 改 prompt/换模型。诊断先分层。",
      roast: "答案不对先别怪 LLM —— 可能它拿到的'资料'就是错的页。"
    }
  ],
  starter: `import numpy as np

KB = [
    "公司食堂周一供应麻辣香锅,支持自助加汤,限量供应。",
    "会议室 A3 配备了投影仪与白板,预约需在 OA 提交。",
    "年假共 5 天,连续 3 天以上需部门主管审批。",
    "健身房开放时间 6:00-23:00,访客需前台登记。",
]
VOCAB = ["食堂", "香锅", "投影仪", "年假", "审批", "健身房", "登记", "周一", "开放"]

def embed(text, vocab):
    """词频向量(玩具版 Embedding): 每个词出现几次, 坐标就几长。"""
    v = np.zeros(len(vocab))
    for w in vocab:
        v[vocab.index(w)] = text.count(w)
    return v

def cos(u, v):
    return float(np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v) + 1e-9))

def rag_answer(question, top_k=1):
    """TODO: ① 问题向量化  ② 与每段经卷算余弦  ③ 返回最相似的 top_k 段(真实场景再喂给 LLM)"""
    return []

print(rag_answer("食堂周一有什么?"))
print(rag_answer("会议室有投影仪吗?"))
`,
  solution: `import numpy as np

KB = [
    "公司食堂周一供应麻辣香锅,支持自助加汤,限量供应。",
    "会议室 A3 配备了投影仪与白板,预约需在 OA 提交。",
    "年假共 5 天,连续 3 天以上需部门主管审批。",
    "健身房开放时间 6:00-23:00,访客需前台登记。",
]
VOCAB = ["食堂", "香锅", "投影仪", "年假", "审批", "健身房", "登记", "周一", "开放"]

def embed(text, vocab):
    """词频向量(玩具版 Embedding)"""
    v = np.zeros(len(vocab))
    for w in vocab:
        v[vocab.index(w)] = text.count(w)
    return v

def cos(u, v):
    return float(np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v) + 1e-9))

def rag_answer(question, top_k=1):
    qv = embed(question, VOCAB)                       # ① 提问向量化
    sims = [cos(qv, embed(d, VOCAB)) for d in KB]     # ② 与每段算余弦
    top = np.argsort(sims)[::-1][:top_k]              # ③ 取最相似的段
    return [KB[i] for i in top]
    # 真实 RAG: 把这 top_k 段塞进 Prompt, 交给 LLM 生成带引用的答案

print(rag_answer("食堂周一有什么?"))
print(rag_answer("会议室有投影仪吗?"))
print("小白: 词频玩具版够用了; 生产环境把 embed 换成真 Embedding 模型, 其余一字不改。")
`,
  tests: [
    { id: "c7t1", type: "py", fn: "test_canteen", name: "食堂问题 → 命中香锅段",
      py: "def test_canteen():\n    assert \"香锅\" in rag_answer(\"食堂周一有什么?\")[0]" },
    { id: "c7t2", type: "py", fn: "test_projector", name: "投影仪问题 → 命中会议室段",
      py: "def test_projector():\n    assert \"投影仪\" in rag_answer(\"会议室有投影仪吗?\")[0]" },
    { id: "c7t3", type: "py", fn: "test_annual", name: "年假问题 → 命中审批段",
      py: "def test_annual():\n    assert \"审批\" in rag_answer(\"年假超过 3 天要找谁?\")[0]" },
    { id: "c7t4", type: "py", fn: "test_no_cross", name: "食堂答案不许串台(不含'年假')",
      py: "def test_no_cross():\n    assert \"年假\" not in rag_answer(\"食堂周一有什么?\")[0]" }
  ],
  boss: [
    { q: "切分粒度「太大」的主要问题是?",
      options: ["检索快", "相关片段被大量无关内容稀释, 还可能爆上下文窗口", "embedding 算不出来", "向量库变贵"],
      answer: 1, why: "段太大 → 一段里重点占比低, 相似度被拉平; 且一段超过窗口直接没处放。" },
    { q: "检索明明命中了正确段落, 答案却不对 —— 先修哪层?",
      options: ["先换更大的模型 / 重写生成 Prompt(检索没问题, 生成层的问题)", "把切分调到 1 个词", "删掉向量库", "降低温度到负数"],
      answer: 0, why: "RAG 诊断先分层: 检索对生成错 = 生成层问题(提示词/模型), 别乱动检索。" },
    { q: "为什么关键词匹配(BM25 类)有时打不过向量检索, 反过来也打不过?",
      options: ["两者等价", "字面相同语义不同的题(请假 vs 年假)词法匹配会漏; 专业术语/型号/错别字向量检索反而易翻车 —— 生产上常两者混排", "向量检索永远更强", "关键词匹配永远更强"],
      answer: 1, why: "强词面 → 词法(BM25)胜; 强语义 → 向量胜。实战常见'混合检索 + 重排'。" }
  ],
  mantra: "经卷切小, 向量拉近, 检索喂 prompt, 幻觉就少一半。",
  notes: ["RAG = 开卷考试: 翻对页比背全书值钱", "切分 200~500 token 起步, 带重叠", "诊断分层: 检索错 vs 生成错", "下一章: LoRA —— 大模型冻住, 只练两把小刀"]
});
