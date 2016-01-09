eigh.config = {
	imgdir: "/img/",

	SINK_SPEED: 0.125, // 8 sec. how fast dices sink 
	RISE_SPEED: 2/3, // 1.5 sec. how fast dices rise
	SINK_HOP: 0.125, //= 1 sec of sink. how much dice moves up when chain increases
	THUNDERBOLT_TIME: 0.5, // seconds of animation
	ONES_REMOVE_TIME: 2, // how long activated dices stays on board

	CHAINED_DICE_PER_LEVEL: 15,
	CHAINED_DICE_PER_10_LEVELS: 5,

	SPAWN_TIME: 5 * 1000, // Default long spawn time in seconds
	DICES_UNTIL_LONG_SPAWN: 32, // Default number of dices on board to switch from short spawn to long

	DICE_PUSHDOWN: 0.08,

	TIME_LIMIT: 180, // 3 minutes for time limit game
	TIME_WARNING: 30 // when music changes
}

window.components.require([], function(){
	window.components.loaded('config');
});