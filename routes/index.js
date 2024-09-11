var express = require('express');
var router = express.Router();
const manager = require('../db/unmManager.js');

/* GET home page. */
router.get('/', async function(req, res, next) {
  res.render('index', { title: 'Express' });
  manager.getStudentById('S200132')
});

module.exports = router;
