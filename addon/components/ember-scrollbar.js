import Ember from 'ember';
import layout from './ember-scrollbar/template';
const { min, max, round } = Math;
const MIN_SCROLLBAR_LENGTH = 15;

const csstransforms3d = true;
const csstransforms = true;
// const csstransforms3d = Modernizr.csstransforms3d;
// const csstransforms = Modernizr.csstransforms;

const transformProperty = 'transform';
// const transformProperty = Modernizr.prefixed("Transform");
let translateY;
let translateX;
let trnOpen;
let trnClose;

if (csstransforms3d) {
  trnOpen = 'translate3d(';
  trnClose = ', 0)';
  translateY = function(element, yPos) {
    if (!element) { return; }
    element.style[transformProperty] = `${trnOpen}0, ${-yPos}px${trnClose}`;
  };
  translateX = function(element, xPos) {
    if (!element) { return; }
    element.style[transformProperty] = `${trnOpen}${xPos}px, 0${trnClose}`;
  };
} else if (csstransforms) {
  trnOpen = 'translate(';
  trnClose = ')';
  translateY = function(element, yPos) {
    if (!element) { return; }
    element.style[transformProperty] = `${trnOpen}0, ${-yPos}px${trnClose}`;
  };
  translateX = function(element, xPos) {
    if (!element) { return; }
    element.style[transformProperty] = `${trnOpen}${xPos}px, 0${trnClose}`;
  };
} else {
  translateY = function(element, yPos) {
    if (!element) { return; }
    element.style.marginTop = `${-yPos}px`;
  };
  translateX = function(element, xPos) {
    if (!element) { return; }
    element.style.marginLeft = `${-xPos}px`;
  };
}

export default Ember.Component.extend({
  layout: layout,
  classNames: ['ember-scrollbar'],
  classNameBindings: ['direction'],
  direction: 'vertical',
  didReceiveAttrs: function(){
    this._super(...arguments);
    this.readAttributes();
  },
  readAttributes(){
    if (this.direction === 'vertical') {
      this._scrollOffset = this.getAttr('scroll-top');
      this._contentLength = this.getAttr('content-height');
      this._viewportLength = this.getAttr('viewport-height');
    } else {
      Ember.assert('direction is either vertical or horizontal', this.direction);
      this._scrollOffset = this.getAttr('scroll-left');
      this._contentLength = this.getAttr('content-width');
      this._viewportLength = this.getAttr('viewport-width');
    }
  },
  getTrackLength(trackElement){
    if (this.direction === 'vertical') {
      return trackElement.offsetHeight;
    } else {
      return trackElement.offsetWidth;
    }
  },
  applyStyles(thumbElement, scrollbarPosition, scrollbarLength) {
    if (this.direction === 'vertical') {
      thumbElement.style.height = `${scrollbarLength}px`;
      translateY(thumbElement, -scrollbarPosition);
    } else {
      thumbElement.style.width = `${scrollbarLength}px`;
      translateX(thumbElement, -scrollbarPosition);
    }
  },
  didRender: function(){
    this.updateScrollbar();
  },
  updateScrollbar: function() {
    const track = this.$('.track')[0];
    const thumb = this.$('.thumb')[0];
    if (!track || !thumb) {
      return;
    }
    const viewportLength = this._viewportLength;
    const contentLength = this._contentLength;
    const trackLength = this.getTrackLength(track);
    const contentRatio = viewportLength / contentLength;
    let scrollbarLength = max(round(contentRatio * trackLength), MIN_SCROLLBAR_LENGTH);
    const uncompressedMaxScrollbarPosition = trackLength - scrollbarLength;
    const compressedMaxScrollbarPosition = trackLength - MIN_SCROLLBAR_LENGTH;
    let scrollbarPosition = round(this._scrollOffset * contentRatio);
    if (scrollbarPosition < 0) {
      scrollbarLength = max(MIN_SCROLLBAR_LENGTH, scrollbarLength + round(this._scrollOffset * 2));
    } else if (scrollbarPosition > uncompressedMaxScrollbarPosition) {
      const compressionAmount = round((scrollbarPosition - uncompressedMaxScrollbarPosition) * 2);
      scrollbarLength = scrollbarLength - compressionAmount;
      scrollbarLength = max(MIN_SCROLLBAR_LENGTH, scrollbarLength);
      scrollbarPosition = min(compressedMaxScrollbarPosition, uncompressedMaxScrollbarPosition + compressionAmount);
    }
    scrollbarPosition = max(scrollbarPosition, 0);
    this.applyStyles(thumb, scrollbarPosition, scrollbarLength);
  }
});
