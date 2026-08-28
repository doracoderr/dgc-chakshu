import { useEffect, useRef, useState } from 'react';

const CROP_SIZE = 280; // on-screen crop box, in px (square)
const OUTPUT_SIZE = 500; // exported image resolution, in px (square)

/**
 * Lets the admin drag-to-reposition and zoom an image inside a square
 * crop frame before it gets uploaded. Produces a square JPEG Blob.
 *
 * Props:
 *  - imageSrc: object URL of the originally selected file
 *  - onCancel: () => void
 *  - onCropDone: (blob: Blob) => void
 */
export default function ImageCropModal({ imageSrc, onCancel, onCropDone }) {
  const imgRef = useRef(null);
  const [naturalSize, setNaturalSize] = useState(null); // { width, height }
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragState = useRef(null);

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const { naturalWidth, naturalHeight } = img;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
    // "cover" scale so the image always fills the square crop box
    setBaseScale(Math.max(CROP_SIZE / naturalWidth, CROP_SIZE / naturalHeight));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const effectiveScale = baseScale * zoom;

  const onPointerDown = (e) => {
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
    };
  };

  useEffect(() => {
    const onPointerMove = (e) => {
      if (!dragState.current) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      setPosition({ x: dragState.current.origX + dx, y: dragState.current.origY + dy });
    };
    const onPointerUp = () => {
      dragState.current = null;
    };
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
    };
  }, []);

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !naturalSize) return;

    // Work out which region of the *original* image is currently
    // visible inside the crop box, in natural-pixel coordinates.
    const displayedWidth = naturalSize.width * effectiveScale;
    const displayedHeight = naturalSize.height * effectiveScale;
    const imageTopLeftX = CROP_SIZE / 2 + position.x - displayedWidth / 2;
    const imageTopLeftY = CROP_SIZE / 2 + position.y - displayedHeight / 2;

    let cropX = -imageTopLeftX / effectiveScale;
    let cropY = -imageTopLeftY / effectiveScale;
    let cropSize = CROP_SIZE / effectiveScale;

    // Safety clamp so we never read outside the source image bounds
    cropX = Math.max(0, Math.min(cropX, naturalSize.width - cropSize));
    cropY = Math.max(0, Math.min(cropY, naturalSize.height - cropSize));

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    canvas.toBlob(
      (blob) => {
        if (blob) onCropDone(blob);
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h4 style={styles.title}>Adjust photo</h4>
        <div
          style={styles.cropBox}
          onMouseDown={onPointerDown}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt=""
            onLoad={handleImageLoad}
            draggable={false}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${effectiveScale})`,
              transformOrigin: 'center center',
              userSelect: 'none',
              cursor: 'grab',
              maxWidth: 'none',
            }}
          />
        </div>
        <label style={styles.zoomLabel}>
          Zoom
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
        <p style={styles.hint}>Drag the photo to reposition it.</p>
        <div style={styles.actions}>
          <button type="button" onClick={onCancel} style={styles.cancelBtn}>Cancel</button>
          <button type="button" onClick={handleConfirm} className="btn-primary" style={styles.confirmBtn}>
            Use this photo
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: 8, padding: 20, width: 340,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  title: { margin: 0 },
  cropBox: {
    width: CROP_SIZE, height: CROP_SIZE, margin: '0 auto',
    position: 'relative', overflow: 'hidden', borderRadius: '50%',
    background: '#222', border: '2px solid #ddd',
  },
  zoomLabel: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 },
  hint: { fontSize: 12, color: '#666', margin: 0, textAlign: 'center' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: {
    padding: '8px 14px', borderRadius: 6, border: '1px solid #ccc',
    background: '#fff', cursor: 'pointer',
  },
  confirmBtn: { padding: '8px 14px' },
};
