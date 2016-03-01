var util = require('util');

function WebChannel() {
  this.sendError = function(){};
  this.sendMessage = function(){};
}

function Web() {
}

Web.prototype.wireUp = function(app, viewEngine, handleRequest) {
  if (typeof app !== 'function') throw new TypeError('app must be a function.');
  if (typeof handleRequest !== 'function') throw new TypeError('handleRequest must be a function.');

  //Using express built-in view rendering instead of viewEngine here
  function renderHtml(res, viewName, locals) {
    return res.render(viewName + '.html', locals);
  }
  /*
  function renderHtml(res, viewName, locals) {
    res.contentType('text/html');
    var text = viewEngine.render(viewName + '.html', locals);
    res.send(text);
  }
  */

  function handleRoot(req, res) {
    return res.redirect('/web/home')
  }
  app.get('/', handleRoot);

  var handleHome = function(req, res) {
    renderHtml(res, 'web/home');
  };
  app.get('/web/home', handleHome);

  function handlePark(req, res) {
    var request = {
      $type: 'park',
      $source: new WebChannel(),
      licensePlate: req.body.licensePlate,
      duration: req.body.duration,
      durationUnit: req.body.durationUnit,
      spot: req.body.spot
    };
    handleRequest(request, function(err, response) {
      if (err) {
        console.log('ERROR:', err);
        res.status(500);
        return renderHtml(res, '500', {error: err});
      }
      if (response.link) {
        return res.redirect(response.link);
      }
      renderHtml(res, 'web/park', response);
    })
  }
  app.post('/web/park', handlePark);

  function handleEnforce(req, res) {
    var request = {
      $type: 'enforce',
      $source: new WebChannel(),
      spot: req.params.spot
    };
    handleRequest(request, function(err, response) {
      if (err) {
        console.log(err);
        res.status(500);
        return renderHtml(res, '500', {error: err});
      }
      renderHtml(res, 'web/enforce', response);
    });
  }
  app.get('/web/enforce/:spot', handleEnforce);
};

module.exports = function() {
  return new Web();
};