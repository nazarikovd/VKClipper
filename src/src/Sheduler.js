const { CronExpressionParser } = require('cron-parser')

module.exports = class ClipperTaskScheduler {
    constructor() {
        this.tasks = new Map()
        this.lastTaskId = 0
        this.heartbeat = null
    }

    addTask(group_id, taskFunc, schedule) {
        this.remTask(group_id)

        const isCron = isNaN(schedule)
        const task = {
            id: ++this.lastTaskId,
            group_id,
            taskFunc,
            schedule,
            isCron,
            nextRun: this._calculateNext(schedule),
            isRunning: false
        }

        this.tasks.set(group_id, task)

        if (!this.heartbeat) {
            this.heartbeat = setInterval(() => this._tick(), 1000)
        }

        return task.id
    }

    _calculateNext(schedule, fromDate = null) {
        const baseTime = fromDate ? new Date(fromDate).getTime() : Date.now()

        if (!isNaN(schedule) && !String(schedule).includes(' ')) {
            return baseTime + (parseFloat(schedule) * 60 * 1000)
        }

        try {
            const cleanSchedule = String(schedule).replace(/\+/g, ' ').trim()
            const interval = CronExpressionParser.parse(cleanSchedule, {
                currentDate: new Date(baseTime)
            })
            return interval.next().getTime()
        } catch (e) {
            return baseTime + (15 * 60 * 1000)
        }
    }

    async _tick() {
        const now = Date.now()

        for (const task of this.tasks.values()) {
            if (now >= task.nextRun && !task.isRunning) {
                const previousNextRun = new Date(task.nextRun)
                task.isRunning = true
                
                try {
                    await task.taskFunc()
                } catch (e) {
                    console.error(e)
                } finally {
                    task.isRunning = false
                    task.nextRun = this._calculateNext(task.schedule, previousNextRun)
                }
            }
        }
    }

    remTask(group_id) {
        if (this.tasks.has(group_id)) {
            this.tasks.delete(group_id)
            if (this.tasks.size === 0 && this.heartbeat) {
                clearInterval(this.heartbeat)
                this.heartbeat = null
            }
            return true
        }
        return false
    }

    getTimeToNextRun(group_id) {
        const task = this.tasks.get(group_id)
        if (!task) return null
        return Math.max(0, task.nextRun - Date.now())
    }

    getAllNextIntervals() {
        const intervals = []
        for (const task of this.tasks.values()) {
            intervals.push({
                id: task.group_id,
                int: this.getTimeToNextRun(task.group_id)
            })
        }
        return intervals
    }

    stopTasks() {
        if (this.heartbeat) {
            clearInterval(this.heartbeat)
            this.heartbeat = null
        }
        this.tasks.clear()
    }
}