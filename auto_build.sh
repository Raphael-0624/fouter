#!/bin/bash
# Fouter Auto-Build Script
# 用途：在 screen 会话中自动执行任务，支持中断恢复

set -e

cd /home/claudeuser/fouter-project

# 检查点文件
CHECKPOINT_FILE=".build_checkpoint"
LOG_FILE=".build_log"

# 获取当前任务编号
get_current_task() {
    if [ -f "$CHECKPOINT_FILE" ]; then
        cat "$CHECKPOINT_FILE"
    else
        echo "0"
    fi
}

# 更新检查点
set_checkpoint() {
    echo "$1" > "$CHECKPOINT_FILE"
    echo "$(date): 完成任务 $1" >> "$LOG_FILE"
}

# Git 自动提交
auto_commit() {
    local msg="$1"
    git add -A
    git commit -m "$msg" || true
    git push origin master || true
}

# 任务列表（对应实现计划中的 11 个任务）
declare -a TASKS=(
    "Task 1: Infrastructure Setup - docker-compose, nginx, env"
    "Task 2: Database Schema - init-db.sql"
    "Task 3: Rate Limit Service - token bucket implementation"
    "Task 4: Auth Service Core - models, schemas, config"
    "Task 5: Auth Service JWT & Feishu - OAuth, JWT, routers"
    "Task 6: Proxy Service Core - balancer, audit, proxy"
    "Task 7: Proxy Service API - OpenAI/Anthropic endpoints"
    "Task 8: Admin Service - providers, stats, models"
    "Task 9: Frontend Setup - package.json, vite, tsconfig"
    "Task 10: Frontend Components - Button, Card, Layout"
    "Task 11: Frontend Pages - Login, Dashboard, App"
)

# 当前任务
CURRENT_TASK=$(get_current_task)
echo "========================================"
echo "Fouter Auto-Build Starting"
echo "Current Task: $CURRENT_TASK / 11"
echo "Time: $(date)"
echo "========================================"

# 从断点继续
for i in $(seq $CURRENT_TASK 11); do
    echo ""
    echo ">>> Starting Task $i: ${TASKS[$i-1]}"
    echo ">>> Time: $(date)"
    echo ""

    # 这里会调用 Claude Code 执行具体任务
    # 使用 claude 命令或等待用户手动触发

    # 模拟任务完成（实际使用时替换为真实任务执行）
    # claude -p "Implement ${TASKS[$i-1]} according to the plan"

    # 标记完成
    set_checkpoint $((i + 1))

    # 自动提交
    auto_commit "feat: complete ${TASKS[$i-1]}"

echo ""
echo "Task $i completed and committed"
    echo "========================================"
done

echo ""
echo "========================================"
echo "All tasks completed!"
echo "Time: $(date)"
echo "========================================"

# 清理检查点
rm -f "$CHECKPOINT_FILE"
