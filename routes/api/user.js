var express = require("express");
var router = express.Router();
const auth = require("../../auth/auth");
const argon2 = require("argon2");
const dbManager = require("../../db/nightStudyManager");

router.post("/login", async function (req, res, next) {
    let body = req.body;
    let data = await dbManager.getUserByUsername(body.username);
    if (!data.success) {
        res.status(500);
        res.json({
            success: false,
            message: "예기치 않은 오류가 발생하였습니다.",
            error: req.app.get("env") == "development" ? data.error : undefined,
        });
    } else if (!!!body?.password || !!!body?.username) {
        res.status(400);
        res.json({
            success: false,
            message: "올바르지 않은 요청입니다.",
        });
    } else if (
        !!data.data[0]?.password &&
        (await argon2.verify(data.data[0].password, body.password))
    ) {
        let token = auth.getToken(data.data[0]);

        res.cookie("token", token.accessToken, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000, // 1시간
        });
        res.cookie("refresh-token", token.refreshToken, {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7 * 1000, // 7일
        });

        res.json({
            success: true,
            data: {
                accessToken: token.accessToken,
                refreshToken: token.refreshToken,
            },
        });
    } else {
        res.status(401);
        res.json({
            success: false,
            message: "아아디 혹은 비밀번호가 일치하지 않습니다.",
        });
    }
});

router.post("/register", async function (req, res, next) {
    let body = req.body;

    let username = body.username;
    let password = body.password;
    let email = body.email;
    let studentID = body.studentID;

    // 비번 조건 불일치 - 굳이?
    // 애들 찡찡대는거 조치할빠엔 그냥 털리라고 하지 뭐
    // if (
    //     !!!password.match(/[0-9]/g) &&
    //     !!!password.match(/[A-z]/g) &&
    //     !!!password.match(/\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\" /g) &&
    //     password.length <= 8
    // ) {
    //     res.status(400);
    //     res.json({
    //         success: false,
    //         message:
    //             "비밀번호는 숫자, 특수문자, 영어를 포함하여 8지라 이상이여야 합니다.",
    //     });
    //     return;
    // }

    // 학생증 ID 조건 불일치
    if (!!!studentID.match(/S[0-9]{7}/g)) {
        res.status(400);
        res.json({
            success: false,
            message: "학생증 번호는 'S(숫자 7자리)' 형식이여야합니다.",
        });
        return;
    }

    // 사용자 ID 조건 불일치
    if (username.length > 32) {
        res.status(400);
        res.json({
            success: false,
            message: "사용자 ID는 최대 32자를 넘길 수 없습니다.",
        });
        return;
    }

    let result = await dbManager.addUser({
        id: studentID,
        username,
        email,
        password,
    });

    if (result.success) {
        res.json({
            success: true,
        });
    } else {
        res.status(500);
        if (result.error.errno == 1062) {
            res.json({
                success: false,
                message: "이미 해당 정보를 사용하는 사용자가 존재합니다.",
                error:
                    req.app.get("env") == "development"
                        ? result.error
                        : undefined,
            });
        } else {
            res.json({
                success: false,
                message: "예기치 않은 오류가 발생하였습니다.",
                error:
                    req.app.get("env") == "development"
                        ? result.error
                        : undefined,
            });
        }
    }
});

router.post("/refresh", async (req, res, next) => {
    let body = req.body;
    let refreshToken = req.headers.authorization;

    let data = await dbManager.getUserById(req.id);
    let regen = auth.regenAccessToken(refreshToken, data.data[0]);

    if (!regen.success) {
        res.status(403);
        res.json({
            success: false,
            message: "세션이 만료되었습니다. 다시 로그인해주세요.",
        });
        return;
    }

    res.setHeader("Authorization", `Bearer ${regen.accessToken}`);
    res.json({
        success: false,
        data: {
            accessToken: token.accessToken,
        },
    });
});

module.exports = router;
