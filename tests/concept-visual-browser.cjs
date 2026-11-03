// Sixty-node UI review: five source types, eleven domains, procedural patterns, and fifteen exact visuals; progressive explanation and map invariants.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.MATH_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../verification/concept-language-pilot');
const ids=[
  ['count','mt_WcfaSfVT33'],['addition','mt_OvyoRo47K-'],
  ['numberline-fractions','mt_Ep7TDFuYUa'],['construct-fractions','mt_FP-mjXaq3B'],
  ['area','mt_6xNmQLzuqm'],['chance','mt_UcGn2hjhYU'],
  ['place-value','mt_THl9GLxwoL'],['division','mt_LpSuPgL31x'],
  ['measurement-units','mt_DOe893F6gN'],['linear-graphs','mt_-3udyo6VyB'],
  ['arithmetic-symbols','mt_8RmpkDxT9L'],['fraction-notation','mt_vKcxX6iNOA'],
  ['correlation','mt_8atyuvPUZc'],['simultaneous-equations','mt_mqgu72aCMz'],
  ['rounding-estimation','mt_QaYfeVL-0C'],['statistical-investigation','mt_SHVyE1CLUa'],
  ['solid-shapes','mt_Qcp2d_kuta'],['ratio','mt_yK51ZnKA8m'],
  ['measuring-length','mt_KaF0SQvaiu'],['calculating-percentages','mt_PNSyfH56eQ'],
  ['surface-area-volume','mt_Sij9ByyHq6'],['scale-drawings','mt_1badik7iKJ'],
  ['ratio-bar-model','mt_ePXg_XyCKU'],['venn-two-sets','mt_eSv_w46u6H'],
  ['multiplication-array','mt_GRWwTDZ3wD'],['area-distributive-model','mt_AQo4u7O4sM'],
  ['making-ten','mt_m1W6nTQJ2b'],['long-multiplication','mt_q9EaJc2FP8'],
  ['formula-substitution','mt_Jvg8X0N5u0'],['compound-units','mt_kLQOzZYrd5'],
  ['mean-absolute-deviation','mt_ZfpeI1CFyP'],
  ['dot-plot','mt_JRzXQl9M7c'],['histogram','mt_oderfUBZPw'],
  ['box-plot','mt_8VjmxR1yfw'],['cube-net','mt_vnJEztczji'],
  ['coordinates','mt_i5_HnoFOYw'],['transformations','mt_SH7QgFl8-v'],
  ['triangle-parallelogram-area','mt_ML5t7n2-U8'],['polygon-area-decomposition','mt_i2-QaXbyzB'],
  ['cardinality','mt_dmNvjroCPT'],['teen-numbers','mt_xmmgAzxe5j'],
  ['compare-fractions','mt_IfEgu0X449'],['multiplication-repeated-addition','mt_PZ909yPrEC'],
  ['positional-language','mt_qeZYF6HZ4o'],['sorting-data','mt_ylXdiVRAYv'],
  ['collect-data','mt_ebQURBOsM5'],['compare-data-displays','mt__yvsKKp3TS'],
  ['estimate-capacity','mt_NSC3LT_-ch'],['halves-quarters-eighths','mt_gC-6JXAG5S'],
  ['statistical-questions','mt_iykH2P5oFq'],
  ['angle-sums','mt_oqziWKry-L'],['three-digit-place-value','mt_aPBzD28_mT'],
  ['probability-complements','mt_3fwYu7imd4'],['linear-equations','mt_QhFEDyIwSO'],
  ['mean-and-range','mt_XSXnTQoQ4l'],
  ['cuboid-volume','mt_nTL-owFJTF'],['represent-add-subtract','mt_PgsHGYJMH-'],
  ['scaled-graphs','mt_r8XnXwRA6g'],['algebraic-notation','mt_KwdjWEmMNo'],
  ['estimation-check','mt_ilPrU0cbtT'],
  ['compare-groups','mt__h7hvT4tEb'],['one-more','mt_sYpKWbq5ra'],['represent-count','mt_pAcaehday5'],
  ['half','mt_-hTTat0mBR'],['plane-shapes','mt_KJeEeTutJI'],['compare-lengths','mt_uhuxX8sg9f'],
  ['number-parts','mt_7XcCG43ZZW'],['multiply-commutes','mt_C9ZfT-4cgn'],['write-twenty','mt_fR0UtsSREU'],
  ['batch20-01','mt_yJmvUCCym7'],
  ['batch20-02','mt_e8CZ7E5qW7'],
  ['batch20-03','mt_zuKAX6lcYR'],
  ['batch20-04','mt_mr_Vk7FGzK'],
  ['batch20-05','mt_VAWV_l7J0D'],
  ['batch20-06','mt_wh3UqnWsa7'],
  ['batch20-07','mt_0u4KLbvBa1'],
  ['batch20-08','mt_zOWwLxa77y'],
  ['batch20-09','mt_B1zj1RwQ3a'],
  ['batch20-10','mt_nvdpxAJTBG'],
  ['batch20-11','mt_yqAL6O5i_v'],
  ['batch20-12','mt__YRJ23GuIK'],
  ['batch20-13','mt_x8TshvbbQT'],
  ['batch20-14','mt_kw7xmp68rU'],
  ['batch20-15','mt_r0VXbfAmsH'],
  ['batch20-16','mt_mnEVZNkX3p'],
  ['batch20-17','mt_WXW0hjNhph'],
  ['batch20-18','mt_g3W0mdADVu'],
  ['batch20-19','mt_hyvHv2BCwb'],
  ['batch20-20','mt_TcG90kS8nu'],
  ['batch20c-01','mt_ghF3Vv6taM'],
  ['batch20c-02','mt_UQnAFPs83F'],
  ['batch20c-03','mt_glPPG-kTQY'],
  ['batch20c-04','mt_PpWSHA-0kv'],
  ['batch20c-05','mt_HhuSDxwDNM'],
  ['batch20c-06','mt_wQ89AEXhz3'],
  ['batch20c-07','mt_DyGBW3ZHh3'],
  ['batch20c-08','mt_XV0B4kWwqL'],
  ['batch20c-09','mt_9L3NQqgqRd'],
  ['batch20c-10','mt_FbDKeLfBCo'],
  ['batch20c-11','mt_Kr3IyA6m-O'],
  ['batch20c-12','mt_a1FdAsRKOF'],
  ['batch20c-13','mt_Y9XKzLrUAZ'],
  ['batch20c-14','mt_UooUHC_V7U'],
  ['batch20c-15','mt_sBcRdUfAzV'],
  ['batch20c-16','mt_-P1kdZhHbL'],
  ['batch20c-17','mt_4lp_b5Pzik'],
  ['batch20c-18','mt_bj1YCgNWUx'],
  ['batch20c-19','mt_IzQvs7k_sE'],
  ['batch20c-20','mt_7rJM8eWUfw'],
  ['batch20b-01','mt_I5j1ZWo2cn'],
  ['batch20b-02','mt_Zx1xZM-RbX'],
  ['batch20b-03','mt_s2mfRBoTal'],
  ['batch20b-04','mt_UTnDKQkVX5'],
  ['batch20b-05','mt_EmR5n58jZt'],
  ['batch20b-06','mt_U0waNfD8PB'],
  ['batch20b-07','mt_kJGCjnuelW'],
  ['batch20b-08','mt_cFltwUQi-d'],
  ['batch20b-09','mt_xACS3rWWDp'],
  ['batch20b-10','mt_MyGblah2yY'],
  ['batch20b-11','mt_yGv8doDAmp'],
  ['batch20b-12','mt_2VR963szuk'],
  ['batch20b-13','mt_XjwUlmxdCT'],
  ['batch20b-14','mt_zkFbMLpu3U'],
  ['batch20b-15','mt_NtJYlJdUe9'],
  ['batch20b-16','mt_-vvVxpOHG2'],
  ['batch20b-17','mt_M5PPDJStGm'],
  ['batch20b-18','mt_aHAM29nidj'],
  ['batch20b-19','mt_OkSJfrmFb_'],
  ['batch20b-20','mt_M2v1A9OEuM']
,
  ['batch20d-01','mt_QCgbiVrwnp'],
  ['batch20d-02','mt_ezc2m_0dzN'],
  ['batch20d-03','mt_YFS7JFk64p'],
  ['batch20d-04','mt_i9rJbuFO3p'],
  ['batch20d-05','mt_c29FaCTNsx'],
  ['batch20d-06','mt_xppl18avyY'],
  ['batch20d-07','mt_Xp-rj46S2w'],
  ['batch20d-08','mt_YzM5goBctT'],
  ['batch20d-09','mt_QNxFnxikCN'],
  ['batch20d-10','mt_bfhng6mOuy'],
  ['batch20d-11','mt__N55B7u7HD'],
  ['batch20d-12','mt_0XxyaQLRhn'],
  ['batch20d-13','mt_GDG9_SZmsO'],
  ['batch20d-14','mt_nZkL5-XjRX'],
  ['batch20d-15','mt_zfy1gOEewd'],
  ['batch20d-16','mt_8gy7uxRlF6'],
  ['batch20d-17','mt_iFFKZd-Vgv'],
  ['batch20d-18','mt_xSgAgg9Ej_'],
  ['batch20d-19','mt_h0gJcSuwdL'],
  ['batch20d-20','mt_2OtRUM_0zW']
,
  ['research-gap5-01','mt_Y6_cq3UMyy'],
  ['research-gap5-02','mt_biGHAbkoV2'],
  ['research-gap5-03','mt_Eqk6oSbySH'],
  ['research-gap5-04','mt_ZjIFGc6zPW'],
  ['research-gap5-05','mt_W3VOAuFwVw']
,
  ['batch15-01','mt_T76hKqXf0z'],
  ['batch15-02','mt_hBZwbst0ow'],
  ['batch15-03','mt_gu0NPDvlhY'],
  ['batch15-04','mt_VhBH8wrFC6'],
  ['batch15-05','mt_1VSfm9yiLn'],
  ['batch15-06','mt_k2WE0-22-4'],
  ['batch15-07','mt_CBHwluE6Lp'],
  ['batch15-08','mt_MqqR7VUoz1'],
  ['batch15-09','mt_Mnodea7mG_'],
  ['batch15-10','mt_AF2BeFQwfX'],
  ['batch15-11','mt_WX30dzi4dt'],
  ['batch15-12','mt_pjfmCMMPjO'],
  ['batch15-13','mt_izien3ZX51'],
  ['batch15-14','mt_-c4Ca_nBzX'],
  ['batch15-15','mt_nOCPx5qw0Z']
,
  ['batch20e-01','mt_ehGS_uVSJv'],
  ['batch20e-02','mt_AKAtWEwpcj'],
  ['batch20e-03','mt_nNNVrLqPW3'],
  ['batch20e-04','mt_hVpGOEz2kG'],
  ['batch20e-05','mt_H6LlpWgEYS'],
  ['batch20e-06','mt_Cqm8iy48UI'],
  ['batch20e-07','mt_HnKbuCliNS'],
  ['batch20e-08','mt_TqDq6jyOmL'],
  ['batch20e-09','mt_u23IGDxOpk'],
  ['batch20e-10','mt_fEuoBYw6bU'],
  ['batch20e-11','mt_BFJ-ch_8QU'],
  ['batch20e-12','mt_skYly2Qm01'],
  ['batch20e-13','mt_Zdv-b-iW5K'],
  ['batch20e-14','mt_isojCL9yy-'],
  ['batch20e-15','mt_hniI4E-OCE'],
  ['batch20e-16','mt_AQcVRBddko'],
  ['batch20e-17','mt_Zt30Gxi-qp'],
  ['batch20e-18','mt_t0g2SlP404'],
  ['batch20e-19','mt_xAf2bu9wYK'],
  ['batch20e-20','mt_ALUrJpY0cZ']
,
  ['batch20f-01','mt_wzAZ8qFDc4'],
  ['batch20f-02','mt_FX4a2Q8XXN'],
  ['batch20f-03','mt_fxPtngwUfz'],
  ['batch20f-04','mt_ChjMU2GDJa'],
  ['batch20f-05','mt_fmm-P17Vka'],
  ['batch20f-06','mt_Fl7b8q9pI1'],
  ['batch20f-07','mt_SsLWS_APM7'],
  ['batch20f-08','mt_TdV9YGJEoY'],
  ['batch20f-09','mt_zuOGOGFAKb'],
  ['batch20f-10','mt_zd0YkB3xNj'],
  ['batch20f-11','mt_cqSf213hSa'],
  ['batch20f-12','mt_AR-K72OIIO'],
  ['batch20f-13','mt_w6MxaaoMXZ'],
  ['batch20f-14','mt_98c2qwEF7Q'],
  ['batch20f-15','mt_J4j7d3iAfg'],
  ['batch20f-16','mt_XfyqXLqzpx'],
  ['batch20f-17','mt_FnUJMXPUZX'],
  ['batch20f-18','mt_ATYLKt0je-'],
  ['batch20f-19','mt_HJTuIGHvcR'],
  ['batch20f-20','mt_R2ccrI-nKD']
,
  ['batch20g-01','mt_3JgrHY221M'],
  ['batch20g-02','mt_oIzycTBeE4'],
  ['batch20g-03','mt_g_fkAqmz72'],
  ['batch20g-04','mt_yXO7lQ9Yn7'],
  ['batch20g-05','mt_Cg8VPguS_V'],
  ['batch20g-06','mt_HlNSurPVDp'],
  ['batch20g-07','mt_IegHBHERVa'],
  ['batch20g-08','mt_wB-GBDkoNr'],
  ['batch20g-09','mt_MFfYcnv6Tv'],
  ['batch20g-10','mt_8OAGVdeTJ_'],
  ['batch20g-11','mt_6J1wmCWf41'],
  ['batch20g-12','mt_2XDGT5tei1'],
  ['batch20g-13','mt_Lb2ZnMdkYR'],
  ['batch20g-14','mt_xZvDCYA5Ae'],
  ['batch20g-15','mt_9XVFje6Tyr'],
  ['batch20g-16','mt_vXRzMbiPff'],
  ['batch20g-17','mt_sHJqh6UUya'],
  ['batch20g-18','mt_vmQJAtAFuy'],
  ['batch20g-19','mt_FspV_imUGK'],
  ['batch20g-20','mt_XWSGuFW7It']
,
  ['batch20h-01','mt_SrrsLiJkr3'],
  ['batch20h-02','mt_TiQbi027PE'],
  ['batch20h-03','mt_vHzVa3SURC'],
  ['batch20h-04','mt_uESbzWCZIq'],
  ['batch20h-05','mt_IHipFGTFEY'],
  ['batch20h-06','mt_bESTSBB0wK'],
  ['batch20h-07','mt_kDMKJ5Ztt6'],
  ['batch20h-08','mt_DRlbMok2lT'],
  ['batch20h-09','mt_Xt1cRqaBOW'],
  ['batch20h-10','mt_Uq5vYqboCR'],
  ['batch20h-11','mt_6XCURuNwPw'],
  ['batch20h-12','mt_HNOPGJYiRK'],
  ['batch20h-13','mt_iNdrM2-oJf'],
  ['batch20h-14','mt_gtTl3R5buH'],
  ['batch20h-15','mt_MHaiUd2FLA'],
  ['batch20h-16','mt_9IzhGUZ30z'],
  ['batch20h-17','mt_1YwOCMMwD8'],
  ['batch20h-18','mt_GDtFU5fyUv'],
  ['batch20h-19','mt_tpT9brpI6D'],
  ['batch20h-20','mt_5mIcmKRCgA']
,
  ['batch20i-01','mt_zxST3MarI9'],
  ['batch20i-02','mt_ewmuMMPAzP'],
  ['batch20i-03','mt_i2F1nWxJjv'],
  ['batch20i-04','mt_WBdHkc2HTf'],
  ['batch20i-05','mt_HRKzwEQJgO'],
  ['batch20i-06','mt_BdAeZJUOir'],
  ['batch20i-07','mt_idbKDrf9qZ'],
  ['batch20i-08','mt_ndGqFPWyen'],
  ['batch20i-09','mt_hRZyKvz1KN'],
  ['batch20i-10','mt_jBQS-CicNn'],
  ['batch20i-11','mt_hR2Y7NhMSY'],
  ['batch20i-12','mt_DLcEzmmj2r'],
  ['batch20i-13','mt_4m8BimI4G5'],
  ['batch20i-14','mt_18fK9sQdIz'],
  ['batch20i-15','mt_FHIAv6dfhU'],
  ['batch20i-16','mt_lC_Q5mSL_I'],
  ['batch20i-17','mt_jY7uf0Cb7o'],
  ['batch20i-18','mt_-bMnJcPJy8'],
  ['batch20i-19','mt_iEXqN48w3x'],
  ['batch20i-20','mt_3y7xKP9MjU']
,
  ['batch20j-01','mt_oDU_8zMZjp'],
  ['batch20j-02','mt_aHQ9kNt3is'],
  ['batch20j-03','mt_3qrCtdoVAU'],
  ['batch20j-04','mt_KhS7K1Mgrw'],
  ['batch20j-05','mt_GZuoYaDdWd'],
  ['batch20j-06','mt_AYzE1EAvI0'],
  ['batch20j-07','mt_NoB20kVa4w'],
  ['batch20j-08','mt_doX1BhmFgk'],
  ['batch20j-09','mt_933BohS9BH'],
  ['batch20j-10','mt_h0CVtqI2xo'],
  ['batch20j-11','mt_r8c43QB6wx'],
  ['batch20j-12','mt_qUGMyMYn9m'],
  ['batch20j-13','mt_xWg0lI_gG4'],
  ['batch20j-14','mt_4emC463IyW'],
  ['batch20j-15','mt_U4cIBXVug4'],
  ['batch20j-16','mt_LlMl2PbaZe'],
  ['batch20j-17','mt_y1XCVsIelg'],
  ['batch20j-18','mt_MewIRdzpzz'],
  ['batch20j-19','mt_NLSfvB9vUl'],
  ['batch20j-20','mt_1KkvzwYxbR']
,
  ['research-gap3-01','mt_BK5xwkrD5C'],
  ['research-gap3-02','mt_t9BICauBSI'],
  ['research-gap3-03','mt_0ZDouU664X']
,
  ['research-gap5b-01','mt_bnwHo5wfCD'],
  ['research-gap5b-02','mt_Jz9UuT8BXW'],
  ['research-gap5b-03','mt_MgsDabdnr1'],
  ['research-gap5b-04','mt_NM5I3yN-Q6'],
  ['research-gap5b-05','mt_CUJr8L5_Wn']
,
  ['research-gap3b-01','mt_zQfWqImxva'],
  ['research-gap3b-02','mt_QeKWt4BZn3'],
  ['research-gap3b-03','mt_nx4a3kH-59']
,
  ['batch20k-01','mt_xPqczp7zPX'],
  ['batch20k-02','mt_XuHmIn2xje'],
  ['batch20k-03','mt_z5iwdZyeDr'],
  ['batch20k-04','mt_Yw27nweoTj'],
  ['batch20k-05','mt_70qDTI14td'],
  ['batch20k-06','mt_-V7EnqU7gG'],
  ['batch20k-07','mt_ZLqYE7la4Z'],
  ['batch20k-08','mt_SXbZ3bC9z7'],
  ['batch20k-09','mt_W17Kbwm0-u'],
  ['batch20k-10','mt_wUSbRt3-qw'],
  ['batch20k-11','mt_YUJ5pwalqL'],
  ['batch20k-12','mt_QysgF57dxh'],
  ['batch20k-13','mt_6oxQPNLHNv'],
  ['batch20k-14','mt_OzRZ89GrQW'],
  ['batch20k-15','mt_e4x3l2JeLI'],
  ['batch20k-16','mt_p-nbe0w_lf'],
  ['batch20k-17','mt_0Wg5F97osg'],
  ['batch20k-18','mt_6-j1NO2ZUH'],
  ['batch20k-19','mt_tAtMET4EIU'],
  ['batch20k-20','mt__sMrmOv3bx']
,
  ['research-gap4-01','mt_dlg6i-Lw0I'],
  ['research-gap4-02','mt_8DT3LXwwH-'],
  ['research-gap4-03','mt_aCwj2PCoRV'],
  ['research-gap4-04','mt_nzdtOLXWWa']
,
  ['research-gap5c-01','mt_X53txVXOcG'],
  ['research-gap5c-02','mt_QpJydot2Kh'],
  ['research-gap5c-03','mt_kxeuXm6EyC'],
  ['research-gap5c-04','mt_yrvYKSwSRZ'],
  ['research-gap5c-05','mt_TiFjjvBMaY']
,
  ['research-gap5d-01','mt_Y6JmLjnfRP'],
  ['research-gap5d-02','mt_QHT16CrFO-'],
  ['research-gap5d-03','mt_8IsaoMPvod'],
  ['research-gap5d-04','mt_4zgPzc6yu5'],
  ['research-gap5d-05','mt_6gpryAnpoZ']
,
  ['research-gap5e-01','mt_OwYms2tB1L'],
  ['research-gap5e-02','mt_KCS9GbZgU_'],
  ['research-gap5e-03','mt_fQ9Rw10fss'],
  ['research-gap5e-04','mt_A2hKhHXgL5'],
  ['research-gap5e-05','mt_x7V1qrkiqH']
,
  ['research-gap4b-01','mt_mn765HbXi1'],
  ['research-gap4b-02','mt_O-U263ukg1'],
  ['research-gap4b-03','mt_tuEnyrp5Ia'],
  ['research-gap4b-04','mt_km4V6d5IAh']
,
  ['research-gap5f-01','mt_mN4Ye_vtR7'],
  ['research-gap5f-02','mt_SK7WntVZ6y'],
  ['research-gap5f-03','mt_LBT-9jz7kR'],
  ['research-gap5f-04','mt_RdfzwInyAj'],
  ['research-gap5f-05','mt_h02-C8PRrj']
,
  ['research-gap3c-01','mt_h7zVgCDVmx'],
  ['research-gap3c-02','mt_61Nhj8W78f'],
  ['research-gap3c-03','mt_4bc3EAxhlY']
,
  ['research-gap5g-01','mt_dJOKkYMsCv'],
  ['research-gap5g-02','mt_QguIGVMB1o'],
  ['research-gap5g-03','mt_Bt-iORUzdO'],
  ['research-gap5g-04','mt_HczwO1sr-y'],
  ['research-gap5g-05','mt_F_zEAJ8VIo']
,
  ['research-gap6-01','mt_1GDEHyEZYH'],
  ['research-gap6-02','mt_qUjW0N1cYO'],
  ['research-gap6-03','mt_oxfxzbat3k'],
  ['research-gap6-04','mt_NmvuwVUFRS'],
  ['research-gap6-05','mt_bZC-wqWX7Y'],
  ['research-gap6-06','mt_3m0pA-aeat']
,
  ['research-gap6b-01','mt_5J2quSTspi'],
  ['research-gap6b-02','mt_e7tLi9SCIE'],
  ['research-gap6b-03','mt_tVvZVWO5d6'],
  ['research-gap6b-04','mt_SOM6Imm2sO'],
  ['research-gap6b-05','mt_tegkuJA5gM'],
  ['research-gap6b-06','mt_IlDaxVr60U']
];
const check=(ok,desc)=>{if(!ok)throw Error(desc);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const checks=[],measurements=[],errors=[];
 try{
  for(const [width,height,slug] of [[1440,900,'desktop'],[1280,720,'compact']]){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:43827/?v=56&world=network&layout=53#atlas');
   await page.waitForFunction(()=>window.mathSpace&&mathSpace.snapshot().visibleNodes.length===537);
   const start=JSON.stringify((await page.evaluate(()=>mathSpace.snapshot())).positions);
   const cases=slug==='desktop'?ids:ids.slice(2);
   for(const [label,id] of cases){
    const tag=slug+'-'+label;
    await page.locator('[data-action="search"]').click();
    await page.locator('#search-input').fill(id);
    await page.locator('#search-results [data-key="node:'+id+'"]').click();
    await page.waitForFunction(id=>mathSpace.snapshot().selected==='node:'+id,id);
    await page.waitForFunction(()=>document.querySelector('#focus-card')&&!document.querySelector('#focus-card').hidden);
    await page.waitForFunction(()=>mathSpace.snapshot().cameraTween===null);
    const card=page.locator('#focus-card'),help=card.locator('.concept-help'),mainAction=card.locator('.focus-actions .primary-button').first();
    check(await help.count()===1,tag+': exact node has a precise explanation');
    check(await help.locator('.concept-term').innerText()!==''&&await help.locator('.concept-definition').innerText()!=='',tag+': formal concept and definition visible');
    const closed=await help.locator('.concept-alternatives').evaluate(el=>!el.open);
    check(closed,tag+': secondary explanations are closed by default');
    const geometry=await card.evaluate(el=>{
      const box=el.getBoundingClientRect(),h=el.querySelector('.focus-sticky').getBoundingClientRect(),
        def=el.querySelector('.concept-definition').getBoundingClientRect(),
        action=el.querySelector('.focus-actions .primary-button')?.getBoundingClientRect(),
        available={width:window.innerWidth,height:window.innerHeight};
      return {box:{x:box.x,y:box.y,w:box.width,h:box.height},
        header:{y:h.y,h:h.height},definition:{y:def.y,h:def.height},
        action:action?{y:action.y,h:action.height}:null,
        clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,view:available};
    });
    check(geometry.box.x>=-1&&geometry.box.y>=-1&&geometry.box.x+geometry.box.w<=width+1&&geometry.box.y+geometry.box.h<=height+1,
      tag+': knowledge card stays within viewport');
    check(geometry.action&&geometry.action.y>=geometry.box.y&&geometry.action.y+geometry.action.h<=geometry.box.y+geometry.box.h,
      tag+': learning action stays available at entry');
    check(geometry.definition.y>=geometry.header.y+geometry.header.h-2&&geometry.definition.y+geometry.definition.h<=geometry.box.y+geometry.box.h+2,
      tag+': concept definition does not overlap the sticky title or leave the card');
    check(await card.locator('.network-relations').count()>0,
      tag+': true map relationships remain in the knowledge card');
    await page.screenshot({path:path.join(out,tag+'-initial.png')});
    await page.waitForTimeout(220);
    const before=JSON.stringify(await page.evaluate(()=>mathSpace.snapshot()));
    const learningRecord=await page.evaluate(()=>localStorage.getItem('math-explorer-v2'));
    await help.locator('.concept-alternatives > summary').click();
    const types=await help.locator('.concept-mode > summary').allInnerTexts();
    check(types.includes('换个说法')&&types.includes('举例与反例')&&types.includes('自己试一试')&&types.includes('为什么'),
      tag+': four useful alternative text explanation routes remain available');
    const visualLabels={
      'mt_Ep7TDFuYUa':'二等分','mt_FP-mjXaq3B':'二等分','mt_-3udyo6VyB':'y=2x+1',
      'mt_ePXg_XyCKU':'2比3','mt_eSv_w46u6H':'韦恩图',
      'mt_GRWwTDZ3wD':'3行4列','mt_AQo4u7O4sM':'宽4加2',
      'mt_JRzXQl9M7c':'点图','mt_oderfUBZPw':'直方图',
      'mt_8VjmxR1yfw':'箱线图','mt_vnJEztczji':'展开图',
      'mt_i5_HnoFOYw':'坐标网格','mt_SH7QgFl8-v':'三种图形变换',
      'mt_ML5t7n2-U8':'垂直高','mt_i2-QaXbyzB':'梯形分割'
    };
    const expectedVisual=Object.hasOwn(visualLabels,id);
    check(types.includes('看图理解')===expectedVisual,tag+': only nodes with a real visual show the diagram entry');
    if(expectedVisual){
      await help.locator('.concept-visual-mode > summary').click();
      const image=help.locator('.concept-visual svg');
      check(await image.count()===1,tag+': diagram exists');
      const info=await image.evaluate(svg=>{
        const part=name=>{
          const el=svg.querySelector('[data-part="'+name+'"]');
          if(!el)return null;
          const box=el.getBBox();
          return {x:box.x,y:box.y,width:box.width,height:box.height,d:el.getAttribute('d')};
        };
        return {width:svg.getBoundingClientRect().width,
          accessibility:svg.getAttribute('aria-label'),
          text:svg.textContent,
          inside:svg.getBoundingClientRect().right<=svg.closest('.focus-card').getBoundingClientRect().right+1,
          parts:{
            leftTriangle:part('left-triangle'),
            rightTriangle:part('right-triangle'),
            remainingTrapezoid:part('remaining-trapezoid'),
            movedTriangle:part('moved-triangle')
          }};
      });
      const labelNeedle=visualLabels[id];
      check(info.width>=150&&info.inside&&info.accessibility?.includes(labelNeedle),
        tag+': exact-math visual fits the card and has an accessible description');
      await image.evaluate(el=>el.scrollIntoView({block:'nearest',inline:'nearest'}));
      const visible=await image.evaluate(el=>{
        const image=el.getBoundingClientRect(),card=el.closest('.focus-card').getBoundingClientRect();
        return {top:image.top,bottom:image.bottom,cardTop:card.top,cardBottom:card.bottom};
      });
      check(visible.top>=visible.cardTop-1&&visible.bottom<=visible.cardBottom+1,
        tag+': diagram can be scrolled fully into the visible knowledge-card area');
      if(id==='mt_eSv_w46u6H'){
        const labels=await image.evaluate(svg=>Object.fromEntries(
          [...svg.querySelectorAll('text')].filter(el=>['喜欢足球','喜欢板球','共30人'].includes(el.textContent.trim()))
            .map(el=>{const b=el.getBBox();return [el.textContent.trim(),{left:b.x,right:b.x+b.width,x:Number(el.getAttribute('x'))}];})
        ));
        check(labels['喜欢足球']&&labels['喜欢板球']&&labels['共30人']&&
          labels['喜欢足球'].right<labels['共30人'].left&&
          labels['共30人'].right<labels['喜欢板球'].left&&labels['共30人'].x===160,
          tag+': total sample-size label is visually separated from both set labels');
      }
      if(id==='mt_i2-QaXbyzB'){
        check(info.accessibility?.includes('两个三角形不相等')&&info.text.includes('1 cm')&&info.text.includes('3 cm'),
          tag+': trapezoid diagram labels unequal side triangles and their base lengths');
        check(info.parts.leftTriangle&&info.parts.rightTriangle&&
          Math.abs(info.parts.rightTriangle.width/info.parts.leftTriangle.width-3)<0.01&&
          Math.abs(info.parts.leftTriangle.height-info.parts.rightTriangle.height)<0.01&&
          Math.abs(info.parts.leftTriangle.width+info.parts.rightTriangle.width-80)<0.01,
          tag+': trapezoid side triangles have unequal bases, equal heights, and bases summing to the difference between the parallel sides');
      }
      if(id==='mt_ML5t7n2-U8'){
        check(info.parts.remainingTrapezoid&&info.parts.movedTriangle&&
          Math.abs(info.parts.remainingTrapezoid.width-100)<0.01&&
          Math.abs(info.parts.remainingTrapezoid.height-65)<0.01&&
          Math.abs(info.parts.movedTriangle.width-25)<0.01&&
          Math.abs(info.parts.movedTriangle.height-65)<0.01&&
          info.parts.remainingTrapezoid.d?.includes('L265 120')&&
          info.parts.movedTriangle.d?.includes('M265 120L290 55'),
          tag+': remaining trapezoid and moved triangle share the same diagonal edge to form a rectangle');
      }
    }else await help.locator('.concept-mode').first().locator('summary').click();
    await page.screenshot({path:path.join(out,tag+'-expanded.png')});
    check(JSON.stringify(await page.evaluate(()=>mathSpace.snapshot()))===before,
      tag+': reading explanations does not change camera, nodes, selection, or relation data');
    check(await page.evaluate(()=>localStorage.getItem('math-explorer-v2'))===learningRecord,
      tag+': explanation reads never record learning completion');
    check(JSON.stringify((await page.evaluate(()=>mathSpace.snapshot())).positions)===start,
      tag+': all world coordinates unchanged');
    measurements.push({tag,id,geometry,modes:types});
    checks.push(tag);
   }
   await context.close();
  }
  check(errors.length===0,'no browser errors');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:checks.length,checks,measurements,errors,childTrial:false},null,2));
  console.log(JSON.stringify({passed:checks.length,viewportCases:checks,errors,childTrial:false}));
 }catch(err){
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,measurements,errors,failed:String(err)},null,2));
  console.error(err.stack);process.exitCode=1;
 }finally{await browser.close();}
})().catch(err=>{console.error(err.stack);process.exitCode=1;});
