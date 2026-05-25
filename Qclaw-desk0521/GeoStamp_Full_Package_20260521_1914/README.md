# GeoStamp Desktop App - 完整开发包

## 项目概述
- **项目名称**: GeoStamp Desktop App
- **技术栈**: Tauri v2 + Rust 后端 + Web 前端 (Vite)
- **定位**: 地理位置照片标注工具，<10MB 单文件分发
- **开发日期**: 2026年5月

## 目录结构

`
GeoStamp_Full_Package/
├── project/              # 完整项目代码
│   ├── src/             # 前端源代码
│   ├── src-tauri/       # Rust 后端代码
│   ├── index.html       # 主页面
│   ├── app.js           # 主逻辑文件
│   ├── style.css        # 样式文件
│   ├── package.json     # Node.js 依赖
│   └── vite.config.js   # Vite 配置
│
├── docs/                # 开发文档
│   ├── AUTHENTICATION_INTEGRATION.md
│   ├── IMAGE_FORMAT_SPECIFICATIONS.md
│   └── *.md            # 其他文档
│
├── development_logs/    # 开发过程记录
│   ├── 2026-05-20.md   # 5月20日开发记录
│   └── 2026-05-21.md   # 5月21日开发记录
│
├── configs/             # 关键配置文件
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── tauri.conf.json
│   └── Cargo.toml
│
└── README.md           # 本文件
`

## 快速启动

### 环境要求
- Node.js v22+
- Rust (最新稳定版)
- Windows 10/11

### 安装依赖
`ash
cd project
npm install
`

### 开发模式
`ash
npm run tauri dev
`

### 构建发布版
`ash
npm run tauri build
`

## 核心功能

### 已实现
1. 图片上传（拖拽/点击）
2. EXIF 信息读取（GPS、时间）
3. 地理位置反解析
4. 图片标注（文件名、地点、坐标、时间）
5. 批量下载
6. 自定义文件名格式
7. 设置面板

### 开发中
8. 邮箱验证码登录
9. 订阅管理
10. 多设备限制

## 开发记录摘要

### 2026-05-20
- 修复文件名序号偶数问题
- 修复 GPS 和时间截断问题（3行→4行布局）
- 确定认证方案：邮箱验证码（评分 8.6/10）
- 确认"30天"计算方案：固定毫秒数
- 实现前端登录 UI
- 修复事件监听器位置 Bug
- 修复 Tauri v2 API 导入错误

### 2026-05-21
- 修复 Vite 端口配置（1420）
- 解决窗口最小化/隐藏问题
- 调试登录按钮响应问题

## 认证系统规格

### API 端点
- POST /api/auth/request-code - 发送验证码
- POST /api/auth/verify-code - 验证并登录
- POST /api/auth/refresh - 刷新 Token
- GET /api/desktop/verify - 获取订阅状态
- POST /api/auth/logout - 登出

### Token 策略
- 固定 30 天有效期（精确毫秒）
- 每次 /api/desktop/verify 同步订阅状态
- 最多 3 台设备登录

## 构建输出

### 开发模式
- 前端: http://localhost:1420/
- 无 exe 生成

### 发布构建
- 安装包: src-tauri/target/release/bundle/nsis/GeoStamp_0.1.0_x64-setup.exe
- 独立 exe: src-tauri/target/release/GeoStamp.exe

## 已知问题
1. 外部 API (api.geostamp.app) 不存在，需要实现真实后端
2. 登录按钮响应问题待确认
3. 需要测试多设备登录限制

## 后续工作
1. 实现真实 API 后端
2. 完成 Rust 端 keyring 存储
3. 测试完整认证流程
4. 实现订阅过期降级
5. 优化 UI/UX
