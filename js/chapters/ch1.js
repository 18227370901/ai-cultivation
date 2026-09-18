/* 境界二 · Python 心法: 脏数据三术 (Pandas) */
(window.CHAPTERS = window.CHAPTERS || []).push({
  id: "ch1",
  realm: "境界二 · Python 心法",
  title: "第 1 章 · 脏数据三术(填充 / 分组 / 合并)",
  tagline: "撕毁《脏数据残卷》",
  emoji: "📜",
  comic: [
    { emoji: "🧒", who: "凡人", say: "一卷 80 页的残卷,每翻一页就掉渣。这……要我怎么学?" },
    { emoji: "🐕", who: "小白", say: "掉渣的是缺失值,渣里藏金子。真正的数据 90% 时间花在清洗上 —— 这就是'脏活'的由来。" },
    { emoji: "📜", who: "残卷", say: "第一术:同组均值填补。阿豪的两条评分,一条缺失 —— 用他自己的平均填回去,合理!" },
    { emoji: "⚔️", who: "洞主", say: "记住铁律:向量化!在 Pandas 里写 for 循环,等于在剑上刻字 —— 能跑,但耻度高。" }
  ],
  lesson: [
    {
      title: "① 缺失值处理",
      normal: "缺失值 ≠ 0,盲目填 0 会污染统计。常见策略:均值/中位数填补、同组统计量填补(fillna + groupby transform)、直接删除。",
      roast: "缺失值就是数据界的'迟到者'。你不能用它昨天的 KPI 填今天的表,但可以用它全年的平均水平补个大概。"
    },
    {
      title: "② groupby:数据分析万金油",
      normal: "分-算-聚三分法:按 key 分组,组内计算,再聚合。'每个门店的平均分''每个用户退款几次'都是它。",
      roast: "groupby 就是数据界的'班主任':先按班级分组,再点名算平均分。"
    },
    {
      title: "③ 向量化是铁律",
      normal: "Pandas/NumPy 的底层是 C 实现的数组运算,一行向量化 ≈ 几百行 Python 循环的速度。写代码前先问:能向量化吗?",
      roast: "在 Pandas 里写 for 循环,等于开拖拉机去送快递 —— 能送到,但路观(路人观感)极差。"
    }
  ],
  starter: `import pandas as pd

# 内置"外卖差评数据"(别笑,真实业务数据就是这么脏)
orders = pd.DataFrame({
    "用户": ["阿豪", "阿豪", "小雨", "小雨", "大毛", "大毛", "大毛", "阿豪"],
    "门店": ["麻辣烫", "麻辣烫", "轻食", "轻食", "烧烤", "烧烤", "烧烤", "奶茶"],
    "评分": [2, None, 5, 4, 3, 3, 4, 1],        # 缺失值, 洞主特供
    "退款": [0, 0, 1, 0, 0, 1, 1, 1],
})

# TODO-1: 缺失评分填「同用户均值」。
# 提示: groupby + transform(保持行对齐, 直接填回原表), 不许写循环。
orders["评分"] = orders.groupby("用户")["评分"].transform(lambda s: s.fillna(None))

# TODO-2: 各门店平均评分, 降序; 只看评分 >= 4 的行(注意: 要排序, 别忘了)
top = orders[orders["评分"] >= 4].groupby("门店")["评分"].mean()

# TODO-3: 谁退款最多? 输出 (用户, 次数) 并按次数降序
refund = orders[orders["退款"] == 1].groupby("用户").size()
`,
  solution: `import pandas as pd

# 内置"外卖差评数据"
orders = pd.DataFrame({
    "用户": ["阿豪", "阿豪", "小雨", "小雨", "大毛", "大毛", "大毛", "阿豪"],
    "门店": ["麻辣烫", "麻辣烫", "轻食", "轻食", "烧烤", "烧烤", "烧烤", "奶茶"],
    "评分": [2, None, 5, 4, 3, 3, 4, 1],
    "退款": [0, 0, 1, 0, 0, 1, 1, 1],
})

# 第一术: 同用户均值填补 (groupby + transform 保持行对齐)
orders["评分"] = orders.groupby("用户")["评分"].transform(
    lambda s: s.fillna(s.mean()))

# 第二术: 过滤 + 分组 + 排序, 一行链式, 行云流水
top = (orders[orders["评分"] >= 4]
       .groupby("门店")["评分"].mean()
       .sort_values(ascending=False))

# 第三术: 退款次数排行
refund = (orders[orders["退款"] == 1]
          .groupby("用户").size()
          .sort_values(ascending=False))

print("== 高分门店 =="); print(top)
print("== 退款排行 =="); print(refund)
print("小白: 阿豪奶茶评 1 分还退款, 这个人设, 立住了。")
`,
  tests: [
    { id: "c1t1", type: "py", fn: "test_fillna", name: "缺失值被填完",
      py: "def test_fillna():\n    assert orders[\"评分\"].isna().sum() == 0" },
    { id: "c1t2", type: "py", fn: "test_fill_value", name: "阿豪缺失项 = 同用户均值 1.5",
      py: "def test_fill_value():\n    v = orders[orders[\"用户\"] == \"阿豪\"][\"评分\"].iloc[1]\n    assert abs(float(v) - 1.5) < 1e-9" },
    { id: "c1t3", type: "py", fn: "test_top_store", name: "高分门店第一名 = 轻食",
      py: "def test_top_store():\n    assert list(top.index)[0] == \"轻食\"" },
    { id: "c1t4", type: "py", fn: "test_refund_top", name: "退款之王 = 大毛(2 次)",
      py: "def test_refund_top():\n    assert refund.index[0] == \"大毛\" and refund.iloc[0] == 2" },
    { id: "c1t5", type: "src", name: "向量化铁律: 禁止 for 循环",
      expr: "!(/\\bfor\\s+\\w+/.test(code))" }
  ],
  boss: [
    { q: "groupby 时如果分组列本身含缺失值,这些行会?",
      options: ["归到 '未知' 组", "被静默丢弃(不参与分组)", "报错", "变成一组"],
      answer: 1, why: "Pandas 默认 dropna=True,缺失 key 的行直接被扔掉 —— 统计前记得先查行数对不对。" },
    { q: "merge 和 concat 的本质区别?",
      options: ["merge 是横向按 key 关联(数据库 JOIN),concat 是纵向直接摞起来", "完全一样", "concat 只能纵向, merge 只能一列", "merge 更快"],
      answer: 0, why: "想'两张表按用户拼在一起'用 merge;想'两张同构表摞起来'用 concat。" },
    { q: "什么场景最适合用 pivot_table?",
      options: ["数据只有一列", "把宽表摊平成多行", "把'行×列×值'交叉统计,比如各门店各月销售额", "填充缺失值"],
      answer: 2, why: "透视表 = 交叉分组聚合,Excel 里那个'数据透视表',就是它。" }
  ],
  mantra: "脏数据,先填再分组;for 循环,是 Pandas 的耻辱柱。",
  notes: ["fillna(groupby mean) 是补缺失三板斧之一", "transform vs agg: 前者保持行对齐,后者聚合成一行", "链式写法(不拆行)可读性和性能都更好", "下一章: 手搓梯度下降, 掌门说了'不许调包'"]
});
