socket.addEventListener('message', function(ws,ev){
    var data =  JSON.parse(ws.data);
    switch (data.type) {
      case "new_state":
        state_handler(data.state);
        break;
      case "payload":
        payload_handler(data.payload);
        break;
      case "error":
      default:
          error_handler(data);
      break;
    }
});

function payload_handler(){};
function error_handler(){};



function state_handler(new_state){
  var options_contnainer = document.getElementsByClassName("options-contanier")[0];
  var new_options = document.createElement("div");
  new_options.className = "options-contanier";
  for(let  i = 0; i<new_state.options.length; i++){
    new_options.appendChild(button_factory(new_state.options[i].title,i));
  }
  new_options.addEventListener("click",function(event){
    let option_index = Number(event.target.id);
    send_vote(option_index);
  });

  options_contnainer.replaceWith(new_options);

}

function button_factory(option_name,index){
  var button = document.createElement("div");
  button.className = "option-button";
  button.innerText = option_name;
  button.id = index;
  return button;
}

function send_vote(index){
  socket.send(message_factory(index,"payload"));
}
