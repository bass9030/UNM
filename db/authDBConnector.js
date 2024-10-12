const MariaDB = require("mariadb");

const db = MariaDB.createPool({
    host: process.env.AUTH_DB_HOST,
    port: 3306,
    database: process.env.AUTH_DB_NAME,
    user: process.env.AUTH_DB_USER,
    password: process.env.AUTH_DB_PASS,
});

module.exports = {
    getConnection: async () => {
        return await db.getConnection();
    },
};
