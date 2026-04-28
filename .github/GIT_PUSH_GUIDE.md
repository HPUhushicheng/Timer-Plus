# 推送代码到 GitHub（国内网络）

## 背景

GitHub 直连端口 443 在国内可能不稳定（GFW 干扰），而常用的 gh-proxy.org 反向代理只支持 **fetch（只读）**，不支持 **push（写操作）**。

## 网络环境

| 操作 | gh-proxy.org 代理 | 直接连接 |
|------|------------------|---------|
| `git fetch` / `git pull` | 可用 | 不稳定 |
| `git push` | 不可用（无 CONNECT 隧道） | 需要特定参数 |

## push 方案

```
git remote set-url origin https://github.com/HPUhushicheng/Timer-Plus.git
git -c http.version=HTTP/1.1 -c http.sslVerify=false push origin main
```

两点关键：
- `http.version=HTTP/1.1` — 禁用 HTTP/2，避免 `Error in the HTTP2 framing layer`
- `http.sslVerify=false` — 跳过 SSL 证书验证

## pull/fetch 方案（日常使用）

```
git remote set-url origin https://gh-proxy.org/https://github.com/HPUhushicheng/Timer-Plus.git
git pull origin main
```

## 完整 workflow

```bash
# 1. 切换到直连 URL（用于 push）
git remote set-url origin https://github.com/HPUhushicheng/Timer-Plus.git

# 2. add + commit
git add -A
git commit -m "your message"

# 3. push
git -c http.version=HTTP/1.1 -c http.sslVerify=false push origin main

# 4. 切回代理 URL（用于后续 pull/fetch）
git remote set-url origin https://gh-proxy.org/https://github.com/HPUhushicheng/Timer-Plus.git
```

## 一行总结

> **pull 用代理，push 走直连 + HTTP/1.1 + 跳过 SSL。**
