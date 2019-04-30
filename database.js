var crypto = require("crypto");
var debounce = require('debounce');


/// local_db is exported object
/// incapsulates data model
/// and all communications between views, slaves and model



// polling sessions is a dictionary and short links are also dictionaries that link to corresponding session and types of links
// "view" "slave"
var local_db = {
  polling_sessions: {
  },
  short_links: {}
};

// creates new polling session with provided poll_object, adds short links for slave and view
//
local_db.create_polling_session = (poll_object) => {
  let new_id = "";
  let new_view_link = "";
  let new_slave_link = "";
  do {
    new_id = crypto.randomBytes(20).toString('hex');
  }
  while (local_db.polling_sessions[new_id]);

  do {
    new_view_link = crypto.randomBytes(5).toString('hex');
  }
  while (local_db.short_links[new_view_link]);
  local_db.short_links[new_view_link] = { session: {}, type: "view" };
  do {
    new_slave_link = crypto.randomBytes(5).toString('hex');
  }
  while (local_db.short_links[new_slave_link]);
  local_db.short_links[new_slave_link] = { session: {}, type: "slave" };

  let new_state = {
    title: poll_object.title,
    options: poll_object.options.map((elem) => {
      return { title: elem.title, count: 0 };
    }),
    voters: {}
  }

  local_db.polling_sessions[new_id] = {
    view_link: new_view_link,
    slave_link: new_slave_link,
    slaves: {},
    views: {},
    state: new_state,

  }

    local_db.short_links[new_view_link].session=local_db.polling_sessions[new_id];
    local_db.short_links[new_slave_link].session=local_db.polling_sessions[new_id];

  local_db.path_polling_session(local_db.polling_sessions[new_id]);
  return new_id;

}

/// example of poll object passed to polling session
var poll_object_example = {
polls:[
  {  title: "poll",
    options: [
      { title: "option1" },
      { title: "option2" },
      { title: "option3" }
    ]
  },
  {
    title: "poll2",
    options: [
      { title: "option1" },
      { title: "option2" },
      { title: "option3" }
    ]
  }
]

}

/// example session object for reference
var example_session = {
  /// slaves and views are two objects so that session_id works as key in dictionary
  slaves: {},
  views: {
    "sadagwt2": "ws_object"
  },
  state: {
    current_poll: 0,
    title: "poll",
    options: [
      { title: "option1", count: 1 },
      { title: "option2", count: 0 },
      { title: "option3", count: 0 }
    ],
    voters: { "sadagwt2": 0 }
  },
  polls:[
    {  title: "poll",
      options: [
        { title: "option1" },
        { title: "option2" },
        { title: "option3" }
      ]
    },
    {
      title: "poll2",
      options: [
        { title: "option1" },
        { title: "option2" },
        { title: "option3" }
      ]
    }
  ]



}


// this methods adds alll needed methods to polling session object
// weird style is because local_db used to be polling session object and now it encapsulates all polling sessions
local_db.path_polling_session = (polling_session_object) => {

  //
  //----------------------(RE)NEW CLIENT RUITINE------------------------
  //

  //  both fucntions provide fresh id's and prepare empty objects
  // empty objects allow db.get_id_type to notice if id is legal even though websocket object is not yet assigned to it
  polling_session_object.generate_new_id_slave = function() {
    var new_id = "";
    do {
      new_id = crypto.randomBytes(20).toString('hex');
    }
    while (polling_session_object.slaves[new_id] || polling_session_object.views[new_id])
    polling_session_object.slaves[new_id] = {placeholder:true};
    return new_id;
  }
  polling_session_object.generate_new_id_view = function() {
    var new_id = "";
    do {
      new_id = crypto.randomBytes(20).toString('hex');
    }
    while (polling_session_object.slaves[new_id] || polling_session_object.views[new_id] )
    polling_session_object.views[new_id] = {placeholder:true};
    return new_id;
  }
  // looks up id in database
  polling_session_object.get_id_type = function(id) {
    if (polling_session_object.slaves[id] )
      return "slave";
    else if (polling_session_object.views[id] )
      return "view"
    else
      return null;

  }

  // this function recieves id,type of cpnnection and ws object from client who connected on ws
  // looks up his cridentials on db, takes over ws object callback if all is ok
  // returns false on failure
  polling_session_object.verify_update=function(recv_id,requested_type,ws_object){
    let lookedup_type = polling_session_object.get_id_type(recv_id);
    if(lookedup_type != requested_type)
      return false;
    let is_slave = null;
    switch (lookedup_type) {
      case "slave":
        polling_session_object.slaves[recv_id] = ws_object;
        break;
      case "view":
        polling_session_object.views[recv_id] = ws_object;
        break;
      default:
        return false;
    }
    is_slave = "slave"==lookedup_type;
    polling_session_object.patch_websocket(is_slave, ws_object, recv_id);
    polling_session_object.send_state(is_slave, recv_id);
    return true;

  }



  /// this function pathces websockets to callback unifed function during message event
  polling_session_object.patch_websocket = function(is_slave, ws_object, id) {
    if (is_slave === true) {
      ws_object.on("message", function(data) {
        polling_session_object.message_from_slave(id, ws_object, data);
      });

    }
    else {
      ws_object.on("message", function(data) {
        polling_session_object.message_from_view(id, ws_object, data);
      });
    }
    ws_object.on("close",function(){
      polling_session_object.slaves[id] = null;

    })

  }


  //
  //----------------------CALLBACKS AND RESPONCES------------------------
  //


  // called by websocket event when message comes
  // TODO: move all interactions with model separate functions
  polling_session_object.message_from_slave = function(slave_id, ws_object, data) {
    data = JSON.parse(data);
    option_id = Number(data.payload);
    if (polling_session_object.state.voters[slave_id] == undefined || polling_session_object.state.voters[slave_id] == null) { //
      polling_session_object.state.voters[slave_id] = option_id;
      polling_session_object.state.options[option_id].count += 1;
    }
    else {
      var old_vote = polling_session_object.state.voters[slave_id];
      polling_session_object.state.voters[slave_id] = option_id;
      polling_session_object.state.options[option_id].count += 1;
    polling_session_object.state.options[old_vote].count -= 1;
    }

    polling_session_object.refresh_views();
  };
  polling_session_object.message_from_view = function(view_id, ws_object, data) { };

  /// updates all views with newer data from model
  /// TODO:make payload more complex and understanable
  /// TODO: move interactions with model( extarcting data too) to separate functions
  polling_session_object.refresh_views = debounce(function(e) {
    let payload = [];
    for (var i = 0; i < polling_session_object.state.options.length; i++) {
      payload.push(polling_session_object.state.options[i].count);
    }
    for (var id in polling_session_object.views) {
      var view = polling_session_object.views[id];
      if (!view || view.readyState != 1) //second check dismisses {placeholder:true} and ws object that aren't open yet/already
        continue;
      view.send(JSON.stringify({ session_id: id, type: "payload", payload: payload }));
    }
    this.refresh_views.clear();
  },200);

  // sends state of poll to desingated id, promtes clients to redraw
  polling_session_object.send_state = function(is_slave, id) {
    let payload = { session_id: id, type: "new_state", state: { title: polling_session_object.state.title, options: polling_session_object.state.options } };
    payload = JSON.stringify(payload);
    if (is_slave)
      polling_session_object.slaves[id].send(payload);
    else
      polling_session_object.views[id].send(payload);
  }


}

module.exports = local_db;
