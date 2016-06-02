/* global AFRAME */

AFRAME.registerComponent('colorwheel', {
  schema: {
    on: { default: 'click' }
  },

  init: function () {
  }
});

AFRAME.registerComponent('marker', {
  schema: {
  },

  init: function () {
    this.el.parentNode.parentNode.addEventListener('color-changed', function (evt) {
      this.el.setAttribute('position', {x: evt.detail.x * 0.05, y: -evt.detail.y * 0.05, z: 0});
      this.el.setAttribute('material', 'color', '#' + evt.detail.color.getHexString());
    }.bind(this));
  }
});

AFRAME.registerComponent('strokeselector', {
  schema: {
    on: { default: 'click' }
  },

  init: function () {
    var strokePreview = document.createElement('a-entity');
    strokePreview.setAttribute('geometry', {primitive: 'plane', width: 0.08, height: 0.08});
    strokePreview.setAttribute('position', {x: 0, y: 0, z: 0.002});
    strokePreview.setAttribute('material', {shader: 'flat', transparent: 'true', color: '#fff', src: '#stroke1', side: 'double'});
    this.el.appendChild(strokePreview);

    this.el.parentNode.addEventListener('button-event', function (evt) {
      if (evt.detail.id === 0) {
        if (evt.detail.touched) {
          var previews = ['stroke1', 'stroke3', 'stroke4', 'stroke6', 'stroke7'];
          var x = (evt.detail.axes[0] + 1) / 2;
          var strokeId = parseInt(x * previews.length, 10);
          var stroke = previews[strokeId];
          strokePreview.setAttribute('material', 'src', '#' + stroke);
          var scale = (evt.detail.axes[1] + 1) / 2 + 0.1;
          strokePreview.setAttribute('scale', {x: scale, y: scale, z: 1});

          this.el.emit('stroke-changed', {strokeName: stroke, strokeId: strokeId, lineWidth: scale});
        }
      }
    }.bind(this));
  }
});
