// module for poll view and slave pages

var express = require('express');
var db = require('../database.js');
var router = express.Router();

/* GET home page. */


// route for view page
router.get('/:shortlink', function(req, res, next) {
  let link = db.short_links[req.params.shortlink];
  if(!link)
      next();
  else if(link.type == "view")
    res.render('view',{
      session_id:link.session.generate_new_id_view(),
      slave_shortlink:link.session.slave_link,
      view_shortlink:link.session.view_link,
      session_type:link.type
    });
  else if(link.type == "slave")
    res.render('slave',{
      session_id:link.session.generate_new_id_slave(),
      slave_shortlink:link.session.slave_link,
      session_type:link.type,
      view_shortlink:"null" // no need for slave to know master's bindings
    });
  else
    next();
});

router.get('/index', function(req, res, next) {
  res.render('index');
});

router.get("/get_polled",function(req, res, next){
    //console.log("in router");
    let id = db.create_polling_session({
      title: "poll",
      options: [
        { title: "option1" },
        { title: "option2" },
        { title: "option3" }
      ],
    });
  //  console.log(id);
    res.status(200).json({link:db.polling_sessions[id].view_link});

});



// route for websocket update
router.ws('/ws/:shortlink',function(ws,req){
  //console.log(db.short_links);
  let link = db.short_links[req.params.shortlink];
  if(!link)
      next();
  let id_type = link.type;
  let poll_session = link.session;
  let got_id = false;
  // this callback fires once and passes websocket object to model
  ws.on('message', function(data){
    // session id is expected to come from client
    got_id = true;
    data = JSON.parse(data);
    if(!poll_session.verify_update(data.session_id,id_type,ws))
      ws.close();
  });
  //if no messages comes websocket connection is terminated after 4 seconds
  setTimeout(function(){
    if(!got_id)
      ws.close();
  },4000);

});

module.exports = router;
