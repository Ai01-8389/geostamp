# GeoStamp Workers 部署指南

## 第一步：登录 Cloudflare

1. 打开浏览器，访问 https://dash.cloudflare.com
2. 使用您的账户登录：focusclaw@outlook.com

## 第二步：创建 KV 命名空间

1. 在左侧菜单点击 **Workers & Pages**
2. 点击 **KV** 标签
3. 点击 **Create a namespace**
4. 名称输入：`geostamp-kv`
5. 点击 **Add**

## 第三步：创建 Worker

1. 点击 **Overview** 标签
2. 点击 **Create Worker**
3. 名称输入：`geostamp-api`
4. 点击 **Deploy**

## 第四步：编辑 Worker 代码

1. 部署后，点击 **Edit code**
2. 删除默认代码
3. 复制 `src/index.js` 的全部内容粘贴进去
4. 点击 **Save and Deploy**

## 第五步：配置环境变量

1. 点击 **Settings** 标签
2. 点击 **Variables**
3. 点击 **Add variable**
4. 添加以下变量：

| 变量名 | 值 |
|--------|-----|
| JWT_SECRET | geostamp-production-secret-key-2024 |
| CREEM_API_KEY | creem_test_49RRd3OZf8Vuyb54GBNGAQ |

## 第六步：绑定 KV 命名空间

1. 点击 **Settings** 标签
2. 点击 **Bindings**
3. 点击 **Add binding** → **KV Namespace**
4. Variable name: `GEOSTAMP_KV`
5. 选择您创建的 KV 命名空间
6. 点击 **Save**

## 第七步：获取 Worker URL

部署完成后，您的 API 地址是：
```
https://geostamp-api.您的账户.workers.dev
```

## 第八步：测试 API

在浏览器中访问：
```
https://geostamp-api.xxx.workers.dev/api/health
```

如果看到 `{"status":"ok",...}`，说明部署成功！

---

## 需要我帮您更新的前端代码

部署完成后，我需要更新网站前端的 API 地址。

请告诉我您的 Worker URL（类似 `https://geostamp-api.xxx.workers.dev`）。
