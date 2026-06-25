import { useEffect, useRef, useState } from 'react';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function useMapViewport(resetKey) {
  const dragRef = useRef(null);

  const [view, setView] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    setView({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });
  }, [resetKey]);

  function zoomBy(delta) {
    setView((current) => ({
      ...current,
      scale: clamp(current.scale + delta, 1, 5),
    }));
  }

  function resetZoom() {
    setView({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });
  }

  function handleWheel(event) {
    event.preventDefault();

    const delta = event.deltaY > 0 ? -0.2 : 0.2;

    setView((current) => ({
      ...current,
      scale: clamp(current.scale + delta, 1, 5),
    }));
  }

  function handlePointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId);

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: view.offsetX,
      offsetY: view.offsetY,
    };
  }

  function handlePointerMove(event) {
    if (!dragRef.current) return;

    const dx = (event.clientX - dragRef.current.startX) / view.scale;
    const dy = (event.clientY - dragRef.current.startY) / view.scale;

    setView((current) => ({
      ...current,
      offsetX: dragRef.current.offsetX + dx,
      offsetY: dragRef.current.offsetY + dy,
    }));
  }

  function handlePointerUp(event) {
    if (dragRef.current?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
  }

  return {
    view,
    zoomBy,
    resetZoom,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}