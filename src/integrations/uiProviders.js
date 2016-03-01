var factories = {
  "slack": require('./slackBot'),
  "twilio": require('./twilioBot'),
  "web": require('./web')
};

function initializeProviders(botProviders) {
  var providers = {};
  for(var providerName in botProviders) {
    var factory = factories[providerName];
    var args = botProviders[providerName];
    providers[providerName] = factory.apply(this, args);
  }
  return providers;
}

module.exports = initializeProviders;