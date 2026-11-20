// Fixed instructions for the nine original preceding tasks; no solver or storage seed.
module.exports={
  "schema": "math-multable-original-navigation/1",
  "navigation": [
    {
      "id": "writtenstart",
      "index": 0,
      "task": {
        "type": "x-areaproduct",
        "a": 23,
        "b": 4,
        "prompt": "把23×4画成两块，先找20×4，再找3×4。"
      },
      "taskHash": "1a6dcd3e5c36624a268981a123be68b5368c33a1d79c77f42a79b23df5e2b08a",
      "strictMultableCoverage": false,
      "steps": [
        {
          "field": "cutA",
          "value": "20"
        },
        {
          "field": "cutB",
          "value": "4"
        },
        {
          "action": "b14-cut"
        },
        {
          "field": "part",
          "value": "80"
        },
        {
          "action": "b14-part"
        },
        {
          "field": "part",
          "value": "12"
        },
        {
          "action": "b14-part"
        },
        {
          "field": "answer",
          "value": "92"
        }
      ]
    },
    {
      "id": "writtenstart",
      "index": 1,
      "task": {
        "type": "x-divtable",
        "n": 96,
        "d": 8,
        "prompt": "96里面有几份8？从十位分起，把剩下的十换成一。",
        "interpret": "keep",
        "places": 0
      },
      "taskHash": "2fda2b24d0d7f73e0ea91202ca0471f1684ca01fe728cda7e2facad716bdd884",
      "strictMultableCoverage": false,
      "steps": [
        {
          "action": "b14-bring"
        },
        {
          "field": "q",
          "value": "1"
        },
        {
          "field": "used",
          "value": "8"
        },
        {
          "field": "rest",
          "value": "1"
        },
        {
          "action": "b14-div-step"
        },
        {
          "action": "b14-bring"
        },
        {
          "field": "q",
          "value": "2"
        },
        {
          "field": "used",
          "value": "16"
        },
        {
          "field": "rest",
          "value": "0"
        },
        {
          "action": "b14-div-step"
        },
        {
          "field": "check",
          "value": "12×8+0=96"
        },
        {
          "field": "answer",
          "value": "12"
        },
        {
          "field": "base",
          "value": "0"
        }
      ]
    },
    {
      "id": "longproduct",
      "index": 2,
      "task": {
        "type": "x-areaproduct",
        "a": 45,
        "b": 23,
        "prompt": "45×23：先把两边拆成整十与零头，算四块各有多少。"
      },
      "taskHash": "b87f5b78ca6bd987300746cd885724bce804a730ddefb85d37a0d0ae9bed63ca",
      "strictMultableCoverage": false,
      "steps": [
        {
          "field": "cutA",
          "value": "40"
        },
        {
          "field": "cutB",
          "value": "20"
        },
        {
          "action": "b14-cut"
        },
        {
          "field": "part",
          "value": "800"
        },
        {
          "action": "b14-part"
        },
        {
          "field": "part",
          "value": "120"
        },
        {
          "action": "b14-part"
        },
        {
          "field": "part",
          "value": "100"
        },
        {
          "action": "b14-part"
        },
        {
          "field": "part",
          "value": "15"
        },
        {
          "action": "b14-part"
        },
        {
          "field": "answer",
          "value": "1035"
        }
      ]
    },
    {
      "id": "translateamount",
      "index": 0,
      "task": {
        "type": "x-wholeshare",
        "wholes": 3,
        "people": 4,
        "prompt": "把3个整体分给4人，图上的每人一份怎样写成除法与分数？"
      },
      "taskHash": "21c33177d54b7652b5b7bb52019e507b493335a634bdc0398ca645004802fefc",
      "strictMultableCoverage": false,
      "steps": [
        {
          "action": "b16-cut-wholes"
        },
        {
          "action": "b16-person",
          "data": {
            "index": "0"
          }
        },
        {
          "action": "b16-share-piece",
          "data": {
            "index": "0"
          }
        },
        {
          "action": "b16-share-piece",
          "data": {
            "index": "4"
          }
        },
        {
          "action": "b16-share-piece",
          "data": {
            "index": "8"
          }
        },
        {
          "action": "b16-person",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "b16-share-piece",
          "data": {
            "index": "1"
          }
        },
        {
          "action": "b16-share-piece",
          "data": {
            "index": "5"
          }
        },
        {
          "action": "b16-share-piece",
          "data": {
            "index": "9"
          }
        },
        {
          "action": "b16-person",
          "data": {
            "index": "2"
          }
        },
        {
          "action": "b16-share-piece",
          "data": {
            "index": "2"
          }
        },
        {
          "action": "b16-share-piece",
          "data": {
            "index": "6"
          }
        },
        {
          "action": "b16-share-piece",
          "data": {
            "index": "10"
          }
        },
        {
          "action": "b16-person",
          "data": {
            "index": "3"
          }
        },
        {
          "action": "b16-share-piece",
          "data": {
            "index": "3"
          }
        },
        {
          "action": "b16-share-piece",
          "data": {
            "index": "7"
          }
        },
        {
          "action": "b16-share-piece",
          "data": {
            "index": "11"
          }
        },
        {
          "field": "whole",
          "value": "0"
        },
        {
          "field": "remainder",
          "value": "3/4"
        },
        {
          "field": "answer",
          "value": "3/4"
        },
        {
          "field": "equation",
          "value": "3÷4=3/4"
        },
        {
          "field": "total",
          "value": "(3/4)*4=3"
        }
      ]
    },
    {
      "id": "translateamount",
      "index": 1,
      "task": {
        "type": "x-areaproduct",
        "a": 23,
        "b": 4,
        "prompt": "4条各23，把每条的20与3分开。面积里的两块怎样对应80与12？"
      },
      "taskHash": "08ae045d0d726879d652f82115094c8f91c36d90d56f95739bfdd338440e583f",
      "strictMultableCoverage": false,
      "steps": [
        {
          "field": "cutA",
          "value": "20"
        },
        {
          "field": "cutB",
          "value": "4"
        },
        {
          "action": "b14-cut"
        },
        {
          "field": "part",
          "value": "80"
        },
        {
          "action": "b14-part"
        },
        {
          "field": "part",
          "value": "12"
        },
        {
          "action": "b14-part"
        },
        {
          "field": "answer",
          "value": "92"
        }
      ]
    },
    {
      "id": "link-writtenstart-shortproduct",
      "index": 0,
      "task": {
        "type": "x-areaproduct",
        "a": 23,
        "b": 4,
        "prompt": "先把23×4拆成整十与零头。"
      },
      "taskHash": "73c624cb4fc84c0c99c1f316b034e844ed17bb379c39f3467121d00ea56b2c6c",
      "strictMultableCoverage": false,
      "steps": [
        {
          "field": "cutA",
          "value": "20"
        },
        {
          "field": "cutB",
          "value": "4"
        },
        {
          "action": "b14-cut"
        },
        {
          "field": "part",
          "value": "80"
        },
        {
          "action": "b14-part"
        },
        {
          "field": "part",
          "value": "12"
        },
        {
          "action": "b14-part"
        },
        {
          "field": "answer",
          "value": "92"
        }
      ]
    },
    {
      "id": "link-tables12-shortproduct",
      "index": 0,
      "task": {
        "type": "x-mularray",
        "a": 7,
        "b": 8,
        "unit": 1,
        "prompt": "7×8可以切成两个熟悉的块。自己选一条切线。",
        "split": true
      },
      "taskHash": "5997fa893a357a32070a0bf6cf510afbe95434b259f006de2b6f21119a7ea53c",
      "strictMultableCoverage": false,
      "steps": [
        {
          "field": "rows",
          "value": "7"
        },
        {
          "field": "cols",
          "value": "8"
        },
        {
          "action": "b13-shape"
        },
        {
          "field": "cut",
          "value": "4"
        },
        {
          "action": "b13-cut"
        },
        {
          "field": "left",
          "value": "28"
        },
        {
          "field": "right",
          "value": "28"
        },
        {
          "field": "equation",
          "value": "7×8=56"
        },
        {
          "field": "answer",
          "value": "56"
        }
      ]
    },
    {
      "id": "link-threeplaces-writtenstart",
      "index": 0,
      "task": {
        "type": "x-areaproduct",
        "a": 23,
        "b": 4,
        "prompt": "23里的2是2个十；先拆成20与3。"
      },
      "taskHash": "0b63c321a0909f1239f00a057a17229b82a20915d2b2a1e6c6f12c79f7121fb1",
      "strictMultableCoverage": false,
      "steps": [
        {
          "field": "cutA",
          "value": "20"
        },
        {
          "field": "cutB",
          "value": "4"
        },
        {
          "action": "b14-cut"
        },
        {
          "field": "part",
          "value": "80"
        },
        {
          "action": "b14-part"
        },
        {
          "field": "part",
          "value": "12"
        },
        {
          "action": "b14-part"
        },
        {
          "field": "answer",
          "value": "92"
        }
      ]
    },
    {
      "id": "link-mulsymbols-writtenstart",
      "index": 0,
      "task": {
        "type": "x-mularray",
        "a": 3,
        "b": 4,
        "unit": 1,
        "prompt": "摆出3行4颗，写一条相等的乘法关系。总数也可以写在等号左边。"
      },
      "taskHash": "937dc8c6f76316558f2b05b2401e39085203553473bc4ea356fa69d67aeaa8bc",
      "strictMultableCoverage": false,
      "steps": [
        {
          "field": "rows",
          "value": "3"
        },
        {
          "field": "cols",
          "value": "4"
        },
        {
          "action": "b13-shape"
        },
        {
          "field": "equation",
          "value": "3×4=12"
        },
        {
          "field": "answer",
          "value": "12"
        }
      ]
    }
  ],
  "sourceHashes": {
    "dist/learning/learn.js": "6f029c1b77d54cdfc514701b854e1457ad180b3a6970a9f4e657912202d14cf0",
    "dist/learning/phase5/b13-model.js": "d5a146c466ac846dd555f833823453252f1268e6be4f4d1d845ad07c7c434cb3",
    "dist/learning/phase5/b13-view.js": "1cece24dc00f47b3d54bb1e0405d5f05270e625cd23841872cf38c96c024b6a8",
    "dist/learning/phase5/b16-model.js": "ab907c6334f7d0b0fb557a1f2a036be8228dd25253ff11736236865de6d53fab",
    "dist/learning/phase5/b16-view.js": "2f319e0c77dcbd612cbbb71e21b728fad5e9dc7c257cbd94a6808c7ec4f459e7",
    "dist/learning/workspace-flow.js": "3cc0df920ad27d7dc803ac0c85a361b88a925288eaa483acea1eaddf5614ea05",
    "dist/learning/p3-view.js": "100a430403ff5e5cce93546ebbce803df84fc4c602c2b6bcf6a342d53fe68a78",
    "dist/exploration-core.js": "1100d47beba5120ec68f484fc154365ecdaa11d439c13ee85b6efad8c2f41002",
    "dist/storage.js": "8a7d85b66c19898560c33e372d832b7416adc153d523acd8eaec516282361bf7"
  }
};
