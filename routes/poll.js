// module for poll view and slave pages

var express = require('express');
var db = require('../database.js');
var router = express.Router();

/* GET home page. */


// route for view page
router.get('/poll', function(req, res, next) {
  res.render('view',{session_id:db.generate_new_id_view()});
});

// route for slave page
router.get('/get_polled', function(req, res, next) {
  res.render('slave',{session_id:db.generate_new_id_slave()});
});



// route for websocket update
router.ws('/ws',function(ws,res){
  console.log("new ws connection");
  ws.session_id = null;
  ws.type = null;
  var got_id = false;
  // this callback fires once and passes websocket object to model
  ws.on('message', function(data){
    // session id is expected to come from client
    got_id = true;
    data = JSON.parse(data);

    switch (db.get_id_type(data.session_id)) {
      case "slave":
        db.update_slave(data.session_id,ws);
        break;
      case "view":
        db.update_view(data.session_id,ws);
        break;
      default:
        
        ws.close();
    }
  });
  //if no messages comes websocket connection is terminated after 4 seconds
  setTimeout(function(){
    if(!got_id)
      ws.close();
  },4000);

});

module.exports = router;
