# GeoStamp 完整配置备份
> 备份时间：2026-05-19
> 状态：✅ 支付功能测试成功

---

## 一、域名 & DNS 配置（Cloudflare）

| 项目 | 值 |
|------|-----|
| 主域名 | `geostamp.top` |
| API 子域名 | `api.geostamp.top` |
| DNS 记录类型 | CNAME |
| DNS 记录值 | `geostamp-api.focusclaw.workers.dev` |
| 代理状态 | 开启（橙色云朵） |
| SSL/TLS 模式 | Full (Strict) |

---

## 二、Cloudflare Workers 后端配置

| 项目 | 值 |
|------|-----|
| Worker 名称 | `geostamp-api` |
| 部署环境 | `production` |
| 生产域名 | `api.geostamp.top/*` |
| Zone Name | `geostamp.top` |
| Wrangler 版本 | 4.92.0 |

### Secrets（通过 `wrangler secret put` 设置）
| 名称 | 值 |
|------|-----|
| `CREEM_API_KEY` | `creem_test_6iai88f8t2v6Z4HZqbRCRV` |
| `CREEM_PRODUCT_ID` | `prod_52YqViVwDNmYS5BOhcxVfV` |

### Vars（写在 `wrangler.toml` 中）
| 名称 | 值 |
|------|-----|
| `JWT_SECRET` | `geostamp-production-secret-key-2024` |

---

## 三、Creem 支付配置

| 项目 | 值 |
|------|-----|
| Creem 账号 | `geostamp` |
| 模式 | Test Mode ✅ |
| 产品 ID | `prod_52YqViVwDNmYS5BOhcxVfV` |
| API 端点（Test） | `https://test-api.creem.io/v1/checkouts` |
| API 认证方式 | Header: `x-api-key` |
| 支付成功回调 URL | `https://Ai01-8389.github.io/geostamp/?payment=success` |

### Creem API 请求格式（后端 `src/index.js`）
```javascript
fetch('https://test-api.creem.io/v1/checkouts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': env.CREEM_API_KEY
  },
  body: JSON.stringify({
    product_id: 'prod_52YqViVwDNmYS5BOhcxVfV',
    success_url: 'https://Ai01-8389.github.io/geostamp/?payment=success',
    customer: {
      email: 'customer@example.com'
    },
    metadata: {
      user_id: 'anonymous',
      email: ''
    }
  })
})
```

### ⚠️ 注意事项
- `cancel_url` 参数 **不支持**，必须从请求中删除
- `customer.email` 是**必需参数**
- Test 模式用 `test-api.creem.io`，正式上线需改为 `api.creem.io`

---

## 四、前端配置

| 项目 | 值 |
|------|-----|
| 前端仓库 | `Ai01-8389/geostamp`（GitHub） |
| 部署平台 | GitHub Pages |
| 访问地址 | `https://Ai01-8389.github.io/geostamp/` |
| API_BASE | `https://api.geostamp.top` |

### 前端文件
- `index.html` — 单文件前端（含完整 JS）
- API_BASE 配置位置：约第 966 行

---

## 五、测试信用卡（Creem Test Mode）

| 字段 | 值 |
|------|-----|
| 卡号 | `4242 4242 4242 4242` |
| 过期日期 | 任意未来日期（如 `12/26`） |
| CVC | 任意 3 位数字（如 `123`） |
| 姓名/地址 | 随便填 |

---

## 六、部署命令记录

```bash
# 部署后端到生产环境
cd /d e:\codebuddy\focusclaw\geostamp-workers
npx wrangler deploy --env production

# 设置/更新 Creem API Key
npx wrangler secret put CREEM_API_KEY --env production

# 前端推送到 GitHub
cd /d e:\codebuddy\focusclaw
git add index.html
git commit -m "Update API to api.geostamp.top"
git push
```

---

## 七、已解决的问题记录

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `NET::ERR_CERT_AUTHORITY_INVALID` | SSL 证书未签发 | Cloudflare SSL/TLS 设为 Full (Strict)，等待自动签发 |
| `API Key is missing` | 用了 `Authorization: Bearer` 头 | 改为 `x-api-key` 请求头 |
| `Invalid API Key` | 用了正式 API 域名 + 测试 Key | Test 模式必须用 `test-api.creem.io` |
| `property cancel_url should not exist` | Creem API 不支持 `cancel_url` | 从请求体中删除该参数 |
| KV 存储警告 | `kv_namespaces` 未配置到 `env.production` | 可选修复，不影响支付功能 |

---

## 八、文件清单

```
backup_20260519_geostamp_success/
├── frontend/
│   ├── index.html              # 前端页面（API_BASE = api.geostamp.top）
│   ├── logo.jpg                # 网站 Logo
│   ├── Before(Original).png   # Before & After 展示图（原图）
│   ├── After(Annotated).png   # Before & After 展示图（标注后）
│   ├── .nojekyll              # GitHub Pages 配置（禁用 Jekyll）
│   ├── CNAME                  # GitHub Pages 自定义域名
│   └── README.md              # GitHub 仓库说明文档
├── backend/
│   ├── worker.js               # Cloudflare Worker 源码（src/index.js 复制）
│   ├── wrangler.toml           # Wrangler 配置文件
│   ├── package.json            # 依赖配置
│   └── DEPLOY_GUIDE.md        # 部署指南
└── docs/
    └── CONFIG.md               # 本文件（完整配置说明）
```

### 不需要备份的文件（临时/缓存）
- `b64_index.txt`、`content_b64.txt`、`temp_base64.txt` — Base64 编码临时文件
- `prep_upload.js`、`upload_to_github.js`、`upload_payload.json` — 上传脚本（临时）
- `.wrangler/cache/` — Wrangler 缓存
- `geostamp-desktop.rar`、`GeoStamp-Electron-Source.zip` — 桌面版（独立项目）

---

*备份创建时间：2026-05-19 21:30*
*下次继续时，直接参考此文档恢复配置*
