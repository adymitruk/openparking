var path = require('path');
var fs = require('fs');
var HandleBars = require('handlebars');

function ViewEngine(viewRootPath) {
  this._viewRootPath = viewRootPath;
  this._templateCache = {};
}

ViewEngine.prototype.render = function(viewName, locals) {
  var template = this._getCompiledTemplate(viewName);
  return template(locals);
};

ViewEngine.prototype._getCompiledTemplate = function(relativePath) {
  var template = this._templateCache[relativePath];
  if (!template) {
    var view = this._loadView(path.join(this._viewRootPath, relativePath));
    template = HandleBars.compile(view);
    this._templateCache[relativePath] = template;
  }
  return template;
};

ViewEngine.prototype._loadView = function(path) {
  return fs.readFileSync(path).toString();
};


module.exports = function() {
  return new ViewEngine('./views');
};