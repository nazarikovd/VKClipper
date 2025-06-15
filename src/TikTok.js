const { tiktokdl:dl } = require('tiktokdl') 
const axios = require("axios")

module.exports = class ClipperTikTok{

    constructor(){

    }

    async getVideo(url){
        let mp4url = await this._getVideoUrl(url)
        let video = await axios.get(mp4url, {responseType: 'arraybuffer'})
        return video.data
    }

    async _getVideoUrl(url){
        let data = await dl(url)
        return data.video
    }
    
    async getTikToksFromTag(tag){

        let res = await axios.get("https://www.tiktok.com/api/seo/kap/video_list/", {
            params: {
                'WebIdLastTime': '0',
                'aid': '1988',
                'appId': '1233',
                'app_language': 'en',
                'app_name': 'tiktok_web',
                'browser_language': 'en-US',
                'browser_name': 'Mozilla',
                'browser_online': 'true',
                'browser_platform': 'Win32',
                'browser_version': '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'cacheSessionId': '1734657732550',
                'channel': 'tiktok_web',
                'cookie_enabled': 'true',
                'count': '150',
                'data_collection_enabled': 'true',
                'device_id': '7389950662370674208',
                'device_platform': 'web_pc',
                'focus_state': 'true',
                'from_page': '',
                'history_len': '7',
                'is_fullscreen': 'false',
                'is_page_visible': 'true',
                'keyword': tag,
                'odinId': '7096488108610634757',
                'offset': '0',
                'os': 'windows',
                'pageType': '11',
                'priority_region': "RU",
                'region': "RU",
                'root_referer': 'https://www.google.com/',
                'screen_height': '768',
                'screen_width': '1360',
                'trafficType': '0',
                'tz_name': "Europe/Moscow",
                'user_is_login': 'true',
                'webcast_language': 'en',
            }
        })

        let l = []
        try{
            res.data.videoList.forEach(a => l.push(`https://tiktok.com/share/video/${a.id}`))
            return l
        }catch(e){
            return false
        }
        


    }
}