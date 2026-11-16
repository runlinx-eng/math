// Frozen literal original tasks and visible control paths used only for real Next.
// These prerequisite checks do not grant strict time construction coverage.
module.exports={
  "excludedRepresentatives": [
    "hourclock:0",
    "hourclock:2",
    "fiveclock:2",
    "quarterclock:1",
    "timecompare:0",
    "calendaruse:3",
    "timeconvert:0",
    "eventorder:0"
  ],
  "navigation": [
    {
      "id": "durationorder",
      "sessionId": "durationorder",
      "index": 1,
      "taskHash": "6627f1b1c643b91cd1892579a1841d3af2ef7ea02447615e462786b441ba89d7",
      "task": {
        "type": "x-t32-compare",
        "prompt": "A从10:00到10:30，B从10:20到10:40。谁用的时间更长？",
        "events": [
          {
            "name": "A",
            "start": 600,
            "end": 630
          },
          {
            "name": "B",
            "start": 620,
            "end": 640
          }
        ],
        "kind": "longer",
        "questions": []
      },
      "steps": [
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
      "strictTimeCoverage": false
    },
    {
      "id": "durationwork",
      "sessionId": "durationwork",
      "index": 1,
      "taskHash": "d92432fd9fe8c334f05fdc27f5724cc813cb3c1132f0eb05abef3f4b3c718b59",
      "task": {
        "type": "x-t32-compare",
        "prompt": "坐车35分钟，走路40分钟。哪个更久？",
        "events": [
          {
            "name": "坐车",
            "start": 0,
            "end": 35
          },
          {
            "name": "走路",
            "start": 0,
            "end": 40
          }
        ],
        "kind": "longer",
        "questions": [
          {
            "label": "多多少分钟",
            "value": 5,
            "kind": "number"
          }
        ]
      },
      "steps": [
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
      "strictTimeCoverage": false
    },
    {
      "id": "romanclock",
      "sessionId": "romanclock",
      "index": 0,
      "taskHash": "15e4378c1d04b7f99d89b2ce891750b8c8715e5cc48a16de0656df46e2abb6c6",
      "task": {
        "type": "x-t32-clock",
        "prompt": "罗马数字钟面：读出这个时刻。",
        "mode": "read",
        "value": 285,
        "initial": 65,
        "questions": [
          {
            "label": "数字时刻",
            "value": 285,
            "kind": "time12"
          }
        ],
        "roman": true
      },
      "steps": [
        {
          "field": "answers.0",
          "value": "4:45"
        }
      ],
      "strictTimeCoverage": false
    },
    {
      "id": "minuteclock",
      "sessionId": "minuteclock",
      "index": 0,
      "taskHash": "e9e12f0560208d9c752915bae463f19d810dca117e32ebd33d4c96219e460199",
      "task": {
        "type": "x-t32-clock",
        "prompt": "长针不在大数字上。读到准确的分钟。",
        "mode": "read",
        "value": 463,
        "initial": 65,
        "questions": [
          {
            "label": "数字时刻",
            "value": 463,
            "kind": "time12"
          }
        ]
      },
      "steps": [
        {
          "field": "answers.0",
          "value": "7:43"
        }
      ],
      "strictTimeCoverage": false
    },
    {
      "id": "quarterclock",
      "sessionId": "quarterclock",
      "index": 0,
      "taskHash": "eb4272e062b7eacb6a05eef7dfd57fa07138cb5414dbad92eb9ed32a87a0ff18",
      "task": {
        "type": "x-t32-clock",
        "prompt": "读出这个过了一刻的时刻。",
        "mode": "read",
        "value": 195,
        "initial": 65,
        "questions": [
          {
            "label": "数字时刻",
            "value": 195,
            "kind": "time12"
          },
          {
            "label": "这是",
            "value": "past",
            "kind": "choice",
            "options": [
              [
                "past",
                "3点过一刻"
              ],
              [
                "to",
                "差一刻到3点"
              ]
            ]
          }
        ]
      },
      "steps": [
        {
          "field": "answers.0",
          "value": "3:15"
        },
        {
          "field": "answers.1",
          "value": "past"
        }
      ],
      "strictTimeCoverage": false
    },
    {
      "id": "link-halfpaper-hourclock",
      "sessionId": "link-halfpaper-hourclock",
      "index": 0,
      "taskHash": "d7f860fb2e5a3ffa064a636b2cdcd98d9a6aaa6be0f439671cc61aac25e03582",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 2,
        "prompt": "把一张纸对折，摊开后涂一份。它是整个的多少？"
      },
      "steps": [
        {
          "action": "b16-fold",
          "data": {
            "value": "x"
          }
        },
        {
          "action": "b16-paper",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answer",
          "value": "1/2"
        }
      ],
      "strictTimeCoverage": false
    },
    {
      "id": "link-baseconversions-timeconvert",
      "sessionId": "link-baseconversions-timeconvert",
      "index": 0,
      "taskHash": "43af455ad9317e18af55f87a327fe54ba73538b8e41fc096574089e2eaa30e7f",
      "task": {
        "type": "x-m28-convert",
        "prompt": "同一段时间，2小时相当于多少分钟？",
        "rows": [
          {
            "value": 2,
            "from": "小时",
            "to": "分钟",
            "expected": 120
          }
        ],
        "questions": [],
        "hint": "1小时 = 60分钟。"
      },
      "steps": [
        {
          "field": "values.0",
          "value": "120"
        },
        {
          "action": "m28-convert",
          "data": {}
        }
      ],
      "strictTimeCoverage": false
    },
    {
      "id": "link-folds-fractiontime",
      "sessionId": "link-folds-fractiontime",
      "index": 0,
      "taskHash": "08c6c65183ab9198e858162af4a445107f9e2b791852044bfa2a9514257006b3",
      "task": {
        "type": "x-foldpaper",
        "prompt": "把纸带对折、再对折、再对折，记录每次摊开有几份。"
      },
      "steps": [
        {
          "action": "fold-paper",
          "data": {}
        },
        {
          "field": "labels.0",
          "value": 2
        },
        {
          "action": "fold-paper",
          "data": {}
        },
        {
          "field": "labels.1",
          "value": 4
        },
        {
          "action": "fold-paper",
          "data": {}
        },
        {
          "field": "labels.2",
          "value": 8
        }
      ],
      "strictTimeCoverage": false
    },
    {
      "id": "link-halfpaper-fractiontime",
      "sessionId": "link-halfpaper-fractiontime",
      "index": 0,
      "taskHash": "d7f860fb2e5a3ffa064a636b2cdcd98d9a6aaa6be0f439671cc61aac25e03582",
      "task": {
        "type": "x-paperlab",
        "mode": "fold",
        "d": 2,
        "prompt": "把一张纸对折，摊开后涂一份。它是整个的多少？"
      },
      "steps": [
        {
          "action": "b16-fold",
          "data": {
            "value": "x"
          }
        },
        {
          "action": "b16-paper",
          "data": {
            "index": 0
          }
        },
        {
          "field": "answer",
          "value": "1/2"
        }
      ],
      "strictTimeCoverage": false
    },
    {
      "id": "link-turnroute-quarterclock",
      "sessionId": "link-turnroute-quarterclock",
      "index": 0,
      "taskHash": "875d239eb587a0ad917620f5e2a7059f407cb390e2fb252fa7982eaaa581b3da",
      "task": {
        "type": "x-p24-walk",
        "prompt": "先向前走一步，再倒退一步。箭头的朝向会变吗？",
        "ops": [
          "F",
          "B"
        ],
        "start": [
          2,
          2,
          0
        ],
        "allowBack": true,
        "questions": [
          {
            "label": "回到原处时朝向",
            "value": "same",
            "options": [
              [
                "same",
                "和开始一样"
              ],
              [
                "turn",
                "转了半圈"
              ]
            ]
          }
        ]
      },
      "steps": [
        {
          "action": "p24-F",
          "data": {}
        },
        {
          "action": "p24-B",
          "data": {}
        },
        {
          "field": "answers.0",
          "value": "same"
        }
      ],
      "strictTimeCoverage": false
    },
    {
      "id": "hourclock",
      "sessionId": "hourclock",
      "index": 1,
      "taskHash": "a74af01f7c613096be3818c7485786b27f5e4c76b1915e8898f9092081aa4eb5",
      "task": {
        "type": "x-t32-clock",
        "prompt": "读出这个半点钟面。",
        "mode": "read",
        "value": 450,
        "initial": 65,
        "questions": [
          {
            "label": "数字时刻",
            "value": 450,
            "kind": "time12"
          }
        ]
      },
      "steps": [
        {
          "field": "answers.0",
          "value": "7:30"
        }
      ],
      "strictTimeCoverage": false
    },
    {
      "id": "fiveclock",
      "sessionId": "fiveclock",
      "index": 0,
      "taskHash": "ff9a191d4b44fa279a49c304edf57e6987ebacdad6d8a2b0dbfa927d36ce5ac7",
      "task": {
        "type": "x-t32-clock",
        "prompt": "读出钟面上的时刻。",
        "mode": "read",
        "value": 205,
        "initial": 65,
        "questions": [
          {
            "label": "数字时刻",
            "value": 205,
            "kind": "time12"
          }
        ]
      },
      "steps": [
        {
          "field": "answers.0",
          "value": "3:25"
        }
      ],
      "strictTimeCoverage": false
    },
    {
      "id": "fiveclock",
      "sessionId": "fiveclock",
      "index": 1,
      "taskHash": "391c4ec17a17e40e045c4723ca55268512ef8f2df056e806e30b30a26dc14e68",
      "task": {
        "type": "x-t32-clock",
        "prompt": "读出9点过一刻。",
        "mode": "read",
        "value": 555,
        "initial": 65,
        "questions": [
          {
            "label": "数字时刻",
            "value": 555,
            "kind": "time12"
          }
        ]
      },
      "steps": [
        {
          "field": "answers.0",
          "value": "9:15"
        }
      ],
      "strictTimeCoverage": false
    },
    {
      "id": "calendaruse",
      "sessionId": "calendaruse",
      "index": 0,
      "taskHash": "18d0ebb351f38e6fc6a9e41e7a036c80c19b85dc7e430dd0632617303e0c4f2c",
      "task": {
        "type": "x-t32-calendar",
        "prompt": "在2026年3月找到15日，看看它是星期几。",
        "months": [
          [
            2026,
            3
          ]
        ],
        "dates": [
          "2026-03-15"
        ],
        "questions": [
          {
            "label": "3月15日是",
            "value": "sun",
            "kind": "choice",
            "options": [
              [
                "sun",
                "星期日"
              ],
              [
                "sat",
                "星期六"
              ],
              [
                "mon",
                "星期一"
              ]
            ]
          }
        ]
      },
      "steps": [
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
      "strictTimeCoverage": false
    },
    {
      "id": "calendaruse",
      "sessionId": "calendaruse",
      "index": 1,
      "taskHash": "654994f34cef51db6825efea7ad6ddf25b1620b60016d66df1bea53765ed3d94",
      "task": {
        "type": "x-t32-calendar",
        "prompt": "假设今天是2026年3月18日，把它在日历上找出来。",
        "months": [
          [
            2026,
            3
          ]
        ],
        "dates": [
          "2026-03-18"
        ],
        "questions": [
          {
            "label": "今天是3月几日",
            "value": 18,
            "kind": "number"
          }
        ]
      },
      "steps": [
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
      "strictTimeCoverage": false
    },
    {
      "id": "calendaruse",
      "sessionId": "calendaruse",
      "index": 2,
      "taskHash": "0a1c94be2c27273dec8643548e92a0b6982372ce8da6fdb231cdbdba2ec4a8af",
      "task": {
        "type": "x-t32-calendar",
        "prompt": "从6月3日到6月17日，先选出两天，再数间隔。",
        "months": [
          [
            2026,
            6
          ]
        ],
        "dates": [
          "2026-06-03",
          "2026-06-17"
        ],
        "questions": [
          {
            "label": "相隔多少天",
            "value": 14,
            "kind": "number"
          }
        ]
      },
      "steps": [
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
      "strictTimeCoverage": false
    }
  ],
  "sourceHashes": {
    "dist/learning/phase4/b03-model.js": "dedebd84eb2c0b259ca5bcd4053689e1b17e9a8e5f5b274310b7d70da8551d13",
    "dist/learning/phase4/b03-view.js": "ca980b03cc9f7610b6709dae3506ae371cd9715cf347d1059d6e5406ca32b8f3",
    "dist/learning/phase5/b16-model.js": "ab907c6334f7d0b0fb557a1f2a036be8228dd25253ff11736236865de6d53fab",
    "dist/learning/phase5/b16-view.js": "2f319e0c77dcbd612cbbb71e21b728fad5e9dc7c257cbd94a6808c7ec4f459e7",
    "dist/learning/phase5/b24-model.js": "2d7ac1bba93bc201990e4c94452592cdb78d0c4e490f4f6e647744c0d9e93b04",
    "dist/learning/phase5/b24-view.js": "7781da0fe9047f0a6324b6d7035c3edcec43d82a3b8829a1af628a4e6c5919ef",
    "dist/learning/phase5/b28-model.js": "eb1ee26ca273ee1b629db0e84cc4f85d156c0569cfa751a18c208b00951c1391",
    "dist/learning/phase5/b28-view.js": "6fc48e49db9ce7c67e88c52db9740b602f42d95cd6a5756d3f2b8b3e8adb77d7"
  }
};
