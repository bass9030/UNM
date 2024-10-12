const auth = require("../auth/auth");

const authUtil = {
    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     */
    checkToken: async (req, res, next) => {
        let token = req.cookies.token;
        console.log(req.cookies);

        // 토큰 없음
        if (!!!token) {
            res.status(403);
            return res.json({
                success: false,
                message: "허용되지 않은 접근입니다.",
            });
        }

        // decode
        let user = await auth.verifyAccessToken(token);
        if (!user.success) {
            res.status(403);
            return res.json({
                success: false,
                message: "만료되었거나 올바르지 않은 토큰입니다.",
            });
        }
        req.jwt = user.data;
        next();
    },
};

module.exports = authUtil;
