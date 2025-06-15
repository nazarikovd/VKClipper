const axios = require('axios');

module.exports = class ClipperAccount {
    constructor(log) {
        this.logManager = log
        this.tokenData = null;
        this.tokenExpires = 0;
        this.appId = 6287487;
        this.cookie = null;
        this._inPromise = null;
    }

    async setCookie(cookie){
        this.cookie = cookie;
    }

    async getToken() {

        if (this.tokenData && Date.now() < this.tokenExpires - 60000) {
            return this.tokenData.access_token;
        }

        //race был, поэтому кешируем промис
        if (this._inPromise) {
            return this._inPromise;
        }

        this._inPromise = this._refreshToken()
        .finally(() => {
            this._inPromise = null;
        });

        return this._inPromise;

    }

    async _refreshToken() {
        try {
            const response = await axios.post('https://login.vk.com/?act=web_token', {
                version: 1,
                app_id: this.appId
            }, {
                headers: {
                    'Cookie': this.cookie,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': 'https://vk.com',
                    'Referer': 'https://vk.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (response.data?.type === 'okay') {
                this.tokenData = response.data.data;
                this.tokenExpires = response.data.data.expires * 1000;
                this.logManager.I(`Refresh access_token. Expires at ${new Date(this.tokenExpires).toLocaleString()}`, "account");
                return this.tokenData.access_token;
            } else {
                this.logManager.E(`Auth error: ${JSON.stringify(response.data)}`, "account");
            }
        } catch (error) {
            this.logManager.E(`Refresh access_token error: ${error.message}`, "account");
            throw error;
        }
    }

    isValid() {
        return this.tokenData && Date.now() < this.tokenExpires;
    }

    async getUserGroups(){
        const token = await this.getToken()
        const q = new URLSearchParams({
            extended: 1,
            filter: "admin",
            access_token: token,
            v: "5.120"
        });
        const response = await axios.get(`https://api.vk.com/method/groups.get?${q}`)
        try {
            if(!response.data.response.items || response.data.response.count === 0){
                return []
            }
            return response.data.response.items
        } catch(e) {
            return []
        }
    }

    async getProfileInfo(){
        const token = await this.getToken()
        const q = new URLSearchParams({
            fields: "photo_200, domain",
            access_token: token,
            v: "5.120"
        });
        const response = await axios.get(`https://api.vk.com/method/users.get?${q}`)

        if(!response.data.response[0] || response.data.response.count === 0){
            throw new Error()
        }
        return response.data.response[0]

    }
}