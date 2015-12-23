/* Board object */

var board = new function(){
	var Mesh;
	this.Mesh = Mesh;
	var t = this;
	
	var width = 7;
	var height = 7;
	this.width = width;
	this.height = height;
	
	var matrix = [];
	
	this.dices = [];
	
	this.spawntimer;
	this.lastspawn;

	this.updateSpawnTime = function(){
		if(this.dices.length >= DICES_UNTIL_LONG_SPAWN){
			this.spawnTime = SPAWN_TIME;
		} else {
			this.spawnTime = SPAWN_TIME / 2;
		}
	}
	this.startSpawn = function(){
		t.lastspawn = new Date().getTime();
		t.spawntimer = setTimeout(function(){
			if(window.gametype == 'time' && t.dices.length >= 42){
				// Stop spawning in time mode when only 7 empty squares left
			} else {
				t.newDice();
			}
			t.updateSpawnTime();
			t.startSpawn();
		}, t.spawnTime);
	}

	this.pauseSpawn = function(){
		clearTimeout(t.spawntimer);
		t.spawnTime = t.spawnTime - (new Date().getTime() - t.lastspawn);
	}
	this.stopSpawn = function(){
		clearTimeout(t.spawntimer);
	}
	this.resetBoard = function(){
		this.matrix = [];
		this.dices = [];
		for(var i = 0;i < width * height; i++){
			this.matrix.push(0);
		}
	}
	this.init = function(){

		var properties = window.components.getProperties('board');
		$.extend(self, properties);

		this.spawnTime = SPAWN_TIME / 2;

		var Mesh = new THREE.Mesh(Geometries.board, Materials.board);

		scene.add(Mesh);
		Mesh.position.y = -0.1;
		Mesh.position.x = 0.2;
		Mesh.position.z = 0.2;
		
		t.resetBoard();

		window.components.loaded('board');
	}
	
	this.removeDice = function(dice){
		this.matrix[dice.boardy * width + dice.boardx] = 0;
		var index = $.inArray(dice, this.dices);
		if(index != -1){
			this.dices.remove(index);
		}
		this.spawn();
	}
	this.getRandomFreeSpot = function(){
		var free_indexes = [];
		$.each(this.matrix, function(i, val){
			if(val == 0) free_indexes.push(i);
		});
		if(free_indexes.length == 0) return false;
		var index = free_indexes[Math.floor(Math.random() * free_indexes.length)];
		return {index: index, y: Math.floor(index / width), x: index % width};
	}
	this.getRandomBusySpot = function(){
		var busy_indexes = [];
		$.each(this.matrix, function(i, val){
			if(val >= 1 && val <= 6) busy_indexes.push(i);
		});
		if(busy_indexes.length == 0) return false;
		var index = busy_indexes[Math.floor(Math.random() * busy_indexes.length)];
		return {index: index, y: Math.floor(index / width), x: index % width};
	}
	this.newDice = function(x, y, pattern){
		if(x == 'place') var place = true;

		if(!x || !y){
			var freespot = this.getRandomFreeSpot();
			var x = freespot.x;
			var y = freespot.y;
		} else {
			freespot = {x: x, y: y, index: (y*width + x)}
		}
		
		var dice = new Dice(pattern);
		dice.position(freespot.x, freespot.y);
		this.matrix[freespot.index] = dice.top;
		this.dices.push(dice);
		
		if(place) dice.place(); else dice.cast();
		//Render();
	}

	this.spawn = function(){
		var spawnrate = 0.5;
		if(Math.random() < spawnrate){
			this.newDice();
		}
	}
	this.getDiceAt = function(x, y){
		if(x < 0 || x >= width || y < 0 || y >= height) return;

		var index = y * width + x;
		var thedice;
		if(this.matrix[index] == 0) {
			return 0;
		} else {
			$.each(this.dices, function(key, dice){
				if(dice.boardx == x && dice.boardy == y){
					thedice = dice;
				}
			});
			return thedice;
		}
	}
	this.getBoardPos = function(x, y){
		x = x + 3 - 0.2 + 0.5;
		y = y + 3 - 0.2 + 0.5;
		var boardx = Math.floor(x / 1); // Dice = 1x1x1
		var boardy = Math.floor(y / 1);
		return {boardx: boardx, boardy: boardy};
	}
	this.getDiceAtPos = function(x, y){
		var pos = this.getBoardPos(x, y);
		return this.getDiceAt(pos.boardx, pos.boardy);
	}
	this.matrixMoveDice = function(xold, yold, xnew, ynew, dicetop){
		this.matrix[(yold * width + xold)] = this.matrix[(ynew * width + xnew)]; // Mostly zero, but sometimes exchange
		this.matrix[(ynew * width + xnew)] = dicetop;
	}
	this.getAdjacentDices = function(dice, exclude){
		var adjd = [];
		var d;
		
		d = t.getDiceAt(dice.boardx - 1, dice.boardy); // Left
		if(typeof d == 'object'){ if(d.top == dice.top && $.inArray(d, exclude) == -1 && d.props.canChain) adjd.push(d); }

		d = t.getDiceAt(dice.boardx, dice.boardy - 1); // Top
		if(typeof d == 'object'){ if(d.top == dice.top && $.inArray(d, exclude) == -1 && d.props.canChain) adjd.push(d); }

		d = t.getDiceAt(dice.boardx + 1, dice.boardy); // Right
		if(typeof d == 'object'){ if(d.top == dice.top && $.inArray(d, exclude) == -1 && d.props.canChain) adjd.push(d); }

		d = t.getDiceAt(dice.boardx, dice.boardy + 1); // Bottom
		if(typeof d == 'object'){ if(d.top == dice.top && $.inArray(d, exclude) == -1 && d.props.canChain) adjd.push(d); }

		return adjd;
	}
	this.chaincheck = function(dice){
		if(dice.top != 1){
			var dd = [dice];
			var adjd = this.getAdjacentDices(dice, dd);
			while (adjd.length > 0){
				dd = dd.concat(adjd);
				var adjd2 = adjd.splice(0);
				adjd = [];
				$.each(adjd2, function(key, value){
					adjd = adjd.concat(t.getAdjacentDices(value, dd.concat(adjd)));
				});
			}
			if(dd.length >= dice.top){
				// Hooray!

				var n = t.getChainNumber(dd); // When 2 different chains joins — you get the highest number
				$.each(dd, function(key, dice){
					dice.chain_number = n;
					dice.activateChain();
				});
				player.activateChain(dice.top, dd.length, n);
				if(n > 1) devil.chainHop();
			}
		} else { // Checking ones
			var activate = false;
			var d = t.getDiceAt(dice.boardx - 1, dice.boardy); // Left
			if(typeof d == 'object'){ if(d.chain_number > 0) activate = true; }

			d = t.getDiceAt(dice.boardx, dice.boardy - 1); // Top
			if(typeof d == 'object'){ if(d.chain_number > 0) activate = true; }

			d = t.getDiceAt(dice.boardx + 1, dice.boardy); // Right
			if(typeof d == 'object'){ if(d.chain_number > 0) activate = true; }

			d = t.getDiceAt(dice.boardx, dice.boardy + 1); // Bottom
			if(typeof d == 'object'){ if(d.chain_number > 0) activate = true; }

			if(activate){
				var count = 0;
				$.each(t.dices, function(key, d){
					if(d != dice && d.top == 1 && d.props.canChain){
						count++;
						d.activateOne();
					}
				});
				if(count > 0) player.activateOne(count);
			}
		}
	}
	this.getChainNumber = function(dd){
		var n = 0;
		$.each(dd, function(key, dice){
			if(dice.chain_number > n) n = dice.chain_number;
		});
		return n + 1;
	}
}
var Board = board;
window.components.require(['scene'], board.init);