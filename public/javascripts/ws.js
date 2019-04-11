
var state_of_session = "none";
var session_id;
(function get_session_id(){
  let recv_id = document.querySelector("main").attributes["session-id"].value;
  let saved_id = Cookies.get('session_id');
  //if(saved_id){
  //  Cookies.set('session_id', saved_id, { expires: 1});
//     session_id = saved_id;
//    state_of_session = "continue";
//  }
//  else{
    Cookies.set('session_id', recv_id, { expires: 1});
    session_id = recv_id;
    state_of_session = "login"
//  }
  if(!session_id)
    Error("invalid session id  - "+session_id);
})();

function message_factory(payload,type){
  let cargo_name  = "none";
  if(type == "payload" || type == "error")
    cargo_name = type;
  let res =   {
    "session_id":session_id,
    "type":type,
  }
  res[cargo_name] = payload;
  return JSON.stringify(res);
}

// init websocket connection and event listeners
var socket = new WebSocket("ws://" + location.host + "/ws");


socket.addEventListener('open', function(ev){
  console.log("connection open")
  socket.send(message_factory({},state_of_session));
});
socket.addEventListener('message', function(ws,ev){
  console.log(ws.data)
});
socket.addEventListener('close', function(ws,ev){
  console.log("connection closed");
});
