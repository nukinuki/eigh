/* Keyboard buffer. Make arrow keys work as supposed */

eigh.keyboard = new function(){
	var KCODES = {
		'LEFT': 37,
		'UP': 38,
		'RIGHT': 39,
		'DOWN': 40
	}
	this.KCODES = KCODES;
	var keystate = [];
	var keyhold = [];
	var queue = [];
	var t = this;

	var Clock = new THREE.Clock();
	Clock.start(); 

	this.init = function(){
		// Дополняем класс параметрами из вызова
		var properties = window.components.getProperties('keyboard');
		$.extend(self, properties);

		$.each(KCODES, function(key, value){
			keystate[value] = false; // init to Not Pressed
			keyhold[value] = 0; // init to Not Pressed
		});

		$(document).on('keydown', function(event){
			if(!keystate[event.keyCode]) t.addToQueue(event.keyCode);
			keystate[event.keyCode] = true;

			if(!keyhold[event.keyCode])
				keyhold[event.keyCode] = Clock.getElapsedTime();
		});
		$(document).on('keyup', function(event){
			keystate[event.keyCode] = false;
			keyhold[event.keyCode] = undefined;
		});
		window.components.loaded('keyboard');
	}

	this.resetHoldTime = function(){
		keyhold = [];
	}

	this.isPressed = function(key){
		return keystate[KCODES[key]];
	}
	this.holdTime = function(key){
		if(keyhold[KCODES[key]]){
			return Clock.getElapsedTime() - keyhold[KCODES[key]];
		} else {
			return 0;
		}
		
	}
	this.addToQueue = function(key){
		if(queue.length >= 10){
			queue.shift();
		}
		queue.push(key);
	}
	this.getQueue = function(){
		return queue;
	}
	this.clearQueue = function(){
		queue = [];
	}
	this.getLastKey = function(){
		return queue[queue.length - 1];
	}
	this.resetStates = function(){
		$.each(KCODES, function(key, value){
			keystate[value] = false; // init to Not Pressed
		});
	}
	this.isActionKeyPressed = function(){
		return (keystate[KCODES.UP] || keystate[KCODES.DOWN] || keystate[KCODES.LEFT] || keystate[KCODES.RIGHT]);
	}
}
//var Keyboard = eigh.keyboard; // should replace everywhere, actually
window.components.require([], eigh.keyboard.init);