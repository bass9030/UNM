var express = require('express');
var router = express.Router();
const manager = require('../../db/unmManager.js');

/* GET home page. */
router.get('/', async function(req, res, next) {
  await manager.init
});

module.exports = router;
