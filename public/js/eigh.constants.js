eigh.constants = {
	DICE_PATTERNS: [
		'123','135','154','142',
		'263','231','214','246',
		'326','365','351','312',
		'415','456','462','421',
		'536','564','541','513',
		'653','632','624','645'
	],
	DICE_ORIENTS: [
		'110','001','330','021',
		'113','000','131','202',
		'120','123','122','121',
		'101','102','103','100',
		'002','331','022','111',
		'112','003','130','023'
	],
	KEY_LEFT: 37,
	KEY_UP: 38,
	KEY_RIGHT: 39,
	KEY_DOWN: 40,

	KEY_ESC: 27,
	KEY_SPACE: 32,

	ROTATION_DOWN: 0,
	ROTATION_RIGHT: Math.PI/2,
	ROTATION_UP: Math.PI,
	ROTATION_LEFT: 3 * Math.PI/2,
	ROTATION_FRONT: Math.PI/4,

	MOVE_SPEED_1: 1000/300, // 300 ms per square // 2100 ms per 7 squares
	MOVE_SPEED_2: 1000/270, // 270 ms per square // 1900 ms per 7 squares
	MOVE_SPEED_3: 1000/240, // 240 ms per square // 1700 ms per 7 squares
	MOVE_SPEED_4: 1000/200, // 200 ms per square // 1400 ms per 7 squares
	MOVE_SPEED_5: 1000/170 // 170 ms per square // 1200 ms per 7 squares
}

window.components.require([], function(){
	window.components.loaded('constants');
});