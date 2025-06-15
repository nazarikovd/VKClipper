const express = require('express');
const Clipper = require('./Clipper');
const cors = require('cors');
const path = require('path');

module.exports = class ClipperAPI {
    
    constructor(statics, port) {

        this.clipper = new Clipper()
        this.app = express()
        this.port = port
        this.app.use(express.urlencoded({ extended: true }))
	    this.app.use(cors())
        this.app.use(express.static(statics))
        this.setupRoutes()
    }
    setupRoutes() {

        this.app.get('/method/account.checkAuth', (req, res) => {
            try {

                res.json({ response: !!this.clipper.accountManager.tokenData});

            } catch (error) {

                res.json({
                    error: {
                        error_code: 10,
                        error_msg: 'Internal server error'
                    }
                })
            }
        })

        this.app.get('/method/account.setCookie', async (req, res) => {
            try {
                const { cookie } = req.query

                await this.clipper.accountManager.setCookie(cookie)
                let token = await this.clipper.accountManager.getToken()
                res.json({ response: token });

            } catch (error) {

                res.json({
                    error: {
                        error_code: 10,
                        error_msg: 'Internal server error'
                    }
                })
            }
        })

        this.app.get('/method/account.getGroups', async (req, res) => {
            try {

                const groups = await this.clipper.accountManager.getUserGroups()
                
                res.json({ response: groups });

            } catch (error) {

                res.json({
                    error: {
                        error_code: 10,
                        error_msg: 'Internal server error'
                    }
                })
            }
        })
        this.app.get('/method/account.getProfileInfo', async (req, res) => {
            try {
                if(!this.clipper.accountManager.tokenData) {
                    return res.json({
                        error: {
                            error_code: 5,
                            error_msg: 'User authorization failed'
                        }
                    });
                }
                
                const profile = await this.clipper.accountManager.getProfileInfo();
                res.json({ response: profile });
            } catch (error) {
                res.json({
                    error: {
                        error_code: 10,
                        error_msg: 'Internal server error'
                    }
                });
            }
        });
        this.app.get('/method/groups.get', (req, res) => {
            try {

                const groups = this.clipper.vkGroups.map(group => ({
                    id: group.group_id,
                    interval: group.interval,
                    wallpost: group.wallpost,
                    pending_tasks: this.clipper.queueManager.getClipsForGroup(group.group_id).length,
                    nextRun: this.clipper.taskScheduler.getTimeToNextRun(group.group_id),
                    data: group.data
                }))
                
                res.json({ response: groups });

            } catch (error) {

                res.json({
                    error: {
                        error_code: 10,
                        error_msg: 'Internal server error'
                    }
                })
            }
        })

        // Метод groups.add - Добавить новую группу
        this.app.get('/method/groups.add', async (req, res) => {
            try {

                const { group_id, title, wallpost, interval } = req.query
                
                if (!group_id) {

                    return res.json({
                        error: {
                            error_code: 100,
                            error_msg: 'One of the parameters specified was missing or invalid: group_id required'
                        }
                    })
                }

                const groupId = await this.clipper.addVKGroup({
                    group_id,
                    title,
                    wallpost,
                    intervalMinutes: interval ? parseInt(interval) : 15
                })

                if(groupId === false){

                    res.json({
                        error: {
                            error_code: 14,
                            error_msg: "Group is wrong"
                        }
                    })
                    
                    return;
                }

                res.json({ response: { group_id: groupId } })

            } catch (error) {
                console.log(error)
                res.json({
                    error: {
                        error_code: 10,
                        error_msg: error.message
                    }
                })
            }
        })

        // Метод groups.delete - Удалить группу
        this.app.get('/method/groups.delete', async (req, res) => {
            try {

                const { group_id } = req.query
                
                if (!group_id) {

                    return res.json({
                        error: {
                            error_code: 100,
                            error_msg: 'Parameter group_id is required'
                        }
                    });
                }

                await this.clipper.remVKGroup(group_id)
                
                res.json({ response: 1 })

            } catch (error) {

                res.json({
                    error: {
                        error_code: 10,
                        error_msg: error.message
                    }
                })
            }
        })

        // Метод links.add - Добавить TikTok ссылку
        this.app.get('/method/links.add', async (req, res) => {

                const { link, links, group_id = 'all' } = req.query;
                
                if (!link && !links) {

                    return res.json({
                        error: {
                            error_code: 100,
                            error_msg: 'One of link or links is required'
                        }
                    })
                }
                
                if(link){

                    await this.clipper.addTikTokLink(link, group_id)
                    res.json({ response: 1 })

                }else if(links){
                    
                    let links_array = links.split(",");
                    const {add, done, qid} = this.clipper.queueManager.createLinksQueue()

                    res.json({ response: 1, qid: qid})
                    add(links_array)
                    this.clipper.addTikTokLinks(links_array, group_id, done)
                    
                }
        })

        this.app.get('/method/links.getByTag', async (req, res) => {

            const { tag } = req.query;
            
            if (!tag) {

                return res.json({
                    error: {
                        error_code: 100,
                        error_msg: 'One tag is required'
                    }
                })
            }
            
            
            try{
                let linksdata = await this.clipper.tiktokDownloader.getTikToksFromTag(tag)
                if(linksdata){
                    res.json({ response: 1, links: linksdata})
                }else{
                    res.json({
                        error: {
                            error_code: 6,
                            error_msg: "No links"
                        }
                    })
                }
                
            }catch(e){
                res.json({
                    error: {
                        error_code: 10,
                        error_msg: error.message
                    }
                })
            }
            

            

        })

        this.app.get('/method/links.getProgress', async (req, res) => {
            try {
                const { queue_id } = req.query;
                let qid = Number(queue_id)
                res.json({
                    progress: this.clipper.queueManager.getLinkQueueProgress(qid)
                })
            } catch (error) {

                res.json({
                    error: {
                        error_code: 10,
                        error_msg: error.message
                    }
                })
            }
        })

        // Метод queue.get - Получить очередь задач
        this.app.get('/method/queue.get', (req, res) => {
            try {
                const { group_id } = req.query;
                let tasks;
                
                if (group_id) {
                    tasks = this.clipper.queueManager.getClipsForGroup(group_id);
                } else {
                    tasks = this.clipper.queueManager.queue;
                }
                
                res.json({
                    response: {
                        count: tasks.length,
                        finished: this.clipper.queueManager.finished,
                        items: tasks
                    }
                })
            } catch (error) {

                res.json({
                    error: {
                        error_code: 10,
                        error_msg: error.message
                    }
                })
            }
        })

        this.app.get('/method/queue.complete', (req, res) => {
            try {
                const { file, group_id } = req.query;
                this.clipper.queueManager.completeTask(file, Number(group_id))
                
                res.json({
                    response: {
                        success: true
                    }
                })
            } catch (error) {

                res.json({
                    error: {
                        error_code: 10,
                        error_msg: error.message
                    }
                })
            }
        })

        this.app.get('/method/queue.save', async (req, res) => {
            try {
                
                let sv = await this.clipper.saveQ()
                
                res.json({
                    response: {
                        success: sv
                    }
                })
            } catch (error) {

                res.json({
                    error: {
                        error_code: 10,
                        error_msg: error.message
                    }
                })
            }
        })

        this.app.get('/method/queue.restore', async (req, res) => {
            try {

                let sv = await this.clipper.restoreQ()
                
                res.json({
                    response: {
                        success: sv
                    }
                })

            } catch (error) {

                res.json({
                    error: {
                        error_code: 10,
                        error_msg: error.message
                    }
                })
            }
        })

        this.app.get('/method/tasks.get', (req, res) => {
            try {
                let tasks = this.clipper.taskScheduler.tasks.map(task => ({
                    id: task.id,
                    lastRun: task.lastRun,
                    intervalMinutes: task.intervalMinutes,
                    group_id: task.group_id,
                    cronActive: task.cronTask ? task.cronTask.running : false
                }));
                
                res.json({
                    response: {
                        count: tasks.length,
                        items: tasks
                    }
                });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        })

        this.app.get('/method/tasks.getNextById', (req, res) => {
            const { group_id } = req.query;
            try {
                let next = this.clipper.taskScheduler.getTimeToNextRun(Number(group_id))
                
                res.json({
                    response: {
                        response: next
                    }
                });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        })

        this.app.get('/method/tasks.getAllNext', (req, res) => {
            try {
                let tasks = this.clipper.taskScheduler.getAllNextIntervals()
                
                res.json({
                    response: {
                        response: tasks
                    }
                });
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        })

        this.app.get('/method/logs.get', (req, res) => {
            try {
                const { type, from } = req.query;
                if(type){
                    return res.json({
                        response: {
                            "logs": this.clipper.logManager.getByType(type)
                        }
                    });
                }
                if(from){
                    return res.json({
                        response: {
                            "logs": this.clipper.logManager.getByFrom(from)
                        }
                    });
                }
                return res.json({
                    response: {
                        "logs": this.clipper.logManager.getAll()
                    }
                });
            }catch(e){
                res.status(500).json({ error: e.message });
            }
        })

        this.app.get('/method/files.showVideo', async (req, res) => {
            const ALLOWED_FILENAME_REGEX = /^[a-zA-Z0-9\-_]+\.mp4$/;

            try {
                const { file } = req.query

                if (!ALLOWED_FILENAME_REGEX.test(file)) {
                    return res.json({
                        error: {
                            error_code: 3,
                            error_msg: 'I Have no video like that sussss stafff'
                        }
                    })
                }

                let video = await this.clipper.fileManager.readClip(file)
                if(!video){
                    return res.json({
                        error: {
                            error_code: 2,
                            error_msg: 'I Have no video like that'
                        }
                    })
                }
                res.set({
                    'Content-Type': 'video/mp4',
                    'Content-Length': video.length
                });
                    
                res.send(video);

            } catch (error) {

                res.json({
                    error: {
                        error_code: 10,
                        error_msg: 'Internal server error'
                    }
                })
            }
        })

        this.app.listen(this.port, () => {
            console.log(`Clipper API running on port ${this.port}`)
        })
    }
}
