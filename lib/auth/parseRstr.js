module.exports = function(rstr) {
	var tokenParsed = /<Assertion(.*)<\/Assertion>/.exec(rstr);

	if (!tokenParsed || tokenParsed.length == 0) {
		return;
	};

	return tokenParsed[0];
}