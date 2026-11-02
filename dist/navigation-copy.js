// User-facing navigation copy. Source atlas data, membership and source edges stay unchanged.
// This is the one authoritative UI override for the five themes and 23 knowledge groups.
export const THEME_COPY=Object.freeze({
  numbers:{description:'从数量和数的表示出发，探索加减、乘除、分数与比例。'},
  space:{description:'认识平面和立体图形，观察位置、方向、角与图形变换。'},
  measure:{title:'测量与生活中的量',description:'用单位描述长度、面积、体积、时间，也学习货币与价格。'},
  patterns:{description:'寻找变化规律，用等式、公式和推理解释数学关系。'},
  data:{description:'收集、整理和分析数据，研究事件发生的可能性。'}
});
export const GROUP_COPY=Object.freeze({
  'number-sense':{title:'数的表示与大小',question:'怎样数清数量？数位和数轴怎样帮助我们表示、比较数？'},
  'add-subtract':{title:'加法与减法',question:'合并、增加、拿走或比较时，怎样判断用加法还是减法？'},
  'groups':{title:'乘法与除法',question:'同样多的几组和平均分，怎样用乘法、除法表示？'},
  'same-amount':{title:'分数的认识与等值',question:'怎样用分数表示部分与整体？不同分数何时表示同一个数？'},
  'fraction-operations':{title:'分数运算',question:'分数怎样相加、相减、相乘或相除？'},
  'scaling':{title:'比例与百分数',question:'一个量按比例变化时，怎样用比、分数与百分数表示关系？'},
  shapes:{title:'平面图形的特征',question:'看边、角和形状的特征，怎样辨认、拼合与比较平面图形？'},
  positions:{question:'怎样描述一个位置？移动、翻转或旋转后，什么变了、什么没变？'},
  angles:{title:'角、直线与三角形',question:'角的大小怎样比较？直线和三角形有哪些重要关系？'},
  solids:{title:'立体图形与展开',question:'立体图形的面、棱和顶点有什么特点？展开或切开会看到什么？'},
  units:{title:'测量与单位',question:'测量长度、质量等量时，为什么要选择合适的单位？'},
  area:{title:'周长与面积',question:'围一圈的长度和铺满里面的大小，为什么是两种不同的量？'},
  volume:{title:'体积与容积',question:'物体占多大空间？容器最多能装多少？'},
  time:{title:'时间与时长',question:'事情发生在什么时候？从开始到结束持续了多久？'},
  money:{title:'货币与购物',question:'钱的面值、商品价格、找零和预算，怎样计算与比较？'},
  patterns:{question:'什么部分在重复？数量怎样变化？能说明自己发现的规则吗？'},
  unknowns:{title:'等式与未知数',question:'等号表示什么？怎样根据数量关系找到未知数？'},
  functions:{title:'公式与变化关系',question:'一个量变化时，怎样用公式或图像描述另一个量的变化？'},
  reasoning:{title:'数学思维与推理',question:'怎样用图、例子和理由说明一个想法，再用反例检查它？'},
  collect:{title:'数据收集与分类',question:'要回答一个问题，该收集什么数据？怎样分类和记录才可靠？'},
  display:{title:'图表与数据表示',question:'同一组数据用表格、条形图或点图表示，各有什么用？'},
  summarize:{title:'数据分析与推断',question:'平均数等指标能告诉我们什么？根据一部分数据能判断多少？'},
  chance:{title:'概率与可能性',question:'哪些结果可能发生？怎样比较它们发生的机会？'}
});
export function applyNavigationCopy(atlas){
  for(const theme of atlas.themes||[]){const copy=THEME_COPY[theme.id];if(copy)Object.assign(theme,copy);}
  for(const group of atlas.packs||[]){const copy=GROUP_COPY[group.id];if(copy)Object.assign(group,copy);}
  return atlas;
}
