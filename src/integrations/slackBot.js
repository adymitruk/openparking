var util = require('util'),
    slack_client = require('slack-client'),
    RtmClient = slack_client.RtmClient,
    RTM_EVENTS = slack_client.RTM_EVENTS;

var Bot = require('./Bot');

var errorMessage = 'There was a problem handling your request, please try again later.';

function SlackChannel(rtm, channel) {
  if (!(rtm instanceof RtmClient)) throw new TypeError('rtm must be an RtmClient.');
  if (typeof channel !== 'string') throw new TypeError('channel must be a string.');
  if (channel === '') throw new Error("channel chan't be empty.");

  this._rtm = rtm;
  this._channel = channel;
}

/**
 * Send a message on the channel
 * @param {string} message Message to send
 * @param {function} [cb] Callback invoked with error or when message is sent
 */
SlackChannel.prototype.sendMessage = function(message, cb) {
  if (typeof message !== 'string') throw new TypeError('message must be a string.');
  if (message === '') throw new Error("message chan't be empty.");

  this._rtm.sendMessage(message, this._channel, cb);
};

SlackChannel.prototype.sendError = function(err, cb) {
  console.log('ERROR:', err);
  this._rtm.sendMessage(errorMessage, this._channel, cb);
};

/**
 * SlackBot
 * @constructor
 * @extends {Bot}
 */
function SlackBot(slackApiToken) {
  if (typeof slackApiToken !== 'string') throw new TypeError('slackApiToken must be a string.');
  if (slackApiToken === '') throw new Error("slackApiToken chan't be empty.");

  Bot.call(this);

  this._rtm = new RtmClient(slackApiToken, {logLevel: 'error'});
  this._rtm.on(RTM_EVENTS.MESSAGE, this._onMessage.bind(this));
  var self = this;
  this.connected = false;
  this._rtm.on(RTM_EVENTS.RTM_CONNECTION_OPENED, function() {
    self.connected = true;
  });
  this._rtm.start();
}
util.inherits(SlackBot, Bot);

SlackBot.prototype.wireUp = function(app, viewEngine, handleRequest) {
  function renderText(viewName, locals) {
    return viewEngine.render(viewName + '.txt', locals);
  }

  function handlePark(source, licensePlate, duration, durationUnit, spot, cb) {
    var request = {
      $type: 'park',
      $source: source,
      licensePlate: licensePlate,
      duration: duration,
      durationUnit: durationUnit,
      spot: spot
    };
    handleRequest(request, function(err, response) {
      if (err) return cb(err);

      var text = renderText('slackbot/park', response);
      cb(null, text);
    });
  }
  this._registerPatternHandler(/^[Pp]ark\s([A-Za-z0-9]{2,8})\s(\d{1,3})([hm])\sat\s(\d+)$/, handlePark);

  function handleEnforce(source, spot, cb) {
    var request = {
      $type: 'enforce',
      $source: source,
      spot: spot
    };
    handleRequest(request, function(err, response) {
      if (err) return cb(err);

      var text = renderText('slackbot/enforce', response);
      cb(null, text);
    });
  }
  this._registerPatternHandler(/^[Ee]nforce\s(\d+)$/, handleEnforce);
};

SlackBot.prototype._onMessage = function(msg) {
  var source = new SlackChannel(this._rtm, msg.channel);
  this._handleText(source, msg.text, function(err, message) {
    if (err) {
      source.sendError(err);
      return;
    }
    source.sendMessage(message);
  });
};

/**
 * SlackBot factory method
 * @param {string} slackApiToken
 * @returns {SlackBot}
 */
module.exports = function(slackApiToken) {
  return new SlackBot(slackApiToken);
};