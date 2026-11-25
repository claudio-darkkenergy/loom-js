// Module state both entries import, so it lands in a shared chunk; every
// dev run must start from a fresh copy.
let count = 0;

export const nextRunCount = () => ++count;
