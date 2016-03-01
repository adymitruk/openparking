var uuid = require('uuid');

function SetUpParking() {
  this.id = uuid.v4();
  this.version = '1.0.0';
}

module.exports = SetUpParking;