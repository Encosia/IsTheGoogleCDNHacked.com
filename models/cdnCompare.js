var request = require('request');

var urls = {
	googleCdn: {
		debug: 'http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.js',
		production: 'http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js'
	},
	official: {
		debug: 'http://code.jquery.com/jquery-1.11.0.js',
		production: 'http://code.jquery.com/jquery-1.11.0.min.js'
	}
}

var cachedLookup;

function compare(officialCopy, cdnCopy) {
	// Remove newlines to avoid meaningless false positives.
	officialCopy = officialCopy.replace(/\n/g, '');
	cdnCopy = cdnCopy.replace(/\n/g, '');

  // Spaces are also meaningless for our purposes here, but
  //  the difference between ANSI and UTF-8 spaces causes inequality.
  officialCopy = officialCopy.replace(/\s/g, '');
  cdnCopy = cdnCopy.replace(/\s/g, '');
	
	return officialCopy === cdnCopy;
}

function performComparison(callback) {
  request(urls.googleCdn.production, function(error, response, body) {
    var cdn = body;

    request(urls.official.production, function(error, response, official) {
      var status = compare(official, cdn);

      if (status)
        status = { result: false, verdict: 'Nope' };
      else
        status = { result: true, verdict: 'Maybe' };

      status.lastCheckedAt = new Date();

      cachedLookup = status;

      // Refresh the cached comparison in 30 minutes.
      setTimeout(performComparison, 1000 * 60 * 30);

      if (typeof callback == 'function')
        callback(status);
    });
  });
}

exports.isTheGoogleCDNHacked = function(callback) {
  if (cachedLookup) {
    callback(cachedLookup);
  } else {
    performComparison(function() {
      callback(cachedLookup);
    });
  }
};