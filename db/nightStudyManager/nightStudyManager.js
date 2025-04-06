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

    /**
     *
     * @param {Object} options
     * @returns {Promise<User[]>}
     */
    async _findUser(options) {
        /**
         * @type {mariadb.PoolConnection}
         */
        let db;
        try {
            db = await this.pool.getConnection();

            let result = await db.query(
                `SELECT * FROM user WHERE${Object.keys(options)
                    .map((e) => ` ${e} = ?`)
                    .join(" AND")};`,
                Object.values(options)
            );

            return result;
        } finally {
            if (db !== undefined) db.release();
        }
    }

    /**
     * 가입한 학생을 불러옵니다.
     * @param {string} id 학생증 ID
     * @returns {Promise<User[]>}
     */
    async getUserById(id) {
        return await this._findUser({ id });
    }

    /**
     * 가입한 학생을 불러옵니다.
     * @param {string} username 유저 닉네임
     * @returns {Promise<User[]>}
     */
    async getUserByUsername(username) {
        return await this._findUser({ username });
    }

    /**
     * 모든 사용자 목록을 불러옵니다.
     * @param {number} [page]
     * @param {number} limit
     * @returns
     */
    async getUsers(page, limit = 25) {
        /**
         * @type {mariadb.PoolConnection}
         */
        let db;
        try {
            db = await this.pool.getConnection();

            if (!!page)
                return await db.query("SELECT * FROM user LIMIT ? OFFSET ?;", [
                    limit,
                    limit * 25 + 1,
                ]);
            else return await db.query("SELECT * FROM user;");
        } finally {
            if (db !== undefined) db.release();
        }
    }

    /**
     * 학생을 생성합니다.
     * @param {Student} student
     */
    async createStudent(student) {
        /**
         * @type {mariadb.PoolConnection}
         */
        let db;
        try {
            db = await pool.getConnection();

            // id 형식 체크
            if (!!!student.id.match(/S[0-9]{7}/g))
                throw new TypeError("id 형식이 올바르지 않음");

            await db.execute("INSERT INTO student VALUES(?, ?, ?, ?);", [
                student.id,
                student.grade,
                student.classNo,
                student.number,
            ]);
        } finally {
            if (!!db) db.end();
        }
    }

    /**
     *
     * @param {Object} options
     * @returns {Promise<User[]>}
     */
    async _findStudent(options) {
        /**
         * @type {mariadb.PoolConnection}
         */
        let db;
        try {
            db = await this.pool.getConnection();

            let result = await db.query(
                `SELECT * FROM student WHERE${Object.keys(options)
                    .map((e) => ` ${e} = ?`)
                    .join(" AND")};`,
                Object.values(options)
            );

            return result;
        } finally {
            if (db !== undefined) db.release();
        }
    }

    /**
     * 사용자 정보를 불러옵니다.
     * @param {string} id 학생증 ID
     * @returns {User[]}
     */
    async getStudentById(id) {
        return await this._findStudent({ id });
    }

    /**
     *
     * @param {number} [page]
     * @param {number} limit
     * @returns {Student[]}
     */
    async getAllStudents(page, limit = 25) {
        /**
         * @type {mariadb.PoolConnection}
         */
        let db;
        try {
            db = await this.pool.getConnection();

            if (!!page)
                return await db.query(
                    "SELECT * FROM student LIMIT ? OFFSET ?;",
                    [limit, limit * 25 + 1]
                );
            else return await db.query("SELECT * FROM student;");
        } finally {
            if (db !== undefined) db.release();
        }
    }

    /**
     * 야자 일정을 추가하거나 변경합니다.
     * @param {Student} student
     * @param {WeekSchedule} schedule
     */
    async updateSchedule(student, schedule) {
        /**
         * @type {mariadb.PoolConnection}
         */
        let db;
        try {
            let db = await pool.getConnection();
            await db.execute(
                "INSERT INTO schedule VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                    "ON DUPLICATE KEY UPDATE classNo = ?," +
                    "posX = ?, posY = ?," +
                    "monA1 = ?, monN1 = ?, monN2 = ?," +
                    "tueA1 = ?, tueN1 = ?, tueN2 = ?," +
                    "thuA1 = ?, thuN1 = ?, thuN2 = ?," +
                    "friA1 = ?, friN1 = ?, friN2 = ?;",
                [
                    // INSERT
                    student.id,
                    schedule.classNo,
                    schedule.posX,
                    schedule.posY,
                    schedule.monSchedule.A1,
                    schedule.monSchedule.N1,
                    schedule.monSchedule.N2,
                    schedule.tueSchedule.A1,
                    schedule.tueSchedule.N1,
                    schedule.tueSchedule.N2,
                    schedule.thuSchedule.A1,
                    schedule.thuSchedule.N1,
                    schedule.thuSchedule.N2,
                    schedule.friSchedule.A1,
                    schedule.friSchedule.N1,
                    schedule.friSchedule.N2,

                    // UPDATE
                    schedule.classNo,
                    schedule.posX,
                    schedule.posY,
                    schedule.monSchedule.A1,
                    schedule.monSchedule.N1,
                    schedule.monSchedule.N2,
                    schedule.tueSchedule.A1,
                    schedule.tueSchedule.N1,
                    schedule.tueSchedule.N2,
                    schedule.thuSchedule.A1,
                    schedule.thuSchedule.N1,
                    schedule.thuSchedule.N2,
                    schedule.friSchedule.A1,
                    schedule.friSchedule.N1,
                    schedule.friSchedule.N2,
                ]
            );
            return;
        } finally {
            if (db !== undefined) db.release();
        }
    }

    /**
     * 일정 가져오기
     * @param {Student} student
     * @returns {WeekSchedule[]}
     */
    async getSchedule(student) {
        /**
         * @type {mariadb.PoolConnection}
         */
        let db;
        try {
            db = await pool.getConnection();
            let result = await db.query(
                "SELECT * FROM schedule WHERE id = ?;",
                [student.id]
            );
            return result.map((e) => rawValue2WeekSchedule(e));
        } finally {
            if (db !== undefined) db.release();
        }
    }

    /**
     * 모든 일정 가져오기
     * @param {number} [page]
     * @returns {WeekSchedule[]}
     */
    async getAllSchedules(page) {
        /**
         * @type {mariadb.PoolConnection}
         */
        let db;
        try {
            db = await pool.getConnection();
            let result;
            if (!!page)
                result = await db.query(
                    "SELECT * FROM schedule LIMIT 25 OFFSET ?;",
                    [page * 25 + 1]
                );
            else result = await db.query("SELECT * FROM schedule;");
            return result.map((e) => rawValue2WeekSchedule(e));
        } finally {
            if (db !== undefined) db.release();
        }
    }

    /**
     * 출석처리
     * @param {Student} student
     * @param {PERIOD} period
     */
    async registerAttendace(student, period) {
        /**
         * @type {mariadb.PoolConnection}
         */
        let db;
        try {
            db = await pool.getConnection();
            await db.execute(
                "INSERT INTO attendanceInfo (id, attendanceTime, period) VALUES(?, CURRENT_TIMESTAMP(), ?);",
                [student.id, period]
            );
        } finally {
            if (!!db) db.release();
        }
    }

    /**
     * 야자 출석 정보 불러오기 옵션
     * @typedef {Object} attendanceInfoQueryOptions
     * @property {Student} student 특정 학생의 야자 출석 정보를 불러옵니다.
     * @property {Date} date 특정 날짜의 야자 출석 정보를 불러옵니다.
     * @property {Date} startDate 특정 날짜범위의 야자 출석 정보를 불러옵니다. 날짜범위의 시작점입니다.
     * @property {Date} endDate 특정 날짜범위의 야자 출석 정보를 불러옵니다. 날짜범위의 종료점입니다.
     */
    /**
     * 야자 출석 정보를 반환합니다.
     * @param {attendanceInfoQueryOptions} options 불러오기 옵션
     * @returns {attendanceInfo[]}
     */
    async getAttendaceInfo(options) {
        let db;
        try {
            db = await pool.getConnection();

            let dateStart = "";
            let dateEnd = "";
            if (options === undefined) {
                let result = await db.query("SELECT * FROM attendanceInfo;");
                return result;
            } else if (options.date !== undefined) {
                dateStart = `${options.date.getFullYear()}-${
                    options.date.getMonth() + 1
                }-${options.date.getDate()} 00:00:00`;
                dateEnd = `${options.date.getFullYear()}-${
                    options.date.getMonth() + 1
                }-${options.date.getDate()} 23:59:59`;
            } else if (
                options.startDate !== undefined &&
                options.endDate !== undefined
            ) {
                dateStart = `${options.startDate.getFullYear()}-${
                    options.startDate.getMonth() + 1
                }-${options.startDate.getDate()} 00:00:00`;
                dateEnd = `${options.endDate.getFullYear()}-${
                    options.endDate.getMonth() + 1
                }-${options.endDate.getDate()} 23:59:59`;
            }

            let result = await db.query(
                "SELECT * FROM attendanceInfo WHERE (0 = ? OR id = ?) " +
                    "AND (0 = ? OR attendanceTime BETWEEN ? AND ?);",
                [
                    options.student !== undefined ? 1 : 0,
                    options.student?.id,
                    options.date !== undefined ||
                    (options.startDate !== undefined &&
                        options.endDate !== undefined)
                        ? 1
                        : 0,
                    dateStart,
                    dateEnd,
                ]
            );
            return result;
        } finally {
            if (!!db) db.end();
        }
    }

    /**
     * DB에서 나온 값을 WeebSchedule로 변환합니다.
     * @param {Object} value
     * @returns {WeekSchedule}
     */
    static rawValue2WeekSchedule(value) {
        return {
            classNo: value.classNo,
            posX: value.posX,
            posY: value.posY,
            monSchedule: {
                A1: value.monA1 == 1,
                N1: value.monN1 == 1,
                N2: value.monN2 == 1,
            },
            tueSchedule: {
                A1: value.tueA1 == 1,
                N1: value.tueN1 == 1,
                N2: value.tueN2 == 1,
            },
            thuSchedule: {
                A1: value.thuA1 == 1,
                N1: value.thuN1 == 1,
                N2: value.thuN2 == 1,
            },
            friSchedule: {
                A1: value.friA1 == 1,
                N1: value.friN1 == 1,
                N2: value.friN2 == 1,
            },
        };
    }
}

module.exports = nightStudyManager;

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
