const ClipperFileManager = require("./Files");
const ClipperQueueManager = require("./Queue");
const ClipperVKGroup = require("./Group");
const ClipperTikTok = require("./TikTok");
const ClipperTaskScheduler = require("./Sheduler");
const ClipperAccount = require("./Account");
const ClipperLogManager = require("./Log");
const ClipperDB = require('./Database');

module.exports = class Clipper {

	constructor(config = {}) {
		this.logManager = new ClipperLogManager()
		this.tempDir = './ClipperTemp/'
		this.fileManager = new ClipperFileManager()
		this.fileManager.init(this.tempDir)
		this.taskScheduler = new ClipperTaskScheduler()
		this.tiktokDownloader = new ClipperTikTok()
		this.queueManager = new ClipperQueueManager(() => this.getCurrentGroups())
		this.database = new ClipperDB()
		this.accountManager = {}
		this.vkGroups = []
		this.initAutoSave()
		this.restoreState()
	}

	async addAccount(cookie) {
	    const account = new ClipperAccount(this.logManager)
	    account.setCookie(cookie)

	    await account.getToken()
	    const profile = await account.profile()
	    const userId = profile?.id

	    if (!userId || this.accountManager[userId]) return

	    account.once('deleted', async () => {
	        try {
	            await this.delAccount(userId)
	        } catch (err) {
	            this.logManager.E(`Failed cleanup for ${userId}: ${err.message}`, "account")
	        }
	    })

	    this.logManager.I(`Adding new account ${userId} (${profile.first_name} ${profile.last_name})`, "account")
	    this.accountManager[userId] = account
	    this.database.saveAccount(userId, cookie, profile)
	    return userId
	}

	async delAccount(owner_id){
		let oid = Number(owner_id)
		const account = this.accountManager[oid]
		if(!account){
			return false
		}
		this.logManager.I(`Removing account ${oid}`, "account")
		await this.cleanUp(oid)
		delete this.accountManager[oid]
		this.database.removeAccount(oid)
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

		const group = new ClipperVKGroup(groupConfig, () => this.accountManager[groupConfig.owner_id].getToken())
		let groupdata = await group.init()
		
		if(groupdata === false){
			this.logManager.E(`Failed to fetch group ${groupConfig.group_id}`, "groups")
			return false
		}

		const dup = this.vkGroups.find(g => g.group_id === groupdata.id)
		if(dup) return groupdata.id

		const schedule = groupConfig.schedule || groupConfig.intervalMinutes || "15"

		this.vkGroups.push({
			group_id: Number(groupdata.id),
			owner_id: Number(groupConfig.owner_id),
			group: group,
			links: [],
			schedule: schedule,
			wallpost: Number(groupConfig.wallpost),
			data: groupdata
		})
		
		this.taskScheduler.addTask(groupdata.id, () => this.processGroupLinks(groupdata.id), schedule)
		this.database.saveGroup(groupdata, groupConfig.owner_id, schedule, Number(groupConfig.wallpost))
		this.logManager.I(`Added group [${groupdata.screen_name}] (schedule: ${schedule} wall: ${groupConfig.wallpost})`, "groups")
		return groupdata.id
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
		this.database.removeGroup(gid)
		this.logManager.I(`Removed group. [${del.data.screen_name}]`, "groups");
		return true;

	}

	async cleanUp(owner_id){

		let oid = Number(owner_id)
		const del = this.vkGroups.filter(g => g.owner_id === oid)

		if (del.length === 0){
        	return false
    	}

		for(let group of del){
			await this.remVKGroup(group.group_id)
		}
		
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

	async restoreState() {
	    const rawAccounts = this.database.getAccounts();
	    const rawGroups = this.database.getGroups();

	    for (const acc of rawAccounts) {
	        const account = new ClipperAccount(this.logManager);
	        account.setCookie(acc.cookie);
	        account.userId = acc.user_id;
	        
	        try {
	            account._profile = acc.profile ? JSON.parse(acc.profile) : null;
	        } catch (e) {
	            account._profile = null;
	        }

	        account.once('deleted', async () => {
	            try { await this.delAccount(acc.user_id); } catch (err) {}
	        });

	        this.accountManager[acc.user_id] = account;
	    }

	    for (const g of rawGroups) {

	        if (!this.accountManager[g.owner_id]) {
	            this.logManager.E(`Group ${g.group_id} has no owner (user ${g.owner_id} not found), skipping...`, "db");
	            this.database.removeGroup(g.group_id);
	            continue;
	        }

	        let parsedData = null;
	        try {
	            parsedData = g.data ? JSON.parse(g.data) : null;
	        } catch (e) {
	            this.logManager.E(`Corrupted data for group ${g.group_id}, skipping...`, "db");
	            continue;
	        }

	        const groupConfig = {
	            group_id: g.group_id,
	            owner_id: g.owner_id,
	            schedule: g.schedule,
	            wallpost: g.wallpost
	        };

	        const group = new ClipperVKGroup(groupConfig, () => this.accountManager[g.owner_id].getToken());
	        
	        this.vkGroups.push({
	            group_id: Number(g.group_id),
	            owner_id: Number(g.owner_id),
	            group: group,
	            links: [],
	            schedule: g.schedule,
	            wallpost: Number(g.wallpost),
	            data: parsedData
	        });

	        this.taskScheduler.addTask(g.group_id, () => this.processGroupLinks(g.group_id), g.schedule);
	    }

	    this.logManager.I(`State restored: ${Object.keys(this.accountManager).length} accounts, ${this.vkGroups.length} groups`, "db");
	}

}

