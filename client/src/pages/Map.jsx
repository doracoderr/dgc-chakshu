import { useState, useRef, useEffect } from 'react';
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
  const [controlsBottom, setControlsBottom] = useState('1rem');
  const mapContainerRef = useRef(null);
  const controlsRef = useRef(null);

  // Handle scroll to adjust controls position
  useEffect(() => {
    const handleScroll = () => {
      if (controlsRef.current) {
        const footer = document.querySelector('.footer');
        if (footer) {
          const footerRect = footer.getBoundingClientRect();
          const controlsRect = controlsRef.current.getBoundingClientRect();
          
          // If controls are above footer, adjust position
          if (footerRect.top < controlsRect.bottom + 20) {
            const newBottom = window.innerHeight - footerRect.top + 10;
            setControlsBottom(`${newBottom}px`);
          } else {
            setControlsBottom('1rem');
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 1));
  };

  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // Double click zoom
  const handleDoubleClick = () => {
    if (zoom < 2) {
      setZoom(2);
    } else {
      handleReset();
    }
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
      setPanX(e.clientX - startX);
      setPanY(e.clientY - startY);
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
        setZoom(prev => Math.max(1, Math.min(prev * scale, 3)));
      }
      setLastTouchDistance(currentDistance);
    } else if (e.touches.length === 1 && isPanning && zoom > 1) {
      // Pan
      setPanX(e.touches[0].clientX - startX);
      setPanY(e.touches[0].clientY - startY);
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
        setZoom(prev => Math.min(prev + 0.5, 3));
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
            📍 Interactive Map
          </button>
          <button
            type="button"
            className={`map-toggle-btn ${view === 'image' ? 'active' : ''}`}
            onClick={() => setView('image')}
          >
            🗺️ Campus Layout Image
          </button>
        </div>
      </div>

      {view === 'interactive' ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <CampusLeafletMap />
        </div>
      ) : (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
        >
          {/* Floating Controls */}
          <div 
            ref={controlsRef}
            className="map-floating-controls"
            style={{ bottom: controlsBottom }}
          >
            <button
              onClick={handleZoomIn}
              className="map-float-btn zoom-in-btn"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="map-float-btn zoom-out-btn"
              title="Zoom Out"
            >
              −
            </button>
            <button
              onClick={handleReset}
              className="map-float-btn reset-btn"
              title="Reset View"
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
              <>🖱️ Drag to pan • 🔄 Double-click to reset • Mobile: Pinch/Swipe • Double-tap to reset</>
            ) : (
              <>🖱️ Double-click to zoom • 👆 Pinch on mobile • Double-tap to zoom</>
            )}
          </p>
        </div>
      </div>
      )}
    </div>
  );
}

export default Map;