// A press that moves less than this is a click, not a drag.
const DRAG_THRESHOLD = 3;

/**
 * Follows a pointer pressed on `element` until release.
 * @param element The pressed element, which captures the pointer.
 * @param start The press.
 * @param onMove Called with the distance moved, once past the drag threshold.
 * @param onEnd Called on release with whether the pointer moved.
 */
export const trackPointer = (
    element: HTMLElement,
    start: PointerEvent,
    onMove: (dx: number, dy: number, move: PointerEvent) => void,
    onEnd: (moved: boolean) => void
) => {
    let moved = false;
    const onPointerMove = (move: PointerEvent) => {
        const dx = move.clientX - start.clientX;
        const dy = move.clientY - start.clientY;

        moved ||= Math.hypot(dx, dy) >= DRAG_THRESHOLD;
        moved && onMove(dx, dy, move);
    };
    const onPointerUp = () => {
        element.removeEventListener('pointermove', onPointerMove);
        element.removeEventListener('pointerup', onPointerUp);
        element.removeEventListener('pointercancel', onPointerUp);
        onEnd(moved);
    };

    // Capture keeps the moves coming when the pointer crosses the frame;
    // a synthesized pointer has nothing to capture.
    try {
        element.setPointerCapture(start.pointerId);
    } catch {
        // Moves still arrive while the pointer stays over `element`.
    }
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', onPointerUp);
};
