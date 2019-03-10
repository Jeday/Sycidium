// module for poll view and slave pages

var express = require('express');
var router = express.Router();

/* GET home page. */


router.get('/poll', function(req, res, next) {
  res.render('view');
});

router.get('/get_polled', function(req, res, next) {
  res.render('slave');
});


module.exports = router;
