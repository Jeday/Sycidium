// module for poll view and slave pages

var express = require('express');
var router = express.Router();

/* GET home page. */


router.get('/poll', function(req, res, next) {
  res.render('view',{session_id : Math.floor(Math.random()*10000)}); // TODO:fix to DB and make id bigass bitch
});

router.get('/get_polled', function(req, res, next) {
  res.render('slave');
});



router.ws('/ws',function(ws,res){
  console.log("new ws connection");
  ws.session_id = null;
  ws.on('message', function(data){
    data = JSON.parse(data);
    //TODO: cross refernce id with DB
    //TODO: continue to check session_id in data to match with referenced in DB
    //session_id defines who messages over WS
    if(ws.session_id ==null){
      session_id = data.session_id;
    }

  });

});

module.exports = router;
