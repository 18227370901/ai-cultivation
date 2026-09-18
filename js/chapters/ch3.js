/* 境界四 · 万法宫(感知篇): 手搓两层 MLP + 反向传播 */
(window.CHAPTERS = window.CHAPTERS || []).push({
  id: "ch3",
  realm: "境界四 · 万法宫·感知篇",
  title: "第 3 章 · 手搓神经网络(MLP + 反向传播)",
  tagline: "点亮门上 64 个激活符",
  emoji: "🏯",
  comic: [
    { emoji: "⭕", who: "洞主", say: "两个同心圆, 直线切不开。来 —— 让神经网络学学怎么画'弯的'。" },
    { emoji: "🧒", who: "凡人", say: "一层网络只能画直线, 两层不就能画弯的了?" },
    { emoji: "🐕", who: "小白", say: "天真了。没有激活函数的多层网络, 数学上退化回一层 —— 所以每个神经元后头都得挂一个 ReLU。" },
    { emoji: "⛰️", who: "黑板", say: "反向传播 = 算账: 每个神经元按'你贡献了多少错'挨打(梯度), 挨打得最狠的先改。" }
  ],
  lesson: [
    {
      title: "① 没有激活函数, 多层 = 一层",
      normal: "线性变换套线性变换还是线性: W2(W1x) = (W2·W1)x, 两层折叠成一层。ReLU 引入非线性, 网络才有'画弯线'的能力。",
      roast: "不挂激活函数的多层网络, 就像五层楼但每层都打通了楼板 —— 实际就一层, 还更贵。"
    },
    {
      title: "② 反向传播 = 链式法则分工算账",
      normal: "输出层误差沿计算图逐层往回传: 每层拿到'我这段对最终误差的责任有多大'(局部梯度), 乘上游误差, 得到该层的参数梯度。",
      roast: "反向传播就是部门甩锅: 谁环节出问题, 梯度就精确地甩到谁头上, 一个都跑不掉。"
    },
    {
      title: "③ ReLU 的死神经元",
      normal: "ReLU 对负输入梯度为 0: 参数一旦更新到让某神经元持续吃负值, 它就'死'了 —— 学不动, 也不贡献。学习率过大是高发原因。",
      roast: "死神经元 = 团队里躺平的那位: 活还在你工位上, 人已摆烂。"
    }
  ],
  starter: `import numpy as np

# 数据: 两个同心圆 (线性模型的天敌, 神经网络的主场)
rng = np.random.default_rng(0)
dirs = np.array([[1, 0], [0, 1], [-1, 0], [0, -1]], dtype=float)
X_out = rng.uniform(0.8, 1.2, (150, 2)) * dirs[rng.integers(0, 4, 150)]
X_in  = rng.uniform(0.2, 0.4, (150, 2)) * dirs[rng.integers(0, 4, 150)]
X = np.vstack([X_out, X_in])
y = np.array([0] * 150 + [1] * 150)      # 外圈=0, 内圈=1

# 网络: 2 -> 16 -> 1
# 注意: 必须随机初始化! 全 0 初始化时 z1=0, ReLU 后 a1=0, 梯度全 0 —— 神经元集体摆烂, 学不动
W1, b1 = rng.normal(0, 0.5, (2, 16)), np.zeros(16)
W2, b2 = rng.normal(0, 0.5, 16), 0.0

def forward(x):
    z1 = x @ W1 + b1
    a1 = None        # TODO-1: ReLU 激活
    z2 = a1 @ W2 + b2
    p  = None        # TODO-2: sigmoid, 把 z2 压成概率
    return z1, a1, z2, p

def accuracy():
    p = forward(X)[3]
    return float(np.mean((p >= 0.5) == y))

lr = 0.5
for _ep in range(300):
    z1, a1, z2, p = forward(X)
    # TODO-3: 推导并写出全部梯度, 然后更新 4 个参数 (lr=0.5)
    # 提示链(交叉熵+sigmoid 的输出层梯度已化简为 err = p - y):
    #   dz2 = err / n(每个样本的输出层误差, 标量向量)
    #   dW2 = a1.T @ dz2                  db2 = dz2.sum()
    #   da1 = dz2[:, None] * W2         (误差经 W2 流回隐藏层)
    #   dz1 = da1 * (z1 > 0)            (ReLU 导数: 正=1, 负=0)
    #   dW1 = X.T @ dz1                 db1 = dz1.sum()
    # 更新: W1 -= lr*dW1; b1 -= lr*db1; W2 -= lr*dW2; b2 -= lr*db2

acc = accuracy()
print("两圈分家准确率:", acc)
`,
  solution: `import numpy as np

# 数据: 两个同心圆
rng = np.random.default_rng(0)
dirs = np.array([[1, 0], [0, 1], [-1, 0], [0, -1]], dtype=float)
X_out = rng.uniform(0.8, 1.2, (150, 2)) * dirs[rng.integers(0, 4, 150)]
X_in  = rng.uniform(0.2, 0.4, (150, 2)) * dirs[rng.integers(0, 4, 150)]
X = np.vstack([X_out, X_in])
y = np.array([0] * 150 + [1] * 150)

# 网络: 2 -> 16 -> 1 (随机初始化: 全 0 会让 ReLU 神经元集体摆烂, 梯度归零)
W1, b1 = rng.normal(0, 0.5, (2, 16)), np.zeros(16)
W2, b2 = rng.normal(0, 0.5, 16), 0.0

def forward(x):
    z1 = x @ W1 + b1
    a1 = np.maximum(z1, 0.0)             # ReLU: 负的砍成 0, 简单粗暴
    z2 = a1 @ W2 + b2
    p  = 1.0 / (1.0 + np.exp(-z2))      # sigmoid → 概率
    return z1, a1, z2, p

def accuracy():
    p = forward(X)[3]
    return float(np.mean((p >= 0.5) == y))

# 训练: 交叉熵 + sigmoid 的输出层梯度化简为 err = p - y (很巧, 背下来)
lr = 0.5
for _ep in range(300):
    z1, a1, z2, p = forward(X)
    err = p - y
    dz2 = err / len(X)
    dW2 = (a1.T @ dz2).squeeze()          # (n,16)^T @ (n,) -> (16,); 忘了 squeeze 会炸维度
    db2 = dz2.sum()
    da1 = dz2[:, None] * W2              # 误差经 W2 流回隐藏层
    dz1 = da1 * (z1 > 0)                 # ReLU 导数: 正=1, 负=0
    dW1 = X.T @ dz1
    db1 = dz1.sum()
    W1 -= lr * dW1; b1 -= lr * db1
    W2 -= lr * dW2; b2 -= lr * db2

acc = accuracy()
print("两圈分家准确率:", acc)
print("小白: 两个圈, 一条弯曲线, 一层 MLP 就分开了 —— 这就是'非线性'的价值。")
`,
  tests: [
    { id: "c3t1", type: "py", fn: "test_accuracy", name: "准确率 > 90% (两圈分开了)",
      py: "def test_accuracy():\n    assert accuracy() > 0.90" },
    { id: "c3t2", type: "py", fn: "test_relu_killed", name: "ReLU 铁律: z1<0 处 a1 必须为 0",
      py: "def test_relu_killed():\n    z1, a1, z2, p = forward(X)\n    assert (a1[z1 < 0] == 0).all()" },
    { id: "c3t3", type: "py", fn: "test_no_nan", name: "参数没炸(全有限)",
      py: "def test_no_nan():\n    assert np.isfinite(W1).all() and np.isfinite(W2).all()" }
  ],
  boss: [
    { q: "把 ReLU 换成「什么都不加」, 8 个隐藏神经元还起作用吗?",
      options: ["起作用, 层数多总好", "不起作用, 两层线性折叠成一层", "反而更强", "只有 b2 起作用"],
      answer: 1, why: "W2(W1x) = (W2·W1)x —— 没有非线性, 堆多少层都等价于一层。" },
    { q: "反向传播的本质是什么?",
      options: ["随机猜参数", "用链式法则, 把输出误差按贡献逐层分配, 得到每个参数的梯度", "把损失除以层数", "重新前向 100 遍"],
      answer: 1, why: "反向 = 一次反向遍历, 沿计算图用链式法则精确'算账', 每个参数知道自己该改多少。" },
    { q: "什么情况下 ReLU 神经元会'死'?",
      options: ["学习率过大导致其输入长期为负, 梯度恒为 0", "数据太少", "网络太浅", "永远死不了"],
      answer: 0, why: "输入长期为负 → 梯度 0 → 参数不再更新 → 永远负。学习率过大会批量制造死神经元。" }
  ],
  mantra: "前向算答案, 反向算锅谁背;激活不加, 白搭。",
  notes: ["交叉熵+sigmoid 的输出层梯度化简为 p-y", "ReLU 导数: (z1>0) 这一个 bool 数组", "死神经元高发于 lr 过大", "下一章: 卷积 —— 让'找边'变成滚一滚"]
});
