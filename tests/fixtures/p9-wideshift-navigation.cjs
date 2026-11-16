// Literal original tasks and hand-calculated visible paths, used only to reach
// the reviewed shifts through Next. These are not new strict coverage.
module.exports={
  "navigation": [
    {
      "id": "decimalplaces",
      "index": 0,
      "taskHash": "51f9dfd91718e7c07a4a4e0cd4db196edb0150927c2b8e49460c73ded020fdfc",
      "task": {
        "type": "x-wideboard",
        "mode": "build",
        "values": [
          "2.635"
        ],
        "prompt": "搭2.635，记录2、6、3、5各表示多少。小格标签也写着分母。",
        "expanded": true
      },
      "steps": [
        {
          "action": "wide-add",
          "data": {
            "index": 0,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 0,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 2,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 2,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 2,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 3,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 3,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 3,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 3,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 3,
            "delta": 1
          }
        },
        {
          "field": "answers.0",
          "value": "2.635"
        },
        {
          "field": "parts.0.0",
          "value": "2"
        },
        {
          "field": "parts.0.1",
          "value": "0.6"
        },
        {
          "field": "parts.0.2",
          "value": "0.03"
        },
        {
          "field": "parts.0.3",
          "value": "0.005"
        }
      ],
      "coverage": "navigation-only"
    },
    {
      "id": "largerfacts",
      "index": 0,
      "taskHash": "591026b38d52b774e1a3289c2bf11e9178eb1dc9c11e960e1689d97cc5fbb2ea",
      "task": {
        "type": "x-areaproduct",
        "a": 40,
        "b": 60,
        "prompt": "40×60：两边都带着十。把每边分成合适的两段，算每一小块。"
      },
      "steps": [
        {
          "field": "cutA",
          "value": "20"
        },
        {
          "field": "cutB",
          "value": "30"
        },
        {
          "action": "b14-cut",
          "data": {}
        },
        {
          "field": "part",
          "value": "600"
        },
        {
          "action": "b14-part",
          "data": {}
        },
        {
          "field": "part",
          "value": "600"
        },
        {
          "action": "b14-part",
          "data": {}
        },
        {
          "field": "part",
          "value": "600"
        },
        {
          "action": "b14-part",
          "data": {}
        },
        {
          "field": "part",
          "value": "600"
        },
        {
          "action": "b14-part",
          "data": {}
        },
        {
          "field": "base",
          "value": "24"
        },
        {
          "field": "answer",
          "value": "2400"
        }
      ],
      "coverage": "navigation-only"
    },
    {
      "id": "largerfacts",
      "index": 1,
      "taskHash": "ed2dc02f1d456d845765b4c81a431b3e052d260de4922b5ac742507a75454cd0",
      "task": {
        "type": "x-areaproduct",
        "a": 7,
        "b": 15,
        "prompt": "7×15：把15拆成10与5，一大块和一小块各是多少？"
      },
      "steps": [
        {
          "field": "cutA",
          "value": "7"
        },
        {
          "field": "cutB",
          "value": "10"
        },
        {
          "action": "b14-cut",
          "data": {}
        },
        {
          "field": "part",
          "value": "70"
        },
        {
          "action": "b14-part",
          "data": {}
        },
        {
          "field": "part",
          "value": "35"
        },
        {
          "action": "b14-part",
          "data": {}
        },
        {
          "field": "answer",
          "value": "105"
        }
      ],
      "coverage": "navigation-only"
    },
    {
      "id": "largerfacts",
      "index": 2,
      "taskHash": "e32db698fbc3bb1a8a89cffdaf742c9055ea3eb6e5e10a90ae62f8d5f6ca1e72",
      "task": {
        "type": "x-divtable",
        "n": 360,
        "d": 9,
        "prompt": "36÷9知道了，360÷9会变成多少？把每一位分清，再乘回去检查。",
        "interpret": "keep",
        "places": 0
      },
      "steps": [
        {
          "action": "b14-bring",
          "data": {}
        },
        {
          "field": "q",
          "value": "0"
        },
        {
          "field": "used",
          "value": "0"
        },
        {
          "field": "rest",
          "value": "3"
        },
        {
          "action": "b14-div-step",
          "data": {}
        },
        {
          "action": "b14-bring",
          "data": {}
        },
        {
          "field": "q",
          "value": "4"
        },
        {
          "field": "used",
          "value": "36"
        },
        {
          "field": "rest",
          "value": "0"
        },
        {
          "action": "b14-div-step",
          "data": {}
        },
        {
          "action": "b14-bring",
          "data": {}
        },
        {
          "field": "q",
          "value": "0"
        },
        {
          "field": "used",
          "value": "0"
        },
        {
          "field": "rest",
          "value": "0"
        },
        {
          "action": "b14-div-step",
          "data": {}
        },
        {
          "field": "check",
          "value": "40×9+0=360"
        },
        {
          "field": "answer",
          "value": "40"
        },
        {
          "field": "base",
          "value": "0"
        }
      ],
      "coverage": "navigation-only"
    },
    {
      "id": "dividebyten",
      "index": 1,
      "taskHash": "919013faf5036dedcdecd85f6be54854bce6d65f73dff604d4fa7beee634574f",
      "task": {
        "type": "x-wideboard",
        "mode": "build",
        "values": [
          "3.7"
        ],
        "expanded": true,
        "prompt": "把3.7放进位值表。3与7各表示多少？"
      },
      "steps": [
        {
          "action": "wide-add",
          "data": {
            "index": 0,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 0,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 0,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "field": "answers.0",
          "value": "3.7"
        },
        {
          "field": "parts.0.0",
          "value": "3"
        },
        {
          "field": "parts.0.1",
          "value": "0.7"
        }
      ],
      "coverage": "navigation-only"
    },
    {
      "id": "dividebyten",
      "index": 3,
      "taskHash": "6606147509375af0e851c6ce1cb9020419c5e73f1c768d920231b7411b07b913",
      "task": {
        "type": "x-wideboard",
        "mode": "build",
        "values": [
          "0.04"
        ],
        "expanded": true,
        "prompt": "4现在处在百分位。把空位也保留下来，给每位写出它的量。"
      },
      "steps": [
        {
          "action": "wide-add",
          "data": {
            "index": 2,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 2,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 2,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 2,
            "delta": 1
          }
        },
        {
          "field": "answers.0",
          "value": "0.04"
        },
        {
          "field": "parts.0.0",
          "value": "0"
        },
        {
          "field": "parts.0.1",
          "value": "0"
        },
        {
          "field": "parts.0.2",
          "value": "0.04"
        }
      ],
      "coverage": "navigation-only"
    },
    {
      "id": "structure39",
      "index": 0,
      "taskHash": "39f6a5cf05b613d211f3d0482378110a02ae812ee12f0722ecc4b92b2e018172",
      "task": {
        "type": "x-areaproduct",
        "a": 7,
        "b": 13,
        "prompt": "把7×13拆开。13可以分成10和3，两块各有多少？也可以试别的分法。"
      },
      "steps": [
        {
          "field": "cutA",
          "value": "7"
        },
        {
          "field": "cutB",
          "value": "10"
        },
        {
          "action": "b14-cut",
          "data": {}
        },
        {
          "field": "part",
          "value": "70"
        },
        {
          "action": "b14-part",
          "data": {}
        },
        {
          "field": "part",
          "value": "21"
        },
        {
          "action": "b14-part",
          "data": {}
        },
        {
          "field": "answer",
          "value": "91"
        }
      ],
      "coverage": "navigation-only"
    },
    {
      "id": "link-powerblocks-standardform",
      "index": 0,
      "taskHash": "5b90691d38a7ef2e1a3a703ff1107d4d885c34d138636fe219f10edefa6bbf70",
      "task": {
        "type": "x-powerchain",
        "base": 5,
        "count": 4,
        "prompt": "5⁴不是5×4。每次乘5，亲自接出四次。"
      },
      "steps": [
        {
          "field": "next",
          "value": "5"
        },
        {
          "action": "chain-step",
          "data": {}
        },
        {
          "field": "next",
          "value": "25"
        },
        {
          "action": "chain-step",
          "data": {}
        },
        {
          "field": "next",
          "value": "125"
        },
        {
          "action": "chain-step",
          "data": {}
        },
        {
          "field": "next",
          "value": "625"
        },
        {
          "action": "chain-step",
          "data": {}
        },
        {
          "field": "answer",
          "value": "625"
        }
      ],
      "coverage": "navigation-only"
    },
    {
      "id": "link-hundredths-dividebyten",
      "index": 0,
      "taskHash": "52641d4d0163cebccec7c82d31e28a4165b8b12571f6002a9693cdeb1d643dae",
      "task": {
        "type": "x-fdpboard",
        "n": 7,
        "d": 100,
        "prompt": "0.07与0.7相差多少？先涂0.07，再把它的分数名字写准。",
        "views": [
          "line"
        ]
      },
      "steps": [
        {
          "action": "b16-cell",
          "data": {
            "index": 0
          }
        },
        {
          "action": "b16-cell",
          "data": {
            "index": 1
          }
        },
        {
          "action": "b16-cell",
          "data": {
            "index": 2
          }
        },
        {
          "action": "b16-cell",
          "data": {
            "index": 3
          }
        },
        {
          "action": "b16-cell",
          "data": {
            "index": 4
          }
        },
        {
          "action": "b16-cell",
          "data": {
            "index": 5
          }
        },
        {
          "action": "b16-cell",
          "data": {
            "index": 6
          }
        },
        {
          "action": "b16-view",
          "data": {
            "value": "line"
          }
        },
        {
          "field": "num",
          "value": "7"
        },
        {
          "field": "den",
          "value": "100"
        },
        {
          "field": "decimal",
          "value": "0.07"
        },
        {
          "field": "percent",
          "value": "7"
        }
      ],
      "coverage": "navigation-only"
    },
    {
      "id": "link-decimal-dividebyten",
      "index": 0,
      "taskHash": "234e208a651555120849256dd78ac46a9afbbbdddba51713f851a99d35f43057",
      "task": {
        "type": "x-unitwalk",
        "n": 3,
        "d": 10,
        "decimal": true,
        "prompt": "把3/10走到线上，同一点怎样用小数记录？"
      },
      "steps": [
        {
          "field": "parts",
          "value": "10"
        },
        {
          "action": "b16-partition",
          "data": {}
        },
        {
          "action": "b16-walk",
          "data": {}
        },
        {
          "action": "b16-walk",
          "data": {}
        },
        {
          "action": "b16-walk",
          "data": {}
        },
        {
          "field": "answer",
          "value": "3/10"
        },
        {
          "field": "decimal",
          "value": "0.3"
        }
      ],
      "coverage": "navigation-only"
    },
    {
      "id": "link-fourplaces-thousandstep",
      "index": 0,
      "taskHash": "93e7fb1d55663cd83a8a93bb9a3d7831bb0567e14bb5d74bcf2e12a999e139f4",
      "task": {
        "type": "x-wideboard",
        "mode": "build",
        "values": [
          "3452"
        ],
        "prompt": "3000、400、50、2合在一起是多少？搭好并写数。",
        "expanded": true
      },
      "steps": [
        {
          "action": "wide-add",
          "data": {
            "index": 0,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 0,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 0,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 1,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 2,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 2,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 2,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 2,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 2,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 3,
            "delta": 1
          }
        },
        {
          "action": "wide-add",
          "data": {
            "index": 3,
            "delta": 1
          }
        },
        {
          "field": "answers.0",
          "value": "3452"
        },
        {
          "field": "parts.0.0",
          "value": "3000"
        },
        {
          "field": "parts.0.1",
          "value": "400"
        },
        {
          "field": "parts.0.2",
          "value": "50"
        },
        {
          "field": "parts.0.3",
          "value": "2"
        }
      ],
      "coverage": "navigation-only"
    }
  ]
};
