const argon2 = require("argon2");
const pool = require("./nightStudyDBConnector.js");

/* ====== typedefs ====== */
/**
 * @typedef {Object} BaseResult
 * @property {boolean} success 성공여부
 * @property {Object} [error] (에러 발생시) 에러 내용
 */

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

const PERIOD = {
    A1: "A1",
    N1: "N1",
    N2: "N2",
};

const ROLE = {
    STUDENT: 0,
    ADMIN: 1,
    CHECKOUT: 2,
};

Object.freeze(PERIOD);
Object.freeze(ROLE);

/**
 * !! 디버깅용 외에 사용하지 마세요 !!
 * DB 초기화
 * @returns {BaseResult}
 */
async function resetDB() {
    let db;
    try {
        db = await pool.getConnection();
        await db.execute("DROP TABLE attendanceInfo;");
        await db.execute("DROP TABLE schedule;");
        await db.execute("DROP TABLE user;");
        await db.execute("DROP TABLE student;");
        return {
            success: true,
        };
    } catch (e) {
        console.error(e);
        return {
            success: false,
            error: e,
        };
    } finally {
        if (!!db) db.end();
    }
}

/**
 * DB Table 초기설정
 */
async function initTable() {
    let db;
    try {
        db = await pool.getConnection();
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
        return {
            success: true,
        };
    } catch (e) {
        console.error(e);
        return {
            success: false,
            error: e,
        };
    } finally {
        if (!!db) db.end();
    }
}

/**
 * 사용자 가입
 * @param {User} user 사용자 정보
 */
async function addUser(user) {
    let db;
    try {
        db = await pool.getConnection();

        await db.execute(
            "INSERT INTO user(id, username, email, password) VALUES (?, ?, ?, ?);",
            [
                user.id,
                user.username,
                user.email,
                await argon2.hash(user.password),
            ]
        );
        return {
            success: true,
        };
    } catch (e) {
        return {
            success: false,
            error: e,
        };
    } finally {
        if (!!db) db.end();
    }
}

/**
 * @typedef {BaseResult & {data: User[]}} UserResult
 */
/**
 * 사용자 정보 불러오기
 * @param {string} id 학생증 ID
 * @returns {UserResult}
 */
async function getUserById(id) {
    let db;
    try {
        db = await pool.getConnection();

        let result = await db.query("SELECT * FROM user WHERE id = ?;", [id]);
        return {
            success: true,
            data: result,
        };
    } catch (e) {
        return {
            success: false,
            error: e,
        };
    } finally {
        if (!!db) db.end();
    }
}

/**
 * 사용자 정보 불러오기
 * @param {string} username 로그인 아이디
 * @returns {UserResult}
 */
async function getUserByUsername(username) {
    let db;
    try {
        db = await pool.getConnection();

        let result = await db.query("SELECT * FROM user WHERE username = ?;", [
            username,
        ]);
        return {
            success: true,
            data: result,
        };
    } catch (e) {
        return {
            success: false,
            error: e,
        };
    } finally {
        if (!!db) db.end();
    }
}

/**
 * 사용자 정보 불러오기
 * @param {number} [page]
 * @returns {UserResult}
 */
async function getUsers(page) {
    let db;
    try {
        db = await pool.getConnection();
        let result;
        if (!!page)
            result = await db.query("SELECT * FROM user LIMIT 25 OFFSET ?;", [
                page * 25 + 1,
            ]);
        else result = await db.query("SELECT * FROM user;");
        return {
            success: true,
            data: result,
        };
    } catch (e) {
        console.error(e);
        return {
            success: false,
            error: e,
        };
    } finally {
        if (!!db) db.end();
    }
}

/**
 * @typedef {BaseResult & {data: Student[]}} StudentResult
 */
/**
 * 모든 학생을 반환합니다.
 * @param {number} [page]
 * @returns {StudentResult}
 */
async function getAllStudents(page) {
    let db;
    try {
        db = await pool.getConnection();
        let result;

        if (!!page)
            result = await db.query(
                "SELECT * FROM student LIMIT 25 OFFSET ?;",
                [page * 25 + 1]
            );
        else result = await db.query("SELECT * FROM student;");

        return {
            success: true,
            data: result,
        };
    } catch (e) {
        console.error(e);
        return {
            success: false,
            error: e,
        };
    } finally {
        if (!!db) db.end();
    }
}

/**
 * id에 해당하는 학생을 반환합니다.
 * @param {number} id
 * @returns {StudentResult}
 */
async function getStudentById(id) {
    let db;
    try {
        db = await pool.getConnection();
        let result = await db.query("SELECT * FROM student WHERE id = ?;", [
            id,
        ]);
        return {
            success: true,
            data: result,
        };
    } catch (e) {
        console.error(e);
        return {
            success: false,
            error: e,
        };
    } finally {
        if (!!db) db.end();
    }
}

/**
 * 학생을 추가합니다.
 * @param {Student} student
 * @returns {BaseResult}
 */
async function addStudent(student) {
    let db;
    try {
        db = await pool.getConnection();

        // id 형식 체크
        if (!!!student.id.match(/S[0-9]{7}/g))
            throw new Error("id 형식이 올바르지 않음");

        let result = await db.execute(
            "INSERT INTO student VALUES(?, ?, ?, ?);",
            [student.id, student.grade, student.classNo, student.number]
        );
        return {
            success: true,
            data: result,
        };
    } catch (e) {
        console.error(e);
        return {
            success: false,
            error: e,
        };
    } finally {
        if (!!db) db.end();
    }
}

/**
 * 야자 일정 추가/변경
 * @param {Student} student
 * @param {WeekSchedule} schedule
 * @returns {BaseResult}
 */
async function updateSchedule(student, schedule) {
    let db;
    try {
        db = await pool.getConnection();
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
        return {
            success: true,
        };
    } catch (e) {
        console.error(e);
        return {
            success: false,
            error: e,
        };
    } finally {
        if (!!db) db.end();
    }
}

/**
 * DB에서 나온 값을 WeebSchedule로 변환합니다.
 * @param {Object} value
 * @returns {WeekSchedule}
 */
function rawValue2WeekSchedule(value) {
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

/**
 * @typedef {BaseResult & {data: WeekSchedule[]}} ScheduleResult
 */
/**
 * 일정 가져오기
 * @param {Student} student
 * @returns {ScheduleResult}
 */
async function getSchedule(student) {
    let db;
    try {
        db = await pool.getConnection();
        let result = await db.query("SELECT * FROM schedule WHERE id = ?;", [
            student.id,
        ]);
        return {
            success: true,
            data: result.map((e) => rawValue2WeekSchedule(e)),
        };
    } catch (e) {
        console.error(e);
        return {
            success: false,
            error: e,
        };
    } finally {
        if (!!db) db.end();
    }
}

/**
 * 모든 일정 가져오기
 * @param {number} [page]
 * @returns {ScheduleResult}
 */
async function getAllSchedules(page) {
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
        return {
            success: true,
            data: result.map((e) => rawValue2WeekSchedule(e)),
        };
    } catch (e) {
        console.error(e);
        return {
            success: false,
            error: e,
        };
    } finally {
        if (!!db) db.end();
    }
}

/**
 * 출석처리
 * @param {Student} student
 * @param {PERIOD} period
 * @returns {BaseResult}
 */
async function registerAttendace(student, period) {
    let db;
    try {
        db = await pool.getConnection();
        await db.execute(
            "INSERT INTO attendanceInfo (id, attendanceTime, period) VALUES(?, CURRENT_TIMESTAMP(), ?);",
            [student.id, period]
        );
        return {
            success: true,
        };
    } catch (e) {
        console.error(e);
        return {
            success: false,
            error: e,
        };
    } finally {
        if (!!db) db.end();
    }
}

/**
 * @typedef {BaseResult & {data: attendanceInfo[]}} attendanceInfoResult
 */

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
 * @returns {attendanceInfoResult}
 */
async function getAttendaceInfo(options) {
    let db;
    try {
        db = await pool.getConnection();

        let dateStart = "";
        let dateEnd = "";
        if (!!!options) {
            let result = await db.query("SELECT * FROM attendanceInfo;");
            return {
                success: true,
                data: result,
            };
        } else if (!!options.date) {
            dateStart = `${options.date.getFullYear()}-${
                options.date.getMonth() + 1
            }-${options.date.getDate()} 00:00:00`;
            dateEnd = `${options.date.getFullYear()}-${
                options.date.getMonth() + 1
            }-${options.date.getDate()} 23:59:59`;
        } else if (!!options.startDate && !!options.endDate) {
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
                !!options.student ? 1 : 0,
                options.student?.id,
                !!options.date || (!!options.startDate && !!options.endDate)
                    ? 1
                    : 0,
                dateStart,
                dateEnd,
            ]
        );
        return {
            success: true,
            data: result,
        };
    } catch (e) {
        console.error(e);
        return {
            success: false,
            error: e,
        };
    } finally {
        if (!!db) db.end();
    }
}

module.exports = {
    resetDB,
    initTable,
    getAllStudents,
    getStudentById,
    addStudent,
    updateSchedule,
    getSchedule,
    getAllSchedules,
    registerAttendace,
    getAttendaceInfo,
    addUser,
    getUserById,
    getUserByUsername,
    getUsers,
    ROLE,
    PERIOD,
};
