// api.js
import axios from 'axios';

class ApiClient {
	constructor(baseURL) {
		this.axios = axios.create({
			baseURL,
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		this.axios.interceptors.response.use(
			(response) => response.data,
			(error) => {
				if (error.response) {
					return Promise.reject({
						error_code: error.response.status,
						error_msg: error.response.data?.error_msg || 'Unknown server error',
					});
				} else if (error.request) {
					return Promise.reject({
						error_code: 0,
						error_msg: 'No response from server',
					});
				} else {
					return Promise.reject({
						error_code: -1,
						error_msg: error.message,
					});
				}
			}
		);
	}

	async call(method, params = {}) {
		try {
			const response = await this.axios.get(`/method/${method}`, {
				params,
			});

			if (response.error) {
				return Promise.reject(response.error);
			}

			return response;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async addGroup(groupData) {
		return this.call('groups.add', groupData);
	}

	async getGroups() {
		return this.call('groups.get');
	}

	openVid(file) {
		const win = window.open(`${apiBaseUrl}method/files.showVideo?file=${file}`, '_blank');
		if (win != null) {
			win.focus();
		}
	}

	async deleteGroup(groupId) {
		return this.call('groups.delete', { group_id: groupId });
	}
}

let apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:12000/';

const api = new ApiClient(apiBaseUrl);
export default api;