/* 境界三 · 七窍门: 手搓线性回归 + KNN (掌门铁律: 不许调包) */
(window.CHAPTERS = window.CHAPTERS || []).push({
  id: "ch2",
  realm: "境界三 · 七窍门",
  title: "第 2 章 · 手搓梯度下降 & KNN",
  tagline: "掌门: 调包者, 逐出山门",
  emoji: "🐱",
  comic: [
    { emoji: "🐱", who: "掌门(严肃老猫)", say: "本门不教调包, 只教造轮子。你 import sklearn 的那一刻, 就和我背了台词的 NPC 一样 —— 没有灵魂。" },
    { emoji: "🧒", who: "凡人", say: "那...那'训练'到底是什么?" },
    { emoji: "🐕", who: "小白", say: "训练 = 猜答案 → 算错了多少(loss) → 看往哪调最划算(梯度) → 挪一小步。循环 1000 次, 就学会了。" },
    { emoji: "⛰️", who: "黑板", say: "你站在 Loss 山谷里, 闭着眼, 每次踩哪边陡就往哪边退 —— 梯度下降。" }
  ],
  lesson: [
    {
      title: "① 训练循环三件套",
      normal: "预测(pred) → 算误差(MSE loss) → 算梯度(误差对 w、b 的偏导) → 参数更新 w -= lr * grad。这就是'训练'的全部真相, 没有黑魔法。",
      roast: "训练就是 1000 次'猜错了 → 挨骂 → 改一点点'。AI 比你爸妈对你要求低, 它骂完真的就改。"
    },
    {
      title: "② 学习率: 步长哲学",
      normal: "lr 太小:龟速,一万年不收敛;lr 太大:在山谷里反复横跳甚至飞出山谷(loss 爆炸)。这是调参第一课。",
      roast: "学习率就是'每天走几步'。走 1 步,100 年出不了谷;走 100 步,第二天人就没了。"
    },
    {
      title: "③ KNN: 懒惰到极致",
      normal: "KNN 不训练, 把整个数据集存下来, 来了新点找 k 个最近邻投票。简单到一行核心逻辑, 却因'记住一切'而容易过拟合。",
      roast: "KNN 是数据界的'外包':活儿全外包给最近的人, 自己不学, 但工资(内存)给得最多。"
    }
  ],
  starter: `import numpy as np

# ============ 第一关: 梯度下降 · 线性回归(手搓!) ============
rng = np.random.default_rng(42)
X = rng.uniform(0, 10, 200)
y = 2.5 * X + 1.0 + rng.normal(0, 0.5, 200)   # 加噪声, 模拟人间

w, b = 0.0, 0.0        # 从最愚蠢的猜测开始
lr, epochs = 0.01, 1000

for _ in range(epochs):
    pred = w * X + b
    err = pred - y
    # TODO-1: 写出梯度下降更新公式
    # MSE = mean(err^2), 对 w 求偏导: (2/len) * sum(err * X)
    # 对 b 求偏导: (2/len) * sum(err)
    w = w   # TODO: 更新 w
    b = b   # TODO: 更新 b

final_loss = None    # TODO-2: 训练完算一次 MSE 存这里

# ============ 第二关: KNN 近邻表决(三行核心) ============
def knn_predict(points, labels, x, k=3):
    """距离 -> 取 k 近邻 -> 多数表决。TODO-3: 补全返回值(得票最多的 label)"""
    dists = [np.linalg.norm(p - x) for p in points]
    neighbors = np.argsort(dists)[:k]
    return None

train_x = np.array([[0, 0], [0.5, 0], [1, 1], [1.1, 1]])
train_y = ["猫", "猫", "狗", "狗"]
print("KNN 投票:", knn_predict(train_x, train_y, np.array([0.2, 0.2]), k=3))
`,
  solution: `import numpy as np

# ============ 第一关: 梯度下降 · 线性回归(手搓!) ============
rng = np.random.default_rng(42)
X = rng.uniform(0, 10, 200)
y = 2.5 * X + 1.0 + rng.normal(0, 0.5, 200)

w, b = 0.0, 0.0
lr, epochs = 0.01, 1000

for _ in range(epochs):
    pred = w * X + b
    err = pred - y
    # 梯度: d(MSE)/dw = (2/n) * sum(err * X) ; d(MSE)/db = (2/n) * sum(err)
    w -= lr * (2.0 / len(X)) * float(np.sum(err * X))
    b -= lr * (2.0 / len(X)) * float(np.sum(err))

final_loss = float(np.mean((w * X + b - y) ** 2))
print("拟合 w =", round(w, 3), " b =", round(b, 3), " 最终 loss =", round(final_loss, 4))
print("小白: 真实值是 w=2.5, b=1.0 —— 1000 次挨骂, 基本学会了。")

# ============ 第二关: KNN 近邻表决 ============
def knn_predict(points, labels, x, k=3):
    dists = [np.linalg.norm(p - x) for p in points]
    neighbors = np.argsort(dists)[:k]
    votes = [labels[i] for i in neighbors]
    return max(set(votes), key=votes.count)   # 得票最多者赢, 平票取集合序(够了)

train_x = np.array([[0, 0], [0.5, 0], [1, 1], [1.1, 1]])
train_y = ["猫", "猫", "狗", "狗"]
print("KNN 投票:", knn_predict(train_x, train_y, np.array([0.2, 0.2]), k=3))
print("小白: 近邻全是猫, 投猫。这就是'物以类聚, 数据亦然'。")
`,
  tests: [
    { id: "c2t1", type: "py", fn: "test_regression", name: "收敛: w≈2.5, b≈1.0",
      py: "def test_regression():\n    assert abs(w - 2.5) < 0.2 and abs(b - 1.0) < 0.3" },
    { id: "c2t2", type: "py", fn: "test_loss", name: "最终 loss < 0.8 (噪声下限约 0.25)",
      py: "def test_loss():\n    assert final_loss is not None and final_loss < 0.8" },
    { id: "c2t3", type: "py", fn: "test_knn", name: "(0.2, 0.2) 投票 = 猫",
      py: "def test_knn():\n    assert knn_predict(train_x, train_y, np.array([0.2, 0.2]), k=3) == \"猫\"" },
    { id: "c2t4", type: "py", fn: "test_knn_boundary", name: "边界点 (0.9, 0.4) 投狗 (2:1)",
      py: "def test_knn_boundary():\n    assert knn_predict(train_x, train_y, np.array([0.9, 0.4]), k=3) == \"狗\"" },
    { id: "c2t5", type: "src", name: "掌门铁律: 代码里不许出现 sklearn",
      expr: "!(/sklearn/.test(code))" }
  ],
  boss: [
    { q: "学习率从 0.01 直接调到 100, 会发生什么?",
      options: ["收敛更快", "loss 震荡甚至爆炸发散", "完全没影响", "模型自动降回 0.01"],
      answer: 1, why: "步长过大,参数在山谷左右横跳,越跳越远 —— loss 直接起飞。" },
    { q: "KNN 取 k=1 为什么容易过拟合?",
      options: ["k=1 不算距离", "它 100% 记住训练集每个点, 一点噪声就跟着学, 泛化为零", "k=1 训练最快", "不会, k=1 最稳健"],
      answer: 1, why: "最近邻是谁就听谁的,训练集里的异常点会直接左右结果 —— 记住一切 = 过拟合。" },
    { q: "为什么说'特征工程的尽头是脏活'?",
      options: ["因为脏活能自动化", "模型再强,喂进去的特征垃圾, 输出也是垃圾(Garbage in, Garbage out)", "特征工程很简单", "特征和模型无关"],
      answer: 1, why: "80% 的时间花在清洗、对齐、造特征上, 而不是训练那一秒。数据质量 = 模型上限。" }
  ],
  mantra: "回归调参, 损失最小才算赢;KNN 摆烂, 近邻说了算。",
  notes: ["训练循环: pred → err → grad → 更新, 四步循环", "lr 是最关键超参, 先看 loss 曲线再动手", "KNN 无训练, 但要存全量数据(懒的代价)", "下一章: 让神经网络分开两个圆"]
});
