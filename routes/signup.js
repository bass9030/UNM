var express = require("express");
var router = express.Router();
// const manager = require("../db/nightStudyManager.js");

/* GET home page. */
router.get("/", async function (req, res, next) {
    res.render("signup");
});

module.exports = router;
