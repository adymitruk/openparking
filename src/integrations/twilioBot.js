var util = require('util'),
    twilio = require('twilio');

var Bot = require('./Bot');
var errorMessage = 'There was a problem handling your request, please try again later.';

function smsTwiMLResponse(text) {
  return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Response>',
      '\t<Message>' + text + '</Message>',
      '</Response>'
  ].join('\n');
}

function TwilioChannel(res, twilio, from, to) {
  this._res = res;
  this._twilio = twilio;
  this._to = to;
  this._from = from;
}

TwilioChannel.prototype.sendMessage = function(message, cb) {
  if (this._res) {
    this._res.status(200).send(smsTwiMLResponse(message));
    this._res = null;
    if (cb)
      return cb();
    return;
  }
  this._twilio.messages.create({
    body: message,
    to: this._to,
    from: this._from
  }, cb);
};

TwilioChannel.prototype.sendError = function(err, cb) {
  console.log('ERROR:', err);
  this.sendMessage(errorMessage, cb);
};

function TwilioBot(sid, tkn, phoneNumber) {
  Bot.call(this);
  this._twilio = twilio(sid, tkn);
  this._phoneNumber = phoneNumber;
}
util.inherits(TwilioBot, Bot);

TwilioBot.prototype.wireUp = function(app, viewEngine, handleRequest) {
  app.post('/twilio/incoming', this._onMessage.bind(this));

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

      var text = renderText('twiliobot/park', response);
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

      var text = renderText('twiliobot/enforce', response);
      cb(null, text);
    });
  }
  this._registerPatternHandler(/^[Ee]nforce\s(\d+)$/, handleEnforce);
};

TwilioBot.prototype._onMessage = function(req, res) {
  var from = req.body.From,
      text = req.body.Body;
  var source = new TwilioChannel(res, this._twilio, this._phoneNumber, from);
  this._handleText(source, text, function(err, message) {
    if (err) {
      source.sendError(err);
      return;
    }
    source.sendMessage(message);
  });
};

/**
 * Create a TwilioBot
 * @param {string} sid
 * @param {string} tkn
 * @param {string} phoneNumber
 * @returns {TwilioBot}
 */
module.exports = function(sid, tkn, phoneNumber) {
  return new TwilioBot(sid, tkn, phoneNumber);
};