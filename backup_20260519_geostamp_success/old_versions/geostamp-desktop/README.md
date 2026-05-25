# GeoStamp Desktop - 图片地理位置标注工具

一个基于 Electron 的桌面应用，用于为图片添加地理位置标注。

## 功能特性

- 🖼️ 拖放上传图片
- 📍 自动从图片提取 GPS 信息
- 🌍 反向地理编码获取地址
- 📝 大字体标注（地址和时间戳）
- ✏️ 支持重命名图片
- 💾 自定义下载路径
- 🔐 用户登录和订阅系统

## 测试账户

- **免费账户**: test@example.com / password123（每次限1张图片）
- **订阅账户**: pro@example.com / password123（无限图片处理）

## 开发环境

### 安装依赖

```bash
npm install
```

### 启动开发模式

```bash
npm start
```

### 构建安装包

```bash
npm run build:win
```

构建产物将在 `dist` 目录中。

## 技术栈

- Electron 28
- Node.js
- HTML5 Canvas
- Nominatim API（地理编码）

## 项目结构

```
geostamp-desktop/
├── main.js          # Electron 主进程
├── index.html       # 应用界面
├── package.json     # 项目配置
└── README.md        # 项目说明
```

## 使用说明

1. 运行应用
2. 点击上传区域或拖放图片
3. 点击"开始标注"处理图片
4. 处理完成后可下载或重命名图片
5. 可在设置中指定下载路径

## 配置下载路径

默认下载路径为系统的下载文件夹，可通过点击"浏览..."按钮自定义下载目录。

## 许可证

MIT License