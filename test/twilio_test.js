function ViewEngineStub() {
  this.render = function(viewName, locals) {
    return [viewName, locals].join()
  }
}

function ResponseStub() {
  this.status = 0;
  this.output = '';

  var self = this;
  this.status = function(code) {
    self.status = code;
    return self;
  };
  this.send = function(text) {
    self.output = text;
    return self;
  }
}

function AppStub() {
  this._posts = {};

  var self = this;
  this.post = function(path, handler) {
    self._posts[path] = handler;
  };

  this.testPost = function(path, body) {
    var handler = self._posts[path];
    var req = {body: body};
    var res = new ResponseStub();
    handler(req, res);
    return res;
  };
}

module.exports = {
  setUp: function(cb) {
    var createTwilioBot = require('../src/integrations/twilioBot');

    var self = this;
    this.lastRequest = null;
    this.viewEngine = new ViewEngineStub();
    this.handleRequest = function(req, cb){
      self.lastRequest = req;
      cb(null, null);
    };
    this.appStub = new AppStub();
    this.twilioBot = createTwilioBot('sid', 'tkn', '+6045555555');
    this.twilioBot.wireUp(this.appStub, this.viewEngine, this.handleRequest);
    cb();
  },
  'Test Park message': function(test) {
    //Arrange
    test.expect(9);
    var parkMessage = 'park ABC123 2h at 1234';
    //Act
    var res = this.appStub.testPost('/twilio/incoming', {From: '+6045551234', Body: parkMessage});
    //Assert
    test.ok(this.lastRequest, "No last request.");
    if (this.lastRequest) {
      test.ok(this.lastRequest.$type === 'park', "Expect park request, got " + this.lastRequest.$type);
      test.ok(this.lastRequest.licensePlate === 'ABC123');
      test.ok(this.lastRequest.duration === '2');
      test.ok(this.lastRequest.durationUnit === 'h');
      test.ok(this.lastRequest.spot === '1234');
    }
    test.ok(res.status === 200, "Expect response status of 200, got " + res.status);
    test.ok(res.output.indexOf('<?xml version="1.0" encoding="UTF-8"?>') === 0, "Expected output of xml.");
    test.ok(res.output.indexOf('<Message>twiliobot/park.txt,</Message>') > 0, "Expected xml to contain message.");
    test.done();
  }
};