const MariaDB = require('mariadb');
require('dotenv').config();

const db = MariaDB.createPool({
    host: process.env.DB_HOST,
    port: 3306,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
});

module.exports = {
    getConnection: async () => {
        return await db.getConnection();
    }
}