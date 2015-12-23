var BUILD = '170422.1030';
var JS_DIR = '/js/';
var components_root = "/";

var INCLUDES = [
	'config',
	'constants',
	'utils',
	'keyboard',
	'3d',
	'board',
	'dice',
	'devil',
	'2d'
]

var gamestate = {
	mode: 'ingame',
	music: true,
	sounds: true
}

var sounds, music;

var game_paused = false;

var INCLUDES_LOADED = 0;

/*$.each(INCLUDES, function(key, module){
	$.getScript(JS_DIR + 'eigh.' + module + '.js', function(){
		INCLUDES_LOADED++;
		$(document).trigger('eigh.script.loaded', [module]);
	}).fail(function(jdxhr, settings, exception){
		console.log('Error in ' + 'eigh.' + module + '.js -- ' + arguments[2].toString());
	});
});*/

console.log(BUILD);


var components = new function() {
	var self = this;
	this._loaded = [];
	this._queue = [];
	this._init = [];
	this.properties = [];

	var prefix = "eigh.";

	this.init = function() {
		$('.component').each(function(){
			self.initComponent(this.onclick());
		});
	}
	this.getProperties = function(type){
		for(i=0;i<self.properties.length;i++){
			if(self.properties[i].type == type) return self.properties[i];
		}
	}
	this.initComponent = function(o){
		if(this._loaded.indexOf(o.type) == -1 && this._init.indexOf(o.type) == -1) {
			var script = document.createElement('script');
			var head = document.getElementsByTagName('head')[0]
			script.type = 'text/javascript';
			script.src = JS_DIR + prefix + o.type+'.js?' + BUILD;
			self.properties.push(o);
			head.insertBefore(script, head.firstChild);
			this._init.push(o.type);
		}
	}
	this.require = function(a, callback) {
		for(var i=0;i<a.length;i++){
			this.initComponent({type: a[i]});
		}
		this.queue(a, callback);
	}
	this.queue = function(type, callback) {
		if(callback){
			if(this.isloaded(type)) {
				callback();
			}else {
				this._queue.push({type: type, callback: callback});
			}
		} else {
			var q = this._queue;
			var t;
			this._queue = [];
			for(var i = 0; i<q.length; i++) {
				t = q[i].type;
				if(!$.isArray(t)) t = [t];
				if(this.isloaded(t)) {
					if(q[i].callback) q[i].callback();
				} else {
					this._queue.push(q[i]);
				}
			}
		}
	}
	this.loaded = function(type) {
		this._loaded.push(type);
		this.queue(type);
		$(document).trigger('eigh.script.loaded', [type]);
	}
	this.isloaded = function(type) {
		var status = true;
		if(!$.isArray(type)) type = [type];
		for(var i=0;i<type.length;i++) {
			if(this._loaded.indexOf(type[i]) == -1) status = false;
		}
		return status;
	}
}

var Animations = new function(){
	var t = this;
	this.queue = [];
	this.start = function(callback){
		this.queue.push(callback);
		return this.queue.length - 1; //index of current action; 
	}
	this.do = function(){
		var queue = this.queue.slice(0);
		t.queue = [];
		$.each(queue, function(key, animation){
			animation();
			//t.queue.remove(key);
		});
	}
	this.cancel = function(key){
		if(key !== undefined){
			t.queue.remove(key);
		} else {
			t.queue = [];
		}
	}
}

var keyframeAnimation = function(o){
	this.frames = o.frames; // number of frames per animation
	this.offset = o.offset; // offset from overall animation
	this.duration = o.duration; // fps
	this.animationState = 0; // goes from 0 to duration
	
	var t = this;
	
	this.mesh = o.mesh;
	var mesh = this.mesh;
	
	this.speed = this.frames / this.duration;
	
	this.lastKeyframe = this.offset;
	this.currentKeyframe = this.offset;
	
	this.isPlaying = false;
	
	this.resetState = function(){
		this.animationState = 0;
		$.each(mesh.morphTargetInfluences, function(key, value){
			mesh.morphTargetInfluences[key] = 0;
		});
	}
	this.play = function(){
		this.isPlaying = true;
		Animations.start(t.updateState);
	}
	this.pause = function(){
		this.isPlaying = false;
	}
	this.stop = function(){
		this.isPlaying = false;
		this.resetState();
	}
	this.updateState = function(){
		if(!t.isPlaying) return;
		
		t.animationState += SPF;
		if(t.animationState > t.duration) t.animationState = t.animationState % t.duration;
		
		var keyframe = Math.floor(t.animationState * t.speed) + t.offset;
		var keyframe_progress = (t.animationState * t.speed + t.offset) - keyframe;
		
		//console.log(keyframe - t.offset);
		//console.log('updateState: ' + keyframe);

		if ( keyframe != t.currentKeyframe ) {

			mesh.morphTargetInfluences[ t.lastKeyframe ] = 0;
			mesh.morphTargetInfluences[ t.currentKeyframe ] = 1;
			mesh.morphTargetInfluences[ keyframe ] = 0;

			t.lastKeyframe = t.currentKeyframe;
			t.currentKeyframe = keyframe;

		}
		
		mesh.morphTargetInfluences[ keyframe ] = keyframe_progress;
		mesh.morphTargetInfluences[ t.lastKeyframe ] = 1 - keyframe_progress;
		
		Animations.start(t.updateState);
	}
}

var Player = function(){
	this.init = function(){
		this.SPEED = 3;
		this.score = 0;
		this.maxchain = 0;
		this.dicescore = [0,0,0,0,0,0]; // How much of each dice killed
	}

	this.activateChain = function(top, num, chain){
		sfx('chain');
		
		var delay = 250;
		if(chain <= 5){
			delay = 0;
		} else if(chain <= 10){
			sfx('count6_10');
		} else if(chain <= 15){
			sfx('count11_15');
		} else if(chain <= 20){
			sfx('count16_20');
		} else if(chain <= 25){
			sfx('count21_25');
		} else if(chain <= 30){
			sfx('count26_30');
		} else if(chain <= 35){
			sfx('count31_35');
		} else {
			sfx('count36');
		}
		setTimeout(function(){sfx('count' + eval((chain-1)%5+1));}, delay);
		
		this.score += top * num * chain;
		//announceChainScore(chain, top * num * chain);
		var xy = getScreenXY(devil.Mesh.position);
		ChainDisplay.show(chain, top * num, xy.x, xy.y);
	}
	this.activateOne = function(num){
		sfx('ones');
		this.score += num;
		var xy = getScreenXY(devil.Mesh.position);
		ChainDisplay.show(1, num, xy.x, xy.y);
		//announceChainScore(1, num);
	}
	this.init();
}

var player = new Player;
var menuloop = false;

var Clock = new THREE.Clock();
var SPF = Clock.getDelta() / 1000;

var animID;

function gameLoop(){
	if(!game_paused){
		animID = requestAnimationFrame(gameLoop);

		SPF = Clock.getDelta();
		//$('.spf').text(SPF.toString().substr(0,6));

		movePlayers();
		currentDice.showDice();
		//updatePlayersAnimation();
		Animations.do();
		updateScoreDisplay();
		TimeDisplay.update();
		if(TimeDisplay.time == 0){
			$(document).trigger('eigh.timeup');
		}
		//moveDices();
		Render();
	} else if(menuloop){
		animID = requestAnimationFrame(gameLoop);
		SPF = Clock.getDelta();
		//$('.spf').text(SPF.toString().substr(0,6));

		//movePlayers();
		//currentDice.showDice();
		//updatePlayersAnimation();
		updateScoreDisplay();
		Animations.do();
		//updateScoreDisplay();
		//TimeDisplay.update();
		//moveDices();
		Render();
	}
	stats.update();
}

function updateScoreDisplay(){
	//$('.score').text(leadingZeroes(player.score, 6));
	ScoreDisplay.show(player.score);
}

function gameTimeupSequence(){
	game_paused = true;
	menuloop = true;
	Animations.cancel();
	//Clock.stop();
	Board.pauseSpawn();
	while(Board.dices.length > 0){
		var d = Board.dices.pop();
		//d.Mesh.remove();
		if(d != devil.activeDice){
			scene.remove(d.Mesh);
			delete(d);
		}
	}
	music.current.pause();
	console.log('gonnagong');
	sfx('gong');
	setTimeout(function(){
		sfx('timeup');
	}, 1000);
	cameraCloseup();
	devil.rotateTo(ROTATION_FRONT);
	updateScoreDisplay();
	TimeDisplay.update();
}

function restartGame(type){
	game_paused = true;
	menuloop = false;
	Animations.cancel();
	player.init();
	music.trial.stop();
	while(scene.children.length > 0){
		scene.remove(scene.children[0]);
	}
	Clock.stop();
	Board.stopSpawn();
	

	switch(type){
		case 'time':
			window.gametype = 'time'
			break;
		case 'level':
			window.gametype = 'level'
			break;
	}

	initGame();
}

function movePlayers(){
	// Checking the keys
	devil.updateHeight();
	if(Keyboard.isActionKeyPressed()){
		if(devil.action == 'stand'){
			devil.stopAllAnimations();
			devil.animations.walk.play();
			devil.action = 'walk';
		}
		// Should check for which key is last. TODO.
		if(Keyboard.isPressed('LEFT')){
			devil.move('LEFT'); return;
		}
		if(Keyboard.isPressed('UP')){
			devil.move('UP'); return;
		}
		if(Keyboard.isPressed('RIGHT')){
			devil.move('RIGHT'); return;
		}
		if(Keyboard.isPressed('DOWN')){
			devil.move('DOWN'); return;
		}
	} else {
		if(devil.action == 'walk'){
			devil.stopAllAnimations();
			devil.animations.stand.play();
			devil.action = 'stand';
		}
	}
}
//function updatePlayersAnimation(){
//	devil.updateAnimation();
//}

var devil;
var stats;

var eventsInitialized = false;

var gametype = 'time';

function initEvents(){
	if(!eventsInitialized){
		$(document).on('keydown', function(event){
			if(event.keyCode == KEY_LEFT) {
				event.preventDefault();
			}
			if(event.keyCode == KEY_UP) {
				event.preventDefault();
			}
			if(event.keyCode == KEY_RIGHT) {
				event.preventDefault();
			}
			if(event.keyCode == KEY_DOWN) {
				event.preventDefault();
			}
			if(event.keyCode == KEY_SPACE) {
				togglePause();
				event.preventDefault();
				return;
			}
			if(event.keyCode == KEY_ESC) {
				restartGame();
				event.preventDefault();
				return;
			}
			//if(game_paused && !menuloop) togglePause();
			//console.log(event.keyCode);
		});
		$('input[name="orient"]').on('change', function(){
			setCubeOrientation(cube, $(this).val());
		});
		$('input[name="orient"]').on('keydown', function(event){
			event.stopPropagation();
		});
		$(window).blur(function(){
			if(!game_paused) togglePause();
		});

		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		stats.domElement.style.zIndex = 100;
		$('body').append( stats.domElement );

		$(document).on('Textures.loaded', Render);
		$(document).on('eigh.timeup', function(){
			gameTimeupSequence();
		});
		$(document).on('eigh.timewarning', function(){
			music.current.stop();
			music.current = music.timeup;
			music.current.play();
			if(!gamestate.music){
				music.current.mute();
			}
		});

		$('a[href="#pause"]').click(function(event){
			togglePause();
			event.preventDefault();
		});

		$('a[href="#musiconoff"]').click(function(event){
			toggleMusic();
			event.preventDefault();
		});

		$('a[href="#soundsonoff"]').click(function(event){
			toggleSounds();
			event.preventDefault();
		});

		$('a[href="#newgame"]').click(function(event){
			restartGame();
			event.preventDefault();
		});

		eventsInitialized = true;
	}
}

function initGame(){
	initCamera();
	Lights.init();
	Board.init();
	ScoreDisplay.init();
	TimeDisplay.init();
	currentDice.init();

	if(animID){
		cancelAnimationFrame(animID);
	}

	initEvents();
	
	for(var i = 0; i < 20; i++) Board.newDice('place');
	
	devil = new Devil();

	//cube = dice.Mesh;
	
	//Render();
	Clock.start();
	if(music.current){
		music.current.stop();
	}
	music.current = music.trial;

	music.current.play();
	if(!gamestate.music){
		music.current.mute();
	}

	game_paused = false;
	$('body').removeClass('paused');

	gameLoop();
	Board.startSpawn();
}

function togglePause(){
	if(game_paused){
		if(!menuloop){
			game_paused = false;
			Clock.start();
			gameLoop();
			Board.startSpawn();
			$('body').removeClass('paused');
			music.current.play();
			if(!gamestate.music){
				music.current.mute();
			}
		}
	} else {
		game_paused = true;
		Clock.stop();
		Board.pauseSpawn();
		$('body').addClass('paused');
		music.current.pause();
	}
}

function toggleMusic(){
	if(gamestate.music){
		gamestate.music = false;
		$.each(music, function(key, value){
			value.mute();
		});
	} else {
		gamestate.music = true;
		$.each(music, function(key, value){
			value.unmute();
		});
	}
}

function toggleSounds(){
	if(gamestate.sounds){
		gamestate.sounds = false;
		sounds.mute();
	} else {
		gamestate.sounds = true;
		sounds.unmute();
	}
}

function sfx(name){
	if(gamestate.sounds){
		sounds.play(name);
	}
}

function jplayerReady(id){
	$('#'+id).jPlayer("setMedia", {
        oga: "/sounds/"+id+".ogg"
    });
    console.log('media set: ' + "/sounds/"+id+".ogg");
}

$(function(){

	components.init();

	$(document).on('eigh.script.loaded', function(event, module){
		INCLUDES_LOADED++;
		console.log('Module loaded: [' + module + ']');
		if(INCLUDES_LOADED == INCLUDES.length){
			console.log('All modules loaded');
			console.log('But waiting for 3D models to load');
			$(document).on('eigh.aqui.loaded', initGame);
			//initGame();
		}
	});

	sounds = new Howl({
		urls: ['/sounds/eigh_sounds_sprites.ogg'],
		sprite: {
			gamestart: [0, 2200],
			roll: [2500, 300],
			thunder: [3000, 1950],
			appear: [5000, 1400],
			chain: [6500, 4300],
			gone: [11000, 900],
			ones: [12000, 1900],
			hop: [14000, 100],
			yup: [14500, 100],
			push: [15000, 600],
			count1: [16000, 550], // Yakee
			count2: [16700, 500], // Hapee
			count3: [17400, 650], // Yahoo
			count4: [18200, 500], // Okey
			count5: [18900, 400], // Uke
			count6_10: [19500, 300], // Belly
			count11_15: [19900, 500], // Super
			count16_20: [20500, 600], // Special
			count21_25: [21200, 550], // Sexy
			count26_30: [21800, 750], // Apiwa
			count31_35: [22600, 550], // Dinamite
			count36: [23200, 450], // Final
			gong: [24000, 2200],
			timeup: [26400, 900]
		},
		onload: console.log('SOUND LOADED')
	});

	music = {
		trial: new Howl({
			urls: ['/music/xi_trial.ogg']
		}),
		timeup: new Howl({
			urls: ['/music/bombastic_timeup.ogg']
		})
	}

	/*$('.sounds div').each(function(){
		var id=$(this).attr('id');
		$(this).jPlayer({
			ready: function(){
				console.log('jplayer ready');
				jplayerReady(id);
			},
			error: function(event){
				console.log('something wrong', event.jPlayer.error.message);
			},
			swfPath: JS_DIR + "jplayer/",
			supplied: "oga"
		});
	});
	*/
});