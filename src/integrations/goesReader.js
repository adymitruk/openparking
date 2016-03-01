var fs = require('fs'),
    path = require('path');

function GoesStorageReader(storagePath) {
  var stat = fs.statSync(storagePath);
  if (!stat.isDirectory()) {
    throw new Error('storagePath is not a directory.');
  }
  this._storagePath = storagePath;
}

var timeRegEx = /^(\d{2})(\d{\2})(\d{\2})(\d{\3})/;
function rebuildDate(date, time) {
  var match = timeRegEx.exec(time);
  if (!match) return null;

  var h = parseInt(match[1]),
      m = parseInt(match[2]),
      s = parseInt(match[3]),
      ms = parseInt(match[4]);

  return new Date(date.getFullYear(), date.getMonth(), date.getDay(), h, m, s, ms);
}

function readEvent(folderPath, filename, date, cb) {
  var parts = filename.split('_'),
      timePart = parts[0],
      typeId = parts[1],
      filePath = path.join(folderPath, filename);

  fs.readFile(filePath, function(err, data) {
    if (err) {
      return cb(err);
    }
    var storedEvent = {
      streamId: '',
      creationTime: rebuildDate(date, timePart),
      typeId: typeId,
      payload: JSON.parse(data)
    };
    cb(null, storedEvent);
  });
}

GoesStorageReader.prototype.getAllForDate = function(date, cb) {
  try {
    var month = date.getMonth() + 1,
        formattedYearMonth = [date.getFullYear(), month<10?'0':'', month].join(''),
        formattedDate = [date.getDate()<10?'0':'', date.getDate()].join(''),
        folderPath = path.join(this._storagePath, formattedYearMonth, formattedDate);

    function handleError(err) {
      if (err.code === 'ENOENT')
          return cb(null, []);
      return cb(err);
    }

    fs.readdir(folderPath, function (err, files) {
      if (err) return handleError(err);

      var events = [];

      function done(err, ev) {
        if (err) return cb(err);

        events.push(ev);
        if (events.length >= files.length) {
          cb(null, events);
        }
      }

      files.forEach(function (f) {
        readEvent(folderPath, f, date, done);
      });
    })
  }
  catch(e) {
    cb(e);
  }
};

module.exports = function(storagePath) {
  return new GoesStorageReader(storagePath);
};