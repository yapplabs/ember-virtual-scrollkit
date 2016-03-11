/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-virtual-scrollkit',
  included: function(app) {
    this._super.included.apply(this, arguments);

    // see: https://github.com/ember-cli/ember-cli/issues/3718
    if (typeof app.import !== 'function' && app.app) {
      app = app.app;
    }
    
    app.import('vendor/zynga-scroller/Animate.js');
    app.import('vendor/zynga-scroller/Scroller.js');
  }
};
