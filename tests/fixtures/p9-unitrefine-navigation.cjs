// Literal routes through the original small-spoon and equal-unit controls.
module.exports={
  "schema": "math-unitrefine-literal-navigation/1",
  "navigation": [
    {
      "id": "precisionunits",
      "index": 1,
      "steps": [
        {
          "action": "m28-select",
          "data": {
            "index": "0"
          }
        },
        {
          "action": "m28-vunit",
          "data": {
            "index": "spoon"
          }
        },
        {
          "action": "m28-pour"
        },
        {
          "action": "m28-pour"
        },
        {
          "action": "m28-pour"
        },
        {
          "action": "m28-pour"
        },
        {
          "action": "m28-pour"
        },
        {
          "action": "m28-pour"
        },
        {
          "action": "m28-seen"
        },
        {
          "field": "answers.0",
          "value": "6"
        }
      ],
      "task": {
        "type": "x-m28-vessels",
        "prompt": "一大杯放不进小玻璃杯。换成小勺，装满它。",
        "mode": "precision",
        "capacities": [
          60
        ],
        "units": [
          {
            "id": "cup",
            "amount": 100,
            "label": "大杯 100 mL"
          },
          {
            "id": "spoon",
            "amount": 10,
            "label": "小勺 10 mL"
          }
        ],
        "questions": [
          {
            "label": "用了几勺",
            "value": 6
          }
        ],
        "names": [
          "小玻璃杯"
        ],
        "requiredUnit": "spoon"
      },
      "taskHash": "2803df862117cb1c6e7c03bd751cd1d3fcaccde76dbc2b507afd4af99321ded0",
      "strictUnitrefineCoverage": false,
      "role": "prerequisite"
    },
    {
      "id": "link-sameunitlength-precisionunits",
      "index": 0,
      "steps": [
        {
          "action": "m28-place",
          "data": {
            "index": "0"
          }
        },
        {
          "action": "m28-place",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "m28-place",
          "data": {
            "index": "2"
          }
        },
        {
          "action": "m28-place",
          "data": {
            "index": "3"
          }
        },
        {
          "action": "m28-place",
          "data": {
            "index": "4"
          }
        },
        {
          "action": "m28-place",
          "data": {
            "index": "5"
          }
        },
        {
          "field": "measure",
          "value": "6"
        },
        {
          "field": "unit",
          "value": "块"
        },
        {
          "action": "m28-record"
        }
      ],
      "task": {
        "type": "x-m28-units",
        "prompt": "把同样长的小块从头到尾挨着放。",
        "length": 6,
        "size": 1,
        "unit": "块",
        "object": "书",
        "questions": []
      },
      "taskHash": "f904cc1319ef9db443aed2713f6f715f1fee69a138669c218902dcf108097125",
      "strictUnitrefineCoverage": false,
      "role": "prerequisite"
    }
  ],
  "sourceHashes": {
    "dist/learning/learn.js": "ec16b927d6c42d54e1dd8a99109f23ce25d7aae83e4e089c8510dbb591d19ab9"
  },
  "controllerSourceHashes": {
    "update": "e9cce21f3f3cf36ba81f6d4996bc6bc090e22cb545cc0a2e7349720c9f0ff1cc",
    "edit": "dd160130be6cb009cb9d6bdd08cc47bb44b5a77f5be9d8dd76d46798803930ca",
    "extra": "918b63bd101f235a1cc550b4ddfb17dba29dcd5a38674fe8d581e7f55b432021",
    "input": "3664a0e098d53fbb497de83251b2ff2e29bde395ac8357c4c8dcf3618ee7c6d4",
    "shared": "4c2c7ede8f9effcfc581029f1d1b29913e8905dc550054f37c5f0f2a1d58d724"
  },
  "scope": {
    "targets": 4,
    "sessions": 2,
    "prerequisites": 2,
    "positions": 6,
    "nextPerViewport": 4,
    "rangeInputsPerViewport": 0,
    "nativePositionSeeding": false
  }
};
