///
///------------------------------- Poll components -------------------------
///
Vue.component("pollContainer", {
  props: ["pollState","slink"],
  computed: {
    VoteSum: function() {
      let sum = 0;
      this.pollState.options.forEach(elem => {
        sum += elem.count;
      });
      return sum;
    }
  },
  template: `
      <div class='poll-container'>
            <h2 class="poll-title">{{pollState.title}}</h2>
            <h3 class="poll-join">Join poll at <a v-bind:href="slink">{{slink}}</a></h3>
            <pollOption v-for="(option,index) in pollState.options" v-bind:option="option" v-bind:portion="VoteSum ? option.count/VoteSum : 0" v-bind:key=" 'option'+index "  ></pollOption>
      </div>
    `
});

Vue.component("pollOption", {
  props: ["option", "portion"],
  computed: {
    barStyle: function(){
      return {
        width: this.portion*100+'%',
        overflow: "hidden",
        "text-aling": "right",
      }

    }

  },
  template: `
      <div class='poll-option'>
          <div class='option-name'>{{option.title}}</div>
          <div class='poll-bar' v-bind:style="barStyle" >{{option.count}}</div>
      </div>
    `
});

///
///------------------------------- Contorl Panel -------------------------
///
Vue.component("ControlPanel", {
  props: ["info"],
  computed: {},
  methods:{
    NextCommand :function(event){
      this.info.socket.send(this.info.message_factory({command:"next_poll"},"command"));
    },
    PrevCommand :function(event){
      this.info.socket.send(this.info.message_factory({command:"prev_poll"},"command"));
    },
    SubmitCommand :function(event){
      this.info.socket.send(this.info.message_factory({password:this.info.password},"auth"));
    },
  },
  template: `
      <div class='poll-control'>
        <template v-if="info.isAuthed">
          <div class='poll-button' id="prev-button" v-on:click='PrevCommand' > Prev </div>
          <div class='poll-button' id="next-button" v-on:click='NextCommand'> Next </div>
        </template>
        <template v-else>
        <input type='password' class='poll-input' id='pass-input' v-model='info.password' v-on:keyup.enter="SubmitCommand"></input>
        <div class='poll-button' id='submit-button' v-on:click='SubmitCommand' > Submit </div>
        </template>
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
    info: (()=>{
      sessionInfo.password='',
      sessionInfo.isAuthed=false
      return sessionInfo;
    })()
  },
  computed:{
    link: function(){
       return window.location.host+"/"+this.info.slaveLink;
    }

  },
  watch:{
      state:function(newState,oldState){
         document.title = newState.title;
      }
  }
  ,
  created: function(){ this.info.init_WS()},
  template: `
  <div>
    <pollContainer v-bind:pollState="state"  v-bind:slink = 'link' ></pollContainer>
    <ControlPanel v-bind:info="info"></ControlPanel>
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
      case "auth":
          vw.info.isAuthed = payload.auth;
        break;
      default:

    }
}

function error_handler(error){
    console.log(error);
}
