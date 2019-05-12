// module for poll view and slave pages

var express = require("express");
var db = require("../database.js");
var router = express.Router();

/* GET home page. */

// route for view page
router.get("/:shortlink", function(req, res, next) {
  let link = db.short_links[req.params.shortlink];
  if (!link) next();
  else if (link.type == "view")
    res.render("view", {
      session_id: link.session.generate_new_id_view(),
      slave_shortlink: link.session.slave_link,
      view_shortlink: link.session.view_link,
      session_type: link.type
    });
  else if (link.type == "slave")
    res.render("slave", {
      session_id: link.session.generate_new_id_slave(),
      slave_shortlink: link.session.slave_link,
      session_type: link.type,
      view_shortlink: "null" // no need for slave to know master's bindings
    });
  else next();
});

router.get;

router.get("/index", function(req, res, next) {
  res.render("index");
});

router.get("/get_polled", function(req, res, next) {
  let id = db.create_polling_session({
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
  });
  res.status(200).json({ link: db.polling_sessions[id].view_link });
});

// route for websocket update
router.ws("/ws/:shortlink", function(ws, req) {
  //console.log(db.short_links);
  let link = db.short_links[req.params.shortlink];
  if (!link) next();
  let id_type = link.type;
  let poll_session = link.session;
  let got_id = false;
  // this callback fires once and passes websocket object to model
  // imporant to remove this event handler, this happends in verifie_update
  ws.on("message", function(data) {
    // session id is expected to come from client
    try {
      got_id = true;
      data = JSON.parse(data);
      let old_id = "";
      if (data.type == "continue") {
        old_id = data.payload.old_id;
        if (!old_id) {
          ws.close();
          return;
        }
      }
      if (!poll_session.verify_update(data.session_id, id_type, ws, old_id))
        ws.close();
    } catch (e) {
      console.log("invalid user data");
      ws.close();
    }
  });
  //if no messages comes websocket connection is terminated after 4 seconds
  setTimeout(function() {
    if (!got_id) ws.close();
  }, 4000);
});

module.exports = router;
