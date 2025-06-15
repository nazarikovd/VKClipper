const ClipperFileManager = require("./Files");
const ClipperQueueManager = require("./Queue");
const ClipperVKGroup = require("./Group");
const ClipperTikTok = require("./TikTok");
const ClipperTaskScheduler = require("./Sheduler");
const ClipperAccount = require("./Account");
const ClipperLogManager = require("./Log");

module.exports = class Clipper {

	constructor(config = {}) {
		this.logManager = new ClipperLogManager()
		this.tempDir = './ClipperTemp/'
		this.fileManager = new ClipperFileManager()
		this.fileManager.init(this.tempDir)
		this.taskScheduler = new ClipperTaskScheduler()
		this.tiktokDownloader = new ClipperTikTok()
		this.queueManager = new ClipperQueueManager(() => this.getCurrentGroups())
		this.accountManager = new ClipperAccount(this.logManager)
		this.vkGroups = []
		this.initAutoSave()

	}

	initAutoSave(){
		process.on('SIGINT', async () => {
			console.log('Saving queue before exit...');
			await this.saveQ();
			process.exit();
		});
		
		process.on('SIGTERM', async () => {
			console.log('Saving queue before exit...');
			await this.saveQ();
			process.exit();
		});
	}

	getCurrentGroups() {
		return this.vkGroups.map(group => ({
			group_id: group.group_id
		}));
	}

	async addVKGroup(groupConfig) {

		const group = new ClipperVKGroup(groupConfig, () => this.accountManager.getToken());
		let groupdata = await group.init()
		if(groupdata === false){
			this.logManager.E(`Failed to fetch group ${groupconfig}`, "groups")
			return false
		}

		const dup = this.vkGroups.find(g => g.group_id === groupdata.id)

		if(dup){
			return groupdata.id
		}

		this.vkGroups.push({
			group_id: groupdata.id,
			group: group,
			links: [],
			interval: groupConfig.intervalMinutes,
			wallpost: groupConfig.wallpost,
			data: groupdata
		});
	
		this.taskScheduler.addTask(groupdata.id, () => this.processGroupLinks(groupdata.id), groupConfig.intervalMinutes);
		this.logManager.I(`Added group. [${groupdata.screen_name}] (interval: ${groupConfig.intervalMinutes}min wall: ${groupConfig.wallpost})`, "groups");
		return groupConfig.group_id;
	}

	async remVKGroup(id) {

		let gid = Number(id)
		const del = this.vkGroups.find(g => g.group_id === gid)
		
		if (!del) {
			return false;
		}
		this.taskScheduler.remTask(gid);
		const groupClips = this.queueManager.getClipsForGroup(gid);

		await Promise.all(

			groupClips.map(async (clip) => {

				this.queueManager.completeTask(clip.file, gid)

				if (!this.queueManager.stillNeed(clip.file)) {
					await this.fileManager.remClip(clip.file)
				}

			})
				
		)
		this.vkGroups = this.vkGroups.filter(g => g.group_id !== gid)
		this.logManager.I(`Removed group. [${del.data.screen_name}]`, "groups");
		return true;

	}

	async addTikTokLink(link, groupId = 'all', fromBatch=false) {

		const videoBuffer = await this.tiktokDownloader.getVideo(link)
		const clipname = await this.fileManager.saveClip(videoBuffer)
		
		this.queueManager.addClip({
			type: groupId === 'all' ? 'all' : 'group',
			id: groupId,
			file: clipname
		});

		if(!fromBatch){
			this.logManager.I(`${link} => ${groupId === 'all' ? 'ALL' : 'club' + groupId} (${clipname})`, "video")
		}
		

	}

	async addTikTokLinks(links, groupId = 'all', doner) {
		for(let onelink of links){
			try{
				await this.addTikTokLink(onelink, groupId, true)
				this.logManager.I(`${onelink} => ${groupId === 'all' ? 'ALL' : 'club' + groupId} (batch)`, "video")
			}catch(e){
				this.logManager.E(`${onelink} => ${groupId === 'all' ? 'ALL' : 'club' + groupId} failed. Wait 1 sec...`, "video")
				await new Promise(resolve => setTimeout(resolve, 1000));
			}finally{
				doner(onelink)
			}
		}

	}

	async processGroupLinks(groupId) {
		const groupData = this.vkGroups.find(g => g.group_id === groupId)
		if (!groupData) return
	
		const tasks = this.queueManager.getClipsForGroup(groupId)
		if (tasks.length === 0) return;
	
		const task = tasks[0]
		
		try{

			const clip = await this.fileManager.readClip(task.file)
			let abc = await groupData.group.uploadClip(clip)
			this.queueManager.completeTask(task.file, groupId)
		
			this.logManager.I(`${task.file} => ${groupId}`, "task")

			if (!this.queueManager.stillNeed(task.file)) {
				this.logManager.I(`${task.file} removed (not needed anymore)`, "files")
				await this.fileManager.remClip(task.file)
			}

		}catch(e){
			this.logManager.E(`${groupId} task failed. ${e}`, "task")
		}

	}

	async saveQ(){

		const queueData = {
            queue: this.queueManager.queue
		}

		let sv = await this.fileManager.saveQueueData(queueData)
		return sv
	}

	async restoreQ(){

		const sv = await this.fileManager.getQueueData()
		if (!sv) return false

		const validQueue = []
        for (const task of sv.queue) {
            try {
                await this.fileManager.readClip(task.file)
                validQueue.push(task)
            } catch {
                this.logManager.E(`File ${task.file} not found, skipping...`, "queue")
            }
        }
		this.queueManager.queue = validQueue
		this.logManager.I(`Queue state restored. ${validQueue.length} new tasks`, "queue")
		return true
	}


}

