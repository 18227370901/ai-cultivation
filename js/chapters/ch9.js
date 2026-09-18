/* 毕业考 · 飞升试炼: 组合 第0章向量 + 第7章RAG, 手搓 mini 问答 */
(window.CHAPTERS = window.CHAPTERS || []).push({
  id: "ch9",
  realm: "毕业考 · 飞升试炼",
  title: "终章 · 飞升试炼(手搓 Mini RAG)",
  tagline: "飞升前的最后一卷",
  emoji: "🌈",
  comic: [
    { emoji: "🌈", who: "飞升使者", say: "九境已毕, 最后一卷: 三句'修仙语录', 你要能在三秒内翻到对的那句。" },
    { emoji: "🧒", who: "凡人", say: "向量化 → 余弦 → 取最大 —— 第 0 章和第 7 章的合体。" },
    { emoji: "🐕", who: "小白", say: "写个 mini_rag(问题), 返回最相似的一句。别偷懒, 这次没有'喂给 LLM'环节, 检索本身就是答案。" },
    { emoji: "🌈", who: "飞升使者", say: "全绿, 即飞升。" }
  ],
  lesson: [
    {
      title: "综合: 检索 = 向量 + 余弦 + 取 Top-1",
      normal: "把问题向量化, 与每句语录算余弦相似度, 返回最大者。这就是 RAG 在线侧的最小闭环 —— 你已经会了。",
      roast: "背不下整卷, 就学会翻到哪页 —— 这就是终点。"
    }
  ],
  starter: `import numpy as np

KB = [
    "强者密码是'修炼即无敌',知道的人才能进门。",
    "喜剧主角三条路: 躺倒, 躺平, 被空调吹。",
    "修仙第一定律: 凌晨三点别跑代码, 崩了全崩。",
]
VOCAB = ["密码", "强者", "喜剧", "空调", "第一定律", "跑代码", "崩", "三条路"]

def mini_embed(text):
    """词频向量(玩具版 Embedding)"""
    v = np.zeros(len(VOCAB))
    for i, w in enumerate(VOCAB):
        v[i] = text.count(w)
    return v

def mini_rag(question):
    """TODO: 三行: ① 问题向量化 ② 和每句算余弦(记得除模长, 防除零) ③ 返回最相似那句"""
    return None

print("测试:", mini_rag("密码是什么?"))
`,
  solution: `import numpy as np

KB = [
    "强者密码是'修炼即无敌',知道的人才能进门。",
    "喜剧主角三条路: 躺倒, 躺平, 被空调吹。",
    "修仙第一定律: 凌晨三点别跑代码, 崩了全崩。",
]
VOCAB = ["密码", "强者", "喜剧", "空调", "第一定律", "跑代码", "崩", "三条路"]

def mini_embed(text):
    v = np.zeros(len(VOCAB))
    for i, w in enumerate(VOCAB):
        v[i] = text.count(w)
    return v

def mini_rag(question):
    qv = mini_embed(question)
    sims = [float(np.dot(qv, mini_embed(d)) /
                  (np.linalg.norm(qv) * np.linalg.norm(mini_embed(d)) + 1e-9))
            for d in KB]
    return KB[int(np.argmax(sims))]

print("密码是什么? →", mini_rag("密码是什么?"))
print("怎么成喜剧主角? →", mini_rag("怎么成喜剧主角?"))
print("修仙第一定律? →", mini_rag("修仙第一定律是什么?"))
print("小白: 三句都翻对了 —— 主人, 您的代码终于比约会对象稳定了。")
`,
  tests: [
    { id: "c9t1", type: "py", fn: "test_pwd", name: "「密码」→ 强者语录",
      py: "def test_pwd():\n    assert \"强者\" in mini_rag(\"密码是什么?\")" },
    { id: "c9t2", type: "py", fn: "test_comic", name: "「喜剧主角」→ 喜剧语录",
      py: "def test_comic():\n    assert \"空调\" in mini_rag(\"怎么成喜剧主角?\")" },
    { id: "c9t3", type: "py", fn: "test_law", name: "「第一定律」→ 修仙定律",
      py: "def test_law():\n    assert \"崩\" in mini_rag(\"修仙第一定律是什么?\")" }
  ],
  boss: [
    { q: "把你的 mini_rag 接到真实 LLM, 正确的做法是?",
      options: ["把检索结果删掉再问 LLM", "把 Top-K 检索段塞进 Prompt, 让 LLM 基于它生成并引用", "让 LLM 自己背下全部 KB", "检索段越短越好, 截成 5 个字"],
      answer: 1, why: "RAG 的灵魂: 检索段进上下文, 生成基于检索段。截太碎丢上下文, 整卷塞爆窗口。" },
    { q: "mini_embed(词频)和真实 Embedding 模型的差别?",
      options: ["词频会因同义词翻车('请假'vs'年假'), 真实模型捕捉语义", "词频永远更准", "没有差别", "真实模型也需要词频"],
      answer: 0, why: "词频只在字面重叠时有效; 真实 Embedding(句向量)按语义编码, '请假'和'年假'也能拉近。" },
    { q: "飞升后第一份工作, 面试官问'你做过什么', 最好的答案是?",
      options: ["背出 10 个名词", "讲一个完整闭环: 数据 → 模型 → 评估 → 部署, 并说清每个环节的坑", "说'我自学了'", "拒绝回答"],
      answer: 1, why: "闭环 + 踩坑细节 = 真干过。名词谁都会背, 坑只有自己踩过才知道。" }
  ],
  mantra: "背不下整卷, 就学会翻到哪页 —— 这就是终点的意义。",
  notes: ["RAG 最小闭环: 向量化 → 余弦 → Top-1", "词频 = 玩具, 生产换真实 Embedding 模型, 其余一字不改", "飞升 ≠ 终点: 第 5 章路线图的'方向深耕'(Agent/推荐/MLOps)在此开始"]
});
