///
///------------------------------- Poll components -------------------------
///

Vue.component("pollOption", {
  props: ["option", "portion"],
  computed: {
    barStyle: function() {
      return {
        width: Math.max(this.portion * 100, 0.5) + "%"
      };
    },
    inBar: function() {
      return this.option.count ? this.option.count : "";
    }
  },
  template: `
      <div class='poll-option md-layout-item'>
          <div class='option-name'  >{{option.title}}</div>
          <md-content class='poll-bar md-elevation-3' v-bind:style="barStyle"  >{{inBar}}</md-content >
      </div>
    `
});

///
///------------------------------- Contorl Panel -------------------------
///
Vue.component("ControlPanel", {
  data: function() {
    return {
      showDialog: false
    };
  },
  props: ["info"],
  computed: {},
  methods: {
    NextCommand: function(event) {
      this.info.socket.send(
        this.info.message_factory({ command: "next_poll" }, "command")
      );
    },
    PrevCommand: function(event) {
      this.info.socket.send(
        this.info.message_factory({ command: "prev_poll" }, "command")
      );
    },
    SubmitCommand: function(event) {
      this.info.socket.send(
        this.info.message_factory({ password: this.info.password }, "auth")
      );
      this.showDialog = false;
    }
  },
  template: `
      <div class='poll-control'>
        <template v-if="info.isAuthed">
          <md-button class="md-icon-button md-raised poll-control-button" v-on:click='PrevCommand' key="prev">
            <md-icon>arrow_left</md-icon>
          </md-button>
          <md-button class="md-icon-button md-raised poll-control-button" v-on:click='NextCommand' key="next">
            <md-icon>arrow_right</md-icon>
            </md-button>

        </template>
        <template v-else>
          <md-button class="md-icon-button md-raised poll-control-button" v-on:click='showDialog=true' key="auth">
            <md-icon>lock_open</md-icon>
          </md-button>
        </template>


        <md-dialog :md-active.sync="showDialog">
        <md-dialog-title>Password</md-dialog-title>
          <input type='password' class='poll-input' id='pass-input' v-model='info.password' v-on:keyup.enter="SubmitCommand"></input>
          <md-dialog-actions>
            <md-button class="md-primary" @click="showDialog = false">Close</md-button>
            <md-button class="md-primary" @click="SubmitCommand">Submit</md-button>
          </md-dialog-actions>
        </md-dialog>
      </div>
    `
});

///
///------------------------------- Root  -------------------------
///
var vw = new Vue({
  el: "#app",
  data: {
    state: {
      title: "No Poll"
    },
    info: (() => {
      (sessionInfo.password = ""), (sessionInfo.isAuthed = false);
      return sessionInfo;
    })()
  },
  computed: {
    link: function() {
      return window.location.host + "/" + this.info.slaveLink;
    },
    VoteSum: function() {
      let sum = 0;
      this.state.options.forEach(elem => {
        sum += elem.count;
      });
      return sum;
    }
  },
  watch: {
    state: function(newState, oldState) {
      document.title = newState.title;
    }
  },
  created: function() {
    this.info.init_WS();
  },
  template: `
  <div class='app-container '>
        <md-toolbar class="poll-toolbar static-flex-item">
          <div class="md-toolbar-row">
            <h2 class="poll-title ">{{state.title}}</h2>
          </div>
          <div class="md-toolbar-row">
          <h3 class="poll-join">Join poll at <a v-bind:href="'/'+info.slaveLink">{{link}}</a></h3>
          </div>
        </md-toolbar>
        <md-content class='poll-container md-layout-item md-layout md-gutter filling-flex-item'>
          <pollOption  v-for="(option,index) in state.options" v-bind:option="option" v-bind:portion="VoteSum ? option.count/VoteSum : 0" v-bind:key=" 'option'+index "  ></pollOption>
        </md-content>
        <ControlPanel class="static-flex-item"v-bind:info="info" ></ControlPanel>
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
    case "auth":
      vw.info.isAuthed = payload.auth;
      break;
    default:
  }
}

function error_handler(error) {
  console.log(error);
}
