#!/bin/zsh
cd -- "${0:A:h}" || exit 1
if command -v python3 >/dev/null 2>&1; then
  python3 scripts/server.py --open
elif [[ -x /opt/homebrew/bin/python3 ]]; then
  /opt/homebrew/bin/python3 scripts/server.py --open
else
  print '没有找到 Python 3。请安装 Python 3 后再打开。'
  read 'reply?按回车关闭窗口。'
  exit 1
fi
