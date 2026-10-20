/**
 * High-definition multi-scene video recording, long duration rendering & subtitle overlay
 */

import { VideoMotionStyle, VideoScene } from '../types.ts';

export interface MultiSceneRenderOptions {
  scenes: Array<{
    imageUrl: string;
    captionText?: string;
    motionStyle: VideoMotionStyle;
    durationSeconds: number;
  }>;
  aspectRatio: string; // "16:9", "9:16", "1:1"
  onProgress?: (progress: number, currentSceneIndex: number) => void;
}

export async function renderMultiSceneVideo(options: MultiSceneRenderOptions): Promise<string> {
  const { scenes, aspectRatio = '16:9', onProgress } = options;

  let width = 1280;
  let height = 720;
  if (aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  } else if (aspectRatio === '1:1') {
    width = 1080;
    height = 1080;
  }

  // Pre-load all scene images
  const loadedImages: HTMLImageElement[] = await Promise.all(
    scenes.map((s) => loadImage(s.imageUrl))
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context could not be created');

  const fps = 30;
  const stream = canvas.captureStream(fps);

  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8000000, // 8 Mbps high quality
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<string>((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(URL.createObjectURL(blob));
    };
    mediaRecorder.onerror = (e) => reject(e);
  });

  mediaRecorder.start();

  const totalDuration = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);
  let globalFrame = 0;
  const totalGlobalFrames = Math.floor(totalDuration * fps);

  // Floating particles
  const particles = Array.from({ length: 45 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 2.5 + 0.5,
    speedX: (Math.random() - 0.5) * 0.8,
    speedY: -Math.random() * 0.7 - 0.2,
    opacity: Math.random() * 0.6 + 0.2,
  }));

  // Iterate over each scene
  for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
    const scene = scenes[sIdx];
    const img = loadedImages[sIdx];
    const sceneFrames = Math.floor(scene.durationSeconds * fps);

    for (let f = 0; f < sceneFrames; f++) {
      const t = f / sceneFrames;

      drawCinematicScene(
        ctx,
        img,
        width,
        height,
        t,
        scene.motionStyle,
        scene.captionText,
        particles,
        aspectRatio
      );

      globalFrame++;
      if (onProgress && globalFrame % 6 === 0) {
        const percent = Math.min(Math.round((globalFrame / totalGlobalFrames) * 100), 100);
        onProgress(percent, sIdx + 1);
      }

      await new Promise((r) => setTimeout(r, 1000 / fps));
    }
  }

  mediaRecorder.stop();
  return recordingPromise;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = (err) => reject(err);
      fallback.src = src;
    };
    img.src = src;
  });
}

function drawCinematicScene(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  t: number,
  motion: VideoMotionStyle,
  captionText: string | undefined,
  particles: Array<{ x: number; y: number; radius: number; speedX: number; speedY: number; opacity: number }>,
  aspectRatio: string
) {
  ctx.clearRect(0, 0, w, h);

  let scale = 1.0;
  let offsetX = 0;
  let offsetY = 0;
  let rotation = 0;

  if (motion === 'drone') {
    scale = 1.0 + t * 0.16;
    offsetY = (1 - t) * (h * 0.03);
    offsetX = (t - 0.5) * (w * 0.02);
  } else if (motion === 'sinematik_zoom') {
    scale = 1.04 + t * 0.20;
  } else if (motion === 'kaydirma') {
    scale = 1.12;
    offsetX = (t - 0.5) * (w * 0.10);
  } else if (motion === 'yavas_cekim') {
    scale = 1.06 + Math.sin(t * Math.PI) * 0.04;
    rotation = Math.sin(t * Math.PI) * 0.008;
  } else if (motion === 'aksiyon') {
    scale = 1.1 + t * 0.12;
    offsetX = Math.sin(t * 12) * 1.5;
  } else {
    // timelapse
    scale = 1.0 + t * 0.10;
    offsetY = t * (h * 0.04);
  }

  // Crossfade transition at start / end of scene
  let fadeAlpha = 1.0;
  if (t < 0.08) fadeAlpha = t / 0.08;
  if (t > 0.92) fadeAlpha = (1 - t) / 0.08;

  ctx.save();
  ctx.globalAlpha = fadeAlpha;
  ctx.translate(w / 2 + offsetX, h / 2 + offsetY);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);

  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;
  let dw = w;
  let dh = h;
  if (imgRatio > canvasRatio) {
    dh = h;
    dw = h * imgRatio;
  } else {
    dw = w;
    dh = w / imgRatio;
  }

  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();

  // Vignette overlay
  const vignette = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.35,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.75
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Particles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  particles.forEach((p) => {
    p.x += p.speedX;
    p.y += p.speedY;
    if (p.y < 0) p.y = h;
    if (p.x < 0) p.x = w;
    if (p.x > w) p.x = 0;

    ctx.save();
    ctx.globalAlpha = p.opacity * (0.5 + 0.5 * Math.sin(t * 8 + p.x));
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Render Subtitles / Caption Overlay if present
  if (captionText) {
    ctx.save();
    const fontSize = aspectRatio === '9:16' ? 36 : 30;
    ctx.font = `bold ${fontSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textY = aspectRatio === '9:16' ? h * 0.82 : h * 0.88;
    const textWidth = ctx.measureText(captionText).width;

    // Background pill for subtitle
    const pillPaddingX = 24;
    const pillPaddingY = 12;
    const pillHeight = fontSize + pillPaddingY * 2;
    const pillWidth = Math.min(textWidth + pillPaddingX * 2, w * 0.92);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.beginPath();
    ctx.roundRect(
      w / 2 - pillWidth / 2,
      textY - pillHeight / 2,
      pillWidth,
      pillHeight,
      16
    );
    ctx.fill();

    // Yellow accent bar on left of subtitle pill
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(
      w / 2 - pillWidth / 2 + 4,
      textY - (pillHeight - 14) / 2,
      5,
      pillHeight - 14,
      3
    );
    ctx.fill();

    // Text with soft shadow
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText(captionText, w / 2, textY);
    ctx.restore();
  }
}
