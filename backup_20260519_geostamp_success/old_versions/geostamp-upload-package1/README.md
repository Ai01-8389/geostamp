# GeoStamp Upload Package

## Package Date: 2026-05-17

---

## Directory Structure

```
geostamp-upload-package/
├── v6-optimized/              # V6 视觉优化版本
│   ├── index.html             # 优化后的前端页面
│   ├── server.js              # 服务器文件
│   ├── package.json           # 项目配置
│   ├── package-lock.json      # 依赖锁定
│   ├── Before(Original).png   # 对比图片 - 原始
│   ├── After(Annotated).png   # 对比图片 - 标注后
│   └── logo.jpg               # 新Logo
│
├── v7-auth-system/            # V7 认证系统
│   ├── database/
│   │   └── schema.sql         # 数据库架构
│   ├── public/
│   │   └── login.html         # 登录页面
│   ├── src/
│   │   ├── database/          # 数据库连接
│   │   ├── middleware/        # 中间件
│   │   ├── routes/            # API路由
│   │   ├── services/          # 服务层
│   │   └── server.js          # 主服务器
│   ├── tests/                 # 测试文件
│   ├── .env.example           # 环境变量模板
│   ├── README.md              # 项目文档
│   └── package.json           # 项目配置
│
└── README.md                  # 本说明文档
```

---

## V6 Optimized - 视觉优化版本

### 更新内容

| 项目 | 说明 |
|------|------|
| **设计风格** | 欧美轻量化设计，清爽简洁 |
| **配色方案** | 浅色背景 (#F5F5F7)，深色文字 (#1D1D1F) |
| **Logo** | 替换为新logo.jpg |
| **对比图片** | Before(Original).png, After(Annotated).png |
| **标注信息** | 三行显示，左下角水印，35%×15%区域 |
| **布局优化** | 增大间距、圆角、留白 |

### 部署步骤

```bash
cd v6-optimized
npm install
node server.js
# 访问 http://localhost:3000
```

### 文件清单

- [x] index.html - 前端页面
- [x] server.js - 服务器
- [x] package.json - 配置
- [x] package-lock.json - 依赖
- [x] Before(Original).png - 对比图
- [x] After(Annotated).png - 对比图
- [x] logo.jpg - Logo

---

## V7 Auth System - 认证系统

### 功能特性

| 功能 | 状态 |
|------|------|
| Google OAuth 2.0 | ✅ |
| Email/密码登录 | ✅ |
| JWT Token体系 | ✅ |
| 桌面程序回调 | ✅ |
| Creem.io Webhook | ✅ |
| 权限控制中间件 | ✅ |
| Rate Limiting | ✅ |

### 技术栈

- Node.js + Express
- PostgreSQL (用户/订阅数据)
- Redis (Token存储)
- JWT (RS256)
- Google OAuth 2.0

### 部署步骤

```bash
cd v7-auth-system

# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入实际配置

# 3. 初始化数据库
psql -d geostamp -f database/schema.sql

# 4. 启动服务
npm start
```

### 环境变量

| 变量 | 说明 |
|------|------|
| DATABASE_URL | PostgreSQL连接 |
| REDIS_URL | Redis连接 |
| JWT_ACCESS_SECRET | Access Token密钥 |
| JWT_REFRESH_SECRET | Refresh Token密钥 |
| GOOGLE_CLIENT_ID | Google OAuth客户端ID |
| CREEM_API_KEY | Creem.io API密钥 |
| CREEM_WEBHOOK_SECRET | Creem.io Webhook密钥 |

---

## Version History

| 版本 | 日期 | 说明 |
|------|------|------|
| v6-optimized | 2026-05-17 | 视觉优化版本 |
| v7-auth-system | 2026-05-17 | 认证系统 |

---

## Upload Checklist

### V6 Optimized
- [ ] 检查所有文件已上传
- [ ] 验证npm install成功
- [ ] 验证服务器启动
- [ ] 测试图片加载
- [ ] 测试支付功能

### V7 Auth System
- [ ] 配置环境变量
- [ ] 初始化PostgreSQL
- [ ] 启动Redis
- [ ] 运行测试 `npm test`
- [ ] 验证API端点

---

## Notes

1. **V6版本** 可独立部署，是当前生产版本的优化
2. **V7版本** 是新认证系统，需要额外配置数据库和Redis
3. 两个版本可并行运行在不同端口
4. 建议先部署V6验证，再部署V7进行认证系统升级
