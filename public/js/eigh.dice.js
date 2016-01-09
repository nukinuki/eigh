/* Dice class */

eigh.Dice = function(pattern){
	//var Mesh = new THREE.Mesh(eigh.scene.Geometries.dice, eigh.scene.Materials.dice);
	var Mesh = new THREE.Mesh(eigh.scene.Geometries.roundcube, eigh.scene.Materials.roundcube);
	this.Mesh = Mesh;
	var t = this;
	var DICE_PROPERTIES = this.DICE_PROPERTIES;

	var devil = eigh.currentGame.devil; // Link to eigh.Devil instance

	Mesh.scale.set(0.5,0.5,0.5);
	
	/* Dice faces */
	this.top = 2;
	this.left = 3;
	this.right = 1; // This happens to be a default position after texture mapping
	
	/* Dice position on board */
	this.boardx = 0;
	this.boardy = 0;

	/* Dice properties. Defaults set for new spawned dice */

	this.props = DICE_PROPERTIES.spawned;
	
	this.animation_started = false;
	this.sink_started = false;
	this.rise_started = false;

	this.flip_direction = ""; // direction while flipping for reverse
	this.reverse = false;

	this.chain_number = 0;

	this.sink = 1; // Level above the ground
	this.removed = false;
	
	this.enter = function(){
		if(this.props.regular){
			Mesh.position.y = 0.5 - eigh.config.DICE_PUSHDOWN;
		}
	}
	this.leave = function(){
		if(this.props.regular){
			Mesh.position.y = 0.5;
		}
	}

	this.position = function(x, y){
		this.boardx = x;
		this.boardy = y;
		Mesh.position.x = -3 + x + 0.2;
		Mesh.position.z = -3 + y + 0.2;
		Mesh.position.y = 0.5;
	}
	this.fixPosition = function(){
		this.position(this.boardx, this.boardy);
	}
	this.moveToSpot = function(x,y){
		//eigh.board.matrixMoveDice(this.boardx, this.boardy, x, y, this.top);
		//Board will be updated with push or flip action
		this.position(x, y);
		this.updateRiseDisplay();
	}
	this.activateChain = function(){
		this.sink += eigh.config.SINK_HOP;
		if(this.sink > 1) this.sink = 1;
		if(!this.sink_started){
			this.sink_started = true;
			this.doSink();
		}
	}

	this.activateOne = function(){
		//Mesh.material = Materials.dicesinked;
		Mesh.material = eigh.scene.Materials.roundcubesinked;
		this.removed = true;
		this.doRemove();
	}

	this.updateSinkDisplay = function(){
		Mesh.position.y = this.sink - 0.5;
		if(this.sink >= 0.75){
			/*Mesh.material = Materials.dicechained;*/
			Mesh.material = eigh.scene.Materials.roundcubechained;
			t.props = DICE_PROPERTIES.earlySinking;
		} else if(this.sink >= 0.5){
			/*Mesh.material = eigh.scene.Materials.dicechained;*/
			Mesh.material = eigh.scene.Materials.roundcubechained;
			t.props = DICE_PROPERTIES.middleSinking;
		} else {
			/*Mesh.material = eigh.scene.Materials.dicesinked;*/
			Mesh.material = eigh.scene.Materials.roundcubesinked;
			t.props = DICE_PROPERTIES.lateSinking;
		}
	}

	this.updateRiseDisplay = function(){
		Mesh.position.y = this.sink - 0.5;
		if(this.sink >= 0.75){
			t.props = DICE_PROPERTIES.lateRising;
		} else if(this.sink >= 0.5){
			t.props = DICE_PROPERTIES.middleRising;
		} else {
			t.props = DICE_PROPERTIES.earlyRising;
		}
	}

	this.doRemove = function(state){
		if(state === undefined){
			state = 0;
			eigh.Animations.start(function(){
				t.doRemove(state);
			});
			t.props = DICE_PROPERTIES.earlyOne;
			return;
		}
		if(state < 1){

			if(state > 0.5) t.props = DICE_PROPERTIES.lateOne;
			// Actually do nothing
			state += eigh.getSPF() / eigh.config.ONES_REMOVE_TIME;
			eigh.Animations.start(function(){
				t.doRemove(state);
			});
		} else {
			t.remove();
		}
	}

	this.doSink = function(state){
		if(this.removed) return;
		if(state){
			t.sink -= eigh.getSPF() * eigh.config.SINK_SPEED;
		} else {
			t.props = DICE_PROPERTIES.earlySinking;
		}
		if(t.sink > 0){
			eigh.Animations.start(function(){
				t.doSink(1);
			});
			t.updateSinkDisplay();
		} else {
			eigh.sfx('gone');
			t.remove();
		}
	}

	this.doRise = function(state){
		if(this.removed || this.sink_started) return;
		if(state){
			t.sink += eigh.getSPF() * eigh.config.RISE_SPEED;
		} else {
			t.sink = 0;
			this.rise_started = true;
		}
		if(this.sink < 1){
			eigh.Animations.start(function(){
				t.doRise(1);
			});
			t.updateRiseDisplay();
		} else {
			this.sink = 1;
			this.rise_started = false;
			t.props = DICE_PROPERTIES.regular;
		}
	}

	this.remove = function(){
		eigh.scene.scene.remove(this.Mesh);
		eigh.board.removeDice(this);
		this.removed = true;
		delete(this);
	}
	
	this.setPattern = function(pattern){
		var index = $.inArray(pattern, eigh.constants.DICE_PATTERNS);
		if(index != -1){
			this.top = pattern.substr(0,1);
			this.left = pattern.substr(0,2);
			this.right = pattern.substr(0,3);
			this.orient(eigh.constants.DICE_ORIENTS[index]);
		}				
	}
	
	this.cast = function(){
		eigh.scene.scene.add(Mesh);
		this.sink = 0.01; // Dice top is visible slightly above the ground;
		this.rise_started = true;
		this.updateRiseDisplay();
		new eigh.Thunderbolt(this.boardx, this.boardy, function(){
			t.doRise();
		});
	}
	this.place = function(){
		eigh.scene.scene.add(Mesh);
		t.props = DICE_PROPERTIES.regular;
	}
	
	this.randomize = function(){
		var n = Math.floor(eigh.constants.DICE_PATTERNS.length * Math.random());
		if(n == eigh.constants.DICE_PATTERNS.length) n = 0; // Rare random
		
		this.top = parseInt(eigh.constants.DICE_PATTERNS[n].substr(0,1),10);
		this.left = parseInt(eigh.constants.DICE_PATTERNS[n].substr(1,1),10);
		this.right = parseInt(eigh.constants.DICE_PATTERNS[n].substr(2,1),10); 
		
		this.orient(eigh.constants.DICE_ORIENTS[n]);
	}
	
	this.orient = function(o){
		var sx = o.substr(0,1);
		var sy = o.substr(1,1);
		var sz = o.substr(2,1);
		
		Mesh.rotation.x = Math.PI * sx / 2;
		Mesh.rotation.y = Math.PI * sy / 2;
		Mesh.rotation.z = Math.PI * sz / 2;
	}
	
	this.fixOrientation = function(){
		var rx0 = (Mesh.rotation.x + (2 * Math.PI)) % (2 * Math.PI);
		var ry0 = (Mesh.rotation.y + (2 * Math.PI)) % (2 * Math.PI);
		var rz0 = (Mesh.rotation.z + (2 * Math.PI)) % (2 * Math.PI);
		
		var ox = Math.round(Math.abs(rx0 * 2 / Math.PI));
		var oy = Math.round(Math.abs(ry0 * 2 / Math.PI));
		var oz = Math.round(Math.abs(rz0 * 2 / Math.PI));
		
		var o2 = '' + ox + oy;
		
		if(o2 == '22' || o2 == '32'){
			ox = (ox + 2) % 4;	oy = (oy + 2) % 4; oz = (oz + 2) % 4;
		}
		if(o2 == '01'){
			ox = (ox + 1) % 4;	oz = (oz + 3) % 4;
		}
		if(o2 == '21'){
			ox = (ox + 3) % 4;	oz = (oz + 1) % 4;
		}
		if(o2 == '03'){
			ox = (ox + 1) % 4;	oz = (oz + 1) % 4;
		}
		if(o2 == '23'){
			ox = (ox + 3) % 4;	oz = (oz + 3) % 4;
		}
		if(o2 == '31' || o2 == '33'){
			ox = (ox + 2) % 4;	oz = (oz + 2) % 4;
		}
		
		var o = '' + ox + oy + oz;
		this.orient(o);
	}
	
	this.setDirection = function(direction, push){
		var boardx = this.boardx;
		var boardy = this.boardy;
		var newpos = {boardx: boardx, boardy: boardy};
		var nextdice;

		switch (direction) {
			case 'up':
				if(this.boardy == 0) return false;
				newpos.boardy--;
				break;
			case 'down':
				if(this.boardy == (eigh.board.height - 1)) return false;
				newpos.boardy++;
				break;
			case 'left':
				if(this.boardx == 0) return false;
				newpos.boardx--;
				break;
			case 'right':
				if(this.boardx == (eigh.board.width - 1)) return false;
				newpos.boardx++;
				break;
		}

		nextdice = eigh.board.getDiceAt(newpos.boardx, newpos.boardy);
		if(nextdice != 0){
			if(nextdice.props.canBeExchanged){
				nextdice.moveToSpot(boardx, boardy); // Can move over early rising while exchanging places with them
			} else {
				return false;
			}
		}
				
		if(!push) this.flipPattern(direction);
		eigh.board.matrixMoveDice(boardx, boardy, newpos.boardx, newpos.boardy, this.top);
		if(push) {
			this.boardx = newpos.boardx;
			this.boardy = newpos.boardy;
		};

		return true;
	}
	
	this.flipPattern = function(direction){
		var top, left, right;
		switch (direction) {
			case 'up':
				top = this.left; left = 7 - this.top; right = this.right;
				this.boardy--;
				break;
			case 'down':
				top = 7 - this.left; left = this.top; right = this.right;
				this.boardy++;
				break;
			case 'left':
				top = this.right; left = this.left; right = 7 - this.top;
				this.boardx--;
				break;
			case 'right':
				top = 7 - this.right; left = this.left; right = this.top;
				this.boardx++;
				break;
		}
		this.top = top;
		this.left = left;
		this.right = right;
	}

	this.push = function(direction, state){
		if(!state) {
			if(t.animation_started) return false;
			if(t.sink < 1) return false;
			direction = direction.toLowerCase();
			if(!t.setDirection(direction, true)) return false; else t.animation_started = true;
			

			this.fixOrientation();
			var state = {
				x0: Mesh.position.x,
				y0: Mesh.position.y,
				z0: Mesh.position.z,
				progress: 0,
				direction: direction,
				obj: this
			}
			eigh.sfx('push');
			eigh.Animations.start(function(){ t.push(direction, state); });
			return true;
		}
		//console.log('pushing');
		var delta = eigh.getSPF() * eigh.currentGame.devil.MOVE_SPEED;
		state.progress += delta;
		if(state.progress > 1) state.progress = 1;
		
		switch (direction) {
			case 'up':
				Mesh.position.z = state.z0 - state.progress;
				//eigh.currentGame.devil.Mesh.position.z -= delta;
				break;
			case 'down':
				Mesh.position.z = state.z0 + state.progress;
				//eigh.currentGame.devil.Mesh.position.z += delta;
				break;
			case 'left':
				Mesh.position.x = state.x0 - state.progress;
				//eigh.currentGame.devil.Mesh.position.x -= delta;
				break;
			case 'right':
				Mesh.position.x = state.x0 + state.progress;
				//eigh.currentGame.devil.Mesh.position.x += delta;
				break;
		}
		
		if(state.progress < 1){
			eigh.Animations.start(function(){ t.push(direction, state); });
		} else {
			t.animation_started = false;
			//console.log('push complete, checking chain');
			t.fixPosition();
			eigh.board.chaincheck(t);
			return 1;
		}
	}
	
	this.flip = function(direction, state){
		if(!state) {
			if(t.animation_started) return false;
			if(t.sink < 1) return false;
			direction = direction.toLowerCase();
			if(!t.setDirection(direction)) return false; else {
				t.animation_started = true;
				t.flip_direction = direction;
			}

			this.leave();
			

			this.fixOrientation();
			var state = {
				x0: Mesh.position.x,
				y0: Mesh.position.y,
				z0: Mesh.position.z,
				rx0: Mesh.rotation.x,
				ry0: Mesh.rotation.y,
				rz0: Mesh.rotation.z,
				frame: 1,
				progress: 0,
				direction: direction,
				obj: this
			}
			state.o2 = '' + Math.round(Math.abs(state.rx0 * 2 / Math.PI)) + Math.round(Math.abs(state.ry0 * 2 / Math.PI));
			eigh.Animations.start(function(){ t.flip(direction, state); });
			return true;
		}

		var side = 'z';
		var invert = 1;
		
		var R = Math.sqrt(2);
		var fi0 = Math.PI / 4;

		var delta = eigh.getSPF() * eigh.currentGame.devil.MOVE_SPEED * 3 / 4; // Player will move 3/4 of the way of the dice

		if(t.reverse){
			state.progress -= eigh.getSPF() * eigh.currentGame.devil.MOVE_SPEED * 5 / 4; // While dice will flip faster
			if(state.progress < 0) state.progress = 0;
			delta = - delta;
		} else {
			state.progress += eigh.getSPF() * eigh.currentGame.devil.MOVE_SPEED * 5 / 4; // While dice will flip faster
			if(state.progress > 1) state.progress = 1;
		}
		
		if(state.o2 == '00'){ side = 'z'; invert = 1; }
		if(state.o2.substr(0,1) == '3'){ side = 'y'; invert = -1; }
		if(state.o2.substr(0,1) == '1'){ side = 'y'; invert = 1; }
		if(state.o2 == '20' || state.o2 == '02'){ side = 'z'; invert = -1; }
		
		switch (direction) {
			case 'up':
				Mesh.rotation.x = state.rx0 - state.progress * (Math.PI / 2);
				Mesh.position.z = state.z0 - 1 + R * Math.cos(fi0 + Math.PI * state.progress / 4);
				Mesh.position.y = state.y0 - (1 - R * Math.sin(fi0 + Math.PI * state.progress / 2))/2;

				eigh.currentGame.devil.Mesh.position.z -= delta;
				break;
			case 'down':
				Mesh.rotation.x = state.rx0 + state.progress * (Math.PI / 2);
				Mesh.position.z = state.z0 + 1 - R * Math.cos(fi0 + Math.PI * state.progress / 4);
				Mesh.position.y = state.y0 - (1 - R * Math.sin(fi0 + Math.PI * state.progress / 2))/2;

				eigh.currentGame.devil.Mesh.position.z += delta;
				break;
			case 'left':
				Mesh.rotation[side] = state['r'+side+'0'] + invert * (state.progress * (Math.PI / 2));
				Mesh.position.x = state.x0 - 1 + R * Math.cos(fi0 + Math.PI * state.progress / 4);
				Mesh.position.y = state.y0 - (1 - R * Math.sin(fi0 + Math.PI * state.progress / 2))/2;

				eigh.currentGame.devil.Mesh.position.x -= delta;
				break;
			case 'right':
				Mesh.rotation[side] = state['r'+side+'0'] - invert * (state.progress * (Math.PI / 2));
				Mesh.position.x = state.x0 + 1 - R * Math.cos(fi0 + Math.PI * state.progress / 4);
				Mesh.position.y = state.y0 - (1 - R * Math.sin(fi0 + Math.PI * state.progress / 2))/2;

				eigh.currentGame.devil.Mesh.position.x += delta;
				break;
		}
		
		eigh.currentGame.devil.Mesh.position.y = eigh.currentGame.devil.yOnDice - (1 - R * Math.sin(fi0 + Math.PI * state.progress / 2)) / 4; // Little bounce for devil
		
		
		if(state.progress < 1 && state.progress > 0){
			eigh.Animations.start(function(){ t.flip(direction, state); });
		} else {
			eigh.sfx('roll');
			t.animation_started = false;
			t.flip_direction = "";
			t.reverse = false;
			eigh.board.chaincheck(t);
			return 1;
		}
	}
	
	if(pattern){
		this.setPattern(pattern);
	} else {
		this.randomize();
	}
}

eigh.Dice.prototype.DICE_PROPERTIES = {
	spawned: {
		name: 'spawned',
		regular: false,			// Regular dice is the dice that is not chaining, sinking or rising
		canFlip: false, 		// You can flip it
		canMove: false, 		// You can push it
		canChain: false, 		// You can chain with it
		canWalkOn: false, 		// You can walk on the dice from the regular dice
		canJumpOn: true, 		// You can jump on the dice from the floor
		canClimbOff: false,		// You can climb from the dice to regular dice
		canWalkOff: true,		// You can walk from the dice on the floor or sinking/rising dice
		canBeErased: false, 	// Can be erased by another dice (flip or move)
		canBeExchanged: true 	// Can exchange places with the dice moving through
	},
	regular: {
		name: 'regular',
		regular: true,
		canFlip: true,
		canMove: true,
		canChain: true,
		canWalkOn: true,
		canJumpOn: false,
		canClimbOff: true,
		canWalkOff: false,
		canBeErased: false,
		canBeExchanged: false
	},
	earlySinking: {
		name: 'earlySinking',
		regular: false,
		sinking: true,
		canFlip: false,
		canMove: false,
		canChain: true,
		canWalkOn: false,
		canJumpOn: true,
		canClimbOff: true,
		canWalkOff: false,
		canBeErased: false,
		canBeExchanged: false
	},
	middleSinking: {
		name: 'middleSinking',
		regular: false,
		sinking: true,
		canFlip: false,
		canMove: false,
		canChain: true,
		canWalkOn: false,
		canJumpOn: true,
		canClimbOff: true,
		canWalkOff: true,
		canBeErased: false,
		canBeExchanged: false
	},
	lateSinking: {
		name: 'lateSinking',
		regular: false,
		sinking: true,
		canFlip: false,
		canMove: false,
		canChain: true,
		canWalkOn: false,
		canJumpOn: true,
		canClimbOff: false,
		canWalkOff: true,
		canBeErased: true,
		canBeExchanged: false
	},
	earlyRising: {
		name: 'earlyRising',
		regular: false,
		rising: true,
		canFlip: false,
		canMove: false,
		canChain: false,
		canWalkOn: false,
		canJumpOn: true,
		canClimbOff: false,
		canWalkOff: false,
		canBeErased: false,
		canBeExchanged: true
	},
	middleRising: {
		name: 'middleRising',
		regular: false,
		rising: true,
		canFlip: false,
		canMove: false,
		canChain: true,
		canWalkOn: true,
		canJumpOn: true,
		canClimbOff: true,
		canWalkOff: false,
		canBeErased: false,
		canBeExchanged: false
	},
	lateRising: {
		name: 'lateRising',
		regular: false,
		rising: true,
		canFlip: false,
		canMove: false,
		canChain: true,
		canWalkOn: true,
		canJumpOn: false,
		canClimbOff: true,
		canWalkOff: false,
		canBeErased: false,
		canBeExchanged: false
	},
	earlyOne: { // Chained ONE dice
		name: 'earlyOne',
		regular: false,
		canFlip: false,
		canMove: false,
		canChain: false,
		canWalkOn: true,
		canJumpOn: false,
		canClimbOff: true,
		canWalkOff: false,
		canBeErased: false,
		canBeExchanged: false
	},
	lateOne: {
		name: 'lateOne',
		regular: false,
		canFlip: false,
		canMove: false,
		canChain: false,
		canWalkOn: true,
		canJumpOn: false,
		canClimbOff: true,
		canWalkOff: false,
		canBeErased: false,
		canBeExchanged: false
	}
}

eigh.Thunderbolt = function(x, y, callback){
	this.boardx = x;
	this.boardy = y;
	this.progress = 0;
	this.speed = 1 / eigh.config.THUNDERBOLT_TIME;
	var t = this;
	var Mesh = new THREE.Mesh(eigh.scene.Geometries.thunderbolt, eigh.scene.Materials.thunderbolt);
	this.Mesh = Mesh;

	Mesh.position.x = -3 + x + 0.2;
	Mesh.position.z = -3 + y + 0.2;
	Mesh.position.y = 3;

	eigh.scene.scene.add(Mesh);
	
	eigh.sfx('thunder');

	this.doAnimate = function(){
		if(t.progress < 1){
			Mesh.scale.x = 1 - t.progress;
			Mesh.scale.z = 1 - t.progress;
			t.progress += eigh.getSPF() * t.speed;
			Mesh.material.opacity = Math.random() * 0.3 + 0.5;
			eigh.Animations.start(t.doAnimate);
		} else {
			eigh.scene.scene.remove(Mesh);
			if(callback) callback();
		}
	}
	eigh.Animations.start(t.doAnimate);
}

eigh.currentDice = new function(){
	var t = this;
	var diceframe;
	this.diceframe = diceframe;

	this.Mesh = "";

	var cubePositionWorld = new THREE.Vector3(-5, 2.4, 4);

	this.init = function(){
		diceframe = new THREE.Sprite(eigh.scene.Materials.diceframe);
		diceframe.scale.set(eigh.scene.scene_height * 0.3, eigh.scene.scene_height * 0.3, 1);
		diceframe.position.set(eigh.scene.scene_height * 0.04, eigh.scene.scene_height * 0.04, 0);
		eigh.scene.scene.add(diceframe);
	}

	this.showDice = function(){
		if(this.Mesh){
			eigh.scene.scene.remove(this.Mesh);
		}
		if(eigh.currentGame.devil.isOnDice){
			this.Mesh = eigh.currentGame.devil.activeDice.Mesh.clone();
			eigh.scene.scene.add(this.Mesh);
			this.Mesh.position.set(0,0,0);
			this.Mesh.updateMatrix();
			this.Mesh.rotateAroundWorldAxisY(0.25);
			this.Mesh.rotateAroundWorldAxisZ(-0.34);
			this.Mesh.position = cubePositionWorld;
		}
	}
}

/** THREE.js Object3D new methods */

THREE.Object3D._matrixAux = new THREE.Matrix4(); // global auxiliar variable

// Warnings: 1) axis is assumed to be normalized. 
//  2) matrix must be updated. If not, call object.updateMatrix() first  
//  3) this assumes we are not using quaternions
THREE.Object3D.prototype.rotateAroundWorldAxis = function(axis, radians) { 
    THREE.Object3D._matrixAux.makeRotationAxis(axis, radians);
    this.matrix.multiplyMatrices(THREE.Object3D._matrixAux,this.matrix); // r56
    THREE.Object3D._matrixAux.extractRotation(this.matrix);
    this.rotation.setEulerFromRotationMatrix(THREE.Object3D._matrixAux, this.eulerOrder ); 
    this.position.getPositionFromMatrix( this.matrix );
}
THREE.Object3D.prototype.rotateAroundWorldAxisX = function(radians) { 
    this.rotateAroundWorldAxis(new THREE.Vector3(1,0,0),radians);
}
THREE.Object3D.prototype.rotateAroundWorldAxisY = function(radians) { 
    this.rotateAroundWorldAxis(new THREE.Vector3(0,1,0),radians);
}
THREE.Object3D.prototype.rotateAroundWorldAxisZ = function(degrees){ 
    this.rotateAroundWorldAxis(new THREE.Vector3(0,0,1),degrees);
}

window.components.require(['scene'], function(){
	window.components.loaded('dice');
});


