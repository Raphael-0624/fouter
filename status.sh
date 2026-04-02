#!/bin/bash
# Fouter 状态检查脚本

cd /home/claudeuser/fouter-project || exit 1

echo "========================================"
echo "Fouter 项目状态检查"
echo "========================================"
echo ""

# 1. Git 状态
echo "📦 Git 状态:"
git status -s | head -10 || echo "  无未提交更改"
echo ""

# 2. 任务状态
echo "📋 任务状态 (前20行):"
head -20 TASKS.md
echo ""

# 3. 心跳状态
echo "💓 心跳状态:"
if [ -f .heartbeat ]; then
    echo "  最后心跳: $(cat .heartbeat)"
    if command -v stat &> /dev/null; then
        echo "  文件时间: $(stat -c %y .heartbeat)"
    fi
else
    echo "  ❌ 无心跳文件"
fi
echo ""

# 4. 执行日志（最后10行）
echo "📝 执行日志（最后10行）:"
if [ -f .execution_log ]; then
    tail -10 .execution_log
else
    echo "  无执行日志"
fi
echo ""

# 5. Cron 任务
echo "⏰ Cron 任务:"
crontab -l | grep fouter || echo "  无 Fouter 相关任务"
echo ""

# 6. 磁盘空间
echo "💾 磁盘空间:"
df -h . | tail -1
echo ""

echo "========================================"
echo "检查完成"
echo "========================================"
