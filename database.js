var crypto = require("crypto");
var debounce = require("debounce");

/// local_db is exported object
/// incapsulates data model
/// and all communications between views, slaves and model

// polling sessions is a dictionary and short links are also dictionaries that link to corresponding session and types of links
// "view" "slave"
var local_db = {
  polling_sessions: {},
  short_links: {}
};

// creates new polling session with provided poll_object, adds short links for slave and view
//
local_db.create_polling_session = poll_object => {
  let new_id = "";
  let new_view_link = "";
  let new_slave_link = "";
  do {
    new_id = crypto.randomBytes(20).toString("hex");
  } while (local_db.polling_sessions[new_id]);

  do {
    new_view_link = crypto.randomBytes(5).toString("hex");
  } while (local_db.short_links[new_view_link]);
  local_db.short_links[new_view_link] = { session: {}, type: "view" };
  do {
    new_slave_link = crypto.randomBytes(5).toString("hex");
  } while (local_db.short_links[new_slave_link]);
  local_db.short_links[new_slave_link] = { session: {}, type: "slave" };
  // set up done
  // data copying is here

  // copy all polls
  let polls = poll_object.polls.map(poll => {
    return {
      title: poll.title,
      options: poll.options.map(elem => {
        return { title: elem.title };
      })
    };
  });

  let new_state = poll_object.polls.length
    ? {
        title: poll_object.polls[0].title,
        options: poll_object.polls[0].options.map(elem => {
          return { title: elem.title, count: 0 };
        }),
        current_poll: 0,
        voters: {}
      }
    : {};

  local_db.polling_sessions[new_id] = {
    password: poll_object.password,
    view_link: new_view_link,
    slave_link: new_slave_link,
    slaves: {},
    views: {},
    state: new_state,
    polls: polls
  };

  local_db.short_links[new_view_link].session =
    local_db.polling_sessions[new_id];
  local_db.short_links[new_slave_link].session =
    local_db.polling_sessions[new_id];

  local_db.patch_polling_session(local_db.polling_sessions[new_id]);
  return new_id;
};

/// example of poll object passed to polling session
var poll_object_example = {
  password: "admin",
  polls: [
    {
      title: "poll",
      options: [
        { title: "option1" },
        { title: "option2" },
        { title: "option3" }
      ]
    },
    {
      title: "poll2",
      options: [
        { title: "option4" },
        { title: "option5" },
        { title: "option6" }
      ]
    }
  ]
};

/// example session object for reference
var example_session = {
  /// slaves and views are two objects so that session_id works as key in dictionary
  slaves: {},
  views: {
    sadagwt2: "ws_object"
  },
  state: {
    current_poll: 0,
    title: "poll",
    options: [
      { title: "option1", count: 1 },
      { title: "option2", count: 0 },
      { title: "option3", count: 0 }
    ],
    voters: { sadagwt2: 0 }
  },
  polls: [
    {
      title: "poll",
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
};

// this methods adds alll needed methods to polling session object
// weird style is because local_db used to be polling session object and now it encapsulates all polling sessions
local_db.patch_polling_session = polling_session_object => {
  //
  //----------------------(RE)NEW CLIENT RUITINE------------------------
  //

  //  both fucntions provide fresh id's and prepare empty objects
  // empty objects allow db.get_id_type to notice if id is legal even though websocket object is not yet assigned to it
  polling_session_object.generate_new_id_slave = function() {
    var new_id = "";
    do {
      new_id = crypto.randomBytes(20).toString("hex");
    } while (
      polling_session_object.slaves[new_id] ||
      polling_session_object.views[new_id]
    );
    polling_session_object.slaves[new_id] = { placeholder: true };
    return new_id;
  };
  polling_session_object.generate_new_id_view = function() {
    var new_id = "";
    do {
      new_id = crypto.randomBytes(20).toString("hex");
    } while (
      polling_session_object.slaves[new_id] ||
      polling_session_object.views[new_id]
    );
    polling_session_object.views[new_id] = { placeholder: true };
    return new_id;
  };
  // looks up id in database
  polling_session_object.get_id_type = function(id) {
    if (polling_session_object.slaves[id]) return "slave";
    else if (polling_session_object.views[id]) return "view";
    else return null;
  };

  // this function recieves id,type of cpnnection and ws object from client who connected on ws
  // looks up his cridentials on db, takes over ws object callback if all is ok
  // returns false on failure
  polling_session_object.verify_update = function(
    recv_id,
    requested_type,
    ws_object,
    old_id
  ) {
    let lookedup_type = polling_session_object.get_id_type(recv_id);
    if (lookedup_type != requested_type) return false; // client reqeusted wrong type
    let is_slave = null;
    if (lookedup_type) {
      model_dir = polling_session_object[lookedup_type + "s"];
      if (old_id)
        if (
          model_dir[old_id] &&
          (model_dir[old_id].placeholder || model_dir[old_id].readyState > 1)
        )
          model_dir[old_id] = null;
        else return false; // client tried to delete old id that is active or doesn't exists
      model_dir[recv_id] = ws_object;
    } else return false; //no such client id in system
    is_slave = "slave" == lookedup_type;
    polling_session_object.patch_websocket(is_slave, ws_object, recv_id);
    polling_session_object.send_state(is_slave, recv_id);

    return true;
  };

  /// this function pathces websockets to callback unifed function during message event
  polling_session_object.patch_websocket = function(is_slave, ws_object, id) {
    // very imporatnt
    ws_object.removeAllListeners("message");
    ws_object.removeAllListeners("open");
    ws_object.removeAllListeners("close");
    if (is_slave) {
      ws_object.on("message", function(data) {
        polling_session_object.message_from_slave(id, ws_object, data);
      });
      ws_object.on("close", function() {
        polling_session_object.slaves[id] = { placeholder: true };
        ws_object.removeAllListeners("message");
        ws_object.removeAllListeners("open");
        ws_object.removeAllListeners("close");
      });
    } else {
      ws_object.on("message", function(data) {
        polling_session_object.message_from_view(id, ws_object, data);
      });
      ws_object.on("close", function() {
        polling_session_object.views[id] = { placeholder: true };
        ws_object.removeAllListeners("message");
        ws_object.removeAllListeners("open");
        ws_object.removeAllListeners("close");
      });
    }
  };

  //
  //----------------------CALLBACKS AND RESPONCES------------------------
  //

  // called by websocket event when message comes
  polling_session_object.message_from_slave = function(
    slave_id,
    ws_object,
    data
  ) {
    try {
      data = JSON.parse(data);
      option_id = Number(data.payload.vote);
    } catch (ex) {
      console.log("invalid user input");
      return;
    }
    polling_session_object.vote(slave_id, option_id);
    polling_session_object.refresh_views();
  };

  polling_session_object.message_from_view = function(
    view_id,
    ws_object,
    data
  ) {
    try {
      data = JSON.parse(data);

      switch (data.type) {
        case "auth":
          if (data.payload.password == polling_session_object.password) {
            ws_object.is_upgraded_to_admin = true;
          }
          if (ws_object.is_upgraded_to_admin) {
            ws_object.send(
              JSON.stringify({
                id: view_id,
                type: "payload",
                payload: { type: "auth", auth: true }
              })
            );
          } else {
            ws_object.send(
              JSON.stringify({
                id: view_id,
                type: "error",
                error: "Wrong Password"
              })
            );
          }
          break;
        case "command":
          if (ws_object.is_upgraded_to_admin)
            switch (data.payload.command) {
              case "next_poll":
                this.swith_to_poll(
                  polling_session_object.state.current_poll + 1
                );
                break;
              case "prev_poll":
                this.swith_to_poll(
                  polling_session_object.state.current_poll - 1
                );
                break;
              default:
            }
        default:
      }
    } catch (e) {
      console.log("invalid user input");
      return;
    }
  };

  /// updates all views with newer data from model
  polling_session_object.refresh_views = debounce(function(e) {
    let data = JSON.stringify({
      session_id: "to_all",
      type: "new_state",
      state: polling_session_object.get_state()
    });
    for (var id in polling_session_object.views) {
      var view = polling_session_object.views[id];
      if (!view || view.readyState != 1)
        //second check dismisses {placeholder:true} and ws object that aren't open yet/already
        continue;
      view.send(data);
    }
    this.refresh_views.clear();
  }, 200);

  // sends state of poll to desingated id, promtes clients to redraw
  polling_session_object.send_state = function(is_slave, id) {
    let payload = {
      session_id: id,
      type: "new_state",
      state: this.get_state()
    };
    payload = JSON.stringify(payload);
    if (is_slave) polling_session_object.slaves[id].send(payload);
    else polling_session_object.views[id].send(payload);
  };

  polling_session_object.send_state_all = debounce(function() {
    let data = JSON.stringify({
      session_id: id,
      type: "new_state",
      state: polling_session_object.get_state()
    });
    for (var id in polling_session_object.views) {
      var view = polling_session_object.views[id];
      if (!view || view.readyState != 1)
        //second check dismisses {placeholder:true} and ws object that aren't open yet/already
        continue;
      view.send(data);
    }
    for (var id in polling_session_object.slaves) {
      var view = polling_session_object.slaves[id];
      if (!view || view.readyState != 1)
        //second check dismisses {placeholder:true} and ws object that aren't open yet/already
        continue;
      view.send(data);
    }
    this.send_state_all.clear();
  }, 200);

  //
  //----------------------INTERACTION WITH MODEL------------------------
  //

  // return copy of state object
  polling_session_object.get_state = function() {
    const state = polling_session_object.state;
    return {
      title: state.title,
      options: state.options.map(el => {
        return { title: el.title, count: el.count };
      })
    };
  };

  polling_session_object.swith_to_poll = function(poll_index) {
    let state = polling_session_object.state;
    let len = polling_session_object.polls.length;
    if (poll_index >= len || poll_index < 0 || poll_index == state.current_poll)
      return;
    polling_session_object.state = {
      current_poll: poll_index,
      title: polling_session_object.polls[poll_index].title,
      options: polling_session_object.polls[poll_index].options.map(elem => {
        return { title: elem.title, count: 0 };
      }),
      voters: {}
    };
    polling_session_object.send_state_all();
  };

  polling_session_object.vote = function(voter_id, vote_index) {
    if (
      vote_index < 0 ||
      vote_index >= polling_session_object.state.options.length
    )
      return;
    if (
      polling_session_object.state.voters[voter_id] == undefined ||
      polling_session_object.state.voters[voter_id] == null
    ) {
      //
      polling_session_object.state.voters[voter_id] = vote_index;
      polling_session_object.state.options[vote_index].count += 1;
    } else {
      var old_vote = polling_session_object.state.voters[voter_id];
      polling_session_object.state.voters[voter_id] = vote_index;
      polling_session_object.state.options[vote_index].count += 1;
      polling_session_object.state.options[old_vote].count -= 1;
    }
  };
};

module.exports = local_db;
