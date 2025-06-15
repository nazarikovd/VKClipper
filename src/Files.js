let fs = require('fs')
let path = require('path');
let crypto = require('crypto')
let os = require('os')

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
              else resolve(name)
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
}