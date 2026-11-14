// Constructed from the pinned historical B20/B24 public APIs, not a child backup.
// Static model snapshots must remain independent of the repaired runtime parser.
module.exports={
  "sourceCommit": "a7f1860c035c73da0ce9698b2a9f1cb103a2787e",
  "sourceHashes": {
    "b20": "5cb969c078815ca75974eb1c1fe42a416b3f1cf31b02179924cdd4243bd2de9c",
    "b24": "2d7ac1bba93bc201990e4c94452592cdb78d0c4e490f4f6e647744c0d9e93b04"
  },
  "provenance": {
    "constructedLegacyFixture": true,
    "realHistoricalChildBackup": false
  },
  "legacyCases": [
    {
      "id": "pointmove",
      "index": 0,
      "originalCorrect": true,
      "hasSubmission": true
    },
    {
      "id": "growshape",
      "index": 0,
      "originalCorrect": false,
      "hasSubmission": false
    }
  ],
  "backup": {
    "app": "math-explorer",
    "version": 2,
    "exportedAt": "2026-11-14T01:00:00.000Z",
    "state": {
      "schema": 2,
      "daily": {
        "bridges": {},
        "questions": [],
        "continuation": null
      },
      "visited": {},
      "openedPacks": {},
      "bookmarks": [],
      "activities": {},
      "lessons": {
        "pointmove": {
          "id": "pointmove",
          "view": "task",
          "index": 0,
          "models": {
            "0": {
              "x": "",
              "y": "",
              "item": "",
              "dx": "3",
              "dy": "0",
              "axis": "",
              "angle": "",
              "cx": "",
              "cy": "",
              "factor": "",
              "predX": "-0 5/1",
              "predY": "3",
              "kind": "",
              "slot": "",
              "amplitude": "",
              "prose": "旧版把负五误解成正五时的完整记录。",
              "answers": [
                "5",
                "3"
              ],
              "seed": 314159,
              "board": {
                "first": {
                  "predict": {
                    "predX": "-0 5/1",
                    "predY": "3"
                  },
                  "prediction": {
                    "x": "-0 5/1",
                    "y": "3"
                  },
                  "operate": {
                    "dx": "3",
                    "dy": "0",
                    "axis": "",
                    "angle": "",
                    "cx": "",
                    "cy": "",
                    "factor": ""
                  }
                },
                "prediction": {
                  "x": "-0 5/1",
                  "y": "3"
                },
                "image": [
                  [
                    5,
                    3
                  ]
                ],
                "op": {
                  "kind": "move",
                  "dx": 3,
                  "dy": 0
                },
                "saved": {
                  "dx": "3",
                  "dy": "0",
                  "axis": "",
                  "angle": "",
                  "cx": "",
                  "cy": "",
                  "factor": ""
                },
                "measured": false
              },
              "history": [
                {
                  "a": "predict",
                  "f": {
                    "predX": "-0 5/1",
                    "predY": "3"
                  },
                  "d": {}
                },
                {
                  "a": "operate",
                  "f": {
                    "dx": "3",
                    "dy": "0",
                    "axis": "",
                    "angle": "",
                    "cx": "",
                    "cy": "",
                    "factor": ""
                  },
                  "d": {}
                }
              ],
              "issue": ""
            },
            "1": {
              "x": "",
              "y": "",
              "item": "",
              "dx": "4",
              "dy": "2",
              "axis": "",
              "angle": "",
              "cx": "",
              "cy": "",
              "factor": "",
              "predX": "5",
              "predY": "3",
              "kind": "",
              "slot": "",
              "amplitude": "",
              "prose": "",
              "answers": [
                "5",
                "3",
                "same"
              ],
              "seed": 314159,
              "board": {
                "first": {
                  "predict": {
                    "predX": "5",
                    "predY": "3"
                  },
                  "prediction": {
                    "x": "5",
                    "y": "3"
                  },
                  "operate": {
                    "dx": "4",
                    "dy": "2",
                    "axis": "",
                    "angle": "",
                    "cx": "",
                    "cy": "",
                    "factor": ""
                  }
                },
                "prediction": {
                  "x": "5",
                  "y": "3"
                },
                "image": [
                  [
                    5,
                    3
                  ],
                  [
                    7,
                    3
                  ],
                  [
                    5,
                    5
                  ]
                ],
                "op": {
                  "kind": "move",
                  "dx": 4,
                  "dy": 2
                },
                "saved": {
                  "dx": "4",
                  "dy": "2",
                  "axis": "",
                  "angle": "",
                  "cx": "",
                  "cy": "",
                  "factor": ""
                },
                "measured": false
              },
              "history": [
                {
                  "a": "predict",
                  "f": {
                    "predX": "5",
                    "predY": "3"
                  },
                  "d": {}
                },
                {
                  "a": "operate",
                  "f": {
                    "dx": "4",
                    "dy": "2",
                    "axis": "",
                    "angle": "",
                    "cx": "",
                    "cy": "",
                    "factor": ""
                  },
                  "d": {}
                }
              ],
              "issue": ""
            },
            "2": {
              "x": "",
              "y": "",
              "item": "",
              "dx": "3",
              "dy": "2",
              "axis": "",
              "angle": "",
              "cx": "",
              "cy": "",
              "factor": "",
              "predX": "4",
              "predY": "4",
              "kind": "",
              "slot": "",
              "amplitude": "",
              "prose": "",
              "answers": [
                "4",
                "4"
              ],
              "seed": 314159,
              "board": {
                "first": {
                  "predict": {
                    "predX": "4",
                    "predY": "4"
                  },
                  "prediction": {
                    "x": "4",
                    "y": "4"
                  },
                  "operate": {
                    "dx": "3",
                    "dy": "2",
                    "axis": "",
                    "angle": "",
                    "cx": "",
                    "cy": "",
                    "factor": ""
                  }
                },
                "prediction": {
                  "x": "4",
                  "y": "4"
                },
                "image": [
                  [
                    4,
                    4
                  ]
                ],
                "op": {
                  "kind": "move",
                  "dx": 3,
                  "dy": 2
                },
                "saved": {
                  "dx": "3",
                  "dy": "2",
                  "axis": "",
                  "angle": "",
                  "cx": "",
                  "cy": "",
                  "factor": ""
                },
                "measured": false
              },
              "history": [
                {
                  "a": "predict",
                  "f": {
                    "predX": "4",
                    "predY": "4"
                  },
                  "d": {}
                },
                {
                  "a": "operate",
                  "f": {
                    "dx": "3",
                    "dy": "2",
                    "axis": "",
                    "angle": "",
                    "cx": "",
                    "cy": "",
                    "factor": ""
                  },
                  "d": {}
                }
              ],
              "issue": ""
            }
          },
          "cases": {
            "0": {
              "support": false,
              "attempts": [
                {
                  "id": "legacy-point-0",
                  "at": "2026-11-14T01:00:00.000Z",
                  "value": {
                    "x": "",
                    "y": "",
                    "item": "",
                    "dx": "3",
                    "dy": "0",
                    "axis": "",
                    "angle": "",
                    "cx": "",
                    "cy": "",
                    "factor": "",
                    "predX": "-0 5/1",
                    "predY": "3",
                    "kind": "",
                    "slot": "",
                    "amplitude": "",
                    "prose": "旧版把负五误解成正五时的完整记录。",
                    "answers": [
                      "5",
                      "3"
                    ],
                    "seed": 314159,
                    "board": {
                      "first": {
                        "predict": {
                          "predX": "-0 5/1",
                          "predY": "3"
                        },
                        "prediction": {
                          "x": "-0 5/1",
                          "y": "3"
                        },
                        "operate": {
                          "dx": "3",
                          "dy": "0",
                          "axis": "",
                          "angle": "",
                          "cx": "",
                          "cy": "",
                          "factor": ""
                        }
                      },
                      "prediction": {
                        "x": "-0 5/1",
                        "y": "3"
                      },
                      "image": [
                        [
                          5,
                          3
                        ]
                      ],
                      "op": {
                        "kind": "move",
                        "dx": 3,
                        "dy": 0
                      },
                      "saved": {
                        "dx": "3",
                        "dy": "0",
                        "axis": "",
                        "angle": "",
                        "cx": "",
                        "cy": "",
                        "factor": ""
                      },
                      "measured": false
                    },
                    "history": [
                      {
                        "a": "predict",
                        "f": {
                          "predX": "-0 5/1",
                          "predY": "3"
                        },
                        "d": {}
                      },
                      {
                        "a": "operate",
                        "f": {
                          "dx": "3",
                          "dy": "0",
                          "axis": "",
                          "angle": "",
                          "cx": "",
                          "cy": "",
                          "factor": ""
                        },
                        "d": {}
                      }
                    ],
                    "issue": ""
                  },
                  "supported": false,
                  "exposed": false
                }
              ]
            },
            "1": {
              "support": false,
              "attempts": [
                {
                  "id": "legacy-point-1",
                  "at": "2026-11-14T01:00:00.000Z",
                  "value": {
                    "x": "",
                    "y": "",
                    "item": "",
                    "dx": "4",
                    "dy": "2",
                    "axis": "",
                    "angle": "",
                    "cx": "",
                    "cy": "",
                    "factor": "",
                    "predX": "5",
                    "predY": "3",
                    "kind": "",
                    "slot": "",
                    "amplitude": "",
                    "prose": "",
                    "answers": [
                      "5",
                      "3",
                      "same"
                    ],
                    "seed": 314159,
                    "board": {
                      "first": {
                        "predict": {
                          "predX": "5",
                          "predY": "3"
                        },
                        "prediction": {
                          "x": "5",
                          "y": "3"
                        },
                        "operate": {
                          "dx": "4",
                          "dy": "2",
                          "axis": "",
                          "angle": "",
                          "cx": "",
                          "cy": "",
                          "factor": ""
                        }
                      },
                      "prediction": {
                        "x": "5",
                        "y": "3"
                      },
                      "image": [
                        [
                          5,
                          3
                        ],
                        [
                          7,
                          3
                        ],
                        [
                          5,
                          5
                        ]
                      ],
                      "op": {
                        "kind": "move",
                        "dx": 4,
                        "dy": 2
                      },
                      "saved": {
                        "dx": "4",
                        "dy": "2",
                        "axis": "",
                        "angle": "",
                        "cx": "",
                        "cy": "",
                        "factor": ""
                      },
                      "measured": false
                    },
                    "history": [
                      {
                        "a": "predict",
                        "f": {
                          "predX": "5",
                          "predY": "3"
                        },
                        "d": {}
                      },
                      {
                        "a": "operate",
                        "f": {
                          "dx": "4",
                          "dy": "2",
                          "axis": "",
                          "angle": "",
                          "cx": "",
                          "cy": "",
                          "factor": ""
                        },
                        "d": {}
                      }
                    ],
                    "issue": ""
                  },
                  "supported": false,
                  "exposed": false
                }
              ]
            },
            "2": {
              "support": false,
              "attempts": [
                {
                  "id": "legacy-point-2",
                  "at": "2026-11-14T01:00:00.000Z",
                  "value": {
                    "x": "",
                    "y": "",
                    "item": "",
                    "dx": "3",
                    "dy": "2",
                    "axis": "",
                    "angle": "",
                    "cx": "",
                    "cy": "",
                    "factor": "",
                    "predX": "4",
                    "predY": "4",
                    "kind": "",
                    "slot": "",
                    "amplitude": "",
                    "prose": "",
                    "answers": [
                      "4",
                      "4"
                    ],
                    "seed": 314159,
                    "board": {
                      "first": {
                        "predict": {
                          "predX": "4",
                          "predY": "4"
                        },
                        "prediction": {
                          "x": "4",
                          "y": "4"
                        },
                        "operate": {
                          "dx": "3",
                          "dy": "2",
                          "axis": "",
                          "angle": "",
                          "cx": "",
                          "cy": "",
                          "factor": ""
                        }
                      },
                      "prediction": {
                        "x": "4",
                        "y": "4"
                      },
                      "image": [
                        [
                          4,
                          4
                        ]
                      ],
                      "op": {
                        "kind": "move",
                        "dx": 3,
                        "dy": 2
                      },
                      "saved": {
                        "dx": "3",
                        "dy": "2",
                        "axis": "",
                        "angle": "",
                        "cx": "",
                        "cy": "",
                        "factor": ""
                      },
                      "measured": false
                    },
                    "history": [
                      {
                        "a": "predict",
                        "f": {
                          "predX": "4",
                          "predY": "4"
                        },
                        "d": {}
                      },
                      {
                        "a": "operate",
                        "f": {
                          "dx": "3",
                          "dy": "2",
                          "axis": "",
                          "angle": "",
                          "cx": "",
                          "cy": "",
                          "factor": ""
                        },
                        "d": {}
                      }
                    ],
                    "issue": ""
                  },
                  "supported": false,
                  "exposed": false
                }
              ]
            }
          },
          "notes": [
            {
              "id": "legacy-note-pointmove",
              "at": "2026-11-14T01:00:00.000Z",
              "text": "旧版留下的原话：pointmove"
            }
          ],
          "draft": "旧记录中尚未提交的课程草稿：pointmove",
          "updatedAt": "2026-11-14T01:00:00.000Z",
          "ui": {
            "spread": 0,
            "view": null,
            "camera": null
          }
        },
        "growshape": {
          "id": "growshape",
          "view": "task",
          "index": 0,
          "models": {
            "0": {
              "x": "",
              "y": "",
              "item": "",
              "dx": "",
              "dy": "",
              "axis": "",
              "angle": "",
              "cx": "0",
              "cy": "0",
              "factor": "-0 1/2",
              "predX": "2",
              "predY": "2",
              "kind": "",
              "slot": "",
              "amplitude": "",
              "prose": "未提交的旧缩放草稿必须原样归档。",
              "answers": [
                "",
                "",
                ""
              ],
              "seed": 271828,
              "board": {
                "first": {
                  "predict": {
                    "predX": "2",
                    "predY": "2"
                  },
                  "prediction": {
                    "x": "2",
                    "y": "2"
                  },
                  "operate": {
                    "dx": "",
                    "dy": "",
                    "axis": "",
                    "angle": "",
                    "cx": "0",
                    "cy": "0",
                    "factor": "-0 1/2"
                  }
                },
                "prediction": {
                  "x": "2",
                  "y": "2"
                },
                "image": [
                  [
                    0.5,
                    0.5
                  ],
                  [
                    1.5,
                    0.5
                  ],
                  [
                    0.5,
                    1.5
                  ]
                ],
                "op": {
                  "kind": "scale",
                  "factor": 0.5,
                  "center": [
                    0,
                    0
                  ]
                },
                "saved": {
                  "dx": "",
                  "dy": "",
                  "axis": "",
                  "angle": "",
                  "cx": "0",
                  "cy": "0",
                  "factor": "-0 1/2"
                },
                "measured": false
              },
              "history": [
                {
                  "a": "predict",
                  "f": {
                    "predX": "2",
                    "predY": "2"
                  },
                  "d": {}
                },
                {
                  "a": "operate",
                  "f": {
                    "dx": "",
                    "dy": "",
                    "axis": "",
                    "angle": "",
                    "cx": "0",
                    "cy": "0",
                    "factor": "-0 1/2"
                  },
                  "d": {}
                }
              ],
              "issue": ""
            }
          },
          "cases": {},
          "notes": [
            {
              "id": "legacy-note-growshape",
              "at": "2026-11-14T01:00:00.000Z",
              "text": "旧版留下的原话：growshape"
            }
          ],
          "draft": "旧记录中尚未提交的课程草稿：growshape",
          "updatedAt": "2026-11-14T01:00:00.000Z",
          "ui": {
            "spread": 0,
            "view": null,
            "camera": null
          }
        },
        "lineplaces": {
          "id": "lineplaces",
          "view": "task",
          "index": 0,
          "models": {
            "0": {
              "rows": "1",
              "cols": "1",
              "parts": "4",
              "take": "",
              "answer": "1/4",
              "unit": "",
              "equation": "",
              "den": "",
              "num": "",
              "whole": "",
              "remainder": "",
              "copies": "",
              "prediction": "",
              "relation": "",
              "left": "",
              "right": "",
              "reason": "",
              "step": "",
              "position": "0",
              "choice": "",
              "result": "",
              "shift": "0",
              "rotation": "0",
              "x": "0",
              "y": "0",
              "per": "",
              "total": "",
              "color": "0",
              "decimal": "",
              "percent": "",
              "top": "",
              "bottom": "",
              "word": "",
              "count": "1",
              "fixed": "0",
              "board": {
                "parts": 4,
                "steps": [
                  1
                ],
                "first": "4"
              },
              "history": [
                {
                  "action": "partition",
                  "data": {
                    "fields": {
                      "rows": "1",
                      "cols": "1",
                      "parts": "4",
                      "take": "",
                      "answer": "",
                      "unit": "",
                      "equation": "",
                      "den": "",
                      "num": "",
                      "whole": "",
                      "remainder": "",
                      "copies": "",
                      "prediction": "",
                      "relation": "",
                      "left": "",
                      "right": "",
                      "reason": "",
                      "step": "",
                      "position": "0",
                      "choice": "",
                      "result": "",
                      "shift": "0",
                      "rotation": "0",
                      "x": "0",
                      "y": "0",
                      "per": "",
                      "total": "",
                      "color": "0",
                      "decimal": "",
                      "percent": "",
                      "top": "",
                      "bottom": "",
                      "word": "",
                      "count": "1",
                      "fixed": "0"
                    }
                  }
                },
                {
                  "action": "walk",
                  "data": {
                    "fields": {
                      "rows": "1",
                      "cols": "1",
                      "parts": "4",
                      "take": "",
                      "answer": "",
                      "unit": "",
                      "equation": "",
                      "den": "",
                      "num": "",
                      "whole": "",
                      "remainder": "",
                      "copies": "",
                      "prediction": "",
                      "relation": "",
                      "left": "",
                      "right": "",
                      "reason": "",
                      "step": "",
                      "position": "0",
                      "choice": "",
                      "result": "",
                      "shift": "0",
                      "rotation": "0",
                      "x": "0",
                      "y": "0",
                      "per": "",
                      "total": "",
                      "color": "0",
                      "decimal": "",
                      "percent": "",
                      "top": "",
                      "bottom": "",
                      "word": "",
                      "count": "1",
                      "fixed": "0"
                    }
                  }
                }
              ],
              "issue": ""
            }
          },
          "cases": {
            "0": {
              "support": true,
              "attempts": [
                {
                  "id": "unaffected-unitwalk-0",
                  "at": "2026-11-14T01:00:00.000Z",
                  "value": {
                    "rows": "1",
                    "cols": "1",
                    "parts": "4",
                    "take": "",
                    "answer": "1/4",
                    "unit": "",
                    "equation": "",
                    "den": "",
                    "num": "",
                    "whole": "",
                    "remainder": "",
                    "copies": "",
                    "prediction": "",
                    "relation": "",
                    "left": "",
                    "right": "",
                    "reason": "",
                    "step": "",
                    "position": "0",
                    "choice": "",
                    "result": "",
                    "shift": "0",
                    "rotation": "0",
                    "x": "0",
                    "y": "0",
                    "per": "",
                    "total": "",
                    "color": "0",
                    "decimal": "",
                    "percent": "",
                    "top": "",
                    "bottom": "",
                    "word": "",
                    "count": "1",
                    "fixed": "0",
                    "board": {
                      "parts": 4,
                      "steps": [
                        1
                      ],
                      "first": "4"
                    },
                    "history": [
                      {
                        "action": "partition",
                        "data": {
                          "fields": {
                            "rows": "1",
                            "cols": "1",
                            "parts": "4",
                            "take": "",
                            "answer": "",
                            "unit": "",
                            "equation": "",
                            "den": "",
                            "num": "",
                            "whole": "",
                            "remainder": "",
                            "copies": "",
                            "prediction": "",
                            "relation": "",
                            "left": "",
                            "right": "",
                            "reason": "",
                            "step": "",
                            "position": "0",
                            "choice": "",
                            "result": "",
                            "shift": "0",
                            "rotation": "0",
                            "x": "0",
                            "y": "0",
                            "per": "",
                            "total": "",
                            "color": "0",
                            "decimal": "",
                            "percent": "",
                            "top": "",
                            "bottom": "",
                            "word": "",
                            "count": "1",
                            "fixed": "0"
                          }
                        }
                      },
                      {
                        "action": "walk",
                        "data": {
                          "fields": {
                            "rows": "1",
                            "cols": "1",
                            "parts": "4",
                            "take": "",
                            "answer": "",
                            "unit": "",
                            "equation": "",
                            "den": "",
                            "num": "",
                            "whole": "",
                            "remainder": "",
                            "copies": "",
                            "prediction": "",
                            "relation": "",
                            "left": "",
                            "right": "",
                            "reason": "",
                            "step": "",
                            "position": "0",
                            "choice": "",
                            "result": "",
                            "shift": "0",
                            "rotation": "0",
                            "x": "0",
                            "y": "0",
                            "per": "",
                            "total": "",
                            "color": "0",
                            "decimal": "",
                            "percent": "",
                            "top": "",
                            "bottom": "",
                            "word": "",
                            "count": "1",
                            "fixed": "0"
                          }
                        }
                      }
                    ],
                    "issue": ""
                  },
                  "supported": true,
                  "exposed": false
                }
              ]
            }
          },
          "notes": [
            {
              "id": "legacy-note-lineplaces",
              "at": "2026-11-14T01:00:00.000Z",
              "text": "旧版留下的原话：lineplaces"
            }
          ],
          "draft": "旧记录中尚未提交的课程草稿：lineplaces",
          "updatedAt": "2026-11-14T01:00:00.000Z",
          "ui": {
            "spread": 0,
            "view": null,
            "camera": null
          }
        }
      },
      "lessonContinuation": null,
      "journeys": {},
      "journeyContinuation": null,
      "continuation": null,
      "legacy": null
    }
  }
};
