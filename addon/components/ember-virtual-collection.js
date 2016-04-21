import EmberCollection from 'ember-collection/components/ember-collection';
import layout from './ember-virtual-collection/template';
import Ember from 'ember';

const { set } = Ember;

export default EmberCollection.extend({
  layout: layout,
  classNames: ['ember-virtual-collection'],
  isTouching: false,
  didInitAttrs(){
    this._super(...arguments);
    this._clientSizeChange = this.getAttr('client-size-change');
  },
  actions: {
    touchingChange(val){
      this.set('isTouching', val);
    },
    scrollingComplete() {
      this.sendAction('scrolling-complete');
    },
    scrollChange(scrollLeft, scrollTop, params) {
      if (this._scrollChange) {
        this.sendAction('scroll-change', scrollLeft, scrollTop, params);
      } else {
        if (scrollLeft !== this._scrollLeft ||
            scrollTop !== this._scrollTop) {
          set(this, '_scrollLeft', scrollLeft);
          set(this, '_scrollTop', scrollTop);
          this._needsRevalidate();
        }
      }
    },
    clientSizeChange(clientWidth, clientHeight) {
      if (this._clientSizeChange) {
        this.sendAction('client-size-change', clientWidth, clientHeight);
      }
      if (this._clientWidth !== clientWidth ||
          this._clientHeight !== clientHeight) {
        set(this, '_clientWidth', clientWidth);
        set(this, '_clientHeight', clientHeight);
        this._needsRevalidate();
      }
    }
  }
});
