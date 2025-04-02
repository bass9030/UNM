const MariaDB = require("mariadb");

const db = MariaDB.createPool({
    host: process.env.DB_HOST,
    port: 3306,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

module.exports = {
    getConnection: async () => {
        return await db.getConnection();
    },
};
