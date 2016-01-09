/* Touch controller */

eigh.touch = new function(){

	var lastX,
		lastY,
		lastDirection,
		lastTimestamp,
		THRESHOLD = 2,
		HOLD_TIME = 30,
		pushingDirection,
		pushingTimestamp;


	function getDirection(newtouches){
		if(newtouches.length == 1){
			if(lastX !== undefined){
				var dx = newtouches[0].clientX - lastX,
					dy = newtouches[0].clientY - lastY;
				//console.log(dx + ', ' + dy);
				if(dx >= THRESHOLD && dy >= THRESHOLD){
					return 'right';
				}
				if(dx <= -THRESHOLD && dy <= -THRESHOLD){
					return 'left';
				}
				if(dx <= -THRESHOLD && dy >= THRESHOLD){
					return 'down';
				}
				if(dx >= THRESHOLD && dy <= -THRESHOLD){
					return 'up';
				}
				return 'hold';
			}
		}
		return false;
	}

	function isTimestampValid(){
		var d = new Date();
		return (lastTimestamp + HOLD_TIME >= d.getTime());
	}

	this.isTimestampValid = function(){
		var d = new Date();
		console.log(lastTimestamp + HOLD_TIME, d.getTime());
		return (lastTimestamp + HOLD_TIME >= d.getTime());
	}

	this.initDOMEvents = function(){
		$('#gamescreen').on('touchstart', function(e){
			var newtouches = e.originalEvent.touches;
			if(newtouches.length == 1){
				lastX = newtouches[0].clientX;
				lastY = newtouches[0].clientY;
				pushingDirection = false;
				pushingTimestamp = false;
			}
		});

		$('#gamescreen').on('touchmove', function(e){
			var newtouches = e.originalEvent.touches;
			var direction = getDirection(newtouches);

			var d = new Date();

			//lastTimestamp = e.timeStamp;
			lastTimestamp = d.getTime();

			lastX = newtouches[0].clientX;
			lastY = newtouches[0].clientY;
			//console.log(direction);
			if(direction !== false){
				e.preventDefault();
				if(direction != 'hold'){
					lastDirection = direction;
					if(direction != pushingDirection){
						pushingDirection = direction;
						pushingTimestamp = lastTimestamp;
					}
				}	
			} else {
				lastDirection = false;
				pushingDirection = false;
				pushingTimestamp = false;
			}
			
			//console.log(lastDirection, lastX, lastY);
		});
		$('#gamescreen').on('touchend', function(e){
			lastX = undefined;
			lastY = undefined;
			lastDirection = undefined;
			pushingDirection = false;
			pushingTimestamp = undefined;
		});
	}

	this.init = function(){
		// Дополняем класс параметрами из вызова
		var properties = window.components.getProperties('touch');
		$.extend(self, properties);
		//self.initDOMEvents();
		window.components.loaded('touch');
	}

	this.isUp = function(){
		return (isTimestampValid() && lastDirection == 'up');
	}
	this.isDown = function(){
		return (isTimestampValid() && lastDirection == 'down');
	}
	this.isLeft = function(){
		return (isTimestampValid() && lastDirection == 'left');
	}
	this.isRight = function(){
		return (isTimestampValid() && lastDirection == 'right');
	}
	this.isMoving = function(){
		return (isTimestampValid() && lastDirection != false);
	}
	this.holdTime = function(direction){
		direction = direction.toLowerCase();
		var d = new Date();
		if(direction == pushingDirection){
			return 0.0 + (d.getTime() - pushingTimestamp)/1000;
		} else {
			return 0.0;
		}
	}
	this.resetHoldTime = function(){
		pushingTimestamp = undefined;
		pushingDirection = false;
	}
	this.log = function(){
		console.log(lastX,
		lastY,
		lastDirection,
		lastTimestamp,
		pushingDirection,
		pushingTimestamp);
		console.log(isTimestampValid(), this.isMoving(), this.isUp(), this.isDown(), this.isLeft(), this.isRight());
	}
}

window.components.require(['scene'], eigh.touch.init);