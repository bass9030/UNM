const jwt = require("jsonwebtoken");
const JWT_ACCESS_CONFIG = {
    expiresIn: "1h",
    algorithm: "HS256",
};
const JWT_REFRESH_CONFIG = {
    expiresIn: "7d",
    algorithm: "HS256",
};

/* ====== typedef ====== */

/**
 * @typedef {Object} Token
 * @property {string} accessToken
 * @property {string} refreshToken
 */

/* ===================== */

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
    try {
        let data = jwt.verify(
            accessToken,
            process.env.JWT_TOKEN,
            JWT_ACCESS_CONFIG
        );
        return {
            success: true,
            data,
        };
    } catch (e) {
        return {
            success: false,
        };
    }
}

/**
 * refresh token 검증
 * @param {string} refreshToken
 */
function verifyRefreshToken(refreshToken) {
    try {
        let data = jwt.verify(
            refreshToken,
            process.env.JWT_TOKEN,
            JWT_REFRESH_CONFIG
        );
        return {
            success: true,
            data,
        };
    } catch {
        return {
            success: false,
        };
    }
}

/**
 * access token 갱신
 * @param {string} refreshToken
 * @param {import("../db/nightStudyManager").User} user
 */
function regenAccessToken(refreshToken, user) {
    let data = verifyAccessToken(refreshToken);
    if (!data.success)
        return {
            success: false,
        };

    try {
        let accessToken = jwt.sign(
            {
                id: user.id,
                role: user.role,
            },
            process.env.JWT_TOKEN,
            JWT_CONFIG
        );
        return {
            success: true,
            accessToken,
        };
    } catch {
        return {
            success: false,
        };
    }
}

module.exports = {
    getToken,
    verifyAccessToken,
    verifyRefreshToken,
    regenAccessToken,
};
