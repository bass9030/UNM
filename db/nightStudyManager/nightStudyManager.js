const argon2 = require("argon2");
const mariadb = require("mariadb");
const { PERIOD, ROLE } = require("./emum");
class nightStudyManager {
    constructor(pool) {
        /**
         * @type {mariadb.Pool}
         */
        this.pool = pool;
    }

    /**
     * !! 디버깅용 함수 !!
     * DB 테이블 삭제
     */
    async resetDB() {
        /**
         * @type {mariadb.PoolConnection}
         */
        let db;
        try {
            db = await this.pool.getConnection();
            await db.execute("DROP TABLE attendanceInfo;");
            await db.execute("DROP TABLE schedule;");
            await db.execute("DROP TABLE user;");
            await db.execute("DROP TABLE student;");
        } finally {
            if (db !== undefined) await db.release();
        }
    }

    /**
     * @deprecated
     * DB Table 초기설정
     */
    async initTable() {
        /**
         * @type {mariadb.PoolConnection}
         */
        let db;
        try {
            db = await this.pool.getConnection();
            await db.execute(
                "CREATE TABLE IF NOT EXISTS student (id CHAR(8) UNIQUE PRIMARY KEY NOT NULL," +
                    "grade TINYINT(3) NOT NULL," +
                    "classNo TINYINT(9) NOT NULL," +
                    "number TINYINT NOT NULL," +
                    "name VARCHAR(6) NOT NULL);"
            );
            await db.execute(
                "CREATE TABLE IF NOT EXISTS schedule (id CHAR(8) UNIQUE PRIMARY KEY NOT NULL," +
                    "classNo TINYINT(9) NOT NULL, posX TINYINT NOT NULL, posY TINYINT NOT NULL," +
                    "monA1 BOOLEAN NOT NULL DEFAULT 0, monN1 BOOLEAN NOT NULL DEFAULT 0, monN2 BOOLEAN NOT NULL DEFAULT 0, " +
                    "tueA1 BOOLEAN NOT NULL DEFAULT 0, tueN1 BOOLEAN NOT NULL DEFAULT 0, tueN2 BOOLEAN NOT NULL DEFAULT 0," +
                    "thuA1 BOOLEAN NOT NULL DEFAULT 0, thuN1 BOOLEAN NOT NULL DEFAULT 0, thuN2 BOOLEAN NOT NULL DEFAULT 0," +
                    "friA1 BOOLEAN NOT NULL DEFAULT 0, friN1 BOOLEAN NOT NULL DEFAULT 0, friN2 BOOLEAN NOT NULL DEFAULT 0," +
                    "FOREIGN KEY(id) REFERENCES student(id));"
            );
            await db.execute(
                "CREATE TABLE IF NOT EXISTS attendanceInfo (_id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                    "id CHAR(8) UNIQUE NOT NULL," +
                    "attendanceTime TIMESTAMP NOT NULL," +
                    "period CHAR(2) NOT NULL," +
                    "FOREIGN KEY(id) REFERENCES student(id));"
            );
            await db.execute(
                "CREATE TABLE IF NOT EXISTS user (_id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                    "id CHAR(8) UNIQUE NOT NULL," +
                    "username VARCHAR(32) UNIQUE NOT NULL," +
                    "email VARCHAR(320) UNIQUE NOT NULL," +
                    "password VARCHAR(97) NOT NULL," +
                    "role TINYINT NOT NULL DEFAULT 0," + // 0: student, 1: admin, 2: checkout
                    "FOREIGN KEY(id) REFERENCES student(id));"
            );
        } finally {
            if (db !== undefined) db.release();
        }
    }

    /**
     *
     * @param {User} user
     */
    async createUser(user) {
        /**
         * @type {mariadb.PoolConnection}
         */
        let db;
        try {
            db = await this.pool.getConnection();

            await db.execute(
                "INSERT INTO user(id, username, email, password) VALUES (?, ?, ?, ?);",
                [
                    user.id,
                    user.username,
                    user.email,
                    await argon2.hash(user.password),
                ]
            );
        } finally {
            if (db !== undefined) db.release();
        }
    }

    async function getUserById
}

/* ====== typedefs ====== */
/**
 * @typedef {Object} User
 * @property {number} _id 내부 ID
 * @property {string} id 학생증 ID
 * @property {string} username 로그인 아이디
 * @property {string} email 이메일
 * @property {string} password 로그인 비밀번호
 * @property {ROLE} role 로그인 비밀번호
 */

/**
 * @typedef {Object} Student
 * @property {string} id 학생증 ID
 * @property {number} grade 학년
 * @property {number} classNo 반
 * @property {number} number 번호
 */

/**
 * @typedef {Object} WeekSchedule
 * @property {number} classNo 야자 교실
 * @property {number} posX 좌석 X 좌표
 * @property {number} posY 좌석 Y 좌표
 * @property {DaySchedule} monSchedule 월요일 시간표
 * @property {DaySchedule} tueSchedule 화요일 시간표
 * @property {DaySchedule} thuSchedule 목요일 시간표
 * @property {DaySchedule} friSchedule 금요일 시간표
 */

/**
 * @typedef {Object} DaySchedule
 * @property {boolean} A1 오후자습
 * @property {boolean} N1 야간자습 1교시
 * @property {boolean} N2 야간자습 2교시
 */

/**
 * @typedef {Object} attendanceInfo
 * @property {number} _id 식별용 ID
 * @property {string} id 학생증 ID
 * @property {Date} attendanceTime 출석 시간
 * @property {PERIOD} period 교시(오자, 야자1, 야자2)
 */

/* ======================= */
