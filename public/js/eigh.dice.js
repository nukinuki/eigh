/* Dice class */

var DICE_PROPERTIES = {
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


var Dice = function(pattern){
	//var Mesh = new THREE.Mesh(Geometries.dice, Materials.dice);
	var Mesh = new THREE.Mesh(Geometries.roundcube, Materials.roundcube);
	this.Mesh = Mesh;
	var t = this;

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
			Mesh.position.y = 0.5 - DICE_PUSHDOWN;
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
		//Board.matrixMoveDice(this.boardx, this.boardy, x, y, this.top);
		//Board will be updated with push or flip action
		this.position(x, y);
		this.updateRiseDisplay();
	}
	this.activateChain = function(){
		this.sink += SINK_HOP;
		if(this.sink > 1) this.sink = 1;
		if(!this.sink_started){
			this.sink_started = true;
			this.doSink();
		}
	}

	this.activateOne = function(){
		//Mesh.material = Materials.dicesinked;
		Mesh.material = Materials.roundcubesinked;
		this.removed = true;
		this.doRemove();
	}

	this.updateSinkDisplay = function(){
		Mesh.position.y = this.sink - 0.5;
		if(this.sink >= 0.75){
			/*Mesh.material = Materials.dicechained;*/
			Mesh.material = Materials.roundcubechained;
			t.props = DICE_PROPERTIES.earlySinking;
		} else if(this.sink >= 0.5){
			/*Mesh.material = Materials.dicechained;*/
			Mesh.material = Materials.roundcubechained;
			t.props = DICE_PROPERTIES.middleSinking;
		} else {
			/*Mesh.material = Materials.dicesinked;*/
			Mesh.material = Materials.roundcubesinked;
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
			Animations.start(function(){
				t.doRemove(state);
			});
			t.props = DICE_PROPERTIES.earlyOne;
			return;
		}
		if(state < 1){

			if(state > 0.5) t.props = DICE_PROPERTIES.lateOne;
			// Actually do nothing
			state += SPF / ONES_REMOVE_TIME;
			Animations.start(function(){
				t.doRemove(state);
			});
		} else {
			t.remove();
		}
	}

	this.doSink = function(state){
		if(this.removed) return;
		if(state){
			t.sink -= SPF * SINK_SPEED;
		} else {
			t.props = DICE_PROPERTIES.earlySinking;
		}
		if(t.sink > 0){
			Animations.start(function(){
				t.doSink(1);
			});
			t.updateSinkDisplay();
		} else {
			sfx('gone');
			t.remove();
		}
	}

	this.doRise = function(state){
		if(this.removed || this.sink_started) return;
		if(state){
			t.sink += SPF * RISE_SPEED;
		} else {
			t.sink = 0;
			this.rise_started = true;
		}
		if(this.sink < 1){
			Animations.start(function(){
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
		scene.remove(this.Mesh);
		Board.removeDice(this);
		this.removed = true;
		delete(this);
	}
	
	this.setPattern = function(pattern){
		var index = $.inArray(pattern, DICE_PATTERNS);
		if(index != -1){
			this.top = pattern.substr(0,1);
			this.left = pattern.substr(0,2);
			this.right = pattern.substr(0,3);
			this.orient(DICE_ORIENTS[index]);
		}				
	}
	
	this.cast = function(){
		scene.add(Mesh);
		this.sink = 0.01; // Dice top is visible slightly above the ground;
		this.rise_started = true;
		this.updateRiseDisplay();
		new Thunderbolt(this.boardx, this.boardy, function(){
			t.doRise();
		});
	}
	this.place = function(){
		scene.add(Mesh);
		t.props = DICE_PROPERTIES.regular;
	}
	
	this.randomize = function(){
		var n = Math.floor(DICE_PATTERNS.length * Math.random());
		if(n == DICE_PATTERNS.length) n = 0; // Rare random
		
		this.top = parseInt(DICE_PATTERNS[n].substr(0,1),10);
		this.left = parseInt(DICE_PATTERNS[n].substr(1,1),10);
		this.right = parseInt(DICE_PATTERNS[n].substr(2,1),10); 
		
		this.orient(DICE_ORIENTS[n]);
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
				if(this.boardy == (Board.height - 1)) return false;
				newpos.boardy++;
				break;
			case 'left':
				if(this.boardx == 0) return false;
				newpos.boardx--;
				break;
			case 'right':
				if(this.boardx == (Board.width - 1)) return false;
				newpos.boardx++;
				break;
		}

		nextdice = Board.getDiceAt(newpos.boardx, newpos.boardy);
		if(nextdice != 0){
			if(nextdice.props.canBeExchanged){
				nextdice.moveToSpot(boardx, boardy); // Can move over early rising while exchanging places with them
			} else {
				return false;
			}
		}
				
		if(!push) this.flipPattern(direction);
		Board.matrixMoveDice(boardx, boardy, newpos.boardx, newpos.boardy, this.top);
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
			sfx('push');
			Animations.start(function(){ t.push(direction, state); });
			return true;
		}
		//console.log('pushing');
		var delta = SPF * devil.MOVE_SPEED;
		state.progress += delta;
		if(state.progress > 1) state.progress = 1;
		
		switch (direction) {
			case 'up':
				Mesh.position.z = state.z0 - state.progress;
				//devil.Mesh.position.z -= delta;
				break;
			case 'down':
				Mesh.position.z = state.z0 + state.progress;
				//devil.Mesh.position.z += delta;
				break;
			case 'left':
				Mesh.position.x = state.x0 - state.progress;
				//devil.Mesh.position.x -= delta;
				break;
			case 'right':
				Mesh.position.x = state.x0 + state.progress;
				//devil.Mesh.position.x += delta;
				break;
		}
		
		if(state.progress < 1){
			Animations.start(function(){ t.push(direction, state); });
		} else {
			t.animation_started = false;
			//console.log('push complete, checking chain');
			t.fixPosition();
			Board.chaincheck(t);
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
			Animations.start(function(){ t.flip(direction, state); });
			return true;
		}

		var side = 'z';
		var invert = 1;
		
		var R = Math.sqrt(2);
		var fi0 = Math.PI / 4;

		var delta = SPF * devil.MOVE_SPEED * 3 / 4; // Player will move 3/4 of the way of the dice

		if(t.reverse){
			state.progress -= SPF * devil.MOVE_SPEED * 5 / 4; // While dice will flip faster
			if(state.progress < 0) state.progress = 0;
			delta = - delta;
		} else {
			state.progress += SPF * devil.MOVE_SPEED * 5 / 4; // While dice will flip faster
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

				devil.Mesh.position.z -= delta;
				break;
			case 'down':
				Mesh.rotation.x = state.rx0 + state.progress * (Math.PI / 2);
				Mesh.position.z = state.z0 + 1 - R * Math.cos(fi0 + Math.PI * state.progress / 4);
				Mesh.position.y = state.y0 - (1 - R * Math.sin(fi0 + Math.PI * state.progress / 2))/2;

				devil.Mesh.position.z += delta;
				break;
			case 'left':
				Mesh.rotation[side] = state['r'+side+'0'] + invert * (state.progress * (Math.PI / 2));
				Mesh.position.x = state.x0 - 1 + R * Math.cos(fi0 + Math.PI * state.progress / 4);
				Mesh.position.y = state.y0 - (1 - R * Math.sin(fi0 + Math.PI * state.progress / 2))/2;

				devil.Mesh.position.x -= delta;
				break;
			case 'right':
				Mesh.rotation[side] = state['r'+side+'0'] - invert * (state.progress * (Math.PI / 2));
				Mesh.position.x = state.x0 + 1 - R * Math.cos(fi0 + Math.PI * state.progress / 4);
				Mesh.position.y = state.y0 - (1 - R * Math.sin(fi0 + Math.PI * state.progress / 2))/2;

				devil.Mesh.position.x += delta;
				break;
		}
		
		devil.Mesh.position.y = devil.yOnDice - (1 - R * Math.sin(fi0 + Math.PI * state.progress / 2)) / 4; // Little bounce for devil
		
		
		if(state.progress < 1 && state.progress > 0){
			Animations.start(function(){ t.flip(direction, state); });
		} else {
			sfx('roll');
			t.animation_started = false;
			t.flip_direction = "";
			t.reverse = false;
			Board.chaincheck(t);
			return 1;
		}
	}
	
	if(pattern){
		this.setPattern(pattern);
	} else {
		this.randomize();
	}
}

var Thunderbolt = function(x, y, callback){
	this.boardx = x;
	this.boardy = y;
	this.progress = 0;
	this.speed = 1 / THUNDERBOLT_TIME;
	var t = this;
	var Mesh = new THREE.Mesh(Geometries.thunderbolt, Materials.thunderbolt);
	this.Mesh = Mesh;

	Mesh.position.x = -3 + x + 0.2;
	Mesh.position.z = -3 + y + 0.2;
	Mesh.position.y = 3;

	scene.add(Mesh);
	
	sfx('thunder');

	this.doAnimate = function(){
		if(t.progress < 1){
			Mesh.scale.x = 1 - t.progress;
			Mesh.scale.z = 1 - t.progress;
			t.progress += SPF * t.speed;
			Mesh.material.opacity = Math.random() * 0.3 + 0.5;
			Animations.start(t.doAnimate);
		} else {
			scene.remove(Mesh);
			if(callback) callback();
		}
	}
	Animations.start(t.doAnimate);
}

var currentDice = new function(){
	var t = this;
	var diceframe;
	this.diceframe = diceframe;
	

	this.Mesh = "";

	//var cubePositionScreen = new THREE.Vector3(-0.78, -0.62, 0.5);
	//var cubePositionWorld = projector.unprojectVector(cubePositionScreen, camera).divideScalar(1.1);

	var cubePositionWorld = new THREE.Vector3(-5, 2.4, 4);

	//var cubeRotationAdd = new THREE.Vector3(0.1,0.3,-0.33);
	//var rotation_matrix = new THREE.Matrix4().setRotationFromEuler(cubeRotationAdd);

	//var cubeRotationAdd = new THREE.Vector3(0, -0.2, 0.2);
	//var cubeRotationAdd = new THREE.Vector3(-0.1, 0, 0);

	this.init = function(){
		diceframe = new THREE.Sprite(Materials.diceframe);
		diceframe.scale.set(scene_height * 0.3, scene_height * 0.3, 1);
		diceframe.position.set(scene_height * 0.04, scene_height * 0.04, 0);
		scene.add(diceframe);
	}

	this.showDice = function(){
		if(this.Mesh){
			scene.remove(this.Mesh);
		}
		if(devil.isOnDice){
			//cubePositionWorld = projector.unprojectVector(cubePositionScreen, camera).divideScalar(1.1);
			this.Mesh = devil.activeDice.Mesh.clone();
			scene.add(this.Mesh);
			//this.Mesh.matrix.setRotationFromEuler(this.Mesh.rotation);
			//this.Mesh.matrix.multiply(rotation_matrix);
			//this.Mesh.rotation.setEulerFromRotationMatrix(this.Mesh.matrix);
			//this.Mesh.rotation.add(cubeRotationAdd);
			//console.log(cubePositionWorld);
			this.Mesh.position.set(0,0,0);
			this.Mesh.updateMatrix();
			this.Mesh.rotateAroundWorldAxisY(0.25);
			this.Mesh.rotateAroundWorldAxisZ(-0.34);
			this.Mesh.position = cubePositionWorld;
		}
	}
}

THREE.Object3D._matrixAux = new THREE.Matrix4(); // global auxiliar variable
//THREE.Object3D._vector = new THREE.Vector3();

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


var dice = new function(){
	this.init = function(){
		// Дополняем класс параметрами из вызова
		var properties = window.components.getProperties('dice');
		$.extend(self, properties);
		window.components.loaded('dice');
	}
}
window.components.require(['scene'], dice.init);

