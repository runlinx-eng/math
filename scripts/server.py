#!/usr/bin/env python3
"""Loopback-only, dependency-free launcher for the local learning app."""
import argparse
import errno
import http.server
import json
import pathlib
import sys
import threading
import urllib.request
import webbrowser

ROOT = pathlib.Path(__file__).resolve().parents[1]
APP = 'local-math-explorer'

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT/'dist'),**kwargs)
    def do_GET(self):
        if self.path == '/health':
            payload=json.dumps({'app':APP,'version':1}).encode()
            self.send_response(200)
            self.send_header('Content-Type','application/json')
            self.send_header('Content-Length',str(len(payload)))
            self.end_headers(); self.wfile.write(payload)
        else:
            super().do_GET()
    def end_headers(self):
        self.send_header('Cache-Control','no-cache')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','no-referrer')
        super().end_headers()
    def log_message(self,fmt,*args):
        if args and str(args[1]) not in ('200','304'):
            super().log_message(fmt,*args)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=43827)
    parser.add_argument('--open',action='store_true')
    args=parser.parse_args()
    url=f'http://127.0.0.1:{args.port}'
    try:
        server=http.server.ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    except OSError as error:
        if error.errno != errno.EADDRINUSE:
            raise SystemExit(f'本机服务启动失败：{error}。请在终端打开启动脚本后重试。')
        try:
            opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
            with opener.open(url+'/health',timeout=2) as response:
                owned=json.load(response).get('app')==APP
        except Exception:
            owned=False
        if owned:
            print(f'数学探索已在运行：{url}',flush=True)
            if args.open:webbrowser.open(url+'/#space')
            return
        raise SystemExit(f'端口 {args.port} 已被其他程序占用；未停止或改变任何程序。可指定 --port 新端口（不同端口的浏览器记录相互独立）。')
    print(f'数学探索已启动：{url}/#space\n只供这台电脑访问。按 Control+C 可停止。',flush=True)
    if args.open:threading.Timer(.5,lambda:webbrowser.open(url+'/#space')).start()
    try:server.serve_forever()
    except KeyboardInterrupt:print('\n数学探索已停止。学习记录仍在浏览器中。',flush=True)
    finally:server.server_close()

if __name__=='__main__':main()
