const MariaDB = require("mariadb");

class nightStudyDBConnector {
    constructor() {
        /**
         * @type {MariaDB.Pool}
         */
        this.db = MariaDB.createPool({
            host: process.env.DB_HOST,
            port: 3306,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });
    }

    async getConnection() {
        return await this.db.getConnection();
    }
}

module.exports = nightStudyDBConnector;
