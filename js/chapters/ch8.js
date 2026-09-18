/* 境界九 · LoRA 仙门: 微调的艺术 (手搓 LoRA 数学核心) */
(window.CHAPTERS = window.CHAPTERS || []).push({
  id: "ch8",
  realm: "境界九 · LoRA 仙门",
  title: "第 8 章 · 手搓 LoRA(两把小刀)",
  tagline: "仙门规矩: 大权重冻住, 只带两把小刀",
  emoji: "🗡️",
  comic: [
    { emoji: "🗡️", who: "仙门长老", say: "大模型几百亿参数, 你要全训? 算力和钱都不答应。" },
    { emoji: "🧒", who: "凡人", say: "那...不动大刀, 磨两把小刀(A 和 B), 只训它们?" },
    { emoji: "🐕", who: "小白", say: "对。W' = W + B·A, B 还是零初始化的 —— 上车那天, 模型表现和原来一模一样, 安全。" },
    { emoji: "🗡️", who: "仙门长老", say: "铁律: B 必须零初始化。不然'微调'变'毁法' —— 一上车就面目全非。" }
  ],
  lesson: [
    {
      title: "① 低秩分解: 大矩阵改动 = 两个小矩阵",
      normal: "微调对权重的改变 ΔW 通常'近似低秩'(有效改动方向远少于全秩)。所以 ΔW ≈ B·A: B(r×d) 和 A(d×r), 可训练参数从 d² 降到 2·d·r。",
      roast: "大模型要改的不是一张白纸, 是几个'主要方向' —— 抓住几个方向就够, 何必动全表?"
    },
    {
      title: "② B 零初始化 = 安全上车",
      normal: "B=0 → ΔW=0 → 微调开始前模型行为与原模型完全一致, 训练是'渐进'的。这是 LoRA 能无痛接入预训练模型的保证。",
      roast: "B 不置零 = 司机还没上车先把车改废了。"
    },
    {
      title: "③ 何时微调, 何时 RAG",
      normal: "要改'知识/事实' → RAG; 要改'风格/格式/领域语气/行为' → 微调。两者常配合: RAG 喂知识, 微调定风格。",
      roast: "知识进文档(随时能换), 性格进权重(改了就不好改回)。"
    }
  ],
  starter: `import numpy as np

rng = np.random.default_rng(7)
W = rng.normal(0, 1, (8, 8))      # 冻结的预训练大权重
r = 2                              # 秩: 你的小刀几寸?
A = rng.normal(0, 0.1, (r, 8))
B = np.zeros((8, r))              # B 零初始化: 仙门第一铁律

alpha = 1.0
def forward_with_lora(x):
    """TODO-1: LoRA 前向 = 原前向 + 低秩增量。
    提示: ΔW = B @ A  (注意顺序! 算好维度再动手: B(8,2) @ A(2,8) = (8,8))
    缩放因子: alpha / r"""
    return x @ W

x = rng.normal(0, 1, (4, 8))
# 第一铁律自检: 此刻 B=0, 输出必须等于原模型(安全上车)
assert np.allclose(forward_with_lora(x), x @ W)
print("上车自检通过: ΔW = 0, 行为与原模型一致")

# 修炼: 模拟梯度更新 A 和 B (真实场景是 SFT 数据驱动)
B += 0.1 * rng.normal(0, 1, B.shape)
A += 0.1 * rng.normal(0, 1, A.shape)
print("练后差异 (前 4 行):\\n", forward_with_lora(x)[:2] - (x @ W)[:2])
`,
  solution: `import numpy as np

rng = np.random.default_rng(7)
W = rng.normal(0, 1, (8, 8))      # 冻结的预训练大权重
r = 2
A = rng.normal(0, 0.1, (r, 8))
B = np.zeros((8, r))              # B 零初始化: 仙门第一铁律

alpha = 1.0
def forward_with_lora(x):
    """原前向 + 低秩增量: x @ W + (alpha/r) * x @ (B @ A)"""
    delta = B @ A                    # (8,2) @ (2,8) = (8,8)
    return x @ W + (alpha / r) * x @ delta

x = rng.normal(0, 1, (4, 8))
assert np.allclose(forward_with_lora(x), x @ W)   # B=0 → 增量恒 0
print("上车自检通过: ΔW = 0, 行为与原模型一致")

# 模拟梯度更新: A、B 各挪一小步
B += 0.1 * rng.normal(0, 1, B.shape)
A += 0.1 * rng.normal(0, 1, A.shape)
print("练后输出变了(前 2 行差异):\\n", forward_with_lora(x)[:2] - (x @ W)[:2])
print("小白: 只动了 32 个参数, 64 个大权重纹丝未动 —— 这就是'带小刀进修'。")
`,
  tests: [
    { id: "c8t1", type: "py", fn: "test_zero_init", name: "零初始化性质: B=0 → 增量=0",
      py: "def test_zero_init():\n    B0 = np.zeros((8, 2))\n    out0 = x @ W + (1.0 / 2) * x @ (B0 @ A)\n    assert np.allclose(out0, x @ W)" },
    { id: "c8t2", type: "py", fn: "test_param_save", name: "可训练参数占比 < 40% (真省了)",
      py: "def test_param_save():\n    trainable = A.size + B.size\n    assert trainable < 0.4 * (W.size + trainable)" },
    { id: "c8t3", type: "py", fn: "test_rank_matters", name: "秩的影响: 只用 rank-1 结果不同",
      py: "def test_rank_matters():\n    full  = x @ W + (1.0 / 2) * x @ (B @ A)\n    rank1 = x @ W + 1.0 * x @ (B[:, :1] @ A[:1, :])\n    assert not np.allclose(full, rank1)" }
  ],
  boss: [
    { q: "LoRA 为什么 B 必须零初始化?",
      options: ["让 A 学更快", "微调开始前增量 ΔW=B·A=0, 模型行为与原模型完全一致, 训练是渐进的", "省显存", "B 非零会报错"],
      answer: 1, why: "B=0 → ΔW=0。不上车就改行为 = 毁掉预训练成果, 训练无法'在原地起步'。" },
    { q: "想把公司私有知识库(合同/规章)教给模型, 首选?",
      options: ["全量微调", "RAG(知识放文档里, 随时可更新可溯源)", "LoRA 微调", "加大学习率"],
      answer: 1, why: "事实性知识进 RAG(可更新), 风格/行为才进权重(微调)。把知识塞进权重=改了没法撤。" },
    { q: "可训练参数量 32, 原参数 64, 训练成本相比全参数大约?",
      options: ["一样", "约一半(且 LoRA 只训小矩阵, 显存/算力更低)", "3 倍", "无法比较"],
      answer: 1, why: "只优化 32 个参数 → 优化器状态/梯度都减半, 加上冻结主干省显存, 消费级显卡可微调 7B。" }
  ],
  mantra: "大权重, 冻起来;小低秩, 练出来;B 置零, 才是仙门规矩。",
  notes: ["ΔW = B@A, 顺序别写反(先算维度)", "B 零初始化 = 安全上车", "知识 → RAG, 风格 → 微调", "最终章: 飞升试炼, 组合所有境界手搓 mini RAG"]
});
