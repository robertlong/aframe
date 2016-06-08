/* global AFRAME THREE TWEEN */
AFRAME.registerSystem('enemy', {
  init: function () {
    this.enemies = [];

    this.createNewEnemy();
    this.createNewEnemy();
    this.createNewEnemy();
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
      point[1] = -point[1];
    }

    entity.setAttribute('enemy', {
      lifespan: 6 * (Math.random() + 1),
      startPosition: {x: point[0], y: -10, z: point[2]},
      endPosition: {x: point[0], y: point[1], z: point[2]}
    });

    this.sceneEl.appendChild(entity);

    entity.setAttribute('position', {x: point[0], y: -10, z: point[2]});
    // entity.setAttribute('geometry', {primitive: 'icosahedron', radius: 1, detail: 1});
    entity.setAttribute('obj-model', {obj: 'url(mydroid2.obj)', mtl: 'url(mydroid2.mtl)'});
    // entity.setAttribute('material', {shader: 'standard', color: '#ff9', transparent: 'true', opacity: 0.5, flatshading: true});
    entity.setAttribute('material', {shader: 'standard', color: '#ff9', transparent: 'true', opacity: 1.0, flatshading: true});

    // console.log(document.getElementById('droid').object3D.children[0]);
    // entity.el.object3D = document.getElementById('droid').getObject3D('mesh');
  }
});

AFRAME.registerComponent('enemy', {
  schema: {
    timer: { default: 0 },
    size: { default: 1 },
    endPosition: {},
    startPosition: {},
    lifespan: { default: 5.0 },
    skipCache: { default: false }
  },

  init: function () {
    this.system.enemies.push(this);
    this.life = this.data.lifespan;
    this.alive = true;
    this.el.addEventListener('hit', this.collided.bind(this));
    // @todo Maybe we could send the time in init?
    this.time = this.el.sceneEl.time;
  },
  collided: function () {
    if (this.exploding) {
      return;
    }

    this.shootBack();
    // var mesh = this.el.getObject3D('mesh');
    // mesh.material.color.setHex(0xff0000);
    this.exploding = true;
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

    entity.setAttribute('enemybullet', {direction: direction});
    entity.setAttribute('position', this.el.object3D.position);
    // entity.setAttribute('geometry', {primitive: 'sphere', radius: 0.08});
    entity.setAttribute('geometry', {primitive: 'icosahedron', radius: 0.08, detail: 0});

    entity.setAttribute('material', {shader: 'standard', flatShading: true, color: '#f00'});
    entity.id = 'bullet';
    this.el.sceneEl.appendChild(entity);
  },
  removeAll: function () {
    var index = this.system.enemies.indexOf(this);
    this.system.enemies.splice(index, 1);
    this.el.parentElement.removeChild(this.el);
  },

  tick: function (time, delta) {
    if (!this.alive) {
      return;
    }

    if (this.exploding) {
      if (!this.explodingTime) {
        this.explodingTime = time;
      }
      var duration = 2000;
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
