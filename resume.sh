#!/bin/bash
# Fouter Resume Script
# 当 Claude Code 中断后，使用此脚本恢复执行

cd /home/claudeuser/fouter-project

echo "========================================"
echo "Fouter Project - Resume Check"
echo "========================================"

# 检查上次任务状态
if [ -f ".build_checkpoint" ]; then
    CURRENT=$(cat .build_checkpoint)
    echo "上次任务: $CURRENT"
    echo "日志:"
    tail -20 .build_log 2>/dev/null || echo "无日志"
else
    echo "无检查点，从 Task 1 开始"
    CURRENT=0
fi

echo ""
echo "Git 状态:"
git status -s

echo ""
echo "Git 提交历史（最近5条）:"
git log --oneline -5

echo ""
echo "========================================"
echo "恢复选项:"
echo "1. 继续执行下一个任务 (claude -p '执行下一个任务')"
echo "2. 重新执行当前任务"
echo "3. 查看详细日志"
echo "4. 手动执行特定任务"
echo "========================================"
