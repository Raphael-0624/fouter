#!/bin/bash
# Fouter 心跳守护脚本
# 每30分钟检查一次任务状态，如中断则自动恢复

set -e

PROJECT_DIR="/home/claudeuser/fouter-project"
TASKS_FILE="$PROJECT_DIR/TASKS.md"
HEARTBEAT_FILE="$PROJECT_DIR/.heartbeat"
LOG_FILE="$PROJECT_DIR/.execution_log"
TIMEOUT_MINUTES=60

# 日志函数
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# 更新心跳
update_heartbeat() {
    date '+%Y-%m-%d %H:%M:%S' > "$HEARTBEAT_FILE"
}

# 获取当前状态
get_status() {
    grep -A 5 "## 执行状态" "$TASKS_FILE" | grep "整体状态" | sed 's/.*|//' | tr -d ' |'
}

# 获取当前任务
get_current_task() {
    grep -B 5 "状态.*IN_PROGRESS" "$TASKS_FILE" | grep "Task" | head -1 || echo "None"
}

# 获取下一个待处理任务
get_next_pending_task() {
    grep -B 2 "状态.*PENDING" "$TASKS_FILE" | grep "Task" | head -1 || echo "None"
}

# 更新任务状态
update_task_status() {
    local task_num="$1"
    local new_status="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # 替换任务状态
    sed -i "/Task $task_num:/,/完成时间/{s/状态.*:.*/状态: $new_status/}" "$TASKS_FILE"

    if [ "$new_status" = "✅ COMPLETED" ]; then
        sed -i "/Task $task_num:/,/完成时间/{s/完成时间:.*/完成时间: $timestamp/}" "$TASKS_FILE"
    elif [ "$new_status" = "🔄 IN_PROGRESS" ]; then
        sed -i "/Task $task_num:/,/开始时间/{s/开始时间:.*/开始时间: $timestamp/}" "$TASKS_FILE"
    fi
}

# 更新整体状态
update_overall_status() {
    local status="$1"
    sed -i "s/整体状态.*/整体状态 | $status |/" "$TASKS_FILE"
    sed -i "s/最后心跳.*/最后心跳 | $(date '+%Y-%m-%d %H:%M:%S') |/" "$TASKS_FILE"
}

# 记录执行历史
add_execution_history() {
    local event="$1"
    local executor="$2"
    local task="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # 在 ## 执行历史 后添加新行
    sed -i "/## 执行历史/,/^$/ { /^| - |/a\\
| $timestamp | $event | $executor | $task |
}" "$TASKS_FILE"
}

# 检查是否超时
check_timeout() {
    if [ ! -f "$HEARTBEAT_FILE" ]; then
        return 0  # 无心跳文件，视为中断
    fi

    local last_heartbeat=$(cat "$HEARTBEAT_FILE")
    local last_epoch=$(date -d "$last_heartbeat" '+%s' 2>/dev/null || echo 0)
    local current_epoch=$(date '+%s')
    local diff_minutes=$(( (current_epoch - last_epoch) / 60 ))

    if [ $diff_minutes -gt $TIMEOUT_MINUTES ]; then
        log "检测到心跳超时: ${diff_minutes}分钟 (阈值: ${TIMEOUT_MINUTES}分钟)"
        return 0  # 超时
    fi

    return 1  # 未超时
}

# 执行具体任务
execute_task() {
    local task_num="$1"

    log "开始执行任务 $task_num"
    update_task_status "$task_num" "🔄 IN_PROGRESS"
    update_heartbeat

    # 这里会调用 Claude Code 执行实际任务
    # 由于 Claude Code 不能在纯脚本中自动运行，我们采用以下策略：

    case $task_num in
        1)
            log "Task 1: Infrastructure Setup"
            # 实际实现...
            cd "$PROJECT_DIR"
            # 创建文件...
            ;;
        2)
            log "Task 2: Database Schema"
            ;;
        *)
            log "Task $task_num: 未实现的具体执行逻辑"
            ;;
    esac

    # 模拟成功（实际使用时替换为真实执行）
    sleep 2

    update_task_status "$task_num" "✅ COMPLETED"
    add_execution_history "任务完成" "Cron-Heartbeat" "Task $task_num"
    log "任务 $task_num 完成"
}

# 主逻辑
main() {
    cd "$PROJECT_DIR"

    log "===== 心跳检查开始 ====="

    # 检查任务文件是否存在
    if [ ! -f "$TASKS_FILE" ]; then
        log "错误: 任务文件不存在 $TASKS_FILE"
        exit 1
    fi

    # 获取当前状态
    local status=$(get_status)
    log "当前整体状态: $status"

    # 状态判断
    case "$status" in
        *PAUSED*)
            log "项目处于暂停状态，跳过执行"
            update_heartbeat
            exit 0
            ;;
        *COMPLETED*)
            log "所有任务已完成"
            exit 0
            ;;
        *IN_PROGRESS*)
            # 检查是否超时
            if check_timeout; then
                log "检测到任务中断，准备接管"
                update_overall_status "⏳ PENDING (Recovery)"
            else
                log "任务进行中且未超时，继续等待"
                update_heartbeat
                exit 0
            fi
            ;;
    esac

    # 查找下一个待处理任务
    local next_task=$(get_next_pending_task)

    if [ "$next_task" = "None" ]; then
        log "没有待处理任务，标记完成"
        update_overall_status "✅ COMPLETED"
        add_execution_history "项目完成" "Cron-Heartbeat" "All"
        exit 0
    fi

    # 提取任务编号
    local task_num=$(echo "$next_task" | grep -oP '\d+' | head -1)

    log "准备执行任务: Task $task_num"
    update_overall_status "🔄 IN_PROGRESS"

    # 执行前更新心跳
    update_heartbeat

    # 执行任务
    if execute_task "$task_num"; then
        log "任务执行成功"
    else
        log "任务执行失败"
        update_task_status "$task_num" "❌ FAILED"
        update_overall_status "❌ FAILED (Task $task_num)"
        exit 1
    fi

    # 更新心跳
    update_heartbeat

    log "===== 心跳检查结束 ====="
}

# 运行主函数
main "$@"
