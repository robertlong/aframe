/* global AFRAME THREE */

AFRAME.registerComponent('brush', {
  schema: {
  },

  init: function () {
    this.meshesArr = [];
    this.vertexCounter = 0;
    this.active = false;
    this.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this.obj = this.el.object3D;
    this.mesh = null;
    this.color = new THREE.Color(0xd03760);
    this.lineWidth = 0.1;
    this.gripPressed = false;
    this.textures = {};
    this.currentMap = 0;
    var self = this;
    // Line
    function loadTextures (textureArray) {
      var textureLoader = new THREE.TextureLoader();
      for (var i in textureArray) {
        var name = textureArray[i];
        console.info(name);
        self.textures[i] = textureLoader.load(textureArray[i], function (texture) {
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
        });
      }
    }

    loadTextures(['stroke1.png', 'stroke3.png', 'stroke4.png', 'stroke5.png', 'stroke6.png', 'stroke7.png']);

    this.model = this.el.getObject3D('mesh');
    this.drawing = false;

    function updateColor (color, x, y) {
      function HSVtoRGB (h, s, v) {
        var r, g, b, i, f, p, q, t;
        if (arguments.length === 1) {
          s = h.s; v = h.v; h = h.h;
        }
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
          case 0: r = v; g = t; b = p; break;
          case 1: r = q; g = v; b = p; break;
          case 2: r = p; g = v; b = t; break;
          case 3: r = p; g = q; b = v; break;
          case 4: r = t; g = p; b = v; break;
          case 5: r = v; g = p; b = q; break;
        }
        return {r: r, g: g, b: b};
      }

      // Use polar coordinates instead of cartesian
      var angle = Math.atan2(x, y);
      var radius = Math.sqrt(x * x + y * y);

      // Map the angle (-PI to PI) to the Hue (from 0 to 1)
      // and the Saturation to the radius
      angle = angle / (Math.PI * 2) + 0.5;
      var color2 = HSVtoRGB(angle, radius, 1.0);
      color.setRGB(color2.r, color2.g, color2.b);
    }

    this.el.addEventListener('stroke-changed', function (evt) {
      this.currentMap = evt.detail.strokeId;
      this.lineWidth = evt.detail.lineWidth * 0.1;
    }.bind(this));

    this.el.addEventListener('button-event', function (evt) {
      if (evt.detail.id === 0) {
        if (evt.detail.touched) {
          updateColor(this.color, evt.detail.axes[0], evt.detail.axes[1]);
          this.el.emit('color-changed', {color: this.color, x: evt.detail.axes[0], y: evt.detail.axes[1]});
        }
      }
      if (evt.detail.id === 2) {
        if (evt.detail.pressed && !this.gripPressed) {
          this.gripPressed = evt.detail.pressed;
          this.currentMap = (this.currentMap + 1) % Object.keys(this.textures).length;
          // this.playAnimation('pointing', buttonState.pressed);
        }
        if (!evt.detail.pressed && this.gripPressed) {
          this.gripPressed = false;
        }
      }
      if (evt.detail.id === 1 && evt.detail.pressed) {
        if (!this.active) {
          this.drawLine();
          this.active = true;
        }
      }
      if (evt.detail.id === 1 && !evt.detail.pressed) {
        this.active = false;
        this.mesh = null;
      }
    }.bind(this));
  },

  tick: function (time, delta) {
    if (this.mesh) {
      var geo = this.mesh.geo;
      var g = this.mesh.g;

      for (var j = 0; j < geo.length; j += 3) {
        geo[ j ] = geo[ j + 3 ];
        geo[ j + 1 ] = geo[ j + 4 ];
        geo[ j + 2 ] = geo[ j + 5 ];
      }

      if (this.active) {
        geo[ geo.length - 3 ] = this.obj.position.x;
        geo[ geo.length - 2 ] = this.obj.position.y;
        geo[ geo.length - 1 ] = this.obj.position.z;
      }
      g.setGeometry(geo);
    }
  },

  remove: function () {
  },

  removeLastLine: function () {
    this.remove(this.meshesArr[this.meshesArr.length - 2]);
    this.meshesArr.splice(this.meshesArr.length - 2, 1);
  },

  drawLine: function () {
    this.vertexCounter = 0;
    var geo = new Float32Array(1000 * 3);
    for (var j = 0; j < geo.length; j += 3) {
      geo[ j ] = this.obj.position.x;
      geo[ j + 1 ] = this.obj.position.y;
      geo[ j + 2 ] = this.obj.position.z;
    }

    var g = new THREE.MeshLine();
    g.setGeometry(geo, function (p) {
      return p;
    });

    var material = new THREE.MeshLineMaterial({
      useMap: true,
      map: this.textures[this.currentMap],
      color: this.color.clone(),
      opacity: 1.0,
      resolution: this.resolution,
      sizeAttenuation: true,
      lineWidth: this.lineWidth,
      near: 0.001,
      far: 10000,
      depthTest: false,
      depthWrite: true,
      transparent: true
    });

    var mesh = new THREE.Mesh(g.geometry, material);
    mesh.frustumCulled = false;
    mesh.geo = geo;
    mesh.g = g;

    var entity = document.createElement('a-entity');
    this.el.sceneEl.appendChild(entity);
    entity.object3D.add(mesh);

/*
    var geometry = new THREE.SphereGeometry( 5, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    var sphere = new THREE.Mesh( geometry, material );
*/

    this.mesh = mesh;
    this.meshesArr.push(mesh);
  }

});
