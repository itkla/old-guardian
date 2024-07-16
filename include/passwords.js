const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();

// SQLite3 database
const db = new sqlite3.Database('users.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the users database.');
});

// Create users table
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT, password TEXT, email TEXT)");
});

const SALT_ROUNDS = 12;

class Password {
    constructor(password) {
        this.password = password;
    }

    async hashPassword() {
        return await bcrypt.hash(this.password, SALT_ROUNDS);
    }

    async comparePasswords(hash) {
        return await bcrypt.compare(this.password, hash);
    }
};

class User extends Password {
    constructor(username, password) {
        super(password);
        this.username = username;
    }

    async exists(search) {
        return new Promise((resolve, reject) => {
            try {
                db.get("SELECT * FROM users WHERE username = ?", [search], (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    if (row) {
                        resolve(row);
                    } else {
                        resolve(false);
                    }
                });
                db.get("SELECT * FROM users WHERE id = ?", [search], (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    if (row) {
                        resolve(row);
                    } else {
                        resolve(false);
                    }
                });
            } catch (err) {
                reject(err);
            }
        })
    }

    async generateId() {
        return new Promise((resolve, reject) => {
            db.get("SELECT MAX(id) AS id FROM users", (err, row) => {
                if (err) {
                    reject(err);
                }
                if (row.id) {
                    let result = '';
                    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                    let charlength = characters.length;
                    let counter = 0;
                    while (counter < 16) {
                        result += characters.charAt(Math.floor(Math.random() * charlength));
                        counter++;
                    }
                    resolve(result);
                } else {
                    resolve('0000000000000000');
                }
            });
        });
    }
    async login() {
        return new Promise((resolve, reject) => {
            db.get("SELECT password FROM users WHERE username = ?", [this.username], async (err, row) => {
                if (err) {
                    reject(err);
                }
                if (!row) {
                    reject({ status: 404, message: 'User not found' });
                }
                var match = await this.comparePasswords(row.password);
                if (match) {
                    resolve({ status: 200, message: 'Login successful' });
                } else {
                    reject({ status: 401, message: 'Invalid password' });
                }
            });
        });
    }
    async register() {
        // let Password = new Password(this.password);
        var newId = await this.generateId();
        var password = this.password;
        console.log(password);
        password = await this.hashPassword();
        return new Promise((resolve, reject) => {
            try {
                db.run("INSERT INTO users (id, username, password) VALUES (?, ?, ?)", [newId, this.username, password], async (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve({ status: 201, message: 'User created' });
                });
            } catch (err) {
                reject(err);
            }
        });
    }

}

module.exports = { User, Password };