/* global Scroller */
import Ember from 'ember';
import { translate } from 'ember-collection/utils/translate';

var fieldRegex = /input|textarea|select/i,
  hasTouch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch,
  handleStart, handleMove, handleEnd, handleCancel,
  startEvent, moveEvent, endEvent, cancelEvent;
if (hasTouch) {
  startEvent = 'touchstart';
  handleStart = function (e) {
    var touch = e.touches[0],
      target = touch && touch.target;
    // avoid e.preventDefault() on fields
    if (target && fieldRegex.test(target.tagName)) {
      return;
    }
    bindWindow(this.scrollerEventHandlers);
    this.doTouchStart(e.touches, e.timeStamp);
    e.preventDefault();
  };
  moveEvent = 'touchmove';
  handleMove = function (e) {
    this.doTouchMove(e.touches, e.timeStamp);
  };
  endEvent = 'touchend';
  handleEnd = function (e) {
    unbindWindow(this.scrollerEventHandlers);
    this.doTouchEnd(e.timeStamp);
  };
  cancelEvent = 'touchcancel';
  handleCancel = function (e) {
    unbindWindow(this.scrollerEventHandlers);
    this.doTouchEnd(e.timeStamp);
  };
} else {
  startEvent = 'mousedown';
  handleStart = function (e) {
    if (e.which !== 1) {
      return;
    }
    var target = e.target;
    // avoid e.preventDefault() on fields
    if (target && fieldRegex.test(target.tagName)) {
      return;
    }
    bindWindow(this.scrollerEventHandlers);
    this.doTouchStart([e], e.timeStamp);
    e.preventDefault();
  };
  moveEvent = 'mousemove';
  handleMove = function (e) {
    this.doTouchMove([e], e.timeStamp);
  };
  endEvent = 'mouseup';
  handleEnd = function (e) {
    unbindWindow(this.scrollerEventHandlers);
    this.doTouchEnd(e.timeStamp);
  };
  cancelEvent = 'mouseout';
  handleCancel = function (e) {
    if (e.relatedTarget) {
      return;
    }
    unbindWindow(this.scrollerEventHandlers);
    this.doTouchEnd(e.timeStamp);
  };
}

function handleWheel(e) {
  this.mouseWheel(e);
  e.preventDefault();
}

function bindElement(el, handlers) {
  el.addEventListener(startEvent, handlers.start, false);
  el.addEventListener('mousewheel', handlers.wheel, false);
}

function unbindElement(el, handlers) {
  el.removeEventListener(startEvent, handlers.start, false);
  el.removeEventListener('mousewheel', handlers.wheel, false);
}

function bindWindow(handlers) {
  window.addEventListener(moveEvent, handlers.move, true);
  window.addEventListener(endEvent, handlers.end, true);
  window.addEventListener(cancelEvent, handlers.cancel, true);
}

function unbindWindow(handlers) {
  window.removeEventListener(moveEvent, handlers.move, true);
  window.removeEventListener(endEvent, handlers.end, true);
  window.removeEventListener(cancelEvent, handlers.cancel, true);
}

export default Ember.Component.extend({
  init() {
    this._clientWidth = undefined;
    this._clientHeight = undefined;
    this._contentSize = undefined;
    this._appliedContentSize = undefined;
    this._scrollLeft = 0;
    this._scrollTop = 0;
    this._appliedScrollLeft = undefined;
    this._appliedScrollTop = undefined;
    this._animationFrame = undefined;
    this._isTouching = false;
    this.scroller = undefined;
    this.scrollerEventHandlers = {
      start: handleStart.bind(this),
      move: handleMove.bind(this),
      end: handleEnd.bind(this),
      cancel: handleCancel.bind(this),
      wheel: handleWheel.bind(this)
    };
    this._super();
  },
  didReceiveAttrs() {
    this._contentSize = this.getAttr('content-size');
    this._scrollLeft = this.getAttr('scroll-left');
    this._scrollTop = this.getAttr('scroll-top');
  },
  didInsertElement() {
    this.contentElement = this.element.firstElementChild;
    this.setupScroller();
    this.applyStyle();
    this.applyContentSize();
    this.syncScrollFromAttr();
    this.startSizeCheck();
    this.bindScrollerEvents();
  },
  didUpdate() {
    this.applyContentSize();
  },
  setupScroller: function(){
    this.scroller = new Scroller((left, top/*, zoom*/) => {
      Ember.run.join(this, this.onScrollChange, left|0, top|0);
    }, {
      scrollingX: false
    });
  },
  onScrollChange(scrollLeft, scrollTop) {
    this.sendAction('scrollChange', { scrollLeft, scrollTop });
  },
  updateScrollerDimensions(clientWidth, clientHeight) {
    this.scroller.setDimensions(clientWidth, clientHeight, this._contentSize.width, this._contentSize.height);
  },
  didRender(){
    this.syncScrollFromAttr();
  },
  willDestroyElement() {
    this.contentElement = undefined;
    this.unbindScrollerEvents();
    this.cancelSizeCheck();
  },
  applyStyle() {
    // hack to force render buffer so outside doesn't repaint on scroll
    translate(this.element, 0, 0);

    this.element.style.overflow = 'hidden';
    this.element.style.position = 'absolute';
    this.element.style.left = 0;
    this.element.style.top = 0;
    this.element.style.bottom = 0;
    this.element.style.right = 0;
    this.element.style.boxSizing = 'border-box';

    this.contentElement.style.position = 'relative';
  },
  applyContentSize() {
    if (this._appliedContentSize &&
        this._appliedContentSize.width !== this._contentSize.width &&
        this._appliedContentSize.height !== this._contentSize.height
      ) {
      this.contentElement.style.width = this._contentSize.width + 'px';
      this.contentElement.style.height = this._contentSize.height + 'px';
      this._appliedContentSize = this._contentSize;
    }
  },
  startSizeCheck() {
    const component = this;
    function step() {
      component.sizeCheck();
      nextStep();
    }
    function nextStep() {
      component._animationFrame = requestAnimationFrame(step);
    }
    nextStep();
  },
  cancelSizeCheck() {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = undefined;
    }
  },
  sizeCheck() {
    let element = this.element;
    let clientWidth = element.offsetWidth;
    let clientHeight = element.offsetHeight;
    if (clientWidth !== this._clientwidth || clientHeight !== this._clientHeight) {
      this._clientwidth = clientWidth;
      this._clientHeight = clientHeight;
      Ember.run.join(() => {
        this.updateScrollerDimensions(clientWidth, clientHeight);
        this.sendClientSizeChange(clientWidth, clientHeight);
      });
    }
  },
  syncScrollFromAttr() {
    if (this._appliedScrollLeft !== this._scrollLeft || this._appliedScrollTop !== this._scrollTop) {
      this._appliedScrollLeft = this._scrollLeft;
      this._appliedScrollTop = this._scrollTop;
      translate(this.contentElement, this._scrollLeft, -1 * this._scrollTop);
    }
  },
  sendClientSizeChange(width, height) {
    this.sendAction('clientSizeChange', { width, height });
  },
  bindScrollerEvents: function() {
    bindElement(this.element, this.scrollerEventHandlers);
  },
  unbindScrollerEvents: function() {
    unbindElement(this.element, this.scrollerEventHandlers);
    unbindWindow(this.scrollerEventHandlers);
  },

  doTouchStart: function(touches, timeStamp) {
    this._isTouching = true;
    this.scroller.doTouchStart(touches, timeStamp);
    this.sendAction('touchingChange', this._isTouching);
  },
  doTouchMove: function(touches, timeStamp) {
    this.scroller.doTouchMove(touches, timeStamp);
  },
  doTouchEnd: function(timeStamp) {
    this._isTouching = false;
    this.scroller.doTouchEnd(timeStamp);
    this.sendAction('touchingChange', this._isTouching);
  },

  mouseWheel: function(e){
    var inverted, delta, candidatePosition;

    inverted = e.webkitDirectionInvertedFromDevice;
    delta = e.wheelDeltaY * (inverted ? 0.8 : -0.8);
    candidatePosition = this.scroller.__scrollTop + delta;

    if ((candidatePosition >= 0) && (candidatePosition <= this.scroller.__maxScrollTop)) {
      this.scroller.scrollBy(0, delta, true);
      e.stopPropagation();
    }

    return false;
  }
});
