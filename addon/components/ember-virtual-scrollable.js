/* global Scroller */
import { join } from '@ember/runloop';

import Component from '@ember/component';
import { translate } from 'ember-collection/utils/translate';
import normalizeWheel from 'ember-virtual-scrollkit/utils/normalize-wheel';

let fieldRegex = /input|textarea|select/i;
let handleTouchStart = function (e) {
  var touch = e.touches[0],
    target = touch && touch.target;
  // avoid e.preventDefault() on fields
  if (target && fieldRegex.test(target.tagName)) {
    return;
  }
  bindDocumentTouchEvents(this.scrollerEventHandlers);
  this.doTouchStart(e.touches, e.timeStamp);
};
let handleTouchMove = function (e) {
  e.preventDefault();
  this.doTouchMove(e.touches, e.timeStamp);
};
let handleTouchEnd = function (e) {
  unbindDocumentTouchEvents(this.scrollerEventHandlers);
  this.doTouchEnd(e.timeStamp);
};
let handleTouchCancel = function (e) {
  unbindDocumentTouchEvents(this.scrollerEventHandlers);
  this.doTouchEnd(e.timeStamp);
};

let handleMouseDown = function (e) {
  if (e.which !== 1) {
    return;
  }
  var target = e.target;
  // avoid e.preventDefault() on fields
  if (target && fieldRegex.test(target.tagName)) {
    return;
  }
  bindDocumentMouseEvents(this.scrollerEventHandlers);
  this.doTouchStart([e], e.timeStamp);
  e.preventDefault();
  };

let handleMouseMove = function (e) {
  this.doTouchMove([e], e.timeStamp);
};

let handleMouseUp = function (e) {
  unbindDocumentMouseEvents(this.scrollerEventHandlers);
  this.doTouchEnd(e.timeStamp);
};

let handleMouseOut = function (e) {
  if (e.relatedTarget) {
    return;
  }
  unbindDocumentMouseEvents(this.scrollerEventHandlers);
  this.doTouchEnd(e.timeStamp);
};

function handleWheel(e) {
  this.mouseWheel(e);
  e.preventDefault();
}

function bindElement(el, handlers) {
  el.addEventListener('touchstart', handlers.touchstart, false);
  el.addEventListener('mousedown', handlers.mousedown, false);
  el.addEventListener(normalizeWheel.getEventType(), handlers.wheel, false);
}

function unbindElement(el, handlers) {
  el.removeEventListener('touchstart', handlers.touchstart, false);
  el.removeEventListener('mousedown', handlers.mousedown, false);
  el.removeEventListener(normalizeWheel.getEventType(), handlers.wheel, false);
}

function bindDocumentTouchEvents(handlers) {
  document.addEventListener('touchmove', handlers.touchmove, { capture: true, passive: false });
  document.addEventListener('touchend', handlers.touchend, { capture: true, passive: false });
  document.addEventListener('cancelEvent', handlers.touchcancel, { capture: true, passive: false });
}

function bindDocumentMouseEvents(handlers) {
  document.addEventListener('mousemove', handlers.mousemove, { capture: true, passive: false });
  document.addEventListener('mouseup', handlers.mouseup, { capture: true, passive: false });
  document.addEventListener('mouseout', handlers.mouseout, { capture: true, passive: false });
}

function unbindDocumentTouchEvents(handlers) {
  document.removeEventListener('touchmove', handlers.touchmove, { capture: true, passive: false });
  document.removeEventListener('touchend', handlers.touchend, { capture: true, passive: false });
  document.removeEventListener('touchcancel', handlers.touchcancel, { capture: true, passive: false });
}

function unbindDocumentMouseEvents(handlers) {
  document.removeEventListener('mousemove', handlers.mousemove, { capture: true, passive: false });
  document.removeEventListener('mouseup', handlers.mouseup, { capture: true, passive: false });
  document.removeEventListener('mouseout', handlers.mouseout, { capture: true, passive: false });
}

export default Component.extend({
  classNames: ['ember-virtual-scrollable'],
  init() {
    this._clientWidth = undefined;
    this._clientHeight = undefined;
    this._contentSize = undefined;
    this._appliedContentSize = {};
    this._needsContentSizeUpdate = false;
    this._scrollLeft = 0;
    this._scrollTop = 0;
    this._initialScrollTop = this['initial-scroll-top'] || 0;
    this._appliedScrollLeft = undefined;
    this._appliedScrollTop = undefined;
    this._animationFrame = undefined;
    this._isTouching = false;
    this.scroller = undefined;
    this.scrollerEventHandlers = {
      touchstart: handleTouchStart.bind(this),
      touchmove: handleTouchMove.bind(this),
      touchend: handleTouchEnd.bind(this),
      touchcancel: handleTouchCancel.bind(this),
      mousedown: handleMouseDown.bind(this),
      mousemove: handleMouseMove.bind(this),
      mouseup: handleMouseUp.bind(this),
      mouseout: handleMouseOut.bind(this),
      wheel: handleWheel.bind(this)
    };
    this._super();
    this.scrollControlApiRegistrar = this['scroll-control-api-registrar'];
  },
  didReceiveAttrs() {
    this._contentSize = this.getAttr('content-size');
    this._scrollLeft = this.getAttr('scroll-left');
    this._scrollTop = this.getAttr('scroll-top');
  },
  didInsertElement() {
    this._super(...arguments);
    this.contentElement = this.element.firstElementChild;
    this.setupScroller();
    this.applyStyle();
    this.applyContentSize();
    this.syncScrollFromAttr();
    this.startSizeCheck();
    this.bindScrollerEvents();
  },
  willRender() {
    this.willRenderContentSize();
  },
  didUpdate() {
    this.applyContentSize();
  },
  setupScroller: function(){
    this.scroller = new Scroller((left, top/*, zoom*/) => {
      let scroller = this.scroller;
      join(this, this.onScrollChange, left|0, top|0, {
        decelerationVelocityX: scroller.__decelerationVelocityX,
        decelerationVelocityY: scroller.__decelerationVelocityY
      });
    }, {
      scrollingX: false,
      scrollingComplete: () => {
        this.sendAction('scrollingComplete');
      }
    });
  },
  onScrollChange(scrollLeft, scrollTop, params) {
    if (this._appliedScrollTop !== scrollTop || this._appliedScrollLeft !== scrollLeft) {
      this._appliedScrollLeft = scrollLeft;
      this._appliedScrollTop = scrollTop;
      if (this.contentElement) {
        translate(this.contentElement, scrollLeft, -1 * scrollTop);
      }
      if (this._initialSizeCheckCompleted && (this._scrollLeft !== scrollLeft || this._scrollTop !== scrollTop)) {
        this.sendAction('scrollChange', scrollLeft, scrollTop, params);
      }
    }
  },
  syncScrollFromAttr() {
    if (!this._initialSizeCheckCompleted) {
      return; // no sense in trying scroll until we are sized properly
    }
    if (this._appliedScrollLeft !== this._scrollLeft || this._appliedScrollTop !== this._scrollTop) {
      this.scroller.scrollTo(this._scrollLeft, this._scrollTop);
    }
  },
  updateScrollerDimensions() {
    if (this._clientWidth && this._clientHeight) {
      this.scroller.setDimensions(this._clientWidth, this._clientHeight, this._contentSize.width, this._contentSize.height);
    }
  },
  didRender(){
    this.syncScrollFromAttr();
  },
  willDestroyElement() {
    this._super(...arguments);
    this.contentElement = undefined;
    this.unbindScrollerEvents();
    this.cancelSizeCheck();
  },
  scrollTo(yPos, animated=false) {
    if (this.element) {
      return this.scroller.scrollTo(0, yPos, animated);
    }
  },

  scrollToTop() {
    return this.scrollTo(0, true);
  },

  resetScrollPosition() {
    return this.scrollTo(this._initialScrollTop, false);
  },

  applyStyle() {
    // hack to force render buffer so outside doesn't repaint on scroll
    let element = this.element;
    if (!element) {
      return;
    }
    translate(element, 0, 0);

    element.style.overflow = 'hidden';
    element.style.position = 'absolute';
    element.style.left = 0;
    element.style.top = 0;
    element.style.bottom = 0;
    element.style.right = 0;
    element.style.boxSizing = 'border-box';

    this.contentElement.style.position = 'relative';
  },
  willRenderContentSize(){
    if (this._appliedContentSize &&
        (this._appliedContentSize.width !== this._contentSize.width ||
        this._appliedContentSize.height !== this._contentSize.height)
      ) {
      this._appliedContentSize = this._contentSize;
      this._needsContentSizeUpdate = true;
      this.updateScrollerDimensions();
    }
  },
  applyContentSize() {
    if (this._needsContentSizeUpdate) {
      this.contentElement.style.width = this._contentSize.width + 'px';
      this.contentElement.style.height = this._contentSize.height + 'px';
      this._needsContentSizeUpdate = false;
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

    // Before we check the size for the first time, we capture the intended scroll position
    // and apply it after we determine and apply the size. The reason we need to do this
    // is that attempting to apply the scroll position before the scroller has size results
    // in a scroll position of [0,0].
    let initialScrollLeft = this._scrollLeft;
    let initialScrollTop = this._initialScrollTop;
    component.sizeCheck();
    this._initialSizeCheckCompleted = true;
    if (initialScrollLeft || initialScrollTop) {
      this.scroller.scrollTo(initialScrollLeft, initialScrollTop);
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
    if (clientWidth !== this._clientWidth || clientHeight !== this._clientHeight) {
      this._clientWidth = clientWidth;
      this._clientHeight = clientHeight;
      join(() => {
        this.updateScrollerDimensions();
        this.sendClientSizeChange(clientWidth, clientHeight);
      });
    }
  },
  sendClientSizeChange(width, height) {
    this.sendAction('clientSizeChange', width, height);
  },
  bindScrollerEvents: function() {
    bindElement(this.element, this.scrollerEventHandlers);
  },
  unbindScrollerEvents: function() {
    unbindElement(this.element, this.scrollerEventHandlers);
    unbindDocumentTouchEvents(this.scrollerEventHandlers);
    unbindDocumentMouseEvents(this.scrollerEventHandlers);
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
    let eventInfo = normalizeWheel(e);
    let delta = eventInfo.pixelY;
    let scroller = this.scroller;
    let scrollTop = scroller.__scrollTop;
    let maxScrollTop = scroller.__maxScrollTop;
    let candidatePosition = scrollTop + delta;

    if ( (scrollTop === 0 && candidatePosition < 0) ||
         (scrollTop === maxScrollTop && candidatePosition > maxScrollTop)) {
      return false;
    }

    scroller.scrollBy(0, delta, true);
    e.stopPropagation();
    return false;
  }
});
