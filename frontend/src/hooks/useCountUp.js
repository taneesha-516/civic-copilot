import { useEffect, useRef, useState } from "react";

function easeOutExpo(progress) {
  return progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
}

export function useCountUp(target, duration = 1400, delay = 0, decimals = 0) {
  const [node, setNode] = useState(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!node || startedRef.current) return undefined;

    let frame = 0;
    let timer = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || startedRef.current) return;

        startedRef.current = true;
        timer = window.setTimeout(() => {
          const startedAt = performance.now();

          function tick(time) {
            const progress = Math.min(1, (time - startedAt) / duration);
            setValue(target * easeOutExpo(progress));

            if (progress < 1) {
              frame = requestAnimationFrame(tick);
            }
          }

          frame = requestAnimationFrame(tick);
        }, delay);
      },
      { threshold: 0.35 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [delay, duration, node, target]);

  return [setNode, value.toFixed(decimals), value];
}
