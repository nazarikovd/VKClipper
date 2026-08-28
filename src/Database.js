const Database = require('better-sqlite3');
const fs = require('fs');

module.exports = class ClipperDB {
    constructor(dbPath = './data/clipper.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.init();
    }

    init() {
        try {
            this.db = new Database(this.dbPath);
            this.initTables();
            this.validateData();
        } catch (err) {
            console.error('Database corrupted or failed to load, running repair...', err.message);
            this.repair();
        }
    }

    initTables() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS accounts (
                user_id INTEGER PRIMARY KEY,
                cookie TEXT NOT NULL,
                profile TEXT
            );

            CREATE TABLE IF NOT EXISTS groups (
                group_id INTEGER PRIMARY KEY,
                owner_id INTEGER,
                schedule TEXT,
                wallpost INTEGER,
                data TEXT
            );
        `);
    }

    repair() {
        if (this.db) {
            try { this.db.close(); } catch (e) {}
        }

        if (fs.existsSync(this.dbPath)) {
            const backupPath = `${this.dbPath}.bak_${Date.now()}`;
            fs.renameSync(this.dbPath, backupPath);
            console.log(`Corrupted database moved to ${backupPath}`);
        }

        this.db = new Database(this.dbPath);
        this.initTables();
        console.log('New clean database initialized.');
    }

    validateData() {
        const accounts = this.db.prepare('SELECT user_id, profile FROM accounts').all();
        for (const acc of accounts) {
            try {
                if (acc.profile) JSON.parse(acc.profile);
            } catch (e) {
                console.warn(`Corrupted profile JSON for account ${acc.user_id}, clearing profile...`);
                this.db.prepare('UPDATE accounts SET profile = NULL WHERE user_id = ?').run(acc.user_id);
            }
        }

        const groups = this.db.prepare('SELECT group_id, data FROM groups').all();
        for (const g of groups) {
            try {
                if (g.data) JSON.parse(g.data);
            } catch (e) {
                console.warn(`Corrupted data JSON for group ${g.group_id}, removing broken group...`);
                this.db.prepare('DELETE FROM groups WHERE group_id = ?').run(g.group_id);
            }
        }
    }

    saveAccount(userId, cookie, profile) {
        this.db.prepare(
            'INSERT OR REPLACE INTO accounts (user_id, cookie, profile) VALUES (?, ?, ?)'
        ).run(userId, cookie, JSON.stringify(profile));
    }

    removeAccount(userId) {
        this.db.prepare('DELETE FROM accounts WHERE user_id = ?').run(userId);
    }

    getAccounts() {
        return this.db.prepare('SELECT * FROM accounts').all();
    }

    saveGroup(groupData, ownerId, schedule, wallpost) {
        this.db.prepare(
            'INSERT OR REPLACE INTO groups (group_id, owner_id, schedule, wallpost, data) VALUES (?, ?, ?, ?, ?)'
        ).run(groupData.id, ownerId, schedule, Number(wallpost), JSON.stringify(groupData));
    }

    removeGroup(groupId) {
        this.db.prepare('DELETE FROM groups WHERE group_id = ?').run(groupId);
    }

    getGroups() {
        return this.db.prepare('SELECT * FROM groups').all();
    }
}