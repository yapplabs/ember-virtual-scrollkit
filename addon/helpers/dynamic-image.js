import Ember from 'ember';
export default function dynamicImage([imageSrc, width, height]) {
  if (typeof Image === 'undefined') {
    let html = `<img src='${imageSrc}'`;
    if (width) {
      html += ` width=${width}`;
    }
    if (height) {
      html += ` height=${height}`;
    }
    html += '>';
    return Ember.String.htmlSafe(html);
  } else {
    var img = new Image();
    if (width) {
      img.width = width;
    }
    if (height) {
      img.height = height;
    }
    img.src = imageSrc;
    return img;
  }
}
