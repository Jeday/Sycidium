var vw = new Vue({
  el: "#app",
  data: {
    state: {
      title: "No Poll",
      options: []
    },
    info: sessionInfo
  },
  computed: {
    changedTitle: function() {
      window.document.title = state.title;
      return true;
    }
  },
  methods: {
    vote: function(index) {
      this.state.vote_index = index;
      this.info.socket.send(
        this.info.message_factory({ vote: index }, "payload")
      );
    },
    button_style: function(index) {
      console.log(index);
      return [
        "md-raised",
        this.state.vote_index == index ? "md-accent" : "md-primary"
      ];
    }
  },
  created: function() {
    this.info.init_WS();
  },
  template: `
  <div class="app-container">
    <md-toolbar class="poll-toolbar static-flex-item">
      <div class="md-toolbar-row">
        <h2 class="poll-title ">{{state.title}}</h2>
      </div>
    </md-toolbar>
    <md-content class="vote-container filling-flex-item">
      <md-button  v-for="(option,index) in state.options"  v-bind:key="'option'+index" v-on:click="vote(index)"  :class="button_style(index)" >{{option.title}}</md-button>
    </md-content>
  </div>
  `
});

vw.info.socket.addEventListener("message", function(ws, ev) {
  var data = JSON.parse(ws.data);
  switch (data.type) {
    case "new_state":
      state_handler(data.state);
      break;
    case "payload":
      payload_handler(data.payload);
      break;
    case "error":
    default:
      error_handler(data.error);
      break;
  }
});

function state_handler(new_state) {
  vw.state = new_state;
}

function payload_handler(payload) {
  switch (payload.type) {
    default:
  }
}

function error_handler(error) {
  console.log(error);
}
