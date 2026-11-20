import { useEffect, useState } from 'react';
import BowlArt from './BowlArt.jsx';
import { Garnish } from './Garnish.jsx';

const imageCache = new Map();
const IMAGE_BOX = { left: 78, top: 60, width: 720, height: 1040 };
const BASE_X = 438, BASE_Y = 1100;

function prepareImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const result = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const { naturalWidth: width, naturalHeight: height } = image;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Canvas 2D context is unavailable.');
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, width, height).data;
        let left = width, top = height, right = -1, bottom = -1, opaque = true;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const alpha = pixels[(y * width + x) * 4 + 3];
            if (alpha < 255) opaque = false;
            if (alpha > 0) {
              left = Math.min(left, x); top = Math.min(top, y);
              right = Math.max(right, x); bottom = Math.max(bottom, y);
            }
          }
        }
        if (right < left || bottom < top) throw new Error(`Product image has no visible pixels: ${src}`);
        if (opaque) {
          resolve({ src, width, height, opaque: true });
          return;
        }
        const trimmedWidth = right - left + 1, trimmedHeight = bottom - top + 1;
        const trimmed = document.createElement('canvas');
        trimmed.width = trimmedWidth;
        trimmed.height = trimmedHeight;
        const trimmedContext = trimmed.getContext('2d');
        if (!trimmedContext) throw new Error('Canvas 2D context is unavailable.');
        trimmedContext.drawImage(image, left, top, trimmedWidth, trimmedHeight, 0, 0, trimmedWidth, trimmedHeight);
        resolve({ src: trimmed.toDataURL('image/png'), width: trimmedWidth, height: trimmedHeight, opaque: false });
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error(`Unable to load product image: ${src}`));
    image.src = src;
  });
  imageCache.set(src, result);
  return result;
}

function usePreparedImage(src) {
  const [image, setImage] = useState(null);
  useEffect(() => {
    let active = true;
    setImage(null);
    prepareImage(src).then(
      (prepared) => { if (active) setImage(prepared); },
      (error) => {
        console.error('Unable to prepare product image.', error);
        if (active) setImage({ error: true });
      },
    );
    return () => { active = false; };
  }, [src]);
  return image;
}

export default function ShowcaseProduct({ src, flavour, peek = false, side = 'left' }) {
  const image = usePreparedImage(src);
  if (!image || image.error) return <BowlArt flavour={flavour} peek={peek} />;

  const visibleWidth = image.opaque ? IMAGE_BOX.width : Math.min(IMAGE_BOX.width, IMAGE_BOX.height * image.width / image.height);
  const factor = visibleWidth / IMAGE_BOX.width;
  const productLeft = BASE_X - visibleWidth / 2;
  return (
    <>
      <i className="product-shadow" style={{ left: BASE_X - visibleWidth * .45, width: visibleWidth * .9 }} />
      <div className={`product-image-frame ${image.opaque ? 'opaque' : ''}`}>
        <img className="pimg" src={image.src} alt="" draggable="false" style={{ objectFit: image.opaque ? 'cover' : 'contain' }} />
      </div>
      <div className="product-garnish-layer">
        {flavour.garnish.map(([kind, x, , size, rotation], index) => {
          const scaledSize = size * factor;
          const garnishLeft = side === 'right'
            ? productLeft + visibleWidth - (x - 10) * factor - scaledSize
            : productLeft + (x - 10) * factor;
          return (
            <span key={`${kind}-${index}`} className="product-garnish" style={{
              left: garnishLeft,
              top: BASE_Y - scaledSize,
              width: scaledSize,
              height: scaledSize,
              transform: `rotate(${rotation}deg)`,
            }}>
              <Garnish kind={kind} />
            </span>
          );
        })}
      </div>
    </>
  );
}
