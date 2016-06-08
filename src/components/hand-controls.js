var registerComponent = require('../core/component').registerComponent;
var THREE = require('../lib/three');

module.exports.Component = registerComponent('hand-controls', {
  schema: {
    hand: { default: 'right' }
  },

  init: function () {
    this.previousControllerPosition = new THREE.Vector3();

    this.animationActive = 'pointing';
    var self = this;
    this.listener = window.addEventListener('keydown', function (event) {
      if (event.keyCode === 80) {  // p.
        self.playAnimation('pointing', true);
        self.el.emit('button-event', {
          id: 1,
          pressed: true,
          value: true
        });
      }
    }, false);
    this.listener = window.addEventListener('keyup', function (event) {
      if (event.keyCode === 80) {  // p.
        self.playAnimation('pointing', false);
      }
    }, false);
  },

  update: function () {
    var controllers = this.system.controllers;
    // handId: 0 - right, 1 - left
    this.controller = this.data.hand === 'right' ? controllers[0] : controllers[1];
  },

  tick: function (time, delta) {
    var mesh = this.el.getObject3D('mesh');
    if (mesh && mesh.update) {
      mesh.update(delta / 1000);
    }
    this.updatePose();
    this.updateButtons();
  },

  updatePose: (function () {
    var controllerEuler = new THREE.Euler();
    var controllerPosition = new THREE.Vector3();
    var controllerQuaternion = new THREE.Quaternion();
    var dolly = new THREE.Object3D();
    var standingMatrix = new THREE.Matrix4();
    controllerEuler.order = 'YXZ';
    var deltaControllerPosition = new THREE.Vector3();
    return function () {
      var controller;
      var pose;
      var orientation;
      var position;
      var el = this.el;
      var vrDisplay = this.system.vrDisplay;
      this.update();
      controller = this.controller;
      if (!controller) { return; }
      pose = controller.pose;
      orientation = pose.orientation || [0, 0, 0, 1];
      position = pose.position || [0, 0, 0];
      controllerQuaternion.fromArray(orientation);
      dolly.quaternion.fromArray(orientation);
      dolly.position.fromArray(position);
      dolly.updateMatrix();
      if (vrDisplay && vrDisplay.stageParameters) {
        standingMatrix.fromArray(vrDisplay.stageParameters.sittingToStandingTransform);
        dolly.applyMatrix(standingMatrix);
      }
      controllerEuler.setFromRotationMatrix(dolly.matrix);
      controllerPosition.setFromMatrixPosition(dolly.matrix);
      el.setAttribute('rotation', {
        x: THREE.Math.radToDeg(controllerEuler.x),
        y: THREE.Math.radToDeg(controllerEuler.y),
        z: THREE.Math.radToDeg(controllerEuler.z)
      });

      deltaControllerPosition.copy(controllerPosition).sub(this.previousControllerPosition);
      this.previousControllerPosition.copy(controllerPosition);
      var currentPosition = el.getComputedAttribute('position');

      el.setAttribute('position', {
        x: currentPosition.x + deltaControllerPosition.x,
        y: currentPosition.y + deltaControllerPosition.y,
        z: currentPosition.z + deltaControllerPosition.z
      });
    };
  })(),

  updateButtons: function () {
    var i;
    var buttonState;
    var controller = this.controller;
    if (!this.controller) { return; }
    for (i = 0; i < controller.buttons.length; ++i) {
      buttonState = controller.buttons[i];
      var state = {
        id: i,
        pressed: buttonState.pressed,
        value: buttonState.value
      };

      // touchpad for vive
      if (i === 0) {
        state.touched = buttonState.touched;
        state.axes = controller.axes;
      }
      this.el.emit('button-event', state);
      this.handleButton(i, buttonState);
    }
  },

  handleButton: function (id, buttonState) {
    // buttonId
    // 0 - trackpad
    // 1 - trigger ( intensity value from 0.5 to 1 )
    // 2 - grip
    // 3 - menu ( dispatch but better for menu options )
    // 4 - system ( never dispatched on this layer )
    // Only control trigger button
    switch (id) {
      case 1:
        if (buttonState.pressed !== this.triggerPressed) {
          this.triggerPressed = buttonState.pressed;
          this.playAnimation('pointing', buttonState.pressed);
        }
        break;
      case 2:
        this.playAnimation('close', buttonState.pressed);
        break;
    }
  },

  playAnimation: function (animation, isPressed) {
/*
    var timeScale = -1;
    var mesh = this.el.getObject3D('mesh');
    if (isPressed) { timeScale = 1; }
/*
    return;
    mesh.mixer.clipAction(animation).loop = 2200;
    mesh.mixer.clipAction(animation).clampWhenFinished = true;
    mesh.mixer.clipAction(animation).timeScale = timeScale;
    mesh.play(this.animationActive, 0);
    mesh.play(animation, 1);
    this.animationActive = animation;
*/
  }
});
