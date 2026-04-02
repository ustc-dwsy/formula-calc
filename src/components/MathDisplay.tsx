import React, { useRef, useEffect } from 'react';
import katex from 'katex';

interface MathDisplayProps {
  math: string;
  block?: boolean;
}

export const MathDisplay: React.FC<MathDisplayProps> = ({ math, block = false }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          displayMode: block,
          throwOnError: false,
          strict: false,
        });
      } catch (e) {
        console.error('KaTeX rendering error:', e);
        containerRef.current.textContent = math;
      }
    }
  }, [math, block]);

  return <span ref={containerRef} />;
};