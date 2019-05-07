
var state_of_session = "none";
var session_id;
var session_type;
var own_shortlink;
var slave_shortlink;
var view_shortlink;
(function get_session_id(){
  let main_node =  document.querySelector("main");
  let recv_id = main_node.attributes["session-id"].value;
  session_type = main_node.attributes["type"].value;
  slave_shortlink =  main_node.attributes["slave-shortlink"].value;
  view_shortlink = main_node.attributes["view-shortlink"].value;
  switch (session_type) {
    default:
    case "slave":
      own_shortlink = main_node.attributes["slave-shortlink"].value;
      break;
    case "view":
      own_shortlink = main_node.attributes["view-shortlink"].value;
      break;
  }
  let saved_id = Cookies.get(own_shortlink);
  if(saved_id){
    Cookies.set(own_shortlink, saved_id, { expires: 1});
     session_id = saved_id;
    state_of_session = "continue";
  }
  else{
    Cookies.set(own_shortlink, recv_id, { expires: 1});
    session_id = recv_id;
    state_of_session = "login"
}
  if(!session_id)
    Error("invalid session id  - "+session_id);
})();

function message_factory(payload,type){
  let cargo_name  = "none";
  switch (type) {
    case "error":
      cargo_name = "error";
      break;
    default:
    case "payload":
      cargo_name = "payload";
      break;
  }
  let res =   {
    "session_id":session_id,
    "type":type,
  }
  res[cargo_name] = payload;
  return JSON.stringify(res);
}

// init websocket connection and event listeners
var socket = new WebSocket("ws://" + location.host + "/ws/"+own_shortlink);
socket.__send = socket.send;
socket.send = function(data){
  console.log(data);
  socket.__send(data);
}

socket.addEventListener('open', function(ev){
  console.log("connection open to "+socket.url)
  socket.send(message_factory({},state_of_session));
});
socket.addEventListener('message', function(ws,ev){
  console.log(ws.data)
});
socket.addEventListener('close', function(ws,ev){
  console.log("connection closed:");
});
