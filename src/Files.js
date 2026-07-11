let fs = require('fs')
let path = require('path');
let crypto = require('crypto')
let os = require('os')
let { exec } = require('child_process')
let util = require('util')
let execPromise = util.promisify(exec)

module.exports = class ClipperFileManager {

    constructor() {
        this.clipsFolder = null
    }

    async init(clipsFolder) {
        this.clipsFolder = clipsFolder
        await this._createDirectoryIfNotExists(this.clipsFolder)
    }


    async saveClip(data) {
        const name = this._generateFileName()
        const filePath = path.join(this.clipsFolder, name)
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, data, (err) => {
                if (err) reject(err)
                else {
                    this.makeCover(name).catch(console.error)
                    resolve(name)
                }
            })
        })
    }

    async readClip(name) {
        const filePath = path.join(this.clipsFolder, name)
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
              if (err) reject(err)
              else resolve(data)
            })
        })
    }

    async remClip(name) {
        const filePath = path.join(this.clipsFolder, name)
        this.remCover(name)
        return new Promise((resolve, reject) => {
            fs.unlink(filePath, (err, data) => {
              if (err) reject(err)
              else resolve()
            })
        })
    }

    async _createDirectoryIfNotExists(dirPath) {
        try {
            fs.accessSync(dirPath)
        } catch (err) {
            fs.mkdirSync(dirPath, { recursive: true })
        }
    }

    async saveQueueData(data, name = 'queue_backup.json') {

        const filePath = path.join(this.clipsFolder, name)
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
                if (err) reject(err)
                else resolve(name)
            })
        })

    }
    
    async getQueueData(name = 'queue_backup.json') {

        const filePath = path.join(this.clipsFolder, name)
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                
                if (err){
                    resolve(false); console.log(err)
                }
                else{
                    const parsed = JSON.parse(data)
                    resolve(parsed)
                } 
            })
        })
        
    }

    _generateFileName(extension = '.mp4') {
        return crypto.randomBytes(10).toString('hex') + extension;
    }

    async makeCover(name) {
        const inputPath = path.join(this.clipsFolder, name)
        const coverName = name.replace('.mp4', '_cover.webp')
        const outputPath = path.join(this.clipsFolder, coverName)
        const cmd = `ffmpeg -y -ss 00:00:02 -t 1.5 -i "${inputPath}" -vf "fps=10,scale=480:-1,split[s0][s1];[s1]reverse[s2];[s0][s2]concat=n=2:v=1:a=0" -loop 0 "${outputPath}"`
        
        await execPromise(cmd)
        return coverName
    }

    async remCover(name) {
        const coverName = name.replace('.mp4', '_cover.webp')
        const filePath = path.join(this.clipsFolder, coverName)
        try {
            await fs.promises.unlink(filePath)
        } catch (e) {}
    }

    async readCover(name) {
        const coverName = name.replace('.mp4', '_cover.webp')
        const filePath = path.join(this.clipsFolder, coverName)
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) reject(err)
                else resolve(data)
            })
        })
    }
}