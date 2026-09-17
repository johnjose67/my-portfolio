'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { animate } from 'framer-motion';

export type SphereGalleryCanvasHandle = {
  exitAnimation: () => Promise<void>;
};

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
  { x: 900, y: 180, width: 590, height: 786.6, imageSrc: '/images/gallery-2.jpg' },
  { x: 1720, y: 90, width: 450, height: 600, imageSrc: '/images/gallery-3.jpg' },
  { x: 580, y: 1000, width: 460, height: 613.3, imageSrc: '/images/gallery-4.jpg' },
  { x: 1250, y: 1050, width: 520, height: 693.3, imageSrc: '/images/gallery-5.jpg' },
  { x: 2000, y: 820, width: 400, height: 533, imageSrc: '/images/gallery-6.jpg' },
  { x: 100, y: 1400, width: 420, height: 560, imageSrc: '/images/gallery-7.jpg' },
  { x: 1850, y: 1420, width: 440, height: 587, imageSrc: '/images/gallery-8.jpg' },
];

// --- Plane / bulge tuning ---
const PLANE_SIZE = 6000; // world units — sized generously so the bulge never reveals an edge
const BULGE_RADIUS = 1200; // controls how dramatic the curve is at max — smaller = more dramatic bulge
const CAMERA_DISTANCE = 700;
const FOV = 45;
const CURVATURE_EASE = 0.1; // how quickly it eases between flat and curved each frame

// --- Drag / momentum tuning ---
const PAN_SENSITIVITY = 0.00045; // drag pixels → UV offset
const MOMENTUM_DECAY = 0.94;
const MIN_VELOCITY = 0.00001;

// How long a press must be held before curvature starts activating —
// this is what distinguishes a genuine "click and hold" from a quick
// single click/tap, which should have no curve effect at all.
const HOLD_THRESHOLD_MS = 150;

// Panning is unbounded — offsetX/offsetY can grow in any direction
// forever. The texture's RepeatWrapping (see REPEAT_X/REPEAT_Y below)
// handles the seamless loop on the GPU side automatically, so there's
// nothing here that needs to clamp or spring back.

// --- Texture tiling ---
// REPEAT_Y is DERIVED from REPEAT_X and the tile's own aspect ratio,
// rather than chosen independently — if the two don't agree, each
// repeated cell on the plane ends up a different shape than the texture
// tile itself, and the texture gets stretched to fit (this was the
// actual cause of the elongated/cut-off look).
const REPEAT_X = 8;
const REPEAT_Y = REPEAT_X * (TILE_WIDTH / TILE_HEIGHT);

// gallery.png badge removed from this canvas — it's now shown only via
// the DOM-based BadgeDissolve badge on the Gallery page itself, to
// avoid two separate renders of the same image on screen at once.

// --- Intro (load-in) tuning — slide up from below while curved,
// flattening as it settles into place, with a single simple top-to-
// bottom reveal line sweeping down over the whole plane at the same time ---
const INTRO_DURATION_S = 2.0;
const INTRO_SLIDE_DISTANCE = 400; // world units below resting position to start from

// --- Exit tuning (reverse of the intro, played on Home click) ---
const EXIT_DURATION_S = 0.9;

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

// uRevealProgress: 0 = nothing shown yet, 1 = fully revealed. Uses
// gl_FragCoord (actual on-screen pixel position) rather than the
// plane's own vUv — the plane is 6000 units across but the camera only
// ever sees a small sliver of it near its center, so sweeping across
// vUv's full 0–1 range would race through that tiny visible portion
// almost instantly. Screen-space coordinates track what you actually
// see, regardless of the underlying plane's real size.
const FRAGMENT_SHADER = `
  uniform sampler2D uMap;
  uniform vec2 uOffset;
  uniform vec2 uRepeat;
  uniform float uRevealProgress;
  uniform vec2 uResolution;
  varying vec2 vUv;

  void main() {
    // 0 = bottom of the screen, 1 = top. Revealing top-to-bottom means
    // the visible region starts at the top and grows downward as
    // progress increases.
    float screenY = gl_FragCoord.y / uResolution.y;
    if (screenY < (1.0 - uRevealProgress)) {
      discard;
    }

    vec2 uv = vUv * uRepeat + uOffset;
    gl_FragColor = texture2D(uMap, uv);
  }
`;

const SphereGalleryCanvas = forwardRef<SphereGalleryCanvasHandle>(function SphereGalleryCanvas(_, ref) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Holds references to the live plane/uniforms/state so the imperative
  // exitAnimation() below (called from OUTSIDE the effect, via ref) can
  // reach into the same Three.js objects the effect owns.
  const sceneApiRef = useRef<{
    plane: THREE.Mesh;
    uniforms: {
      uCurvature: { value: number };
      uRevealProgress: { value: number };
    };
    setExiting: (v: boolean) => void;
  } | null>(null);

  useImperativeHandle(ref, () => ({
    exitAnimation: () => {
      return new Promise<void>((resolve) => {
        const api = sceneApiRef.current;
        if (!api) {
          resolve();
          return;
        }
        // Stops the normal per-frame drag/pan logic from fighting with
        // this animation's direct writes to the same uniforms.
        api.setExiting(true);

        animate(0, 1, {
          duration: EXIT_DURATION_S,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: (t) => {
            // Exact reverse of the intro: slides back down and curves
            // back up, together.
            api.plane.position.y = -INTRO_SLIDE_DISTANCE * t;
            api.uniforms.uCurvature.value = t;
          },
          onComplete: resolve,
        });

        // Reveal reverses too — same EXIT_DURATION_S, running
        // concurrently, matching how the intro combined both.
        animate(1, 0, {
          duration: EXIT_DURATION_S,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: (v) => {
            api.uniforms.uRevealProgress.value = v;
          },
        });
      });
    },
  }));

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
      uRevealProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.position.y = -INTRO_SLIDE_DISTANCE; // starts off-screen below, slides up on load
    scene.add(plane);

    sceneApiRef.current = {
      plane,
      uniforms,
      setExiting: (v) => {
        exiting = v;
      },
    };

    // Pan state — UV offset, driven directly by drag delta.
    let offsetX = 0;
    let offsetY = 0;
    let currentCurvature = 0;

    let disposed = false;
    let exiting = false; // true while exitAnimation() is playing — pauses the normal drag/pan-driven curvature and offset updates below so they don't fight with it
    let loadedTexture: THREE.CanvasTexture | null = null;
    let introControls: ReturnType<typeof animate> | null = null;
    let revealControls: ReturnType<typeof animate> | null = null;
    let introActive = true; // while true, the intro animation owns uCurvature entirely — the normal drag-based logic below stays hands-off until it finishes

    buildTileTexture().then((texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      loadedTexture = texture;
      uniforms.uMap.value = texture;
      material.needsUpdate = true;

      // Slide/flatten — kept on the fast, elegant ease-out curve, since
      // that's the right feel for something settling into place.
      introControls = animate(0, 1, {
        duration: INTRO_DURATION_S,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (t) => {
          plane.position.y = -INTRO_SLIDE_DISTANCE * (1 - t);
          const curvature = 1 - t;
          uniforms.uCurvature.value = curvature;
          currentCurvature = curvature; // keeps the drag-based system's own state in sync, so there's no jump when it takes over after
        },
        onComplete: () => {
          introActive = false;
        },
      });

      // Reveal — deliberately on its OWN linear (constant-speed) timing,
      // not the ease-out curve above.
      revealControls = animate(0, 1, {
        duration: 1.0,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (t) => {
          uniforms.uRevealProgress.value = t;
        },
      });
    });

    // Pan/drag state — `dragging` still fires immediately on press (it
    // needs to, for pan tracking to feel responsive from the first
    // pixel of movement). `holding` is a SEPARATE flag that only
    // becomes true once the press has lasted past HOLD_THRESHOLD_MS —
    // curvature reads from `holding`, not `dragging`, so a quick tap
    // (pressed and released before that threshold) never triggers it.
    let dragging = false;
    let holding = false;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    let lastPointer = { x: 0, y: 0 };
    let velocity = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastPointer = { x: e.clientX, y: e.clientY };
      velocity = { x: 0, y: 0 };

      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        holding = true;
      }, HOLD_THRESHOLD_MS);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPointer.x;
      const dy = e.clientY - lastPointer.y;
      lastPointer = { x: e.clientX, y: e.clientY };

      const dOffsetX = dx * PAN_SENSITIVITY;
      const dOffsetY = -dy * PAN_SENSITIVITY;
      offsetX += dOffsetX;
      offsetY += dOffsetY;

      velocity = { x: dOffsetX, y: dOffsetY };
    };

    const onPointerUp = () => {
      dragging = false;
      holding = false;
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    const resize = () => {
      // Same correction as GalleryTunnel — frame.clientWidth/clientHeight
      // measure the PRE-scale layout size (149.25vw/vh), not what's
      // actually visible. Without correcting for the known 0.67 scale
      // factor, the drawing buffer ends up ~1.5x oversized, which was
      // enough to break rendering entirely on this more complex scene.
      const w = Math.max(1, frame.clientWidth * 0.67);
      const h = Math.max(1, frame.clientHeight * 0.67);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      const pixelRatio = renderer.getPixelRatio();
      uniforms.uResolution.value.set(w * pixelRatio, h * pixelRatio);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(frame);
    resize();

    let raf = 0;
    const animateLoop = () => {
      raf = requestAnimationFrame(animateLoop);

      if (!dragging) {
        // Momentum: pan keeps drifting with decaying velocity after release
        offsetX += velocity.x;
        offsetY += velocity.y;
        velocity.x *= MOMENTUM_DECAY;
        velocity.y *= MOMENTUM_DECAY;
        if (Math.abs(velocity.x) < MIN_VELOCITY && Math.abs(velocity.y) < MIN_VELOCITY) {
          velocity = { x: 0, y: 0 };
        }
      }

      // Wraps the raw offset back into a small range every frame — not
      // needed for the visual loop (RepeatWrapping already handles any
      // value correctly on the GPU), just keeps the JS-side numbers from
      // growing unbounded over a very long dragging session.
      offsetX = offsetX % 1;
      offsetY = offsetY % 1;

      // Curvature target reads from `holding`, not `dragging` — see the
      // comment above onPointerDown for why. Skipped entirely while the
      // intro is still playing, since that animation owns uCurvature
      // during that window instead.
      if (!introActive && !exiting) {
        const targetCurvature = holding ? 1 : 0;
        currentCurvature += (targetCurvature - currentCurvature) * CURVATURE_EASE;
        uniforms.uCurvature.value = currentCurvature;
      }
      uniforms.uOffset.value.set(offsetX, offsetY);

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animateLoop);

    return () => {
      disposed = true;
      sceneApiRef.current = null;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      if (holdTimer) clearTimeout(holdTimer);
      introControls?.stop();
      revealControls?.stop();
      geometry.dispose();
      material.dispose();
      loadedTexture?.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className="fixed inset-0"
      style={{ cursor: 'grab', touchAction: 'none', width: '149.25vw', height: '149.25vh' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
});

export default SphereGalleryCanvas;