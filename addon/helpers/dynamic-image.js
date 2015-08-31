import Ember from 'ember';
export default function dynamicImage([imageSrc, width, height]) {
  if (typeof Image === 'undefined') {
    return Ember.String.htmlSafe(`<img src='${imageSrc}' width=${width} height=${height}>`);
  } else {
    var img = new Image();
    img.width = width;
    img.height = height;
    img.src = imageSrc;
    return img;
  }
}
