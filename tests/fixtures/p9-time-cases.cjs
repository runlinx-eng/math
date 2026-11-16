// Literal reviewed source positions, complete canonical task hashes and independently
// calculated control plans. Generated once after the Issue #172 semantic review;
// CI reads this file and must never regenerate it from a solver or adapter.
module.exports={
  "sourceBase": "70941d2adb4ed124365629f15ee15ca76cecbe0c",
  "sourceFiles": {
    "dist/learning/phase5/b32-model.js": "0c1250c81032fb4efbaaf83ffadb221ad98ff5b6f9d2a2f5452ef4ef7179ace6",
    "dist/learning/phase5/b32-view.js": "3947ea7e1129f560474b2e07c4f9ec73c71b99167faf31752582a6ad15a08630"
  },
  "cases": [
    {
      "id": "eventorder",
      "sessionId": "eventorder",
      "index": 1,
      "nodeId": "mt_-vvVxpOHG2",
      "type": "x-t32-order",
      "taskHash": "07fd0e380320a81ccf2a99a33ae870523e4ff4c726fdd945e89d122c4e563295",
      "answers": [
        "today"
      ],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answers.0",
          "value": "today"
        }
      ],
      "expected": {
        "values": [
          1,
          -1,
          0
        ],
        "orderedIdentities": [
          1,
          2,
          0
        ],
        "orderedLabels": [
          "周二：昨天",
          "周三：今天",
          "周四：明天"
        ],
        "adjacentRelations": [
          [
            -1,
            "<=",
            0
          ],
          [
            0,
            "<=",
            1
          ]
        ]
      }
    },
    {
      "id": "eventorder",
      "sessionId": "eventorder",
      "index": 2,
      "nodeId": "mt_-vvVxpOHG2",
      "type": "x-t32-order",
      "taskHash": "7a12c4a4fb066dc1dd95fb209decb6e6dc757209e83ce2256a59472754a10f52",
      "answers": [],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        }
      ],
      "expected": {
        "values": [
          15,
          9,
          20
        ],
        "orderedIdentities": [
          1,
          0,
          2
        ],
        "orderedLabels": [
          "上午 9:00",
          "下午 3:00",
          "晚上 8:00"
        ],
        "adjacentRelations": [
          [
            9,
            "<=",
            15
          ],
          [
            15,
            "<=",
            20
          ]
        ]
      }
    },
    {
      "id": "durationunit",
      "sessionId": "durationunit",
      "index": 0,
      "nodeId": "mt__N55B7u7HD",
      "type": "x-t32-stopwatch",
      "taskHash": "e5f6d06ff99e64596efb2ed0e532488a638a1f5491c93dc9ec36887afdf503ab",
      "answers": [
        "1"
      ],
      "actions": [
        {
          "action": "t32-start"
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 30
          }
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 30
          }
        },
        {
          "action": "t32-stop"
        },
        {
          "field": "answers.0",
          "value": "1"
        }
      ],
      "expected": {
        "durationSeconds": 60,
        "allowedVisibleTickSeconds": [
          10,
          30
        ],
        "exampleSimulatedTicks": [
          30,
          30
        ],
        "totalMinutes": "1",
        "wallClockMeasurement": false
      }
    },
    {
      "id": "durationunit",
      "sessionId": "durationunit",
      "index": 1,
      "nodeId": "mt__N55B7u7HD",
      "type": "x-t32-stopwatch",
      "taskHash": "3e193fcbc141c375f2d6ef786aefb9ec4725b05a444c9ca7dec8f8ab8e9d0860",
      "answers": [
        "20"
      ],
      "actions": [
        {
          "action": "t32-start"
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 10
          }
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 10
          }
        },
        {
          "action": "t32-stop"
        },
        {
          "field": "answers.0",
          "value": "20"
        }
      ],
      "expected": {
        "durationSeconds": 20,
        "allowedVisibleTickSeconds": [
          10,
          30
        ],
        "exampleSimulatedTicks": [
          10,
          10
        ],
        "totalMinutes": "1/3",
        "wallClockMeasurement": false
      }
    },
    {
      "id": "durationorder",
      "sessionId": "durationorder",
      "index": 0,
      "nodeId": "mt_6XCURuNwPw",
      "type": "x-t32-order",
      "taskHash": "06655f40ea08030dbefe6dc0e39ae95580cc116f543a1262dbdc2e27d01467d3",
      "answers": [],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        }
      ],
      "expected": {
        "values": [
          20,
          12,
          35
        ],
        "orderedIdentities": [
          1,
          0,
          2
        ],
        "orderedLabels": [
          "走路12分钟",
          "画画20分钟",
          "游戏35分钟"
        ],
        "adjacentRelations": [
          [
            12,
            "<=",
            20
          ],
          [
            20,
            "<=",
            35
          ]
        ]
      }
    },
    {
      "id": "durationorder",
      "sessionId": "durationorder",
      "index": 2,
      "nodeId": "mt_6XCURuNwPw",
      "type": "x-t32-steps",
      "taskHash": "8a866df7dbdb86a22b0ee540a507e8883bf93294a5d7bb6cdbdd154ccc0e7c58",
      "answers": [
        "25"
      ],
      "actions": [
        {
          "field": "jump",
          "value": "10"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "jump",
          "value": "15"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "answers.0",
          "value": "25"
        }
      ],
      "expected": {
        "startMinutes": 530,
        "endMinutes": 555,
        "durationMinutes": 25,
        "exampleChosenSegments": [
          10,
          15
        ],
        "balances": [
          530,
          540,
          555
        ],
        "displayedClocks": [
          "08:50",
          "09:00",
          "09:15"
        ],
        "timeCoordinatesGeneratedByTool": true
      }
    },
    {
      "id": "durationwork",
      "sessionId": "durationwork",
      "index": 0,
      "nodeId": "mt_4emC463IyW",
      "type": "x-t32-steps",
      "taskHash": "90242a80c5d2f9ee6e2de57ed8b371ece43ea5dfbed90c959b30a0631df82daa",
      "answers": [
        "26"
      ],
      "actions": [
        {
          "field": "jump",
          "value": "13"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "jump",
          "value": "13"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "answers.0",
          "value": "26"
        }
      ],
      "expected": {
        "startMinutes": 1037,
        "endMinutes": 1063,
        "durationMinutes": 26,
        "exampleChosenSegments": [
          13,
          13
        ],
        "balances": [
          1037,
          1050,
          1063
        ],
        "displayedClocks": [
          "17:17",
          "17:30",
          "17:43"
        ],
        "timeCoordinatesGeneratedByTool": true
      }
    },
    {
      "id": "durationwork",
      "sessionId": "durationwork",
      "index": 2,
      "nodeId": "mt_4emC463IyW",
      "type": "x-t32-steps",
      "taskHash": "b16a073c3f164f6a2e1ae200a5e492769e2d56cbe21c5e52f92065801968356b",
      "answers": [
        "45"
      ],
      "actions": [
        {
          "field": "jump",
          "value": "20"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "jump",
          "value": "25"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "answers.0",
          "value": "45"
        }
      ],
      "expected": {
        "startMinutes": 615,
        "endMinutes": 660,
        "durationMinutes": 45,
        "exampleChosenSegments": [
          20,
          25
        ],
        "balances": [
          615,
          635,
          660
        ],
        "displayedClocks": [
          "10:15",
          "10:35",
          "11:00"
        ],
        "timeCoordinatesGeneratedByTool": true
      }
    },
    {
      "id": "fractiontime",
      "sessionId": "fractiontime",
      "index": 0,
      "nodeId": "mt_Jz9UuT8BXW",
      "type": "x-t32-parts",
      "taskHash": "a475721cdd5df48846f1bfcca3015ab36c11046dc57d8fd1e68490935948b892",
      "answers": [
        "45"
      ],
      "actions": [
        {
          "action": "t32-part",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answers.0",
          "value": "45"
        }
      ],
      "expected": {
        "whole": 90,
        "equalParts": 2,
        "selectedCount": 1,
        "unitPartAmount": "45",
        "selectedAmount": "45",
        "unit": "分钟",
        "requiredIdentities": [
          0
        ],
        "equalPartitionGeneratedByTool": true,
        "intervals": [
          [
            "0",
            "45"
          ],
          [
            "45",
            "90"
          ]
        ]
      }
    },
    {
      "id": "fractiontime",
      "sessionId": "fractiontime",
      "index": 1,
      "nodeId": "mt_Jz9UuT8BXW",
      "type": "x-t32-parts",
      "taskHash": "7f6f0e1b52b5403e803550b601cb93f786ad0332e00f4db8e3092eaa9cc69b27",
      "answers": [
        "30"
      ],
      "actions": [
        {
          "action": "t32-part",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answers.0",
          "value": "30"
        }
      ],
      "expected": {
        "whole": 60,
        "equalParts": 2,
        "selectedCount": 1,
        "unitPartAmount": "30",
        "selectedAmount": "30",
        "unit": "分钟",
        "requiredIdentities": null,
        "equalPartitionGeneratedByTool": true,
        "intervals": [
          [
            "0",
            "30"
          ],
          [
            "30",
            "60"
          ]
        ]
      }
    },
    {
      "id": "fractiontime",
      "sessionId": "fractiontime",
      "index": 2,
      "nodeId": "mt_Jz9UuT8BXW",
      "type": "x-t32-parts",
      "taskHash": "4b79dc3e68245811676f779aec7f026de171c14209b2f2403bf237dbcd75e781",
      "answers": [
        "15"
      ],
      "actions": [
        {
          "action": "t32-part",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answers.0",
          "value": "15"
        }
      ],
      "expected": {
        "whole": 60,
        "equalParts": 4,
        "selectedCount": 1,
        "unitPartAmount": "15",
        "selectedAmount": "15",
        "unit": "分钟",
        "requiredIdentities": null,
        "equalPartitionGeneratedByTool": true,
        "intervals": [
          [
            "0",
            "15"
          ],
          [
            "15",
            "30"
          ],
          [
            "30",
            "45"
          ],
          [
            "45",
            "60"
          ]
        ]
      }
    },
    {
      "id": "fractiontime",
      "sessionId": "fractiontime",
      "index": 3,
      "nodeId": "mt_Jz9UuT8BXW",
      "type": "x-t32-parts",
      "taskHash": "1a270fa8fb27763b1e8242c7bc01743706a0d11ac7d1f31b0544851e631c7cac",
      "answers": [
        "2"
      ],
      "actions": [
        {
          "action": "t32-part",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answers.0",
          "value": "2"
        }
      ],
      "expected": {
        "whole": 16,
        "equalParts": 8,
        "selectedCount": 1,
        "unitPartAmount": "2",
        "selectedAmount": "2",
        "unit": "分钟",
        "requiredIdentities": null,
        "equalPartitionGeneratedByTool": true,
        "intervals": [
          [
            "0",
            "2"
          ],
          [
            "2",
            "4"
          ],
          [
            "4",
            "6"
          ],
          [
            "6",
            "8"
          ],
          [
            "8",
            "10"
          ],
          [
            "10",
            "12"
          ],
          [
            "12",
            "14"
          ],
          [
            "14",
            "16"
          ]
        ]
      }
    },
    {
      "id": "elapsedtime",
      "sessionId": "elapsedtime",
      "index": 0,
      "nodeId": "mt_IL86kadLSS",
      "type": "x-t32-steps",
      "taskHash": "64466ad172c19343a4d373bf2c010748819ee215d36e1f0537626314ab2f242e",
      "answers": [
        "15:02"
      ],
      "actions": [
        {
          "field": "jump",
          "value": "45"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "jump",
          "value": "2"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "answers.0",
          "value": "15:02"
        }
      ],
      "expected": {
        "startMinutes": 855,
        "endMinutes": 902,
        "durationMinutes": 47,
        "exampleChosenSegments": [
          45,
          2
        ],
        "balances": [
          855,
          900,
          902
        ],
        "displayedClocks": [
          "14:15",
          "15:00",
          "15:02"
        ],
        "timeCoordinatesGeneratedByTool": true
      }
    },
    {
      "id": "elapsedtime",
      "sessionId": "elapsedtime",
      "index": 1,
      "nodeId": "mt_IL86kadLSS",
      "type": "x-t32-steps",
      "taskHash": "199c753891b28c7a19cb026e3e6a17853bfd56d380efb01c6d61dde2d8702c6c",
      "answers": [
        "45"
      ],
      "actions": [
        {
          "field": "jump",
          "value": "40"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "jump",
          "value": "5"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "answers.0",
          "value": "45"
        }
      ],
      "expected": {
        "startMinutes": 560,
        "endMinutes": 605,
        "durationMinutes": 45,
        "exampleChosenSegments": [
          40,
          5
        ],
        "balances": [
          560,
          600,
          605
        ],
        "displayedClocks": [
          "09:20",
          "10:00",
          "10:05"
        ],
        "timeCoordinatesGeneratedByTool": true
      }
    },
    {
      "id": "elapsedtime",
      "sessionId": "elapsedtime",
      "index": 2,
      "nodeId": "mt_IL86kadLSS",
      "type": "x-t32-steps",
      "taskHash": "c99f4984bff6d6be3418ff76bf45d8c3142eb4fbe8aac9f1c482202d438022c7",
      "answers": [
        "25"
      ],
      "actions": [
        {
          "field": "jump",
          "value": "10"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "jump",
          "value": "15"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "answers.0",
          "value": "25"
        }
      ],
      "expected": {
        "startMinutes": 530,
        "endMinutes": 555,
        "durationMinutes": 25,
        "exampleChosenSegments": [
          10,
          15
        ],
        "balances": [
          530,
          540,
          555
        ],
        "displayedClocks": [
          "08:50",
          "09:00",
          "09:15"
        ],
        "timeCoordinatesGeneratedByTool": true
      }
    },
    {
      "id": "romanclock",
      "sessionId": "romanclock",
      "index": 1,
      "nodeId": "mt_5J2quSTspi",
      "type": "x-t32-roman",
      "taskHash": "12a087ebf8e67b7b11bb669117a764d7bced306b2f764388494b865a11c128a2",
      "answers": [
        "4"
      ],
      "actions": [
        {
          "action": "t32-pick",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 3
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 3
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 4
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 4
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 5
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 5
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 6
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 6
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 7
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 7
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 8
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 8
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 9
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 9
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 10
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 10
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 11
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 11
          }
        },
        {
          "field": "answers.0",
          "value": "4"
        }
      ],
      "expected": {
        "slots": [
          {
            "position": 0,
            "numeral": "XII",
            "value": 12
          },
          {
            "position": 1,
            "numeral": "I",
            "value": 1
          },
          {
            "position": 2,
            "numeral": "II",
            "value": 2
          },
          {
            "position": 3,
            "numeral": "III",
            "value": 3
          },
          {
            "position": 4,
            "numeral": "IV",
            "value": 4
          },
          {
            "position": 5,
            "numeral": "V",
            "value": 5
          },
          {
            "position": 6,
            "numeral": "VI",
            "value": 6
          },
          {
            "position": 7,
            "numeral": "VII",
            "value": 7
          },
          {
            "position": 8,
            "numeral": "VIII",
            "value": 8
          },
          {
            "position": 9,
            "numeral": "IX",
            "value": 9
          },
          {
            "position": 10,
            "numeral": "X",
            "value": 10
          },
          {
            "position": 11,
            "numeral": "XI",
            "value": 11
          }
        ],
        "IIII": 4
      }
    },
    {
      "id": "minuteclock",
      "sessionId": "minuteclock",
      "index": 1,
      "nodeId": "mt_UNzojLkNdm",
      "type": "x-t32-stopwatch",
      "taskHash": "9dd0fb0bfcff980364973cd76d56a9d556cd885477d4bfb84b35e9494e1f9334",
      "answers": [
        "2"
      ],
      "actions": [
        {
          "action": "t32-start"
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 30
          }
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 30
          }
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 30
          }
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 30
          }
        },
        {
          "action": "t32-stop"
        },
        {
          "field": "answers.0",
          "value": "2"
        }
      ],
      "expected": {
        "durationSeconds": 120,
        "allowedVisibleTickSeconds": [
          10,
          30
        ],
        "exampleSimulatedTicks": [
          30,
          30,
          30,
          30
        ],
        "totalMinutes": "2",
        "wallClockMeasurement": false
      }
    },
    {
      "id": "quarterclock",
      "sessionId": "quarterclock",
      "index": 2,
      "nodeId": "mt_MgsDabdnr1",
      "type": "x-t32-parts",
      "taskHash": "7f0ed6e6fed925aec97e4f6f71ccae42d7d4490272d3bf757c6f0af6d1cffc8d",
      "answers": [
        "15"
      ],
      "actions": [
        {
          "action": "t32-part",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answers.0",
          "value": "15"
        }
      ],
      "expected": {
        "whole": 60,
        "equalParts": 4,
        "selectedCount": 1,
        "unitPartAmount": "15",
        "selectedAmount": "15",
        "unit": "分钟",
        "requiredIdentities": null,
        "equalPartitionGeneratedByTool": true,
        "intervals": [
          [
            "0",
            "15"
          ],
          [
            "15",
            "30"
          ],
          [
            "30",
            "45"
          ],
          [
            "45",
            "60"
          ]
        ]
      }
    },
    {
      "id": "weekmonth",
      "sessionId": "weekmonth",
      "index": 0,
      "nodeId": "mt_bj1YCgNWUx",
      "type": "x-t32-order",
      "taskHash": "f4e23d8151d6fa8e4b55079f9b42d0248c144d9439877b49e24c7d101ae05867",
      "answers": [],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 3
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 5
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 6
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 4
          }
        }
      ],
      "expected": {
        "values": [
          4,
          1,
          6,
          2,
          7,
          3,
          5
        ],
        "orderedIdentities": [
          1,
          3,
          5,
          0,
          6,
          2,
          4
        ],
        "orderedLabels": [
          "周一",
          "周二",
          "周三",
          "周四",
          "周五",
          "周六",
          "周日"
        ],
        "adjacentRelations": [
          [
            1,
            "<=",
            2
          ],
          [
            2,
            "<=",
            3
          ],
          [
            3,
            "<=",
            4
          ],
          [
            4,
            "<=",
            5
          ],
          [
            5,
            "<=",
            6
          ],
          [
            6,
            "<=",
            7
          ]
        ]
      }
    },
    {
      "id": "weekmonth",
      "sessionId": "weekmonth",
      "index": 1,
      "nodeId": "mt_bj1YCgNWUx",
      "type": "x-t32-order",
      "taskHash": "401288f7831468389159ed145b74ec74a69ea4880ee9e473327d9759826dd51e",
      "answers": [],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 6
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 3
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 8
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 10
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 5
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 11
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 9
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 7
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 4
          }
        }
      ],
      "expected": {
        "values": [
          5,
          1,
          9,
          3,
          12,
          7,
          2,
          11,
          4,
          10,
          6,
          8
        ],
        "orderedIdentities": [
          1,
          6,
          3,
          8,
          0,
          10,
          5,
          11,
          2,
          9,
          7,
          4
        ],
        "orderedLabels": [
          "1月",
          "2月",
          "3月",
          "4月",
          "5月",
          "6月",
          "7月",
          "8月",
          "9月",
          "10月",
          "11月",
          "12月"
        ],
        "adjacentRelations": [
          [
            1,
            "<=",
            2
          ],
          [
            2,
            "<=",
            3
          ],
          [
            3,
            "<=",
            4
          ],
          [
            4,
            "<=",
            5
          ],
          [
            5,
            "<=",
            6
          ],
          [
            6,
            "<=",
            7
          ],
          [
            7,
            "<=",
            8
          ],
          [
            8,
            "<=",
            9
          ],
          [
            9,
            "<=",
            10
          ],
          [
            10,
            "<=",
            11
          ],
          [
            11,
            "<=",
            12
          ]
        ]
      }
    }
  ],
  "excludedCases": [
    {
      "id": "timecompare",
      "sessionId": "timecompare",
      "index": 0,
      "nodeId": "mt_TcG90kS8nu",
      "type": "x-t32-compare",
      "taskHash": "9e91b309fa0c30ad81717335e7f5b11fe720b415444d05cd10363d10b5f465fa",
      "answers": [],
      "actions": [
        {
          "action": "t32-guess",
          "data": {
            "index": "right"
          }
        },
        {
          "action": "t32-reveal"
        },
        {
          "action": "t32-choice",
          "data": {
            "index": "right"
          }
        }
      ],
      "expected": {
        "kind": "longer",
        "comparedValues": [
          6,
          9
        ],
        "sourceDurationValues": [
          6,
          9
        ],
        "comparison": "right",
        "barsGeneratedByTool": true
      }
    },
    {
      "id": "timecompare",
      "sessionId": "timecompare",
      "index": 1,
      "nodeId": "mt_TcG90kS8nu",
      "type": "x-t32-compare",
      "taskHash": "69c4a41a687cc8470c09d7473ce2dd6d6ec9738906d3e63ab3918d9ceb4bfd7a",
      "answers": [],
      "actions": [
        {
          "action": "t32-guess",
          "data": {
            "index": "left"
          }
        },
        {
          "action": "t32-reveal"
        },
        {
          "action": "t32-choice",
          "data": {
            "index": "left"
          }
        }
      ],
      "expected": {
        "kind": "earlier",
        "comparedValues": [
          480,
          500
        ],
        "sourceDurationValues": [
          20,
          10
        ],
        "comparison": "left",
        "barsGeneratedByTool": true
      }
    },
    {
      "id": "timecompare",
      "sessionId": "timecompare",
      "index": 2,
      "nodeId": "mt_TcG90kS8nu",
      "type": "x-t32-compare",
      "taskHash": "d5b4e20f6b576a4df1eb972e219b01e182e28955889a02dbe6dd186a5cbe9823",
      "answers": [],
      "actions": [
        {
          "action": "t32-guess",
          "data": {
            "index": "right"
          }
        },
        {
          "action": "t32-reveal"
        },
        {
          "action": "t32-choice",
          "data": {
            "index": "right"
          }
        }
      ],
      "expected": {
        "kind": "first",
        "comparedValues": [
          570,
          560
        ],
        "sourceDurationValues": [
          30,
          10
        ],
        "comparison": "right",
        "barsGeneratedByTool": true
      }
    },
    {
      "id": "eventorder",
      "sessionId": "eventorder",
      "index": 0,
      "nodeId": "mt_-vvVxpOHG2",
      "type": "x-t32-order",
      "taskHash": "a06dfde4c6e4511a31d647e098d9544b062fee091985523fa6b69a600f54cd6c",
      "answers": [],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        }
      ],
      "expected": {
        "values": [
          2,
          1,
          3
        ],
        "orderedIdentities": [
          1,
          0,
          2
        ],
        "orderedLabels": [
          "起床",
          "早餐",
          "出门"
        ],
        "adjacentRelations": [
          [
            1,
            "<=",
            2
          ],
          [
            2,
            "<=",
            3
          ]
        ]
      }
    },
    {
      "id": "durationunit",
      "sessionId": "durationunit",
      "index": 2,
      "nodeId": "mt__N55B7u7HD",
      "type": "x-t32-units",
      "taskHash": "a4b8cc3ab8ca39557ad2f318869c86009190b05403c227878710fa8f1338a9d3",
      "answers": [
        "2",
        "120"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "field": "answers.0",
          "value": "2"
        },
        {
          "field": "answers.1",
          "value": "120"
        }
      ],
      "expected": {
        "sourceRelation": "1 min + 1 min = 2 min = 120 s",
        "preselectedDecomposition": [
          "1分钟",
          "1分钟"
        ],
        "decompositionChosenByChild": false
      }
    },
    {
      "id": "hoursday",
      "sessionId": "hoursday",
      "index": 0,
      "nodeId": "mt_2XDGT5tei1",
      "type": "x-t32-units",
      "taskHash": "212843e1f0b36c73b1eb788e2b94fc795e03a2396166de57b7435c8b70828302",
      "answers": [
        "60"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "field": "answers.0",
          "value": "60"
        }
      ],
      "expected": {
        "sourceRelation": "4 × 15 min = 60 min = 1 h",
        "preselectedDecomposition": [
          "15分钟",
          "15分钟",
          "15分钟",
          "15分钟"
        ],
        "decompositionChosenByChild": false
      }
    },
    {
      "id": "hoursday",
      "sessionId": "hoursday",
      "index": 1,
      "nodeId": "mt_2XDGT5tei1",
      "type": "x-t32-units",
      "taskHash": "bab632b8393c8e0224ce0e4e9b83bb4f46b8b6df20b4f5603ed0f71177a7c759",
      "answers": [
        "24"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "field": "answers.0",
          "value": "24"
        }
      ],
      "expected": {
        "sourceRelation": "2 × 12 h = 24 h",
        "preselectedDecomposition": [
          "第一轮12小时",
          "第二轮12小时"
        ],
        "decompositionChosenByChild": false
      }
    },
    {
      "id": "hoursday",
      "sessionId": "hoursday",
      "index": 2,
      "nodeId": "mt_2XDGT5tei1",
      "type": "x-t32-units",
      "taskHash": "cef8b68d985c09debdf129887cfe8fe1c2aee31756f8a7308cf7c71ec875bf0f",
      "answers": [
        "1",
        "30"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "field": "answers.0",
          "value": "1"
        },
        {
          "field": "answers.1",
          "value": "30"
        }
      ],
      "expected": {
        "sourceRelation": "90 min = 1 h + 30 min",
        "preselectedDecomposition": [
          "60分钟",
          "30分钟"
        ],
        "decompositionChosenByChild": false
      }
    },
    {
      "id": "durationorder",
      "sessionId": "durationorder",
      "index": 1,
      "nodeId": "mt_6XCURuNwPw",
      "type": "x-t32-compare",
      "taskHash": "6627f1b1c643b91cd1892579a1841d3af2ef7ea02447615e462786b441ba89d7",
      "answers": [],
      "actions": [
        {
          "action": "t32-guess",
          "data": {
            "index": "left"
          }
        },
        {
          "action": "t32-reveal"
        },
        {
          "action": "t32-choice",
          "data": {
            "index": "left"
          }
        }
      ],
      "expected": {
        "kind": "longer",
        "comparedValues": [
          30,
          20
        ],
        "sourceDurationValues": [
          30,
          20
        ],
        "comparison": "left",
        "barsGeneratedByTool": true
      }
    },
    {
      "id": "durationwork",
      "sessionId": "durationwork",
      "index": 1,
      "nodeId": "mt_4emC463IyW",
      "type": "x-t32-compare",
      "taskHash": "d92432fd9fe8c334f05fdc27f5724cc813cb3c1132f0eb05abef3f4b3c718b59",
      "answers": [
        "5"
      ],
      "actions": [
        {
          "action": "t32-guess",
          "data": {
            "index": "right"
          }
        },
        {
          "action": "t32-reveal"
        },
        {
          "action": "t32-choice",
          "data": {
            "index": "right"
          }
        },
        {
          "field": "answers.0",
          "value": "5"
        }
      ],
      "expected": {
        "kind": "longer",
        "comparedValues": [
          35,
          40
        ],
        "sourceDurationValues": [
          35,
          40
        ],
        "comparison": "right",
        "barsGeneratedByTool": true
      }
    },
    {
      "id": "hourclock",
      "sessionId": "hourclock",
      "index": 0,
      "nodeId": "mt_0XxyaQLRhn",
      "type": "x-t32-clock",
      "taskHash": "d86065076b0f0ccbc8bb41d082b06467cd096cdcc57b9a016f998db288f0067e",
      "answers": [
        "3:00"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "3:00"
        }
      ],
      "expected": {
        "hour12": 3,
        "minute": 0,
        "hourHandDegrees": "90",
        "minuteHandDegrees": 0,
        "clockMinutesWithin12Hours": 180,
        "clockMinutesWithin24Hours": 180,
        "anglesGeneratedByTool": true
      }
    },
    {
      "id": "hourclock",
      "sessionId": "hourclock",
      "index": 1,
      "nodeId": "mt_0XxyaQLRhn",
      "type": "x-t32-clock",
      "taskHash": "a74af01f7c613096be3818c7485786b27f5e4c76b1915e8898f9092081aa4eb5",
      "answers": [
        "7:30"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "7:30"
        }
      ],
      "expected": {
        "hour12": 7,
        "minute": 30,
        "hourHandDegrees": "225",
        "minuteHandDegrees": 180,
        "clockMinutesWithin12Hours": 450,
        "clockMinutesWithin24Hours": 450,
        "anglesGeneratedByTool": true
      }
    },
    {
      "id": "hourclock",
      "sessionId": "hourclock",
      "index": 2,
      "nodeId": "mt_0XxyaQLRhn",
      "type": "x-t32-clock",
      "taskHash": "03a76be11eb338e39d3077e0573e357c939302b1114eb8cd94f67c09120737b5",
      "answers": [
        "between"
      ],
      "actions": [
        {
          "field": "hour",
          "value": "2"
        },
        {
          "field": "minute",
          "value": "30"
        },
        {
          "field": "answers.0",
          "value": "between"
        }
      ],
      "expected": {
        "hour12": 2,
        "minute": 30,
        "hourHandDegrees": "75",
        "minuteHandDegrees": 180,
        "clockMinutesWithin12Hours": 150,
        "clockMinutesWithin24Hours": 150,
        "anglesGeneratedByTool": true
      }
    },
    {
      "id": "fiveclock",
      "sessionId": "fiveclock",
      "index": 0,
      "nodeId": "mt_HNOPGJYiRK",
      "type": "x-t32-clock",
      "taskHash": "ff9a191d4b44fa279a49c304edf57e6987ebacdad6d8a2b0dbfa927d36ce5ac7",
      "answers": [
        "3:25"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "3:25"
        }
      ],
      "expected": {
        "hour12": 3,
        "minute": 25,
        "hourHandDegrees": "205/2",
        "minuteHandDegrees": 150,
        "clockMinutesWithin12Hours": 205,
        "clockMinutesWithin24Hours": 205,
        "anglesGeneratedByTool": true
      }
    },
    {
      "id": "fiveclock",
      "sessionId": "fiveclock",
      "index": 1,
      "nodeId": "mt_HNOPGJYiRK",
      "type": "x-t32-clock",
      "taskHash": "391c4ec17a17e40e045c4723ca55268512ef8f2df056e806e30b30a26dc14e68",
      "answers": [
        "9:15"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "9:15"
        }
      ],
      "expected": {
        "hour12": 9,
        "minute": 15,
        "hourHandDegrees": "555/2",
        "minuteHandDegrees": 90,
        "clockMinutesWithin12Hours": 555,
        "clockMinutesWithin24Hours": 555,
        "anglesGeneratedByTool": true
      }
    },
    {
      "id": "fiveclock",
      "sessionId": "fiveclock",
      "index": 2,
      "nodeId": "mt_HNOPGJYiRK",
      "type": "x-t32-clock",
      "taskHash": "868c1a8d1ea31a79fe9f545bf6abed9b7b0164144e12dcd67d5f223923d8eb86",
      "answers": [
        "20"
      ],
      "actions": [
        {
          "field": "hour",
          "value": "3"
        },
        {
          "field": "minute",
          "value": "40"
        },
        {
          "field": "answers.0",
          "value": "20"
        }
      ],
      "expected": {
        "hour12": 3,
        "minute": 40,
        "hourHandDegrees": "110",
        "minuteHandDegrees": 240,
        "clockMinutesWithin12Hours": 220,
        "clockMinutesWithin24Hours": 220,
        "anglesGeneratedByTool": true
      }
    },
    {
      "id": "ampmclock",
      "sessionId": "ampmclock",
      "index": 0,
      "nodeId": "mt_4m8BimI4G5",
      "type": "x-t32-clock",
      "taskHash": "a0ff6021e3c967f23f40816fd723554785130240bb0966fe33f5b07283f0d553",
      "answers": [
        "8:45",
        "am"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "8:45"
        },
        {
          "field": "answers.1",
          "value": "am"
        }
      ],
      "expected": {
        "hour12": 8,
        "minute": 45,
        "hourHandDegrees": "525/2",
        "minuteHandDegrees": 270,
        "clockMinutesWithin12Hours": 525,
        "clockMinutesWithin24Hours": 525,
        "anglesGeneratedByTool": true
      }
    },
    {
      "id": "ampmclock",
      "sessionId": "ampmclock",
      "index": 1,
      "nodeId": "mt_4m8BimI4G5",
      "type": "x-t32-clock",
      "taskHash": "7bbb7f565baf1fcceac2a99d853b71140a9d16d05047cbedcaca75ba80f6495c",
      "answers": [
        "4:25",
        "pm"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "4:25"
        },
        {
          "field": "answers.1",
          "value": "pm"
        }
      ],
      "expected": {
        "hour12": 4,
        "minute": 25,
        "hourHandDegrees": "265/2",
        "minuteHandDegrees": 150,
        "clockMinutesWithin12Hours": 265,
        "clockMinutesWithin24Hours": 985,
        "anglesGeneratedByTool": true
      }
    },
    {
      "id": "ampmclock",
      "sessionId": "ampmclock",
      "index": 2,
      "nodeId": "mt_4m8BimI4G5",
      "type": "x-t32-units",
      "taskHash": "2e1eccd3687fcc14db1fdea4610ad8d7b55e0219325b63362e9d8b04184e6d3c",
      "answers": [
        "night"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "field": "answers.0",
          "value": "night"
        }
      ],
      "expected": {
        "sourceRelation": "12:20 = 740 min from midnight; 00:20 = 20 min",
        "preselectedDecomposition": [
          "中午后 12:20",
          "午夜后 00:20"
        ],
        "decompositionChosenByChild": false
      }
    },
    {
      "id": "romanclock",
      "sessionId": "romanclock",
      "index": 0,
      "nodeId": "mt_5J2quSTspi",
      "type": "x-t32-clock",
      "taskHash": "15e4378c1d04b7f99d89b2ce891750b8c8715e5cc48a16de0656df46e2abb6c6",
      "answers": [
        "4:45"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "4:45"
        }
      ],
      "expected": {
        "hour12": 4,
        "minute": 45,
        "hourHandDegrees": "285/2",
        "minuteHandDegrees": 270,
        "clockMinutesWithin12Hours": 285,
        "clockMinutesWithin24Hours": 285,
        "anglesGeneratedByTool": true
      }
    },
    {
      "id": "romanclock",
      "sessionId": "romanclock",
      "index": 2,
      "nodeId": "mt_5J2quSTspi",
      "type": "x-t32-units",
      "taskHash": "41bd633d375cda7ab04d3059e3ab1bb8e7f47ad2005efb8529a7d1a2062da0bd",
      "answers": [
        "15:20",
        "07:05",
        "12:20",
        "00:20"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "field": "answers.0",
          "value": "15:20"
        },
        {
          "field": "answers.1",
          "value": "07:05"
        },
        {
          "field": "answers.2",
          "value": "12:20"
        },
        {
          "field": "answers.3",
          "value": "00:20"
        }
      ],
      "expected": {
        "sourceRelation": "15:20, 07:05, 12:20, 00:20; twelve-hour wording needs explicit noon/midnight context",
        "preselectedDecomposition": [
          "下午3:20",
          "上午7:05",
          "中午后12:20",
          "午夜后12:20"
        ],
        "decompositionChosenByChild": false
      }
    },
    {
      "id": "minuteclock",
      "sessionId": "minuteclock",
      "index": 0,
      "nodeId": "mt_UNzojLkNdm",
      "type": "x-t32-clock",
      "taskHash": "e9e12f0560208d9c752915bae463f19d810dca117e32ebd33d4c96219e460199",
      "answers": [
        "7:43"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "7:43"
        }
      ],
      "expected": {
        "hour12": 7,
        "minute": 43,
        "hourHandDegrees": "463/2",
        "minuteHandDegrees": 258,
        "clockMinutesWithin12Hours": 463,
        "clockMinutesWithin24Hours": 463,
        "anglesGeneratedByTool": true
      }
    },
    {
      "id": "minuteclock",
      "sessionId": "minuteclock",
      "index": 2,
      "nodeId": "mt_UNzojLkNdm",
      "type": "x-t32-compare",
      "taskHash": "edea6b52305fe1234b6660d1517eb3b2d9dee30b198da0f4677b89f302541d4e",
      "answers": [
        "5"
      ],
      "actions": [
        {
          "action": "t32-guess",
          "data": {
            "index": "left"
          }
        },
        {
          "action": "t32-reveal"
        },
        {
          "action": "t32-choice",
          "data": {
            "index": "left"
          }
        },
        {
          "field": "answers.0",
          "value": "5"
        }
      ],
      "expected": {
        "kind": "longer",
        "comparedValues": [
          80,
          75
        ],
        "sourceDurationValues": [
          80,
          75
        ],
        "comparison": "left",
        "barsGeneratedByTool": true
      }
    },
    {
      "id": "clockconvert",
      "sessionId": "clockconvert",
      "index": 0,
      "nodeId": "mt_WfrE_4r-kY",
      "type": "x-t32-clock",
      "taskHash": "6a8da8fe540466f6574e146dd411f885cf3670530ecc2b64879350ae04c08d51",
      "answers": [
        "15:45"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "15:45"
        }
      ],
      "expected": {
        "hour12": 3,
        "minute": 45,
        "hourHandDegrees": "225/2",
        "minuteHandDegrees": 270,
        "clockMinutesWithin12Hours": 225,
        "clockMinutesWithin24Hours": 945,
        "anglesGeneratedByTool": true
      }
    },
    {
      "id": "clockconvert",
      "sessionId": "clockconvert",
      "index": 1,
      "nodeId": "mt_WfrE_4r-kY",
      "type": "x-t32-clock",
      "taskHash": "f38448cd8dcf3f7783c071d05fa9f78de43048eafce82e1724567f41ac1dee70",
      "answers": [
        "7:30",
        "pm"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "7:30"
        },
        {
          "field": "answers.1",
          "value": "pm"
        }
      ],
      "expected": {
        "hour12": 7,
        "minute": 30,
        "hourHandDegrees": "225",
        "minuteHandDegrees": 180,
        "clockMinutesWithin12Hours": 450,
        "clockMinutesWithin24Hours": 1170,
        "anglesGeneratedByTool": true
      }
    },
    {
      "id": "clockconvert",
      "sessionId": "clockconvert",
      "index": 2,
      "nodeId": "mt_WfrE_4r-kY",
      "type": "x-t32-units",
      "taskHash": "d2e443e7b91877d239d6b9a40637d176836385d94f40a0910b1f91d946fceb20",
      "answers": [
        "00:20",
        "12:20"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "field": "answers.0",
          "value": "00:20"
        },
        {
          "field": "answers.1",
          "value": "12:20"
        }
      ],
      "expected": {
        "sourceRelation": "midnight 12:20 → 00:20; noon 12:20 → 12:20",
        "preselectedDecomposition": [
          "午夜后 12:20",
          "中午后 12:20"
        ],
        "decompositionChosenByChild": false
      }
    },
    {
      "id": "timeconvert",
      "sessionId": "timeconvert",
      "index": 0,
      "nodeId": "mt_2yas4Unc8o",
      "type": "x-t32-units",
      "taskHash": "1bae521a58580ee0fe402c19cf0f3d3aa946368e84fd42b3e1a2991f54aded92",
      "answers": [
        "205"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "field": "answers.0",
          "value": "205"
        }
      ],
      "expected": {
        "sourceRelation": "3 × 60 min + 25 min = 205 min",
        "preselectedDecomposition": [
          "1小时",
          "1小时",
          "1小时",
          "25分钟"
        ],
        "decompositionChosenByChild": false
      }
    },
    {
      "id": "timeconvert",
      "sessionId": "timeconvert",
      "index": 1,
      "nodeId": "mt_2yas4Unc8o",
      "type": "x-t32-units",
      "taskHash": "2635aa3849d226069eb93f7f6efe01c25bb497f54034837d2ab98ccecf1c40ec",
      "answers": [
        "2",
        "30"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "field": "answers.0",
          "value": "2"
        },
        {
          "field": "answers.1",
          "value": "30"
        }
      ],
      "expected": {
        "sourceRelation": "150 s = 2 × 60 s + 30 s = 2 min 30 s",
        "preselectedDecomposition": [
          "60秒",
          "60秒",
          "30秒"
        ],
        "decompositionChosenByChild": false
      }
    },
    {
      "id": "timeconvert",
      "sessionId": "timeconvert",
      "index": 2,
      "nodeId": "mt_2yas4Unc8o",
      "type": "x-t32-units",
      "taskHash": "b4bdce5c9ab7c5c273aed81f2d2daeb33dfa3ccf22c838df1b21e5948bbe899a",
      "answers": [
        "59"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 4
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 5
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 6
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 7
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 8
          }
        },
        {
          "field": "answers.0",
          "value": "59"
        }
      ],
      "expected": {
        "sourceRelation": "8 × 7 d + 3 d = 59 d",
        "preselectedDecomposition": [
          "1周",
          "1周",
          "1周",
          "1周",
          "1周",
          "1周",
          "1周",
          "1周",
          "3天"
        ],
        "decompositionChosenByChild": false
      }
    },
    {
      "id": "quarterclock",
      "sessionId": "quarterclock",
      "index": 0,
      "nodeId": "mt_MgsDabdnr1",
      "type": "x-t32-clock",
      "taskHash": "eb4272e062b7eacb6a05eef7dfd57fa07138cb5414dbad92eb9ed32a87a0ff18",
      "answers": [
        "3:15",
        "past"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "3:15"
        },
        {
          "field": "answers.1",
          "value": "past"
        }
      ],
      "expected": {
        "hour12": 3,
        "minute": 15,
        "hourHandDegrees": "195/2",
        "minuteHandDegrees": 90,
        "clockMinutesWithin12Hours": 195,
        "clockMinutesWithin24Hours": 195,
        "anglesGeneratedByTool": true
      }
    },
    {
      "id": "quarterclock",
      "sessionId": "quarterclock",
      "index": 1,
      "nodeId": "mt_MgsDabdnr1",
      "type": "x-t32-clock",
      "taskHash": "3f0960356dc2c5af49fe123510405d94fb3af43daa12241f523342128f76d712",
      "answers": [
        "15"
      ],
      "actions": [
        {
          "field": "hour",
          "value": "6"
        },
        {
          "field": "minute",
          "value": "45"
        },
        {
          "field": "answers.0",
          "value": "15"
        }
      ],
      "expected": {
        "hour12": 6,
        "minute": 45,
        "hourHandDegrees": "405/2",
        "minuteHandDegrees": 270,
        "clockMinutesWithin12Hours": 405,
        "clockMinutesWithin24Hours": 405,
        "anglesGeneratedByTool": true
      }
    },
    {
      "id": "weekmonth",
      "sessionId": "weekmonth",
      "index": 2,
      "nodeId": "mt_bj1YCgNWUx",
      "type": "x-t32-units",
      "taskHash": "7b83984d0003c5eff02b97fe4cec70befd0f18177aa12a3f1039e8363beadaca",
      "answers": [
        "12",
        "7"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 4
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 5
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 6
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 7
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 8
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 9
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 10
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 11
          }
        },
        {
          "field": "answers.0",
          "value": "12"
        },
        {
          "field": "answers.1",
          "value": "7"
        }
      ],
      "expected": {
        "sourceRelation": "12 months per year; 7 days per week; calendar month lengths are not a fixed day unit",
        "preselectedDecomposition": [
          "1月",
          "2月",
          "3月",
          "4月",
          "5月",
          "6月",
          "7月",
          "8月",
          "9月",
          "10月",
          "11月",
          "12月"
        ],
        "decompositionChosenByChild": false
      }
    },
    {
      "id": "calendarfacts",
      "sessionId": "calendarfacts",
      "index": 0,
      "nodeId": "mt_EXlmTURK_o",
      "type": "x-t32-units",
      "taskHash": "56655e258936575429bca55375504ac92cb9b58d05a55b75aad0053205c4f14d",
      "answers": [
        "60"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "field": "answers.0",
          "value": "60"
        }
      ],
      "expected": {
        "sourceRelation": "4 × 15 s = 60 s = 1 min",
        "preselectedDecomposition": [
          "15秒",
          "15秒",
          "15秒",
          "15秒"
        ],
        "decompositionChosenByChild": false
      }
    },
    {
      "id": "calendarfacts",
      "sessionId": "calendarfacts",
      "index": 1,
      "nodeId": "mt_EXlmTURK_o",
      "type": "x-t32-units",
      "taskHash": "d1b0ee036acf3aa56ebe9c4e228dd7a62d9383af23fc7773cce8dd48450a7546",
      "answers": [
        "30",
        "28"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 4
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 5
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 6
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 7
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 8
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 9
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 10
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 11
          }
        },
        {
          "field": "answers.0",
          "value": "30"
        },
        {
          "field": "answers.1",
          "value": "28"
        }
      ],
      "expected": {
        "sourceRelation": "Gregorian April 30 d; common-year February 28 d",
        "preselectedDecomposition": [
          "1月31天",
          "2月28天",
          "3月31天",
          "4月30天",
          "5月31天",
          "6月30天",
          "7月31天",
          "8月31天",
          "9月30天",
          "10月31天",
          "11月30天",
          "12月31天"
        ],
        "decompositionChosenByChild": false
      }
    },
    {
      "id": "calendarfacts",
      "sessionId": "calendarfacts",
      "index": 2,
      "nodeId": "mt_EXlmTURK_o",
      "type": "x-t32-calendar",
      "taskHash": "390f8a2b5586fb42b0e9aca8c10a64b7b9ec70fb8f6223fe97905f2e5ba68a74",
      "answers": [
        "366",
        "common",
        "leap"
      ],
      "actions": [
        {
          "action": "t32-day",
          "data": {
            "index": "2024-02-29"
          }
        },
        {
          "field": "answers.0",
          "value": "366"
        },
        {
          "field": "answers.1",
          "value": "common"
        },
        {
          "field": "answers.2",
          "value": "leap"
        }
      ],
      "expected": {
        "dates": [
          {
            "date": "2024-02-29",
            "weekdayMondayZero": 3
          }
        ],
        "leap": {
          "2024": true
        }
      }
    },
    {
      "id": "calendaruse",
      "sessionId": "calendaruse",
      "index": 0,
      "nodeId": "mt_tVvZVWO5d6",
      "type": "x-t32-calendar",
      "taskHash": "18d0ebb351f38e6fc6a9e41e7a036c80c19b85dc7e430dd0632617303e0c4f2c",
      "answers": [
        "sun"
      ],
      "actions": [
        {
          "action": "t32-day",
          "data": {
            "index": "2026-03-15"
          }
        },
        {
          "field": "answers.0",
          "value": "sun"
        }
      ],
      "expected": {
        "dates": [
          {
            "date": "2026-03-15",
            "weekdayMondayZero": 6
          }
        ],
        "leap": {
          "2026": false
        }
      }
    },
    {
      "id": "calendaruse",
      "sessionId": "calendaruse",
      "index": 1,
      "nodeId": "mt_tVvZVWO5d6",
      "type": "x-t32-calendar",
      "taskHash": "654994f34cef51db6825efea7ad6ddf25b1620b60016d66df1bea53765ed3d94",
      "answers": [
        "18"
      ],
      "actions": [
        {
          "action": "t32-day",
          "data": {
            "index": "2026-03-18"
          }
        },
        {
          "field": "answers.0",
          "value": "18"
        }
      ],
      "expected": {
        "dates": [
          {
            "date": "2026-03-18",
            "weekdayMondayZero": 2
          }
        ],
        "leap": {
          "2026": false
        }
      }
    },
    {
      "id": "calendaruse",
      "sessionId": "calendaruse",
      "index": 2,
      "nodeId": "mt_tVvZVWO5d6",
      "type": "x-t32-calendar",
      "taskHash": "0a1c94be2c27273dec8643548e92a0b6982372ce8da6fdb231cdbdba2ec4a8af",
      "answers": [
        "14"
      ],
      "actions": [
        {
          "action": "t32-day",
          "data": {
            "index": "2026-06-03"
          }
        },
        {
          "action": "t32-day",
          "data": {
            "index": "2026-06-17"
          }
        },
        {
          "field": "answers.0",
          "value": "14"
        }
      ],
      "expected": {
        "dates": [
          {
            "date": "2026-06-03",
            "weekdayMondayZero": 2
          },
          {
            "date": "2026-06-17",
            "weekdayMondayZero": 2
          }
        ],
        "leap": {
          "2026": false
        },
        "elapsedDaysExcludingStart": 14
      }
    },
    {
      "id": "calendaruse",
      "sessionId": "calendaruse",
      "index": 3,
      "nodeId": "mt_tVvZVWO5d6",
      "type": "x-t32-calendar",
      "taskHash": "e8907a46c2676f70d17276230648ee5fc7556ac5e760c2dde24f7743af95ae3b",
      "answers": [
        "2"
      ],
      "actions": [
        {
          "action": "t32-page",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-day",
          "data": {
            "index": "2024-02-28"
          }
        },
        {
          "action": "t32-page",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-day",
          "data": {
            "index": "2024-03-01"
          }
        },
        {
          "field": "answers.0",
          "value": "2"
        }
      ],
      "expected": {
        "dates": [
          {
            "date": "2024-02-28",
            "weekdayMondayZero": 2
          },
          {
            "date": "2024-03-01",
            "weekdayMondayZero": 4
          }
        ],
        "leap": {
          "2024": true
        },
        "elapsedDaysExcludingStart": 2
      }
    },
    {
      "id": "precise38",
      "sessionId": "precise38",
      "index": 3,
      "nodeId": "mt_mywsN77hGZ",
      "type": "x-t32-clock",
      "taskHash": "6a8da8fe540466f6574e146dd411f885cf3670530ecc2b64879350ae04c08d51",
      "answers": [
        "15:45"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "15:45"
        }
      ],
      "expected": {
        "hour12": 3,
        "minute": 45,
        "hourHandDegrees": "225/2",
        "minuteHandDegrees": 270,
        "clockMinutesWithin12Hours": 225,
        "clockMinutesWithin24Hours": 945,
        "anglesGeneratedByTool": true
      }
    }
  ],
  "associatedCases": [
    {
      "id": "link-write20-hourclock",
      "sessionId": "link-write20-hourclock",
      "index": 0,
      "nodeId": "mt_0XxyaQLRhn",
      "type": "x-t32-order",
      "taskHash": "1a5cbff69a5d44df0b36ea3296ac6ee10db6ad0bce923a35cb3fc1b6d86553ab",
      "answers": [],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 3
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        }
      ],
      "expected": {
        "values": [
          3,
          1,
          4,
          2
        ],
        "orderedIdentities": [
          1,
          3,
          0,
          2
        ],
        "orderedLabels": [
          "1",
          "2",
          "3",
          "4"
        ],
        "adjacentRelations": [
          [
            1,
            "<=",
            2
          ],
          [
            2,
            "<=",
            3
          ],
          [
            3,
            "<=",
            4
          ]
        ]
      },
      "fromNodeId": "mt_fR0UtsSREU",
      "toNodeId": "mt_0XxyaQLRhn"
    },
    {
      "id": "link-write20-hourclock",
      "sessionId": "link-write20-hourclock",
      "index": 1,
      "nodeId": "mt_0XxyaQLRhn",
      "type": "x-t32-clock",
      "taskHash": "d86065076b0f0ccbc8bb41d082b06467cd096cdcc57b9a016f998db288f0067e",
      "answers": [
        "3:00"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "3:00"
        }
      ],
      "expected": {
        "hour12": 3,
        "minute": 0,
        "hourHandDegrees": "90",
        "minuteHandDegrees": 0,
        "clockMinutesWithin12Hours": 180,
        "clockMinutesWithin24Hours": 180,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_fR0UtsSREU",
      "toNodeId": "mt_0XxyaQLRhn"
    },
    {
      "id": "link-halfpaper-hourclock",
      "sessionId": "link-halfpaper-hourclock",
      "index": 1,
      "nodeId": "mt_0XxyaQLRhn",
      "type": "x-t32-clock",
      "taskHash": "a74af01f7c613096be3818c7485786b27f5e4c76b1915e8898f9092081aa4eb5",
      "answers": [
        "7:30"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "7:30"
        }
      ],
      "expected": {
        "hour12": 7,
        "minute": 30,
        "hourHandDegrees": "225",
        "minuteHandDegrees": 180,
        "clockMinutesWithin12Hours": 450,
        "clockMinutesWithin24Hours": 450,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_-hTTat0mBR",
      "toNodeId": "mt_0XxyaQLRhn"
    },
    {
      "id": "link-durationunit-hourclock",
      "sessionId": "link-durationunit-hourclock",
      "index": 0,
      "nodeId": "mt_0XxyaQLRhn",
      "type": "x-t32-stopwatch",
      "taskHash": "e5f6d06ff99e64596efb2ed0e532488a638a1f5491c93dc9ec36887afdf503ab",
      "answers": [
        "1"
      ],
      "actions": [
        {
          "action": "t32-start"
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 30
          }
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 30
          }
        },
        {
          "action": "t32-stop"
        },
        {
          "field": "answers.0",
          "value": "1"
        }
      ],
      "expected": {
        "durationSeconds": 60,
        "allowedVisibleTickSeconds": [
          10,
          30
        ],
        "exampleSimulatedTicks": [
          30,
          30
        ],
        "totalMinutes": "1",
        "wallClockMeasurement": false
      },
      "fromNodeId": "mt__N55B7u7HD",
      "toNodeId": "mt_0XxyaQLRhn"
    },
    {
      "id": "link-durationunit-hourclock",
      "sessionId": "link-durationunit-hourclock",
      "index": 1,
      "nodeId": "mt_0XxyaQLRhn",
      "type": "x-t32-clock",
      "taskHash": "a74af01f7c613096be3818c7485786b27f5e4c76b1915e8898f9092081aa4eb5",
      "answers": [
        "7:30"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "7:30"
        }
      ],
      "expected": {
        "hour12": 7,
        "minute": 30,
        "hourHandDegrees": "225",
        "minuteHandDegrees": 180,
        "clockMinutesWithin12Hours": 450,
        "clockMinutesWithin24Hours": 450,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt__N55B7u7HD",
      "toNodeId": "mt_0XxyaQLRhn"
    },
    {
      "id": "link-durationunit-hoursday",
      "sessionId": "link-durationunit-hoursday",
      "index": 0,
      "nodeId": "mt_2XDGT5tei1",
      "type": "x-t32-stopwatch",
      "taskHash": "e5f6d06ff99e64596efb2ed0e532488a638a1f5491c93dc9ec36887afdf503ab",
      "answers": [
        "1"
      ],
      "actions": [
        {
          "action": "t32-start"
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 30
          }
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 30
          }
        },
        {
          "action": "t32-stop"
        },
        {
          "field": "answers.0",
          "value": "1"
        }
      ],
      "expected": {
        "durationSeconds": 60,
        "allowedVisibleTickSeconds": [
          10,
          30
        ],
        "exampleSimulatedTicks": [
          30,
          30
        ],
        "totalMinutes": "1",
        "wallClockMeasurement": false
      },
      "fromNodeId": "mt__N55B7u7HD",
      "toNodeId": "mt_2XDGT5tei1"
    },
    {
      "id": "link-durationunit-hoursday",
      "sessionId": "link-durationunit-hoursday",
      "index": 1,
      "nodeId": "mt_2XDGT5tei1",
      "type": "x-t32-units",
      "taskHash": "212843e1f0b36c73b1eb788e2b94fc795e03a2396166de57b7435c8b70828302",
      "answers": [
        "60"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "field": "answers.0",
          "value": "60"
        }
      ],
      "expected": {
        "sourceRelation": "4 × 15 min = 60 min = 1 h",
        "preselectedDecomposition": [
          "15分钟",
          "15分钟",
          "15分钟",
          "15分钟"
        ],
        "decompositionChosenByChild": false
      },
      "fromNodeId": "mt__N55B7u7HD",
      "toNodeId": "mt_2XDGT5tei1"
    },
    {
      "id": "link-baseconversions-timeconvert",
      "sessionId": "link-baseconversions-timeconvert",
      "index": 1,
      "nodeId": "mt_2yas4Unc8o",
      "type": "x-t32-units",
      "taskHash": "1bae521a58580ee0fe402c19cf0f3d3aa946368e84fd42b3e1a2991f54aded92",
      "answers": [
        "205"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "field": "answers.0",
          "value": "205"
        }
      ],
      "expected": {
        "sourceRelation": "3 × 60 min + 25 min = 205 min",
        "preselectedDecomposition": [
          "1小时",
          "1小时",
          "1小时",
          "25分钟"
        ],
        "decompositionChosenByChild": false
      },
      "fromNodeId": "mt_d8al9JcajP",
      "toNodeId": "mt_2yas4Unc8o"
    },
    {
      "id": "link-elapsedtime-timeconvert",
      "sessionId": "link-elapsedtime-timeconvert",
      "index": 0,
      "nodeId": "mt_2yas4Unc8o",
      "type": "x-t32-steps",
      "taskHash": "199c753891b28c7a19cb026e3e6a17853bfd56d380efb01c6d61dde2d8702c6c",
      "answers": [
        "45"
      ],
      "actions": [
        {
          "field": "jump",
          "value": "40"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "jump",
          "value": "5"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "answers.0",
          "value": "45"
        }
      ],
      "expected": {
        "startMinutes": 560,
        "endMinutes": 605,
        "durationMinutes": 45,
        "exampleChosenSegments": [
          40,
          5
        ],
        "balances": [
          560,
          600,
          605
        ],
        "displayedClocks": [
          "09:20",
          "10:00",
          "10:05"
        ],
        "timeCoordinatesGeneratedByTool": true
      },
      "fromNodeId": "mt_IL86kadLSS",
      "toNodeId": "mt_2yas4Unc8o"
    },
    {
      "id": "link-elapsedtime-timeconvert",
      "sessionId": "link-elapsedtime-timeconvert",
      "index": 1,
      "nodeId": "mt_2yas4Unc8o",
      "type": "x-t32-units",
      "taskHash": "1bae521a58580ee0fe402c19cf0f3d3aa946368e84fd42b3e1a2991f54aded92",
      "answers": [
        "205"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "field": "answers.0",
          "value": "205"
        }
      ],
      "expected": {
        "sourceRelation": "3 × 60 min + 25 min = 205 min",
        "preselectedDecomposition": [
          "1小时",
          "1小时",
          "1小时",
          "25分钟"
        ],
        "decompositionChosenByChild": false
      },
      "fromNodeId": "mt_IL86kadLSS",
      "toNodeId": "mt_2yas4Unc8o"
    },
    {
      "id": "link-calendarfacts-durationwork",
      "sessionId": "link-calendarfacts-durationwork",
      "index": 0,
      "nodeId": "mt_4emC463IyW",
      "type": "x-t32-units",
      "taskHash": "56655e258936575429bca55375504ac92cb9b58d05a55b75aad0053205c4f14d",
      "answers": [
        "60"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "field": "answers.0",
          "value": "60"
        }
      ],
      "expected": {
        "sourceRelation": "4 × 15 s = 60 s = 1 min",
        "preselectedDecomposition": [
          "15秒",
          "15秒",
          "15秒",
          "15秒"
        ],
        "decompositionChosenByChild": false
      },
      "fromNodeId": "mt_EXlmTURK_o",
      "toNodeId": "mt_4emC463IyW"
    },
    {
      "id": "link-calendarfacts-durationwork",
      "sessionId": "link-calendarfacts-durationwork",
      "index": 1,
      "nodeId": "mt_4emC463IyW",
      "type": "x-t32-steps",
      "taskHash": "90242a80c5d2f9ee6e2de57ed8b371ece43ea5dfbed90c959b30a0631df82daa",
      "answers": [
        "26"
      ],
      "actions": [
        {
          "field": "jump",
          "value": "13"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "jump",
          "value": "13"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "answers.0",
          "value": "26"
        }
      ],
      "expected": {
        "startMinutes": 1037,
        "endMinutes": 1063,
        "durationMinutes": 26,
        "exampleChosenSegments": [
          13,
          13
        ],
        "balances": [
          1037,
          1050,
          1063
        ],
        "displayedClocks": [
          "17:17",
          "17:30",
          "17:43"
        ],
        "timeCoordinatesGeneratedByTool": true
      },
      "fromNodeId": "mt_EXlmTURK_o",
      "toNodeId": "mt_4emC463IyW"
    },
    {
      "id": "link-minuteclock-durationwork",
      "sessionId": "link-minuteclock-durationwork",
      "index": 0,
      "nodeId": "mt_4emC463IyW",
      "type": "x-t32-clock",
      "taskHash": "e9e12f0560208d9c752915bae463f19d810dca117e32ebd33d4c96219e460199",
      "answers": [
        "7:43"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "7:43"
        }
      ],
      "expected": {
        "hour12": 7,
        "minute": 43,
        "hourHandDegrees": "463/2",
        "minuteHandDegrees": 258,
        "clockMinutesWithin12Hours": 463,
        "clockMinutesWithin24Hours": 463,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_UNzojLkNdm",
      "toNodeId": "mt_4emC463IyW"
    },
    {
      "id": "link-minuteclock-durationwork",
      "sessionId": "link-minuteclock-durationwork",
      "index": 1,
      "nodeId": "mt_4emC463IyW",
      "type": "x-t32-steps",
      "taskHash": "90242a80c5d2f9ee6e2de57ed8b371ece43ea5dfbed90c959b30a0631df82daa",
      "answers": [
        "26"
      ],
      "actions": [
        {
          "field": "jump",
          "value": "13"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "jump",
          "value": "13"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "answers.0",
          "value": "26"
        }
      ],
      "expected": {
        "startMinutes": 1037,
        "endMinutes": 1063,
        "durationMinutes": 26,
        "exampleChosenSegments": [
          13,
          13
        ],
        "balances": [
          1037,
          1050,
          1063
        ],
        "displayedClocks": [
          "17:17",
          "17:30",
          "17:43"
        ],
        "timeCoordinatesGeneratedByTool": true
      },
      "fromNodeId": "mt_UNzojLkNdm",
      "toNodeId": "mt_4emC463IyW"
    },
    {
      "id": "link-fiveclock-ampmclock",
      "sessionId": "link-fiveclock-ampmclock",
      "index": 0,
      "nodeId": "mt_4m8BimI4G5",
      "type": "x-t32-clock",
      "taskHash": "ff9a191d4b44fa279a49c304edf57e6987ebacdad6d8a2b0dbfa927d36ce5ac7",
      "answers": [
        "3:25"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "3:25"
        }
      ],
      "expected": {
        "hour12": 3,
        "minute": 25,
        "hourHandDegrees": "205/2",
        "minuteHandDegrees": 150,
        "clockMinutesWithin12Hours": 205,
        "clockMinutesWithin24Hours": 205,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_HNOPGJYiRK",
      "toNodeId": "mt_4m8BimI4G5"
    },
    {
      "id": "link-fiveclock-ampmclock",
      "sessionId": "link-fiveclock-ampmclock",
      "index": 1,
      "nodeId": "mt_4m8BimI4G5",
      "type": "x-t32-clock",
      "taskHash": "a0ff6021e3c967f23f40816fd723554785130240bb0966fe33f5b07283f0d553",
      "answers": [
        "8:45",
        "am"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "8:45"
        },
        {
          "field": "answers.1",
          "value": "am"
        }
      ],
      "expected": {
        "hour12": 8,
        "minute": 45,
        "hourHandDegrees": "525/2",
        "minuteHandDegrees": 270,
        "clockMinutesWithin12Hours": 525,
        "clockMinutesWithin24Hours": 525,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_HNOPGJYiRK",
      "toNodeId": "mt_4m8BimI4G5"
    },
    {
      "id": "link-ampmclock-romanclock",
      "sessionId": "link-ampmclock-romanclock",
      "index": 0,
      "nodeId": "mt_5J2quSTspi",
      "type": "x-t32-clock",
      "taskHash": "7bbb7f565baf1fcceac2a99d853b71140a9d16d05047cbedcaca75ba80f6495c",
      "answers": [
        "4:25",
        "pm"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "4:25"
        },
        {
          "field": "answers.1",
          "value": "pm"
        }
      ],
      "expected": {
        "hour12": 4,
        "minute": 25,
        "hourHandDegrees": "265/2",
        "minuteHandDegrees": 150,
        "clockMinutesWithin12Hours": 265,
        "clockMinutesWithin24Hours": 985,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_4m8BimI4G5",
      "toNodeId": "mt_5J2quSTspi"
    },
    {
      "id": "link-ampmclock-romanclock",
      "sessionId": "link-ampmclock-romanclock",
      "index": 1,
      "nodeId": "mt_5J2quSTspi",
      "type": "x-t32-clock",
      "taskHash": "15e4378c1d04b7f99d89b2ce891750b8c8715e5cc48a16de0656df46e2abb6c6",
      "answers": [
        "4:45"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "4:45"
        }
      ],
      "expected": {
        "hour12": 4,
        "minute": 45,
        "hourHandDegrees": "285/2",
        "minuteHandDegrees": 270,
        "clockMinutesWithin12Hours": 285,
        "clockMinutesWithin24Hours": 285,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_4m8BimI4G5",
      "toNodeId": "mt_5J2quSTspi"
    },
    {
      "id": "link-fiveclock-romanclock",
      "sessionId": "link-fiveclock-romanclock",
      "index": 0,
      "nodeId": "mt_5J2quSTspi",
      "type": "x-t32-clock",
      "taskHash": "ff9a191d4b44fa279a49c304edf57e6987ebacdad6d8a2b0dbfa927d36ce5ac7",
      "answers": [
        "3:25"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "3:25"
        }
      ],
      "expected": {
        "hour12": 3,
        "minute": 25,
        "hourHandDegrees": "205/2",
        "minuteHandDegrees": 150,
        "clockMinutesWithin12Hours": 205,
        "clockMinutesWithin24Hours": 205,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_HNOPGJYiRK",
      "toNodeId": "mt_5J2quSTspi"
    },
    {
      "id": "link-fiveclock-romanclock",
      "sessionId": "link-fiveclock-romanclock",
      "index": 1,
      "nodeId": "mt_5J2quSTspi",
      "type": "x-t32-clock",
      "taskHash": "15e4378c1d04b7f99d89b2ce891750b8c8715e5cc48a16de0656df46e2abb6c6",
      "answers": [
        "4:45"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "4:45"
        }
      ],
      "expected": {
        "hour12": 4,
        "minute": 45,
        "hourHandDegrees": "285/2",
        "minuteHandDegrees": 270,
        "clockMinutesWithin12Hours": 285,
        "clockMinutesWithin24Hours": 285,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_HNOPGJYiRK",
      "toNodeId": "mt_5J2quSTspi"
    },
    {
      "id": "link-durationunit-durationorder",
      "sessionId": "link-durationunit-durationorder",
      "index": 0,
      "nodeId": "mt_6XCURuNwPw",
      "type": "x-t32-stopwatch",
      "taskHash": "3e193fcbc141c375f2d6ef786aefb9ec4725b05a444c9ca7dec8f8ab8e9d0860",
      "answers": [
        "20"
      ],
      "actions": [
        {
          "action": "t32-start"
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 10
          }
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 10
          }
        },
        {
          "action": "t32-stop"
        },
        {
          "field": "answers.0",
          "value": "20"
        }
      ],
      "expected": {
        "durationSeconds": 20,
        "allowedVisibleTickSeconds": [
          10,
          30
        ],
        "exampleSimulatedTicks": [
          10,
          10
        ],
        "totalMinutes": "1/3",
        "wallClockMeasurement": false
      },
      "fromNodeId": "mt__N55B7u7HD",
      "toNodeId": "mt_6XCURuNwPw"
    },
    {
      "id": "link-durationunit-durationorder",
      "sessionId": "link-durationunit-durationorder",
      "index": 1,
      "nodeId": "mt_6XCURuNwPw",
      "type": "x-t32-order",
      "taskHash": "06655f40ea08030dbefe6dc0e39ae95580cc116f543a1262dbdc2e27d01467d3",
      "answers": [],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        }
      ],
      "expected": {
        "values": [
          20,
          12,
          35
        ],
        "orderedIdentities": [
          1,
          0,
          2
        ],
        "orderedLabels": [
          "走路12分钟",
          "画画20分钟",
          "游戏35分钟"
        ],
        "adjacentRelations": [
          [
            12,
            "<=",
            20
          ],
          [
            20,
            "<=",
            35
          ]
        ]
      },
      "fromNodeId": "mt__N55B7u7HD",
      "toNodeId": "mt_6XCURuNwPw"
    },
    {
      "id": "link-timecompare-durationorder",
      "sessionId": "link-timecompare-durationorder",
      "index": 0,
      "nodeId": "mt_6XCURuNwPw",
      "type": "x-t32-compare",
      "taskHash": "9e91b309fa0c30ad81717335e7f5b11fe720b415444d05cd10363d10b5f465fa",
      "answers": [],
      "actions": [
        {
          "action": "t32-guess",
          "data": {
            "index": "right"
          }
        },
        {
          "action": "t32-reveal"
        },
        {
          "action": "t32-choice",
          "data": {
            "index": "right"
          }
        }
      ],
      "expected": {
        "kind": "longer",
        "comparedValues": [
          6,
          9
        ],
        "sourceDurationValues": [
          6,
          9
        ],
        "comparison": "right",
        "barsGeneratedByTool": true
      },
      "fromNodeId": "mt_TcG90kS8nu",
      "toNodeId": "mt_6XCURuNwPw"
    },
    {
      "id": "link-timecompare-durationorder",
      "sessionId": "link-timecompare-durationorder",
      "index": 1,
      "nodeId": "mt_6XCURuNwPw",
      "type": "x-t32-order",
      "taskHash": "06655f40ea08030dbefe6dc0e39ae95580cc116f543a1262dbdc2e27d01467d3",
      "answers": [],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        }
      ],
      "expected": {
        "values": [
          20,
          12,
          35
        ],
        "orderedIdentities": [
          1,
          0,
          2
        ],
        "orderedLabels": [
          "走路12分钟",
          "画画20分钟",
          "游戏35分钟"
        ],
        "adjacentRelations": [
          [
            12,
            "<=",
            20
          ],
          [
            20,
            "<=",
            35
          ]
        ]
      },
      "fromNodeId": "mt_TcG90kS8nu",
      "toNodeId": "mt_6XCURuNwPw"
    },
    {
      "id": "link-eventorder-weekmonth",
      "sessionId": "link-eventorder-weekmonth",
      "index": 0,
      "nodeId": "mt_bj1YCgNWUx",
      "type": "x-t32-order",
      "taskHash": "07fd0e380320a81ccf2a99a33ae870523e4ff4c726fdd945e89d122c4e563295",
      "answers": [
        "today"
      ],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answers.0",
          "value": "today"
        }
      ],
      "expected": {
        "values": [
          1,
          -1,
          0
        ],
        "orderedIdentities": [
          1,
          2,
          0
        ],
        "orderedLabels": [
          "周二：昨天",
          "周三：今天",
          "周四：明天"
        ],
        "adjacentRelations": [
          [
            -1,
            "<=",
            0
          ],
          [
            0,
            "<=",
            1
          ]
        ]
      },
      "fromNodeId": "mt_-vvVxpOHG2",
      "toNodeId": "mt_bj1YCgNWUx"
    },
    {
      "id": "link-eventorder-weekmonth",
      "sessionId": "link-eventorder-weekmonth",
      "index": 1,
      "nodeId": "mt_bj1YCgNWUx",
      "type": "x-t32-order",
      "taskHash": "f4e23d8151d6fa8e4b55079f9b42d0248c144d9439877b49e24c7d101ae05867",
      "answers": [],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 3
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 5
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 6
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 4
          }
        }
      ],
      "expected": {
        "values": [
          4,
          1,
          6,
          2,
          7,
          3,
          5
        ],
        "orderedIdentities": [
          1,
          3,
          5,
          0,
          6,
          2,
          4
        ],
        "orderedLabels": [
          "周一",
          "周二",
          "周三",
          "周四",
          "周五",
          "周六",
          "周日"
        ],
        "adjacentRelations": [
          [
            1,
            "<=",
            2
          ],
          [
            2,
            "<=",
            3
          ],
          [
            3,
            "<=",
            4
          ],
          [
            4,
            "<=",
            5
          ],
          [
            5,
            "<=",
            6
          ],
          [
            6,
            "<=",
            7
          ]
        ]
      },
      "fromNodeId": "mt_-vvVxpOHG2",
      "toNodeId": "mt_bj1YCgNWUx"
    },
    {
      "id": "link-timeconvert-timetable",
      "sessionId": "link-timeconvert-timetable",
      "index": 0,
      "nodeId": "mt_Cqm8iy48UI",
      "type": "x-t32-units",
      "taskHash": "1bae521a58580ee0fe402c19cf0f3d3aa946368e84fd42b3e1a2991f54aded92",
      "answers": [
        "205"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "field": "answers.0",
          "value": "205"
        }
      ],
      "expected": {
        "sourceRelation": "3 × 60 min + 25 min = 205 min",
        "preselectedDecomposition": [
          "1小时",
          "1小时",
          "1小时",
          "25分钟"
        ],
        "decompositionChosenByChild": false
      },
      "fromNodeId": "mt_2yas4Unc8o",
      "toNodeId": "mt_Cqm8iy48UI"
    },
    {
      "id": "link-calendarfacts-baseconversions",
      "sessionId": "link-calendarfacts-baseconversions",
      "index": 0,
      "nodeId": "mt_d8al9JcajP",
      "type": "x-t32-units",
      "taskHash": "56655e258936575429bca55375504ac92cb9b58d05a55b75aad0053205c4f14d",
      "answers": [
        "60"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "field": "answers.0",
          "value": "60"
        }
      ],
      "expected": {
        "sourceRelation": "4 × 15 s = 60 s = 1 min",
        "preselectedDecomposition": [
          "15秒",
          "15秒",
          "15秒",
          "15秒"
        ],
        "decompositionChosenByChild": false
      },
      "fromNodeId": "mt_EXlmTURK_o",
      "toNodeId": "mt_d8al9JcajP"
    },
    {
      "id": "link-hoursday-calendarfacts",
      "sessionId": "link-hoursday-calendarfacts",
      "index": 0,
      "nodeId": "mt_EXlmTURK_o",
      "type": "x-t32-units",
      "taskHash": "212843e1f0b36c73b1eb788e2b94fc795e03a2396166de57b7435c8b70828302",
      "answers": [
        "60"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "field": "answers.0",
          "value": "60"
        }
      ],
      "expected": {
        "sourceRelation": "4 × 15 min = 60 min = 1 h",
        "preselectedDecomposition": [
          "15分钟",
          "15分钟",
          "15分钟",
          "15分钟"
        ],
        "decompositionChosenByChild": false
      },
      "fromNodeId": "mt_2XDGT5tei1",
      "toNodeId": "mt_EXlmTURK_o"
    },
    {
      "id": "link-hoursday-calendarfacts",
      "sessionId": "link-hoursday-calendarfacts",
      "index": 1,
      "nodeId": "mt_EXlmTURK_o",
      "type": "x-t32-units",
      "taskHash": "56655e258936575429bca55375504ac92cb9b58d05a55b75aad0053205c4f14d",
      "answers": [
        "60"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "field": "answers.0",
          "value": "60"
        }
      ],
      "expected": {
        "sourceRelation": "4 × 15 s = 60 s = 1 min",
        "preselectedDecomposition": [
          "15秒",
          "15秒",
          "15秒",
          "15秒"
        ],
        "decompositionChosenByChild": false
      },
      "fromNodeId": "mt_2XDGT5tei1",
      "toNodeId": "mt_EXlmTURK_o"
    },
    {
      "id": "link-hourclock-fiveclock",
      "sessionId": "link-hourclock-fiveclock",
      "index": 0,
      "nodeId": "mt_HNOPGJYiRK",
      "type": "x-t32-clock",
      "taskHash": "a74af01f7c613096be3818c7485786b27f5e4c76b1915e8898f9092081aa4eb5",
      "answers": [
        "7:30"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "7:30"
        }
      ],
      "expected": {
        "hour12": 7,
        "minute": 30,
        "hourHandDegrees": "225",
        "minuteHandDegrees": 180,
        "clockMinutesWithin12Hours": 450,
        "clockMinutesWithin24Hours": 450,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_0XxyaQLRhn",
      "toNodeId": "mt_HNOPGJYiRK"
    },
    {
      "id": "link-hourclock-fiveclock",
      "sessionId": "link-hourclock-fiveclock",
      "index": 1,
      "nodeId": "mt_HNOPGJYiRK",
      "type": "x-t32-clock",
      "taskHash": "ff9a191d4b44fa279a49c304edf57e6987ebacdad6d8a2b0dbfa927d36ce5ac7",
      "answers": [
        "3:25"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "3:25"
        }
      ],
      "expected": {
        "hour12": 3,
        "minute": 25,
        "hourHandDegrees": "205/2",
        "minuteHandDegrees": 150,
        "clockMinutesWithin12Hours": 205,
        "clockMinutesWithin24Hours": 205,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_0XxyaQLRhn",
      "toNodeId": "mt_HNOPGJYiRK"
    },
    {
      "id": "link-skipbasic-fiveclock",
      "sessionId": "link-skipbasic-fiveclock",
      "index": 0,
      "nodeId": "mt_HNOPGJYiRK",
      "type": "x-t32-order",
      "taskHash": "fb1c131700acf1458a862ceb66a0b4b8e9a938c0dfcb02a73cf4520cfd0d75dc",
      "answers": [],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 3
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        }
      ],
      "expected": {
        "values": [
          20,
          5,
          15,
          10
        ],
        "orderedIdentities": [
          1,
          3,
          2,
          0
        ],
        "orderedLabels": [
          "5",
          "10",
          "15",
          "20"
        ],
        "adjacentRelations": [
          [
            5,
            "<=",
            10
          ],
          [
            10,
            "<=",
            15
          ],
          [
            15,
            "<=",
            20
          ]
        ]
      },
      "fromNodeId": "mt_nvdpxAJTBG",
      "toNodeId": "mt_HNOPGJYiRK"
    },
    {
      "id": "link-skipbasic-fiveclock",
      "sessionId": "link-skipbasic-fiveclock",
      "index": 1,
      "nodeId": "mt_HNOPGJYiRK",
      "type": "x-t32-clock",
      "taskHash": "ff9a191d4b44fa279a49c304edf57e6987ebacdad6d8a2b0dbfa927d36ce5ac7",
      "answers": [
        "3:25"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "3:25"
        }
      ],
      "expected": {
        "hour12": 3,
        "minute": 25,
        "hourHandDegrees": "205/2",
        "minuteHandDegrees": 150,
        "clockMinutesWithin12Hours": 205,
        "clockMinutesWithin24Hours": 205,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_nvdpxAJTBG",
      "toNodeId": "mt_HNOPGJYiRK"
    },
    {
      "id": "link-durationwork-elapsedtime",
      "sessionId": "link-durationwork-elapsedtime",
      "index": 0,
      "nodeId": "mt_IL86kadLSS",
      "type": "x-t32-steps",
      "taskHash": "90242a80c5d2f9ee6e2de57ed8b371ece43ea5dfbed90c959b30a0631df82daa",
      "answers": [
        "26"
      ],
      "actions": [
        {
          "field": "jump",
          "value": "13"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "jump",
          "value": "13"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "answers.0",
          "value": "26"
        }
      ],
      "expected": {
        "startMinutes": 1037,
        "endMinutes": 1063,
        "durationMinutes": 26,
        "exampleChosenSegments": [
          13,
          13
        ],
        "balances": [
          1037,
          1050,
          1063
        ],
        "displayedClocks": [
          "17:17",
          "17:30",
          "17:43"
        ],
        "timeCoordinatesGeneratedByTool": true
      },
      "fromNodeId": "mt_4emC463IyW",
      "toNodeId": "mt_IL86kadLSS"
    },
    {
      "id": "link-durationwork-elapsedtime",
      "sessionId": "link-durationwork-elapsedtime",
      "index": 1,
      "nodeId": "mt_IL86kadLSS",
      "type": "x-t32-steps",
      "taskHash": "64466ad172c19343a4d373bf2c010748819ee215d36e1f0537626314ab2f242e",
      "answers": [
        "15:02"
      ],
      "actions": [
        {
          "field": "jump",
          "value": "45"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "jump",
          "value": "2"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "answers.0",
          "value": "15:02"
        }
      ],
      "expected": {
        "startMinutes": 855,
        "endMinutes": 902,
        "durationMinutes": 47,
        "exampleChosenSegments": [
          45,
          2
        ],
        "balances": [
          855,
          900,
          902
        ],
        "displayedClocks": [
          "14:15",
          "15:00",
          "15:02"
        ],
        "timeCoordinatesGeneratedByTool": true
      },
      "fromNodeId": "mt_4emC463IyW",
      "toNodeId": "mt_IL86kadLSS"
    },
    {
      "id": "link-minuteclock-elapsedtime",
      "sessionId": "link-minuteclock-elapsedtime",
      "index": 0,
      "nodeId": "mt_IL86kadLSS",
      "type": "x-t32-clock",
      "taskHash": "e9e12f0560208d9c752915bae463f19d810dca117e32ebd33d4c96219e460199",
      "answers": [
        "7:43"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "7:43"
        }
      ],
      "expected": {
        "hour12": 7,
        "minute": 43,
        "hourHandDegrees": "463/2",
        "minuteHandDegrees": 258,
        "clockMinutesWithin12Hours": 463,
        "clockMinutesWithin24Hours": 463,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_UNzojLkNdm",
      "toNodeId": "mt_IL86kadLSS"
    },
    {
      "id": "link-minuteclock-elapsedtime",
      "sessionId": "link-minuteclock-elapsedtime",
      "index": 1,
      "nodeId": "mt_IL86kadLSS",
      "type": "x-t32-steps",
      "taskHash": "199c753891b28c7a19cb026e3e6a17853bfd56d380efb01c6d61dde2d8702c6c",
      "answers": [
        "45"
      ],
      "actions": [
        {
          "field": "jump",
          "value": "40"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "jump",
          "value": "5"
        },
        {
          "action": "t32-move"
        },
        {
          "field": "answers.0",
          "value": "45"
        }
      ],
      "expected": {
        "startMinutes": 560,
        "endMinutes": 605,
        "durationMinutes": 45,
        "exampleChosenSegments": [
          40,
          5
        ],
        "balances": [
          560,
          600,
          605
        ],
        "displayedClocks": [
          "09:20",
          "10:00",
          "10:05"
        ],
        "timeCoordinatesGeneratedByTool": true
      },
      "fromNodeId": "mt_UNzojLkNdm",
      "toNodeId": "mt_IL86kadLSS"
    },
    {
      "id": "link-hourclock-fractiontime",
      "sessionId": "link-hourclock-fractiontime",
      "index": 0,
      "nodeId": "mt_Jz9UuT8BXW",
      "type": "x-t32-clock",
      "taskHash": "a74af01f7c613096be3818c7485786b27f5e4c76b1915e8898f9092081aa4eb5",
      "answers": [
        "7:30"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "7:30"
        }
      ],
      "expected": {
        "hour12": 7,
        "minute": 30,
        "hourHandDegrees": "225",
        "minuteHandDegrees": 180,
        "clockMinutesWithin12Hours": 450,
        "clockMinutesWithin24Hours": 450,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_0XxyaQLRhn",
      "toNodeId": "mt_Jz9UuT8BXW"
    },
    {
      "id": "link-hourclock-fractiontime",
      "sessionId": "link-hourclock-fractiontime",
      "index": 1,
      "nodeId": "mt_Jz9UuT8BXW",
      "type": "x-t32-parts",
      "taskHash": "7f6f0e1b52b5403e803550b601cb93f786ad0332e00f4db8e3092eaa9cc69b27",
      "answers": [
        "30"
      ],
      "actions": [
        {
          "action": "t32-part",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answers.0",
          "value": "30"
        }
      ],
      "expected": {
        "whole": 60,
        "equalParts": 2,
        "selectedCount": 1,
        "unitPartAmount": "30",
        "selectedAmount": "30",
        "unit": "分钟",
        "requiredIdentities": null,
        "equalPartitionGeneratedByTool": true,
        "intervals": [
          [
            "0",
            "30"
          ],
          [
            "30",
            "60"
          ]
        ]
      },
      "fromNodeId": "mt_0XxyaQLRhn",
      "toNodeId": "mt_Jz9UuT8BXW"
    },
    {
      "id": "link-folds-fractiontime",
      "sessionId": "link-folds-fractiontime",
      "index": 1,
      "nodeId": "mt_Jz9UuT8BXW",
      "type": "x-t32-parts",
      "taskHash": "1a270fa8fb27763b1e8242c7bc01743706a0d11ac7d1f31b0544851e631c7cac",
      "answers": [
        "2"
      ],
      "actions": [
        {
          "action": "t32-part",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answers.0",
          "value": "2"
        }
      ],
      "expected": {
        "whole": 16,
        "equalParts": 8,
        "selectedCount": 1,
        "unitPartAmount": "2",
        "selectedAmount": "2",
        "unit": "分钟",
        "requiredIdentities": null,
        "equalPartitionGeneratedByTool": true,
        "intervals": [
          [
            "0",
            "2"
          ],
          [
            "2",
            "4"
          ],
          [
            "4",
            "6"
          ],
          [
            "6",
            "8"
          ],
          [
            "8",
            "10"
          ],
          [
            "10",
            "12"
          ],
          [
            "12",
            "14"
          ],
          [
            "14",
            "16"
          ]
        ]
      },
      "fromNodeId": "mt_gC-6JXAG5S",
      "toNodeId": "mt_Jz9UuT8BXW"
    },
    {
      "id": "link-halfpaper-fractiontime",
      "sessionId": "link-halfpaper-fractiontime",
      "index": 1,
      "nodeId": "mt_Jz9UuT8BXW",
      "type": "x-t32-parts",
      "taskHash": "7f6f0e1b52b5403e803550b601cb93f786ad0332e00f4db8e3092eaa9cc69b27",
      "answers": [
        "30"
      ],
      "actions": [
        {
          "action": "t32-part",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answers.0",
          "value": "30"
        }
      ],
      "expected": {
        "whole": 60,
        "equalParts": 2,
        "selectedCount": 1,
        "unitPartAmount": "30",
        "selectedAmount": "30",
        "unit": "分钟",
        "requiredIdentities": null,
        "equalPartitionGeneratedByTool": true,
        "intervals": [
          [
            "0",
            "30"
          ],
          [
            "30",
            "60"
          ]
        ]
      },
      "fromNodeId": "mt_-hTTat0mBR",
      "toNodeId": "mt_Jz9UuT8BXW"
    },
    {
      "id": "link-romanclock-roman100",
      "sessionId": "link-romanclock-roman100",
      "index": 0,
      "nodeId": "mt_MewIRdzpzz",
      "type": "x-t32-roman",
      "taskHash": "12a087ebf8e67b7b11bb669117a764d7bced306b2f764388494b865a11c128a2",
      "answers": [
        "4"
      ],
      "actions": [
        {
          "action": "t32-pick",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 3
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 3
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 4
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 4
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 5
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 5
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 6
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 6
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 7
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 7
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 8
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 8
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 9
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 9
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 10
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 10
          }
        },
        {
          "action": "t32-pick",
          "data": {
            "index": 11
          }
        },
        {
          "action": "t32-place",
          "data": {
            "index": 11
          }
        },
        {
          "field": "answers.0",
          "value": "4"
        }
      ],
      "expected": {
        "slots": [
          {
            "position": 0,
            "numeral": "XII",
            "value": 12
          },
          {
            "position": 1,
            "numeral": "I",
            "value": 1
          },
          {
            "position": 2,
            "numeral": "II",
            "value": 2
          },
          {
            "position": 3,
            "numeral": "III",
            "value": 3
          },
          {
            "position": 4,
            "numeral": "IV",
            "value": 4
          },
          {
            "position": 5,
            "numeral": "V",
            "value": 5
          },
          {
            "position": 6,
            "numeral": "VI",
            "value": 6
          },
          {
            "position": 7,
            "numeral": "VII",
            "value": 7
          },
          {
            "position": 8,
            "numeral": "VIII",
            "value": 8
          },
          {
            "position": 9,
            "numeral": "IX",
            "value": 9
          },
          {
            "position": 10,
            "numeral": "X",
            "value": 10
          },
          {
            "position": 11,
            "numeral": "XI",
            "value": 11
          }
        ],
        "IIII": 4
      },
      "fromNodeId": "mt_5J2quSTspi",
      "toNodeId": "mt_MewIRdzpzz"
    },
    {
      "id": "link-romanclock-roman100",
      "sessionId": "link-romanclock-roman100",
      "index": 1,
      "nodeId": "mt_MewIRdzpzz",
      "type": "x-t32-order",
      "taskHash": "6392e5f47e5a07f9081ce294e1e9b1c25010550a72fa6312ab6651473224870b",
      "answers": [],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        }
      ],
      "expected": {
        "values": [
          44,
          10,
          40
        ],
        "orderedIdentities": [
          1,
          2,
          0
        ],
        "orderedLabels": [
          "X",
          "XL",
          "XLIV"
        ],
        "adjacentRelations": [
          [
            10,
            "<=",
            40
          ],
          [
            40,
            "<=",
            44
          ]
        ]
      },
      "fromNodeId": "mt_5J2quSTspi",
      "toNodeId": "mt_MewIRdzpzz"
    },
    {
      "id": "link-hourclock-quarterclock",
      "sessionId": "link-hourclock-quarterclock",
      "index": 0,
      "nodeId": "mt_MgsDabdnr1",
      "type": "x-t32-clock",
      "taskHash": "a74af01f7c613096be3818c7485786b27f5e4c76b1915e8898f9092081aa4eb5",
      "answers": [
        "7:30"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "7:30"
        }
      ],
      "expected": {
        "hour12": 7,
        "minute": 30,
        "hourHandDegrees": "225",
        "minuteHandDegrees": 180,
        "clockMinutesWithin12Hours": 450,
        "clockMinutesWithin24Hours": 450,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_0XxyaQLRhn",
      "toNodeId": "mt_MgsDabdnr1"
    },
    {
      "id": "link-hourclock-quarterclock",
      "sessionId": "link-hourclock-quarterclock",
      "index": 1,
      "nodeId": "mt_MgsDabdnr1",
      "type": "x-t32-clock",
      "taskHash": "eb4272e062b7eacb6a05eef7dfd57fa07138cb5414dbad92eb9ed32a87a0ff18",
      "answers": [
        "3:15",
        "past"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "3:15"
        },
        {
          "field": "answers.1",
          "value": "past"
        }
      ],
      "expected": {
        "hour12": 3,
        "minute": 15,
        "hourHandDegrees": "195/2",
        "minuteHandDegrees": 90,
        "clockMinutesWithin12Hours": 195,
        "clockMinutesWithin24Hours": 195,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_0XxyaQLRhn",
      "toNodeId": "mt_MgsDabdnr1"
    },
    {
      "id": "link-fractiontime-quarterclock",
      "sessionId": "link-fractiontime-quarterclock",
      "index": 0,
      "nodeId": "mt_MgsDabdnr1",
      "type": "x-t32-parts",
      "taskHash": "4b79dc3e68245811676f779aec7f026de171c14209b2f2403bf237dbcd75e781",
      "answers": [
        "15"
      ],
      "actions": [
        {
          "action": "t32-part",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answers.0",
          "value": "15"
        }
      ],
      "expected": {
        "whole": 60,
        "equalParts": 4,
        "selectedCount": 1,
        "unitPartAmount": "15",
        "selectedAmount": "15",
        "unit": "分钟",
        "requiredIdentities": null,
        "equalPartitionGeneratedByTool": true,
        "intervals": [
          [
            "0",
            "15"
          ],
          [
            "15",
            "30"
          ],
          [
            "30",
            "45"
          ],
          [
            "45",
            "60"
          ]
        ]
      },
      "fromNodeId": "mt_Jz9UuT8BXW",
      "toNodeId": "mt_MgsDabdnr1"
    },
    {
      "id": "link-fractiontime-quarterclock",
      "sessionId": "link-fractiontime-quarterclock",
      "index": 1,
      "nodeId": "mt_MgsDabdnr1",
      "type": "x-t32-parts",
      "taskHash": "7f0ed6e6fed925aec97e4f6f71ccae42d7d4490272d3bf757c6f0af6d1cffc8d",
      "answers": [
        "15"
      ],
      "actions": [
        {
          "action": "t32-part",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answers.0",
          "value": "15"
        }
      ],
      "expected": {
        "whole": 60,
        "equalParts": 4,
        "selectedCount": 1,
        "unitPartAmount": "15",
        "selectedAmount": "15",
        "unit": "分钟",
        "requiredIdentities": null,
        "equalPartitionGeneratedByTool": true,
        "intervals": [
          [
            "0",
            "15"
          ],
          [
            "15",
            "30"
          ],
          [
            "30",
            "45"
          ],
          [
            "45",
            "60"
          ]
        ]
      },
      "fromNodeId": "mt_Jz9UuT8BXW",
      "toNodeId": "mt_MgsDabdnr1"
    },
    {
      "id": "link-turnroute-quarterclock",
      "sessionId": "link-turnroute-quarterclock",
      "index": 1,
      "nodeId": "mt_MgsDabdnr1",
      "type": "x-t32-parts",
      "taskHash": "7f0ed6e6fed925aec97e4f6f71ccae42d7d4490272d3bf757c6f0af6d1cffc8d",
      "answers": [
        "15"
      ],
      "actions": [
        {
          "action": "t32-part",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answers.0",
          "value": "15"
        }
      ],
      "expected": {
        "whole": 60,
        "equalParts": 4,
        "selectedCount": 1,
        "unitPartAmount": "15",
        "selectedAmount": "15",
        "unit": "分钟",
        "requiredIdentities": null,
        "equalPartitionGeneratedByTool": true,
        "intervals": [
          [
            "0",
            "15"
          ],
          [
            "15",
            "30"
          ],
          [
            "30",
            "45"
          ],
          [
            "45",
            "60"
          ]
        ]
      },
      "fromNodeId": "mt_Y9XKzLrUAZ",
      "toNodeId": "mt_MgsDabdnr1"
    },
    {
      "id": "link-timecompare-durationunit",
      "sessionId": "link-timecompare-durationunit",
      "index": 0,
      "nodeId": "mt__N55B7u7HD",
      "type": "x-t32-compare",
      "taskHash": "9e91b309fa0c30ad81717335e7f5b11fe720b415444d05cd10363d10b5f465fa",
      "answers": [],
      "actions": [
        {
          "action": "t32-guess",
          "data": {
            "index": "right"
          }
        },
        {
          "action": "t32-reveal"
        },
        {
          "action": "t32-choice",
          "data": {
            "index": "right"
          }
        }
      ],
      "expected": {
        "kind": "longer",
        "comparedValues": [
          6,
          9
        ],
        "sourceDurationValues": [
          6,
          9
        ],
        "comparison": "right",
        "barsGeneratedByTool": true
      },
      "fromNodeId": "mt_TcG90kS8nu",
      "toNodeId": "mt__N55B7u7HD"
    },
    {
      "id": "link-timecompare-durationunit",
      "sessionId": "link-timecompare-durationunit",
      "index": 1,
      "nodeId": "mt__N55B7u7HD",
      "type": "x-t32-stopwatch",
      "taskHash": "3e193fcbc141c375f2d6ef786aefb9ec4725b05a444c9ca7dec8f8ab8e9d0860",
      "answers": [
        "20"
      ],
      "actions": [
        {
          "action": "t32-start"
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 10
          }
        },
        {
          "action": "t32-tick",
          "data": {
            "index": 10
          }
        },
        {
          "action": "t32-stop"
        },
        {
          "field": "answers.0",
          "value": "20"
        }
      ],
      "expected": {
        "durationSeconds": 20,
        "allowedVisibleTickSeconds": [
          10,
          30
        ],
        "exampleSimulatedTicks": [
          10,
          10
        ],
        "totalMinutes": "1/3",
        "wallClockMeasurement": false
      },
      "fromNodeId": "mt_TcG90kS8nu",
      "toNodeId": "mt__N55B7u7HD"
    },
    {
      "id": "link-weekmonth-calendaruse",
      "sessionId": "link-weekmonth-calendaruse",
      "index": 0,
      "nodeId": "mt_tVvZVWO5d6",
      "type": "x-t32-order",
      "taskHash": "401288f7831468389159ed145b74ec74a69ea4880ee9e473327d9759826dd51e",
      "answers": [],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 6
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 3
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 8
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 10
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 5
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 11
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 9
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 7
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 4
          }
        }
      ],
      "expected": {
        "values": [
          5,
          1,
          9,
          3,
          12,
          7,
          2,
          11,
          4,
          10,
          6,
          8
        ],
        "orderedIdentities": [
          1,
          6,
          3,
          8,
          0,
          10,
          5,
          11,
          2,
          9,
          7,
          4
        ],
        "orderedLabels": [
          "1月",
          "2月",
          "3月",
          "4月",
          "5月",
          "6月",
          "7月",
          "8月",
          "9月",
          "10月",
          "11月",
          "12月"
        ],
        "adjacentRelations": [
          [
            1,
            "<=",
            2
          ],
          [
            2,
            "<=",
            3
          ],
          [
            3,
            "<=",
            4
          ],
          [
            4,
            "<=",
            5
          ],
          [
            5,
            "<=",
            6
          ],
          [
            6,
            "<=",
            7
          ],
          [
            7,
            "<=",
            8
          ],
          [
            8,
            "<=",
            9
          ],
          [
            9,
            "<=",
            10
          ],
          [
            10,
            "<=",
            11
          ],
          [
            11,
            "<=",
            12
          ]
        ]
      },
      "fromNodeId": "mt_bj1YCgNWUx",
      "toNodeId": "mt_tVvZVWO5d6"
    },
    {
      "id": "link-weekmonth-calendaruse",
      "sessionId": "link-weekmonth-calendaruse",
      "index": 1,
      "nodeId": "mt_tVvZVWO5d6",
      "type": "x-t32-calendar",
      "taskHash": "18d0ebb351f38e6fc6a9e41e7a036c80c19b85dc7e430dd0632617303e0c4f2c",
      "answers": [
        "sun"
      ],
      "actions": [
        {
          "action": "t32-day",
          "data": {
            "index": "2026-03-15"
          }
        },
        {
          "field": "answers.0",
          "value": "sun"
        }
      ],
      "expected": {
        "dates": [
          {
            "date": "2026-03-15",
            "weekdayMondayZero": 6
          }
        ],
        "leap": {
          "2026": false
        }
      },
      "fromNodeId": "mt_bj1YCgNWUx",
      "toNodeId": "mt_tVvZVWO5d6"
    },
    {
      "id": "link-calendarfacts-calendaruse",
      "sessionId": "link-calendarfacts-calendaruse",
      "index": 0,
      "nodeId": "mt_tVvZVWO5d6",
      "type": "x-t32-calendar",
      "taskHash": "390f8a2b5586fb42b0e9aca8c10a64b7b9ec70fb8f6223fe97905f2e5ba68a74",
      "answers": [
        "366",
        "common",
        "leap"
      ],
      "actions": [
        {
          "action": "t32-day",
          "data": {
            "index": "2024-02-29"
          }
        },
        {
          "field": "answers.0",
          "value": "366"
        },
        {
          "field": "answers.1",
          "value": "common"
        },
        {
          "field": "answers.2",
          "value": "leap"
        }
      ],
      "expected": {
        "dates": [
          {
            "date": "2024-02-29",
            "weekdayMondayZero": 3
          }
        ],
        "leap": {
          "2024": true
        }
      },
      "fromNodeId": "mt_EXlmTURK_o",
      "toNodeId": "mt_tVvZVWO5d6"
    },
    {
      "id": "link-calendarfacts-calendaruse",
      "sessionId": "link-calendarfacts-calendaruse",
      "index": 1,
      "nodeId": "mt_tVvZVWO5d6",
      "type": "x-t32-calendar",
      "taskHash": "18d0ebb351f38e6fc6a9e41e7a036c80c19b85dc7e430dd0632617303e0c4f2c",
      "answers": [
        "sun"
      ],
      "actions": [
        {
          "action": "t32-day",
          "data": {
            "index": "2026-03-15"
          }
        },
        {
          "field": "answers.0",
          "value": "sun"
        }
      ],
      "expected": {
        "dates": [
          {
            "date": "2026-03-15",
            "weekdayMondayZero": 6
          }
        ],
        "leap": {
          "2026": false
        }
      },
      "fromNodeId": "mt_EXlmTURK_o",
      "toNodeId": "mt_tVvZVWO5d6"
    },
    {
      "id": "link-ampmclock-minuteclock",
      "sessionId": "link-ampmclock-minuteclock",
      "index": 0,
      "nodeId": "mt_UNzojLkNdm",
      "type": "x-t32-clock",
      "taskHash": "a0ff6021e3c967f23f40816fd723554785130240bb0966fe33f5b07283f0d553",
      "answers": [
        "8:45",
        "am"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "8:45"
        },
        {
          "field": "answers.1",
          "value": "am"
        }
      ],
      "expected": {
        "hour12": 8,
        "minute": 45,
        "hourHandDegrees": "525/2",
        "minuteHandDegrees": 270,
        "clockMinutesWithin12Hours": 525,
        "clockMinutesWithin24Hours": 525,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_4m8BimI4G5",
      "toNodeId": "mt_UNzojLkNdm"
    },
    {
      "id": "link-ampmclock-minuteclock",
      "sessionId": "link-ampmclock-minuteclock",
      "index": 1,
      "nodeId": "mt_UNzojLkNdm",
      "type": "x-t32-clock",
      "taskHash": "e9e12f0560208d9c752915bae463f19d810dca117e32ebd33d4c96219e460199",
      "answers": [
        "7:43"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "7:43"
        }
      ],
      "expected": {
        "hour12": 7,
        "minute": 43,
        "hourHandDegrees": "463/2",
        "minuteHandDegrees": 258,
        "clockMinutesWithin12Hours": 463,
        "clockMinutesWithin24Hours": 463,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_4m8BimI4G5",
      "toNodeId": "mt_UNzojLkNdm"
    },
    {
      "id": "link-durationorder-minuteclock",
      "sessionId": "link-durationorder-minuteclock",
      "index": 0,
      "nodeId": "mt_UNzojLkNdm",
      "type": "x-t32-order",
      "taskHash": "06655f40ea08030dbefe6dc0e39ae95580cc116f543a1262dbdc2e27d01467d3",
      "answers": [],
      "actions": [
        {
          "action": "t32-order",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-order",
          "data": {
            "index": 2
          }
        }
      ],
      "expected": {
        "values": [
          20,
          12,
          35
        ],
        "orderedIdentities": [
          1,
          0,
          2
        ],
        "orderedLabels": [
          "走路12分钟",
          "画画20分钟",
          "游戏35分钟"
        ],
        "adjacentRelations": [
          [
            12,
            "<=",
            20
          ],
          [
            20,
            "<=",
            35
          ]
        ]
      },
      "fromNodeId": "mt_6XCURuNwPw",
      "toNodeId": "mt_UNzojLkNdm"
    },
    {
      "id": "link-durationorder-minuteclock",
      "sessionId": "link-durationorder-minuteclock",
      "index": 1,
      "nodeId": "mt_UNzojLkNdm",
      "type": "x-t32-clock",
      "taskHash": "e9e12f0560208d9c752915bae463f19d810dca117e32ebd33d4c96219e460199",
      "answers": [
        "7:43"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "7:43"
        }
      ],
      "expected": {
        "hour12": 7,
        "minute": 43,
        "hourHandDegrees": "463/2",
        "minuteHandDegrees": 258,
        "clockMinutesWithin12Hours": 463,
        "clockMinutesWithin24Hours": 463,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_6XCURuNwPw",
      "toNodeId": "mt_UNzojLkNdm"
    },
    {
      "id": "link-quarterclock-minuteclock",
      "sessionId": "link-quarterclock-minuteclock",
      "index": 0,
      "nodeId": "mt_UNzojLkNdm",
      "type": "x-t32-clock",
      "taskHash": "eb4272e062b7eacb6a05eef7dfd57fa07138cb5414dbad92eb9ed32a87a0ff18",
      "answers": [
        "3:15",
        "past"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "3:15"
        },
        {
          "field": "answers.1",
          "value": "past"
        }
      ],
      "expected": {
        "hour12": 3,
        "minute": 15,
        "hourHandDegrees": "195/2",
        "minuteHandDegrees": 90,
        "clockMinutesWithin12Hours": 195,
        "clockMinutesWithin24Hours": 195,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_MgsDabdnr1",
      "toNodeId": "mt_UNzojLkNdm"
    },
    {
      "id": "link-quarterclock-minuteclock",
      "sessionId": "link-quarterclock-minuteclock",
      "index": 1,
      "nodeId": "mt_UNzojLkNdm",
      "type": "x-t32-clock",
      "taskHash": "e9e12f0560208d9c752915bae463f19d810dca117e32ebd33d4c96219e460199",
      "answers": [
        "7:43"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "7:43"
        }
      ],
      "expected": {
        "hour12": 7,
        "minute": 43,
        "hourHandDegrees": "463/2",
        "minuteHandDegrees": 258,
        "clockMinutesWithin12Hours": 463,
        "clockMinutesWithin24Hours": 463,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_MgsDabdnr1",
      "toNodeId": "mt_UNzojLkNdm"
    },
    {
      "id": "link-romanclock-clockconvert",
      "sessionId": "link-romanclock-clockconvert",
      "index": 0,
      "nodeId": "mt_WfrE_4r-kY",
      "type": "x-t32-units",
      "taskHash": "41bd633d375cda7ab04d3059e3ab1bb8e7f47ad2005efb8529a7d1a2062da0bd",
      "answers": [
        "15:20",
        "07:05",
        "12:20",
        "00:20"
      ],
      "actions": [
        {
          "action": "t32-unit",
          "data": {
            "index": 0
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 1
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 2
          }
        },
        {
          "action": "t32-unit",
          "data": {
            "index": 3
          }
        },
        {
          "field": "answers.0",
          "value": "15:20"
        },
        {
          "field": "answers.1",
          "value": "07:05"
        },
        {
          "field": "answers.2",
          "value": "12:20"
        },
        {
          "field": "answers.3",
          "value": "00:20"
        }
      ],
      "expected": {
        "sourceRelation": "15:20, 07:05, 12:20, 00:20; twelve-hour wording needs explicit noon/midnight context",
        "preselectedDecomposition": [
          "下午3:20",
          "上午7:05",
          "中午后12:20",
          "午夜后12:20"
        ],
        "decompositionChosenByChild": false
      },
      "fromNodeId": "mt_5J2quSTspi",
      "toNodeId": "mt_WfrE_4r-kY"
    },
    {
      "id": "link-romanclock-clockconvert",
      "sessionId": "link-romanclock-clockconvert",
      "index": 1,
      "nodeId": "mt_WfrE_4r-kY",
      "type": "x-t32-clock",
      "taskHash": "f38448cd8dcf3f7783c071d05fa9f78de43048eafce82e1724567f41ac1dee70",
      "answers": [
        "7:30",
        "pm"
      ],
      "actions": [
        {
          "field": "answers.0",
          "value": "7:30"
        },
        {
          "field": "answers.1",
          "value": "pm"
        }
      ],
      "expected": {
        "hour12": 7,
        "minute": 30,
        "hourHandDegrees": "225",
        "minuteHandDegrees": 180,
        "clockMinutesWithin12Hours": 450,
        "clockMinutesWithin24Hours": 1170,
        "anglesGeneratedByTool": true
      },
      "fromNodeId": "mt_5J2quSTspi",
      "toNodeId": "mt_WfrE_4r-kY"
    }
  ]
};
