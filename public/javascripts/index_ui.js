var vw = new Vue({
  el: "#app",
  data: {
    state: {},
    dialog: {
      isActive: false,
      password: "",
      poll_title: "",
      index: -1,
      id: ""
    },
    showError: false,
    errorText: ""
  },
  created: function() {
    var req = new XMLHttpRequest();
    req.open("GET", "/all_polls", true);
    req.onload = function(ev) {
      vw.state = JSON.parse(req.response);
    };
    req.send();
  },
  methods: {
    ShowPasswordDialog: function(index) {
      this.dialog.poll_title = this.state.available[index].main_title;
      this.dialog.index = index;
      this.dialog.password = "";
      this.dialog.id = this.state.available[index].id;
      this.dialog.isActive = true;
    },
    StartPoll: function() {
      data = {
        id: this.dialog.id,
        password: this.dialog.password
      };

      var xhr = new XMLHttpRequest();
      let component = this;
      xhr.onload = function() {
        let data = JSON.parse(xhr.responseText);
        if (data.result == "error") {
          component.errorText = data.errorText;
          component.showError = true;
        } else if ((data.result = "succes")) {
          window.location.href = "/" + data.link;
        }
      };
      xhr.open("POST", "/start_poll", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(data));
      this.dialog.isActive = false;
    }
  },
  computed: {
    ongoingLength: function() {
      return this.state.ongoing ? this.state.ongoing.length : 0;
    },
    availableLength: function() {
      return this.state.available ? this.state.available.length : 0;
    }
  },
  template: `
  <md-content class="app-container">
       <h1 class="main-title">
          Sycidium
       </h1>
       <div class="data-container md-layout md-alignment-top-space-around">
         <div class="md-layout-item md-elevation-4 md-size-25 ongoing-list">
         <md-toolbar>
            <span class="md-title">Ongoing polls</span>
          </md-toolbar>
          <md-list>
            <template v-if="ongoingLength">
             <md-list-item v-for="(poll,index) in state.ongoing" :key="'gopoll'+index"  :href="poll.link" target="_self">
               {{poll.main_title}}
             </md-list-item>
            </template>
            <template v-else>
                <md-list-item>
                  No ongoing polls right now
                </md-list-item>
            </template>
          </md-list>
        </div>
        <div class="md-layout-item md-elevation-4 md-size-25 ongoing-list">
        <md-toolbar>
           <span class="md-title">Available polls</span>
           <div class="md-toolbar-section-end">
            <md-button class="md-icon-button" href="/build_poll">
              <md-icon>add</md-icon>
            </md-button>
          </div>
         </md-toolbar>
         <md-list>
           <template v-if="availableLength">
           <md-list-item v-for="(poll,index) in state.available" :key="'avbpoll'+index" @click="ShowPasswordDialog(index)">
             {{poll.main_title}}
           </md-list-item>
           </template>
           <template v-else>
               <md-list-item>
                 No added polls
               </md-list-item>
           </template>
       </md-list>
       </div>
      </div>
       <md-dialog :md-active.sync="dialog.isActive">
        <div class="dialog-content">
          <h3>Do you want start poll:"{{dialog.poll_title}}" </h3>
          <md-field>
            <label>Poll password</label>
            <md-input v-model="dialog.password" type="password"></md-input>
          </md-field>
        </div>
        <md-dialog-actions>
          <md-button class="md-primary" @click="dialog.isActive = false">Cancel</md-button>
          <md-button class="md-primary" @click="StartPoll()">Start</md-button>
        </md-dialog-actions>
      </md-dialog>
      <md-snackbar :md-active.sync="showError" md-persistent>
        <span>{{errorText}}</span>
      </md-snackbar>
  </md-content>
  `
});
