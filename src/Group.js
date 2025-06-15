const axios = require("axios");

module.exports = class ClipperGroup {
    constructor(params, tokengetter) {
        this.groupId = Number(params.group_id)
        this.defaultTitle = params.title
        this.apiVersion = "5.120"
        this.getToken = tokengetter
        this.wallpost = params.wallpost
    }

    async init(){
        const token = await this.getToken()
        const q = new URLSearchParams({
            group_id: this.groupId,
            access_token: token,
            v: this.apiVersion
        });

        const response = await axios.get(`https://api.vk.com/method/groups.getById?${q}`)
        try {
            if(!response.data.response[0].is_admin){
                return false 
            }
            this.groupId = response.data.response[0].id
            return response.data.response[0]
        } catch(e) {
            return false
        }
    }

    async uploadClip(video) {
        const uploadUrl = await this._getUploadUrl({
            file_size: video.length
        });
        const res = await this._upload(uploadUrl, video)
        await this._waitForUpload(res.video_id, res.video_hash)
        await this._edit(res.video_id)
        return await this._publish(res.video_id)
    }

    async _isVKCOM() {
        const token = await this.getToken()
        const q = new URLSearchParams({
            access_token: token,
            v: "5.200"
        });
        const response = await axios.get(`https://api.vk.com/method/apps.get?${q}`)
        return response.data?.response?.items?.[0]?.id === 6287487
    }

    async _getUploadUrl(params) {
        const token = await this.getToken()
        const q = new URLSearchParams({
            group_id: this.groupId,
            access_token: token,
            v: this.apiVersion,
            ...params
        });

        const response = await axios.get(`https://api.vk.com/method/shortVideo.create?${q}`)
        return response.data.response.upload_url
    }

    async _upload(uploadUrl, videoData) {
        const headers = {
            'Connection': 'keep-alive',
            'Content-Disposition': 'attachment; fileName="video.mp4"',
            'Content-Length': videoData.length,
            'Content-Range': `bytes 0-${videoData.length - 1}/${videoData.length}`,
            'Content-Type': 'application/x-binary; charset=x-user-defined',
            'X-Uploading-Mode': 'parallel'
        };

        const response = await axios.post(uploadUrl, videoData, { headers })
        return response.data
    }

    async _publish(id) {
        const token = await this.getToken()
        const q = new URLSearchParams({
            video_id: id,
            owner_id: "-"+this.groupId,
            title: this.defaultTitle,
            license_agree: 1,
            ref: "club_clips_button",
            wallpost: this.wallpost,
            can_make_duet: 1,
            group_id: this.groupId,
            access_token: token,
            v: this.apiVersion
        })

        const response = await axios.get(`https://api.vk.com/method/shortVideo.publish?${q}`)
        return response.data
    }

    async _waitForUpload(id, hash) {
        return new Promise((resolve) => {
            const int = setInterval(async () => {
                const data = await this._getProgress(id, hash)
                if(data.response.percents === 100) {
                    clearInterval(int)
                    resolve()
                }
            }, 2000)
        })
    }

    async _getProgress(id, hash) {
        const token = await this.getToken()
        const q = new URLSearchParams({
            video_id: id,
            owner_id: "-"+this.groupId,
            hash: hash,
            access_token: token,
            v: this.apiVersion
        })

        const response = await axios.get(`https://api.vk.com/method/shortVideo.encodeProgress?${q}`)
        return response.data
    }

    async _edit(id) {
        const token = await this.getToken()
        const q = new URLSearchParams({
            video_id: id,
            owner_id: "-"+this.groupId,
            description: this.defaultTitle,
            access_token: token,
            privacy_view: "all",
            privacy_comment: "all",
            v: this.apiVersion
        })

        const response = await axios.get(`https://api.vk.com/method/shortVideo.edit?${q}`)
        return response.data
    }
}