const pool = require('./dbConnector.js');

/* ====== typedefs ====== */
/**
 * @typedef {Object} BaseResult
 * @property {boolean} success 성공여부
 * @property {Object} [error] (에러 발생시) 에러 내용
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
 * @property {number} classNo
 * @property {DaySchedule} monSchedule
 * @property {DaySchedule} tueSchedule
 * @property {DaySchedule} thuSchedule
 * @property {DaySchedule} friSchedule
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
 * @property {Date} attendaceTime 출석 시간
 * @property {PERIOD} period 교시(오자, 야자1, 야자2)
 */

/* ======================= */

const PERIOD = {
    A1: 'A1',
    N1: 'N1',
    N2: 'N2'
};

/**
 * DB Table 초기설정
 */
async function initTable() {
    let db;
    try {
        db = await pool.getConnection();
        await db.execute('CREATE TABLE IF NOT EXISTS students (id CHAR(8) UNIQUE PRIMARY KEY NOT NULL,' +
            'grade TINYINT(3) NOT NULL,' +
            'classNo TINYINT(9) NOT NULL,' +
            'number TINYINT NOT NULL);');
        await db.execute('CREATE TABLE IF NOT EXISTS schedule (id CHAR(8) UNIQUE PRIMARY KEY NOT NULL,' +
            'classNo TINYINT(9) NOT NULL,' +
            'monA1 BOOLEAN NOT NULL DEFAULT 0, monN1 BOOLEAN NOT NULL DEFAULT 0, monN2 BOOLEAN NOT NULL DEFAULT 0, ' +
            'tueA1 BOOLEAN NOT NULL DEFAULT 0, tueN1 BOOLEAN NOT NULL DEFAULT 0, tueN2 BOOLEAN NOT NULL DEFAULT 0,' +
            'thuA1 BOOLEAN NOT NULL DEFAULT 0, thuN1 BOOLEAN NOT NULL DEFAULT 0, thuN2 BOOLEAN NOT NULL DEFAULT 0,' +
            'friA1 BOOLEAN NOT NULL DEFAULT 0, friN1 BOOLEAN NOT NULL DEFAULT 0, friN2 BOOLEAN NOT NULL DEFAULT 0,' +
            'FOREIGN KEY(id) REFERENCES students(id));');
        await db.execute('CREATE TABLE IF NOT EXISTS attendanceInfo (_id BIGINT AUTO_INCREMENT PRIMARY KEY,' +
            'id CHAR(8) UNIQUE NOT NULL,' +
            'attendaceTime TIMESTAMP NOT NULL,' +
            'period CHAR(2) NOT NULL,' +
            'FOREIGN KEY(id) REFERENCES students(id));');
        return {
            success: true,
        };
    }catch(e){
        console.error(e)
        return {
            success: false,
            error: e
        };
    }finally{
        if(!!db) db.end();
    }
}

/**
 * @typedef {BaseResult & {data: Student[]}} StudentResults
 */
/**
 * 모든 학생을 반환합니다.
 * @param {number} [page]
 * @returns {StudentResults}
 */
async function getAllStudents(page) {
    let db;
    try {
        db = await pool.getConnection();
        let result;
        
        if(!!page) 
            result = await db.query('SELECT * FROM students LIMIT 25 OFFSET ?;', [page * 25 + 1]);
        else
            result = await db.query('SELECT * FROM students;');

        return {
            success: true,
            data: result,
        };
    }catch(e){
        console.error(e)
        return {
            success: false,
            error: e
        };
    }finally{
        if(!!db) db.end();
    }
}


/**
 * id에 해당하는 학생을 반환합니다.
 * @param {number} id 
 * @returns {StudentResults}
 */
async function getStudentById(id) {
    let db;
    try {
        db = await pool.getConnection();
        let result = await db.query('SELECT * FROM students WHERE id = ?;', [id]);
        return {
            success: true,
            data: result,
        };
    }catch(e){
        console.error(e)
        return {
            success: false,
            error: e
        };
    }finally{
        if(!!db) db.end();
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
        if(!!!student.id.match(/S[0-9]{7}/g)) 
            throw new Error('id 형식이 올바르지 않음');

        let result = await db.execute('INSERT INTO students VALUES(?, ?, ?, ?);',
            [student.id, student.grade, student.classNo, student.number]);
        return {
            success: true,
            data: result,
        };
    }catch(e){
        console.error(e)
        return {
            success: false,
            error: e
        };
    }finally{
        if(!!db) db.end();
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
        let result = await db.execute('INSERT INTO schedule VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)' +
            'OR DUPLICATE KEY UPDATE id = ?,' +
            'monA1 = ?, monN1 = ?, monN2 = ?,' +
            'tueA1 = ?, tueN1 = ?, tueN2 = ?,' +
            'thuA1 = ?, thuN1 = ?, thuN2 = ?,' +
            'friA1 = ?, friN1 = ?, friN2 = ?,',
            [
                student.id, schedule.classNo, 
                schedule.monSchedule.A1, schedule.monSchedule.N1, schedule.monSchedule.N2,
                schedule.tueSchedule.A1, schedule.tueSchedule.N1, schedule.tueSchedule.N2,
                schedule.thuSchedule.A1, schedule.thuSchedule.N1, schedule.thuSchedule.N2,
                schedule.friSchedule.A1, schedule.friSchedule.N1, schedule.friSchedule.N2,
            ]);
        return {
            success: true,
        };
    }catch(e){
        console.error(e)
        return {
            success: false,
            error: e
        };
    }finally{
        if(!!db) db.end();
    }
}

/** 
 * @typedef {BaseResult & {data: WeekSchedule[]}} ScheduleResults
 */
/**
 * 일정 가져오기
 * @param {Student} student 
 * @returns {ScheduleResults}
 */
async function getSchedule(student) {
    let db;
    try {
        db = await pool.getConnection();
        let result = await db.execute('INSERT INTO students VALUES(?, ?, ?, ?);',
            [student.id, student.grade, student.classNo, student.number]);
        return {
            success: true,
            data: result,
        };
    }catch(e){
        console.error(e)
        return {
            success: false,
            error: e
        };
    }finally{
        if(!!db) db.end();
    }
}


/**
 * 일정 가져오기
 * @param {number} page 
 * @returns {ScheduleResults}
 */
async function getAllSchedules(page) {
    let db;
    try {
        db = await pool.getConnection();
        let result;
        if(!!page)
            result = await db.execute('SELECT * FROM schedules LIMIT 25 OFFSET ?;',
                [page * 25 + 1]);
        else 
            result = await db.execute('SELECT * FROM schedules;');
        return {
            success: true,
            data: result,
        };
    }catch(e){
        console.error(e)
        return {
            success: false,
            error: e
        };
    }finally{
        if(!!db) db.end();
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
        await db.execute('INSERT INTO attendanceInfo (id, timestamp, period) VALUES(?, ?, ?);',
            [student.id, new Date().getTime(), period]);
        return {
            success: true,
        };
    }catch(e){
        console.error(e)
        return {
            success: false,
            error: e
        };
    }finally{
        if(!!db) db.end();
    }
}


/**
 * @typedef {BaseResult & {data: attendanceInfo[]}} attendaceInfoResults
 */

/**
 * 야자 출석 정보 불러오기 옵션
 * @typedef {Object} attendaceInfoQueryOptions
 * @property {Student} student 특정 학생의 야자 출석 정보를 불러옵니다.
 * @property {Date} date 특정 날짜의 야자 출석 정보를 불러옵니다.
 * @property {Date} startDate 특정 날짜범위의 야자 출석 정보를 불러옵니다. 날짜범위의 시작점입니다.
 * @property {Date} endDate 특정 날짜범위의 야자 출석 정보를 불러옵니다. 날짜범위의 종료점입니다.
 */

/**
 * 야자 출석 정보를 반환합니다.
 * @param {attendaceInfoQueryOptions} options 불러오기 옵션
 * @returns {attendaceInfoResults}
 */
async function getAttendaceInfo(options) {
    let db;
    try {
        db = await pool.getConnection();

        let dateStart;
        let dateEnd;

        if(!!options.date) {
            dateStart = `${options.date.getFullYear()}-${options.date.getMonth() + 1}-${options.date.getDate()} 00:00:00`;
            dateEnd = `${options.date.getFullYear()}-${options.date.getMonth() + 1}-${options.date.getDate()} 23:59:59`;
        }else if(!!options.startDate && !!options.endDate) {
            dateStart = `${options.startDate.getFullYear()}-${options.startDate.getMonth() + 1}-${options.startDate.getDate()} 00:00:00`;
            dateStart = `${options.endDate.getFullYear()}-${options.endDate.getMonth() + 1}-${options.endDate.getDate()} 23:59:59`;
        }

        let result = await db.execute('SELECT * FROM attendaceInfo WHERE (0 = ? OR id = ?)' +
            'AND (0 = ? OR attendaceTime BETWEEN ? AND ?);', [
                !!options.student ? 1 : 0, options.id,
                (!!options.date || (!!options.startDate && !!options.endDate)) ? 1 : 0, dateStart, dateEnd
            ]);
        return {
            success: true,
            data: result,
        };
    }catch(e){
        console.error(e)
        return {
            success: false,
            error: e
        };
    }finally{
        if(!!db) db.end();
    }
}

module.exports = {
    initTable,
    getAllStudents,
    getStudentById,
    addStudent,
    updateSchedule,
    getSchedule,
    getAllSchedules,
    registerAttendace
}
