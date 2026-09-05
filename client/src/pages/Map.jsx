import { useState, useRef, useEffect } from 'react';
import { FaMapMarkedAlt, FaRegImage } from 'react-icons/fa';
import '../styles/map.css';
import CampusLeafletMap from '../components/CampusLeafletMap';

function Map() {
  const [view, setView] = useState('interactive'); // 'interactive' | 'image'
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const mapContainerRef = useRef(null);
  const imgRef = useRef(null);

  // Size the map block to exactly (viewport height - navbar height) so
  // the whole map — header, toggle, legend, map area, and any
  // error/status banner inside it — is fully visible on first load
  // without scrolling, on any device. The page itself still scrolls
  // normally below that, so the footer stays reachable.
  useEffect(() => {
    const navbarEl = document.querySelector('.navbar');
    const root = document.documentElement;

    const updateNavbarHeight = () => {
      const h = navbarEl ? navbarEl.getBoundingClientRect().height : 68;
      root.style.setProperty('--app-navbar-h', `${h}px`);
    };
    updateNavbarHeight();

    let observer;
    if (navbarEl && 'ResizeObserver' in window) {
      observer = new ResizeObserver(updateNavbarHeight);
      observer.observe(navbarEl);
    } else {
      window.addEventListener('resize', updateNavbarHeight);
    }

    return () => {
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', updateNavbarHeight);
    };
  }, []);

  // How far the image can be panned at a given zoom level before its
  // edge would pull in from the container edge and show blank space.
  // Image is centered (transform-origin: center) inside a flex-centered
  // container, so the max offset in each direction is simply half the
  // overflow between the scaled image and the container.
  const getMaxPan = (zoomVal) => {
    const container = mapContainerRef.current;
    const img = imgRef.current;
    if (!container || !img) return { maxX: 0, maxY: 0 };
    const containerRect = container.getBoundingClientRect();
    const scaledWidth = img.offsetWidth * zoomVal;
    const scaledHeight = img.offsetHeight * zoomVal;
    return {
      maxX: Math.max(0, (scaledWidth - containerRect.width) / 2),
      maxY: Math.max(0, (scaledHeight - containerRect.height) / 2),
    };
  };

  const clamp = (val, max) => Math.min(Math.max(val, -max), max);

  // Sets pan, clamped so the image can never be dragged/zoomed to reveal
  // blank space past its own edge.
  const applyPan = (x, y, zoomVal) => {
    const { maxX, maxY } = getMaxPan(zoomVal);
    setPanX(clamp(x, maxX));
    setPanY(clamp(y, maxY));
  };

  const applyZoom = (nextZoom) => {
    const clamped = Math.min(Math.max(nextZoom, 1), 3);
    setZoom(clamped);
    applyPan(panX, panY, clamped);
    return clamped;
  };

  const handleZoomIn = () => {
    applyZoom(zoom + 0.25);
  };

  const handleZoomOut = () => {
    applyZoom(zoom - 0.25);
  };

  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // Double click zoom
  const handleDoubleClick = () => {
    if (zoom < 2) {
      applyZoom(2);
    } else {
      handleReset();
    }
  };

  // Ctrl/Cmd + scroll to zoom, same convention as the interactive map —
  // plain scroll is left alone so it scrolls the page normally.
  const handleWheel = (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    applyZoom(zoom + (e.deltaY < 0 ? 0.25 : -0.25));
  };

  // Get touch distance for pinch
  const getTouchDistance = (touches) => {
    if (touches.length !== 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsPanning(true);
      setStartX(e.clientX - panX);
      setStartY(e.clientY - panY);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && zoom > 1) {
      applyPan(e.clientX - startX, e.clientY - startY, zoom);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      setLastTouchDistance(getTouchDistance(e.touches));
    } else if (e.touches.length === 1 && zoom > 1) {
      // Single finger pan
      setIsPanning(true);
      setStartX(e.touches[0].clientX - panX);
      setStartY(e.touches[0].clientY - panY);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const currentDistance = getTouchDistance(e.touches);
      if (lastTouchDistance > 0) {
        const scale = currentDistance / lastTouchDistance;
        applyZoom(zoom * scale);
      }
      setLastTouchDistance(currentDistance);
    } else if (e.touches.length === 1 && isPanning && zoom > 1) {
      // Pan
      applyPan(e.touches[0].clientX - startX, e.touches[0].clientY - startY, zoom);
    }
  };

  const handleTouchEnd = (e) => {
    setIsPanning(false);
    setLastTouchDistance(0);

    // Double tap zoom
    const now = Date.now();
    if (now - lastTap < 300) {
      if (zoom >= 2) {
        handleReset();
      } else {
        applyZoom(zoom + 0.5);
      }
    }
    setLastTap(now);
  };

  return (
    <div className="map-wrapper">
      {/* Header */}
      <div className="map-header">
        <h1>DGC Campus Map</h1>
        <div className="map-view-toggle">
          <button
            type="button"
            className={`map-toggle-btn ${view === 'interactive' ? 'active' : ''}`}
            onClick={() => setView('interactive')}
          >
            <FaMapMarkedAlt />
            Interactive Map
          </button>
          <button
            type="button"
            className={`map-toggle-btn ${view === 'image' ? 'active' : ''}`}
            onClick={() => setView('image')}
          >
            <FaRegImage />
            Campus Layout Image
          </button>
        </div>
      </div>

      {view === 'interactive' ? (
        <div className="map-area-frame">
          <CampusLeafletMap />
        </div>
      ) : (
      <div className="map-area-frame map-area-frame--image">
        {/* Map Viewer */}
        <div
          ref={mapContainerRef}
          className="map-viewer"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          {/* Floating Controls — pinned to the map itself (not the
              viewport), so they never drift toward the footer while the
              page scrolls. onDoubleClick here stops a fast double-click
              on a button from also bubbling up as a native "dblclick" on
              the map and triggering handleDoubleClick's zoom-to-2. */}
          <div className="map-floating-controls" onDoubleClick={(e) => e.stopPropagation()}>
            <div className="map-zoom-control">
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="map-zoom-btn zoom-in-btn"
                title="Zoom in"
                aria-label="Zoom in"
              >
                +
              </button>
              <div className="map-zoom-divider" />
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="map-zoom-btn zoom-out-btn"
                title="Zoom out"
                aria-label="Zoom out"
              >
                −
              </button>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="map-reset-btn"
              title="Reset view"
              aria-label="Reset view"
            >
              ⟲
            </button>
            <div className="map-zoom-indicator">
              {Math.round(zoom * 100)}%
            </div>
          </div>

          <div
            className="map-image-container"
            style={{
              transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: zoom === 1 && panX === 0 && panY === 0 ? 'transform 0.3s ease-out' : 'none',
            }}
          >
            <img
              ref={imgRef}
              src="/map.png"
              alt="DGC Campus Layout"
              draggable={false}
            />
          </div>
        </div>

        {/* Info Text */}
        <div className="map-info">
          <p>
            {zoom > 1 ? (
              <>🖱️ Drag to pan • 🔄 Double-click to reset • Ctrl + scroll to zoom • Mobile: Pinch/Swipe • Double-tap to reset</>
            ) : (
              <>🖱️ Double-click or Ctrl + scroll to zoom • 👆 Pinch on mobile • Double-tap to zoom</>
            )}
          </p>
        </div>
      </div>
      )}
    </div>
  );
}

export default Map;