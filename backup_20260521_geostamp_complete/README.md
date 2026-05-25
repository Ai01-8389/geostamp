# GeoStamp 完整备份 - 2026-05-21

## 备份内容

### backend/
GeoStamp Cloudflare Workers 后端
- `src/index.js` - Worker 主代码（含以下功能）
  - 邮箱验证码登录/注册（Resend 集成）
  - JWT Token 认证 & 刷新
  - Creem 支付集成（测试环境）
  - Webhook 订阅状态同步
  - 用户升级接口 `/api/user/upgrade`
  - 订阅验证 `/api/desktop/verify`
  - Health check `/api/health`
- `wrangler.toml` - Worker 配置（生产环境绑定 api.geostamp.top）
- `package.json`

### frontend/
- `index.html` - 完整前端（单页 HTML + CSS + JS）
  - 图片地理标记工具
  - 邮箱验证码登录弹窗
  - 账户下拉菜单
  - Creem 支付跳转
  - 多终端订阅状态同步

### restore_point/
快速恢复关键文件：
- `index.html` - 前端
- `worker.js` - 后端（src/index.js）
- `wrangler.toml` - Worker 配置

### docs/
- `DEPLOY_GUIDE.md` - 部署指南

## 关键配置

| 项目 | 值 |
|------|-----|
| 后端 API | https://api.geostamp.top |
| Worker 名称 | geostamp-api |
| 自定义域名 | geostamp.top |
| GitHub Pages | https://Ai01-8389.github.io/geostamp/ |
| Resend 发信域名 | notify.geostamp.top |
| KV Namespace ID | a1a972347f2e4283815750de6134c0f5 |
| Creem 模式 | 测试环境 (test-api.creem.io) |

## Cloudflare Secrets

- `CREEM_API_KEY` - Creem API 密钥
- `RESEND_API_KEY` - Resend 邮件 API 密钥
- `JWT_SECRET` - JWT 签名密钥（wrangler.toml vars）

## 本次备份完成的工作

- ✅ Resend 邮件服务集成（真实验证码发送）
- ✅ 支付回调直接升级 KV（解决多终端不同步）
- ✅ signOut 清除 geostamp_subscriber
- ✅ Creem 未登录时不预填邮箱
- ✅ Health check 包含 Resend 状态
