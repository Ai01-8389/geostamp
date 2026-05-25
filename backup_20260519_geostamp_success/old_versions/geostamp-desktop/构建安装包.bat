@echo off
echo ================================================
echo  GeoStamp Desktop - 构建安装包
echo ================================================
echo.
echo 正在构建Windows安装包...
echo.

cd /d "%~dp0"

echo 1. 清理旧依赖和构建文件...
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist

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
echo 3. 构建Windows安装包...
call npm run build:win

if %errorlevel% neq 0 (
    echo.
    echo [错误] 构建失败
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================
echo  构建完成！
echo ================================================
echo.
echo 安装包位置: dist\GeoStamp Setup.exe
echo.
echo 按任意键打开输出目录...
pause >nul
explorer dist
