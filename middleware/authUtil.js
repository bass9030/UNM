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
            return;
        }

        // decode
        let user = await auth.verifyAccessToken(token);
        if (!user.success) {
            res.status(403);
            return;
        }
        req.jwt = user.data;
        next();
    },
};

module.exports = authUtil;
