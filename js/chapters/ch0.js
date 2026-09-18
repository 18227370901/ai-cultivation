/* 境界一 · 数值茅洞:向量与余弦相似度 */
(window.CHAPTERS = window.CHAPTERS || []).push({
  id: "ch0",
  realm: "境界一 · 数值茅洞",
  title: "第 0 章 · 向量与相似度",
  tagline: "驱散「四则运算怨灵」",
  emoji: "🪨",
  comic: [
    { emoji: "🧒", who: "凡人", say: "这石碑上刻着一串数字 [3, 1, 2],它到底是什么?洞主,给个说法!" },
    { emoji: "🐕", who: "小白", say: "别慌。向量 = 坐标 + 态度。苹果的位置是 (1, 2),猫的心情也是向量:[懒: 0.9, 炸毛: 0.1]。万物皆可向量化。" },
    { emoji: "📊", who: "黑板", say: "两个向量的夹角变小,余弦值从 0.3 飙到 0.95 —— 恭喜,你们被判定为「同类」。" },
    { emoji: "🐕", who: "小白", say: "余弦相似度 = 看方向,不看嗓门。你声音再小(模长再短),方向对,你就是「同类」。" }
  ],
  lesson: [
    {
      title: "① 向量是什么",
      normal: "向量是 n 维空间里的一个坐标数组,是 AI 中信息的最小单位。从第 0 章到 RAG,一切都在向量上进行。",
      roast: "向量就是给万物发的简历:面试官 RAG 只看匹配度,不看身高(模长)。"
    },
    {
      title: "② 点积 = 亲密度检测仪",
      normal: "点积衡量两个向量同向程度:同号相乘越多、点积越大。它是余弦相似度的分子,也是注意力机制的核心运算。",
      roast: "你和小白的点积越高,羁绊越深。点积为 0?你们只是「同在一个坐标系」,不熟。"
    },
    {
      title: "③ 为什么是余弦而不是距离",
      normal: "欧氏距离同时受「方向」和「长度」影响;余弦只看方向,对文本长短天然鲁棒,所以 RAG/推荐系统都拿它当度量。",
      roast: "「我喜欢猫」和「我特别喜欢猫」欧氏距离远,但余弦≈1 —— 前者是短,后者是激动,意思没变。"
    }
  ],
  starter: `import numpy as np

# ============ 第一关: 向量基本运算 ============
a = np.array([3, 1, 2])
b = np.array([1, 4, 1])

# TODO-1: 计算 a + b (向量化! 别写循环)
sum_vec = None

# ============ 第二关: 点积(亲密度检测仪) ============
# TODO-2: 算 a 和 b 的点积 (提示: @ 或 np.dot)。手算验证: 3*1 + 1*4 + 2*1 = ?
dot = None

# ============ 第三关: 余弦相似度(RAG 的灵魂) ============
def cosine_similarity(v1, v2):
    """同向=1, 正交=0, 反向=-1。与长度无关。
    TODO-3: 补全公式 (提示: 点积 / (模 * 模), 分母加 1e-9 防除零)"""
    return 0.0

# 测试场景: 三个"句子向量"(词频法, 故意粗糙, 够用)
v_cat_dog     = np.array([0.9, 0.8, 0.0])    # "猫 狗"
v_dog_cat     = np.array([0.85, 0.75, 0.0])  # "狗 猫"
v_cat_fridge  = np.array([0.1, 0.1, 1.0])    # "冰箱 猫"
sim_similar = None   # TODO-4: "猫 狗" vs "狗 猫" (应该很高)
sim_diff    = None   # TODO-5: "猫 狗" vs "冰箱 猫" (应该很低)
`,
  solution: `import numpy as np

# ============ 第一关: 向量基本运算 ============
a = np.array([3, 1, 2])
b = np.array([1, 4, 1])

sum_vec = a + b                      # 向量化: NumPy 直接按位运算, 一行顶百行

# ============ 第二关: 点积 ============
dot = int(a @ b)                     # 3*1 + 1*4 + 2*1 = 9, 手算核对过了吧?

# ============ 第三关: 余弦相似度 ============
def cosine_similarity(v1, v2):
    """同向=1, 正交=0, 反向=-1。长度在分子分母中约掉。"""
    v1 = np.asarray(v1, dtype=float)
    v2 = np.asarray(v2, dtype=float)
    return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-9))

# 测试场景: 三个"句子向量"
v_cat_dog     = np.array([0.9, 0.8, 0.0])    # "猫 狗"
v_dog_cat     = np.array([0.85, 0.75, 0.0])  # "狗 猫"
v_cat_fridge  = np.array([0.1, 0.1, 1.0])    # "冰箱 猫"
sim_similar = cosine_similarity(v_cat_dog, v_dog_cat)     # ≈ 0.9996
sim_diff    = cosine_similarity(v_cat_dog, v_cat_fridge)  # ≈ 0.14
assert sim_similar > sim_diff            # 自检: 猫狗确实比猫冰箱更像
print("「猫狗」≈「狗猫」:", round(sim_similar, 4), " | vs 「冰箱猫」:", round(sim_diff, 4))
print("小白: 看, 连'冰箱'都分得清。这就是 RAG 的底层逻辑。")
`,
  tests: [
    { id: "c0t1", type: "py", fn: "test_add", name: "向量加法正确",
      py: "def test_add():\n    assert list(sum_vec) == [4, 5, 3]" },
    { id: "c0t2", type: "py", fn: "test_dot", name: "点积手算=9",
      py: "def test_dot():\n    assert dot == 9" },
    { id: "c0t3", type: "py", fn: "test_parallel", name: "平行向量相似度=1",
      py: "def test_parallel():\n    assert abs(cosine_similarity([1., 2.], [2., 4.]) - 1.0) < 1e-6" },
    { id: "c0t4", type: "py", fn: "test_orthogonal", name: "正交向量相似度=0",
      py: "def test_orthogonal():\n    assert abs(cosine_similarity([1., 0.], [0., 1.])) < 1e-6" },
    { id: "c0t5", type: "py", fn: "test_semantic", name: "语义直觉: 猫狗 > 猫冰箱",
      py: "def test_semantic():\n    assert sim_similar > sim_diff" },
    { id: "c0t6", type: "src", name: "禁用循环(向量化铁律)",
      expr: "!(/\\bfor\\s+\\w+/.test(code))" }
  ],
  boss: [
    { q: "一个向量的模长变成原来的 2 倍,它和另一个向量的余弦相似度会?",
      options: ["也变成 2 倍", "保持不变", "变成一半", "直接归零"],
      answer: 1, why: "余弦公式里长度在分子分母同时出现,会被约掉 —— 它只看方向。" },
    { q: "余弦相似度和欧氏距离最大的区别是?",
      options: ["余弦不用算", "余弦对「尺度/长度」不敏感,欧氏对两者都敏感", "欧氏永远更大", "没有区别"],
      answer: 1, why: "「喜欢猫」和「特别喜欢猫」欧氏距离远,但余弦≈1。这就是文本检索选余弦的原因。" },
    { q: "RAG 检索为什么不能直接用「字符串完全相等」?",
      options: ["因为用户会打错字", "真实提问和知识库里的措辞几乎从不完全一样,要按语义找'近似'", "字符串太长", "相等太快"],
      answer: 1, why: "问「怎么请假」,知识库里写的是「年假申请流程」——字面不等,语义相同。向量化就是为了这种'近似'。" }
  ],
  mantra: "余弦只看方向,不看嗓门;搜索的尽头,是向量的尽头。",
  notes: ["向量 = 万物简历", "点积 = 亲密度,是注意力的核心运算", "余弦对长度鲁棒 → 文本检索标配", "下一章: 用 Pandas 处理脏数据,向量化铁律继续生效"]
});
