@echo off
echo ================================================
echo  GeoStamp Desktop - 图片地理位置标注工具
echo ================================================
echo.
echo 正在安装依赖并启动应用...
echo.

cd /d "%~dp0"

echo 1. 清理旧依赖（如果存在）...
if exist node_modules rmdir /s /q node_modules

echo.
echo 2. 安装项目依赖...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [错误] 依赖安装失败，请检查Node.js是否正确安装
    echo.
    pause
    exit /b 1
)

echo.
echo 3. 启动应用...
echo.
call npm start

echo.
echo 应用已关闭
pause
