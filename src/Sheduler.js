module.exports = class ClipperTaskScheduler {
    constructor() {
        this.tasks = [];
        this.lastTaskId = 0;
    }

    addTask(group_id, taskFunc, intervalMinutes) {

        const existingTaskIndex = this.tasks.findIndex(t => t.group_id === group_id);
        
        if (existingTaskIndex !== -1) {
            clearInterval(this.tasks[existingTaskIndex].interval);
            this.tasks.splice(existingTaskIndex, 1);
        }

        const task = {
            id: ++this.lastTaskId,
            lastRun: 0,
            created: Date.now(),
            func: taskFunc,
            intervalMinutes,
            group_id,
            interval: setInterval(() => {
                task.lastRun = Date.now(); // замыкание таск досутпен из чайлда
                taskFunc();
            }, intervalMinutes * 60 * 1000)
        };

        this.tasks.push(task);
        return task.id;
    }

    remTask(group_id) {
        const taskIndex = this.tasks.findIndex(t => t.group_id === group_id);
        if (taskIndex !== -1) {
            clearInterval(this.tasks[taskIndex].interval);
            this.tasks.splice(taskIndex, 1);
            return true;
        }
        return false;
    }

    getTimeToNextRun(group_id) {

        const task = this.tasks.find(t => t.group_id === group_id);
        if (!task) return null;

        const now = Date.now();

        let timeSinceLastRun 
        if (task.lastRun === 0) {
            timeSinceLastRun = now - task.created;  
        }else{
            timeSinceLastRun = now - task.lastRun; 
        }
  
        const intervalMs = task.intervalMinutes * 60 * 1000;
        const timeToNextRun = intervalMs - timeSinceLastRun;
        return Math.max(0, timeToNextRun);

    }

    getAllNextIntervals() {

        const intervals = []
    
        this.tasks.forEach(task => {
            intervals.push({
                id: task.group_id,
                int: this.getTimeToNextRun(task.group_id)
            })
        })
    
        return intervals

    }

    stopTasks() {
        this.tasks.forEach(task => clearInterval(task.interval));
    }
}