var request = require('request');
var parseRstr = require('./parseRstr.js');

exports.getToken = function (options, cb) {
 	
 	var req = {
 		uri: options.endpoint,
 		method: "POST",
 		form: {
        	wrap_name: options.user,
			wrap_password: options.pass,
			wrap_scope: options.scope
    	}
    }

	request(req, function(err, response) {
		if (err || response.statusCode != 200) {
			cb(err || Error.create('Authentication Failed', { status: response.statusCode, body: response.body }));
			return;
		};

		var token = parseRstr(response.body);

		cb(null, token);
	});
}