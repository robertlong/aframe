/* global AFRAME THREE TWEEN warn */
AFRAME.registerComponent('music', {
  schema: {
    src: { default: '' },
    on: { default: 'click' },
    autoplay: { default: false },
    loop: { default: false },
    volume: { default: 1 }
  },

  init: function () {
    this.listener = null;
    this.sound = null;
  },

  update: function (oldData) {
    console.log(oldData);
    var data = this.data;
    var el = this.el;
    var sound = this.sound;
    var srcChanged = data.src !== oldData.src;

    // Create new sound if not yet created or changing `src`.
    if (srcChanged) {
      if (!data.src) {
        warn('Audio source was not specified with `src`');
        return;
      }
      sound = this.setupSound();
    }

    sound.autoplay = data.autoplay;
    sound.setLoop(data.loop);
    sound.setVolume(data.volume);

    if (data.on !== oldData.on) {
      if (oldData.on) { el.removeEventListener(oldData.on); }
      el.addEventListener(data.on, this.play.bind(this));
    }

    // All sound values set. Load in `src`.
    if (srcChanged) { sound.load(data.src); }
  },

  remove: function () {
    this.el.removeObject3D('sound');
    try {
      this.sound.disconnect();
    } catch (e) {
      // disconnect() will throw if it was never connected initially.
      warn('Audio source not properly disconnected');
    }
  },

  /**
   * Removes current sound object, creates new sound object, adds to entity.
   *
   * @returns {object} sound
   */
  setupSound: function () {
    var el = this.el;
    var sceneEl = el.sceneEl;
    var sound = this.sound;

    if (sound) {
      this.stop();
      el.removeObject3D('sound');
    }

    // Only want one AudioListener. Cache it on the scene.
    var listener = this.listener = sceneEl.audioListener || new THREE.AudioListener();
    sceneEl.audioListener = listener;

    if (sceneEl.camera) {
      sceneEl.camera.add(listener);
    }

    // Wait for camera if necessary.
    sceneEl.addEventListener('camera-set-active', function (evt) {
      evt.detail.cameraEl.getObject3D('camera').add(listener);
    });

    sound = this.sound = new THREE.Audio(listener);
    el.setObject3D('sound', sound);

    sound.source.onended = function () {
      sound.onEnded();
      el.emit('sound-ended');
    };

    return sound;
  },

  play: function () {
    if (!this.sound.source.buffer) { return; }
    this.sound.play();
  },

  stop: function () {
    if (!this.sound.source.buffer) { return; }
    this.sound.stop();
  },

  pause: function () {
    if (!this.sound.source.buffer || !this.sound.isPlaying) { return; }
    this.sound.pause();
  }
});

AFRAME.registerSystem('enemy', {
  init: function () {
    this.enemies = [];
    document.querySelector('a-scene').addEventListener('game-over', function () {
      console.log('Enemyessss gameover');
    });

    this.createNewEnemy();
    // this.createNewEnemy();
    // this.createNewEnemy();
  },
  tick: function (time, delta) {
  },
  createNewEnemy: function () {
    var entity = document.createElement('a-entity');
    var radius = 13;
    var angle = Math.random() * Math.PI * 2;
    var dist = radius * Math.sqrt(Math.random());
    var point = [ dist * Math.cos(angle),
                  dist * Math.sin(angle),
                  Math.sqrt(radius * radius - dist * dist)];
    if (point[1] < 0) {
      // point[1] = -point[1];
    }

    entity.setAttribute('enemy', {
      lifespan: 6 * (Math.random() + 1),
      startPosition: {x: point[0], y: -10, z: point[2]},
      endPosition: {x: point[0], y: point[1], z: point[2]}
    });

    this.sceneEl.appendChild(entity);

    // this.enemies.push(entity);

    entity.setAttribute('position', {x: point[0], y: -10, z: point[2]});
    // entity.setAttribute('geometry', {primitive: 'icosahedron', radius: 1, detail: 1});
    // entity.setAttribute('obj-model', {obj: 'url(mydroid2.obj)', mtl: 'url(mydroid2.mtl)'});
    entity.setAttribute('obj-model', {obj: '#droid-obj', mtl: '#droid-mtl'});

    // entity.setAttribute('material', {shader: 'standard', color: '#ff9', transparent: 'true', opacity: 0.5, flatshading: true});
    entity.setAttribute('material', {shader: 'standard', color: '#ff9', transparent: 'true', opacity: 1.0, flatshading: true});

    // console.log(document.getElementById('droid').object3D.children[0]);
    // entity.el.object3D = document.getElementById('droid').getObject3D('mesh');
  }
});

AFRAME.registerComponent('enemy', {
  schema: {
    active: { default: true }
  },

  deactivate: function () {
    this.active = false;
    this.visible = false;
  },
  activate: function () {
    this.active = true;
    this.visible = true;
  },
  init: function () {
    this.system.enemies.push(this);
    this.life = this.data.lifespan;
    this.alive = true;
    this.exploding = false;
    this.el.addEventListener('hit', this.collided.bind(this));
    // @todo Maybe we could send the time in init?
    this.time = this.el.sceneEl.time;
/*
    this.el.setAttribute('sound', {
      src: '51464__smcameron__bombexplosion.ogg',
      on: 'enemy-hit',
      //volume: 10
      volume: 1
    });
*/
    this.soundExplosion = document.createElement('a-entity');
    this.soundExplosion.setAttribute('sound', {
      src: '51464__smcameron__bombexplosion.ogg',
      on: 'enemy-hit',
      volume: 10
    });
    this.soundExplosion.addEventListener('loaded', function () {
      this.el.emit('appearing');
    }.bind(this));
    this.el.appendChild(this.soundExplosion);

    this.soundAppearing = document.createElement('a-entity');
    this.soundAppearing.setAttribute('sound', {
      src: '268496__headphaze__robots-and-electromechanics-v2-147.ogg',
      on: 'appearing',
      volume: 10
    });
    this.soundAppearing.addEventListener('loaded', function () {
      this.el.emit('appearing');
    }.bind(this));
  },
  collided: function () {
    if (this.exploding) {
      return;
    }

    this.el.emit('enemy-hit');
    this.soundExplosion.emit('enemy-hit');

    this.shootBack();
    // var mesh = this.el.getObject3D('mesh');
    // mesh.material.color.setHex(0xff0000);
    // this.explodingTime = this.el.sceneEl.time;
    var children = this.el.getObject3D('mesh').children;
    for (var i = 0; i < children.length; i++) {
      // children[i].explodingDirection = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
      children[i].explodingDirection = new THREE.Vector3(
        2 * Math.random() - 1,
        2 * Math.random() - 1,
        2 * Math.random() - 1);
      children[i].startPosition = children[i].position.clone();
      children[i].endPosition = children[i].position.clone().add(children[i].explodingDirection.clone().multiplyScalar(3));
    }
    this.exploding = true;
  },
  died: function () {
    this.alive = false;
    this.removeAll();
    this.system.createNewEnemy();
  },
  shootBack: function () {
    var entity = document.createElement('a-entity');
    var direction = this.el.object3D.position.clone();
    var head = this.el.sceneEl.camera.el.components['look-controls'].dolly.position.clone();
    direction = head.sub(direction).normalize();

    entity.setAttribute('enemybullet', {direction: direction, position: this.el.object3D.position});
    entity.setAttribute('position', this.el.object3D.position);
    entity.setAttribute('geometry', {primitive: 'icosahedron', radius: 0.08, detail: 0});
    entity.setAttribute('material', {shader: 'standard', flatShading: true, color: '#f00'});
    this.el.sceneEl.appendChild(entity);
  },
  removeAll: function () {
    var index = this.system.enemies.indexOf(this);
    this.system.enemies.splice(index, 1);
    this.el.parentElement.removeChild(this.el);
  },

  tick: function (time, delta) {
    // if (!this.alive || !this.active) {
    if (!this.alive) {
      return;
    }

    if (this.exploding) {
      if (!this.explodingTime) {
        this.explodingTime = time;
      }
      var duration = 3000;
      var t0 = (time - this.explodingTime) / duration;
      var children = this.el.getObject3D('mesh').children;
      t = TWEEN.Easing.Exponential.Out(t0);

      for (var i = 0; i < children.length; i++) {
        // t = TWEEN.Easing.Exponential.Out(t);

        var pos = children[i].startPosition.clone();

        children[i].position.copy(children[i].startPosition.clone().lerp(children[i].endPosition, t));

        // var inc = delta / 250;
/*
        var dir = children[i].explodingDirection.clone().multiplyScalar(inc);
        children[i].rotation.x+= dir.x;
        children[i].rotation.y+= dir.y;
        children[i].rotation.z+= dir.z;
*/
        var dur = 1 - t;
        // dur*=dur;
        children[i].scale.x = dur;
        children[i].scale.y = dur;
        children[i].scale.z = dur;
        children[i].material.opacity = (1 - t0);
        children[i].material.transparent = true;
      }
      // this.el.setAttribute('scale',{x:t,y:t,z:t});
      if (t0 >= 1) {
        console.log('Died!');
        this.died();
      }
      return;
    }

    // var radius = 0;
    // var currentPosition = this.el.getAttribute('position');
    // if (currentPosition.y < this.data.finalPosition.y) {
    // console.log(currentPosition.y.toFixed(2), this.data.finalPosition.y.toFixed(2), currentPosition.y < this.data.finalPosition.y);
    duration = 2000;
    var t = (time - this.time) / duration;
    if (t > 1) {
      t = 1;
    }

    pos = new THREE.Vector3(this.data.startPosition.x, this.data.startPosition.y, this.data.startPosition.z);
    t = TWEEN.Easing.Back.Out(t);
    pos.lerp(this.data.endPosition, t);
    // currentPosition.y+=easeInQuad(delta/1000);
    // if (pos.y > this.data.finalPosition.y) {
      // pos.y = this.data.finalPosition.y;
    // }
    this.el.setAttribute('position', pos);

/*
    var currentPosition = this.el.getAttribute('position');
    //if (currentPosition.y < this.data.finalPosition.y) {
      //console.log(currentPosition.y.toFixed(2), this.data.finalPosition.y.toFixed(2), currentPosition.y < this.data.finalPosition.y);
      var duration = 2000;
      var t = (time - this.time)/duration;
      if (t>1)
        t=1;
      var pos = new THREE.Vector3(this.data.startPosition.x, this.data.startPosition.y, this.data.startPosition.z);
      t = TWEEN.Easing.Back.Out(t);
      pos.lerp(this.data.endPosition, t);
      //currentPosition.y+=easeInQuad(delta/1000);
      //if (pos.y > this.data.finalPosition.y) {
        //pos.y = this.data.finalPosition.y;
      //}
      this.el.setAttribute('position', pos);
*/
    // }
    // entity.setAttribute('position', {x: point[0], y: 0, z: point[2]});

    if (this.life > 0) {
      this.life -= delta / 1000;
      if (this.life < 0) {
        this.life = 0;
        this.collided();
      }

      // var model = this.el.getObject3D('mesh');
      this.el.setAttribute('material', {transparent: true});
      // model.material.transparent = true;
      // var lifePerc = 1 - this.life / this.data.lifespan;
      // model.material.opacity = lifePerc;
      // this.el.setAttribute('material', {opacity: lifePerc});

      var head = this.el.sceneEl.camera.el.components['look-controls'].dolly.position.clone();
      this.el.object3D.lookAt(head);
    } else {
//      console.log("Dead!");
    }
  },

  update: function () {
  },

  remove: function () {
/*    if (!this.model) { return; }
    this.el.removeObject3D('mesh');*/
  }
});
