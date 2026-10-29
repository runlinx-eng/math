import {LESSONS,lessonForTopic} from './learning/catalog.js';
import {TASKS} from './learning/tasks.js';

// Local labels for actual activity controls, never classifications of mastery.
// Unmapped models keep a neutral label rather than an inferred action.
const sets={
  blocks:'fill unit cube-plan irregular decompose x-powerbuild x-g27-build x-g27-net x-g27-cut x-m31-cubes x-m31-fill',
  portions:'partition equivalent grid match x-circlecut x-fraction x-fwall x-foldpaper x-fgroups x-hundredsplit x-portiongroups x-paperlab x-samefraction x-wholeshare x-portionbar x-fdpboard x-fracorder x-fracrename x-fracshare x-percentkit x-r37-share',
  line:'line x-fline x-countwalk x-orderline x-pvline x-signedline x-directedjump x-zerodistance x-allowedrange x-betweenpoints x-unitwalk x-mixedaxis x-signwalk x-decimalzoom x-routecalc',
  chart:'chart survey compare x-chartlab x-datacount x-datastudio x-dataplan x-dataclean x-timeplot x-dotdraw x-piesector x-histbuild x-scatterbuild x-boxsummary x-distribution x-graphcompare x-m28-plot x-f36-plot x-f36-live x-s39-chart x-s39-graph',
  shape:'x-floor x-solid x-net x-rectangle x-mosaic x-s23-polygon x-s23-frame x-s23-tile x-s23-symmetry x-s23-circle x-s23-compass x-p24-grid x-p24-transform x-p24-mirror x-p24-spin x-g25-turn x-g25-protractor x-g25-triangle x-g26-area x-a30-grid x-a30-pieces x-a30-solid x-r37-shape',
  measure:'x-measure x-capacity x-toolwork x-m28-ruler x-m28-scale x-m28-vessels x-m28-balance x-m31-meter x-m31-balance x-t32-clock x-t32-stopwatch',
  counters:'x-counttrail x-paircounts x-onechange x-partbuild x-bundlecount x-teenbuild x-pvbench x-wideboard x-splitbench x-tenbridge x-threegroups x-mulgroups x-mularray x-areaproduct x-placecalc x-r37-pair',
};
export const ACTIVITY_FORMS={
  blocks:{label:'搭与拆积木',path:'M5 12 16 6 27 12 16 18Z M5 12v12l11 6 11-6V12 M16 18v12'},
  portions:{label:'分份与取量',path:'M3 10h28v14H3Z M10 10v14 M17 10v14 M24 10v14'},
  line:{label:'沿数轴走',path:'M3 18h28 M6 14v8 M13 14v8 M20 14v8 M27 14v8 M6 13Q13 1 20 13 M17 10l3 3 1-4'},
  chart:{label:'记录与画图',path:'M4 5v24h26 M9 23v-7h4v7 M18 23V9h4v14 M27 23V5h3v18'},
  shape:{label:'拼图形与变换',path:'M3 27 12 7 21 27Z M18 6h12v12H18Z M24 24h6v6h-6Z'},
  measure:{label:'用屏幕工具量',path:'M3 12h28v12H3Z M8 12v7 M14 12v4 M20 12v7 M26 12v4'},
  counters:{label:'摆物品与分组',path:'M4 7h7v7H4Z M16 7h7v7h-7Z M4 21h7v7H4Z M16 21h7v7h-7Z M29 5v25'},
  steps:{label:'按步骤试一试',path:'M4 7h5v5H4Z M14 10h16 M4 21h5v5H4Z M14 24h16'},
};
const formByType=new Map(Object.entries(sets).flatMap(([form,list])=>list.split(' ').map(type=>[type,form])));
export function activityForms(id){
  const lesson=lessonForTopic(id);if(!lesson||!LESSONS[lesson])return [];
  const forms=[...new Set((TASKS[lesson]||[]).map(t=>formByType.get(t.type)||'steps'))];
  return forms.sort((a,b)=>(a==='steps')-(b==='steps'));
}
export function activityGlyph(form){
  const item=ACTIVITY_FORMS[form]||ACTIVITY_FORMS.steps;
  return `<svg class="activity-glyph" viewBox="0 0 34 34" aria-hidden="true"><path d="${item.path}"/></svg>`;
}
