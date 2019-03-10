var session_id = document.querySelector("main").attributes["session-id"];
if(!session_id)
  Error("invalid session id  - "+session_id);

// init websocket connection and
var socket = new WebSocket("ws://" + location.host + "/ws");
socket.onopen(function(ev){
  console.log("connection open")
  socket.send(session_id);
  console.log(session_id);
  socket.send("ping");
});
socket.onmessage(function(ws,ev){
  console.log(ws.message);
});
