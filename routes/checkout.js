var express = require("express");
var router = express.Router();
var createError = require("http-errors");

/* GET home page. */
router.get("/", async function (req, res, next) {
    console.log(req.jwt);
    if (req.jwt.role !== 2) {
        res.status(403);
        return res.json({
            success: false,
            message: "만료되었거나 올바르지 않은 토큰입니다.",
        });
    }
    res.render("checkout");
});

module.exports = router;
