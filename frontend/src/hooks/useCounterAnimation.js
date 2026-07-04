import { useState, useEffect } from 'react';

/**
 * Animated number counter hook
 * @param {number} target - The final target number
 * @param {number} duration - Total animation time in ms
 * @returns {number} The current animated value
 */
export default function useCounterAnimation(target, duration = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(target, 10);
    if (isNaN(end) || end <= 0) {
      setCount(target);
      return;
    }

    const startTime = performance.now();

    function updateCount(currentTime) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Easing out function (quad)
      const easeProgress = progress * (2 - progress);
      
      const currentCount = Math.floor(easeProgress * end);
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(end);
      }
    }

    requestAnimationFrame(updateCount);
  }, [target, duration]);

  return count;
}
