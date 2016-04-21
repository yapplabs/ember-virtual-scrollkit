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
    }
  }
});
