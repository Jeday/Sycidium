


function main(expressWS){
  let express = require('express');
  let router = express.Router();
  expressWS.applyTo(router);

  router.ws('/ws',function(ws, req) {
    console.log(req);
    ws.session_id = null
    ws.on('message', function(msg) {
      if(!ws.session_id){
        //TODO: cross reference id with DB
        session_id = Number(msg);
      }
      console.log(msg);
      ws.send("pong");
    });
    ws.on('close', function(code,reason){
      cosole.log("Client left:"+code+" "+reason);
    });
    setTimeout(function(){
      if(ws.session_id = null)
       ws.close();
    },4000);
    console.log('socket', req.testing);
  });


  expressWS.app.use(router);
}

module.exports = main;
