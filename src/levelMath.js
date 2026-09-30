export function motionTilt(acceleration, rotation = 0) {
  if (!acceleration || !['x', 'y', 'z'].every(axis => Number.isFinite(acceleration[axis]))) return null;
  const {x, y, z} = acceleration;
  if (Math.hypot(x, y, z) < 1) return null;
  const radians = rotation * Math.PI / 180;
  const horizontal = x * Math.cos(radians) + y * Math.sin(radians);
  const vertical = y * Math.cos(radians) - x * Math.sin(radians);
  return { x: Math.atan2(horizontal, Math.hypot(vertical, z)) * 180 / Math.PI, y: Math.atan2(vertical, Math.hypot(horizontal, z)) * 180 / Math.PI };
}
