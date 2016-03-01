var uuid = require('uuid'),
    when = require('when');

var configName = process.argv[2];
if (!configName) {
  console.log('Usage:', process.argv[0], process.argv[1], '[vendor]');
  return;
}

function generateBaseUrl(config) {
  var protocol = config.useHttps ? 'https' : 'http';
  var port;
  if (config.useHttps && config.httpPort !== 443)
      port = config.httpPort;
  if (!config.useHttps && config.httpPort !== 80)
      port = config.httpPort;
  return [
    protocol,
    '://',
    config.publicHostname,
    port ? ':' + port : ''
  ].join('');
}

var express = require('express');
var exphbs  = require('express-handlebars');
var createGoesClient = require('./integrations/goesClient');
var createGoesReader = require('./integrations/goesReader');
var createViewEngine = require('./integrations/viewEngine');
var createController = require('./controller.js');

function wireUp(config) {
  var baseUrl = generateBaseUrl(config);
  var paymentProviders = require('./integrations/paymentProviders.js')(config.paymentProviders, baseUrl);
  var uiProviders = require('./integrations/uiProviders.js')(config.uiProviders);
  var goesClient = createGoesClient(config.goesUrl);
  var goesReader = createGoesReader(config.goesStoragePath);
  var controller = createController(goesClient, goesReader, paymentProviders, config);

  var app = express();
  app.use(require('body-parser').urlencoded({extended: true}));
  app.engine('html', exphbs({defaultLayout: 'main.html'}));

  for (var providerName in paymentProviders) {
    paymentProviders[providerName].wireUp(app);
  }

  var viewEngine = createViewEngine();
  for (var providerName in uiProviders) {
    var ui = uiProviders[providerName];
    ui.wireUp(app, viewEngine, controller.handleRequest.bind(controller));
  }

  function listening() {
    console.log('App ready and listening on port', config.httpPort);
  }

  if (config.useHttps) {
    var https = require('https');
    var fs = require('fs');
    var key = fs.readFileSync(config.keyFile);
    var cert = fs.readFileSync(config.certFile);
    https.createServer({
      key: key,
      cert: cert
    }, app).listen(config.httpPort, listening);
  } else {
    app.listen(config.httpPort, listening);
  }
}

var config = require('../config/' + configName + '.json');
wireUp(config);