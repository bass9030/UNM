const jwt = require("jsonwebtoken");
const JWT_ACCESS_CONFIG = {
    expiresIn: "1h",
    algorithm: "HS256",
};
const JWT_REFRESH_CONFIG = {
    expiresIn: "7d",
    algorithm: "HS256",
};

const pool = require("./authDBConnector");

/* ====== typedef ====== */

/**
 * @typedef {Object} Token
 * @property {string} accessToken
 * @property {string} refreshToken
 */

/* ===================== */

async function initTable() {
    let db;
    try {
        db = await pool.getConnection();
        await db.execute(
            "CREATE TABLE IF NOT EXISTS blacklist (accessToken TEXT, refreshToken TEXT);"
        );
    } finally {
        if (!!db) db.end();
    }
}

/**
 * @param {import("../db/nightStudyManager").User} user
 * @returns {Token}
 */
function getToken(user) {
    let accessToken = jwt.sign(
        {
            id: user.id,
            role: user.role,
        },
        process.env.JWT_TOKEN,
        JWT_ACCESS_CONFIG
    );

    let refreshToken = jwt.sign(
        {
            id: user.id,
        },
        process.env.JWT_TOKEN,
        JWT_REFRESH_CONFIG
    );

    return {
        accessToken,
        refreshToken,
    };
}

/**
 * access token 검증
 * @param {string} accessToken
 */
function verifyAccessToken(accessToken) {
    let data = jwt.verify(
        accessToken,
        process.env.JWT_TOKEN,
        JWT_ACCESS_CONFIG
    );
    return data;
}

/**
 * refresh token 검증
 * @param {string} refreshToken
 */
function verifyRefreshToken(refreshToken) {
    let data = jwt.verify(
        refreshToken,
        process.env.JWT_TOKEN,
        JWT_REFRESH_CONFIG
    );
    return data;
}

/**
 * access token 갱신
 * @param {string} refreshToken
 * @param {import("../db/nightStudyManager").User} user
 */
function regenAccessToken(refreshToken, user) {
    verifyRefreshToken(refreshToken);
    let accessToken = jwt.sign(
        {
            id: user.id,
            role: user.role,
        },
        process.env.JWT_TOKEN,
        JWT_CONFIG
    );
    return accessToken;
}

/**
 *
 * @param {Token} token
 */
async function destoryToken(token) {
    let db;
    try {
        db = await pool.getConnection();
        await db.execute("INSERT INTO blacklist VALUES(?, ?);", [
            token.accessToken,
            token.refreshToken,
        ]);
    } finally {
        if (!!db) db.end();
    }
}

/**
 *
 * @param {Token} token
 * @returns {boolean}
 */
async function isTokenBlacklist(token) {
    let db;
    try {
        db = await pool.getConnection();
        let result = await db.query(
            "SELECT * FROM blacklist WHERE accessToken = ? OR refreshToken = ?;",
            [token.accessToken, token.refreshToken]
        );
        return !!!result.length;
    } catch {
        return true;
    } finally {
        if (!!db) db.end();
    }
}

module.exports = {
    initTable,
    getToken,
    verifyAccessToken,
    verifyRefreshToken,
    regenAccessToken,
    destoryToken,
    isTokenBlacklist,
};
