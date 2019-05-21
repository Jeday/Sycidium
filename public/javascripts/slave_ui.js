Vue.component("pollButton", {
  props: ["isActive"],
  methods: {},
  computed: {
    button_style: function() {
      return ["md-raised", this.isActive ? "md-accent" : "md-primary"];
    }
  },
  template: `
      <md-button    :class="button_style" ><slot></slot></md-button>
    `
});

var vw = new Vue({
  el: "#app",
  data: {
    state: {
      title: "No Poll",
      options: [],
      vote_index: -1
    },
    info: sessionInfo
  },
  computed: {
    changedTitle: function() {
      window.document.title = state.title;
      return true;
    },
    buttonsIsActive: function() {
      return this.state.options.map((el, index) => {
        return index == this.state.vote_index;
      });
    },
    optionsLength: function() {
      return this.state.options ? this.state.options.length : 0;
    }
  },
  methods: {
    vote: function(ind) {
      this.state.vote_index = ind;
      this.info.socket.send(
        this.info.message_factory({ vote: ind }, "payload")
      );
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
    <div v-if="optionsLength" class="vote-container filling-flex-item">
      <pollButton class="poll-button "  v-for="(option,index) in state.options" :isActive="buttonsIsActive[index]"  v-bind:key="'option'+index" v-on:click.native="vote(index)"  >
        {{state.options[index].title}}
      </pollButton>
    </div>
    <md-empty-state v-else md-label="No options for this poll" md-icon="bubble_chart" class="filling-flex-item">
    </md-empty-state>
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
