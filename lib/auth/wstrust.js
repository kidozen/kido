var request = require('request');
var parseRstr = require('./parseRstr.js');

require('simple-errors');
var rstTemplate = '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"><s:Header><a:Action s:mustUnderstand="1">http://docs.oasis-open.org/ws-sx/ws-trust/200512/RST/Issue</a:Action><a:To s:mustUnderstand="1">[To]</a:To><o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><o:UsernameToken u:Id="uuid-6a13a244-dac6-42c1-84c5-cbb345b0c4c4-1"><o:Username>[Username]</o:Username><o:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">[Password]</o:Password></o:UsernameToken></o:Security></s:Header><s:Body><trust:RequestSecurityToken xmlns:trust="http://docs.oasis-open.org/ws-sx/ws-trust/200512"><wsp:AppliesTo xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy"><a:EndpointReference><a:Address>[ApplyTo]</a:Address></a:EndpointReference></wsp:AppliesTo><trust:KeyType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Bearer</trust:KeyType><trust:RequestType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Issue</trust:RequestType><trust:TokenType>urn:oasis:names:tc:SAML:2.0:assertion</trust:TokenType></trust:RequestSecurityToken></s:Body></s:Envelope>';

exports.getToken = function (options, cb) {
	var message = getMessage(options);

	var req = {
		method: 'POST',
		body: message,
		uri: options.endpoint,
		headers: {
			"Content-Type": "application/soap+xml; charset=utf-8"
		}
	}

	request(req, function(err, response) {
		if (err || response.statusCode != 200) {
			cb(err || Error.create('Authentication Failed', { status: response.statusCode, body: response.body }));
			return;
		};

		var token = parseRstr(response.body);

		cb(null, token);
	})
}

function getMessage(options) {
	var message = rstTemplate;

	message = message.replace("[To]", options.endpoint);
	message = message.replace("[Username]", options.user);        
	message = message.replace("[Password]", options.pass);
	message = message.replace("[ApplyTo]", options.scope);

	return message;
}