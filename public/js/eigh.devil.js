var Devil = function(){
	var Mesh = new THREE.Mesh(Geometries.aqui, Materials.aquired);
	Mesh.material.materials[0].morphTargets = true;
	this.Mesh = Mesh;
	var t = this;

	this.yOnDice = 1;

	Mesh.scale.x = 0.6;
	Mesh.scale.y = 0.6;
	Mesh.scale.z = 0.6;

	Mesh.position.x = 0;
	Mesh.position.z = 0;
	Mesh.position.y = this.yOnDice; // above the Dice

	scene.add(Mesh);

	this.boardx = 3;
	this.boardy = 3;

	this.isOnDice = true;
	this.activeDice;
	this.isPushing = false;

	this.MOVE_SPEED = MOVE_SPEED_4;

	this.action = 'stand';
	
	this.rotation = 'DOWN'; // facing down
	this.lastRotationClockwise = true;
	this.rotationAnimation = false; // index of current rotation animation in queue. For cancelling. 
	
	this.animations = {
		stand: new keyframeAnimation({
			frames: 20,
			offset: 0,
			duration: 1,
			mesh: Mesh
		}),
		walk: new keyframeAnimation({
			frames: 16,
			offset: 20,
			duration: 2 / this.MOVE_SPEED,
			mesh: Mesh
		})
	}
	
	this.stopAllAnimations = function(){
		//console.log('stop all');
		$.each(this.animations, function(key, animation){
			animation.stop();
			//console.log('stop one');
		});
	}
	
	this.animations.stand.play();
	
	this.setPosition = function(x, y){
		if(x === undefined && y === undefined){
			var spot = Board.getRandomBusySpot();
			var x = spot.x;
			var y = spot.y;
		}
		this.boardx = x;
		this.boardy = y;
		var dice = Board.getDiceAt(x, y);
		if(dice == 0) this.isOnDice = false; else this.isOnDice = true;
		this.activeDice = dice;

		Mesh.position.x = -3 + x + 0.2;
		Mesh.position.z = -3 + y + 0.2;
		if(this.isOnDice) Mesh.position.y = this.yOnDice; else Mesh.position.y = this.yOnDice - 1;
	};

	this.setOnDice = function(){
		var spot = Board.getRandomBusySpot();
		this.setPosition(spot.x, spot.y);
	}

	this.setOnFloor = function(){
		var spot = Board.getRandomFreeSpot();
		this.setPosition(spot.x, spot.y);
	}

	this.setOnDice(); // On random dice by default;

	this.canMove = function(direction){
		var canmove = true;
		var nextx = Mesh.position.x;
		var nexty = Mesh.position.z;
		var delta = SPF * this.MOVE_SPEED;

		switch(direction){
			case 'LEFT':
				nextx = Mesh.position.x - delta;
				break
			case 'UP':
				nexty = Mesh.position.z - delta;
				break
			case 'RIGHT':
				nextx = Mesh.position.x + delta;
				break
			case 'DOWN':
				nexty = Mesh.position.z + delta;
				break
		}

		// Check dices
		if(this.isOnDice){

			this.isPushing = false;

			var nextdice = Board.getDiceAtPos(nextx, nexty);
			var dice = Board.getDiceAtPos(Mesh.position.x, Mesh.position.z);
			//console.log(dice);

			if(dice.animation_started){
				// Cant move while on flipping dice
				// But can reverse current flip
				if((dice.flip_direction == 'up' && direction == 'DOWN') ||
					(dice.flip_direction == 'left' && direction == 'RIGHT') ||
					(dice.flip_direction == 'down' && direction == 'UP') ||
					(dice.flip_direction == 'right' && direction == 'LEFT')){
					if(!dice.reverse){
						//console.log('REVERSE!');
						dice.reverse = true;
						var new_direction;
						if(dice.flip_direction == 'up'){
							new_direction = 'down';
						} else if (dice.flip_direction == 'down'){
							new_direction = 'up';
						} else if (dice.flip_direction == 'left'){
							new_direction = 'right';
						} else {
							new_direction = 'left';
						}
						dice.setDirection(new_direction);
					}
				}
				return false; 
			}

			if(nextdice === undefined) return false; // floor is 0, undefined is edge. Cant move.

			if(nextdice == 0){ // is floor
				if(!dice.props.canWalkOff) canmove = false;
				if(dice.props.canFlip) dice.flip(direction);
				if(dice.props.canWalkOff) sfx('hop');
			}
			if(typeof nextdice == 'object'){

				if(nextdice.props.regular && !dice.props.canClimbOff) return false;
				if(dice.props.regular && !nextdice.props.canWalkOn) canmove = false;
				if(dice.props.canFlip && nextdice.props.canBeErased){
					nextdice.remove();
					dice.flip(direction);
					return false; 
				}
				if(dice.props.canFlip && nextdice.props.canBeExchanged){
					// Exchange is handled by dice.setDirection()
					dice.flip(direction);
					return false; 
				}
				if(dice.props.rising && nextdice.props.sinking) return false;

				if(dice != nextdice){
					dice.leave();
					nextdice.enter();
				}
			}
		} else { // is on floor
			var nextdice = Board.getDiceAtPos(nextx, nexty);
			if(nextdice === undefined) return false; // floor is 0, undefined is edge. Cant move.
			if(typeof nextdice == 'object'){
				if(!nextdice.props.canJumpOn){
					canmove = false;
				}
				if(nextdice.props.canMove){
					if(this.isPushing != direction){
						this.isPushing = direction;
						Keyboard.resetHoldTime();
						Touch.resetHoldTime();
					}
					//console.log(Keyboard.holdTime(direction), Touch.holdTime(direction));
					if(Keyboard.holdTime(direction) >= 2 / (t.MOVE_SPEED)
						|| Touch.holdTime(direction) >= 2 / (t.MOVE_SPEED)) {
						nextdice.push(direction); // Can push only after some time, let's suppose it's speed dependant
					}
				}
				// Can move to the any other dice
				if(canmove) sfx('yup');
			}
		}
		return canmove;
	}

	
	this.updateRotation = function(direction){
		if(this.rotation == direction) return;
		var clockwise = this.lastRotationClockwise;
		switch(direction){
			case 'LEFT':
				if(this.rotation == 'DOWN') clockwise = true;
				if(this.rotation == 'UP') clockwise = false;
				this.rotateTo(ROTATION_LEFT, clockwise);
				break;
			case 'UP':
				if(this.rotation == 'LEFT') clockwise = true;
				if(this.rotation == 'RIGHT') clockwise = false;
				this.rotateTo(ROTATION_UP, clockwise);
				break;
			case 'RIGHT':
				if(this.rotation == 'UP') clockwise = true;
				if(this.rotation == 'DOWN') clockwise = false;
				this.rotateTo(ROTATION_RIGHT, clockwise);
				break;
			case 'DOWN':
				if(this.rotation == 'RIGHT') clockwise = true;
				if(this.rotation == 'LEFT') clockwise = false;
				this.rotateTo(ROTATION_DOWN, clockwise);
		}
		this.rotation = direction;
	}
	this.rotateTo = function(angle, clockwise, state){
		if(!state){
			if(t.rotationAnimation != false) Animations.cancel(t.rotationAnimation);
			t.rotationAnimation = Animations.start(function(){
				t.rotateTo(angle, clockwise, 1)
			});
			return;
		}
		t.rotationAnimation = false;
		var speed = t.MOVE_SPEED * Math.PI;
		if(clockwise){
			t.Mesh.rotation.y -= SPF * speed;
			if(angle != 0) {
				if(t.Mesh.rotation.y < 0) t.Mesh.rotation.y += (Math.PI * 2);
			}
			if(t.Mesh.rotation.y < angle){
				t.Mesh.rotation.y = angle;
				return;
			}
		} else {
			t.Mesh.rotation.y += SPF * speed;
			if(t.Mesh.rotation.y > (Math.PI * 2)) t.Mesh.rotation.y -= (Math.PI * 2);
			if(t.Mesh.rotation.y > angle){
				t.Mesh.rotation.y = angle;
				return;
			}
		}
		t.rotationAnimation = Animations.start(function(){
			t.rotateTo(angle, clockwise, 1)
		});
	}
	
	this.chainHop = function(state){
		if(!state){
			Animations.start(function(){t.chainHop({progress: 0, angle: t.Mesh.rotation.y, height: t.Mesh.position.y, direction: t.rotation})});
			return;
		}
		
		var speed = 3;
		var jump = 0.5; // half of the dice
		
		state.progress += SPF * speed;
		if(state.progress > 1) state.progress = 1;
		t.Mesh.position.y = state.height + jump - Math.abs(state.progress - 0.5) * jump * 2;
		
		if(t.rotation == state.direction){
			t.Mesh.rotation.y = state.angle + Math.PI * 2 * state.progress;
			if(t.Mesh.rotation.y > (Math.PI * 2)) t.Mesh.rotation.y -= (Math.PI * 2);
		} // Not rotating when player moves to another direction
		
		if(state.progress < 1) {
			Animations.start(function(){t.chainHop(state)});
		}
	}
	
	this.move = function(direction){
	
		this.updateRotation(direction);
	
		if(this.canMove(direction)){

			var delta = SPF * this.MOVE_SPEED; 
			//console.log(delta);

			switch(direction){
				case 'LEFT':
					Mesh.position.x -= delta;
					break;
				case 'UP':
					Mesh.position.z -= delta;
					break;
				case 'RIGHT':
					Mesh.position.x += delta;
					break;
				case 'DOWN':
					Mesh.position.z += delta;

			}
		}
	}
	this.updateHeight = function(){
		var dice = Board.getDiceAtPos(Mesh.position.x, Mesh.position.z);
		if(typeof dice == "object"){
			Mesh.position.y = dice.sink + this.yOnDice - 1;
			this.isOnDice = true;
		} else {
			//console.log(Board.matrix);
			Mesh.position.y = this.yOnDice - 1;
			this.isOnDice = false;
		}
		this.activeDice = dice;
		var pos = Board.getBoardPos(Mesh.position.x, Mesh.position.z);
		this.boardx = pos.boardx;
		this.boardy = pos.boardy;
	}
}

var devil = new function(){
	this.init = function(){
		// Дополняем класс параметрами из вызова
		var properties = window.components.getProperties('devil');
		$.extend(self, properties);
		window.components.loaded('devil');
	}
}
window.components.require(['scene', 'board'], devil.init);