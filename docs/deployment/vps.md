# 数学探索：现有 VPS 预览部署

状态：VPS、DNS、Nginx、HTTPS、预览密码和 GitHub SSH 凭据均已配置，并通过公网健康检查；**首次网页发布尚未执行**。当前方案适配已有服务器，保留原有 Xray 服务。

## 已知服务器与端口边界

- VPS：BandwagonHost USCA_6 / DC6 CN2 GIA-E，Los Angeles。
- 系统：Debian 12 x64；公网 IP：`173.242.119.233`。
- SSH：TCP 22。
- TCP 443 已由现有 Xray（VLESS + REALITY + Vision）监听，**数学树不得占用、重启、改写或替换该服务**。
- 预览域名：`math.664357788.xyz`，DNS A 记录已解析到本机 VPS，公网 HTTP/HTTPS 健康检查已通过。
- Cloudflare DNS 新增独立 A 记录：`math` → `173.242.119.233`，使用 DNS only（灰云）。不要复用 `vpn.664357788.xyz`，现有记录指向旧服务器 IP。
- 端口规划：TCP 80 用于 Let's Encrypt HTTP-01 验证及跳转；TCP 8443 提供数学树 HTTPS；TCP 443 完全保留给 Xray。

## 部署边界

- 只发布仓库 `dist/` 静态文件；不运行 Python 服务，不新增数据库、账号系统、模型 API 或云端学习记录。
- 预览默认使用 Nginx Basic Auth。只有固定内容的 `/health` 健康检查公开，不返回学习数据。
- 学习进度、草稿和地图视角仍保存在访问者自己的浏览器本地存储。新域名是新的浏览器 origin，不会自动迁移 localhost 的已有记录，也不会在设备间同步。
- Service Worker 按相对路径注册并预缓存资源，因此部署在独立子域名根路径，不要挂在网站的 `/math/` 子目录下。
- 不改变数学树节点、关系、坐标、视觉、学习路线或文字优化分支。

## VPS 首次准备

以下步骤在确认域名后执行。先检查现有监听和防火墙，不要重装系统、不要重启 Xray，也不要覆盖 SSH 配置：

```sh
sudo ss -ltnp
sudo systemctl is-active xray
sudo apt update
sudo apt install -y nginx certbot rsync apache2-utils
```

创建专用部署用户 `math-deploy`，只允许 SSH 公钥登录，不授予 sudo/root 权限；只给它写入 `/var/www/math-explorer-preview` 的权限。不要把现有 root/VPN 私钥交给 GitHub Actions。将单独生成的部署公钥安装到该用户的 `authorized_keys`，并关闭该用户的端口转发、X11 和 PTY。

创建目录：

```sh
sudo install -d -o math-deploy -g math-deploy -m 755 /var/www/math-explorer-preview/releases
sudo install -d -o www-data -g www-data -m 755 /var/www/certbot/.well-known/acme-challenge
```

确认 Cloudflare 的 `math` A 记录已解析到 `173.242.119.233`，且为 DNS only。确认现有防火墙允许 TCP 80 和 8443；只添加缺少的两条规则，不更改 22/443，不启用或重置现有防火墙策略。

## 证书与 Nginx

先安装临时 HTTP 配置，获取证书后再启用最终 HTTPS 配置：

1. 将 `deploy/vps/nginx-math-preview-http.conf.example` 复制到 `/etc/nginx/sites-available/math-preview`，启用站点，执行 `sudo nginx -t && sudo systemctl reload nginx`。
2. 获取 Let's Encrypt 证书（把邮箱替换为你的邮箱）：

```sh
sudo certbot certonly --webroot -w /var/www/certbot -d math.664357788.xyz -m <your-email> --agree-tos
```

3. 创建预览密码文件，限制读取权限：

```sh
sudo htpasswd -cB /etc/nginx/.htpasswd-math-preview preview
sudo chown root:www-data /etc/nginx/.htpasswd-math-preview
sudo chmod 640 /etc/nginx/.htpasswd-math-preview
```

4. 将 `deploy/vps/nginx-math-preview.conf.example` 覆盖到同一站点配置，确认 `server_name` 和证书路径正确，再执行 `sudo nginx -t && sudo systemctl reload nginx`。

5. 配置证书续期后重载 Nginx：

```sh
sudo install -d -m 755 /etc/letsencrypt/renewal-hooks/deploy
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh >/dev/null <<'EOF'
#!/bin/sh
systemctl reload nginx
EOF
sudo chmod 755 /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo systemctl enable --now certbot.timer
```

验证 `https://math.664357788.xyz:8443/health` 返回 `{"app":"math-explorer","status":"ok"}`，未登录访问首页应收到 401。HTTP 首页应跳转到 HTTPS 8443。确认 Xray 仍 active 且 443 仍由 Xray 监听。

## GitHub Actions 配置

在仓库 Settings → Secrets and variables → Actions 中设置 Repository variables：

| Variable | 值 | 说明 |
| --- | --- | --- |
| `VPS_DEPLOY_ENABLED` | 当前保持 `false` | 关闭 main 推送后的自动部署；首次发布通过手动确认单独授权 |
| `VPS_HOST` | `173.242.119.233` | 当前 VPS |
| `VPS_USER` | `math-deploy` | 专用低权限部署用户 |
| `VPS_PORT` | `22` | SSH 端口 |
| `VPS_WEB_ROOT` | `/var/www/math-explorer-preview` | Nginx root 对应目录 |
| `VPS_URL` | `https://math.664357788.xyz:8443` | HTTPS 健康检查 origin |

设置 Repository secrets：

| Secret | 说明 |
| --- | --- |
| `VPS_SSH_KEY` | 专用 `math-deploy` 私钥；不使用 root/VPN 私钥 |
| `VPS_KNOWN_HOSTS` | 已核验的 SSH host key 行；不要关闭 StrictHostKeyChecking |

SSH host key 应通过 VPS 控制台指纹或已有可信连接核验后再保存；不要把未经核验的 `ssh-keyscan` 输出直接当作可信密钥。

配置完变量和 secrets 后，先保持 `VPS_DEPLOY_ENABLED=false`。首次发布从 GitHub Actions 手动运行 **Deploy Math Explorer preview**，选择 `main`，并明确勾选 `confirm_deploy=true`。该次手动确认只授权本次发布，不会打开后续自动部署。首次发布和产品验收通过后，如果希望 main 的相关变更自动发布，再单独将 `VPS_DEPLOY_ENABLED` 改为 `true`。所有发布只允许从 `main` 执行。

## 发布、回滚与验收

- 发布脚本把每个提交放入独立 release 目录，最后原子切换 `current` 符号链接；失败时尝试恢复上一版。
- 回滚可在 GitHub Actions 手动运行 **Roll back Math Explorer preview**。
- 验收必须在真实 HTTPS 域名下完成：登录预览、进入三维全貌、缩放/旋转、打开学习活动、刷新恢复、Service Worker 安装与离线重开。
- 未登录访问首页必须被拒绝；`/health` 只返回固定状态文本。
- 确认现有 Xray 服务仍 active，TCP 443 仍归 Xray 所有。

## 尚未完成

- 从 GitHub Actions 手动触发首次发布（`confirm_deploy=true`，全局自动部署开关仍为 false）。
- 使用预览密码进入网站，完成真实公网浏览器验收。
- 决定是否启用后续 main 推送自动部署。
