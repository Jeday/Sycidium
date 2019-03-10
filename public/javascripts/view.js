
(function get_session_id(){
  let recv_id = document.querySelector("main").attributes["session-id"];
  let saved_id = Cookies.get('session_id');
  if(saved_id){
    Cookies.set('session_id', saved_id, { expires: 1});
    var session_id = saved_id;
  }
  else{
    Cookies.set('session_id', recv_id, { expires: 1});
    var session_id = recv_id;
  }
  if(!session_id)
    Error("invalid session id  - "+session_id);
})();

function message_factory(payload){
  return JSON.stringify({
    "session_id":session_id,
    "data":payload,
  });

}
// init websocket connection and event listeners
var socket = new WebSocket("ws://" + location.host + "/ws");

socket.addEventListener('open', function(ev){
  console.log("connection open")
  socket.send(message_factory(""));
});
socket.addEventListener('message', function(ws,ev){
  console.log(ws.message);
});
socket.addEventListener('close', function(ws,ev){
  console.log("connection closed");
});
