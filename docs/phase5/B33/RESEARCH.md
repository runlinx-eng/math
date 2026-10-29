# B33 教学依据与边界

固定上游提交 `a8719737ff86ef7940ba5feca11940de1204103e`。16 个主题中 8 个有上游研究、8 个缺记录；逐主题目标、原研究和邻接关系见 [source-review.json](source-review.json)。研究是建议，不是孩子学习效果的证据。教学路线不按年级或教材锁定。

## 币种和面值

用清楚标记的示意硬币和纸币表示价值，不以图像大小或硬币数代替金额；英国便士与英镑、澳大利亚美分与澳元、美国美分与美元是不同货币体系，不能直接相加。英国 1 英镑＝100 便士；[英国皇家造币厂](https://www.royalmint.com/globalassets/consumer/_campaigns/2023/definitives/mintlings/definitives-mintlings-booklet.pdf)列出八种常用硬币面值，[英格兰银行](https://www.bankofengland.co.uk/banknotes/current-banknotes)列出其 £5 和 £10 等纸币。澳大利亚 $2 硬币面值高于 50c，但[直径为 20.50 mm](https://ramint.gov.au/collect/national-coin-collection/circulating-coins/two-dollars)，小于 [50c 的 31.65 mm](https://ramint.gov.au/collect/national-coin-collection/circulating-coins/fifty-cents)。用标值卡片不等于认识真实硬币或独立解释。

[美国造币厂](https://www.usmint.gov/learn/coins-and-medals/circulating-coins)列出 nickel、dime、quarter 的 5、10、25 美分面值；1 美分硬币已停止为流通生产，仍可能作为已有硬币用于旧情境。具体演示只使用标明的币种与面值，不做汇率换算。

## 组合、估计、找零与预算

同一个目标金额可用不同组硬币组成；找零是付款与总价之差，也可以从价格向上数到付款额。澳大利亚题中 85c 可用 50c＋20c＋10c＋5c，以四枚组成；可用穷举或动态规划检查给定面值下最少数量。选择前先估算、之后计算并核对，保留原估计；使用模拟计算器不证明心算、纸笔方法或估算策略已独立形成。

澳大利亚现金总额以最接近 5c 为例，12.37 变为 12.35，8.48 变为 8.50；[ACCC 2000 年的说明](https://www.accc.gov.au/media-release/rounding-and-eftpos-transactions)区分现金总额与当时不必取整的电子付款。这里只做标明币种和支付方式的数学示例，不将其套用到所有国家、单件标价或电子交易，也不据此给出现行法律结论。

预算选择保留不超过预算的多个可行方案，不把某一个购物清单当唯一正确答案；购买数量、预算与已用金额应同步可见。比较相同产品时将价格换算到相同单位：[ACCC 单价说明](https://www.accc.gov.au/consumers/pricing/unit-prices-for-groceries)支持按相同单位比较；价格之外的质量、偏好与浪费不由数值推断。2 kg 售 $5.80 是每 kg $2.90，500 g 售 $1.60 是每 kg $3.20。

## 折扣、税和表格

折扣按原价计算；消费税示例只限定为题目给定的澳大利亚 GST：税前 $45 的 10% 为 $4.50，税后为 $49.50；标为含税的价格不再重复添加同一税额。[澳大利亚税务局说明](https://www.ato.gov.au/about-ato/research-and-statistics/in-detail/tax-gap/a-h-tax-gaps/goods-and-services-tax-gap/overview)将澳大利亚 GST 描述为多数货物和服务适用的 10% 消费税，具体情况有例外；本课程不把示例当税务建议。余额中的负数表示相对于零点的欠额或负余额，具体账户规则不在模型中推断。

电子表格应由孩子写入有引用的公式并可看到计算后变化，以有限白名单表达式安全求值；逐项注明公式格式、精度和取整方式。固定表格不是完整电子表格软件，程序不能评估自由解释或一般工作能力。金额计算以整数分和精确有理数保存；不以二进制浮点近似结果直接判错。
