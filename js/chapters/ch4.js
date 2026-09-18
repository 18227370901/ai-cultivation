/* 境界五 · 万法宫(卷积篇): 手搓 2D 卷积找边缘 */
(window.CHAPTERS = window.CHAPTERS || []).push({
  id: "ch4",
  realm: "境界五 · 万法宫·卷积篇",
  title: "第 4 章 · 手搓 2D 卷积(找边神器)",
  tagline: "认出那只 28×28 的像素猫",
  emoji: "🧶",
  comic: [
    { emoji: "🐱", who: "洞主", say: "一只 8×8 的像素猫: 中间 4×4 白方块, 周围黑。它有没有'边'? 找出来。" },
    { emoji: "🧒", who: "凡人", say: "把一个小过滤器在图上滚一遍? 对齐、相乘、求和?" },
    { emoji: "🐕", who: "小白", say: "对! 对齐·相乘·求和, 就是卷积的全部。过滤器扫到'左亮右暗'的位置, 读数就爆炸。" },
    { emoji: "🧶", who: "小白", say: "为什么叫'卷积'? 其实是相关运算的历史包袱。但'权重共享'是真的: 一个核扫全图, 省多少参数? 想象一下。" }
  ],
  lesson: [
    {
      title: "① 卷积 = 对齐·相乘·求和",
      normal: "卷积核在图像上滑动, 每个位置做逐元素相乘再求和, 得到一个响应值。特定形状的核(如左右差值核)专挑特定纹理。",
      roast: "卷积就是拿一个小模板在图上'盖章扫描', 哪儿对版响哪儿。"
    },
    {
      title: "② 权重共享",
      normal: "同一个核扫过全图 —— 不管边角还是中心, 用的都是同一组参数。相比全连接, 参数量少几个数量级, 这是 CNN 能处理大图的关键。",
      roast: "全连接: 每个像素单独收保护费。CNN: 一个保安巡全场, 还管够。"
    },
    {
      title: "③ 池化 = 有损压缩",
      normal: "max/avg 池化把特征图缩小(常用 2×2 步长 2): 降低算力、增强对微小平移的鲁棒性, 代价是空间精度下降。",
      roast: "池化就是'差不多得了': 2×2 取个最大的, 细节? 细节是奢侈品。"
    }
  ],
  starter: `import numpy as np

# 8x8 "图像": 中间 4x4 白色方块(1), 四周黑(0)
img = np.zeros((8, 8), dtype=int)
img[2:6, 2:6] = 1

def conv2d(img, kernel, stride=1):
    """TODO: 对齐·相乘·求和。
    提示: 输出尺寸 (in - k) // stride + 1; 遍历每个位置, 取 img 的块 * kernel 再求和。
    (本层允许循环 —— 卷积的精髓是'滚', 循环正是滚)"""
    return None

# "左亮右暗"竖边缘探测器
k = np.array([[1, -1], [0, 0]])
edges = conv2d(img, k)
print("响应图:\\n", edges)
`,
  solution: `import numpy as np

# 8x8 "图像": 中间 4x4 白色方块(1), 四周黑(0)
img = np.zeros((8, 8), dtype=int)
img[2:6, 2:6] = 1

def conv2d(img, kernel, stride=1):
    kh, kw = kernel.shape
    oh = (img.shape[0] - kh) // stride + 1
    ow = (img.shape[1] - kw) // stride + 1
    out = np.zeros((oh, ow))
    for i in range(oh):
        for j in range(ow):
            patch = img[i * stride:i * stride + kh, j * stride:j * stride + kw]
            out[i, j] = np.sum(patch * kernel)
    return out

# "左亮右暗"竖边缘探测器: 白方块的右边界(列 5->6 突变处)响应拉满
k = np.array([[1, -1], [0, 0]])
edges = conv2d(img, k)
print("响应图:\\n", edges)
print("小白: 右边缘 [2:4, 5] 处响应 = 1 —— 就是那块白皮的断崖。")
print("小白: 全白图呢? 处处平坦, 响应全 0 —— 没有边, 自然不响。")
`,
  tests: [
    { id: "c4t1", type: "py", fn: "test_shape", name: "8x8 图 + 2x2 核 → 输出 (7, 7)",
      py: "def test_shape():\n    assert edges.shape == (7, 7)" },
    { id: "c4t2", type: "py", fn: "test_edge", name: "右边缘 [2:4, 5] 响应 = 1",
      py: "def test_edge():\n    assert edges[2, 5] == 1 and edges[3, 5] == 1" },
    { id: "c4t3", type: "py", fn: "test_flat", name: "全白图(无边缘)响应和 = 0",
      py: "def test_flat():\n    flat = conv2d(np.ones((8, 8), dtype=int), k)\n    assert flat.sum() == 0" }
  ],
  boss: [
    { q: "卷积的「权重共享」相比全连接, 最大好处是?",
      options: ["图更大", "参数量少几个数量级, 且天然平移等变", "训练更快更准", "不用反向传播"],
      answer: 1, why: "同一个核扫全图 → 参数 = 核大小, 与图大小无关。全连接的参数 = 全图 × 特征, 天文数字。" },
    { q: "2×2 max 池化(步长 2)对 8×8 特征图做, 代价是?",
      options: ["无代价", "空间精度降一半(→4×4), 换算力与平移鲁棒", "参数翻倍", "只能用于颜色图"],
      answer: 1, why: "池化是'有损压缩': 每个 2×2 只留最大值, 位置信息直接砍半。" },
    { q: "想让模型感知更大范围的上下文(感受野), 常规做法是?",
      options: ["降低学习率", "堆卷积层 / 用更大核 / 池化降采样", "增加 batch size", "删掉激活函数"],
      answer: 1, why: "感受野 = 输入图上能影响某个输出的区域, 随层数、核大小、池化逐步扩大。" }
  ],
  mantra: "卷积滚一滚, 边缘自己现;池化压一压, 算力省一半。",
  notes: ["卷积核 = 局部特征的探测器, 不同核挑不同纹理", "卷积的循环是'滚', 不属于向量化铁律的反例", "输出尺寸公式: (in - k) // stride + 1", "下一章: 注意力 —— 序列世界的边缘探测器"]
});
