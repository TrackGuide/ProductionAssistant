// components/AnimatedWaveformPreview.tsx
import React, { useRef, useEffect } from 'react';
import GIF from 'gif.js.optimized';

type Renderer = (ctx: OfflineAudioContext) => GainNode;

interface AnimatedWaveformPreviewProps {
  renderAudioGraph: Renderer;
  width?: number;
  height?: number;
  duration?: number; // in seconds
  fps?: number;
}

export const AnimatedWaveformPreview: React.FC<AnimatedWaveformPreviewProps> = ({
  renderAudioGraph,
  width = 500,
  height = 150,
  duration = 1,
  fps = 15,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generate = async () => {
      const sampleRate = 44100;
      const offlineCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
      const endNode = renderAudioGraph(offlineCtx);
      endNode.connect(offlineCtx.destination);
      const audioBuffer = await offlineCtx.startRendering();
      const pcm = audioBuffer.getChannelData(0);

      const gif = new GIF({ workers: 2, quality: 10, width, height });
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      const frames = Math.floor(fps * duration);
      const samplesPerFrame = Math.floor(pcm.length / frames);

      for (let i = 0; i < frames; i++) {
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        const offset = i * samplesPerFrame;
        for (let x = 0; x < width; x++) {
          const idx = offset + Math.floor((x / width) * samplesPerFrame);
          const y = ((1 - pcm[idx]) * height) / 2;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#FFA500';
        ctx.stroke();
        gif.addFrame(ctx, { copy: true, delay: 1000 / fps });
      }

      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<img src="${url}" width="${width}" height="${height}" />`;
        }
      });

      gif.render();
    };

    generate().catch(console.error);
  }, [renderAudioGraph, width, height, duration, fps]);

  return <div ref={containerRef} className="rounded-lg bg-gray-800" />;
};
