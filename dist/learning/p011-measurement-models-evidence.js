import {rational} from './phase5/b16-model.js';
import * as b33 from './phase5/b33-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const reviewed = [
  {
    "sessionId": "coinvalues",
    "index": 0,
    "nodeId": "mt_cPZwlUk8Nd",
    "type": "x-m33-sort",
    "taskHash": "25e0595173ad419da9f92115bd07feb2beb6a33616de03f954afa798f9201796",
    "task": {
      "type": "x-m33-sort",
      "prompt": "英国的钱：按便士和英镑把八种硬币标值分开。",
      "currency": "GBP",
      "cards": [
        {
          "label": "50p",
          "cents": 50,
          "group": "p"
        },
        {
          "label": "20p",
          "cents": 20,
          "group": "p"
        },
        {
          "label": "10p",
          "cents": 10,
          "group": "p"
        },
        {
          "label": "5p",
          "cents": 5,
          "group": "p"
        },
        {
          "label": "2p",
          "cents": 2,
          "group": "p"
        },
        {
          "label": "1p",
          "cents": 1,
          "group": "p"
        },
        {
          "label": "£1",
          "cents": 100,
          "group": "pound"
        },
        {
          "label": "£2",
          "cents": 200,
          "group": "pound"
        }
      ],
      "groups": [
        {
          "id": "p",
          "label": "便士 p"
        },
        {
          "id": "pound",
          "label": "英镑 £"
        }
      ],
      "questions": []
    }
  },
  {
    "sessionId": "coinvalues",
    "index": 1,
    "nodeId": "mt_cPZwlUk8Nd",
    "type": "x-m33-compare",
    "taskHash": "3a556ffd830371a04905acc9522725ee36cbcb13e024db2187d90eb844296203",
    "task": {
      "type": "x-m33-compare",
      "prompt": "英国的£2硬币和50p硬币，哪一枚面值更大？",
      "items": [
        {
          "label": "£2硬币",
          "value": 200,
          "detail": "200p"
        },
        {
          "label": "50p硬币",
          "value": 50,
          "detail": "50p"
        }
      ],
      "want": "left",
      "questions": [
        {
          "label": "£2等于多少便士",
          "value": 200,
          "kind": "minor"
        }
      ],
      "currency": "GBP"
    }
  },
  {
    "sessionId": "coinvalues",
    "index": 2,
    "nodeId": "mt_cPZwlUk8Nd",
    "type": "x-m33-sort",
    "taskHash": "e68e85f05e99be2ad38650122c997dec481d51a7fbfab99a89d944f1eda68a88",
    "task": {
      "type": "x-m33-sort",
      "prompt": "把£5、£10纸币和50p硬币放到各自一边。",
      "currency": "GBP",
      "cards": [
        {
          "label": "£5",
          "note": true,
          "group": "note"
        },
        {
          "label": "£10",
          "note": true,
          "group": "note"
        },
        {
          "label": "50p",
          "group": "coin"
        }
      ],
      "groups": [
        {
          "id": "coin",
          "label": "硬币"
        },
        {
          "id": "note",
          "label": "纸币"
        }
      ],
      "questions": []
    }
  },
  {
    "sessionId": "modmoney",
    "index": 0,
    "nodeId": "mt_iQYPw8bMfN",
    "type": "x-m33-model",
    "taskHash": "c643f90af92aea7d21c0325b43e098702e1a1e78a3adfb02d5f4e1082564b03a",
    "task": {
      "type": "x-m33-model",
      "prompt": "一根绳原来45 cm，剪掉18 cm。挑一种表示，再找剩下的长度。",
      "whole": 45,
      "known": 18,
      "unit": "cm",
      "questions": [
        {
          "label": "剩下多少cm",
          "value": 27,
          "kind": "number"
        }
      ]
    }
  },
  {
    "sessionId": "auscoins",
    "index": 0,
    "nodeId": "mt_FSLJbKkryb",
    "type": "x-m33-sort",
    "taskHash": "714e67929c4c3fb9987a9bfbc15786b5bff7bd863e06394a7a988fd509569b6b",
    "task": {
      "type": "x-m33-sort",
      "prompt": "澳大利亚示意硬币：按澳分和澳元分类。比较50c与$2。",
      "currency": "AUD",
      "cards": [
        {
          "label": "澳50c",
          "cents": 50,
          "size": 76,
          "tone": "silver",
          "shape": "twelve",
          "group": "cent"
        },
        {
          "label": "澳20c",
          "cents": 20,
          "size": 65,
          "tone": "silver",
          "group": "cent"
        },
        {
          "label": "澳$1",
          "cents": 100,
          "size": 62,
          "group": "dollar"
        },
        {
          "label": "澳$2",
          "cents": 200,
          "size": 55,
          "group": "dollar"
        }
      ],
      "groups": [
        {
          "id": "cent",
          "label": "澳分 c"
        },
        {
          "id": "dollar",
          "label": "澳元 $"
        }
      ],
      "questions": [
        {
          "label": "面值更大的是",
          "value": "two",
          "kind": "choice",
          "options": [
            [
              "two",
              "较小的$2"
            ],
            [
              "fifty",
              "较大的50c"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "moneycalc",
    "index": 0,
    "nodeId": "mt_FVVSQR9vGg",
    "type": "x-m33-calc",
    "taskHash": "ac14252b3db48d7229ce099b2453f4b93b2026bf5ec3b81318879317ae340229",
    "task": {
      "type": "x-m33-calc",
      "prompt": "澳元购物单：$4.85、$12.30、$7.95，先估算总价再计算。",
      "currency": "AUD",
      "expected": 2510,
      "exampleFormula": "4.85+12.30+7.95",
      "questions": [
        {
          "label": "实际总价",
          "value": 2510,
          "kind": "major"
        }
      ],
      "estimate": true,
      "estimateExample": 25,
      "estimateRange": [
        23,
        27
      ],
      "estimateLabel": "大约多少澳元"
    }
  },
  {
    "sessionId": "moneycalc",
    "index": 1,
    "nodeId": "mt_FVVSQR9vGg",
    "type": "x-m33-calc",
    "taskHash": "d8381281415be5f39a46ef0d6949f758756c1d36e217372ad4f831ea685ec2ce",
    "task": {
      "type": "x-m33-calc",
      "prompt": "澳元$10减去$6.45，计算找回的钱。",
      "currency": "AUD",
      "expected": 355,
      "exampleFormula": "10-6.45",
      "questions": [
        {
          "label": "显示3.55表示多少澳元",
          "value": 355,
          "kind": "major"
        }
      ]
    }
  },
  {
    "sessionId": "moneycalc",
    "index": 2,
    "nodeId": "mt_FVVSQR9vGg",
    "type": "x-m33-calc",
    "taskHash": "ebfdea0a834cbb30973af42ed8f6f4bf9fdab553d4375f5fddb768f30748d9e8",
    "task": {
      "type": "x-m33-calc",
      "prompt": "澳元$3.95的东西买6份。可以选择顺手的方法，算完与4份$5比较。",
      "currency": "AUD",
      "expected": 2370,
      "exampleFormula": "6*3.95",
      "questions": [
        {
          "label": "4份$5是几澳元",
          "value": 20,
          "kind": "number"
        },
        {
          "label": "我愿意用什么方法",
          "value": "calculator",
          "kind": "choice",
          "options": [
            [
              "mental",
              "心算"
            ],
            [
              "written",
              "纸笔"
            ],
            [
              "calculator",
              "计算器"
            ]
          ],
          "accepted": [
            "mental",
            "written",
            "calculator"
          ]
        }
      ]
    }
  },
  {
    "sessionId": "measuremoney",
    "index": 1,
    "nodeId": "mt_mFJ-2ZF6Tk",
    "type": "x-m33-compare",
    "taskHash": "c26e53518d47019d0feceba8c12a659bf3599a2cea8cda39f9c0d49a9ec6207f",
    "task": {
      "type": "x-m33-compare",
      "prompt": "一袋1.5 kg，另一袋1200 g。换成克后，哪袋更重？",
      "items": [
        {
          "label": "1.5 kg",
          "value": 1500,
          "detail": "1500 g"
        },
        {
          "label": "1200 g",
          "value": 1200,
          "detail": "1200 g"
        }
      ],
      "want": "left",
      "questions": [
        {
          "label": "1.5 kg是多少克",
          "value": 1500,
          "kind": "number"
        }
      ]
    }
  },
  {
    "sessionId": "roughmoney",
    "index": 0,
    "nodeId": "mt_5bmrA-0pBi",
    "type": "x-m33-calc",
    "taskHash": "e41de1d2de115110f707905fee60ec952ed805a64382c15562ca34929fe6535d",
    "task": {
      "type": "x-m33-calc",
      "prompt": "澳元$4.95、$2.10、$7.85先估大约多少，再算准确总价。",
      "currency": "AUD",
      "expected": 1490,
      "exampleFormula": "4.95+2.10+7.85",
      "questions": [
        {
          "label": "准确总价",
          "value": 1490,
          "kind": "major"
        }
      ],
      "estimate": true,
      "estimateExample": 15,
      "estimateRange": [
        13,
        17
      ],
      "estimateLabel": "估计大约多少澳元"
    }
  },
  {
    "sessionId": "roughmoney",
    "index": 1,
    "nodeId": "mt_5bmrA-0pBi",
    "type": "x-m33-sort",
    "taskHash": "fca98a6444becf37a7a12e213321934b99b1d9f6e51d7084cab5a8593c9e3e70",
    "task": {
      "type": "x-m33-sort",
      "prompt": "澳大利亚现金总额按题给规则取到最近5c。分辨往下还是往上。",
      "currency": "AUD",
      "cards": [
        {
          "label": "$12.37",
          "record": true,
          "group": "down"
        },
        {
          "label": "$8.48",
          "record": true,
          "group": "up"
        }
      ],
      "groups": [
        {
          "id": "down",
          "label": "往下到最近5c"
        },
        {
          "id": "up",
          "label": "往上到最近5c"
        }
      ],
      "questions": [
        {
          "label": "$12.37取整后",
          "value": 1235,
          "kind": "major"
        },
        {
          "label": "$8.48取整后",
          "value": 850,
          "kind": "major"
        }
      ]
    }
  },
  {
    "sessionId": "roughmoney",
    "index": 2,
    "nodeId": "mt_5bmrA-0pBi",
    "type": "x-m33-calc",
    "taskHash": "408e4f56a455e28c4d72a35fe765ce88877fa75701afb54f893135a054e2bf27",
    "task": {
      "type": "x-m33-calc",
      "prompt": "澳元$50付款，商品$6.90和$8.15。先估找回多少，再计算比较$36。",
      "currency": "AUD",
      "expected": 3495,
      "exampleFormula": "50-6.90-8.15",
      "questions": [
        {
          "label": "准确找回",
          "value": 3495,
          "kind": "major"
        },
        {
          "label": "找回$36",
          "value": "near",
          "kind": "choice",
          "options": [
            [
              "near",
              "接近约$35，但不是精确找零"
            ],
            [
              "exact",
              "估算就能确定正好是$36"
            ]
          ]
        }
      ],
      "estimate": true,
      "estimateExample": 35,
      "estimateRange": [
        33,
        37
      ],
      "estimateLabel": "先估找回约多少澳元"
    }
  },
  {
    "sessionId": "budgetchoices",
    "index": 1,
    "nodeId": "mt_Qe2PsFmSAH",
    "type": "x-m33-sheet",
    "taskHash": "7bd6512e300cea7e1fcbb0cc7f38a2a85391a4381e466d1794d9c53afe649fcc",
    "task": {
      "type": "x-m33-sheet",
      "prompt": "把一种活动清单放进表格：水果$12、点心$14.50、纸杯$3.50。",
      "currency": "AUD",
      "refs": {
        "A1": 1200,
        "A2": 1450,
        "A3": 350
      },
      "expected": 3000,
      "exampleFormula": "=A1+A2+A3",
      "requiredRefs": [
        "A1",
        "A2",
        "A3"
      ],
      "questions": [
        {
          "label": "表格总价",
          "value": 3000,
          "kind": "major"
        }
      ],
      "labels": {
        "A1": "水果",
        "A2": "点心",
        "A3": "纸杯"
      }
    }
  },
  {
    "sessionId": "budgetchoices",
    "index": 2,
    "nodeId": "mt_Qe2PsFmSAH",
    "type": "x-m33-compare",
    "taskHash": "d8697538de6699444f40332d87bd90f593a9c6014a389b87eeeff1fe76224bc3",
    "task": {
      "type": "x-m33-compare",
      "prompt": "同一种米：2 kg售$5.80，500 g售$1.60。哪一种每kg更便宜？",
      "items": [
        {
          "label": "2 kg装",
          "value": 290,
          "detail": "每kg $2.90"
        },
        {
          "label": "500 g装",
          "value": 320,
          "detail": "每kg $3.20"
        }
      ],
      "want": "left",
      "questions": [
        {
          "label": "500 g装换成1 kg的价格",
          "value": 320,
          "kind": "major"
        }
      ],
      "currency": "AUD",
      "note": "比较相同重量的价格；不评价口味与浪费。"
    }
  },
  {
    "sessionId": "budgetchoices",
    "index": 3,
    "nodeId": "mt_Qe2PsFmSAH",
    "type": "x-m33-calc",
    "taskHash": "8504a75ba0924cee3aba7f113791d400c617dc85f1d79a1d6551da0cfb4918aa",
    "task": {
      "type": "x-m33-calc",
      "prompt": "五件澳元商品$4.95、$7.80、$3.25、$5.40、$2.80。先估一估是否在$25内，再算总价。",
      "currency": "AUD",
      "expected": 2420,
      "exampleFormula": "4.95+7.80+3.25+5.40+2.80",
      "questions": [
        {
          "label": "准确总价",
          "value": 2420,
          "kind": "major"
        },
        {
          "label": "不超过$25吗",
          "value": "yes",
          "kind": "choice",
          "options": [
            [
              "yes",
              "不超过"
            ],
            [
              "no",
              "超过"
            ]
          ]
        }
      ],
      "estimate": true,
      "estimateExample": 24,
      "estimateRange": [
        22,
        26
      ],
      "estimateLabel": "先估大约多少澳元"
    }
  },
  {
    "sessionId": "discounts",
    "index": 0,
    "nodeId": "mt_oMkQQ2O-ML",
    "type": "x-m33-calc",
    "taskHash": "16d82d0c7dfc631663c7b55f33d1aaa44a5439fb82904b830ed94d1580c514c1",
    "task": {
      "type": "x-m33-calc",
      "prompt": "澳元$80的外套打七五折。先估一估，再算付多少。",
      "currency": "AUD",
      "expected": 6000,
      "exampleFormula": "80*(1-25%)",
      "questions": [
        {
          "label": "折后价格",
          "value": 6000,
          "kind": "major"
        }
      ],
      "estimate": true,
      "estimateExample": 60,
      "estimateRange": [
        55,
        65
      ],
      "estimateLabel": "先估大约付多少澳元"
    }
  },
  {
    "sessionId": "discounts",
    "index": 1,
    "nodeId": "mt_oMkQQ2O-ML",
    "type": "x-m33-calc",
    "taskHash": "48896dea82753007cf73f2b54691c8ef776b7815821b83ee8ef42d7c552d6885",
    "task": {
      "type": "x-m33-calc",
      "prompt": "澳大利亚题目：税前$45，加10% GST。计算含税总价。",
      "currency": "AUD",
      "expected": 4950,
      "exampleFormula": "45*1.10",
      "questions": [
        {
          "label": "10%税额",
          "value": 450,
          "kind": "major"
        },
        {
          "label": "含税总价",
          "value": 4950,
          "kind": "major"
        },
        {
          "label": "已标含GST的价格",
          "value": "already",
          "kind": "choice",
          "options": [
            [
              "already",
              "不再加同一税额"
            ],
            [
              "again",
              "再加10%"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "moneysheet",
    "index": 0,
    "nodeId": "mt_mMDpLugX2X",
    "type": "x-m33-sheet",
    "taskHash": "11f60448699bf0e78793fe7ce64bf541242eca7fffc46fa35b0570a8cd6cf7d0",
    "task": {
      "type": "x-m33-sheet",
      "prompt": "澳元表格：两项收入$12.85、$7.60，支出$3.95。先估，再写单元格公式。",
      "currency": "AUD",
      "refs": {
        "A1": 1285,
        "A2": 760,
        "A3": 395
      },
      "expected": 1650,
      "exampleFormula": "=A1+A2-A3",
      "requiredRefs": [
        "A1",
        "A2",
        "A3"
      ],
      "questions": [
        {
          "label": "余下",
          "value": 1650,
          "kind": "major"
        }
      ],
      "labels": {
        "A1": "收入1",
        "A2": "收入2",
        "A3": "支出"
      },
      "estimate": true,
      "estimateExample": 17,
      "estimateRange": [
        15,
        18
      ]
    }
  },
  {
    "sessionId": "moneysheet",
    "index": 1,
    "nodeId": "mt_mMDpLugX2X",
    "type": "x-m33-sheet",
    "taskHash": "4185e2e1c83a3c444424cd2aef1245661c010a0e7b650b4d64ca69c8b4d5cae0",
    "task": {
      "type": "x-m33-sheet",
      "prompt": "澳元$64.90打85折。用公式算原价的15%作折扣，估计约$10。",
      "currency": "AUD",
      "refs": {
        "A1": 6490
      },
      "expected": 974,
      "exampleFormula": "=A1*15%",
      "requiredRefs": [
        "A1"
      ],
      "questions": [
        {
          "label": "四舍五入到分，折扣是多少",
          "value": 974,
          "kind": "major"
        }
      ],
      "labels": {
        "A1": "原价"
      },
      "estimate": true,
      "estimateExample": 10,
      "estimateRange": [
        8,
        12
      ]
    }
  },
  {
    "sessionId": "moneysheet",
    "index": 2,
    "nodeId": "mt_mMDpLugX2X",
    "type": "x-m33-sheet",
    "taskHash": "2d80ceae1a71092bfa41f7fa60043c0f990319c687cd683abeb5aaa01c2c10a3",
    "task": {
      "type": "x-m33-sheet",
      "prompt": "澳大利亚题目：税前$45，加10% GST；用单元格公式算含税价。",
      "currency": "AUD",
      "refs": {
        "A1": 4500
      },
      "expected": 4950,
      "exampleFormula": "=A1*1.1",
      "requiredRefs": [
        "A1"
      ],
      "questions": [
        {
          "label": "含税价",
          "value": 4950,
          "kind": "major"
        },
        {
          "label": "价格已经含税时",
          "value": "already",
          "kind": "choice",
          "options": [
            [
              "already",
              "不再加同一税额"
            ],
            [
              "again",
              "再加一次"
            ]
          ]
        }
      ],
      "labels": {
        "A1": "税前价格"
      }
    }
  },
  {
    "sessionId": "pctCalculate37",
    "index": 1,
    "nodeId": "mt_PNSyfH56eQ",
    "type": "x-m33-compare",
    "taskHash": "690651c8bf7db680194c26993c3eb682a76aa51cde36103359edc11fd55d88e7",
    "task": {
      "type": "x-m33-compare",
      "prompt": "甲原价50元减20%，乙原价150元减10%。哪次减去的钱更多？",
      "items": [
        {
          "label": "甲：20% × 50",
          "value": 10,
          "detail": "减去10元"
        },
        {
          "label": "乙：10% × 150",
          "value": 15,
          "detail": "减去15元"
        }
      ],
      "want": "right",
      "questions": [
        {
          "label": "甲减去多少元",
          "value": 10
        },
        {
          "label": "乙减去多少元",
          "value": 15
        }
      ]
    }
  },
  {
    "sessionId": "rateUnit37",
    "index": 1,
    "nodeId": "mt_kLQOzZYrd5",
    "type": "x-m33-compare",
    "taskHash": "48570d902afc38fe2d386843d9f7da8c8a90fd8d25ecad42f60ffc0631a11df0",
    "task": {
      "type": "x-m33-compare",
      "prompt": "甲半千克6元，乙1千克10元。哪种每千克更便宜？",
      "items": [
        {
          "label": "甲：半千克6元",
          "value": 12,
          "detail": "每千克12元"
        },
        {
          "label": "乙：一千克10元",
          "value": 10,
          "detail": "每千克10元"
        }
      ],
      "want": "right",
      "questions": [
        {
          "label": "甲每千克多少元",
          "value": 12
        },
        {
          "label": "乙每千克多少元",
          "value": 10
        }
      ]
    }
  },
  {
    "sessionId": "tools38",
    "index": 1,
    "nodeId": "mt_20WfHhnL39",
    "type": "x-m33-model",
    "taskHash": "c643f90af92aea7d21c0325b43e098702e1a1e78a3adfb02d5f4e1082564b03a",
    "task": {
      "type": "x-m33-model",
      "prompt": "一根绳原来45 cm，剪掉18 cm。挑一种表示，再找剩下的长度。",
      "whole": 45,
      "known": 18,
      "unit": "cm",
      "questions": [
        {
          "label": "剩下多少cm",
          "value": 27,
          "kind": "number"
        }
      ]
    }
  },
  {
    "sessionId": "lifemath38",
    "index": 0,
    "nodeId": "mt_f67qGDhyfi",
    "type": "x-m33-model",
    "taskHash": "c643f90af92aea7d21c0325b43e098702e1a1e78a3adfb02d5f4e1082564b03a",
    "task": {
      "type": "x-m33-model",
      "prompt": "一根绳原来45 cm，剪掉18 cm。挑一种表示，再找剩下的长度。",
      "whole": 45,
      "known": 18,
      "unit": "cm",
      "questions": [
        {
          "label": "剩下多少cm",
          "value": 27,
          "kind": "number"
        }
      ]
    }
  },
  {
    "sessionId": "plan38",
    "index": 1,
    "nodeId": "mt_O_UOTiMvT_",
    "type": "x-m33-model",
    "taskHash": "c643f90af92aea7d21c0325b43e098702e1a1e78a3adfb02d5f4e1082564b03a",
    "task": {
      "type": "x-m33-model",
      "prompt": "一根绳原来45 cm，剪掉18 cm。挑一种表示，再找剩下的长度。",
      "whole": 45,
      "known": 18,
      "unit": "cm",
      "questions": [
        {
          "label": "剩下多少cm",
          "value": 27,
          "kind": "number"
        }
      ]
    }
  }
];
export const P011_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p011MeasurementModelsBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p011-measurement-models', method:null, question:"换成同一个单位再比较，或者按实际数量核对总价、折扣和找零。"};
}
export function replayP011MeasurementModelsEvidence(task, model, context) {
  try {
    const binding = p011MeasurementModelsBinding(task, context);
    const modelForTask = [b33].find(owner => owner.TYPES.has(task?.type));
    if (!modelForTask) return null;
    const {initial,inspect,valid} = modelForTask;
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const data = {
      coinvalues:{
        1:{choice:'left', answers:[200]},
      },
      modmoney:{0:{answers:[45-18]}},
      auscoins:{0:{answers:['two']}},
      moneycalc:{
        0:{cents:485+1230+795,answers:[485+1230+795]},
        1:{cents:1000-645,answers:[1000-645]},
        2:{cents:6*395,answers:[4*5,['mental','written','calculator']]},
      },
      measuremoney:{1:{choice:'left',answers:[15*100]}},
      roughmoney:{
        0:{cents:495+210+785,answers:[495+210+785]},
        1:{answers:[Math.round(1237/5)*5,Math.round(848/5)*5]},
        2:{cents:5000-690-815,answers:[5000-690-815,'near']},
      },
      budgetchoices:{
        1:{cents:1200+1450+350,answers:[1200+1450+350]},
        2:{choice:'left',answers:[2*160]},
        3:{cents:495+780+325+540+280,answers:[495+780+325+540+280,'yes']},
      },
      discounts:{
        0:{cents:8000*75/100,answers:[8000*75/100]},
        1:{cents:4500*110/100,answers:[4500/10,4500*110/100,'already']},
      },
      moneysheet:{
        0:{cents:1285+760-395,answers:[1285+760-395]},
        1:{cents:Math.floor((6490*15+50)/100),answers:[Math.floor((6490*15+50)/100)]},
        2:{cents:4500*110/100,answers:[4500*110/100,'already']},
      },
      pctCalculate37:{1:{choice:'right',answers:[50*20/100,150*10/100]}},
      rateUnit37:{1:{choice:'right',answers:[6*2,10]}},
      tools38:{1:{answers:[45-18]}},
      lifemath38:{0:{answers:[45-18]}},
      plan38:{1:{answers:[45-18]}},
    };
    const contract=data[context.sessionId]?.[context.index] ?? {answers:[]};
    const type=task.type;
    const board=initial(task).board;
    const categories=(card)=>{
      if (context.sessionId==='roughmoney') {
        const cents=b33.parseMoney(card.label,'AUD');
        return Math.round(cents/5)*5 < cents ? 'down' : 'up';
      }
      if (context.sessionId==='auscoins') return card.label.includes('$')?'dollar':'cent';
      if (context.index===2) return card.note===true?'note':'coin';
      return card.label.startsWith('£')?'pound':'p';
    };
    const exact=(raw,wanted)=>{
      const expected=rational(String(wanted));
      const answer=rational(raw.trim());
      return answer&&expected&&BigInt(answer[0])*BigInt(expected[1])===BigInt(expected[0])*BigInt(answer[1]);
    };
    let issue=false;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v'])) return null;
      const {a,i,v}=event;
      issue=false;
      if (type==='x-m33-sort') {
        if (v!=='') return null;
        if (a==='group'&&task.groups.some(group=>group.id===i)) board.group=i;
        else if (a==='clear'&&i==='') board.placed.fill(null);
        else if (a==='place'&&/^\d+$/.test(i)&&Number(i)<task.cards.length&&board.group!==null) {
          const index=Number(i);
          board.first.place??={index,group:board.group};
          board.placed[index]=board.group;
          if (board.group!==categories(task.cards[index])) {board.bad=true;issue=true;}
        } else return null;
      } else if (type==='x-m33-compare') {
        if (v!=='') return null;
        if (a==='guess'&&board.guess===null&&['left','right','equal'].includes(i)) {
          board.guess=board.first.guess=i;
          board.bad ||= i!==contract.choice;
        } else if (a==='reveal'&&i===''&&board.guess!==null) board.revealed=true;
        else if (a==='pick'&&board.revealed&&['left','right','equal'].includes(i)) {
          board.first.choice??=i;
          board.choice=i;
          if (i!==contract.choice) {board.bad=true;issue=true;}
        } else return null;
      } else if (type==='x-m33-model') {
        if (a!=='method'||v!==''||!['bar','line','equation'].includes(i)) return null;
        board.first.method??=i;
        board.method=i;
      } else {
        if (i!=='') return null;
        if (a==='estimate') {
          if (board.estimate===null&&v.trim()) {
            board.estimate=board.first.estimate=v;
            const estimate=rational(v.trim());
            const number=estimate?estimate[0]/estimate[1]:NaN;
            if (task.estimateRange && !(number>=task.estimateRange[0]&&number<=task.estimateRange[1])) {
              board.bad=true;issue=true;
            }
          }
        } else if (a==='run'&&(!task.estimate||board.estimate!==null)) {
          board.first.formula??=v;
          const parsed=b33.evaluateFormula(v,task.refs||{});
          const valid=Boolean(parsed&&parsed.operators>0&&parsed.cents===contract.cents&&
            (task.requiredRefs||[]).every(ref=>parsed.references.includes(ref)));
          const run={formula:v,result:parsed?.cents??null,valid};
          if (board.runs.length<40) board.runs.push(run);
          board.last=run;
          if (!valid) {board.bad=true;issue=true;}
        } else return null;
      }
    }
    if (issue || !sameEvidence(board,model.board) || !inspect(task,model).correct) return null;
    if (type==='x-m33-sort' && !task.cards.every((card,index)=>board.placed[index]===categories(card))) return null;
    if (type==='x-m33-compare' && (!board.revealed || board.choice!==contract.choice)) return null;
    if (type==='x-m33-model' && !board.method) return null;
    if (['x-m33-calc','x-m33-sheet'].includes(type) &&
        (!board.last?.valid || board.last.formula!==model.formula || board.last.result!==contract.cents ||
          (task.estimate&&board.estimate===null))) return null;
    if (model.answers.length!==contract.answers.length || !contract.answers.every((target,index)=>{
      const raw=model.answers[index];
      const kind=task.questions[index].kind;
      if (kind==='major'||kind==='minor') return b33.parseMoney(raw,task.currency,kind)===target;
      if (typeof target==='number') return exact(raw,target);
      return Array.isArray(target)?target.includes(raw.trim()):target===raw.trim();
    })) return null;
    return {binding, cents:contract.cents??null, method:board.method??null, choice:board.choice??null};

  } catch {
    return null;
  }
}
export function submittedP011MeasurementModelsEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP011MeasurementModelsEvidence(task, model, context) : null;
}
