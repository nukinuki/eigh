// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};
function leadingZeroes(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

var utils = new function(){
	this.init = function(){
		// Дополняем класс параметрами из вызова
		var properties = window.components.getProperties('utils');
		$.extend(self, properties);
		window.components.loaded('utils');
	}
}
window.components.require([], utils.init);