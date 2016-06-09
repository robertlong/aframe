var debug = require('../utils/debug');
var registerComponent = require('../core/component').registerComponent;
var THREE = require('../lib/three');

var warn = debug('components:sound:warn');

/**
 * Sound component.
 */
module.exports.Component = registerComponent('sound', {
  schema: {
    src: { default: '' },
    on: { default: 'click' },
    autoplay: { default: false },
    loop: { default: false },
    volume: { default: 1 },
    pool: { default: 10 }
  },

  init: function () {
    this.listener = null;
    this.soundsPool = [];
  },

  update: function (oldData) {
    var data = this.data;
    var el = this.el;
    var srcChanged = data.src !== oldData.src;
    // var poolChanged = data.pool !== oldData.pool;

    // Create new sound if not yet created or changing `src`.
    if (srcChanged) {
      if (!data.src) {
        warn('Audio source was not specified with `src`');
        return;
      }
      this.setupSound();
    }

    this.soundsPool.forEach(function (sound) {
      sound.autoplay = data.autoplay;
      sound.setLoop(data.loop);
      sound.setVolume(data.volume);
    });

    if (data.on !== oldData.on) {
      if (oldData.on) { el.removeEventListener(oldData.on); }
      el.addEventListener(data.on, this.play.bind(this));
    }

    // All sound values set. Load in `src`.
    if (srcChanged) {
      this.soundsPool.forEach(function (sound) {
        sound.load(data.src);
      });
    }
  },

  remove: function () {
    this.el.removeObject3D('sound');
    try {
      this.soundsPool.forEach(function (sound) {
        sound.disconnect();
      });
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

    if (this.soundsPool.length > 0) {
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

    this.soundsPool = [];
    // var soundGroup = new THREE.Group();
    for (var i = 0; i < this.data.pool; i++) {
      this.soundsPool[i] = new THREE.PositionalAudio(listener);
      // soundGroup.add(this.soundsPool);
    }
    el.setObject3D('sound', this.soundsPool[0]);

    this.soundsPool.forEach(function (sound) {
      sound.source.onended = function () {
        sound.onEnded();
        el.emit('sound-ended', {index: i});
      };
    });
  },

  playByPos: function (i) {
    var sound = this.soundsPool[i];
    if (!sound.source.buffer) { return; }
    sound.play();
  },

  play: function () {
    for (var i = 0; i < this.soundsPool.length; i++) {
      var sound = this.soundsPool[i];
      if (!sound.isPlaying && sound.source.buffer) {
        this.soundsPool[i].play();
        return;
      }
    }
  },

  stop: function () {
    this.soundsPool.forEach(function (sound) {
      if (!sound.source.buffer) { return; }
      sound.stop();
    });
  },

  pause: function () {
    this.soundsPool.forEach(function (sound) {
      if (!sound.source.buffer || !sound.isPlaying) { return; }
      sound.pause();
    });
  }
});
