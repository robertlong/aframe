/* global AFRAME */
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
    entity.setAttribute('enemy', {lifespan: 4 * ((Math.random() + 1))});

    var radius = 13;
    var angle = Math.random() * Math.PI * 2;
    var dist = radius * Math.sqrt(Math.random());
    var point = [ dist * Math.cos(angle),
                  dist * Math.sin(angle),
                  Math.sqrt(radius * radius - dist * dist)];
    if (point[1] < 0) {
      point[1] = -point[1];
    }

    entity.setAttribute('position', {x: point[0], y: point[1], z: point[2]});
    entity.setAttribute('geometry', {primitive: 'icosahedron', radius: 1, detail: 1});
    entity.setAttribute('material', {shader: 'standard', color: '#ff9', transparent: 'true', opacity: 0.5, flatshading: true});
    this.sceneEl.appendChild(entity);
  }
});

AFRAME.registerComponent('enemy', {
  schema: {
    timer: { default: 0 },
    size: { default: 1 },
    lifespan: { default: 5.0 },
    skipCache: { default: false }
  },

  init: function () {
    this.system.enemies.push(this);
    this.life = this.data.lifespan;
    this.alive = true;
    this.el.addEventListener('hit', this.collided.bind(this));
  },
  collided: function () {
    this.shootBack();
    this.alive = false;
    var mesh = this.el.getObject3D('mesh');
    mesh.material.color.setHex(0xff0000);
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
    entity.setAttribute('geometry', {primitive: 'sphere', radius: 0.08});
    entity.setAttribute('material', {shader: 'standard', color: '#00f'});
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

    if (this.life > 0) {
      this.life -= delta / 1000;
      if (this.life < 0) {
        this.life = 0;
        this.collided();
      }

      var model = this.el.getObject3D('mesh');
      model.material.transparent = true;
      var lifePerc = 1 - this.life / this.data.lifespan;
      model.material.opacity = lifePerc;
    } else {
//      console.log("Dead!");
    }
  },

  update: function () {

/*
    var self = this;
    var el = this.el;
    var src = this.data;

    if (!src) { return; }

    this.remove();
    this.model = new THREE.BlendCharacter();

    this.model.load(src, function () {
      el.setObject3D('mesh', self.model);
      el.emit('model-loaded', {format: 'blend', model: self.model});
      self.model.castShadow = true;
      self.model.receiveShadow = true;
      self.model.material.shading = THREE.FlatShading;
      self.model.geometry.computeBoundingBox();
    });
    */
  },

  remove: function () {
/*    if (!this.model) { return; }
    this.el.removeObject3D('mesh');*/
  }
});
