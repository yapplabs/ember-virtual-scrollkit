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
    this._isTouching = this.getAttr('is-touching');
  },
  didInsertElement(){
    this._super(...arguments);
    this.applyTrackStyles();
    this.thumbElement = this.$('.thumb')[0];
  },
  didRender: function(){
    this.checkIsMoving();
    this.checkIsTouching();
    this.updateScrollbar();
    this.scheduleCheckIsMoving();
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
  applyStyles(scrollbarPosition, scrollbarLength) {
    if (this.direction === 'vertical') {
      this.thumbElement.style.height = `${scrollbarLength}px`;
      translate(this.thumbElement, 0, scrollbarPosition);
    } else {
      this.thumbElement.style.width = `${scrollbarLength}px`;
      translate(this.thumbElement, scrollbarPosition, 0);
    }
  },
  applyVisibility(){
    this.thumbElement.style.opacity = this._isThumbVisible ? 1.0 : 0;
  },

  checkIsTouching(){
    if (this._appliedIsTouching === this._isTouching) {
      return;
    }
    this._appliedIsTouching = this._isTouching;
    this.computeVisibility();
  },
  checkIsMoving(){
    if (this._checkIsMovingTimer) {
      Ember.run.cancel(this._checkIsMovingTimer);
      this._checkIsMovingTimer = null;
    }
    var timeDelta = new Date() - this._previousScrollOffsetTimestamp;
    if (this._scrollOffset === this._previousScrollOffset) {
      if (timeDelta > 100) { // if timeDelta <= 100ms, don't set isMoving to false. Instead, wait for the timer to call this again.
        this._isMoving = false;
      }
    } else {
      this._isMoving = true;
    }
    this._previousScrollOffsetTimestamp = new Date();
    this._previousScrollOffset = this._scrollOffset;
    if (this._appliedIsMoving !== this._isMoving) {
      this._appliedIsMoving = this._isMoving;
      this.computeVisibility();
    }
  },
  scheduleCheckIsMoving(){
    if (!this._checkIsMovingTimer) {
      this._checkIsMovingTimer = Ember.run.later(this, this.checkIsMoving, 250);
    }
  },
  computeVisibility(){
    if (this._isThumbVisible) {
      // visible, keep showing if user is touching or view is still moving
      this._isThumbVisible = this._isTouching || this._isMoving;
    } else {
      // not yet visible, show it if user is touching and has panned
      this._isThumbVisible = this._isTouching && this._isMoving;
    }
    if (this._appliedIsThumbVisible !== this._isThumbVisible) {
      this._appliedIsThumbVisible = this._isThumbVisible;
      this.applyVisibility();
    }
  },
  updateScrollbar: function() {
    if (this._appliedScrollOffset === this._scrollOffset &&
        this._appliedViewportLength === this._viewportLength &&
        this._appliedContentLength === this._contentLength) {
      return;
    }
    this._scrollDifferential = this._scrollOffset - this._appliedScrollOffset;
    this._appliedScrollOffset = this._scrollOffset;
    this._appliedIsThumbVisible = this._isThumbVisible;
    this._appliedViewportLength = this._viewportLength;
    this._appliedContentLength = this._contentLength;

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
    this.applyStyles(scrollbarPosition, scrollbarLength);
  }
});
