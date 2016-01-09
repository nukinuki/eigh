// Here goes everything

eigh.ScoreDisplay = new function(){
  var t = this;

	var canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  var ctx = canvas.getContext('2d');

  this.canvas = canvas;
  this.ctx = ctx;

  var texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    useScreenCoordinates: true,
    alignment: THREE.SpriteAlignment.topLeft
  }));

  var sprite_w;
  var sprite_y;

  this.sprite = sprite;

  this.init = function(){
    this.initWidth();
    this.lastScore = -1;
    eigh.scene.scene.add(sprite);
    this.show(0);
  }

  this.initWidth = function(){
    sprite_w = Math.round(eigh.scene.scene_width / 4);
    sprite_y = eigh.scene.scene_height - sprite_w;

    sprite.position.set(eigh.scene.scene_width * 0.02,sprite_y,0);
    sprite.scale.set(sprite_w,sprite_w,1);
  }

	this.show = function(score){
		if(score != this.lastScore){
			var dif = score - this.lastScore;
			var step = Math.ceil(dif / 30);

			if(step + this.lastScore < score) score = this.lastScore + step;

  		ctx.fillStyle = "#FFF";
	    ctx.font = "60pt milkywell";
	    ctx.textBaseline = "middle";
	    ctx.clearRect (0, 0, 500, 500);
	    ctx.fillText(leadingZeroes(score, 6), 0, 250);
	    texture.needsUpdate = true;
	    this.lastScore = score;
	  }
	}
}

eigh.ChainDisplay = new function(){
  var t = this;

  this.show = function(chain, score, x, y){
    var canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "#ff6c6c"; // Player color
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth=5;
    ctx.font = "90pt milkywell";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(score + "×" + chain, 250, 250);
    ctx.strokeText(score + "×" + chain, 250, 250);

    var canvas2 = document.createElement('canvas');
    canvas2.width = 500;
    canvas2.height = 500;
    var ctx2 = canvas2.getContext('2d');
    ctx2.fillStyle = "#ff6c6c"; // Player color
    ctx2.strokeStyle = "rgba(0,0,0,0.7)";
    ctx2.lineWidth=5;
    ctx2.font = "120pt milkywell";
    ctx2.textBaseline = "middle";
    ctx2.textAlign = "center";
    ctx2.fillText(score * chain, 250, 250);
    ctx2.strokeText(score * chain, 250, 250);

    var texture1 = new THREE.Texture(canvas);
    texture1.needsUpdate = true;

    var sprite_chain = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture1,
      transparent: true,
      useScreenCoordinates: true,
      alignment: THREE.SpriteAlignment.center
    }));
    this.sprite_chain = sprite_chain;

    var texture2 = new THREE.Texture(canvas2);
    texture2.needsUpdate = true;

    var sprite_score = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture2,
      transparent: true,
      useScreenCoordinates: true,
      alignment: THREE.SpriteAlignment.center
    }));

    var sprite_w = Math.round(eigh.scene.scene_width / 4);

    sprite_chain.position.set(x, y, 0);
    sprite_chain.scale.set(sprite_w, sprite_w, 1);
    sprite_score.scale.set(sprite_w, sprite_w, 1);

    eigh.scene.scene.add(sprite_chain);

    eigh.Animations.start(function(){
      t.animateChain(sprite_chain, sprite_score);
    });
  }

  this.animateChain = function(sprite_chain, sprite_score, state){
    var CHAINSCORE_LIFT_SPEED = 0.5;

    if(!state){
      state = {
        phase: 0,
        progress: 0
      }
    }
    if(state.progress < 1){

      if(state.progress < 0.5){
        sprite_chain.position.y -= 1;
        sprite_chain.scale.x -= 1;
        sprite_chain.scale.y -= 1;
        sprite_chain.material.opacity -= 0.01;
      } else {
        if(state.phase == 0){
          sprite_score.position = sprite_chain.position.clone();
          state.phase = 1;
          
          eigh.scene.scene.remove(sprite_chain);
          eigh.scene.scene.add(sprite_score);
        }
        sprite_score.position.y -= 1;
        sprite_score.scale.x -= 1;
        sprite_score.scale.y -= 1;
        sprite_score.material.opacity -= 0.01;
      }
      state.progress += eigh.getSPF() * CHAINSCORE_LIFT_SPEED;
      eigh.Animations.start(function(){
        t.animateChain(sprite_chain, sprite_score, state);
      });

    } else {
      eigh.scene.scene.remove(sprite_score);
    }
  }
}

eigh.TimeDisplay = new function(){
  var t = this;

  var canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  var ctx = canvas.getContext('2d');

  this.canvas = canvas;
  this.ctx = ctx;

  var texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    useScreenCoordinates: true,
    alignment: THREE.SpriteAlignment.center
  }));

  var sprite_w;
  var sprite_y;

  this.sprite = sprite;

  this.gettimestring = function(time){
    var minutes = Math.floor(time / 60);
    var seconds = Math.ceil(time % 60);
    var ms = "" + (time % 60 - Math.floor(time % 60)) * 1000;
    if(seconds < 10) seconds = "0" + seconds;

    if(time > 60) return minutes + ":" + seconds;

    return seconds + "'" + ms.substr(0,2);
  }

  this.init = function(){
    this.time = eigh.config.TIME_LIMIT;
    this.lasttime = this.gettimestring(eigh.config.TIME_LIMIT); // should make it

    sprite_w = Math.round(eigh.scene.scene_width / 3);
    sprite_y = eigh.scene.scene_height * 0.08;

    sprite.position.set(eigh.scene.scene_width / 2, sprite_y, 0);
    sprite.scale.set(sprite_w,sprite_w,1);

    eigh.scene.scene.add(sprite);
  }

  this.update = function(){

    var str = this.gettimestring(this.time);
    if(str != this.lasttime){

      ctx.fillStyle = "#FFF";
      ctx.font = "70pt milkywell";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.clearRect (0, 0, 500, 500);
      /* ctx.fillText(str, 250, 250); */

      /* monospaced: */
      var nwidth = 90; /* width of 'n' */
      var dotwidth = 25; /* width of '.' */
      var fullwidth = 3*nwidth + dotwidth; /* 0:00 */
      var startx = (500 - fullwidth) / 2;
      var c;
      for(i=0;i<str.length;i++){
        c = str.substr(i,1);
        if(c == '1'){
          startx += nwidth / 2;
          ctx.textAlign = "center";
          ctx.fillText(c, startx, 250);
          ctx.textAlign = "left";
          startx += nwidth / 2;
        } else {
          ctx.fillText(c, startx, 250);
          if(c != ':' && c != "'"){
            startx += nwidth;
          } else {
            startx += dotwidth;
          }
        }
      }

      texture.needsUpdate = true;
      this.lasttime = str;
    }

    var temptime = this.time;
    this.time -= eigh.getSPF();

    if(temptime > eigh.config.TIME_WARNING && this.time <= eigh.config.TIME_WARNING){
      $(document).trigger('eighTimewarning');
    }


    if(this.time <= 0){
      this.time = 0;
      return;
    }
  }
}

window.components.require(['scene'], function(){
  window.components.loaded('2d');
});