/**
 * usePointerPan
 * Pointer, touch (pinch) and wheel handlers for panning + pinch-zoom.
 *
 * Usage:
 * const { onPointerDown, onPointerMove, onPointerUp, handleZoomWheel } = usePointerPan({
 *   stageRef, zoomScale, panX, panY, isPanning, canPan, showUI, scheduleHideUI, prevPage, nextPage
 * });
 *
 * Note: this composable does NOT attach DOM listeners itself — return handlers to be bound in the component template.
 */

export function usePointerPan({
  stageRef,
  zoomScale,
  panX,
  panY,
  isPanning,
  canPan,
  showUI,
  scheduleHideUI,
  prevPage,
  nextPage
}) {
  // Drag/pan state
  let startClientX = 0;
  let startClientY = 0;
  let startPanX = 0;
  let startPanY = 0;

  // Pinch state
  let initialDistance = 0;
  let initialZoom = 1;

  function onPointerDown(e) {
    const isPinchGesture = e.touches && e.touches.length === 2;

    if (isPinchGesture) {
      if (e.cancelable) e.preventDefault();

      const [touch1, touch2] = e.touches;
      initialDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      initialZoom = zoomScale.value;
      isPanning.value = false; // disable pan while pinch zooming
      return;
    }

    if (!canPan.value) return;

    if (e.cancelable) e.preventDefault();
    isPanning.value = true;
    startClientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startClientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startPanX = panX.value;
    startPanY = panY.value;
  }

  function onPointerMove(e) {
    // --- Pinch zoom ---
    if (e.touches && e.touches.length === 2) {
      if (e.cancelable) e.preventDefault();

      const [touch1, touch2] = e.touches;
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (initialDistance > 0) {
        const zoomFactor = currentDistance / initialDistance;
        const newZoom = Math.min(Math.max(initialZoom * zoomFactor, 1), 3);

        // Midpoint between fingers
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        const rect = stageRef.value.getBoundingClientRect();
        const mouseX = midX - rect.left;
        const mouseY = midY - rect.top;

        // Adjust pan so zoom focuses on pinch center
        const currentZoom = zoomScale.value || 1;
        panX.value = mouseX - (mouseX - panX.value) * (newZoom / currentZoom);
        panY.value = mouseY - (mouseY - panY.value) * (newZoom / currentZoom);

        zoomScale.value = newZoom;
        showUI.value = true;
        scheduleHideUI();
      }
      return;
    }

    // --- Panning ---
    if (!isPanning.value) return;

    if (e.cancelable) e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    panX.value = startPanX + (clientX - startClientX);
    panY.value = startPanY + (clientY - startClientY);
  }

  function onPointerUp() {
    isPanning.value = false;
    initialDistance = 0; // reset pinch state
  }

  function handleZoomWheel(e) {
    e.preventDefault();
    const delta = -e.deltaY;
    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    const newZoom = zoomScale.value * zoomFactor;

    // Limit zoom range
    zoomScale.value = Math.min(Math.max(newZoom, 1), 3);

    // Center zoom on mouse position
    if (zoomScale.value > 1) {
      const stage = stageRef.value;
      const rect = stage.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate new pan to keep content under mouse stable
      panX.value = mouseX - (mouseX - panX.value) * zoomFactor;
      panY.value = mouseY - (mouseY - panY.value) * zoomFactor;
    } else {
      // Reset pan when zoomed all the way out
      panX.value = 0;
      panY.value = 0;
    }

    showUI.value = true;
    scheduleHideUI();
  }

  // Expose handlers
  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    handleZoomWheel
  };
}
