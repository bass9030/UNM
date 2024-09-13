require('dotenv').config();
const dbManager = require('../db/nightStudyManager');

/**
 * @type {import('../db/nightStudyManager').Student[]}
 */
const students = [];

// init test data
for(let i = 1; i <= 10; i++) {
    students.push({
        id: 'S10000' + String(i).padStart(2, '0'),
        grade: 2,
        classNo: 1,
        number: i
    });
}

/**
 * @type {import('../db/nightStudyManager').WeekSchedule}
 */
let schedule1 = {
    classNo: 2,
    posX: 1,
    posY: 1,
    monSchedule: {
        A1: true,
        N1: true,
        N2: true
    },
    tueSchedule: {
        A1: true,
        N1: true,
        N2: true
    },
    thuSchedule: {
        A1: true,
        N1: true,
        N2: true
    },
    friSchedule: {
        A1: true,
        N1: true,
        N2: false
    },
}

/**
 * @type {import('../db/nightStudyManager').WeekSchedule}
 */
let schedule2 = {
    classNo: 2,
    posX: 1,
    posY: 5,
    monSchedule: {
        A1: true,
        N1: true,
        N2: true
    },
    tueSchedule: {
        A1: false,
        N1: true,
        N2: true
    },
    thuSchedule: {
        A1: true,
        N1: true,
        N2: true
    },
    friSchedule: {
        A1: false,
        N1: false,
        N2: false
    },
}


const randomStudent = students[Math.floor(Math.random() * 10)];

test('db 초기화', async () => {
    let result = await dbManager.resetDB();
    expect(result).toEqual({success: true});
});

test('db table 생성', async () => {
    let result = await dbManager.initTable();
    expect(result).toEqual({success: true});
})

test('학생 추가', async () => {
    let success = true;
    for(let i = 0; i < students.length; i++) {
        let result = await dbManager.addStudent(students[i]);
        success = (success) ? true == result.success : false;
    }

    expect(success).toEqual(true);
})

test('학생 확인 - 모든 학생', async () => {
    let result = await dbManager.getAllStudents();    
    let match = 0;
    for(let i = 0; i < result.data.length; i++) {
        if(result.data[i].id == students[i].id)
            match++;
    }

    expect(match).toBe(students.length);
});

test('학생 확인 - 특정 학생', async () => {
    let result = await dbManager.getStudentById(randomStudent.id);
    expect(result.data[0].id).toEqual(randomStudent.id);
})

test('학생 야자 시간표 추가', async () => {
    let result = await dbManager.updateSchedule(randomStudent, schedule1);
    
    expect(result).toEqual({success: true});
})

test('학생 야자 시간표 변경', async () => {
    
    let result = await dbManager.updateSchedule(randomStudent, schedule2);
    
    expect(result).toEqual({success: true});
})

test('학생 야자 시간표 불러오기', async () => {
    let result = await dbManager.getSchedule(randomStudent);

    expect(result).toEqual({
        success: true,
        data: [schedule2]
    });
})

test('모든 학생 야자 시간표 불러오기', async () => {
    let result = await dbManager.getAllSchedules();
    expect(result).toEqual({
        success: true,
        data: [schedule2]
});
})

test('야자 출석', async () => {
    let result = await dbManager.registerAttendace(randomStudent, 'A1');

    expect(result).toEqual({success: true});
})

test('야자 출석 현황 확인 - 모든 학생', async () => {
    /**
     * @type {import('../db/nightStudyManager').attendanceInfoQueryOptions}
     */
    let result = await dbManager.getAttendaceInfo()

    expect(result.data).not.toHaveLength(0);
})

test('야자 출석 현황 확인 - 특정 학생', async () => {
    /**
     * @type {import('../db/nightStudyManager').attendanceInfoQueryOptions}
     */
    let options = {
        student: randomStudent
    }
    let result = await dbManager.getAttendaceInfo(options)

    expect(result.data).not.toHaveLength(0);
})

test('야자 출석 현황 확인 - 특정 날짜', async () => {
    /**
     * @type {import('../db/nightStudyManager').attendanceInfoQueryOptions}
     */
    let options = {
        date: new Date()
    }
    let result = await dbManager.getAttendaceInfo(options)

    expect(result.data).not.toHaveLength(0);
})

test('야자 출석 현황 확인 - 특정 기간', async () => {
/**
     * @type {import('../db/nightStudyManager').attendanceInfoQueryOptions}
     */
    let options = {
        startDate: new Date(new Date().getTime() - (7 * 86400)),
        endDate: new Date(),
    }
    let result = await dbManager.getAttendaceInfo(options)

    expect(result.data).not.toHaveLength(0);
})

test('야자 출석 현황 확인 - 특정 학생의 특정 날짜', async () => {
    /**
     * @type {import('../db/nightStudyManager').attendanceInfoQueryOptions}
     */
    let options = {
        student: randomStudent,
        date: new Date()
    }
    let result = await dbManager.getAttendaceInfo(options)

    expect(result.data).not.toHaveLength(0);
})

test('야자 출석 현황 확인 - 특정 학생의 특정 기간', async () => {
    /**
     * @type {import('../db/nightStudyManager').attendanceInfoQueryOptions}
     */
    let options = {
        student: randomStudent,
        startDate: new Date(),
        endDate: new Date()
    }
    let result = await dbManager.getAttendaceInfo(options)

    expect(result.data).not.toHaveLength(0);
})

