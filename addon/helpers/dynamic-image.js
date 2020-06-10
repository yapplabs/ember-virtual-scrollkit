import { htmlSafe } from '@ember/template';
export default function dynamicImage([imageSrc], hash) {
  const { width, height } = hash;
  const className = hash.class;
  if (typeof Image === 'undefined') {
    let html = `<img src='${imageSrc}'`;
    if (width) {
      html += ` width=${width}`;
    }
    if (height) {
      html += ` height=${height}`;
    }
    if (className) {
      html += ` class=${className}`;
    }
    html += '>';
    return htmlSafe(html);
  } else {
    var img = new Image();
    if (width) {
      img.width = width;
    }
    if (height) {
      img.height = height;
    }
    if (className) {
      img.setAttribute('class', className);
    }
    img.src = imageSrc;
    return img;
  }
}
