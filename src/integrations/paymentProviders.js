var providerFactories = {
  'paypal': require('./paypal'),
  'stripe': require('./stripe'),
};

function initializePaymentProviders(paymentProvidersConfig, baseUrl) {
  var providers = {};
  for(var providerName in paymentProvidersConfig) {
    var factory = providerFactories[providerName];
    var args = paymentProvidersConfig[providerName];
    providers[providerName] = factory.apply(this, [baseUrl].concat(args));
  }
  return providers;
}

module.exports = initializePaymentProviders;