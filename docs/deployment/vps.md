# 数学探索：VPS 预览部署

状态：部署方案与自动化已准备；**尚未连接或发布到真实 VPS**。需要先填写服务器、域名和 SSH 信任信息。

## 部署边界

- 只发布仓库 `dist/` 静态文件；Nginx 提供 HTTPS 和静态资源，不运行 Python 服务，不需要数据库、账号系统、模型 API 或云端学习记录。
- 预览默认启用 Nginx Basic Auth。健康检查只公开返回应用标识，不暴露学习数据。
- 学习进度、草稿和地图视角仍保存在访问者自己的浏览器本地存储。新域名是新的浏览器 origin，**不会自动迁移 localhost 的已有记录，也不会在设备间同步**。
- 服务工作线程（Service Worker）按相对路径注册并预缓存离线资源，因此部署在独立子域名根路径（例如 `https://math-preview.example.com/`），不要挂在网站的 `/math/` 子目录下。
- 不改变数学树节点、关系、坐标、视觉、学习路线或文字优化分支。

## VPS 首次准备

建议使用 Ubuntu 22.04/24.04。先把预览子域名的 DNS A 记录指向 VPS 公网 IP。

安装 Nginx、Certbot、rsync 和 Basic Auth 工具：

```sh
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx rsync apache2-utils
sudo install -d -o "$USER" -g "$USER" /var/www/math-explorer-preview/releases
sudo install -d -o www-data -g www-data /var/www/certbot
```

为预览创建独立密码（命令会交互式询问密码；不要把密码提交到仓库）：

```sh
sudo htpasswd -cB /etc/nginx/.htpasswd-math-preview preview
```

将 `deploy/vps/nginx-math-preview.conf.example` 复制为 Nginx 站点配置，替换 `server_name` 为你的真实子域名；确认 `root` 与 `VPS_WEB_ROOT/current` 一致（默认 `/var/www/math-explorer-preview/current`）。启用站点并检查：

```sh
sudo ln -s /etc/nginx/sites-available/math-preview /etc/nginx/sites-enabled/math-preview
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d math-preview.example.com
```

Certbot 完成后，确认 HTTP 自动跳转 HTTPS，且 `https://你的子域名/health` 返回 `{"app":"math-explorer","status":"ok"}`。

## GitHub 部署配置

在仓库 Settings → Secrets and variables → Actions 中设置以下 Repository variables：

| Variable | 示例 | 说明 |
| --- | --- | --- |
| `VPS_DEPLOY_ENABLED` | `true` | 最后设置；未设置或不是 true 时部署任务会跳过 |
| `VPS_HOST` | `203.0.113.10` | VPS 的 SSH 主机/IP |
| `VPS_USER` | `math-deploy` | 仅能写入预览目录的部署用户 |
| `VPS_PORT` | `22` | SSH 端口；可省略，默认 22 |
| `VPS_WEB_ROOT` | `/var/www/math-explorer-preview` | 与 Nginx root 对应 |
| `VPS_URL` | `https://math-preview.example.com` | 用于 HTTPS 健康检查 |

设置以下 Repository secrets：

| Secret | 说明 |
| --- | --- |
| `VPS_SSH_KEY` | 部署用户专用 SSH 私钥；不要使用 root 密钥 |
| `VPS_KNOWN_HOSTS` | 已核验的 VPS SSH host key 行；不要关闭 StrictHostKeyChecking |

部署用户需能写入 `VPS_WEB_ROOT`，并且不能拥有其他站点或系统目录的写权限。私钥只保存在 GitHub Secrets，不写入仓库或聊天。

先配置除 `VPS_DEPLOY_ENABLED` 以外的变量和 secrets，再检查 Nginx、HTTPS、Basic Auth 和健康检查。全部确认后，最后把 `VPS_DEPLOY_ENABLED` 设为 `true`。此后 `main` 上涉及 `dist/` 的更新会自动部署；也可以在 Actions 中手动运行 **Deploy Math Explorer preview**。工作流只允许从 `main` 发布。

## 发布、回滚与验收

- 发布脚本把每个提交放入独立 release 目录，最后原子切换 `current` 符号链接；失败时尽量恢复上一个 release，并保留当前和上一个版本，最多保留最近五个版本。
- 回滚使用同一组 SSH 环境变量执行 `bash scripts/rollback-vps.sh`，将 `current` 与 `previous` 交换，再检查 HTTPS 健康端点。
- 验收必须在真实域名 HTTPS 下完成：登录预览、进入三维全貌、缩放/旋转、打开学习活动、刷新恢复、Service Worker 安装与离线重开。CI 的 localhost 浏览器测试不能代替公网域名验收。
- 若 Basic Auth 被浏览器记住，测试时用无痕窗口确认未授权访问会被拒绝；`/health` 例外，只返回固定状态文本。

## 已知限制

- 当前没有已确认的 VPS 主机、域名或可用 SSH 连接；因此这份 PR 只准备部署能力，不代表已上线。
- 浏览器本地记录仍按 origin 隔离；本地 localhost 记录不会随部署上传。不要把它误认为云同步。
- Nginx 配置、SSH 密钥、域名和证书必须在真实服务器上按本说明设置后，才能进行第一次发布。
