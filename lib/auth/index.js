var request = require('request');

module.exports = function(domain, strictSSL) {
	var self = this;
	this.domain = domain;
	this.strictSSL = strictSSL;

	if (!this.domain) throw new Error("Missing hosting configuration.");

	this.login = function (credentials, cb) {
		self.getConfig(function(err, config) {
			if (err) { 
				cb(err); 
				return; 
			};

			getIpToken(credentials, config.authServiceScope, cb);
		});
	}

	this.getToken = function (credentials, appName, cb) {
		if (typeof appName == "function") {
			cb = appName;
			appName = undefined;
		};

		self.getConfig(appName, function(err, config) {
			if (err) {
				cb(err);
				return;
			};

			getIpToken(credentials, config.authServiceScope, function(err, ipToken) {
				if (err) {
					cb(err);
					return;
				};

				config.appScope = config.appScope || 'http://' + self.domain + '/';

				getKidozenToken(ipToken, config, cb);	
			});
		})
	}

	this.getConfig = function (appName, cb) {
		if (typeof appName == "function") {
			cb = appName;
			appName = undefined;
		};

		var configUrl = 'https://' + self.domain + "/publicapi/auth/config";

		if (appName) {
			configUrl = configUrl + "?app=" + appName;
		};

		request({ uri: configUrl, strictSSL: self.strictSSL }, function (err, res, body) {

			if (err || res.statusCode !== 200) {
				var r = Error.create('Unable to retrieve auth config', err || body);
				return cb(r);
			}

			var config;
			try {
				config = JSON.parse(body);
			}
			catch(e) {
				return cb(Error.create('Invalid auth config', e));
			}

			cb(null, config);
		});
	}

	this.getAuthHeader = function(kidoToken) {
		return 'WRAP access_token="' + kidoToken + '"';
	}

	function getIpToken(credentials, authServiceScope, cb) {

		if (!credentials || !credentials.ip) {
			return cb('Unable to retrieve credentials for authenticating.\n' +
				'Use `kido hosting [domain]`');
		}
		var options = {
			endpoint: credentials.ip.activeEndpoint,
			user: credentials.username,
			pass: credentials.password,
			scope: authServiceScope
		}

		var provider;

		if (credentials.ip.protocol.toLowerCase() == 'wrapv0.9') {
			provider = require('./wrap.js');
		}
		else {
			provider = require('./wstrust.js');
		}

		provider.getToken(options, cb);
	}

	function getKidozenToken(ipToken, config, cb) {
		var postRequest = {
			uri : config.authServiceEndpoint,
			method : "POST",
			form : {
				wrap_assertion : ipToken,
				wrap_scope : config.appScope,
				wrap_assertion_format : "SAML"
			},
			strictSSL: self.strictSSL
		};

		request(postRequest, function(err, res, body) {

			if (err || res.statusCode !== 200) {
				return cb(Error.create('Unable to authenticate.', err || body));
			}

			var tokenResponse;

			try {
				tokenResponse = JSON.parse(body);
			}
			catch(e) {
				return cb(Error.create('Invalid Kidozen token', body));
			}

			if (!tokenResponse.rawToken) {
				return cb("You don't have access to perform this action.");
			}

			var kidoToken = tokenResponse.rawToken;

			cb(null, kidoToken);
		});
	}
}