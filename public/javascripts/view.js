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
     let bar = poll.children[i].getElementsByClassName("poll-bar");
     bar.style.width = Number(payload[i])*10;
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
  bar.style.width = result*10;
  option.appendChild(bar);
  return option;
}
