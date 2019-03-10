var session_id = document.querySelector("main").attributes["session-id"];
if(!session_id)
  Error("invalid session id  - "+session_id);

var socket = new WebSocket("ws://" + location.host + "/whatever");
