var crypto = require("crypto");

/// local_db is exported object
/// incapsulates data model
/// and all communications between views, slaves and model



/// slaves and views are two objects so that session_id works as key in dictionary
var local_db = {
  slaves:{},
  views:{},
  state:{
    title:"poll",
    options:[
      {title:"option1",count:0},
      {title:"option2",count:0},
      {title:"option3",count:0}
    ],
    voters:{}
  }
};


//
//----------------------(RE)NEW CLIENT RUITINE------------------------
//

//  both fucntions provide fresh id's and prepare empty objects
// empty objects allow db.get_id_type to notice if id is legal even though websocket object is not yet assigned to it
local_db.generate_new_id_slave = function(){
  var new_id = "";
  do{
    new_id= crypto.randomBytes(20).toString('hex');
  }
  while( local_db.slaves[new_id]!=undefined ||  local_db.views[new_id]!=undefined)
  local_db.slaves[new_id] = {};
  return new_id;
}
local_db.generate_new_id_view= function(){
  var new_id = "";
  do{
    new_id= crypto.randomBytes(20).toString('hex');
  }
  while( local_db.slaves[new_id]!=undefined ||  local_db.views[new_id]!=undefined)
  local_db.views[new_id] = {};
  return new_id;
}
// looks up id in database
local_db.get_id_type = function(id){
  if( local_db.slaves[id] !=undefined)
    return "slave";
  else if ( local_db.views[id] !=undefined)
    return "view"
  else
    return null;

}

// both functions update data on new/reconnected users and sends them a fresh state
local_db.update_slave = function(slave_id,ws_object){
  local_db.slaves[slave_id] = ws_object;
  local_db.patch_websocket(true,ws_object,slave_id);
  local_db.send_state(true,slave_id);
}
local_db.update_view = function(view_id,ws_object){
  local_db.views[view_id] = ws_object;
  local_db.patch_websocket(false,ws_object,view_id);
  local_db.send_state(false,view_id);
}

/// this function pathces websockets to callback unifed function during message event
local_db.patch_websocket = function(is_slave,ws_object,id){
  if(is_slave === true){
    ws_object.on("message",function(data){
       local_db.message_from_slave(id,ws_object,data);
    });
  }
  else{
    ws_object.on("message",function(data){
       local_db.message_from_view(id,ws_object,data);
    });
  }


}


//
//----------------------CALLBACKS AND RESPONCES------------------------
//

// called by websocket event when message comes
local_db.message_from_slave = function(slave_id,ws_object,data){
    data = JSON.parse(data);
    option_id = Number(data.payload);
    if(local_db.state.voters[slave_id] == undefined){
       local_db.state.voters[slave_id] = option_id;
       local_db.state.options[option_id].count+=1;
    }
    else{
      old_vote = local_db.state.voters[slave_id];
      local_db.state.voters[slave_id] = option_id;
      local_db.state.options[option_id].count+=1;
      local_db.state.options[old_vote].count-=1;
    }
    local_db.refresh_views();
};
local_db.message_from_view = function(view_id,ws_object,data){};

/// updates all views with newer data from model
local_db.refresh_views = function(){
    let payload = [];
    for (var i = 0; i < local_db.state.options.length; i++) {
      payload.push(local_db.state.options[i].count);
    }

    for(var id in local_db.views) {
      console.log(id);
      console.log(local_db.views[id]);
      var view = local_db.views[id];
      if(view == {} || !view || view.readyState != 1)
        continue;
      view.send(JSON.stringify({session_id:id, type:"payload", payload:payload}));
  }
}

// sends state of poll to desingated id, promtes clients to redraw
local_db.send_state = function(is_slave,id){
  let payload = {session_id:id ,type: "new_state" , state:{title:local_db.state.title, options:local_db.state.options}};
  payload = JSON.stringify(payload);
  if(is_slave)
    local_db.slaves[id].send(payload);
  else
    local_db.views[id].send(payload);
}




module.exports = local_db;
