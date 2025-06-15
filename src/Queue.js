module.exports = class ClipperQueueManager {
    constructor(getGroupsFn) {
        this.queue = []
        this.getCurrentGroups = getGroupsFn
        this.uploaded = new Set()
        this.linksAddQueue = []
        this.finished = 0
    }

    addClip(clipData) {

        if (clipData.type === 'all') {

            const currentGroups = this.getCurrentGroups()

            currentGroups.forEach(group => {
                this.queue.push({
                    file: clipData.file,
                    groupId: Number(group.group_id),
                    isAll: true
                })
            })

        } else {

            this.queue.push({
                file: clipData.file,
                groupId: Number(clipData.id),
                isAll: false
            })

        }

    }

    createLinksQueue() {
        let new_id = Math.floor(Math.random() * (4e10 - 1e10) + 1e10);
    
        this.linksAddQueue.push({
            id: new_id,
            progress: 0,
            done: [],
            in_progress: [],
            is_done: false
        });
    
        return {
            add: (link) => this.addLinksToQueue(new_id, link),
            done: (link) => this.completeLink(new_id, link),
            qid: new_id
        };
    }
    
    addLinksToQueue(queueid, links) {
        let queue = this.linksAddQueue.find(q => q.id === queueid);
        let uniqueLinks = [...new Set(links)];
        uniqueLinks.forEach(link => queue.in_progress.push(link));
        return queue.in_progress.length;
    }
    
    completeLink(queueid, link) {
        const queue = this.linksAddQueue.find(q => q.id === queueid);
        if (!queue) return null;
        queue.in_progress = queue.in_progress.filter(l => l !== link);
        queue.done.push(link);
        
        const total = queue.done.length + queue.in_progress.length;
        queue.progress = total > 0 ? (queue.done.length / total) * 100 : 0;
        
        queue.is_done = queue.in_progress.length === 0;
        
        return queue;
    }
    
    getLinkQueueProgress(queueid) {
        const queue = this.linksAddQueue.find(q => q.id === queueid);
        return queue ? Math.floor(queue.progress) : 0;
    }

    getClipsForGroup(groupId) {
        return this.queue.filter(task => task.groupId === groupId)
    }

    completeTask(file, groupId) {
        this.finished++
        this.queue = this.queue.filter(task => !(task.file === file && task.groupId === groupId))
    }

    stillNeed(file){
        const need = this.queue.some(task => task.file === file)
        return need
    }

    getPendingTasks() {
        return this.queue.length
    }
}