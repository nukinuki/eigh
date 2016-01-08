/* Screen class */

var Screen = function(options){
	// Constructor
	this.name = '' + new Date().getTime();
	$.extend(this, options);

	window.eigh = window.eigh || {};
	window.eigh.screens = window.eigh.screens || {};
	window.eigh.screens[this.name] = this;

	this.prepare();
}

Screen.prototype.prepare = function(){
	// Do preload and other stuff
}

// direction = 'in' / 'out'
Screen.prototype.transition = function(direction, callback){

	if(direction != 'in'){
		direction = 'out';
	}

	var self = this;

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
  		map: THREE.ImageUtils.loadTexture(imgdir + "curtain-fill.png"),
  		transparent: false,
  		color: 0,
  		useScreenCoordinates: true,
  		alignment: THREE.SpriteAlignment.topLeft
	}));

	curtainSprite.scale.set(window.innerWidth, window.innerHeight, 1);

	var curtainMask = new THREE.Sprite(new THREE.SpriteMaterial({
  		map: THREE.ImageUtils.loadTexture(imgdir + "curtain-mask.png"),
  		transparent: true,
  		useScreenCoordinates: true,
  		alignment: THREE.SpriteAlignment.center
	}));

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

	if(direction == 'out'){
		var startMaskHeight = window.innerHeight * 2;
		var endMaskHeight = 0;
	} else {
		var startMaskHeight = 0; 
		var endMaskHeight = window.innerHeight * 2;
	}

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
		self.beforeTransitionEnd(direction);
		if(renderer.domElement.parentNode){
			renderer.domElement.parentNode.removeChild(renderer.domElement);
		}
		delete renderer;
		delete camera;
		delete scene;
		if(typeof(callback) == 'function'){
			callback();
		}
		self.afterTransitionEnd(direction);
	}
}
Screen.prototype.transitionIn = function(callback){
	this.transition('in', callback);
}
Screen.prototype.transitionOut = function(callback){
	this.transition('out', callback);
}
Screen.prototype.beforeTransitionEnd = function(direction){
	// runs before deleting the masking canvas
}
Screen.prototype.afterTransitionEnd = function(direction){
	// runs after deleting the masking canvas
}
Screen.prototype.transitionTo = function(name){
	this.transition('out', function(){
		console.log('transition out complete to ' + name);
		window.eigh.screens[name].start();
		window.eigh.screens[name].transitionIn();
	});

}

window.components.require(['config'], function(){
	window.components.loaded('screen');
});