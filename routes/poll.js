// module for poll view and slave pages

var express = require('express');
var router = express.Router();

/* GET home page. */


router.get('/poll', function(req, res, next) {
  res.render('view',{session_id : Math.floor(Math.random()*10000)}); // fix to DB
});

router.get('/get_polled', function(req, res, next) {
  res.render('slave');
});


module.exports = router;
