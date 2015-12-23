var DICE_PATTERNS = [
	'123','135','154','142',
	'263','231','214','246',
	'326','365','351','312',
	'415','456','462','421',
	'536','564','541','513',
	'653','632','624','645'
];
var DICE_ORIENTS = [
	'110','001','330','021',
	'113','000','131','202',
	'120','123','122','121',
	'101','102','103','100',
	'002','331','022','111',
	'112','003','130','023'
];
var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;

var KEY_ESC = 27;
var KEY_SPACE = 32;

var ROTATION_DOWN = 0;
var ROTATION_RIGHT = Math.PI/2;
var ROTATION_UP = Math.PI;
var ROTATION_LEFT = 3 * Math.PI/2;
var ROTATION_FRONT = Math.PI/4;

var constants = new function(){
	this.init = function(){
		// Дополняем класс параметрами из вызова
		var properties = window.components.getProperties('constants');
		$.extend(self, properties);
		window.components.loaded('constants');
	}
}
window.components.require([], constants.init);