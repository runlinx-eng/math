// Two literal original prerequisite routes; neither is balance native evidence.
module.exports={
  "schema": "math-balance-literal-navigation/1",
  "navigation": [
    {
      "id": "measurecalc",
      "index": 0,
      "task": {
        "type": "x-m28-ruler",
        "prompt": "把尺的零刻度对准左端，读出这条模拟桌边。",
        "value": 7,
        "unit": "cm",
        "object": "桌边",
        "questions": [],
        "axisMax": 10,
        "tick": 1
      },
      "steps": [
        {
          "field": "offset",
          "value": "0"
        },
        {
          "field": "measure",
          "value": "7"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "action": "m28-record",
          "data": {}
        }
      ],
      "taskHash": "6163451599ea7ecda317a4a5f4a3a4d902d4eeedcc3320dbba0a16a52ec7df35",
      "strictBalanceCoverage": false,
      "existingOtherFeedback": true,
      "role": "prerequisite"
    },
    {
      "id": "measurecalc",
      "index": 1,
      "task": {
        "type": "x-m28-scale",
        "prompt": "尺上每厘米分成 10 小格。先读出厘米，再用毫米说同一段长度。",
        "kind": "ruler",
        "value": 12.7,
        "unit": "cm",
        "min": 0,
        "max": 15,
        "major": 1,
        "questions": [
          {
            "label": "这段相当于多少 mm",
            "value": 127
          }
        ],
        "minor": 0.1
      },
      "steps": [
        {
          "field": "measure",
          "value": "12.7"
        },
        {
          "field": "unit",
          "value": "cm"
        },
        {
          "action": "m28-record",
          "data": {}
        },
        {
          "field": "answers.0",
          "value": "127"
        }
      ],
      "taskHash": "892c4fd033c82c1c8adb22de1baa19db58653866e518156a8cd51c719bc5e952",
      "strictBalanceCoverage": false,
      "existingOtherFeedback": true,
      "role": "prerequisite"
    }
  ],
  "sourceHashes": {
    "dist/learning/learn.js": "1990941cee4ca17d058eef3c337758b737914f61d3ac1c8c684b41909abd822f"
  },
  "controllerSourceHashes": {
    "update": "e9cce21f3f3cf36ba81f6d4996bc6bc090e22cb545cc0a2e7349720c9f0ff1cc",
    "edit": "dd160130be6cb009cb9d6bdd08cc47bb44b5a77f5be9d8dd76d46798803930ca",
    "extra": "918b63bd101f235a1cc550b4ddfb17dba29dcd5a38674fe8d581e7f55b432021",
    "input": "3664a0e098d53fbb497de83251b2ff2e29bde395ac8357c4c8dcf3618ee7c6d4",
    "shared": "4c2c7ede8f9effcfc581029f1d1b29913e8905dc550054f37c5f0f2a1d58d724"
  }
};
