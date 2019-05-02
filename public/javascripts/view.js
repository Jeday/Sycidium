socket.addEventListener('message', function(ws,ev){
    var data =  JSON.parse(ws.data);
    switch (data.type) {
      case "new_state":
        state_handler(data.state);
        break;
      case "payload":
        payload_handler(data.payload)
      case "error":
      default:
          error_handler(data);
      break;
    }
});



function payload_handler(payload){
    var poll = document.getElementsByClassName("poll-contanier")[0];
    for (var i = 0; i < poll.children.length; i++) {
     let bar = poll.children[i].getElementsByClassName("poll-bar")[0];
     bar.style.width = Number(payload[i])*50+"px";
    }

}



function state_handler(new_state){
  document.getElementsByClassName("poll-title")[0].innerText = new_state.title;
  var new_poll = document.createElement("div");
  new_poll.className = "poll-contanier";
  for(let  i = 0; i<new_state.options.length; i++){
    new_poll.appendChild(option_factory(new_state.options[i].title,new_state.options[i].count));
  }
  document.getElementsByClassName("poll-contanier")[0].replaceWith(new_poll);
}

function option_factory(title, result){
  var option = document.createElement("div");
  option.className = "poll-option";
  option.innerText = title;
  var bar = document.createElement("div");
  bar.className = "poll-bar";
  bar.style.width = result*50+"px";
  option.appendChild(bar);
  return option;
}

(()=>{
  document.querySelector(".slave-link>a").innerText = location.host+"/"+slave_shortlink;
  var next = document.getElementById("next-button");
  var prev = document.getElementById("prev-button");
  var input = document.getElementById("pass-input");
  var send = document.getElementById("send-button");

  function press_event(event){
      switch (event.target.id) {
        case "next-button":
          socket.send(message_factory({command:"next_poll"},"command"));
          break;
        case "prev-button":
          socket.send(message_factory({command:"prev_poll"},"command"));
          break;
        case "send-button":
          socket.send(message_factory({password:input.value},"upgrade"));
          break;
        default:
      }
  }
  next.addEventListener('click',press_event);
  prev.addEventListener('click',press_event);
  send.addEventListener('click',press_event);


})();
