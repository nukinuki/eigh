var imgdir = "/img/";

var SINK_SPEED = 0.125; // 8 sec. how fast dices sink 
var RISE_SPEED = 2/3; // 1.5 sec. how fast dices rise
var SINK_HOP = 0.125; // = 1 sec of sink. how much dice moves up when chain increases
var THUNDERBOLT_TIME = 0.5; // seconds of animation
var ONES_REMOVE_TIME = 2; // how long activated dices stays on board

var MOVE_SPEED_1 = 1000/300; // 300 ms per square // 2100 ms per 7 squares
var MOVE_SPEED_2 = 1000/270; // 270 ms per square // 1900 ms per 7 squares
var MOVE_SPEED_3 = 1000/240; // 240 ms per square // 1700 ms per 7 squares
var MOVE_SPEED_4 = 1000/200; // 200 ms per square // 1400 ms per 7 squares
var MOVE_SPEED_5 = 1000/170; // 170 ms per square // 1200 ms per 7 squares

var CHAINED_DICE_PER_LEVEL = 15;
var CHAINED_DICE_PER_10_LEVELS = 5;

var SPAWN_TIME = 5 * 1000; // Default long spawn time in seconds
var DICES_UNTIL_LONG_SPAWN = 32; // Default number of dices on board to switch from short spawn to long

var DICE_PUSHDOWN = 0.08;

var TIME_LIMIT = 180; // 3 minutes for time limit game
var TIME_WARNING = 30; // when music changes

var config = new function(){
	this.init = function(){
		// Дополняем класс параметрами из вызова
		var properties = window.components.getProperties('config');
		$.extend(self, properties);
		window.components.loaded('config');
	}
}
window.components.require([], config.init);