
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return "[" +[d.getDate(), months[d.getMonth()], time].join(' ')+ "] -";
}

/**
 * Unified error display method.
 **/
module.exports.logError = function(message) {
    console.error(timestamp(),"Error! ".red + message);
}

/**
 * Unified log method.
 **/
module.exports.logInfo = function() {
	var args = Array.prototype.slice.call(arguments);
	args.unshift(timestamp());
	console.info.apply(null, args);
}

