window.components.require(['screen'], function(){
	var introScreen = new Screen({
		name: 'intro',
		prepare: function(){
			$('body').load('/intro body', function(){
				// Load complete
			});
		}
	});
});

$(function(){
	$('[data-dicepattern]').each(function(){
		this.dicepattern = new Dicepattern(this);
	});

	$('.intro__glow').each(function(){
		var timer;
		var reverse = 1;
		var maxOpacity = 0.8;
		var minOpacity = 0.4;
		var speed = 0.02;
		var $this = $(this);
		var opacity = minOpacity;

		setInterval(function(){
			opacity += speed * reverse;
			if(opacity >= minOpacity && opacity <= maxOpacity){
				$this.css({opacity: opacity});
			} else {
				reverse *= -1;
			}
		}, 100);
	});

	var music = new Howl({
		urls: ['/music/xi_intro.ogg', '/music/xi_intro.mp3'],
		autoplay: true,
  		loop: true,
  		volume: 0.6,
  		onend: function() {
    		console.log('Play Finished!');
  		}
	});
	music.loop = true;
	window.introMusic = music;

	$('a[href="#start"]').on('click', function(){
		sceneTransition();
	});

});


/* function sceneTransition(){
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, this.cWidth / this.cHeight, 0.1, 1000 );
	var renderer = new THREE.WebGLRenderer();
	
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	renderer.domElement.style.zIndex = 999;
	renderer.domElement.style.position = 'fixed';
	renderer.domElement.style.left = 0;
	renderer.domElement.style.top = 0;
	
	camera.position.z = 5;

	var curtainSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  		map: THREE.ImageUtils.loadTexture("/img/curtain-fill.png"),
  		transparent: false,
  		color: 0,
  		useScreenCoordinates: true,
  		alignment: THREE.SpriteAlignment.topLeft
	}));

	curtainSprite.scale.set(window.innerWidth, window.innerHeight, 1);

	var curtainMask = new THREE.Sprite(new THREE.SpriteMaterial({
  		map: THREE.ImageUtils.loadTexture("/img/curtain-mask.png"),
  		transparent: true,
  		useScreenCoordinates: true,
  		alignment: THREE.SpriteAlignment.center
	}));

	//curtainMask.scale.set(window.innerHeight/3, window.innerHeight/3, 1);
	curtainMask.position.set(window.innerWidth/2, window.innerHeight/2, 0);

	var curtainTop = curtainSprite.clone();
	var curtainBottom = curtainSprite.clone();
	var curtainLeft = curtainSprite.clone();
	var curtainRight = curtainSprite.clone();

	scene.add(curtainTop);
	scene.add(curtainBottom);
	scene.add(curtainLeft);
	scene.add(curtainRight);
	scene.add(curtainMask);

	var animateDuration = 1; // seconds
	var animateState = 0;
	var clock = new THREE.Clock();

	var startMaskHeight = window.innerHeight * 2;
	var endMaskHeight = 0;

	clock.start();

	function mix(start, end, progress){
		return (end - start) * progress + start;
	}

	function animate(){
		var SPF = clock.getDelta();
		animateState += SPF / animateDuration;
		if(animateState < 1){
			window.requestAnimationFrame(animate);
		}
		
		if(animateState > 1)
			animateState = 1;

		currentMaskSize = mix(startMaskHeight, endMaskHeight, animateState);
		curtainMask.scale.set(currentMaskSize, currentMaskSize,	1);

		curtainTop.position.set(0, -(window.innerHeight + currentMaskSize)/2,0);
		curtainBottom.position.set(0, (window.innerHeight + currentMaskSize)/2,0);
		curtainLeft.position.set(-(window.innerWidth + currentMaskSize)/2,0,0);
		curtainRight.position.set((window.innerWidth + currentMaskSize)/2,0,0);

		renderer.render(scene, camera);

		if(animateState == 1){
			// End
			transitionEnd();
		}
	}
	animate();

	function transitionEnd(){
		renderer.domElement.parentNode.removeChild(renderer.domElement);
		delete renderer;
		delete camera;
		delete scene;
	}
}

*/


/* =====================================================
 * Dicepattern
 * ===================================================== */

var Dicepattern = function(container){

	var $container = $(container);
	this.container = container;

	this.cWidth = $container.width();
	this.cHeight = $container.height();
	this.numX = Math.ceil(this.cWidth / this.constants.stepX);
	this.numY = Math.ceil(this.cHeight / this.constants.stepY);

	this.buildpattern();
	this.startAnimate();
}

Dicepattern.prototype.numX = 30;
Dicepattern.prototype.numY = 20;

Dicepattern.prototype.constants = {
	stepX: 32,
	stepY: 32,
	maxOpacity: 0.5,
	speed: 1/3000 // one full cicle per 3 seconds
}

Dicepattern.prototype.getRandomDiceNum = function(){
	return Math.floor(Math.random() * 6);
}

Dicepattern.prototype.buildpattern = function(){

	this.dices = [];

	var container = this.container;
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, this.cWidth / this.cHeight, 0.1, 1000 );
	var renderer = new THREE.WebGLRenderer();
	
	renderer.setSize(this.cWidth, this.cHeight);
	container.appendChild(renderer.domElement);
	
	camera.position.z = 5;

	var sprites = [];
	for(var i = 1; i <= 6; i++){
		sprites.push(new THREE.Sprite(new THREE.SpriteMaterial({
	  		map: THREE.ImageUtils.loadTexture("/img/intro-pattern-d"+i+".png"),
	  		transparent: true,
	  		useScreenCoordinates: true,
	  		alignment: THREE.SpriteAlignment.topLeft
		})));
	}

	this.scene = scene;
	this.renderer = renderer;
	this.camera = camera;
	this.sprites = sprites;

	for(var y = 0; y <= this.numY; y++){
		for(var x = 0; x <= this.numX; x++){

			var dice = this.sprites[this.getRandomDiceNum()].clone();

			dice.material = dice.material.clone();

			dice.material.opacity = Math.random() * this.constants.maxOpacity;
			dice.position.set(x * this.constants.stepX, y * this.constants.stepY, 1);
			dice.scale.set(24,24,1);

			if(Math.random() >= 0.5){
				dice.__reverse = 1;
			} else {
				dice.__reverse = -1;
			}

			this.dices.push(dice);
			this.scene.add(dice);
		}
	}
}

Dicepattern.prototype.animate = function(){
	var self = this;
	if(!this.isAnimationStarted)
		return;

	var d = new Date();
	var timestamp = d.getTime();
	var timedelta = timestamp - self.lasttimestamp;
	if(!timedelta || timedelta > 1000)
		timedelta = 0;

	$.each(this.dices, function(key, dice){
		var opacity = dice.material.opacity;
		opacity += timedelta * self.constants.speed * dice.__reverse;
		if(opacity < 0){
			dice.material = self.sprites[self.getRandomDiceNum()].material.clone();
			dice.material.opacity = 0;
		}
		if(opacity <= self.constants.maxOpacity && opacity >= 0){
			dice.material.opacity = opacity;
		} else {
			dice.__reverse *= -1;
		}
	});

	self.lasttimestamp = timestamp;

	this.renderer.render(this.scene, this.camera);

	window.requestAnimationFrame(function(){
		self.animate();
	});
}

Dicepattern.prototype.startAnimate = function(){
	this.isAnimationStarted = true;
	var self = this;
	window.requestAnimationFrame(function(){
		self.animate();
	});
}

Dicepattern.prototype.stopAnimate = function(){
	this.isAnimationStarted = false;
}