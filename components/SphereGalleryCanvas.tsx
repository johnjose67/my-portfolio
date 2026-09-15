'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type PhotoCard = {
  x: number;
  y: number;
  width: number;
  height: number;
  imageSrc: string;
};

const TILE_WIDTH = 2400;
const TILE_HEIGHT = 2050; // grown from 1700 — gallery-7 (needs 1960) and gallery-8 (needs 2007) were being clipped by the old, shorter canvas height

// All 8 source photos share the exact same 3:4 (0.75) ratio — width/height
// below are set to that exact ratio too, so drawImageCover below never has
// to crop any part of a photo away to fit a mismatched box.
const PHOTOS: PhotoCard[] = [
  { x: 100, y: 100, width: 520, height: 693.3, imageSrc: '/images/gallery-1.jpg' },
  { x: 900, y: 180, width: 540, height: 720, imageSrc: '/images/gallery-2.jpg' },
  { x: 1720, y: 90, width: 400, height: 533, imageSrc: '/images/gallery-3.jpg' },
  { x: 380, y: 1000, width: 440, height: 587, imageSrc: '/images/gallery-4.jpg' },
  { x: 1250, y: 950, width: 520, height: 693.3, imageSrc: '/images/gallery-5.jpg' },
  { x: 2000, y: 820, width: 400, height: 533, imageSrc: '/images/gallery-6.jpg' },
  { x: 150, y: 1400, width: 420, height: 560, imageSrc: '/images/gallery-7.jpg' },
  { x: 1550, y: 1420, width: 440, height: 587, imageSrc: '/images/gallery-8.jpg' },
];

// --- Plane / bulge tuning ---
const PLANE_SIZE = 6000; // world units — sized generously so the bulge never reveals an edge
const BULGE_RADIUS = 1500; // controls how dramatic the curve is at max — smaller = more dramatic bulge
const CAMERA_DISTANCE = 700;
const FOV = 45;
const CURVATURE_EASE = 0.1; // how quickly it eases between flat and curved each frame

// --- Drag / momentum tuning ---
const PAN_SENSITIVITY = 0.00045; // drag pixels → UV offset
const MOMENTUM_DECAY = 0.94;
const MIN_VELOCITY = 0.00001;

// --- Bounded central area (rubber-band), same mechanism as before —
// just applied to UV offset now instead of orbit angles.
const OFFSET_RANGE_X = 0.5;
const OFFSET_RANGE_Y = 0.4;
const OVERSCROLL_DAMPING = 0.32;
const SPRING_BACK_EASE = 0.14;

function applyBoundedDelta(current: number, delta: number, min: number, max: number): number {
  if (current < min || current > max) {
    return current + delta * OVERSCROLL_DAMPING;
  }
  const next = current + delta;
  if (next < min) return min - (min - next) * OVERSCROLL_DAMPING;
  if (next > max) return max + (next - max) * OVERSCROLL_DAMPING;
  return next;
}

function springBackTowardBounds(value: number, min: number, max: number): number {
  if (value < min) return value + (min - value) * SPRING_BACK_EASE;
  if (value > max) return value + (max - value) * SPRING_BACK_EASE;
  return value;
}

// --- Texture tiling ---
// REPEAT_Y is DERIVED from REPEAT_X and the tile's own aspect ratio,
// rather than chosen independently — if the two don't agree, each
// repeated cell on the plane ends up a different shape than the texture
// tile itself, and the texture gets stretched to fit (this was the
// actual cause of the elongated/cut-off look).
const REPEAT_X = 8;
const REPEAT_Y = REPEAT_X * (TILE_WIDTH / TILE_HEIGHT);

// --- Background image (gallery.png) — sits on its own separate plane,
// positioned slightly behind the main photo plane. Since it's NOT part
// of the repeating tile texture, it never repeats — it just shows
// through the transparent gaps in the pattern above it, once.
const BG_ASPECT = 952 / 464; // gallery.png's real dimensions
const BG_WIDTH = 1400;
const BG_HEIGHT = BG_WIDTH / BG_ASPECT;
const BG_Z_OFFSET = -20; // how far behind the main plane it sits

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > boxRatio) {
    sh = img.height;
    sw = sh * boxRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

async function buildTileTexture(): Promise<THREE.CanvasTexture> {
  const canvas = document.createElement('canvas');
  canvas.width = TILE_WIDTH;
  canvas.height = TILE_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  // Transparent background instead of white — this is what lets the
  // separate background plane (gallery.png) show through the gaps
  // between photos, rather than being covered by a solid white fill.
  ctx.clearRect(0, 0, TILE_WIDTH, TILE_HEIGHT);

  const images = await Promise.all(PHOTOS.map((p) => loadImage(p.imageSrc)));
  PHOTOS.forEach((photo, i) => {
    drawImageCover(ctx, images[i], photo.x, photo.y, photo.width, photo.height);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // No texture.colorSpace set here — combined with renderer.outputColorSpace
  // below, this stops the canvas's already-correct pixels from being
  // color-processed a second time by Three.js, which was producing the
  // filtered/tinted look.
  return texture;
}

const VERTEX_SHADER = `
  uniform float uCurvature; // 0 = perfectly flat, 1 = fully bulged/sphere-like
  uniform float uBulgeRadius;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float r = min(length(pos.xy), uBulgeRadius - 1.0);
    // Sagitta formula — how far a point on a sphere's surface sits above
    // a flat plane at the same radial distance from center. At
    // uCurvature = 0 this contributes nothing at all: the geometry is
    // mathematically identical to a flat plane, not an approximation.
    float sagitta = uBulgeRadius - sqrt(uBulgeRadius * uBulgeRadius - r * r);
    pos.z += sagitta * uCurvature;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D uMap;
  uniform vec2 uOffset;
  uniform vec2 uRepeat;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv * uRepeat + uOffset;
    gl_FragColor = texture2D(uMap, uv);
  }
`;

export default function SphereGalleryCanvas() {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;

    const scene = new THREE.Scene();
    // No scene.background — stays transparent so whatever sits behind
    // this canvas (e.g. GalleryTunnel) shows through.

    const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 20000);
    camera.position.set(0, 0, CAMERA_DISTANCE);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    // Disables the renderer's automatic sRGB re-encoding — our custom
    // shader outputs the canvas's raw pixels directly via texture2D(),
    // so letting Three.js additionally re-process them was the actual
    // cause of the filtered/tinted look.
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const geometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, 200, 200);

    const uniforms = {
      uCurvature: { value: 0 },
      uBulgeRadius: { value: BULGE_RADIUS },
      uMap: { value: null as THREE.Texture | null },
      uOffset: { value: new THREE.Vector2(0, 0) },
      uRepeat: { value: new THREE.Vector2(REPEAT_X, REPEAT_Y) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Background plane for gallery.png — plain, non-repeating,
    // positioned slightly behind the main plane via Z. Never moves with
    // panning at all, so it stays fixed/centered regardless of drag.
    const bgTexture = new THREE.TextureLoader().load('/images/gallery.png');
    bgTexture.colorSpace = THREE.SRGBColorSpace;
    const bgGeometry = new THREE.PlaneGeometry(BG_WIDTH, BG_HEIGHT);
    const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture, transparent: true });
    const bgPlane = new THREE.Mesh(bgGeometry, bgMaterial);
    bgPlane.position.z = BG_Z_OFFSET;
    scene.add(bgPlane);

    let disposed = false;
    let loadedTexture: THREE.CanvasTexture | null = null;
    buildTileTexture().then((texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      loadedTexture = texture;
      uniforms.uMap.value = texture;
      material.needsUpdate = true;
    });

    // Pan state — UV offset, driven directly by drag delta. Replaces the
    // previous theta/phi orbit entirely.
    let offsetX = 0;
    let offsetY = 0;
    let currentCurvature = 0;

    let dragging = false;
    let lastPointer = { x: 0, y: 0 };
    let velocity = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastPointer = { x: e.clientX, y: e.clientY };
      velocity = { x: 0, y: 0 };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPointer.x;
      const dy = e.clientY - lastPointer.y;
      lastPointer = { x: e.clientX, y: e.clientY };

      const dOffsetX = dx * PAN_SENSITIVITY;
      const dOffsetY = -dy * PAN_SENSITIVITY;
      offsetX = applyBoundedDelta(offsetX, dOffsetX, -OFFSET_RANGE_X, OFFSET_RANGE_X);
      offsetY = applyBoundedDelta(offsetY, dOffsetY, -OFFSET_RANGE_Y, OFFSET_RANGE_Y);

      velocity = { x: dOffsetX, y: dOffsetY };
    };

    const onPointerUp = () => {
      dragging = false;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    const resize = () => {
      const w = Math.max(1, frame.clientWidth);
      const h = Math.max(1, frame.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(frame);
    resize();

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);

      if (!dragging) {
        // Momentum: pan keeps drifting with decaying velocity after release
        offsetX = applyBoundedDelta(offsetX, velocity.x, -OFFSET_RANGE_X, OFFSET_RANGE_X);
        offsetY = applyBoundedDelta(offsetY, velocity.y, -OFFSET_RANGE_Y, OFFSET_RANGE_Y);
        velocity.x *= MOMENTUM_DECAY;
        velocity.y *= MOMENTUM_DECAY;
        if (Math.abs(velocity.x) < MIN_VELOCITY && Math.abs(velocity.y) < MIN_VELOCITY) {
          velocity = { x: 0, y: 0 };
        }
      }

      offsetX = springBackTowardBounds(offsetX, -OFFSET_RANGE_X, OFFSET_RANGE_X);
      offsetY = springBackTowardBounds(offsetY, -OFFSET_RANGE_Y, OFFSET_RANGE_Y);

      // Curvature target is simply "are you currently pressing and
      // dragging" — not tied to speed at all, matching "clicked and
      // dragged = sphere, released = flat" exactly.
      const targetCurvature = dragging ? 1 : 0;
      currentCurvature += (targetCurvature - currentCurvature) * CURVATURE_EASE;

      uniforms.uCurvature.value = currentCurvature;
      uniforms.uOffset.value.set(offsetX, offsetY);

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      geometry.dispose();
      material.dispose();
      loadedTexture?.dispose();
      bgGeometry.dispose();
      bgMaterial.dispose();
      bgTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={frameRef} className="fixed inset-0" style={{ cursor: 'grab', touchAction: 'none' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}