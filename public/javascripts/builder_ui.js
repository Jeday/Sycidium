var state = {
  main_title: "",
  polls: []
};

var vw = new Vue({
  el: "#app",
  data: {
    state: state,
    errorText: "",
    showError: false
  },
  methods: {
    addPoll: function(e) {
      this.state.polls.push({ title: "", options: [] });
    },
    deletePoll: function(index) {
      this.state.polls.splice(index, 1);
    },
    submit: function() {
      var data = {
        main_title: this.state.main_title,
        password: this.state.password,
        polls: this.state.polls.map(poll => ({
          title: poll.title,
          options: poll.options.map(option => ({
            title: option.title
          }))
        }))
      };

      var xhr = new XMLHttpRequest();
      let component = this;
      xhr.onload = function() {
        let data = JSON.parse(xhr.responseText);
        if (data.result == "error") {
          component.errorText = data.errorText;
          component.showError = true;
        } else if ((data.result = "succes")) {
          window.location.href = "/index";
        }
      };
      xhr.open("POST", "/submit_poll", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(data));
    }
  },
  template: `
  <md-content class="app-container">
        <h1>Poll Builder</h1>
        <md-content class="main-title-container md-elevation-4">
          <md-field class="input-field" md-inline>
            <label>Name your session</label>
            <md-input v-model.trim="state.main_title" ></md-input>
          </md-field>
          <md-field class="input-field" md-inline>
            <label>Password for session</label>
            <md-input v-model="state.password" type="password"></md-input>
          </md-field>
        </md-content>
        <div class="md-layout md-gutter polls-container">


          <pollBuilder v-for="(poll,index) in state.polls" :key="'poll'+index" v-bind:poll.sync="poll" class="md-layout-item md-size-20">
            <md-button v-on:click="deletePoll(index)" class="md-icon-button md-primary delete-poll-button">
              <md-icon>remove</md-icon>
            </md-button>
          </pollBuilder>

        </div>
        <div class="button-container">
           <md-button v-on:click="addPoll" class="md-icon-button md-raised md-primary add-poll-button">
            <md-icon>add</md-icon>
          </md-button>
          <md-button class="md-raised md-primary" v-on:click="submit()">Submit</md-button>
        </div>
        <md-snackbar :md-active.sync="showError" md-persistent>
          <span>{{errorText}}</span>
        </md-snackbar>
  </md-content>
  `
});

Vue.component("pollBuilder", {
  props: ["poll"],

  methods: {
    addOption: function() {
      this.poll.options.push({ title: "" });
    },
    deleteOption: function(index) {
      this.poll.options.splice(index, 1);
    }
  },
  template: `
    <md-content class="poll-container md-elevation-4">
      <slot></slot>
      <div class="poll-title">
        <md-field class="poll-input-title input-field md-inline">
          <label>Poll name</label>
          <md-input v-model.trim="poll.title"></md-input>
        </md-field>

      </div>
      <md-list v-if="poll.options.length" class="options-container md-elevation-4">
          <template  v-for="(option,index) in poll.options">
            <md-list-item>
              <md-field class="poll-input-option-title md-inline input-field">
                <label>Option name</label>
                <md-input v-model.trim="option.title"></md-input>
              </md-field>
              <md-button v-on:click="deleteOption(index)" class="md-icon-button md-dense md-primary delete-option-button">
                <md-icon>remove</md-icon>
              </md-button>
            </md-list-item>
          </template>
      </md-list>
      <div class="button-container">
        <md-button v-on:click="addOption" class="md-icon-button md-dense md-primary add-option-button">
          <md-icon>add</md-icon>
        </md-button>
      </div>

    </md-content>

  `
});
