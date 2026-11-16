// Fixed complete source inventory and independently calculated visible-control plans.
// Generated once after the Issue #174 source review; CI never regenerates it.
module.exports={
  "sourceBase": "c59014831da55d7aaa69208c0009126a886f8cf1",
  "sourceFiles": {
    "dist/learning/phase5/b30.js": "ad3d00d3fb4bdf19f742ecff3e03c313504c763d811714301d0b2bb6be00c3d7",
    "dist/learning/phase5/b30-model.js": "1596369a899fd4031756af136d8e26268fd7c018aa8c7ccaac196f3a2047253a",
    "dist/learning/phase5/b30-view.js": "09c3350a8563c5b4e88b47c480bb38f33a5556f1a6608e41bee1ae9893511269",
    "dist/learning/phase5/b30-geometry.js": "af69332b69384bae8ed945a60b75d2390ec1cfb7a28a7a1d4008179e80121f2c",
    "dist/learning/phase5/b30-solid-view.js": "f2560c92ba9aedf699c4e064b26f6fe89476b4dfc4220a3b2d3ecc92cfe32cb3"
  },
  "cases": [
    {
      "id": "areadistrib",
      "sessionId": "areadistrib",
      "index": 0,
      "nodeId": "mt_AQo4u7O4sM",
      "type": "x-a30-grid",
      "kind": "partition",
      "actions": [
        {
          "action": "a30-corner",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 15
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 4
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 17
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "field": "area",
          "value": "18"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "answers.0",
          "value": "12"
        },
        {
          "field": "answers.1",
          "value": "6"
        }
      ],
      "answers": [
        "12",
        "6"
      ],
      "expected": {
        "area": 18,
        "perimeter": 18,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            2,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            2,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            2,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            2,
            0,
            1
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            2,
            0,
            1
          ],
          [
            5,
            0,
            1,
            0
          ],
          [
            5,
            0,
            0,
            -1
          ],
          [
            5,
            1,
            1,
            0
          ],
          [
            5,
            2,
            1,
            0
          ],
          [
            5,
            2,
            0,
            1
          ]
        ],
        "independentRectangles": [
          [
            0,
            0,
            4,
            3
          ],
          [
            4,
            0,
            2,
            3
          ]
        ],
        "constructed": {
          "area": 18,
          "perimeter": 18,
          "connected": true,
          "holes": false,
          "rectangle": true,
          "unitBoundaryEdges": [
            [
              0,
              0,
              -1,
              0
            ],
            [
              0,
              0,
              0,
              -1
            ],
            [
              0,
              1,
              -1,
              0
            ],
            [
              0,
              2,
              -1,
              0
            ],
            [
              0,
              2,
              0,
              1
            ],
            [
              1,
              0,
              0,
              -1
            ],
            [
              1,
              2,
              0,
              1
            ],
            [
              2,
              0,
              0,
              -1
            ],
            [
              2,
              2,
              0,
              1
            ],
            [
              3,
              0,
              0,
              -1
            ],
            [
              3,
              2,
              0,
              1
            ],
            [
              4,
              0,
              0,
              -1
            ],
            [
              4,
              2,
              0,
              1
            ],
            [
              5,
              0,
              1,
              0
            ],
            [
              5,
              0,
              0,
              -1
            ],
            [
              5,
              1,
              1,
              0
            ],
            [
              5,
              2,
              1,
              0
            ],
            [
              5,
              2,
              0,
              1
            ]
          ]
        }
      },
      "taskHash": "b83d0a1b83d3f74ea84cfaf36c46db3585943e6a31f9e5c5ee23a307e052d1f9"
    },
    {
      "id": "areadistrib",
      "sessionId": "areadistrib",
      "index": 1,
      "nodeId": "mt_AQo4u7O4sM",
      "type": "x-a30-grid",
      "kind": "partition",
      "actions": [
        {
          "action": "a30-corner",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 74
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 10
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 77
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "field": "area",
          "value": "78"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "answers.0",
          "value": "60"
        },
        {
          "field": "answers.1",
          "value": "18"
        }
      ],
      "answers": [
        "60",
        "18"
      ],
      "expected": {
        "area": 78,
        "perimeter": 38,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            4,
            -1,
            0
          ],
          [
            0,
            5,
            -1,
            0
          ],
          [
            0,
            5,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            5,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            5,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            5,
            0,
            1
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            5,
            0,
            1
          ],
          [
            5,
            0,
            0,
            -1
          ],
          [
            5,
            5,
            0,
            1
          ],
          [
            6,
            0,
            0,
            -1
          ],
          [
            6,
            5,
            0,
            1
          ],
          [
            7,
            0,
            0,
            -1
          ],
          [
            7,
            5,
            0,
            1
          ],
          [
            8,
            0,
            0,
            -1
          ],
          [
            8,
            5,
            0,
            1
          ],
          [
            9,
            0,
            0,
            -1
          ],
          [
            9,
            5,
            0,
            1
          ],
          [
            10,
            0,
            0,
            -1
          ],
          [
            10,
            5,
            0,
            1
          ],
          [
            11,
            0,
            0,
            -1
          ],
          [
            11,
            5,
            0,
            1
          ],
          [
            12,
            0,
            1,
            0
          ],
          [
            12,
            0,
            0,
            -1
          ],
          [
            12,
            1,
            1,
            0
          ],
          [
            12,
            2,
            1,
            0
          ],
          [
            12,
            3,
            1,
            0
          ],
          [
            12,
            4,
            1,
            0
          ],
          [
            12,
            5,
            1,
            0
          ],
          [
            12,
            5,
            0,
            1
          ]
        ],
        "independentRectangles": [
          [
            0,
            0,
            10,
            6
          ],
          [
            10,
            0,
            3,
            6
          ]
        ],
        "constructed": {
          "area": 78,
          "perimeter": 38,
          "connected": true,
          "holes": false,
          "rectangle": true,
          "unitBoundaryEdges": [
            [
              0,
              0,
              -1,
              0
            ],
            [
              0,
              0,
              0,
              -1
            ],
            [
              0,
              1,
              -1,
              0
            ],
            [
              0,
              2,
              -1,
              0
            ],
            [
              0,
              3,
              -1,
              0
            ],
            [
              0,
              4,
              -1,
              0
            ],
            [
              0,
              5,
              -1,
              0
            ],
            [
              0,
              5,
              0,
              1
            ],
            [
              1,
              0,
              0,
              -1
            ],
            [
              1,
              5,
              0,
              1
            ],
            [
              2,
              0,
              0,
              -1
            ],
            [
              2,
              5,
              0,
              1
            ],
            [
              3,
              0,
              0,
              -1
            ],
            [
              3,
              5,
              0,
              1
            ],
            [
              4,
              0,
              0,
              -1
            ],
            [
              4,
              5,
              0,
              1
            ],
            [
              5,
              0,
              0,
              -1
            ],
            [
              5,
              5,
              0,
              1
            ],
            [
              6,
              0,
              0,
              -1
            ],
            [
              6,
              5,
              0,
              1
            ],
            [
              7,
              0,
              0,
              -1
            ],
            [
              7,
              5,
              0,
              1
            ],
            [
              8,
              0,
              0,
              -1
            ],
            [
              8,
              5,
              0,
              1
            ],
            [
              9,
              0,
              0,
              -1
            ],
            [
              9,
              5,
              0,
              1
            ],
            [
              10,
              0,
              0,
              -1
            ],
            [
              10,
              5,
              0,
              1
            ],
            [
              11,
              0,
              0,
              -1
            ],
            [
              11,
              5,
              0,
              1
            ],
            [
              12,
              0,
              1,
              0
            ],
            [
              12,
              0,
              0,
              -1
            ],
            [
              12,
              1,
              1,
              0
            ],
            [
              12,
              2,
              1,
              0
            ],
            [
              12,
              3,
              1,
              0
            ],
            [
              12,
              4,
              1,
              0
            ],
            [
              12,
              5,
              1,
              0
            ],
            [
              12,
              5,
              0,
              1
            ]
          ]
        }
      },
      "taskHash": "a1032ca20ff3a5385b0f469219e6f00fbbfea81e76b8e89ef55e37e66fc778fc"
    },
    {
      "id": "areadistrib",
      "sessionId": "areadistrib",
      "index": 2,
      "nodeId": "mt_AQo4u7O4sM",
      "type": "x-a30-grid",
      "kind": "partition",
      "actions": [
        {
          "action": "a30-corner",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 46
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 7
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 49
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "field": "area",
          "value": "50"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "answers.0",
          "value": "35"
        },
        {
          "field": "answers.1",
          "value": "15"
        }
      ],
      "answers": [
        "35",
        "15"
      ],
      "expected": {
        "area": 50,
        "perimeter": 30,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            4,
            -1,
            0
          ],
          [
            0,
            4,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            4,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            4,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            4,
            0,
            1
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            4,
            0,
            1
          ],
          [
            5,
            0,
            0,
            -1
          ],
          [
            5,
            4,
            0,
            1
          ],
          [
            6,
            0,
            0,
            -1
          ],
          [
            6,
            4,
            0,
            1
          ],
          [
            7,
            0,
            0,
            -1
          ],
          [
            7,
            4,
            0,
            1
          ],
          [
            8,
            0,
            0,
            -1
          ],
          [
            8,
            4,
            0,
            1
          ],
          [
            9,
            0,
            1,
            0
          ],
          [
            9,
            0,
            0,
            -1
          ],
          [
            9,
            1,
            1,
            0
          ],
          [
            9,
            2,
            1,
            0
          ],
          [
            9,
            3,
            1,
            0
          ],
          [
            9,
            4,
            1,
            0
          ],
          [
            9,
            4,
            0,
            1
          ]
        ],
        "independentRectangles": [
          [
            0,
            0,
            7,
            5
          ],
          [
            7,
            0,
            3,
            5
          ]
        ],
        "constructed": {
          "area": 50,
          "perimeter": 30,
          "connected": true,
          "holes": false,
          "rectangle": true,
          "unitBoundaryEdges": [
            [
              0,
              0,
              -1,
              0
            ],
            [
              0,
              0,
              0,
              -1
            ],
            [
              0,
              1,
              -1,
              0
            ],
            [
              0,
              2,
              -1,
              0
            ],
            [
              0,
              3,
              -1,
              0
            ],
            [
              0,
              4,
              -1,
              0
            ],
            [
              0,
              4,
              0,
              1
            ],
            [
              1,
              0,
              0,
              -1
            ],
            [
              1,
              4,
              0,
              1
            ],
            [
              2,
              0,
              0,
              -1
            ],
            [
              2,
              4,
              0,
              1
            ],
            [
              3,
              0,
              0,
              -1
            ],
            [
              3,
              4,
              0,
              1
            ],
            [
              4,
              0,
              0,
              -1
            ],
            [
              4,
              4,
              0,
              1
            ],
            [
              5,
              0,
              0,
              -1
            ],
            [
              5,
              4,
              0,
              1
            ],
            [
              6,
              0,
              0,
              -1
            ],
            [
              6,
              4,
              0,
              1
            ],
            [
              7,
              0,
              0,
              -1
            ],
            [
              7,
              4,
              0,
              1
            ],
            [
              8,
              0,
              0,
              -1
            ],
            [
              8,
              4,
              0,
              1
            ],
            [
              9,
              0,
              1,
              0
            ],
            [
              9,
              0,
              0,
              -1
            ],
            [
              9,
              1,
              1,
              0
            ],
            [
              9,
              2,
              1,
              0
            ],
            [
              9,
              3,
              1,
              0
            ],
            [
              9,
              4,
              1,
              0
            ],
            [
              9,
              4,
              0,
              1
            ]
          ]
        }
      },
      "taskHash": "fd979c1f18a9ead6314d078a6c5117ec48201361620c2b8b89b87c7ca3442b36"
    },
    {
      "id": "polyperim",
      "sessionId": "polyperim",
      "index": 2,
      "nodeId": "mt_WtcFrxGOgw",
      "type": "x-a30-compare",
      "kind": "compare",
      "actions": [
        {
          "field": "w1",
          "value": "1"
        },
        {
          "field": "h1",
          "value": "11"
        },
        {
          "field": "w2",
          "value": "2"
        },
        {
          "field": "h2",
          "value": "10"
        },
        {
          "action": "a30-build"
        }
      ],
      "answers": [],
      "expected": {
        "allOrderedIntegerDimensionSolutions": 100,
        "independentDimensions": [
          1,
          11,
          2,
          10
        ],
        "areas": [
          11,
          20
        ],
        "perimeters": [
          24,
          24
        ]
      },
      "taskHash": "1446e48003fd8c5cc4a0981c308facb9848cb1cbc4dbc7f1752bcdedd6c61f23"
    },
    {
      "id": "lperim",
      "sessionId": "lperim",
      "index": 2,
      "nodeId": "mt_n0AlyLQwC9",
      "type": "x-a30-grid",
      "kind": "design",
      "actions": [
        {
          "action": "a30-corner",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 29
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 30
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 92
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "field": "perimeter",
          "value": "40"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "answers": [],
      "expected": {
        "area": 100,
        "perimeter": 40,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            4,
            -1,
            0
          ],
          [
            0,
            5,
            -1,
            0
          ],
          [
            0,
            6,
            -1,
            0
          ],
          [
            0,
            7,
            -1,
            0
          ],
          [
            0,
            8,
            -1,
            0
          ],
          [
            0,
            9,
            -1,
            0
          ],
          [
            0,
            9,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            9,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            9,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            9,
            0,
            1
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            9,
            0,
            1
          ],
          [
            5,
            0,
            0,
            -1
          ],
          [
            5,
            9,
            0,
            1
          ],
          [
            6,
            0,
            0,
            -1
          ],
          [
            6,
            9,
            0,
            1
          ],
          [
            7,
            0,
            0,
            -1
          ],
          [
            7,
            9,
            0,
            1
          ],
          [
            8,
            0,
            0,
            -1
          ],
          [
            8,
            9,
            0,
            1
          ],
          [
            9,
            0,
            1,
            0
          ],
          [
            9,
            0,
            0,
            -1
          ],
          [
            9,
            1,
            1,
            0
          ],
          [
            9,
            2,
            1,
            0
          ],
          [
            9,
            3,
            1,
            0
          ],
          [
            9,
            4,
            1,
            0
          ],
          [
            9,
            5,
            1,
            0
          ],
          [
            9,
            6,
            1,
            0
          ],
          [
            9,
            7,
            1,
            0
          ],
          [
            9,
            8,
            1,
            0
          ],
          [
            9,
            9,
            1,
            0
          ],
          [
            9,
            9,
            0,
            1
          ]
        ],
        "independentRectangles": [
          [
            0,
            0,
            10,
            3
          ],
          [
            0,
            3,
            3,
            7
          ]
        ],
        "constructed": {
          "area": 51,
          "perimeter": 40,
          "connected": true,
          "holes": false,
          "rectangle": false,
          "unitBoundaryEdges": [
            [
              0,
              0,
              -1,
              0
            ],
            [
              0,
              0,
              0,
              -1
            ],
            [
              0,
              1,
              -1,
              0
            ],
            [
              0,
              2,
              -1,
              0
            ],
            [
              0,
              3,
              -1,
              0
            ],
            [
              0,
              4,
              -1,
              0
            ],
            [
              0,
              5,
              -1,
              0
            ],
            [
              0,
              6,
              -1,
              0
            ],
            [
              0,
              7,
              -1,
              0
            ],
            [
              0,
              8,
              -1,
              0
            ],
            [
              0,
              9,
              -1,
              0
            ],
            [
              0,
              9,
              0,
              1
            ],
            [
              1,
              0,
              0,
              -1
            ],
            [
              1,
              9,
              0,
              1
            ],
            [
              2,
              0,
              0,
              -1
            ],
            [
              2,
              3,
              1,
              0
            ],
            [
              2,
              4,
              1,
              0
            ],
            [
              2,
              5,
              1,
              0
            ],
            [
              2,
              6,
              1,
              0
            ],
            [
              2,
              7,
              1,
              0
            ],
            [
              2,
              8,
              1,
              0
            ],
            [
              2,
              9,
              1,
              0
            ],
            [
              2,
              9,
              0,
              1
            ],
            [
              3,
              0,
              0,
              -1
            ],
            [
              3,
              2,
              0,
              1
            ],
            [
              4,
              0,
              0,
              -1
            ],
            [
              4,
              2,
              0,
              1
            ],
            [
              5,
              0,
              0,
              -1
            ],
            [
              5,
              2,
              0,
              1
            ],
            [
              6,
              0,
              0,
              -1
            ],
            [
              6,
              2,
              0,
              1
            ],
            [
              7,
              0,
              0,
              -1
            ],
            [
              7,
              2,
              0,
              1
            ],
            [
              8,
              0,
              0,
              -1
            ],
            [
              8,
              2,
              0,
              1
            ],
            [
              9,
              0,
              1,
              0
            ],
            [
              9,
              0,
              0,
              -1
            ],
            [
              9,
              1,
              1,
              0
            ],
            [
              9,
              2,
              1,
              0
            ],
            [
              9,
              2,
              0,
              1
            ]
          ]
        }
      },
      "taskHash": "2ab3ba83e6702b3b2c99cdfbd963252eb03f6bd1a9a11a16d2a48f08a48ff9b4"
    },
    {
      "id": "areaPerim",
      "sessionId": "areaPerim",
      "index": 0,
      "nodeId": "mt_MJZA90uc6H",
      "type": "x-a30-compare",
      "kind": "compare",
      "actions": [
        {
          "field": "w1",
          "value": "2"
        },
        {
          "field": "h1",
          "value": "12"
        },
        {
          "field": "w2",
          "value": "3"
        },
        {
          "field": "h2",
          "value": "8"
        },
        {
          "action": "a30-build"
        }
      ],
      "answers": [],
      "expected": {
        "allOrderedIntegerDimensionSolutions": 24,
        "independentDimensions": [
          2,
          12,
          3,
          8
        ],
        "areas": [
          24,
          24
        ],
        "perimeters": [
          28,
          22
        ]
      },
      "taskHash": "74a57e77e6dbc5c42c2b0622456dfc5254eaa9cbee12815cc18d0d07fc1b05e2"
    },
    {
      "id": "areaPerim",
      "sessionId": "areaPerim",
      "index": 1,
      "nodeId": "mt_MJZA90uc6H",
      "type": "x-a30-compare",
      "kind": "compare",
      "actions": [
        {
          "field": "w1",
          "value": "1"
        },
        {
          "field": "h1",
          "value": "9"
        },
        {
          "field": "w2",
          "value": "2"
        },
        {
          "field": "h2",
          "value": "8"
        },
        {
          "action": "a30-build"
        }
      ],
      "answers": [],
      "expected": {
        "allOrderedIntegerDimensionSolutions": 64,
        "independentDimensions": [
          1,
          9,
          2,
          8
        ],
        "areas": [
          9,
          16
        ],
        "perimeters": [
          20,
          20
        ]
      },
      "taskHash": "b5a94a49b53d4dbc26bb1441234a308963eefea56a9740ebe351a1a4af637016"
    },
    {
      "id": "areaPerim",
      "sessionId": "areaPerim",
      "index": 2,
      "nodeId": "mt_MJZA90uc6H",
      "type": "x-a30-compare",
      "kind": "compare",
      "actions": [
        {
          "field": "w1",
          "value": "2"
        },
        {
          "field": "h1",
          "value": "12"
        },
        {
          "field": "w2",
          "value": "4"
        },
        {
          "field": "h2",
          "value": "6"
        },
        {
          "action": "a30-build"
        },
        {
          "field": "answers.0",
          "value": "sides"
        }
      ],
      "answers": [
        "sides"
      ],
      "expected": {
        "allOrderedIntegerDimensionSolutions": 24,
        "independentDimensions": [
          2,
          12,
          4,
          6
        ],
        "areas": [
          24,
          24
        ],
        "perimeters": [
          28,
          20
        ]
      },
      "taskHash": "4bd8a4602c145e44093a0bc5371e3f766821275dbbb250935eb257c2f89738e9"
    },
    {
      "id": "rectsplit",
      "sessionId": "rectsplit",
      "index": 0,
      "nodeId": "mt_eMtV6tBSJm",
      "type": "x-a30-grid",
      "kind": "partition",
      "actions": [
        {
          "action": "a30-corner",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 21
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 16
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 23
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "field": "area",
          "value": "20"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "area": 20,
        "perimeter": 20,
        "connected": true,
        "holes": false,
        "rectangle": false,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            3,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            3,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            3,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            3,
            0,
            1
          ],
          [
            4,
            2,
            0,
            -1
          ],
          [
            4,
            3,
            0,
            1
          ],
          [
            5,
            2,
            1,
            0
          ],
          [
            5,
            2,
            0,
            -1
          ],
          [
            5,
            3,
            1,
            0
          ],
          [
            5,
            3,
            0,
            1
          ]
        ],
        "independentRectangles": [
          [
            0,
            0,
            4,
            4
          ],
          [
            4,
            2,
            2,
            2
          ]
        ],
        "constructed": {
          "area": 20,
          "perimeter": 20,
          "connected": true,
          "holes": false,
          "rectangle": false,
          "unitBoundaryEdges": [
            [
              0,
              0,
              -1,
              0
            ],
            [
              0,
              0,
              0,
              -1
            ],
            [
              0,
              1,
              -1,
              0
            ],
            [
              0,
              2,
              -1,
              0
            ],
            [
              0,
              3,
              -1,
              0
            ],
            [
              0,
              3,
              0,
              1
            ],
            [
              1,
              0,
              0,
              -1
            ],
            [
              1,
              3,
              0,
              1
            ],
            [
              2,
              0,
              0,
              -1
            ],
            [
              2,
              3,
              0,
              1
            ],
            [
              3,
              0,
              1,
              0
            ],
            [
              3,
              0,
              0,
              -1
            ],
            [
              3,
              1,
              1,
              0
            ],
            [
              3,
              3,
              0,
              1
            ],
            [
              4,
              2,
              0,
              -1
            ],
            [
              4,
              3,
              0,
              1
            ],
            [
              5,
              2,
              1,
              0
            ],
            [
              5,
              2,
              0,
              -1
            ],
            [
              5,
              3,
              1,
              0
            ],
            [
              5,
              3,
              0,
              1
            ]
          ]
        }
      },
      "taskHash": "bb73bec69dc226206781a0eab03487b7a594538b0a0ecb80026a857939479d08"
    },
    {
      "id": "rectsplit",
      "sessionId": "rectsplit",
      "index": 1,
      "nodeId": "mt_eMtV6tBSJm",
      "type": "x-a30-grid",
      "kind": "partition",
      "actions": [
        {
          "action": "a30-corner",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 11
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 14
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 27
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "field": "area",
          "value": "18"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "area": 18,
        "perimeter": 22,
        "connected": true,
        "holes": false,
        "rectangle": false,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            1,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            1,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            2,
            -1,
            0
          ],
          [
            2,
            3,
            -1,
            0
          ],
          [
            2,
            4,
            -1,
            0
          ],
          [
            2,
            4,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            2,
            1,
            0
          ],
          [
            3,
            3,
            1,
            0
          ],
          [
            3,
            4,
            1,
            0
          ],
          [
            3,
            4,
            0,
            1
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            1,
            0,
            1
          ],
          [
            5,
            0,
            1,
            0
          ],
          [
            5,
            0,
            0,
            -1
          ],
          [
            5,
            1,
            1,
            0
          ],
          [
            5,
            1,
            0,
            1
          ]
        ],
        "independentRectangles": [
          [
            0,
            0,
            6,
            2
          ],
          [
            2,
            2,
            2,
            3
          ]
        ],
        "constructed": {
          "area": 18,
          "perimeter": 22,
          "connected": true,
          "holes": false,
          "rectangle": false,
          "unitBoundaryEdges": [
            [
              0,
              0,
              -1,
              0
            ],
            [
              0,
              0,
              0,
              -1
            ],
            [
              0,
              1,
              -1,
              0
            ],
            [
              0,
              1,
              0,
              1
            ],
            [
              1,
              0,
              0,
              -1
            ],
            [
              1,
              1,
              0,
              1
            ],
            [
              2,
              0,
              0,
              -1
            ],
            [
              2,
              2,
              -1,
              0
            ],
            [
              2,
              3,
              -1,
              0
            ],
            [
              2,
              4,
              -1,
              0
            ],
            [
              2,
              4,
              0,
              1
            ],
            [
              3,
              0,
              0,
              -1
            ],
            [
              3,
              2,
              1,
              0
            ],
            [
              3,
              3,
              1,
              0
            ],
            [
              3,
              4,
              1,
              0
            ],
            [
              3,
              4,
              0,
              1
            ],
            [
              4,
              0,
              0,
              -1
            ],
            [
              4,
              1,
              0,
              1
            ],
            [
              5,
              0,
              1,
              0
            ],
            [
              5,
              0,
              0,
              -1
            ],
            [
              5,
              1,
              1,
              0
            ],
            [
              5,
              1,
              0,
              1
            ]
          ]
        }
      },
      "taskHash": "4590e59f327914a48f166ec9327986f9dce8a06e140e97097358f8daaec1bd6f"
    },
    {
      "id": "rectsplit",
      "sessionId": "rectsplit",
      "index": 2,
      "nodeId": "mt_eMtV6tBSJm",
      "type": "x-a30-grid",
      "kind": "partition",
      "actions": [
        {
          "action": "a30-corner",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 22
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 3
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 19
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "field": "area",
          "value": "23"
        },
        {
          "field": "unit",
          "value": "m²"
        },
        {
          "field": "answers.0",
          "value": "15"
        },
        {
          "field": "answers.1",
          "value": "8"
        }
      ],
      "answers": [
        "15",
        "8"
      ],
      "expected": {
        "area": 23,
        "perimeter": 20,
        "connected": true,
        "holes": false,
        "rectangle": false,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            4,
            -1,
            0
          ],
          [
            0,
            4,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            4,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            4,
            1,
            0
          ],
          [
            2,
            4,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            3,
            0,
            1
          ],
          [
            4,
            0,
            1,
            0
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            1,
            1,
            0
          ],
          [
            4,
            2,
            1,
            0
          ],
          [
            4,
            3,
            1,
            0
          ],
          [
            4,
            3,
            0,
            1
          ]
        ],
        "independentRectangles": [
          [
            0,
            0,
            3,
            5
          ],
          [
            3,
            0,
            2,
            4
          ]
        ],
        "constructed": {
          "area": 23,
          "perimeter": 20,
          "connected": true,
          "holes": false,
          "rectangle": false,
          "unitBoundaryEdges": [
            [
              0,
              0,
              -1,
              0
            ],
            [
              0,
              0,
              0,
              -1
            ],
            [
              0,
              1,
              -1,
              0
            ],
            [
              0,
              2,
              -1,
              0
            ],
            [
              0,
              3,
              -1,
              0
            ],
            [
              0,
              4,
              -1,
              0
            ],
            [
              0,
              4,
              0,
              1
            ],
            [
              1,
              0,
              0,
              -1
            ],
            [
              1,
              4,
              0,
              1
            ],
            [
              2,
              0,
              0,
              -1
            ],
            [
              2,
              4,
              1,
              0
            ],
            [
              2,
              4,
              0,
              1
            ],
            [
              3,
              0,
              0,
              -1
            ],
            [
              3,
              3,
              0,
              1
            ],
            [
              4,
              0,
              1,
              0
            ],
            [
              4,
              0,
              0,
              -1
            ],
            [
              4,
              1,
              1,
              0
            ],
            [
              4,
              2,
              1,
              0
            ],
            [
              4,
              3,
              1,
              0
            ],
            [
              4,
              3,
              0,
              1
            ]
          ]
        }
      },
      "taskHash": "208f1d5af52f7285b5c30f9c387471c665fc9ecf84b5c2262e28a139238e9c3b"
    },
    {
      "id": "polyArea",
      "sessionId": "polyArea",
      "index": 0,
      "nodeId": "mt_i2-QaXbyzB",
      "type": "x-a30-pieces",
      "kind": "pieces",
      "actions": [
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "24"
        },
        {
          "action": "a30-part"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 1
          }
        },
        {
          "field": "part",
          "value": "4"
        },
        {
          "action": "a30-part"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 2
          }
        },
        {
          "field": "part",
          "value": "4"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "32"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "answers.0",
          "value": "32"
        }
      ],
      "answers": [
        "32"
      ],
      "expected": {
        "pieceAreas": [
          "24",
          "4",
          "4"
        ],
        "result": "32",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "1a2f497a2aa1c67db9d36378f0dc332233bc218fba513ca0f9fb85f358cff32d"
    },
    {
      "id": "polyArea",
      "sessionId": "polyArea",
      "index": 1,
      "nodeId": "mt_i2-QaXbyzB",
      "type": "x-a30-pieces",
      "kind": "pieces",
      "actions": [
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "6"
        },
        {
          "action": "a30-part"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 1
          }
        },
        {
          "field": "part",
          "value": "6"
        },
        {
          "action": "a30-part"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 2
          }
        },
        {
          "field": "part",
          "value": "6"
        },
        {
          "action": "a30-part"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 3
          }
        },
        {
          "field": "part",
          "value": "6"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "24"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "pieceAreas": [
          "6",
          "6",
          "6",
          "6"
        ],
        "result": "24",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "8f9ceeab8ed0937a7f7f2d5dceb2321459c23071219af00709fd47f969051cc4"
    },
    {
      "id": "polyArea",
      "sessionId": "polyArea",
      "index": 2,
      "nodeId": "mt_i2-QaXbyzB",
      "type": "x-a30-pieces",
      "kind": "pieces",
      "actions": [
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "96"
        },
        {
          "action": "a30-part"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 1
          }
        },
        {
          "field": "part",
          "value": "12"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "108"
        },
        {
          "field": "unit",
          "value": "m²"
        }
      ],
      "answers": [],
      "expected": {
        "pieceAreas": [
          "96",
          "12"
        ],
        "result": "108",
        "unit": "m²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "b70e98f3e011ab7183a8439a6bf9cbd4c2f0e7c558fd3db65e4c03f814e6516a"
    },
    {
      "id": "circleArea",
      "sessionId": "circleArea",
      "index": 2,
      "nodeId": "mt_svFa6_mjO_",
      "type": "x-a30-circle",
      "kind": "stadium",
      "actions": [
        {
          "action": "a30-unroll"
        },
        {
          "action": "a30-piece",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-piece",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-piece",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "field": "radius",
          "value": "2"
        },
        {
          "field": "diameter",
          "value": "4"
        },
        {
          "field": "perimeter",
          "value": "28.56"
        },
        {
          "field": "area",
          "value": "44.56"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "field": "areaUnit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "parts": {
          "rectangle": "32",
          "eachSemicircle": "157/25"
        },
        "piApproximation": "157/50",
        "radius": "2",
        "diameter": "4",
        "perimeterApprox": "714/25",
        "areaApprox": "1114/25"
      },
      "taskHash": "49e858a2d80cff78ac14e2be6b62f923114ccfcd6409af9c2df7c5fe6ac7efe4"
    },
    {
      "id": "prismFormulas",
      "sessionId": "prismFormulas",
      "index": 0,
      "nodeId": "mt_tAJH5BrpOx",
      "type": "x-a30-pieces",
      "kind": "pieces",
      "actions": [
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "24"
        },
        {
          "action": "a30-part"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 1
          }
        },
        {
          "field": "part",
          "value": "4"
        },
        {
          "action": "a30-part"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 2
          }
        },
        {
          "field": "part",
          "value": "4"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "32"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "answers.0",
          "value": "32"
        }
      ],
      "answers": [
        "32"
      ],
      "expected": {
        "pieceAreas": [
          "24",
          "4",
          "4"
        ],
        "result": "32",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "1a2f497a2aa1c67db9d36378f0dc332233bc218fba513ca0f9fb85f358cff32d"
    },
    {
      "id": "netSurface",
      "sessionId": "netSurface",
      "index": 2,
      "nodeId": "mt_tegkuJA5gM",
      "type": "x-a30-solid",
      "kind": "openbox",
      "actions": [
        {
          "action": "a30-face",
          "data": {
            "index": 0
          }
        },
        {
          "field": "faceValues.0",
          "value": "300"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 1
          }
        },
        {
          "field": "faceValues.1",
          "value": "300"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 2
          }
        },
        {
          "field": "faceValues.2",
          "value": "200"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 3
          }
        },
        {
          "field": "faceValues.3",
          "value": "200"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 5
          }
        },
        {
          "field": "faceValues.5",
          "value": "600"
        },
        {
          "field": "area",
          "value": "1600"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "action": "turn-extra"
        }
      ],
      "answers": [],
      "expected": {
        "independentFaceAreas": [
          "300",
          "300",
          "200",
          "200",
          "600",
          "600"
        ],
        "surface": "1600",
        "base": null,
        "volume": null
      },
      "taskHash": "2758f194e4630ec0c7506d5377f87b046f11c8c2a53ac1ef4fecc121a154bdec"
    }
  ],
  "excludedCases": [
    {
      "id": "gridarea",
      "sessionId": "gridarea",
      "index": 0,
      "nodeId": "mt_6xNmQLzuqm",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-tile",
          "data": {
            "index": 0
          }
        },
        {
          "field": "area",
          "value": "1"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "area": 1,
        "perimeter": 4,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            1,
            0
          ],
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            1
          ],
          [
            0,
            0,
            0,
            -1
          ]
        ]
      },
      "taskHash": "57841e0f8899cbc70e338cf980770c6c12b3cdc17441206db291343e3fa1c85b"
    },
    {
      "id": "gridarea",
      "sessionId": "gridarea",
      "index": 1,
      "nodeId": "mt_6xNmQLzuqm",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-tile",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 3
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 4
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 5
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 6
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 7
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 8
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 9
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 10
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 11
          }
        },
        {
          "field": "area",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "area": 12,
        "perimeter": 14,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            2,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            2,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            2,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            2,
            1,
            0
          ],
          [
            3,
            2,
            0,
            1
          ]
        ]
      },
      "taskHash": "3fa5666f59799e2d95267be6c2c8f218155941a817e0525d19be8fbe8199a4f1"
    },
    {
      "id": "gridarea",
      "sessionId": "gridarea",
      "index": 2,
      "nodeId": "mt_6xNmQLzuqm",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "field": "perimeter",
          "value": "14"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "field": "answers.0",
          "value": "12"
        }
      ],
      "answers": [
        "12"
      ],
      "expected": {
        "area": 12,
        "perimeter": 14,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            2,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            2,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            2,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            2,
            1,
            0
          ],
          [
            3,
            2,
            0,
            1
          ]
        ]
      },
      "taskHash": "79cadc478abf5d9d742c2ff5cd2cb0f090cbbbef9dcd21bc34d5451a1900997f"
    },
    {
      "id": "walkperim",
      "sessionId": "walkperim",
      "index": 0,
      "nodeId": "mt_wE7-Gs9ENL",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "field": "perimeter",
          "value": "10"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "answers": [],
      "expected": {
        "area": 6,
        "perimeter": 10,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            1,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            1,
            0,
            1
          ],
          [
            2,
            0,
            1,
            0
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            1,
            1,
            0
          ],
          [
            2,
            1,
            0,
            1
          ]
        ]
      },
      "taskHash": "4ef7baffa20399fc7b94b2ca71e603182377a7037acfe26da1aa03d0f93eb1b6"
    },
    {
      "id": "walkperim",
      "sessionId": "walkperim",
      "index": 1,
      "nodeId": "mt_wE7-Gs9ENL",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "field": "perimeter",
          "value": "16"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "answers": [],
      "expected": {
        "area": 16,
        "perimeter": 16,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            3,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            3,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            3,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            2,
            1,
            0
          ],
          [
            3,
            3,
            1,
            0
          ],
          [
            3,
            3,
            0,
            1
          ]
        ]
      },
      "taskHash": "a1e0171ff716703a4f99c68ba4a3351240a5c73d8379b7213f662a78d4c9c238"
    },
    {
      "id": "walkperim",
      "sessionId": "walkperim",
      "index": 2,
      "nodeId": "mt_wE7-Gs9ENL",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "field": "perimeter",
          "value": "14"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "field": "answers.0",
          "value": "10"
        }
      ],
      "answers": [
        "10"
      ],
      "expected": {
        "area": 10,
        "perimeter": 14,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            1,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            1,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            1,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            0,
            1
          ],
          [
            4,
            0,
            1,
            0
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            1,
            1,
            0
          ],
          [
            4,
            1,
            0,
            1
          ]
        ]
      },
      "taskHash": "e9d3d665e1750475200dfc47a32a86a578ef9397979326cb35047bf4c03c7f41"
    },
    {
      "id": "polyperim",
      "sessionId": "polyperim",
      "index": 0,
      "nodeId": "mt_WtcFrxGOgw",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "field": "perimeter",
          "value": "26"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "answers": [],
      "expected": {
        "area": 40,
        "perimeter": 26,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            4,
            -1,
            0
          ],
          [
            0,
            4,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            4,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            4,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            4,
            0,
            1
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            4,
            0,
            1
          ],
          [
            5,
            0,
            0,
            -1
          ],
          [
            5,
            4,
            0,
            1
          ],
          [
            6,
            0,
            0,
            -1
          ],
          [
            6,
            4,
            0,
            1
          ],
          [
            7,
            0,
            1,
            0
          ],
          [
            7,
            0,
            0,
            -1
          ],
          [
            7,
            1,
            1,
            0
          ],
          [
            7,
            2,
            1,
            0
          ],
          [
            7,
            3,
            1,
            0
          ],
          [
            7,
            4,
            1,
            0
          ],
          [
            7,
            4,
            0,
            1
          ]
        ]
      },
      "taskHash": "3d67e040b458696577c6cfbbe4511d065ad96e6d629a6487d330fabff2735bfe"
    },
    {
      "id": "polyperim",
      "sessionId": "polyperim",
      "index": 1,
      "nodeId": "mt_WtcFrxGOgw",
      "type": "x-a30-outline",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 4
          }
        },
        {
          "field": "answer",
          "value": "5"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "answers": [],
      "expected": {
        "edgeLengths": [
          10,
          3,
          5,
          6,
          6
        ],
        "perimeter": 30,
        "unknownIndex": 2,
        "unknownLength": 5
      },
      "taskHash": "92097f613b8253048d4001488489ea6ab84782e7616023a09a29e7d97c127e2f"
    },
    {
      "id": "lperim",
      "sessionId": "lperim",
      "index": 0,
      "nodeId": "mt_n0AlyLQwC9",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 4
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 5
          }
        },
        {
          "field": "perimeter",
          "value": "20"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "field": "answers.0",
          "value": "2"
        }
      ],
      "answers": [
        "2"
      ],
      "expected": {
        "area": 20,
        "perimeter": 20,
        "connected": true,
        "holes": false,
        "rectangle": false,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            3,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            3,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            3,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            3,
            0,
            1
          ],
          [
            4,
            2,
            0,
            -1
          ],
          [
            4,
            3,
            0,
            1
          ],
          [
            5,
            2,
            1,
            0
          ],
          [
            5,
            2,
            0,
            -1
          ],
          [
            5,
            3,
            1,
            0
          ],
          [
            5,
            3,
            0,
            1
          ]
        ]
      },
      "taskHash": "a3dd7219b85e391ee9299e84cf87d874a6cb5ddb14b9a04890f5ecb12d0d9117"
    },
    {
      "id": "lperim",
      "sessionId": "lperim",
      "index": 1,
      "nodeId": "mt_n0AlyLQwC9",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 4
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 5
          }
        },
        {
          "field": "perimeter",
          "value": "20"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "answers": [],
      "expected": {
        "area": 23,
        "perimeter": 20,
        "connected": true,
        "holes": false,
        "rectangle": false,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            4,
            -1,
            0
          ],
          [
            0,
            4,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            4,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            4,
            1,
            0
          ],
          [
            2,
            4,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            3,
            0,
            1
          ],
          [
            4,
            0,
            1,
            0
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            1,
            1,
            0
          ],
          [
            4,
            2,
            1,
            0
          ],
          [
            4,
            3,
            1,
            0
          ],
          [
            4,
            3,
            0,
            1
          ]
        ]
      },
      "taskHash": "1ebd24e74d3a518c2661cee4304e7216c2ff40c3110bda35871ef09de613c4f1"
    },
    {
      "id": "triArea",
      "sessionId": "triArea",
      "index": 0,
      "nodeId": "mt_ML5t7n2-U8",
      "type": "x-a30-pieces",
      "kind": null,
      "actions": [
        {
          "action": "a30-transform"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "40"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "40"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "pieceAreas": [
          "40"
        ],
        "result": "40",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "7a17ee9b9ddd64cc09fa9a37233c2330f5ef6fca8bd02acc5c624a142b21f08a"
    },
    {
      "id": "triArea",
      "sessionId": "triArea",
      "index": 1,
      "nodeId": "mt_ML5t7n2-U8",
      "type": "x-a30-pieces",
      "kind": null,
      "actions": [
        {
          "action": "a30-transform"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "12"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "pieceAreas": [
          "12"
        ],
        "result": "12",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "4c251647ce099b40fab52372a2cd36cc3bfb39008133ae3186be5cb41e405460"
    },
    {
      "id": "triArea",
      "sessionId": "triArea",
      "index": 2,
      "nodeId": "mt_ML5t7n2-U8",
      "type": "x-a30-pieces",
      "kind": null,
      "actions": [
        {
          "action": "a30-transform"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "42"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "42"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "answers.0",
          "value": "height"
        }
      ],
      "answers": [
        "height"
      ],
      "expected": {
        "pieceAreas": [
          "42"
        ],
        "result": "42",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "9a3a89d8e0547c2a7e48891b90d96640868f1f7fada2fe914568e503f309fc4d"
    },
    {
      "id": "triArea",
      "sessionId": "triArea",
      "index": 3,
      "nodeId": "mt_ML5t7n2-U8",
      "type": "x-a30-pieces",
      "kind": null,
      "actions": [
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "50"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "50"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "answers.0",
          "value": "estimate"
        }
      ],
      "answers": [
        "estimate"
      ],
      "expected": {
        "pieceAreas": [
          "50"
        ],
        "result": "50",
        "unit": "cm²",
        "sourceCoordinatesIntegral": false
      },
      "taskHash": "57144f49f061ebf92b2707c87cf2622595d054d1f6f3eaf5c2170519df52f2f3"
    },
    {
      "id": "circleArea",
      "sessionId": "circleArea",
      "index": 0,
      "nodeId": "mt_svFa6_mjO_",
      "type": "x-a30-circle",
      "kind": null,
      "actions": [
        {
          "action": "a30-unroll"
        },
        {
          "field": "radius",
          "value": "3"
        },
        {
          "field": "diameter",
          "value": "6"
        },
        {
          "field": "perimeter",
          "value": "18.84"
        },
        {
          "field": "area",
          "value": "28.26"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "field": "areaUnit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "piApproximation": "157/50",
        "radius": "3",
        "diameter": "6",
        "perimeterApprox": "471/25",
        "areaApprox": "1413/50"
      },
      "taskHash": "d4337d22d2b3931c72f707f10c1f81173f76d0c9f39d917084c5860e02c21d4f"
    },
    {
      "id": "circleArea",
      "sessionId": "circleArea",
      "index": 1,
      "nodeId": "mt_svFa6_mjO_",
      "type": "x-a30-circle",
      "kind": null,
      "actions": [
        {
          "action": "a30-unroll"
        },
        {
          "field": "radius",
          "value": "4"
        },
        {
          "field": "diameter",
          "value": "8"
        },
        {
          "field": "perimeter",
          "value": "25.12"
        },
        {
          "field": "area",
          "value": "50.24"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "field": "areaUnit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "piApproximation": "157/50",
        "radius": "4",
        "diameter": "8",
        "perimeterApprox": "628/25",
        "areaApprox": "1256/25"
      },
      "taskHash": "6cbbc5ad977abcdfd0354b495423620dff42ff4f436523f2fa1547d347a88c9b"
    },
    {
      "id": "prismFormulas",
      "sessionId": "prismFormulas",
      "index": 1,
      "nodeId": "mt_tAJH5BrpOx",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "field": "base",
          "value": "6"
        },
        {
          "field": "volume",
          "value": "60"
        },
        {
          "field": "volumeUnit",
          "value": "cm³"
        },
        {
          "action": "turn-extra"
        }
      ],
      "answers": [],
      "expected": {
        "independentFaceAreas": [
          "6",
          "6",
          "40",
          "30",
          "50"
        ],
        "surface": "132",
        "base": "6",
        "volume": "60"
      },
      "taskHash": "b45dd74041a96817e559de29fb8f90db76a62cf9f1df86a0c2174b98b983bf44"
    },
    {
      "id": "prismFormulas",
      "sessionId": "prismFormulas",
      "index": 2,
      "nodeId": "mt_tAJH5BrpOx",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "field": "base",
          "value": "12.56"
        },
        {
          "field": "volume",
          "value": "50.24"
        },
        {
          "field": "volumeUnit",
          "value": "cm³"
        },
        {
          "action": "turn-extra"
        },
        {
          "field": "answers.0",
          "value": "base"
        }
      ],
      "answers": [
        "base"
      ],
      "expected": {
        "independentFaceAreas": [],
        "surface": null,
        "base": "314/25",
        "volume": "1256/25"
      },
      "taskHash": "8e254d6e19b42c3b5f83d51e2d0efe858589bcec2bb74cc26945236f63c6c427"
    },
    {
      "id": "netSurface",
      "sessionId": "netSurface",
      "index": 0,
      "nodeId": "mt_tegkuJA5gM",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "action": "a30-face",
          "data": {
            "index": 0
          }
        },
        {
          "field": "faceValues.0",
          "value": "15"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 1
          }
        },
        {
          "field": "faceValues.1",
          "value": "15"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 2
          }
        },
        {
          "field": "faceValues.2",
          "value": "12"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 3
          }
        },
        {
          "field": "faceValues.3",
          "value": "12"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 4
          }
        },
        {
          "field": "faceValues.4",
          "value": "20"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 5
          }
        },
        {
          "field": "faceValues.5",
          "value": "20"
        },
        {
          "field": "area",
          "value": "94"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "action": "turn-extra"
        }
      ],
      "answers": [],
      "expected": {
        "independentFaceAreas": [
          "15",
          "15",
          "12",
          "12",
          "20",
          "20"
        ],
        "surface": "94",
        "base": null,
        "volume": null
      },
      "taskHash": "615c0f44811c01763437d44c711822f7304e6d3447d5de01f9f5bfe2f98ecef4"
    },
    {
      "id": "netSurface",
      "sessionId": "netSurface",
      "index": 1,
      "nodeId": "mt_tegkuJA5gM",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "action": "a30-face",
          "data": {
            "index": 0
          }
        },
        {
          "field": "faceValues.0",
          "value": "36"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 1
          }
        },
        {
          "field": "faceValues.1",
          "value": "15"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 2
          }
        },
        {
          "field": "faceValues.2",
          "value": "15"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 3
          }
        },
        {
          "field": "faceValues.3",
          "value": "15"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 4
          }
        },
        {
          "field": "faceValues.4",
          "value": "15"
        },
        {
          "field": "area",
          "value": "96"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "action": "turn-extra"
        }
      ],
      "answers": [],
      "expected": {
        "independentFaceAreas": [
          "36",
          "15",
          "15",
          "15",
          "15"
        ],
        "surface": "96",
        "base": null,
        "volume": null
      },
      "taskHash": "8e8751bc6a4ffa9743447cab900d0b8282d8dd258c6d5adb9f8d13a757cf06a3"
    },
    {
      "id": "solidSurface",
      "sessionId": "solidSurface",
      "index": 0,
      "nodeId": "mt_Sij9ByyHq6",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "action": "a30-face",
          "data": {
            "index": 0
          }
        },
        {
          "field": "faceValues.0",
          "value": "6"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 1
          }
        },
        {
          "field": "faceValues.1",
          "value": "6"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 2
          }
        },
        {
          "field": "faceValues.2",
          "value": "40"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 3
          }
        },
        {
          "field": "faceValues.3",
          "value": "30"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 4
          }
        },
        {
          "field": "faceValues.4",
          "value": "50"
        },
        {
          "field": "area",
          "value": "132"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "base",
          "value": "6"
        },
        {
          "field": "volume",
          "value": "60"
        },
        {
          "field": "volumeUnit",
          "value": "cm³"
        },
        {
          "action": "turn-extra"
        }
      ],
      "answers": [],
      "expected": {
        "independentFaceAreas": [
          "6",
          "6",
          "40",
          "30",
          "50"
        ],
        "surface": "132",
        "base": "6",
        "volume": "60"
      },
      "taskHash": "b12960f77dff3c1471cb18cf98d497c17b8a6cdb478c2750b935d856cbcde93e"
    },
    {
      "id": "solidSurface",
      "sessionId": "solidSurface",
      "index": 1,
      "nodeId": "mt_Sij9ByyHq6",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "action": "a30-split"
        },
        {
          "action": "a30-split"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 0
          }
        },
        {
          "field": "faceValues.0",
          "value": "16"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 1
          }
        },
        {
          "field": "faceValues.1",
          "value": "32"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 2
          }
        },
        {
          "field": "faceValues.2",
          "value": "12"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 3
          }
        },
        {
          "field": "faceValues.3",
          "value": "4"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 4
          }
        },
        {
          "field": "faceValues.4",
          "value": "16"
        },
        {
          "field": "area",
          "value": "80"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "volume",
          "value": "40"
        },
        {
          "field": "volumeUnit",
          "value": "cm³"
        },
        {
          "field": "calcValues.0",
          "value": "32"
        },
        {
          "field": "calcValues.1",
          "value": "8"
        },
        {
          "action": "turn-extra"
        },
        {
          "field": "answers.0",
          "value": "88"
        },
        {
          "field": "answers.1",
          "value": "8"
        }
      ],
      "answers": [
        "88",
        "8"
      ],
      "expected": {
        "separateSurface": 88,
        "hiddenContactArea": 8,
        "volumes": [
          32,
          8
        ],
        "faceEntriesAreGroups": true,
        "contactFacesSelectable": false,
        "independentFaceAreas": [
          "16",
          "32",
          "12",
          "4",
          "16"
        ],
        "surface": "80",
        "base": null,
        "volume": "40"
      },
      "taskHash": "970821d3a492aa3c68cf9ed73f66707a082c8bd5758f8f2f864350bb5f544e10"
    },
    {
      "id": "solidSurface",
      "sessionId": "solidSurface",
      "index": 2,
      "nodeId": "mt_Sij9ByyHq6",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "field": "base",
          "value": "6"
        },
        {
          "field": "volume",
          "value": "3"
        },
        {
          "field": "volumeUnit",
          "value": "m³"
        },
        {
          "field": "calcValues.0",
          "value": "3"
        },
        {
          "field": "calcValues.1",
          "value": "3"
        },
        {
          "action": "turn-extra"
        },
        {
          "field": "answers.0",
          "value": "surface"
        }
      ],
      "answers": [
        "surface"
      ],
      "expected": {
        "componentBaseAreas": [
          3,
          3
        ],
        "independentFaceAreas": [],
        "surface": null,
        "base": "6",
        "volume": "3"
      },
      "taskHash": "135458801b6c73fe3e3d3e7986a091a148f7ca04dd4d6c3a28175a6b965764ae"
    },
    {
      "id": "term38",
      "sessionId": "term38",
      "index": 2,
      "nodeId": "mt_xfwv0M83mJ",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-tile",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 3
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 4
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 5
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 6
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 7
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 8
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 9
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 10
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 11
          }
        },
        {
          "field": "area",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "area": 12,
        "perimeter": 14,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            2,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            2,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            2,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            2,
            1,
            0
          ],
          [
            3,
            2,
            0,
            1
          ]
        ]
      },
      "taskHash": "3fa5666f59799e2d95267be6c2c8f218155941a817e0525d19be8fbe8199a4f1"
    },
    {
      "id": "multiShape38",
      "sessionId": "multiShape38",
      "index": 1,
      "nodeId": "mt_SmghasIvbT",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "field": "perimeter",
          "value": "26"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "answers": [],
      "expected": {
        "area": 40,
        "perimeter": 26,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            4,
            -1,
            0
          ],
          [
            0,
            4,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            4,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            4,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            4,
            0,
            1
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            4,
            0,
            1
          ],
          [
            5,
            0,
            0,
            -1
          ],
          [
            5,
            4,
            0,
            1
          ],
          [
            6,
            0,
            0,
            -1
          ],
          [
            6,
            4,
            0,
            1
          ],
          [
            7,
            0,
            1,
            0
          ],
          [
            7,
            0,
            0,
            -1
          ],
          [
            7,
            1,
            1,
            0
          ],
          [
            7,
            2,
            1,
            0
          ],
          [
            7,
            3,
            1,
            0
          ],
          [
            7,
            4,
            1,
            0
          ],
          [
            7,
            4,
            0,
            1
          ]
        ]
      },
      "taskHash": "3d67e040b458696577c6cfbbe4511d065ad96e6d629a6487d330fabff2735bfe"
    },
    {
      "id": "tools39",
      "sessionId": "tools39",
      "index": 4,
      "nodeId": "mt_d-WZC2OyMB",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-tile",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 3
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 4
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 5
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 6
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 7
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 8
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 9
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 10
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 11
          }
        },
        {
          "field": "area",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "area": 12,
        "perimeter": 14,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            2,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            2,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            2,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            2,
            1,
            0
          ],
          [
            3,
            2,
            0,
            1
          ]
        ]
      },
      "taskHash": "7c37b29b279d35bfde133133fd8dc5203216ed2073c879ecf9ee8aa501e53dcb"
    }
  ],
  "associatedCases": [
    {
      "id": "link-lengthtools-gridarea",
      "sessionId": "link-lengthtools-gridarea",
      "index": 1,
      "nodeId": "mt_6xNmQLzuqm",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-tile",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 3
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 4
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 5
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 6
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 7
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 8
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 9
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 10
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 11
          }
        },
        {
          "field": "area",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "area": 12,
        "perimeter": 14,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            2,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            2,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            2,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            2,
            1,
            0
          ],
          [
            3,
            2,
            0,
            1
          ]
        ]
      },
      "taskHash": "3fa5666f59799e2d95267be6c2c8f218155941a817e0525d19be8fbe8199a4f1"
    },
    {
      "id": "link-rectangle-areadistrib",
      "sessionId": "link-rectangle-areadistrib",
      "index": 1,
      "nodeId": "mt_AQo4u7O4sM",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-corner",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 15
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 4
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 17
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "field": "area",
          "value": "18"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "answers.0",
          "value": "12"
        },
        {
          "field": "answers.1",
          "value": "6"
        }
      ],
      "answers": [
        "12",
        "6"
      ],
      "expected": {
        "area": 18,
        "perimeter": 18,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            2,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            2,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            2,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            2,
            0,
            1
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            2,
            0,
            1
          ],
          [
            5,
            0,
            1,
            0
          ],
          [
            5,
            0,
            0,
            -1
          ],
          [
            5,
            1,
            1,
            0
          ],
          [
            5,
            2,
            1,
            0
          ],
          [
            5,
            2,
            0,
            1
          ]
        ],
        "independentRectangles": [
          [
            0,
            0,
            4,
            3
          ],
          [
            4,
            0,
            2,
            3
          ]
        ],
        "constructed": {
          "area": 18,
          "perimeter": 18,
          "connected": true,
          "holes": false,
          "rectangle": true,
          "unitBoundaryEdges": [
            [
              0,
              0,
              -1,
              0
            ],
            [
              0,
              0,
              0,
              -1
            ],
            [
              0,
              1,
              -1,
              0
            ],
            [
              0,
              2,
              -1,
              0
            ],
            [
              0,
              2,
              0,
              1
            ],
            [
              1,
              0,
              0,
              -1
            ],
            [
              1,
              2,
              0,
              1
            ],
            [
              2,
              0,
              0,
              -1
            ],
            [
              2,
              2,
              0,
              1
            ],
            [
              3,
              0,
              0,
              -1
            ],
            [
              3,
              2,
              0,
              1
            ],
            [
              4,
              0,
              0,
              -1
            ],
            [
              4,
              2,
              0,
              1
            ],
            [
              5,
              0,
              1,
              0
            ],
            [
              5,
              0,
              0,
              -1
            ],
            [
              5,
              1,
              1,
              0
            ],
            [
              5,
              2,
              1,
              0
            ],
            [
              5,
              2,
              0,
              1
            ]
          ]
        }
      },
      "taskHash": "b83d0a1b83d3f74ea84cfaf36c46db3585943e6a31f9e5c5ee23a307e052d1f9"
    },
    {
      "id": "link-areadistrib-translateamount",
      "sessionId": "link-areadistrib-translateamount",
      "index": 0,
      "nodeId": "mt_3VmBdlAeOZ",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-corner",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 74
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 10
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 77
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "field": "area",
          "value": "78"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "answers.0",
          "value": "60"
        },
        {
          "field": "answers.1",
          "value": "18"
        }
      ],
      "answers": [
        "60",
        "18"
      ],
      "expected": {
        "area": 78,
        "perimeter": 38,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            4,
            -1,
            0
          ],
          [
            0,
            5,
            -1,
            0
          ],
          [
            0,
            5,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            5,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            5,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            5,
            0,
            1
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            5,
            0,
            1
          ],
          [
            5,
            0,
            0,
            -1
          ],
          [
            5,
            5,
            0,
            1
          ],
          [
            6,
            0,
            0,
            -1
          ],
          [
            6,
            5,
            0,
            1
          ],
          [
            7,
            0,
            0,
            -1
          ],
          [
            7,
            5,
            0,
            1
          ],
          [
            8,
            0,
            0,
            -1
          ],
          [
            8,
            5,
            0,
            1
          ],
          [
            9,
            0,
            0,
            -1
          ],
          [
            9,
            5,
            0,
            1
          ],
          [
            10,
            0,
            0,
            -1
          ],
          [
            10,
            5,
            0,
            1
          ],
          [
            11,
            0,
            0,
            -1
          ],
          [
            11,
            5,
            0,
            1
          ],
          [
            12,
            0,
            1,
            0
          ],
          [
            12,
            0,
            0,
            -1
          ],
          [
            12,
            1,
            1,
            0
          ],
          [
            12,
            2,
            1,
            0
          ],
          [
            12,
            3,
            1,
            0
          ],
          [
            12,
            4,
            1,
            0
          ],
          [
            12,
            5,
            1,
            0
          ],
          [
            12,
            5,
            0,
            1
          ]
        ],
        "independentRectangles": [
          [
            0,
            0,
            10,
            6
          ],
          [
            10,
            0,
            3,
            6
          ]
        ],
        "constructed": {
          "area": 78,
          "perimeter": 38,
          "connected": true,
          "holes": false,
          "rectangle": true,
          "unitBoundaryEdges": [
            [
              0,
              0,
              -1,
              0
            ],
            [
              0,
              0,
              0,
              -1
            ],
            [
              0,
              1,
              -1,
              0
            ],
            [
              0,
              2,
              -1,
              0
            ],
            [
              0,
              3,
              -1,
              0
            ],
            [
              0,
              4,
              -1,
              0
            ],
            [
              0,
              5,
              -1,
              0
            ],
            [
              0,
              5,
              0,
              1
            ],
            [
              1,
              0,
              0,
              -1
            ],
            [
              1,
              5,
              0,
              1
            ],
            [
              2,
              0,
              0,
              -1
            ],
            [
              2,
              5,
              0,
              1
            ],
            [
              3,
              0,
              0,
              -1
            ],
            [
              3,
              5,
              0,
              1
            ],
            [
              4,
              0,
              0,
              -1
            ],
            [
              4,
              5,
              0,
              1
            ],
            [
              5,
              0,
              0,
              -1
            ],
            [
              5,
              5,
              0,
              1
            ],
            [
              6,
              0,
              0,
              -1
            ],
            [
              6,
              5,
              0,
              1
            ],
            [
              7,
              0,
              0,
              -1
            ],
            [
              7,
              5,
              0,
              1
            ],
            [
              8,
              0,
              0,
              -1
            ],
            [
              8,
              5,
              0,
              1
            ],
            [
              9,
              0,
              0,
              -1
            ],
            [
              9,
              5,
              0,
              1
            ],
            [
              10,
              0,
              0,
              -1
            ],
            [
              10,
              5,
              0,
              1
            ],
            [
              11,
              0,
              0,
              -1
            ],
            [
              11,
              5,
              0,
              1
            ],
            [
              12,
              0,
              1,
              0
            ],
            [
              12,
              0,
              0,
              -1
            ],
            [
              12,
              1,
              1,
              0
            ],
            [
              12,
              2,
              1,
              0
            ],
            [
              12,
              3,
              1,
              0
            ],
            [
              12,
              4,
              1,
              0
            ],
            [
              12,
              5,
              1,
              0
            ],
            [
              12,
              5,
              0,
              1
            ]
          ]
        }
      },
      "taskHash": "a1032ca20ff3a5385b0f469219e6f00fbbfea81e76b8e89ef55e37e66fc778fc"
    },
    {
      "id": "link-gridarea-area",
      "sessionId": "link-gridarea-area",
      "index": 0,
      "nodeId": "mt_y1n0Zwhoca",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-tile",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 3
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 4
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 5
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 6
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 7
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 8
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 9
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 10
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 11
          }
        },
        {
          "field": "area",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "area": 12,
        "perimeter": 14,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            2,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            2,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            2,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            2,
            1,
            0
          ],
          [
            3,
            2,
            0,
            1
          ]
        ]
      },
      "taskHash": "3fa5666f59799e2d95267be6c2c8f218155941a817e0525d19be8fbe8199a4f1"
    },
    {
      "id": "link-measurecalc-walkperim",
      "sessionId": "link-measurecalc-walkperim",
      "index": 1,
      "nodeId": "mt_wE7-Gs9ENL",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "field": "perimeter",
          "value": "10"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "answers": [],
      "expected": {
        "area": 6,
        "perimeter": 10,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            1,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            1,
            0,
            1
          ],
          [
            2,
            0,
            1,
            0
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            1,
            1,
            0
          ],
          [
            2,
            1,
            0,
            1
          ]
        ]
      },
      "taskHash": "4ef7baffa20399fc7b94b2ca71e603182377a7037acfe26da1aa03d0f93eb1b6"
    },
    {
      "id": "link-sidesfold-walkperim",
      "sessionId": "link-sidesfold-walkperim",
      "index": 1,
      "nodeId": "mt_wE7-Gs9ENL",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "field": "perimeter",
          "value": "16"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "answers": [],
      "expected": {
        "area": 16,
        "perimeter": 16,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            3,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            3,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            3,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            2,
            1,
            0
          ],
          [
            3,
            3,
            1,
            0
          ],
          [
            3,
            3,
            0,
            1
          ]
        ]
      },
      "taskHash": "a1e0171ff716703a4f99c68ba4a3351240a5c73d8379b7213f662a78d4c9c238"
    },
    {
      "id": "link-walkperim-polyperim",
      "sessionId": "link-walkperim-polyperim",
      "index": 0,
      "nodeId": "mt_WtcFrxGOgw",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "field": "perimeter",
          "value": "10"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "answers": [],
      "expected": {
        "area": 6,
        "perimeter": 10,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            1,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            1,
            0,
            1
          ],
          [
            2,
            0,
            1,
            0
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            1,
            1,
            0
          ],
          [
            2,
            1,
            0,
            1
          ]
        ]
      },
      "taskHash": "4ef7baffa20399fc7b94b2ca71e603182377a7037acfe26da1aa03d0f93eb1b6"
    },
    {
      "id": "link-walkperim-polyperim",
      "sessionId": "link-walkperim-polyperim",
      "index": 1,
      "nodeId": "mt_WtcFrxGOgw",
      "type": "x-a30-outline",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 4
          }
        },
        {
          "field": "answer",
          "value": "5"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "answers": [],
      "expected": {
        "edgeLengths": [
          10,
          3,
          5,
          6,
          6
        ],
        "perimeter": 30,
        "unknownIndex": 2,
        "unknownLength": 5
      },
      "taskHash": "92097f613b8253048d4001488489ea6ab84782e7616023a09a29e7d97c127e2f"
    },
    {
      "id": "link-rectangle-polyperim",
      "sessionId": "link-rectangle-polyperim",
      "index": 1,
      "nodeId": "mt_WtcFrxGOgw",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "field": "perimeter",
          "value": "26"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "answers": [],
      "expected": {
        "area": 40,
        "perimeter": 26,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            4,
            -1,
            0
          ],
          [
            0,
            4,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            4,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            4,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            4,
            0,
            1
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            4,
            0,
            1
          ],
          [
            5,
            0,
            0,
            -1
          ],
          [
            5,
            4,
            0,
            1
          ],
          [
            6,
            0,
            0,
            -1
          ],
          [
            6,
            4,
            0,
            1
          ],
          [
            7,
            0,
            1,
            0
          ],
          [
            7,
            0,
            0,
            -1
          ],
          [
            7,
            1,
            1,
            0
          ],
          [
            7,
            2,
            1,
            0
          ],
          [
            7,
            3,
            1,
            0
          ],
          [
            7,
            4,
            1,
            0
          ],
          [
            7,
            4,
            0,
            1
          ]
        ]
      },
      "taskHash": "3d67e040b458696577c6cfbbe4511d065ad96e6d629a6487d330fabff2735bfe"
    },
    {
      "id": "link-polyperim-boundary",
      "sessionId": "link-polyperim-boundary",
      "index": 0,
      "nodeId": "mt_eiB3-6pu6a",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "field": "perimeter",
          "value": "26"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "answers": [],
      "expected": {
        "area": 40,
        "perimeter": 26,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            4,
            -1,
            0
          ],
          [
            0,
            4,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            4,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            4,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            4,
            0,
            1
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            4,
            0,
            1
          ],
          [
            5,
            0,
            0,
            -1
          ],
          [
            5,
            4,
            0,
            1
          ],
          [
            6,
            0,
            0,
            -1
          ],
          [
            6,
            4,
            0,
            1
          ],
          [
            7,
            0,
            1,
            0
          ],
          [
            7,
            0,
            0,
            -1
          ],
          [
            7,
            1,
            1,
            0
          ],
          [
            7,
            2,
            1,
            0
          ],
          [
            7,
            3,
            1,
            0
          ],
          [
            7,
            4,
            1,
            0
          ],
          [
            7,
            4,
            0,
            1
          ]
        ]
      },
      "taskHash": "3d67e040b458696577c6cfbbe4511d065ad96e6d629a6487d330fabff2735bfe"
    },
    {
      "id": "link-polyperim-lperim",
      "sessionId": "link-polyperim-lperim",
      "index": 0,
      "nodeId": "mt_n0AlyLQwC9",
      "type": "x-a30-outline",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 4
          }
        },
        {
          "field": "answer",
          "value": "5"
        },
        {
          "field": "unit",
          "value": "cm"
        }
      ],
      "answers": [],
      "expected": {
        "edgeLengths": [
          10,
          3,
          5,
          6,
          6
        ],
        "perimeter": 30,
        "unknownIndex": 2,
        "unknownLength": 5
      },
      "taskHash": "92097f613b8253048d4001488489ea6ab84782e7616023a09a29e7d97c127e2f"
    },
    {
      "id": "link-polyperim-lperim",
      "sessionId": "link-polyperim-lperim",
      "index": 1,
      "nodeId": "mt_n0AlyLQwC9",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 4
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 5
          }
        },
        {
          "field": "perimeter",
          "value": "20"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "field": "answers.0",
          "value": "2"
        }
      ],
      "answers": [
        "2"
      ],
      "expected": {
        "area": 20,
        "perimeter": 20,
        "connected": true,
        "holes": false,
        "rectangle": false,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            3,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            3,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            3,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            3,
            0,
            1
          ],
          [
            4,
            2,
            0,
            -1
          ],
          [
            4,
            3,
            0,
            1
          ],
          [
            5,
            2,
            1,
            0
          ],
          [
            5,
            2,
            0,
            -1
          ],
          [
            5,
            3,
            1,
            0
          ],
          [
            5,
            3,
            0,
            1
          ]
        ]
      },
      "taskHash": "a3dd7219b85e391ee9299e84cf87d874a6cb5ddb14b9a04890f5ecb12d0d9117"
    },
    {
      "id": "link-rectsplit-lperim",
      "sessionId": "link-rectsplit-lperim",
      "index": 0,
      "nodeId": "mt_n0AlyLQwC9",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-corner",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 21
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 16
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 23
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "field": "area",
          "value": "20"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "area": 20,
        "perimeter": 20,
        "connected": true,
        "holes": false,
        "rectangle": false,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            3,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            3,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            3,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            3,
            0,
            1
          ],
          [
            4,
            2,
            0,
            -1
          ],
          [
            4,
            3,
            0,
            1
          ],
          [
            5,
            2,
            1,
            0
          ],
          [
            5,
            2,
            0,
            -1
          ],
          [
            5,
            3,
            1,
            0
          ],
          [
            5,
            3,
            0,
            1
          ]
        ],
        "independentRectangles": [
          [
            0,
            0,
            4,
            4
          ],
          [
            4,
            2,
            2,
            2
          ]
        ],
        "constructed": {
          "area": 20,
          "perimeter": 20,
          "connected": true,
          "holes": false,
          "rectangle": false,
          "unitBoundaryEdges": [
            [
              0,
              0,
              -1,
              0
            ],
            [
              0,
              0,
              0,
              -1
            ],
            [
              0,
              1,
              -1,
              0
            ],
            [
              0,
              2,
              -1,
              0
            ],
            [
              0,
              3,
              -1,
              0
            ],
            [
              0,
              3,
              0,
              1
            ],
            [
              1,
              0,
              0,
              -1
            ],
            [
              1,
              3,
              0,
              1
            ],
            [
              2,
              0,
              0,
              -1
            ],
            [
              2,
              3,
              0,
              1
            ],
            [
              3,
              0,
              1,
              0
            ],
            [
              3,
              0,
              0,
              -1
            ],
            [
              3,
              1,
              1,
              0
            ],
            [
              3,
              3,
              0,
              1
            ],
            [
              4,
              2,
              0,
              -1
            ],
            [
              4,
              3,
              0,
              1
            ],
            [
              5,
              2,
              1,
              0
            ],
            [
              5,
              2,
              0,
              -1
            ],
            [
              5,
              3,
              1,
              0
            ],
            [
              5,
              3,
              0,
              1
            ]
          ]
        }
      },
      "taskHash": "bb73bec69dc226206781a0eab03487b7a594538b0a0ecb80026a857939479d08"
    },
    {
      "id": "link-rectsplit-lperim",
      "sessionId": "link-rectsplit-lperim",
      "index": 1,
      "nodeId": "mt_n0AlyLQwC9",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-edge",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 3
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 4
          }
        },
        {
          "action": "a30-edge",
          "data": {
            "index": 5
          }
        },
        {
          "field": "perimeter",
          "value": "20"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "field": "answers.0",
          "value": "2"
        }
      ],
      "answers": [
        "2"
      ],
      "expected": {
        "area": 20,
        "perimeter": 20,
        "connected": true,
        "holes": false,
        "rectangle": false,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            3,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            3,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            3,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            3,
            0,
            1
          ],
          [
            4,
            2,
            0,
            -1
          ],
          [
            4,
            3,
            0,
            1
          ],
          [
            5,
            2,
            1,
            0
          ],
          [
            5,
            2,
            0,
            -1
          ],
          [
            5,
            3,
            1,
            0
          ],
          [
            5,
            3,
            0,
            1
          ]
        ]
      },
      "taskHash": "a3dd7219b85e391ee9299e84cf87d874a6cb5ddb14b9a04890f5ecb12d0d9117"
    },
    {
      "id": "link-boundary-areaPerim",
      "sessionId": "link-boundary-areaPerim",
      "index": 1,
      "nodeId": "mt_MJZA90uc6H",
      "type": "x-a30-compare",
      "kind": null,
      "actions": [
        {
          "field": "w1",
          "value": "2"
        },
        {
          "field": "h1",
          "value": "12"
        },
        {
          "field": "w2",
          "value": "3"
        },
        {
          "field": "h2",
          "value": "8"
        },
        {
          "action": "a30-build"
        }
      ],
      "answers": [],
      "expected": {
        "allOrderedIntegerDimensionSolutions": 24,
        "independentDimensions": [
          2,
          12,
          3,
          8
        ],
        "areas": [
          24,
          24
        ],
        "perimeters": [
          28,
          22
        ]
      },
      "taskHash": "74a57e77e6dbc5c42c2b0622456dfc5254eaa9cbee12815cc18d0d07fc1b05e2"
    },
    {
      "id": "link-rectangle-rectsplit",
      "sessionId": "link-rectangle-rectsplit",
      "index": 1,
      "nodeId": "mt_eMtV6tBSJm",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-corner",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 21
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 16
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 23
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "field": "area",
          "value": "20"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "area": 20,
        "perimeter": 20,
        "connected": true,
        "holes": false,
        "rectangle": false,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            3,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            3,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            3,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            3,
            0,
            1
          ],
          [
            4,
            2,
            0,
            -1
          ],
          [
            4,
            3,
            0,
            1
          ],
          [
            5,
            2,
            1,
            0
          ],
          [
            5,
            2,
            0,
            -1
          ],
          [
            5,
            3,
            1,
            0
          ],
          [
            5,
            3,
            0,
            1
          ]
        ],
        "independentRectangles": [
          [
            0,
            0,
            4,
            4
          ],
          [
            4,
            2,
            2,
            2
          ]
        ],
        "constructed": {
          "area": 20,
          "perimeter": 20,
          "connected": true,
          "holes": false,
          "rectangle": false,
          "unitBoundaryEdges": [
            [
              0,
              0,
              -1,
              0
            ],
            [
              0,
              0,
              0,
              -1
            ],
            [
              0,
              1,
              -1,
              0
            ],
            [
              0,
              2,
              -1,
              0
            ],
            [
              0,
              3,
              -1,
              0
            ],
            [
              0,
              3,
              0,
              1
            ],
            [
              1,
              0,
              0,
              -1
            ],
            [
              1,
              3,
              0,
              1
            ],
            [
              2,
              0,
              0,
              -1
            ],
            [
              2,
              3,
              0,
              1
            ],
            [
              3,
              0,
              1,
              0
            ],
            [
              3,
              0,
              0,
              -1
            ],
            [
              3,
              1,
              1,
              0
            ],
            [
              3,
              3,
              0,
              1
            ],
            [
              4,
              2,
              0,
              -1
            ],
            [
              4,
              3,
              0,
              1
            ],
            [
              5,
              2,
              1,
              0
            ],
            [
              5,
              2,
              0,
              -1
            ],
            [
              5,
              3,
              1,
              0
            ],
            [
              5,
              3,
              0,
              1
            ]
          ]
        }
      },
      "taskHash": "bb73bec69dc226206781a0eab03487b7a594538b0a0ecb80026a857939479d08"
    },
    {
      "id": "link-productfractions-triArea",
      "sessionId": "link-productfractions-triArea",
      "index": 1,
      "nodeId": "mt_ML5t7n2-U8",
      "type": "x-a30-pieces",
      "kind": null,
      "actions": [
        {
          "action": "a30-transform"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "12"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "pieceAreas": [
          "12"
        ],
        "result": "12",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "4c251647ce099b40fab52372a2cd36cc3bfb39008133ae3186be5cb41e405460"
    },
    {
      "id": "link-boundary-triArea",
      "sessionId": "link-boundary-triArea",
      "index": 1,
      "nodeId": "mt_ML5t7n2-U8",
      "type": "x-a30-pieces",
      "kind": null,
      "actions": [
        {
          "action": "a30-transform"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "40"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "40"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "pieceAreas": [
          "40"
        ],
        "result": "40",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "7a17ee9b9ddd64cc09fa9a37233c2330f5ef6fca8bd02acc5c624a142b21f08a"
    },
    {
      "id": "link-quadhierarchy-triArea",
      "sessionId": "link-quadhierarchy-triArea",
      "index": 1,
      "nodeId": "mt_ML5t7n2-U8",
      "type": "x-a30-pieces",
      "kind": null,
      "actions": [
        {
          "action": "a30-transform"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "40"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "40"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "pieceAreas": [
          "40"
        ],
        "result": "40",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "7a17ee9b9ddd64cc09fa9a37233c2330f5ef6fca8bd02acc5c624a142b21f08a"
    },
    {
      "id": "link-rectsplit-polyArea",
      "sessionId": "link-rectsplit-polyArea",
      "index": 0,
      "nodeId": "mt_i2-QaXbyzB",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-corner",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 21
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 16
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 23
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "field": "area",
          "value": "20"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "area": 20,
        "perimeter": 20,
        "connected": true,
        "holes": false,
        "rectangle": false,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            3,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            3,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            3,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            3,
            0,
            1
          ],
          [
            4,
            2,
            0,
            -1
          ],
          [
            4,
            3,
            0,
            1
          ],
          [
            5,
            2,
            1,
            0
          ],
          [
            5,
            2,
            0,
            -1
          ],
          [
            5,
            3,
            1,
            0
          ],
          [
            5,
            3,
            0,
            1
          ]
        ],
        "independentRectangles": [
          [
            0,
            0,
            4,
            4
          ],
          [
            4,
            2,
            2,
            2
          ]
        ],
        "constructed": {
          "area": 20,
          "perimeter": 20,
          "connected": true,
          "holes": false,
          "rectangle": false,
          "unitBoundaryEdges": [
            [
              0,
              0,
              -1,
              0
            ],
            [
              0,
              0,
              0,
              -1
            ],
            [
              0,
              1,
              -1,
              0
            ],
            [
              0,
              2,
              -1,
              0
            ],
            [
              0,
              3,
              -1,
              0
            ],
            [
              0,
              3,
              0,
              1
            ],
            [
              1,
              0,
              0,
              -1
            ],
            [
              1,
              3,
              0,
              1
            ],
            [
              2,
              0,
              0,
              -1
            ],
            [
              2,
              3,
              0,
              1
            ],
            [
              3,
              0,
              1,
              0
            ],
            [
              3,
              0,
              0,
              -1
            ],
            [
              3,
              1,
              1,
              0
            ],
            [
              3,
              3,
              0,
              1
            ],
            [
              4,
              2,
              0,
              -1
            ],
            [
              4,
              3,
              0,
              1
            ],
            [
              5,
              2,
              1,
              0
            ],
            [
              5,
              2,
              0,
              -1
            ],
            [
              5,
              3,
              1,
              0
            ],
            [
              5,
              3,
              0,
              1
            ]
          ]
        }
      },
      "taskHash": "bb73bec69dc226206781a0eab03487b7a594538b0a0ecb80026a857939479d08"
    },
    {
      "id": "link-rectsplit-polyArea",
      "sessionId": "link-rectsplit-polyArea",
      "index": 1,
      "nodeId": "mt_i2-QaXbyzB",
      "type": "x-a30-pieces",
      "kind": null,
      "actions": [
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "24"
        },
        {
          "action": "a30-part"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 1
          }
        },
        {
          "field": "part",
          "value": "4"
        },
        {
          "action": "a30-part"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 2
          }
        },
        {
          "field": "part",
          "value": "4"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "32"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "answers.0",
          "value": "32"
        }
      ],
      "answers": [
        "32"
      ],
      "expected": {
        "pieceAreas": [
          "24",
          "4",
          "4"
        ],
        "result": "32",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "1a2f497a2aa1c67db9d36378f0dc332233bc218fba513ca0f9fb85f358cff32d"
    },
    {
      "id": "link-triArea-polyArea",
      "sessionId": "link-triArea-polyArea",
      "index": 0,
      "nodeId": "mt_i2-QaXbyzB",
      "type": "x-a30-pieces",
      "kind": null,
      "actions": [
        {
          "action": "a30-transform"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "12"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "pieceAreas": [
          "12"
        ],
        "result": "12",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "4c251647ce099b40fab52372a2cd36cc3bfb39008133ae3186be5cb41e405460"
    },
    {
      "id": "link-triArea-polyArea",
      "sessionId": "link-triArea-polyArea",
      "index": 1,
      "nodeId": "mt_i2-QaXbyzB",
      "type": "x-a30-pieces",
      "kind": null,
      "actions": [
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "24"
        },
        {
          "action": "a30-part"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 1
          }
        },
        {
          "field": "part",
          "value": "4"
        },
        {
          "action": "a30-part"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 2
          }
        },
        {
          "field": "part",
          "value": "4"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "32"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "answers.0",
          "value": "32"
        }
      ],
      "answers": [
        "32"
      ],
      "expected": {
        "pieceAreas": [
          "24",
          "4",
          "4"
        ],
        "result": "32",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "1a2f497a2aa1c67db9d36378f0dc332233bc218fba513ca0f9fb85f358cff32d"
    },
    {
      "id": "link-areadistrib-longproduct",
      "sessionId": "link-areadistrib-longproduct",
      "index": 0,
      "nodeId": "mt_q9EaJc2FP8",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-corner",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 74
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 10
          }
        },
        {
          "action": "a30-corner",
          "data": {
            "index": 77
          }
        },
        {
          "action": "a30-rect"
        },
        {
          "field": "area",
          "value": "78"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "answers.0",
          "value": "60"
        },
        {
          "field": "answers.1",
          "value": "18"
        }
      ],
      "answers": [
        "60",
        "18"
      ],
      "expected": {
        "area": 78,
        "perimeter": 38,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            3,
            -1,
            0
          ],
          [
            0,
            4,
            -1,
            0
          ],
          [
            0,
            5,
            -1,
            0
          ],
          [
            0,
            5,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            5,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            5,
            0,
            1
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            5,
            0,
            1
          ],
          [
            4,
            0,
            0,
            -1
          ],
          [
            4,
            5,
            0,
            1
          ],
          [
            5,
            0,
            0,
            -1
          ],
          [
            5,
            5,
            0,
            1
          ],
          [
            6,
            0,
            0,
            -1
          ],
          [
            6,
            5,
            0,
            1
          ],
          [
            7,
            0,
            0,
            -1
          ],
          [
            7,
            5,
            0,
            1
          ],
          [
            8,
            0,
            0,
            -1
          ],
          [
            8,
            5,
            0,
            1
          ],
          [
            9,
            0,
            0,
            -1
          ],
          [
            9,
            5,
            0,
            1
          ],
          [
            10,
            0,
            0,
            -1
          ],
          [
            10,
            5,
            0,
            1
          ],
          [
            11,
            0,
            0,
            -1
          ],
          [
            11,
            5,
            0,
            1
          ],
          [
            12,
            0,
            1,
            0
          ],
          [
            12,
            0,
            0,
            -1
          ],
          [
            12,
            1,
            1,
            0
          ],
          [
            12,
            2,
            1,
            0
          ],
          [
            12,
            3,
            1,
            0
          ],
          [
            12,
            4,
            1,
            0
          ],
          [
            12,
            5,
            1,
            0
          ],
          [
            12,
            5,
            0,
            1
          ]
        ],
        "independentRectangles": [
          [
            0,
            0,
            10,
            6
          ],
          [
            10,
            0,
            3,
            6
          ]
        ],
        "constructed": {
          "area": 78,
          "perimeter": 38,
          "connected": true,
          "holes": false,
          "rectangle": true,
          "unitBoundaryEdges": [
            [
              0,
              0,
              -1,
              0
            ],
            [
              0,
              0,
              0,
              -1
            ],
            [
              0,
              1,
              -1,
              0
            ],
            [
              0,
              2,
              -1,
              0
            ],
            [
              0,
              3,
              -1,
              0
            ],
            [
              0,
              4,
              -1,
              0
            ],
            [
              0,
              5,
              -1,
              0
            ],
            [
              0,
              5,
              0,
              1
            ],
            [
              1,
              0,
              0,
              -1
            ],
            [
              1,
              5,
              0,
              1
            ],
            [
              2,
              0,
              0,
              -1
            ],
            [
              2,
              5,
              0,
              1
            ],
            [
              3,
              0,
              0,
              -1
            ],
            [
              3,
              5,
              0,
              1
            ],
            [
              4,
              0,
              0,
              -1
            ],
            [
              4,
              5,
              0,
              1
            ],
            [
              5,
              0,
              0,
              -1
            ],
            [
              5,
              5,
              0,
              1
            ],
            [
              6,
              0,
              0,
              -1
            ],
            [
              6,
              5,
              0,
              1
            ],
            [
              7,
              0,
              0,
              -1
            ],
            [
              7,
              5,
              0,
              1
            ],
            [
              8,
              0,
              0,
              -1
            ],
            [
              8,
              5,
              0,
              1
            ],
            [
              9,
              0,
              0,
              -1
            ],
            [
              9,
              5,
              0,
              1
            ],
            [
              10,
              0,
              0,
              -1
            ],
            [
              10,
              5,
              0,
              1
            ],
            [
              11,
              0,
              0,
              -1
            ],
            [
              11,
              5,
              0,
              1
            ],
            [
              12,
              0,
              1,
              0
            ],
            [
              12,
              0,
              0,
              -1
            ],
            [
              12,
              1,
              1,
              0
            ],
            [
              12,
              2,
              1,
              0
            ],
            [
              12,
              3,
              1,
              0
            ],
            [
              12,
              4,
              1,
              0
            ],
            [
              12,
              5,
              1,
              0
            ],
            [
              12,
              5,
              0,
              1
            ]
          ]
        }
      },
      "taskHash": "a1032ca20ff3a5385b0f469219e6f00fbbfea81e76b8e89ef55e37e66fc778fc"
    },
    {
      "id": "link-triArea-prismFormulas",
      "sessionId": "link-triArea-prismFormulas",
      "index": 0,
      "nodeId": "mt_tAJH5BrpOx",
      "type": "x-a30-pieces",
      "kind": null,
      "actions": [
        {
          "action": "a30-transform"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "12"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "pieceAreas": [
          "12"
        ],
        "result": "12",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "4c251647ce099b40fab52372a2cd36cc3bfb39008133ae3186be5cb41e405460"
    },
    {
      "id": "link-triArea-prismFormulas",
      "sessionId": "link-triArea-prismFormulas",
      "index": 1,
      "nodeId": "mt_tAJH5BrpOx",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "field": "base",
          "value": "6"
        },
        {
          "field": "volume",
          "value": "60"
        },
        {
          "field": "volumeUnit",
          "value": "cm³"
        },
        {
          "action": "turn-extra"
        }
      ],
      "answers": [],
      "expected": {
        "independentFaceAreas": [
          "6",
          "6",
          "40",
          "30",
          "50"
        ],
        "surface": "132",
        "base": "6",
        "volume": "60"
      },
      "taskHash": "b45dd74041a96817e559de29fb8f90db76a62cf9f1df86a0c2174b98b983bf44"
    },
    {
      "id": "link-boundary-prismFormulas",
      "sessionId": "link-boundary-prismFormulas",
      "index": 1,
      "nodeId": "mt_tAJH5BrpOx",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "field": "base",
          "value": "6"
        },
        {
          "field": "volume",
          "value": "60"
        },
        {
          "field": "volumeUnit",
          "value": "cm³"
        },
        {
          "action": "turn-extra"
        }
      ],
      "answers": [],
      "expected": {
        "independentFaceAreas": [
          "6",
          "6",
          "40",
          "30",
          "50"
        ],
        "surface": "132",
        "base": "6",
        "volume": "60"
      },
      "taskHash": "b45dd74041a96817e559de29fb8f90db76a62cf9f1df86a0c2174b98b983bf44"
    },
    {
      "id": "link-box-prismFormulas",
      "sessionId": "link-box-prismFormulas",
      "index": 1,
      "nodeId": "mt_tAJH5BrpOx",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "field": "base",
          "value": "6"
        },
        {
          "field": "volume",
          "value": "60"
        },
        {
          "field": "volumeUnit",
          "value": "cm³"
        },
        {
          "action": "turn-extra"
        }
      ],
      "answers": [],
      "expected": {
        "independentFaceAreas": [
          "6",
          "6",
          "40",
          "30",
          "50"
        ],
        "surface": "132",
        "base": "6",
        "volume": "60"
      },
      "taskHash": "b45dd74041a96817e559de29fb8f90db76a62cf9f1df86a0c2174b98b983bf44"
    },
    {
      "id": "link-triArea-netSurface",
      "sessionId": "link-triArea-netSurface",
      "index": 0,
      "nodeId": "mt_tegkuJA5gM",
      "type": "x-a30-pieces",
      "kind": null,
      "actions": [
        {
          "action": "a30-transform"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "12"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "pieceAreas": [
          "12"
        ],
        "result": "12",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "4c251647ce099b40fab52372a2cd36cc3bfb39008133ae3186be5cb41e405460"
    },
    {
      "id": "link-triArea-netSurface",
      "sessionId": "link-triArea-netSurface",
      "index": 1,
      "nodeId": "mt_tegkuJA5gM",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "action": "a30-face",
          "data": {
            "index": 0
          }
        },
        {
          "field": "faceValues.0",
          "value": "36"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 1
          }
        },
        {
          "field": "faceValues.1",
          "value": "15"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 2
          }
        },
        {
          "field": "faceValues.2",
          "value": "15"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 3
          }
        },
        {
          "field": "faceValues.3",
          "value": "15"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 4
          }
        },
        {
          "field": "faceValues.4",
          "value": "15"
        },
        {
          "field": "area",
          "value": "96"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "action": "turn-extra"
        }
      ],
      "answers": [],
      "expected": {
        "independentFaceAreas": [
          "36",
          "15",
          "15",
          "15",
          "15"
        ],
        "surface": "96",
        "base": null,
        "volume": null
      },
      "taskHash": "8e8751bc6a4ffa9743447cab900d0b8282d8dd258c6d5adb9f8d13a757cf06a3"
    },
    {
      "id": "link-box-netSurface",
      "sessionId": "link-box-netSurface",
      "index": 1,
      "nodeId": "mt_tegkuJA5gM",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "action": "a30-face",
          "data": {
            "index": 0
          }
        },
        {
          "field": "faceValues.0",
          "value": "15"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 1
          }
        },
        {
          "field": "faceValues.1",
          "value": "15"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 2
          }
        },
        {
          "field": "faceValues.2",
          "value": "12"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 3
          }
        },
        {
          "field": "faceValues.3",
          "value": "12"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 4
          }
        },
        {
          "field": "faceValues.4",
          "value": "20"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 5
          }
        },
        {
          "field": "faceValues.5",
          "value": "20"
        },
        {
          "field": "area",
          "value": "94"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "action": "turn-extra"
        }
      ],
      "answers": [],
      "expected": {
        "independentFaceAreas": [
          "15",
          "15",
          "12",
          "12",
          "20",
          "20"
        ],
        "surface": "94",
        "base": null,
        "volume": null
      },
      "taskHash": "615c0f44811c01763437d44c711822f7304e6d3447d5de01f9f5bfe2f98ecef4"
    },
    {
      "id": "link-nets-netSurface",
      "sessionId": "link-nets-netSurface",
      "index": 1,
      "nodeId": "mt_tegkuJA5gM",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "action": "a30-face",
          "data": {
            "index": 0
          }
        },
        {
          "field": "faceValues.0",
          "value": "15"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 1
          }
        },
        {
          "field": "faceValues.1",
          "value": "15"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 2
          }
        },
        {
          "field": "faceValues.2",
          "value": "12"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 3
          }
        },
        {
          "field": "faceValues.3",
          "value": "12"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 4
          }
        },
        {
          "field": "faceValues.4",
          "value": "20"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 5
          }
        },
        {
          "field": "faceValues.5",
          "value": "20"
        },
        {
          "field": "area",
          "value": "94"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "action": "turn-extra"
        }
      ],
      "answers": [],
      "expected": {
        "independentFaceAreas": [
          "15",
          "15",
          "12",
          "12",
          "20",
          "20"
        ],
        "surface": "94",
        "base": null,
        "volume": null
      },
      "taskHash": "615c0f44811c01763437d44c711822f7304e6d3447d5de01f9f5bfe2f98ecef4"
    },
    {
      "id": "link-prismFormulas-circleArea",
      "sessionId": "link-prismFormulas-circleArea",
      "index": 0,
      "nodeId": "mt_svFa6_mjO_",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "field": "base",
          "value": "12.56"
        },
        {
          "field": "volume",
          "value": "50.24"
        },
        {
          "field": "volumeUnit",
          "value": "cm³"
        },
        {
          "action": "turn-extra"
        },
        {
          "field": "answers.0",
          "value": "base"
        }
      ],
      "answers": [
        "base"
      ],
      "expected": {
        "independentFaceAreas": [],
        "surface": null,
        "base": "314/25",
        "volume": "1256/25"
      },
      "taskHash": "8e254d6e19b42c3b5f83d51e2d0efe858589bcec2bb74cc26945236f63c6c427"
    },
    {
      "id": "link-prismFormulas-circleArea",
      "sessionId": "link-prismFormulas-circleArea",
      "index": 1,
      "nodeId": "mt_svFa6_mjO_",
      "type": "x-a30-circle",
      "kind": null,
      "actions": [
        {
          "action": "a30-unroll"
        },
        {
          "field": "radius",
          "value": "3"
        },
        {
          "field": "diameter",
          "value": "6"
        },
        {
          "field": "perimeter",
          "value": "18.84"
        },
        {
          "field": "area",
          "value": "28.26"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "field": "areaUnit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "piApproximation": "157/50",
        "radius": "3",
        "diameter": "6",
        "perimeterApprox": "471/25",
        "areaApprox": "1413/50"
      },
      "taskHash": "d4337d22d2b3931c72f707f10c1f81173f76d0c9f39d917084c5860e02c21d4f"
    },
    {
      "id": "link-circleparts-circleArea",
      "sessionId": "link-circleparts-circleArea",
      "index": 1,
      "nodeId": "mt_svFa6_mjO_",
      "type": "x-a30-circle",
      "kind": null,
      "actions": [
        {
          "action": "a30-unroll"
        },
        {
          "field": "radius",
          "value": "3"
        },
        {
          "field": "diameter",
          "value": "6"
        },
        {
          "field": "perimeter",
          "value": "18.84"
        },
        {
          "field": "area",
          "value": "28.26"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "field": "areaUnit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "piApproximation": "157/50",
        "radius": "3",
        "diameter": "6",
        "perimeterApprox": "471/25",
        "areaApprox": "1413/50"
      },
      "taskHash": "d4337d22d2b3931c72f707f10c1f81173f76d0c9f39d917084c5860e02c21d4f"
    },
    {
      "id": "link-polyArea-solidSurface",
      "sessionId": "link-polyArea-solidSurface",
      "index": 0,
      "nodeId": "mt_Sij9ByyHq6",
      "type": "x-a30-pieces",
      "kind": null,
      "actions": [
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "96"
        },
        {
          "action": "a30-part"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 1
          }
        },
        {
          "field": "part",
          "value": "12"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "108"
        },
        {
          "field": "unit",
          "value": "m²"
        }
      ],
      "answers": [],
      "expected": {
        "pieceAreas": [
          "96",
          "12"
        ],
        "result": "108",
        "unit": "m²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "b70e98f3e011ab7183a8439a6bf9cbd4c2f0e7c558fd3db65e4c03f814e6516a"
    },
    {
      "id": "link-polyArea-solidSurface",
      "sessionId": "link-polyArea-solidSurface",
      "index": 1,
      "nodeId": "mt_Sij9ByyHq6",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "field": "base",
          "value": "6"
        },
        {
          "field": "volume",
          "value": "3"
        },
        {
          "field": "volumeUnit",
          "value": "m³"
        },
        {
          "field": "calcValues.0",
          "value": "3"
        },
        {
          "field": "calcValues.1",
          "value": "3"
        },
        {
          "action": "turn-extra"
        },
        {
          "field": "answers.0",
          "value": "surface"
        }
      ],
      "answers": [
        "surface"
      ],
      "expected": {
        "componentBaseAreas": [
          3,
          3
        ],
        "independentFaceAreas": [],
        "surface": null,
        "base": "6",
        "volume": "3"
      },
      "taskHash": "135458801b6c73fe3e3d3e7986a091a148f7ca04dd4d6c3a28175a6b965764ae"
    },
    {
      "id": "link-prismFormulas-solidSurface",
      "sessionId": "link-prismFormulas-solidSurface",
      "index": 0,
      "nodeId": "mt_Sij9ByyHq6",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "field": "base",
          "value": "6"
        },
        {
          "field": "volume",
          "value": "60"
        },
        {
          "field": "volumeUnit",
          "value": "cm³"
        },
        {
          "action": "turn-extra"
        }
      ],
      "answers": [],
      "expected": {
        "independentFaceAreas": [
          "6",
          "6",
          "40",
          "30",
          "50"
        ],
        "surface": "132",
        "base": "6",
        "volume": "60"
      },
      "taskHash": "b45dd74041a96817e559de29fb8f90db76a62cf9f1df86a0c2174b98b983bf44"
    },
    {
      "id": "link-prismFormulas-solidSurface",
      "sessionId": "link-prismFormulas-solidSurface",
      "index": 1,
      "nodeId": "mt_Sij9ByyHq6",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "action": "a30-face",
          "data": {
            "index": 0
          }
        },
        {
          "field": "faceValues.0",
          "value": "6"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 1
          }
        },
        {
          "field": "faceValues.1",
          "value": "6"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 2
          }
        },
        {
          "field": "faceValues.2",
          "value": "40"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 3
          }
        },
        {
          "field": "faceValues.3",
          "value": "30"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 4
          }
        },
        {
          "field": "faceValues.4",
          "value": "50"
        },
        {
          "field": "area",
          "value": "132"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "base",
          "value": "6"
        },
        {
          "field": "volume",
          "value": "60"
        },
        {
          "field": "volumeUnit",
          "value": "cm³"
        },
        {
          "action": "turn-extra"
        }
      ],
      "answers": [],
      "expected": {
        "independentFaceAreas": [
          "6",
          "6",
          "40",
          "30",
          "50"
        ],
        "surface": "132",
        "base": "6",
        "volume": "60"
      },
      "taskHash": "b12960f77dff3c1471cb18cf98d497c17b8a6cdb478c2750b935d856cbcde93e"
    },
    {
      "id": "link-netSurface-solidSurface",
      "sessionId": "link-netSurface-solidSurface",
      "index": 0,
      "nodeId": "mt_Sij9ByyHq6",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "action": "a30-face",
          "data": {
            "index": 0
          }
        },
        {
          "field": "faceValues.0",
          "value": "15"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 1
          }
        },
        {
          "field": "faceValues.1",
          "value": "15"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 2
          }
        },
        {
          "field": "faceValues.2",
          "value": "12"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 3
          }
        },
        {
          "field": "faceValues.3",
          "value": "12"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 4
          }
        },
        {
          "field": "faceValues.4",
          "value": "20"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 5
          }
        },
        {
          "field": "faceValues.5",
          "value": "20"
        },
        {
          "field": "area",
          "value": "94"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "action": "turn-extra"
        }
      ],
      "answers": [],
      "expected": {
        "independentFaceAreas": [
          "15",
          "15",
          "12",
          "12",
          "20",
          "20"
        ],
        "surface": "94",
        "base": null,
        "volume": null
      },
      "taskHash": "615c0f44811c01763437d44c711822f7304e6d3447d5de01f9f5bfe2f98ecef4"
    },
    {
      "id": "link-netSurface-solidSurface",
      "sessionId": "link-netSurface-solidSurface",
      "index": 1,
      "nodeId": "mt_Sij9ByyHq6",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "action": "a30-split"
        },
        {
          "action": "a30-split"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 0
          }
        },
        {
          "field": "faceValues.0",
          "value": "16"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 1
          }
        },
        {
          "field": "faceValues.1",
          "value": "32"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 2
          }
        },
        {
          "field": "faceValues.2",
          "value": "12"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 3
          }
        },
        {
          "field": "faceValues.3",
          "value": "4"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 4
          }
        },
        {
          "field": "faceValues.4",
          "value": "16"
        },
        {
          "field": "area",
          "value": "80"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "volume",
          "value": "40"
        },
        {
          "field": "volumeUnit",
          "value": "cm³"
        },
        {
          "field": "calcValues.0",
          "value": "32"
        },
        {
          "field": "calcValues.1",
          "value": "8"
        },
        {
          "action": "turn-extra"
        },
        {
          "field": "answers.0",
          "value": "88"
        },
        {
          "field": "answers.1",
          "value": "8"
        }
      ],
      "answers": [
        "88",
        "8"
      ],
      "expected": {
        "separateSurface": 88,
        "hiddenContactArea": 8,
        "volumes": [
          32,
          8
        ],
        "faceEntriesAreGroups": true,
        "contactFacesSelectable": false,
        "independentFaceAreas": [
          "16",
          "32",
          "12",
          "4",
          "16"
        ],
        "surface": "80",
        "base": null,
        "volume": "40"
      },
      "taskHash": "970821d3a492aa3c68cf9ed73f66707a082c8bd5758f8f2f864350bb5f544e10"
    },
    {
      "id": "link-steps-solidSurface",
      "sessionId": "link-steps-solidSurface",
      "index": 1,
      "nodeId": "mt_Sij9ByyHq6",
      "type": "x-a30-solid",
      "kind": null,
      "actions": [
        {
          "action": "a30-split"
        },
        {
          "action": "a30-split"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 0
          }
        },
        {
          "field": "faceValues.0",
          "value": "16"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 1
          }
        },
        {
          "field": "faceValues.1",
          "value": "32"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 2
          }
        },
        {
          "field": "faceValues.2",
          "value": "12"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 3
          }
        },
        {
          "field": "faceValues.3",
          "value": "4"
        },
        {
          "action": "a30-face",
          "data": {
            "index": 4
          }
        },
        {
          "field": "faceValues.4",
          "value": "16"
        },
        {
          "field": "area",
          "value": "80"
        },
        {
          "field": "unit",
          "value": "cm²"
        },
        {
          "field": "volume",
          "value": "40"
        },
        {
          "field": "volumeUnit",
          "value": "cm³"
        },
        {
          "field": "calcValues.0",
          "value": "32"
        },
        {
          "field": "calcValues.1",
          "value": "8"
        },
        {
          "action": "turn-extra"
        },
        {
          "field": "answers.0",
          "value": "88"
        },
        {
          "field": "answers.1",
          "value": "8"
        }
      ],
      "answers": [
        "88",
        "8"
      ],
      "expected": {
        "separateSurface": 88,
        "hiddenContactArea": 8,
        "volumes": [
          32,
          8
        ],
        "faceEntriesAreGroups": true,
        "contactFacesSelectable": false,
        "independentFaceAreas": [
          "16",
          "32",
          "12",
          "4",
          "16"
        ],
        "surface": "80",
        "base": null,
        "volume": "40"
      },
      "taskHash": "970821d3a492aa3c68cf9ed73f66707a082c8bd5758f8f2f864350bb5f544e10"
    },
    {
      "id": "link-formula36-triArea",
      "sessionId": "link-formula36-triArea",
      "index": 1,
      "nodeId": "mt_ML5t7n2-U8",
      "type": "x-a30-pieces",
      "kind": null,
      "actions": [
        {
          "action": "a30-transform"
        },
        {
          "action": "a30-active",
          "data": {
            "index": 0
          }
        },
        {
          "field": "part",
          "value": "12"
        },
        {
          "action": "a30-part"
        },
        {
          "field": "area",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "pieceAreas": [
          "12"
        ],
        "result": "12",
        "unit": "cm²",
        "sourceCoordinatesIntegral": true
      },
      "taskHash": "4c251647ce099b40fab52372a2cd36cc3bfb39008133ae3186be5cb41e405460"
    },
    {
      "id": "link-term38-advancedWords38",
      "sessionId": "link-term38-advancedWords38",
      "index": 0,
      "nodeId": "mt_3rTIyJDw7-",
      "type": "x-a30-grid",
      "kind": null,
      "actions": [
        {
          "action": "a30-tile",
          "data": {
            "index": 0
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 1
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 2
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 3
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 4
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 5
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 6
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 7
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 8
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 9
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 10
          }
        },
        {
          "action": "a30-tile",
          "data": {
            "index": 11
          }
        },
        {
          "field": "area",
          "value": "12"
        },
        {
          "field": "unit",
          "value": "cm²"
        }
      ],
      "answers": [],
      "expected": {
        "area": 12,
        "perimeter": 14,
        "connected": true,
        "holes": false,
        "rectangle": true,
        "unitBoundaryEdges": [
          [
            0,
            0,
            -1,
            0
          ],
          [
            0,
            0,
            0,
            -1
          ],
          [
            0,
            1,
            -1,
            0
          ],
          [
            0,
            2,
            -1,
            0
          ],
          [
            0,
            2,
            0,
            1
          ],
          [
            1,
            0,
            0,
            -1
          ],
          [
            1,
            2,
            0,
            1
          ],
          [
            2,
            0,
            0,
            -1
          ],
          [
            2,
            2,
            0,
            1
          ],
          [
            3,
            0,
            1,
            0
          ],
          [
            3,
            0,
            0,
            -1
          ],
          [
            3,
            1,
            1,
            0
          ],
          [
            3,
            2,
            1,
            0
          ],
          [
            3,
            2,
            0,
            1
          ]
        ]
      },
      "taskHash": "3fa5666f59799e2d95267be6c2c8f218155941a817e0525d19be8fbe8199a4f1"
    }
  ]
};
