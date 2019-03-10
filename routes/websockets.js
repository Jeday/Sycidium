

// setups WS endpoints
function main(expressWS){
  let express = require('express');
  let router = express.Router();
  expressWS.applyTo(router);

  router.ws('/*',function(ws, req) {
    console.log("new ws connection");
    ws.on('message', function(msg) {
      ws.send(msg);
    });

  });


  expressWS.app.use(router);
}

module.exports = main;
