import Ember from 'ember';
import layout from './ember-scrollbar/template';
import { translate } from 'ember-collection/utils/translate';
const { min, max, round } = Math;
const MIN_SCROLLBAR_LENGTH = 15;

export default Ember.Component.extend({
  layout: layout,
  classNames: ['ember-scrollbar'],
  classNameBindings: ['direction'],
  direction: 'vertical',
  width: 5,
  sideInset: 2,
  endInset: 2,
  _appliedScrollOffset: undefined,
  _appliedViewportLength: undefined,
  _appliedContentLength: undefined,
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
    this._isScrolling = this.getAttr('is-scrolling');
  },
  didInsertElement(){
    this._super(...arguments);
    this.applyTrackStyles();
  },
  applyTrackStyles(){
    const track = this.$('.track')[0];
    track.style.position = 'absolute';
    if (this.direction === 'vertical') {
      track.style.width = `${this.get('width')}px`;
      track.style.top = `${this.get('endInset')}px`;
      track.style.bottom = `${this.get('endInset')}px`;
      track.style.right = `${this.get('sideInset')}px`;
    } else {
      track.style.height = `${this.get('width')}px`;
      track.style.left = `${this.get('endInset')}px`;
      track.style.right = `${this.get('endInset')}px`;
      track.style.bottom = `${this.get('sideInset')}px`;
    }
  },
  applyStyles(thumbElement, scrollbarPosition, scrollbarLength) {
    if (this.direction === 'vertical') {
      thumbElement.style.height = `${scrollbarLength}px`;
      translate(thumbElement, 0, scrollbarPosition);
    } else {
      thumbElement.style.width = `${scrollbarLength}px`;
      translate(thumbElement, scrollbarPosition, 0);
    }
    thumbElement.style.opacity = this._isScrolling ? 1.0 : 0;
  },
  didRender: function(){
    this.updateScrollbar();
  },
  updateScrollbar: function() {
    if (this._appliedScrollOffset === this._scrollOffset
        && this._appliedViewportLength === this._viewportLength
        && this._appliedContentLength === this._contentLength) {
      return;
    }
    this._appliedScrollOffset = this._scrollOffset;
    this._appliedViewportLength = this._viewportLength;
    this._appliedContentLength = this._contentLength;
    const track = this.$('.track')[0];
    const thumb = this.$('.thumb')[0];
    if (!track || !thumb) {
      return;
    }
    const viewportLength = this._viewportLength;
    const contentLength = this._contentLength;
    const trackLength = viewportLength - (this.get('endInset') * 2);
    const contentRatio = min(1, viewportLength / contentLength);
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
