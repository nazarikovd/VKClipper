module.exports = class ClipperLogManager {
    constructor(maxLogs = 1000) {
        this.logstore = [];
        this.maxLogs = maxLogs;
    }

    E(message, from="main") {
        this.log('error', message, from);
    }

    S(message, from="main") {
        this.log('status', message, from);
    }

    W(message, from="main") {
        this.log('warn', message, from);
    }

    I(message, from="main") {
        this.log('info', message, from);
    }

    log(type, message, from) {
        const logEntry = {
            type,
            message,
            timestamp: new Date().toISOString(),
            from: from
        };
        
        this.logstore = [logEntry, ...this.logstore]
        
        if (this.logstore.length > this.maxLogs) {
            this.logstore.shift();
        }
    }

    getW() {
        return this.logstore.filter(entry => entry.type === 'warn');
    }

    getE() {
        return this.logstore.filter(entry => entry.type === 'error');
    }

    getI() {
        return this.logstore.filter(entry => entry.type === 'info');
    }

    getS() {
        return this.logstore.filter(entry => entry.type === 'status');
    }

    getAll() {
        return [...this.logstore];
    }

    clear() {
        this.logstore = [];
    }

    getLast(n = 1) {
        return this.logstore.slice(-n);
    }

    
    getByType(type) {
        return this.logstore.filter(entry => entry.type === type);
    }

    getByTypes(types) {
        return this.logstore.filter(entry => types.includes(entry.type));
    }

    getByFrom(from) {
        return this.logstore.filter(entry => entry.from === from);
    }

    getByFroms(froms) {
        return this.logstore.filter(entry => froms.includes(entry.from));
    }
};