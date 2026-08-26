import { useState } from 'react';

function Map() {
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

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
    if (zoom > 1) {
      setIsPanning(true);
      setStartX(e.touches[0].clientX - panX);
      setStartY(e.touches[0].clientY - panY);
    }
  };

  const handleTouchMove = (e) => {
    if (isPanning && zoom > 1) {
      setPanX(e.touches[0].clientX - startX);
      setPanY(e.touches[0].clientY - startY);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">DGC Campus Map</h1>
      </div>

      {/* Map Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Controls */}
        <div className="bg-white border-b border-gray-200 p-3 md:p-4 flex justify-center gap-2 md:gap-3 flex-wrap">
          <button
            onClick={handleZoomIn}
            className="px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition text-sm md:text-base"
          >
            + Zoom In
          </button>
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition text-sm md:text-base"
          >
            − Zoom Out
          </button>
          <button
            onClick={handleReset}
            className="px-3 md:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition text-sm md:text-base"
          >
            ↺ Reset
          </button>
          <span className="px-3 md:px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm md:text-base font-medium">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Map Viewer */}
        <div
          className="flex-1 overflow-hidden bg-gray-100 cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <div
            className="w-full h-full flex items-center justify-center transition-transform"
            style={{
              transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <img
              src="/map.png"
              alt="DGC Campus Layout"
              className="max-w-none h-auto select-none pointer-events-none rounded-lg shadow-lg"
              draggable={false}
            />
          </div>
        </div>

        {/* Info Text */}
        <div className="bg-white border-t border-gray-200 p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-600 text-center">
            {zoom > 1 ? 'Drag to pan • Use buttons to zoom' : 'Click Zoom In to explore • Works on all devices'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Map;