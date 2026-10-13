/**
 * Collision detection for swipe trails against circular entity hitboxes.
 * Provides segment-versus-circle intersection and continuous trail sampling.
 */

/**
 * Checks if a line segment (p1 -> p2) intersects a circle (center (cx, cy) with radius r).
 * @param {number} x1 Segment start X
 * @param {number} y1 Segment start Y
 * @param {number} x2 Segment end X
 * @param {number} y2 Segment end Y
 * @param {number} cx Circle center X
 * @param {number} cy Circle center Y
 * @param {number} r Circle radius
 * @returns {boolean} True if intersecting
 */
export function lineSegmentIntersectsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  // Degenerate segment: point-circle test
  if (lenSq === 0) {
    const distSq = (cx - x1) * (cx - x1) + (cy - y1) * (cy - y1);
    return distSq <= r * r;
  }

  // Projection scalar t of circle center onto segment [0, 1]
  const t = Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / lenSq));

  // Closest point on segment
  const closeX = x1 + t * dx;
  const closeY = y1 + t * dy;

  // Distance squared from closest point to circle center
  const distSq = (cx - closeX) * (cx - closeX) + (cy - closeY) * (cy - closeY);
  return distSq <= r * r;
}

/**
 * Tests a swipe path (list of recent points) against an entity.
 * @param {Array<{x: number, y: number}>} points Recent swipe points
 * @param {object} entity Object with x, y, radius, isSliced
 * @returns {{hit: boolean, angle: number}}
 */
export function testSwipeAgainstEntity(points, entity) {
  if (!points || points.length < 2 || entity.isSliced || entity.isDead) {
    return { hit: false, angle: 0 };
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (lineSegmentIntersectsCircle(p1.x, p1.y, p2.x, p2.y, entity.x, entity.y, entity.radius)) {
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      return { hit: true, angle };
    }
  }

  return { hit: false, angle: 0 };
}
