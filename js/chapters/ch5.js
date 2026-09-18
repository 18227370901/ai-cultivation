/* 境界六 · 大语言仙宗: 手搓 Self-Attention */
(window.CHAPTERS = window.CHAPTERS || []).push({
  id: "ch5",
  realm: "境界六 · 大语言仙宗",
  title: "第 5 章 · 手搓 Self-Attention(仙宗入门)",
  tagline: "上墙咒语: 注意力者, 问全局, 答局部",
  emoji: "☸️",
  comic: [
    { emoji: "☸️", who: "仙师", say: "凡人问: 一句话里每个字, 该重点'看'哪个字? 此即注意力。" },
    { emoji: "🧒", who: "凡人", say: "Q·K 算相关度, 再给 V 加权求和 —— 就这三个词?" },
    { emoji: "🐕", who: "小白", say: "对。Q = 查询(你想找什么), K = 键(每个人举着的牌子), V = 值(牌子背后装着的货)。" },
    { emoji: "☸️", who: "仙师", say: "分数要先除以 √d 再进 softmax —— 不除, 分数量大时 softmax 死给你看(全 0 全 1)。" }
  ],
  lesson: [
    {
      title: "① Q / K / V 是什么",
      normal: "每个 token 经三个矩阵投影成 Q、K、V。注意力 = softmax(Q·Kᵀ/√d)·V: 用相关度给别人的信息(V)加权。",
      roast: "开会场景: Q 是你的问题, K 是每个人胸前的名牌, V 是名牌后的人本身。你根据名牌选谁, 听谁的发言。"
    },
    {
      title: "② 为什么除以 √d",
      normal: "Q、K 点积的方差随维度 d 线性增大; 不缩放时分数过大, softmax 饱和(→ one-hot, 梯度消失)。除以 √d 让分数维持合理量级。",
      roast: "√d 是仙家的'稳压器': 不加, 分数一爆, softmax 当场断片(全 0 全 1)。"
    },
    {
      title: "③ 复杂度的疼",
      normal: "注意力对序列长度是 O(n²): 128K 上下文的计算量约为 4K 的 10000 倍。这就是各种长文本优化(FlashAttention 等)的由来。",
      roast: "上下文越长, 注意力越疼 —— 它不是'记得多', 是'每次都要看所有人, 看 N 遍'。"
    }
  ],
  starter: `import numpy as np

def softmax(x, axis=-1):
    """TODO-1: 数值稳定版。先减最大值(仙家秘法, 防 exp 溢出), 再除总和。"""
    e = None
    return e / e.sum(axis=axis, keepdims=True)

def self_attention(Q, K, V):
    """TODO-2: 补全三步: ① scores = Q @ K.T / √d  ② softmax  ③ 加权求和 V
    返回顺序: (输出, 权重) —— 别解反包"""
    d = Q.shape[-1]
    scores = None
    weights = None
    return None, weights

# 直觉演示: "猫"(加大版的 one-hot) 的查询, 应该只给 "猫" 的键打高分
query = np.array([[10.0, 0.0, 0.0]])
keys = np.array([[1.0, 0.0, 0.0],    # 猫
                  [0.1, 0.9, 0.0],    # 鱼
                  [0.0, 0.0, 0.9]])   # 沙发
values = np.array([[10.0], [20.0], [30.0]])
out, weights = self_attention(query, keys, values)
print("注意力权重:", np.round(weights[0], 3), " → 输出:", out[0, 0])
`,
  solution: `import numpy as np

def softmax(x, axis=-1):
    e = np.exp(x - x.max(axis=axis, keepdims=True))   # 减最大值, 防溢出(仙家秘法)
    return e / e.sum(axis=axis, keepdims=True)

def self_attention(Q, K, V):
    d = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d)      # 除以 √d: 分数不爆, softmax 不死
    weights = softmax(scores)
    return weights @ V, weights

# 直觉演示: "猫"的查询(10 倍的 one-hot, 放大权重差距), 只对 "猫" 的键打高分
query = np.array([[10.0, 0.0, 0.0]])
keys = np.array([[1.0, 0.0, 0.0],    # 猫
                  [0.1, 0.9, 0.0],    # 鱼
                  [0.0, 0.0, 0.9]])   # 沙发
values = np.array([[10.0], [20.0], [30.0]])
out, weights = self_attention(query, keys, values)
print("注意力权重:", np.round(weights[0], 3), " → 输出:", out[0, 0])
print("小白: 97% 的注意力给了'猫', 输出≈猫的货(10)。检索味, 出来了。")
`,
  tests: [
    { id: "c5t1", type: "py", fn: "test_softmax_sums", name: "softmax 每行之和 = 1",
      py: "def test_softmax_sums():\n    assert np.allclose(softmax(np.array([1.0, 2.0, 3.0])).sum(), 1.0)" },
    { id: "c5t2", type: "py", fn: "test_focus", name: "注意力 95%+ 给 '猫'",
      py: "def test_focus():\n    _, w2 = self_attention(np.array([[10.0, 0.0, 0.0]]), keys, values)\n    assert w2[0, 0] > 0.95" },
    { id: "c5t3", type: "py", fn: "test_out", name: "输出 ≈ '猫' 的值 (10)",
      py: "def test_out():\n    assert abs(out[0, 0] - 10.0) < 1.0" }
  ],
  boss: [
    { q: "注意力分数不除以 √d, 维度 d 变大时会发生什么?",
      options: ["分数变小", "方差随 d 增大, softmax 饱和成一票独大, 梯度消失", "没影响", "分数恒为 0"],
      answer: 1, why: "两个 d 维随机向量点积的方差 = d。d 一大, 分数动辄几十, softmax 直接 one-hot。" },
    { q: "多头注意力(multi-head)的本质是?",
      options: ["多头共享一个注意力", "在不同子空间里各算各的注意力再拼接 —— 有的头看语法, 有的头看共指", "头越多越准, 无上限", "只是营销话术"],
      answer: 1, why: "多头 = 多视角: 每个头在低维子空间捕捉不同类型的关系, 最后 concat。" },
    { q: "标准注意力的计算量随序列长度 n 是?",
      options: ["O(n)", "O(n²)", "O(log n)", "常数"],
      answer: 1, why: "每个 token 要看全部 token: n×n。这就是长上下文又贵又慢的根源, 也是 FlashAttention 优化的对象。" }
  ],
  mantra: "Q 问, K 答, V 装货;√d 一除, 天下太平。",
  notes: ["softmax 数值稳定: 先减 max(只影响分子分母, 值不变)", "除以 √d 防饱和", "注意力 = 可微的'检索': 每个位置问全局, 答局部", "下一章: 不写代码, 学说话 —— Prompt 四件套"]
});
