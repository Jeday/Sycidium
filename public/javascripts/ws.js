sessionInfo.init_WS = () => {
  var old_id;
  sessionInfo.state_of_session = "none";
  sessionInfo.get_session_id = () => {
    switch (sessionInfo.type) {
      default:
      case "slave":
        sessionInfo.own_shortlink = sessionInfo.slaveLink;
        break;
      case "view":
        sessionInfo.own_shortlink = sessionInfo.viewLink;
        break;
    }
    let saved_id = Cookies.get(sessionInfo.own_shortlink);
    if (saved_id) {
      Cookies.set(sessionInfo.own_shortlink, saved_id, { expires: 1 });
      old_id = sessionInfo.id;
      sessionInfo.id = saved_id;
      sessionInfo.state_of_session = "continue";
    } else {
      Cookies.set(sessionInfo.own_shortlink, sessionInfo.id, { expires: 1 });
      sessionInfo.state_of_session = "login";
    }
    if (!sessionInfo.id) Error("invalid session id  - " + sessionInfo.id);
  };
  sessionInfo.get_session_id();

  sessionInfo.message_factory = function(data, type) {
    switch (type) {
      case "error":
        cargo_name = "error";
        break;
      default:
      case "payload":
        cargo_name = "payload";
        break;
    }
    let res = {
      session_id: sessionInfo.id,
      type: type
    };
    res[cargo_name] = data;
    return JSON.stringify(res);
  };

  // init websocket connection and event listeners
  sessionInfo.socket = new WebSocket(
    "ws://" + location.host + "/ws/" + sessionInfo.own_shortlink
  );
  sessionInfo.socket.__send = sessionInfo.socket.send;
  sessionInfo.socket.send = function(data) {
    console.log("Client:" + data);
    this.__send(data);
  };

  sessionInfo.socket.addEventListener("open", function(ev) {
    console.log("connection open to " + this.url);
    this.send(
      sessionInfo.message_factory(
        { old_id: old_id },
        sessionInfo.state_of_session
      )
    );
  });
  sessionInfo.socket.addEventListener("message", function(ws, ev) {
    console.log("Server:" + ws.data);
  });
  sessionInfo.socket.addEventListener("close", function(ws, ev) {
    console.log("connection closed:");
  });
};
