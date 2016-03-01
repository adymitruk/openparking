var util = require('util'),
    EventEmitter = require('events').EventEmitter;

function RtmClientStub() {
  var self = this;
  this.start = function() {};
  this.sendMessage = function(text, channel, cb) {
    self.messages.push([channel, text].join());
    if (cb)
      cb();
  };
  this.messages = [];
}
util.inherits(RtmClientStub, EventEmitter);

function ViewEngineStub() {
  this.render = function(viewName, locals) {
    return [viewName, locals].join()
  }
}

module.exports = {
  setUp: function(cb) {
    var slackClient = require('slack-client');
    slackClient.RtmClient = RtmClientStub;
    this.RTM_EVENTS = slackClient.RTM_EVENTS;
    var createSlackBot = require('../src/integrations/slackBot');

    var self = this;
    this.lastRequest = null;
    this.viewEngine = new ViewEngineStub();
    this.handleRequest = function(req, cb){
      self.lastRequest = req;
      cb(null, null);
    };
    this.twilioBot = createSlackBot('my-token');
    this.twilioBot.wireUp(null, this.viewEngine, this.handleRequest);
    this.rtmStub = this.twilioBot._rtm;
    cb();
  },
  'Test Park message': function(test) {
    //Arrange
    test.expect(8);
    //Act
    var parkMessage = 'park ABC123 2h at 1234';
    this.rtmStub.emit(this.RTM_EVENTS.MESSAGE, {channel: 'the-channel', text: parkMessage});
    //Assert
    test.ok(this.lastRequest, "No last request.");
    if (this.lastRequest) {
      test.ok(this.lastRequest.$type === 'park', "Expect park request, got " + this.lastRequest.$type);
      test.ok(this.lastRequest.licensePlate === 'ABC123');
      test.ok(this.lastRequest.duration === '2');
      test.ok(this.lastRequest.durationUnit === 'h');
      test.ok(this.lastRequest.spot === '1234');
    }
    test.ok(this.rtmStub.messages.length === 1, "Expected 1 message, got " + this.rtmStub.messages.length);
    test.ok(this.rtmStub.messages[0] === "the-channel,slackbot/park.txt,", this.rtmStub.messages[0]);
    test.done();
  }
};