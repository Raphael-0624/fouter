#!/bin/bash
# Fouter 启动脚本 - 激活心跳机制
# 用户离开后，此机制确保项目自动推进

PROJECT_DIR="/home/claudeuser/fouter-project"

echo "========================================"
echo "Fouter 心跳机制启动器"
echo "========================================"
echo ""

# 检查是否在正确目录
cd "$PROJECT_DIR" || exit 1

# 1. 确保脚本可执行
echo "[1/4] 设置脚本权限..."
chmod +x heartbeat.sh
chmod +x resume.sh
chmod +x auto_build.sh 2>/dev/null || true
echo "✓ 脚本权限已设置"

# 2. 初始化心跳文件
echo "[2/4] 初始化心跳..."
date '+%Y-%m-%d %H:%M:%S' > .heartbeat
echo "✓ 心跳文件已创建"

# 3. 设置 Cron 任务
echo "[3/4] 设置 Cron 定时任务..."
CRON_LINE="*/30 * * * * cd $PROJECT_DIR && ./heartbeat.sh >> $PROJECT_DIR/.cron.log 2>&1"

# 检查是否已存在
if crontab -l 2>/dev/null | grep -q "fouter.*heartbeat"; then
    echo "✓ Cron 任务已存在"
else
    # 添加新任务
    (crontab -l 2>/dev/null || echo "") | grep -v "heartbeat.sh" | { cat; echo "$CRON_LINE"; } | crontab -
    echo "✓ Cron 任务已添加 (每30分钟执行)"
fi

# 显示当前 cron 任务
echo ""
echo "当前 Cron 任务:"
crontab -l | grep fouter || echo "无"

# 4. 初始化状态文件
echo ""
echo "[4/4] 确认任务状态文件..."
if [ ! -f TASKS.md ]; then
    echo "✗ 错误: TASKS.md 不存在"
    exit 1
fi
echo "✓ 任务状态文件已确认"

# 5. Git 配置
echo ""
echo "[额外] 配置 Git 自动提交..."
git config --local user.name "Fouter Bot"
git config --local user.email "bot@fouter.local"
echo "✓ Git 配置完成"

echo ""
echo "========================================"
echo "✅ 心跳机制已激活！"
echo "========================================"
echo ""
echo "说明:"
echo "- 每30分钟自动检查任务状态"
echo "- 如果检测到中断，自动接管继续执行"
echo "- 每次任务完成自动 git commit + push"
echo ""
echo "你可以:"
echo "1. 立即离开，系统会自动继续"
echo "2. 使用以下命令查看状态:"
echo "   tail -f $PROJECT_DIR/.cron.log"
echo "   cat $PROJECT_DIR/TASKS.md | head -20"
echo ""
echo "3. 如果需要暂停:"
echo "   sed -i 's/整体状态.*/整体状态 | ⏸️ PAUSED |/' $PROJECT_DIR/TASKS.md"
echo ""
echo "4. 恢复执行:"
echo "   sed -i 's/整体状态.*/整体状态 | ⏳ PENDING |/' $PROJECT_DIR/TASKS.md"
echo ""
echo "日志位置:"
echo "  - 执行日志: $PROJECT_DIR/.execution_log"
echo "  - Cron 日志: $PROJECT_DIR/.cron.log"
echo "  - 心跳文件: $PROJECT_DIR/.heartbeat"
echo ""
echo "========================================"

# 可选：立即执行第一次检查
echo ""
read -p "是否立即执行第一次检查? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "立即执行检查..."
    ./heartbeat.sh
fi
