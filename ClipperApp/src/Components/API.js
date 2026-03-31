import axios from 'axios';

class ApiClient {
  constructor(baseURL) {
    this.axios = axios.create({
      baseURL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
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
          return Promise.reject({ error_code: 0, error_msg: 'No response from server' });
        } else {
          return Promise.reject({ error_code: -1, error_msg: error.message });
        }
      }
    );
  }

  async call(method, params = {}) {
    try {
      const response = await this.axios.get(`/method/${method}`, { params });
      if (response.error) return Promise.reject(response.error);
      return response;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Группы, добавленные в бота (с owner_id)
  async getGroups() {
    return this.call('groups.get');
  }

  // Все группы пользователя из VK (для модалки)
  async getUserGroups(owner) {
    return this.call('account.getGroups', { owner });
  }

  async getProfileInfo(owner) {
    return this.call('account.getProfileInfo', { owner });
  }

  async addGroup(groupData) {
    return this.call('groups.add', groupData);
  }

  async deleteGroup(groupId) {
    return this.call('groups.delete', { group_id: groupId });
  }

  async getQueue(params = {}) {
    return this.call('queue.get', params);
  }

  async addTikTokLink(link, groupId) {
    return this.call('links.add', { link, group_id: groupId });
  }

  async addTikTokLinks(links, groupId) {
    return this.call('links.add', { links: links.join(','), group_id: groupId });
  }

  async getLinkProgress(queueId) {
    return this.call('links.getProgress', { queue_id: queueId });
  }

  async saveQueue() {
    return this.call('queue.save');
  }

  async restoreQueue() {
    return this.call('queue.restore');
  }

  async completeTask(file, groupId) {
    return this.call('queue.complete', { file, group_id: groupId });
  }

  async getLogs(type, from) {
    const params = {};
    if (type) params.type = type;
    if (from) params.from = from;
    return this.call('logs.get', params);
  }

  openVid(file) {
    const win = window.open(`${this.axios.defaults.baseURL}method/files.showVideo?file=${file}`, '_blank');
    if (win) win.focus();
  }
}

const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:12000/';
const api = new ApiClient(apiBaseUrl);
export default api;