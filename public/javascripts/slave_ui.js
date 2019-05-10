

Vue.component("votingContainer", {
  props: ["pollState","info"],
  computed: {

  },
  methods:{
    vote: function(index){
        this.info.socket.send(this.info.message_factory({vote: index },"payload"));
    }
  },
  template: `
      <div class='vote-container'>
            <h2 class="poll-title">{{pollState.title}}</h2>
            <div class="vote-container">
              <button v-for="(option,index) in pollState.options" v-bind:option="option"  v-bind:key="'option'+index" v-on:click="vote(index)" >{{option.title}}</button>
            </div>
      </div>
    `
});


var vw = new Vue({
  el: "#app",
  data: {
    state: {
      title: "No Poll",
      options:[]
    },
    info: sessionInfo
  },
  watch:{
        state:function(newState,oldState){
           document.title = newState.title;
        }
    },
  created: function(){ this.info.init_WS()},
  template: `
  <div>
    <votingContainer v-bind:pollState="state" v-bind:info="info" ></votingContainer>
  </div>
  `
});

vw.info.socket.addEventListener('message', function(ws,ev){
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
          error_handler(data.error);
      break;
    }
});


function state_handler(new_state){
  vw.state = new_state;
}

function payload_handler(payload){
    switch (payload.type) {
      default:
    }
}

function error_handler(error){
    console.log(error);
}
