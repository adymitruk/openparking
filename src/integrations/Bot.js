/**
 * Bot base
 * @constructor
 */
function Bot() {
  this._patternHandlers = [];
}

/**
 * WireUp Bot
 * @param {Function} app Express App
 * @param {ViewEngine} viewEngine
 * @param {Function} handleRequest Request handler
 * @abstract
 */
Bot.prototype.wireUp = function(app, viewEngine, handleRequest) {
  throw new Error('wireUp not Implemented.');
};

Bot.prototype._registerPatternHandler = function(pattern, handler) {
  if (!(pattern instanceof RegExp))
    throw new TypeError("pattern should be a RegExp");
  if (!(handler instanceof Function))
    throw new TypeError("handler should be a function");

  this._patternHandlers.push([pattern, handler]);
};

Bot.prototype._handleText = function(source, text, cb) {
  for(var i = 0; i < this._patternHandlers.length; i++) {
    var elem = this._patternHandlers[i],
        pattern = elem[0],
        handler = elem[1];
    var m = pattern.exec(text);
    if (m) {
      var args = Array.prototype.slice.call(m, 1);
      args.push(cb);
      handler.apply({}, [source].concat(args));
      return;
    }
  }
};

module.exports = Bot;