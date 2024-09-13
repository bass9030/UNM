var express = require('express');
var router = express.Router();
const manager = require('../../db/nightStudyManager.js');

/* GET home page. */
router.get('/', async function(req, res, next) {
    if((await manager.initTable()).success) {
        res.json({
            success: true
        })
    }else{
        res.json({
            success: false
        });
    }
  
});

module.exports = router;
