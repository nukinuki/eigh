// Globals
var BUILD = '160108.0242';
var JS_DIR = '/js/';
var components_root = "/";

/** Components class
 * Load other components on-the-fly and check for requirements. Somewhat similar to Require.js */
var components = new function() {
	var self = this;
	this._loaded = []; // Those components, who finished their init with components.loaded(...) 
	this._queue = []; // Queue of requirements and callbacks
	this._init = []; // Those componeners, who are loaded and started their init
	this.properties = []; // Array of additional properties for components
	this.namespace = "eigh";

	var prefix = this.namespace + ".";

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
		$(document).trigger('eighScriptLoaded', [type]);
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

// Namespace
var eigh = new function(){

	var gamestate = {
		mode: 'ingame',
		music: true,
		sounds: true
	}

	var self = this;

	console.log(BUILD);

	// Classes and functions

	function loadSounds(){
		if(!this.sounds){
			this.sounds = new Howl({
				urls: ['/sounds/eigh_sounds_sprites.ogg', '/sounds/eigh_sounds_sprites.mp3'],
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
		}
	}

	function loadMusic(){
		if(!this.music){
			this.music = {
				trial: new Howl({
					urls: ['/music/xi_trial.ogg', '/music/xi_trial.mp3']
				}),
				timeup: new Howl({
					urls: ['/music/bombastic_timeup.ogg', '/music/bombastic_timeup.mp3']
				}),
				intro: new Howl({
					urls: ['/music/xi_intro.ogg', '/music/xi_intro.mp3'],
					loop: false, //it somehow doesn't work
			  		onend: function() {
			    		self.music.play();
			  		}
				})
			}
		}
	}

	function toggleSounds(){
		if(gamestate.sounds){
			gamestate.sounds = false;
			this.sounds.mute();
		} else {
			gamestate.sounds = true;
			this.sounds.unmute();
		}
	}

	function toggleMusic(){
		if(gamestate.music){
			gamestate.music = false;
			$.each(this.music, function(key, value){
				value.mute();
			});
		} else {
			gamestate.music = true;
			$.each(this.music, function(key, value){
				value.unmute();
			});
		}
	}

	function sfx(name){
		if(gamestate.sounds){
			self.sounds.play(name);
		}
	}

	function getSPF(){
		return eigh.currentGame.getSPF();
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
			
			t.animationState += getSPF();
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

	// Exports

	this.gamestate = gamestate;
	
	this.toggleSounds = toggleSounds;
	this.toggleMusic = toggleMusic;
	this.sfx = sfx;
	this.Animations = Animations;
	this.keyframeAnimation = keyframeAnimation;
	this.loadSounds = loadSounds;
	this.loadMusic = loadMusic;
	this.getSPF = getSPF;

}

/** Player class
 *  Keep current score and speed settings.
 *  Also activate SFX for score and chains.
 */ 
eigh.Player = function(){

	var sfx = eigh.sfx;

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
		var xy = eigh.scene.getScreenXY(eigh.currentGame.devil.Mesh.position);
		eigh.ChainDisplay.show(chain, top * num, xy.x, xy.y);
	}
	this.activateOne = function(num){
		sfx('ones');
		this.score += num;
		var xy = eigh.scene.getScreenXY(eigh.currentGame.devil.Mesh.position);
		eigh.ChainDisplay.show(1, num, xy.x, xy.y);
		//announceChainScore(1, num);
	}
	this.init();
}

eigh.Game = function(){

	this.GAME_REQUIRE = [
		'config',
		'constants',
		'utils',
		'keyboard',
		'touch',
		'board',
		'dice',
		'scene',
		'devil',
		'2d',
		'screen'
	];

	var game_paused = false;

	var player = new eigh.Player;
	var menuloop = false;

	var Clock = new THREE.Clock();
	var SPF = Clock.getDelta() / 1000;

	var devil;
	var stats;

	var eventsInitialized = false;

	var gametype = 'time';

	var animID;

	var self = this;

	function gameLoop(){
		if(!game_paused){
			animID = requestAnimationFrame(gameLoop);

			SPF = Clock.getDelta();
			movePlayers();
			eigh.currentDice.showDice();
			eigh.Animations.do();
			updateScoreDisplay();
			eigh.TimeDisplay.update();
			if(eigh.TimeDisplay.time == 0){
				$(document).trigger('eighTimeup');
			}
			eigh.scene.Render();
		} else if(menuloop){
			animID = requestAnimationFrame(gameLoop);
			SPF = Clock.getDelta();
			updateScoreDisplay();
			eigh.Animations.do();
			eigh.scene.Render();
		}
		stats.update();
	}

	function updateScoreDisplay(){
		eigh.ScoreDisplay.show(player.score);
	}

	function gameTimeupSequence(){
		game_paused = true;
		menuloop = true;
		eigh.Animations.cancel();
		eigh.board.pauseSpawn();
		while(eigh.board.dices.length > 0){
			var d = eigh.board.dices.pop();
			if(d != devil.activeDice){
				eigh.scene.scene.remove(d.Mesh);
				delete(d);
			}
		}
		eigh.music.current.pause();
		
		eigh.sfx('gong');
		setTimeout(function(){
			eigh.sfx('timeup');
		}, 1000);
		
		eigh.scene.cameraCloseup();
		devil.rotateTo(eigh.constants.ROTATION_FRONT);
		updateScoreDisplay();
		eigh.TimeDisplay.update();
	}

	function restartGame(){
		stopGame();
		initGame();
	}

	function stopGame(){
		game_paused = true;
		menuloop = false;
		eigh.Animations.cancel();
		player.init();
		eigh.music.trial.stop();
		eigh.board.stopSpawn();
		while(eigh.scene.scene.children.length > 0){
			eigh.scene.scene.remove(eigh.scene.scene.children[0]);
		}
		Clock.stop();
	}

	function movePlayers(){
		// Checking the keys
		var devil = self.devil;
		devil.updateHeight();
		if(eigh.keyboard.isActionKeyPressed() || eigh.touch.isMoving()){
			if(devil.action == 'stand'){
				devil.stopAllAnimations();
				devil.animations.walk.play();
				devil.action = 'walk';
			}
			// Should check for which key is last. TODO.
			if(eigh.keyboard.isPressed('LEFT') || eigh.touch.isLeft()){
				devil.move('LEFT'); return;
			}
			if(eigh.keyboard.isPressed('UP') || eigh.touch.isUp()){
				devil.move('UP'); return;
			}
			if(eigh.keyboard.isPressed('RIGHT') || eigh.touch.isRight()){
				devil.move('RIGHT'); return;
			}
			if(eigh.keyboard.isPressed('DOWN') || eigh.touch.isDown()){
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

	function initEvents(){
		if(!eventsInitialized){
			$(document).on('keydown.game', function(e){
				if(e.keyCode == eigh.constants.KEY_LEFT ||
					e.keyCode == eigh.constants.KEY_UP ||
					e.keyCode == eigh.constants.KEY_RIGHT ||
					e.keyCode == eigh.constants.KEY_DOWN ||
					e.keyCode == eigh.constants.KEY_SPACE ||
					e.keyCode == eigh.constants.KEY_ESC
				) {
					e.preventDefault();
				}
				if(e.keyCode == eigh.constants.KEY_SPACE) {
					togglePause();
					return;
				}
				if(e.keyCode == eigh.constants.KEY_ESC) {
					window.eigh.screens.game.backToIntro();
					return;
				}
			});

			$(window).on('blur.game', function(){
				if(!game_paused) togglePause();
			});
			
			stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';
			stats.domElement.style.zIndex = 100;
			$('body').append( stats.domElement );

			$(document).on('eighTexturesLoaded.game', eigh.scene.Render);
			
			$(document).on('eighTimeup.game', function(){
				gameTimeupSequence();
			});
			$(document).on('eighTimewarning.game', function(){
				eigh.music.current.stop();
				eigh.music.current = eigh.music.timeup;
				eigh.music.current.play();
				if(!eigh.gamestate.music){
					eigh.music.current.mute();
				}
			});

			// Mini-menu

			$(document).on('click.game', 'a[href="#pause"]', function(e){
				togglePause();
				e.preventDefault();
			});

			$(document).on('click.game', 'a[href="#musiconoff"]', function(e){
				eigh.toggleMusic();
				e.preventDefault();
			});

			$(document).on('click.game', 'a[href="#soundsonoff"]', function(e){
				eigh.toggleSounds();
				e.preventDefault();
			});

			$(document).on('click.game', 'a[href="#newgame"]', function(e){
				restartGame();
				e.preventDefault();
			});

			$(document).on('click.game', 'a[href="#exit"]', function(e){
				window.eigh.screens.game.backToIntro();
				e.preventDefault();
			});

			eventsInitialized = true;
		}
	}

	function removeEvents(){
		$(document).off('.game');
		eventsInitialized = false;
	}

	function initGame(){
		eigh.scene.initCamera();
		eigh.scene.Lights.init();
		eigh.board.init();
		eigh.ScoreDisplay.init();
		eigh.TimeDisplay.init();
		eigh.currentDice.init();

		if(animID){
			cancelAnimationFrame(animID);
		}

		initEvents();
		
		for(var i = 0; i < 20; i++) eigh.board.newDice('place');
		
		devil = new eigh.Devil();
		self.devil = devil;

		Clock.start();
		if(eigh.music.current){
			eigh.music.current.stop();
		}
		eigh.music.current = eigh.music.trial;

		eigh.music.current.play();
		if(!eigh.gamestate.music){
			eigh.music.current.mute();
		}

		game_paused = false;
		$('body').removeClass('paused');

		gameLoop();
		eigh.board.startSpawn();
	}

	function togglePause(){
		if(game_paused){
			if(!menuloop){
				game_paused = false;
				Clock.start();
				gameLoop();
				eigh.board.startSpawn();
				$('body').removeClass('paused');
				eigh.music.current.play();
				if(!eigh.gamestate.music){
					eigh.music.current.mute();
				}
			}
		} else {
			game_paused = true;
			Clock.stop();
			eigh.board.pauseSpawn();
			$('body').addClass('paused');
			eigh.music.current.pause();
		}
	}

	// Exports

	this.isGamePaused = function(){ return game_paused; };
	this.initGame = initGame;
	this.togglePause = togglePause;
	this.removeEvents = removeEvents;
	this.initEvents = initEvents;
	this.restartGame = restartGame;
	this.stopGame = stopGame;
	this.player = player;
	this.Clock = Clock;
	this.getSPF = function(){
		return SPF;
	}
}

eigh.trial = new eigh.Game();
eigh.currentGame = eigh.trial;

window.components.require(['screen'], function(){

	eigh.loadSounds();
	eigh.loadMusic();

	var gameScreen = new Screen({
		name: 'game',
		prepare: function(){
			
		},
		start: function(){
			$('body').load('/game #wrapper', function(){
				gameScreen.init();
				window.components.require(eigh.currentGame.GAME_REQUIRE, function(){
					eigh.scene.ready(function(){
						eigh.scene.sceneInit();
						eigh.touch.initDOMEvents();
						eigh.currentGame.initGame();
						gameScreen.transitionIn();
					});
				});
			});
		},
		init: function(){

		},
		backToIntro: function(){
			//music.current.fade({from: 1.0, to: 0.0, duration: 1, callback: function(){
			//	music.current.stop();
			//}});
			eigh.currentGame.stopGame();
			eigh.currentGame.removeEvents();
			this.transitionTo('intro');
		},
		beforeTransitionEnd: function(direction){
			if(direction == 'out'){
				eigh.currentGame.game_paused = true;
				eigh.currentGame.Clock.stop();
				eigh.board.pauseSpawn();
				eigh.music.current.stop();
				$('body').html("");
				//window.eigh.screens.intro.start();
			}
		}
	});
});


$(function(){

	// Logging
	$(document).on('eighScriptLoaded', function(event, module){
		console.log('Module loaded: [' + module + ']');
	});

	window.components.require(['intro'], function(){
		eigh.screens.intro.start();
	});
});