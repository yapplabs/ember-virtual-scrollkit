import Controller from '@ember/controller';
import makeModel from '../utils/make-model';

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

export default Controller.extend({
  itemWidth: 100,
  itemHeight: 100,
  containerWidth: 300,
  containerHeight: 600,

  actions: {
    updateContainerWidth: function(value) {
      this.set('containerWidth', parseInt(value, 10));
    },

    updateContainerHeight: function(value) {
      this.set('containerHeight', parseInt(value, 10));
    },

    shuffle: function() {
        this.set('model', shuffle(this.model.slice(0)));
    },

    makeSquare: function() {
      this.setProperties({
        itemWidth: 100,
        itemHeight: 100,
      });
    },

    makeRow: function() {
      this.setProperties({
        itemWidth: 300,
        itemHeight: 100
      });
    },

    makeLongRect: function() {
      this.setProperties({
        itemWidth: 100,
        itemHeight: 50
      });
    },

    makeTallRect: function() {
      this.setProperties({
        itemWidth: 50,
        itemHeight: 100
      });
    },
    _isFullLengthCollection: true,
    swapCollection: function() {
      this.toggleProperty('_isFullLengthCollection');
      const numItems = this._isFullLengthCollection ? 1000 : 500;
      this.set('model', makeModel(numItems)());
    }
  }
});
