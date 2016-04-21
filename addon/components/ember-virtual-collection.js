import EmberCollection from 'ember-collection/components/ember-collection';
import layout from './ember-virtual-collection/template';

export default EmberCollection.extend({
  layout: layout,
  classNames: ['ember-virtual-collection'],
  isTouching: false,
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
    }
  }
});
