// Reviewed literal source positions, exact decimal relations and immutable task fingerprints.
// This file is never imported by production adapters.
module.exports={
  "cases": [
    {
      "id": "tenpattern",
      "sessionId": "tenpattern",
      "index": 0,
      "nodeId": "mt_QqG6IdmTSE",
      "taskHash": "cf30bdd2f5108aa8a1030c0188edb1825cc250aa6886bb1f64567f3615138d2a",
      "mode": "scale",
      "start": "300",
      "step": 1,
      "targetShift": 1,
      "end": "3000",
      "factor": "10",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "300",
        "step": 1,
        "prompt": "把300的数字向左移一格。先猜会变成多少。"
      }
    },
    {
      "id": "tenpattern",
      "sessionId": "tenpattern",
      "index": 1,
      "nodeId": "mt_QqG6IdmTSE",
      "taskHash": "c607451b706e5b54f34f57e751686c2d30e93cea3bf373ff44f04a4cba63d369",
      "mode": "scale",
      "start": "70",
      "step": 1,
      "targetShift": 1,
      "end": "700",
      "factor": "10",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "70",
        "step": 1,
        "prompt": "70到700隔了几格？亲自移，再记扩大了几倍。"
      }
    },
    {
      "id": "tenpattern",
      "sessionId": "tenpattern",
      "index": 2,
      "nodeId": "mt_QqG6IdmTSE",
      "taskHash": "b8b0d7c7873eda1f9a0a8a3212eb1d00ec04efe31f5c05fb6ee05e144a941c82",
      "mode": "scale",
      "start": "5000",
      "step": 1,
      "targetShift": 1,
      "end": "50000",
      "factor": "10",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "5000",
        "step": 1,
        "prompt": "5000变成50000，5的位置改变了什么？"
      }
    },
    {
      "id": "decimalscale",
      "sessionId": "decimalscale",
      "index": 0,
      "nodeId": "mt_EDgw64OmfA",
      "taskHash": "c90d26ec9ad3c89bcc739273524b9717a4b6c31c9fc9501223a6ea7ab4cc750b",
      "mode": "scale",
      "start": "0.4",
      "step": -1,
      "targetShift": -1,
      "end": "0.04",
      "factor": "10",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "0.4",
        "step": -1,
        "prompt": "0.4向右移一格，变成多少？先猜，再看那一小份。"
      }
    },
    {
      "id": "decimalscale",
      "sessionId": "decimalscale",
      "index": 1,
      "nodeId": "mt_EDgw64OmfA",
      "taskHash": "82dbdcb048050aa4685a62c03b56c114d5367b5bf140dad1f3c8fdfab0d425ea",
      "mode": "scale",
      "start": "0.06",
      "step": 1,
      "targetShift": 1,
      "end": "0.6",
      "factor": "10",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "0.06",
        "step": 1,
        "prompt": "0.06向左移一格，值会怎样变？"
      }
    },
    {
      "id": "decimalscale",
      "sessionId": "decimalscale",
      "index": 2,
      "nodeId": "mt_EDgw64OmfA",
      "taskHash": "5de07c5ed4f5b3bd8eb464d42b0a94a8876a1f6eb863b487a428b992317601ef",
      "mode": "scale",
      "start": "6000",
      "step": -6,
      "targetShift": -6,
      "end": "0.006",
      "factor": "1000000",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "6000",
        "step": -6,
        "prompt": "把6000的6一步步移到0.006的位置。两者相差多少倍？"
      }
    },
    {
      "id": "decimalplaces",
      "sessionId": "decimalplaces",
      "index": 1,
      "nodeId": "mt_lNGpnILM5C",
      "taskHash": "c40ccd5af61664706a0dcb5dd883f3ae68dd1e8c8cadf6c7978542e8bc104612",
      "mode": "scale",
      "start": "0.7",
      "step": -1,
      "targetShift": -1,
      "end": "0.07",
      "factor": "10",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "0.7",
        "step": -1,
        "prompt": "十分之一里的7，移到百分之一会怎样？"
      }
    },
    {
      "id": "powerpattern",
      "sessionId": "powerpattern",
      "index": 0,
      "nodeId": "mt_HLUqHJ9Y7n",
      "taskHash": "f1cf3f943c78127ad838396f169bba16a816535069192b61867eebcb838ab277",
      "mode": "scale",
      "start": "1",
      "step": 4,
      "targetShift": 4,
      "end": "10000",
      "factor": "10000",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "1",
        "step": 4,
        "prompt": "接上四个“乘10”，也就是10⁴。先猜结果再一步步做。",
        "factors": true
      }
    },
    {
      "id": "powerpattern",
      "sessionId": "powerpattern",
      "index": 1,
      "nodeId": "mt_HLUqHJ9Y7n",
      "taskHash": "59fb81e1b5928726b40b43cbcbf34dec4b5ab139f6d4d97cb329aa4e73e29281",
      "mode": "scale",
      "start": "3.4",
      "step": 2,
      "targetShift": 2,
      "end": "340",
      "factor": "100",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "3.4",
        "step": 2,
        "prompt": "3.4×10²：把数字向左移两格，点保持原位。"
      }
    },
    {
      "id": "powerpattern",
      "sessionId": "powerpattern",
      "index": 2,
      "nodeId": "mt_HLUqHJ9Y7n",
      "taskHash": "e8a7a5997267cce100e7496ae44bc4f93a25d337872d171196de74d0a49d237b",
      "mode": "scale",
      "start": "2.56",
      "step": 3,
      "targetShift": 3,
      "end": "2560",
      "factor": "1000",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "2.56",
        "step": 3,
        "prompt": "先猜2.56×10³，再亲自移三格。"
      }
    },
    {
      "id": "powerpattern",
      "sessionId": "powerpattern",
      "index": 3,
      "nodeId": "mt_HLUqHJ9Y7n",
      "taskHash": "8c3ce053db30e985c0a9d324f72934f88efbd6e2a6a27e77f8390f72284b44d4",
      "mode": "scale",
      "start": "340",
      "step": -2,
      "targetShift": -2,
      "end": "3.4",
      "factor": "100",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "340",
        "step": -2,
        "prompt": "反向试试：340除以10²，移回两格。"
      }
    },
    {
      "id": "standardform",
      "sessionId": "standardform",
      "index": 0,
      "nodeId": "mt_bO-njVOige",
      "taskHash": "91798b8f5962feea837bebe6374341f6de2a1e567faf00e4d2cd238a8eab1228",
      "mode": "scientific",
      "start": "720000",
      "step": 0,
      "targetShift": -5,
      "end": "7.2",
      "factor": "100000",
      "direction": "divide",
      "exponent": "5",
      "task": {
        "type": "x-wideshift",
        "mode": "scientific",
        "start": "720000",
        "step": 0,
        "prompt": "把720000的数字移到第一位落在1到10之间；再写一个10的幂，把大小补回去。"
      }
    },
    {
      "id": "standardform",
      "sessionId": "standardform",
      "index": 1,
      "nodeId": "mt_bO-njVOige",
      "taskHash": "e94cdf148ec84b2a237b7569f834b83f875ad0f3d0052e3f03544d9b3b225393",
      "mode": "scientific",
      "start": "0.00072",
      "step": 0,
      "targetShift": 4,
      "end": "7.2",
      "factor": "10000",
      "direction": "times",
      "exponent": "-4",
      "task": {
        "type": "x-wideshift",
        "mode": "scientific",
        "start": "0.00072",
        "step": 0,
        "prompt": "很小的0.00072也这样写。指数是负的，数值还是正的。"
      }
    },
    {
      "id": "standardform",
      "sessionId": "standardform",
      "index": 2,
      "nodeId": "mt_bO-njVOige",
      "taskHash": "575c96d14974cb6a7467dd37c8da01fa75fa892dcec7a5783a171d47686a1efd",
      "mode": "scale",
      "start": "5.8",
      "step": -4,
      "targetShift": -4,
      "end": "0.00058",
      "factor": "10000",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "5.8",
        "step": -4,
        "prompt": "把5.8×10⁻⁴展开为普通小数。先猜再移。"
      }
    },
    {
      "id": "largerfacts",
      "sessionId": "largerfacts",
      "index": 3,
      "nodeId": "mt_8A3pZNOp7Z",
      "taskHash": "d1dffed9518f6dbe2b491fba6ce748fa5e9d78ca56d82925f0fb5abc020b5845",
      "mode": "shift",
      "start": "2.4",
      "step": 1,
      "targetShift": 1,
      "end": "24",
      "factor": "10",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "2.4",
        "step": 1,
        "prompt": "小数也试一次：2.4扩大十倍。数字移动，不能只在末尾添0。"
      }
    },
    {
      "id": "shifttens",
      "sessionId": "shifttens",
      "index": 0,
      "nodeId": "mt_LlMl2PbaZe",
      "taskHash": "43f471ec8123aa55be48747c744df539d98b9ee1a242ab1068f46da6db681d9e",
      "mode": "shift",
      "start": "1",
      "step": -1,
      "targetShift": -1,
      "end": "0.1",
      "factor": "10",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "1",
        "step": -1,
        "prompt": "先试一个准备：1平均分成10份，每份落在哪个位置？"
      }
    },
    {
      "id": "shifttens",
      "sessionId": "shifttens",
      "index": 1,
      "nodeId": "mt_LlMl2PbaZe",
      "taskHash": "d9de351631a9f406f2d77a3c93abed482a352113473cb32abfc75c7207df93a7",
      "mode": "shift",
      "start": "3.45",
      "step": 2,
      "targetShift": 2,
      "end": "345",
      "factor": "100",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "3.45",
        "step": 2,
        "prompt": "3.45扩大100倍。每个数字都要移动同样的格数。"
      }
    },
    {
      "id": "shifttens",
      "sessionId": "shifttens",
      "index": 2,
      "nodeId": "mt_LlMl2PbaZe",
      "taskHash": "771cc2adbff578eb7cc263af5f2ff9d7217f4228e39e6645de621979420ce78b",
      "mode": "shift",
      "start": "72",
      "step": -3,
      "targetShift": -3,
      "end": "0.072",
      "factor": "1000",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "72",
        "step": -3,
        "prompt": "72缩小到原来的千分之一，空位置也要留好。"
      }
    },
    {
      "id": "shifttens",
      "sessionId": "shifttens",
      "index": 3,
      "nodeId": "mt_LlMl2PbaZe",
      "taskHash": "4d4a9823a0f891b582731e2e42560d9d874c6e3fe626fa72b2d12efd80e7f44c",
      "mode": "shift",
      "start": "2.5",
      "step": 1,
      "targetShift": 1,
      "end": "25",
      "factor": "10",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "2.5",
        "step": 1,
        "prompt": "2.5扩大十倍，解释数字2和5各变成了多少。"
      }
    },
    {
      "id": "shiftfine",
      "sessionId": "shiftfine",
      "index": 0,
      "nodeId": "mt_wPgpMJ0-PA",
      "taskHash": "9253fee6c88e01d46be80ccfd18f16e63e9373de58eeb0e45503330415b1321f",
      "mode": "shift",
      "start": "3.456",
      "step": 2,
      "targetShift": 2,
      "end": "345.6",
      "factor": "100",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "3.456",
        "step": 2,
        "prompt": "3.456扩大100倍，最后的6落在哪里？"
      }
    },
    {
      "id": "shiftfine",
      "sessionId": "shiftfine",
      "index": 1,
      "nodeId": "mt_wPgpMJ0-PA",
      "taskHash": "4778d45c7c05c505f8c8bbb70209a5df60ef559f83667c788a6b6469045f4545",
      "mode": "shift",
      "start": "45.2",
      "step": -3,
      "targetShift": -3,
      "end": "0.0452",
      "factor": "1000",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "45.2",
        "step": -3,
        "prompt": "45.2除以1000，注意小数点后空着的位置。"
      }
    },
    {
      "id": "shiftfine",
      "sessionId": "shiftfine",
      "index": 2,
      "nodeId": "mt_wPgpMJ0-PA",
      "taskHash": "0a79a69d4b71aecc2d88a3cab02da99e208d0299ad1f9c2bce8548fb23c54ed0",
      "mode": "shift",
      "start": "3.456",
      "step": -3,
      "targetShift": -3,
      "end": "0.003456",
      "factor": "1000",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "3.456",
        "step": -3,
        "prompt": "再往小处走：3.456除以1000，最后一位还能放在哪里？"
      }
    },
    {
      "id": "dividebyten",
      "sessionId": "dividebyten",
      "index": 0,
      "nodeId": "mt_kDMKJ5Ztt6",
      "taskHash": "94520869e2aaf02cf6e4e73a460f2eb3b1c1ea572ff70927773564b2f04f9a67",
      "mode": "scale",
      "start": "37",
      "step": -1,
      "targetShift": -1,
      "end": "3.7",
      "factor": "10",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "37",
        "step": -1,
        "prompt": "37除以10。小数点不动，让所有数字往小的单位移一格。"
      }
    },
    {
      "id": "dividebyten",
      "sessionId": "dividebyten",
      "index": 2,
      "nodeId": "mt_kDMKJ5Ztt6",
      "taskHash": "c74fca2d9654315ad783c534ce12e435a4837385092b348bdad25fcc5e72b552",
      "mode": "scale",
      "start": "4",
      "step": -2,
      "targetShift": -2,
      "end": "0.04",
      "factor": "100",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "4",
        "step": -2,
        "prompt": "4除以100，连续往小单位移两格；不是把4变成0。"
      }
    },
    {
      "id": "dividebyten",
      "sessionId": "dividebyten",
      "index": 4,
      "nodeId": "mt_kDMKJ5Ztt6",
      "taskHash": "9df15d363ec9a5c328c19e5ec93616f207fe89b82dcdfdb8fc777d033a48a877",
      "mode": "scale",
      "start": "5.2",
      "step": -1,
      "targetShift": -1,
      "end": "0.52",
      "factor": "10",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "5.2",
        "step": -1,
        "prompt": "起点换成5.2，再除以10。右移一格的关系还成立吗？"
      }
    },
    {
      "id": "structure39",
      "sessionId": "structure39",
      "index": 1,
      "nodeId": "mt__Itf4aQZUj",
      "taskHash": "676fb10cd4a5b1700ea0a6011a985ea2f33d76a6d9b86cc51cd049da449805e5",
      "mode": "shift",
      "start": "2.5",
      "step": 1,
      "targetShift": 1,
      "end": "25",
      "factor": "10",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "2.5",
        "step": 1,
        "prompt": "2.5乘10，数字各自走到什么单位？小数点仍在原来的位置。"
      }
    }
  ],
  "associated": [
    {
      "id": "link-tenpattern-decimalscale",
      "sessionId": "link-tenpattern-decimalscale",
      "index": 0,
      "nodeId": null,
      "taskHash": "cf30bdd2f5108aa8a1030c0188edb1825cc250aa6886bb1f64567f3615138d2a",
      "mode": "scale",
      "start": "300",
      "step": 1,
      "targetShift": 1,
      "end": "3000",
      "factor": "10",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "300",
        "step": 1,
        "prompt": "把300的数字向左移一格。先猜会变成多少。"
      }
    },
    {
      "id": "link-tenpattern-decimalscale",
      "sessionId": "link-tenpattern-decimalscale",
      "index": 1,
      "nodeId": null,
      "taskHash": "c90d26ec9ad3c89bcc739273524b9717a4b6c31c9fc9501223a6ea7ab4cc750b",
      "mode": "scale",
      "start": "0.4",
      "step": -1,
      "targetShift": -1,
      "end": "0.04",
      "factor": "10",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "0.4",
        "step": -1,
        "prompt": "0.4向右移一格，变成多少？先猜，再看那一小份。"
      }
    },
    {
      "id": "link-decimalscale-decimalwords",
      "sessionId": "link-decimalscale-decimalwords",
      "index": 0,
      "nodeId": null,
      "taskHash": "82dbdcb048050aa4685a62c03b56c114d5367b5bf140dad1f3c8fdfab0d425ea",
      "mode": "scale",
      "start": "0.06",
      "step": 1,
      "targetShift": 1,
      "end": "0.6",
      "factor": "10",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "0.06",
        "step": 1,
        "prompt": "0.06向左移一格，值会怎样变？"
      }
    },
    {
      "id": "link-decimalscale-powerpattern",
      "sessionId": "link-decimalscale-powerpattern",
      "index": 0,
      "nodeId": null,
      "taskHash": "82dbdcb048050aa4685a62c03b56c114d5367b5bf140dad1f3c8fdfab0d425ea",
      "mode": "scale",
      "start": "0.06",
      "step": 1,
      "targetShift": 1,
      "end": "0.6",
      "factor": "10",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "0.06",
        "step": 1,
        "prompt": "0.06向左移一格，值会怎样变？"
      }
    },
    {
      "id": "link-decimalscale-powerpattern",
      "sessionId": "link-decimalscale-powerpattern",
      "index": 1,
      "nodeId": null,
      "taskHash": "59fb81e1b5928726b40b43cbcbf34dec4b5ab139f6d4d97cb329aa4e73e29281",
      "mode": "scale",
      "start": "3.4",
      "step": 2,
      "targetShift": 2,
      "end": "340",
      "factor": "100",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "3.4",
        "step": 2,
        "prompt": "3.4×10²：把数字向左移两格，点保持原位。"
      }
    },
    {
      "id": "link-powerblocks-standardform",
      "sessionId": "link-powerblocks-standardform",
      "index": 1,
      "nodeId": null,
      "taskHash": "91798b8f5962feea837bebe6374341f6de2a1e567faf00e4d2cd238a8eab1228",
      "mode": "scientific",
      "start": "720000",
      "step": 0,
      "targetShift": -5,
      "end": "7.2",
      "factor": "100000",
      "direction": "divide",
      "exponent": "5",
      "task": {
        "type": "x-wideshift",
        "mode": "scientific",
        "start": "720000",
        "step": 0,
        "prompt": "把720000的数字移到第一位落在1到10之间；再写一个10的幂，把大小补回去。"
      }
    },
    {
      "id": "link-shifttens-powerpattern",
      "sessionId": "link-shifttens-powerpattern",
      "index": 0,
      "nodeId": null,
      "taskHash": "5886c955a60575dbe94fef7c23d9f07af43886c63f5177b143559ec1f149c2f5",
      "mode": "shift",
      "start": "1",
      "step": 2,
      "targetShift": 2,
      "end": "100",
      "factor": "100",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "1",
        "step": 2,
        "prompt": "先连续扩大十倍两次。"
      }
    },
    {
      "id": "link-shifttens-powerpattern",
      "sessionId": "link-shifttens-powerpattern",
      "index": 1,
      "nodeId": null,
      "taskHash": "4e75f46e4581ed032a25743ecd8f6347c5978318ecb235455e13b8627c89b8af",
      "mode": "scale",
      "start": "1",
      "step": 4,
      "targetShift": 4,
      "end": "10000",
      "factor": "10000",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "1",
        "step": 4,
        "prompt": "再做四次十倍变化，把它记成10⁴。",
        "factors": true
      }
    },
    {
      "id": "link-tenpattern-shifttens",
      "sessionId": "link-tenpattern-shifttens",
      "index": 0,
      "nodeId": null,
      "taskHash": "5895cf6df685c6f309fc3e55319b11397ce9993b973e1df1348442d101201402",
      "mode": "shift",
      "start": "300",
      "step": 1,
      "targetShift": 1,
      "end": "3000",
      "factor": "10",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "300",
        "step": 1,
        "prompt": "300扩大十倍，每个数字搬一格。"
      }
    },
    {
      "id": "link-tenpattern-shifttens",
      "sessionId": "link-tenpattern-shifttens",
      "index": 1,
      "nodeId": null,
      "taskHash": "d9de351631a9f406f2d77a3c93abed482a352113473cb32abfc75c7207df93a7",
      "mode": "shift",
      "start": "3.45",
      "step": 2,
      "targetShift": 2,
      "end": "345",
      "factor": "100",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "3.45",
        "step": 2,
        "prompt": "3.45扩大100倍。每个数字都要移动同样的格数。"
      }
    },
    {
      "id": "link-shifttens-shiftfine",
      "sessionId": "link-shifttens-shiftfine",
      "index": 0,
      "nodeId": null,
      "taskHash": "771cc2adbff578eb7cc263af5f2ff9d7217f4228e39e6645de621979420ce78b",
      "mode": "shift",
      "start": "72",
      "step": -3,
      "targetShift": -3,
      "end": "0.072",
      "factor": "1000",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "72",
        "step": -3,
        "prompt": "72缩小到原来的千分之一，空位置也要留好。"
      }
    },
    {
      "id": "link-shifttens-shiftfine",
      "sessionId": "link-shifttens-shiftfine",
      "index": 1,
      "nodeId": null,
      "taskHash": "4778d45c7c05c505f8c8bbb70209a5df60ef559f83667c788a6b6469045f4545",
      "mode": "shift",
      "start": "45.2",
      "step": -3,
      "targetShift": -3,
      "end": "0.0452",
      "factor": "1000",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "45.2",
        "step": -3,
        "prompt": "45.2除以1000，注意小数点后空着的位置。"
      }
    },
    {
      "id": "link-decimalplaces-shiftfine",
      "sessionId": "link-decimalplaces-shiftfine",
      "index": 0,
      "nodeId": null,
      "taskHash": "fe9af15775d75b6cc6b15abf2b8d49f44ba1d3ca015de72309407fa8e9ab23fd",
      "mode": "shift",
      "start": "3.456",
      "step": 1,
      "targetShift": 1,
      "end": "34.56",
      "factor": "10",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "3.456",
        "step": 1,
        "prompt": "3.456先扩大十倍，每个数字都移动。"
      }
    },
    {
      "id": "link-decimalplaces-shiftfine",
      "sessionId": "link-decimalplaces-shiftfine",
      "index": 1,
      "nodeId": null,
      "taskHash": "9253fee6c88e01d46be80ccfd18f16e63e9373de58eeb0e45503330415b1321f",
      "mode": "shift",
      "start": "3.456",
      "step": 2,
      "targetShift": 2,
      "end": "345.6",
      "factor": "100",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "3.456",
        "step": 2,
        "prompt": "3.456扩大100倍，最后的6落在哪里？"
      }
    },
    {
      "id": "link-shiftfine-decimaldivide",
      "sessionId": "link-shiftfine-decimaldivide",
      "index": 0,
      "nodeId": null,
      "taskHash": "9253fee6c88e01d46be80ccfd18f16e63e9373de58eeb0e45503330415b1321f",
      "mode": "shift",
      "start": "3.456",
      "step": 2,
      "targetShift": 2,
      "end": "345.6",
      "factor": "100",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "3.456",
        "step": 2,
        "prompt": "3.456扩大100倍，最后的6落在哪里？"
      }
    },
    {
      "id": "link-shiftfine-decimalproduct",
      "sessionId": "link-shiftfine-decimalproduct",
      "index": 0,
      "nodeId": null,
      "taskHash": "9253fee6c88e01d46be80ccfd18f16e63e9373de58eeb0e45503330415b1321f",
      "mode": "shift",
      "start": "3.456",
      "step": 2,
      "targetShift": 2,
      "end": "345.6",
      "factor": "100",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "3.456",
        "step": 2,
        "prompt": "3.456扩大100倍，最后的6落在哪里？"
      }
    },
    {
      "id": "link-shifttens-decimalestimate",
      "sessionId": "link-shifttens-decimalestimate",
      "index": 0,
      "nodeId": null,
      "taskHash": "d9de351631a9f406f2d77a3c93abed482a352113473cb32abfc75c7207df93a7",
      "mode": "shift",
      "start": "3.45",
      "step": 2,
      "targetShift": 2,
      "end": "345",
      "factor": "100",
      "direction": "times",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "shift",
        "start": "3.45",
        "step": 2,
        "prompt": "3.45扩大100倍。每个数字都要移动同样的格数。"
      }
    },
    {
      "id": "link-hundredths-dividebyten",
      "sessionId": "link-hundredths-dividebyten",
      "index": 1,
      "nodeId": null,
      "taskHash": "c74fca2d9654315ad783c534ce12e435a4837385092b348bdad25fcc5e72b552",
      "mode": "scale",
      "start": "4",
      "step": -2,
      "targetShift": -2,
      "end": "0.04",
      "factor": "100",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "4",
        "step": -2,
        "prompt": "4除以100，连续往小单位移两格；不是把4变成0。"
      }
    },
    {
      "id": "link-decimal-dividebyten",
      "sessionId": "link-decimal-dividebyten",
      "index": 1,
      "nodeId": null,
      "taskHash": "94520869e2aaf02cf6e4e73a460f2eb3b1c1ea572ff70927773564b2f04f9a67",
      "mode": "scale",
      "start": "37",
      "step": -1,
      "targetShift": -1,
      "end": "3.7",
      "factor": "10",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "37",
        "step": -1,
        "prompt": "37除以10。小数点不动，让所有数字往小的单位移一格。"
      }
    },
    {
      "id": "link-dividebyten-shifttens",
      "sessionId": "link-dividebyten-shifttens",
      "index": 0,
      "nodeId": null,
      "taskHash": "94520869e2aaf02cf6e4e73a460f2eb3b1c1ea572ff70927773564b2f04f9a67",
      "mode": "scale",
      "start": "37",
      "step": -1,
      "targetShift": -1,
      "end": "3.7",
      "factor": "10",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "37",
        "step": -1,
        "prompt": "37除以10。小数点不动，让所有数字往小的单位移一格。"
      }
    },
    {
      "id": "link-dividebyten-shifttens",
      "sessionId": "link-dividebyten-shifttens",
      "index": 1,
      "nodeId": null,
      "taskHash": "9df15d363ec9a5c328c19e5ec93616f207fe89b82dcdfdb8fc777d033a48a877",
      "mode": "scale",
      "start": "5.2",
      "step": -1,
      "targetShift": -1,
      "end": "0.52",
      "factor": "10",
      "direction": "divide",
      "exponent": null,
      "task": {
        "type": "x-wideshift",
        "mode": "scale",
        "start": "5.2",
        "step": -1,
        "prompt": "起点换成5.2，再除以10。右移一格的关系还成立吗？"
      }
    }
  ],
  "excludedAdd": [
    {
      "kind": "native",
      "id": "thousandstep",
      "index": 0,
      "taskHash": "c731f29330d42377b2f03a48b76922a410f1db1fd6458daeae69d6436512e998",
      "task": {
        "type": "x-wideshift",
        "mode": "add",
        "start": "4562",
        "step": 1000,
        "prompt": "原来4562，添一包1000。先猜，再亲自添。"
      }
    },
    {
      "kind": "native",
      "id": "thousandstep",
      "index": 1,
      "taskHash": "5f6068379436d21a4c678cb01052f6504404a55e4172e80dbe7765c708e90989",
      "task": {
        "type": "x-wideshift",
        "mode": "add",
        "start": "4562",
        "step": -1000,
        "prompt": "原来4562，拿回一包1000。先猜再试。"
      }
    },
    {
      "kind": "native",
      "id": "thousandstep",
      "index": 2,
      "taskHash": "0c488411248da2e3eda552cf1f17296235d7622608ae88fc5542a41fb05fc9e1",
      "task": {
        "type": "x-wideshift",
        "mode": "add",
        "start": "9500",
        "step": 1000,
        "prompt": "9500再添1000，千位装不下了。亲自换成一万。"
      }
    },
    {
      "kind": "native",
      "id": "thousandstep",
      "index": 3,
      "taskHash": "4f137472f6324b05b54066b3c3c2d6b9f8ae70ccfb2c6bb3d0c88d00bebcb86e",
      "task": {
        "type": "x-wideshift",
        "mode": "add",
        "start": "10500",
        "step": -1000,
        "prompt": "10500拿走1000，先拆一万，再拿一千。"
      }
    },
    {
      "kind": "bridge",
      "id": "link-fourplaces-thousandstep",
      "index": 1,
      "taskHash": "0c488411248da2e3eda552cf1f17296235d7622608ae88fc5542a41fb05fc9e1",
      "task": {
        "type": "x-wideshift",
        "mode": "add",
        "start": "9500",
        "step": 1000,
        "prompt": "9500再添1000，千位装不下了。亲自换成一万。"
      }
    }
  ],
  "excludedBoards": [
    {
      "id": "fourplaces",
      "index": 0,
      "taskHash": "6594e46aa9f283ad782b146a0357854e9a378931f0af0654a0e463c0624ca10f"
    },
    {
      "id": "fourplaces",
      "index": 1,
      "taskHash": "93e7fb1d55663cd83a8a93bb9a3d7831bb0567e14bb5d74bcf2e12a999e139f4"
    },
    {
      "id": "fourplaces",
      "index": 2,
      "taskHash": "3c18e51fe7dbfeca67f310767ac075c8673e486b83dc3d925c164d3006511bdd"
    },
    {
      "id": "fourfaces",
      "index": 0,
      "taskHash": "4a560c8017d7302625c4e06c4c8cb1ff6290841cb61067c8cc181633d9e7a165"
    },
    {
      "id": "fourfaces",
      "index": 1,
      "taskHash": "1d586f217414cd09a9117c2407992b02f76c90164054ea82b6a4a0a7c0d7a363"
    },
    {
      "id": "fourfaces",
      "index": 2,
      "taskHash": "f5d09bd0386a7530c96cb9e50484b6e8254b18f1bec3572cd46296fa25a3a381"
    },
    {
      "id": "bigcompare",
      "index": 0,
      "taskHash": "4830390b9496771325f0a385ab6aef72a0a57aee6f2b7ac845078abf7278e141"
    },
    {
      "id": "bigcompare",
      "index": 1,
      "taskHash": "3056808480194c6cc4b64c48d9c9b9e9cb5ca2af2e299722aaa0e90e9884ce3b"
    },
    {
      "id": "bigcompare",
      "index": 2,
      "taskHash": "3af8e623611e2f89e1e0aa354e1f023203a77fd200f5ceee9381967878a05639"
    },
    {
      "id": "placeproblems",
      "index": 1,
      "taskHash": "fe801fed3d8193d295850adbb8d19aacbdb0c33aee17f0de07f849849b04f1a2"
    },
    {
      "id": "placeproblems",
      "index": 2,
      "taskHash": "2acf56a39a6151dc771234f11215a0e23b8ea48593b69372bfdd4127f2cde809"
    },
    {
      "id": "sixdigits",
      "index": 0,
      "taskHash": "7006cdb7830155975e451f921df147a62645d29a6356654b2a7847ccc7e97686"
    },
    {
      "id": "sixdigits",
      "index": 1,
      "taskHash": "3331b5f9dd84b2a2f526c54f4e6674bc599edf5ded2c57b12663dc2cad6a0931"
    },
    {
      "id": "sixdigits",
      "index": 2,
      "taskHash": "15c65015c8abb99241d30bb8ffff1bf16ea6ba529c114a612ffd664acce484ea"
    },
    {
      "id": "bigproblems",
      "index": 0,
      "taskHash": "f667f49db59d7e0dbe0d57a18611ccaa04cc19b305b9dc7c657a95aa28bcb7b0"
    },
    {
      "id": "bigproblems",
      "index": 2,
      "taskHash": "7a40c552e48ec98d9918c0eefa90dbb10e81ee3efa896710531eeee20fb6205f"
    },
    {
      "id": "millionwords",
      "index": 0,
      "taskHash": "8bc5dd8f60f395e296ffb98c010a6fec0813625988e9458e33e57baf7d6687fa"
    },
    {
      "id": "millionwords",
      "index": 1,
      "taskHash": "f4b80d951ea72967caa1de4041a4aa113cd4d7d1d69d56ab59fb6ecbb1278e38"
    },
    {
      "id": "millionwords",
      "index": 2,
      "taskHash": "7b1ba23652f8bca70a677a42a0f8fa879d76e0f380f287da15aa9a03b80d8f4f"
    },
    {
      "id": "tenmillion",
      "index": 1,
      "taskHash": "0deadc9a3d0aac1cdf6206a515848e9642f08d687f6d8e4b730d70aae64c859c"
    },
    {
      "id": "decimalplaces",
      "index": 0,
      "taskHash": "51f9dfd91718e7c07a4a4e0cd4db196edb0150927c2b8e49460c73ded020fdfc"
    },
    {
      "id": "decimalplaces",
      "index": 2,
      "taskHash": "f28153620b25a2e482a5b7d0a9da51d7bab71fc2e55c8cb7cf2b8dcfcfad56b1"
    },
    {
      "id": "decimalwords",
      "index": 0,
      "taskHash": "6637a991450b6b60a8e7471f77a03521c73f317a2f8f36408ff313ccd538247c"
    },
    {
      "id": "decimalwords",
      "index": 1,
      "taskHash": "4606f0ac1dcba6c732c02840e8df8ff3daec24551760616dd649f1e69fcf8e55"
    },
    {
      "id": "decimalwords",
      "index": 2,
      "taskHash": "a8eb13f08cdfc69fbadc5209d9df89cdf7f693849f52dd9558f72dbac47ad3b4"
    },
    {
      "id": "standardform",
      "index": 3,
      "taskHash": "514d38d96b57dcfd28fe0e707997ecd5987e84b4e3a23583389f34015aa5952b"
    },
    {
      "id": "dividebyten",
      "index": 1,
      "taskHash": "919013faf5036dedcdecd85f6be54854bce6d65f73dff604d4fa7beee634574f"
    },
    {
      "id": "dividebyten",
      "index": 3,
      "taskHash": "6606147509375af0e851c6ce1cb9020419c5e73f1c768d920231b7411b07b913"
    }
  ],
  "sourceHashes": {
    "dist/learning/phase5/b08.js": "b12e70102498f264fa339ac94de3eff98061f1a933508fc0b66d4a332661f5fc",
    "dist/learning/phase5/b14.js": "ea9fc678c74ecaebcd7557a302128312c48e3075c04bab38aaae3efcdda54093",
    "dist/learning/phase5/b18.js": "42a8183150eac38507cba09cbae6b9adc2ee0ff43dd4f820a56e4c17f8c05dd9",
    "dist/learning/phase5/b39.js": "f282d5afe8b478b1e6ff623424f473d42f70212142556a0a433d68d369670838",
    "dist/learning/phase5/b08-model.js": "b966650d1aead5f49916911f8b2d7e6f6d41b6a9be465143359a3d82e06932c6",
    "dist/learning/phase5/b08-math.js": "c32aa674806576039a7b947ac7a88a6b7c327b58a4ef9ee04a46192900ff9adb",
    "dist/learning/phase5/b08-view.js": "b17455e6ff2fad8e62f102ff394588bba9c469391fb810bcd5bee25b6a89db30"
  }
};
