/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-virtual-scrollkit',
  included: function(app) {
    app.import('vendor/zynga-scroller/Animate.js');
    app.import('vendor/zynga-scroller/Scroller.js');
  }
};
