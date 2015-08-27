import EmberCollection from 'ember-collection/components/ember-collection';
import layout from './ember-virtual-collection/template';

export default EmberCollection.extend({
  layout: layout,
  classNames: ['ember-virtual-collection'],
  isScrolling: false,
  actions: {
    scrollingStarted(){
      console.debug('scrollingStarted');
      this.set('isScrolling', true);
    },
    scrollingCompleted(){
      console.debug('scrollingCompleted');
      this.set('isScrolling', false);
    }
  }
});
