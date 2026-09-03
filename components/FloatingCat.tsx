'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Bounds, Center } from '@react-three/drei';
import type { Group } from 'three';

type FloatingCatProps = {
  url: string;
  scale?: number;
  proximityRadius?: number; // px on screen — how close the cursor needs to be to trigger the look
  maxTilt?: number; // radians — how far the cat turns to face the cursor
  floatAmplitude?: number; // how far it drifts, position-wise
  floatSpeed?: number; // how fast the idle drift cycles
};

function Model({
  url,
  scale = 1,
  proximityRadius = 220,
  maxTilt = 0.5,
  floatAmplitude = 0.08,
  floatSpeed = 0.6,
}: FloatingCatProps) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(url);

  const mouse = useRef({ x: -9999, y: -9999 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();

    // --- Idle "balloon tied up, drifting in the wind" ---
    // Layered sine waves at slightly mismatched frequencies avoid a
    // robotic, perfectly-looping drift — reads more like something
    // tethered and gently pushed by shifting air currents. This is
    // ALWAYS running, completely independent of the cursor.
    const floatY =
      Math.sin(t * floatSpeed) * floatAmplitude +
      Math.sin(t * floatSpeed * 1.7 + 1.3) * floatAmplitude * 0.4;
    const floatX = Math.sin(t * floatSpeed * 0.8 + 2.1) * floatAmplitude * 0.5;
    const idleTiltY = Math.sin(t * floatSpeed * 0.6) * 0.06;
    const idleTiltX = Math.sin(t * floatSpeed * 0.9 + 0.7) * 0.03;

    // Position is anchored to this drift only — the cursor never moves it
    group.current.position.y = floatY;
    group.current.position.x = floatX;

    // --- Proximity check: screen-space distance from the model's
    // on-screen center to the cursor, measured off the canvas itself so
    // it stays correct through scrolling/resizing ---
    const canvasEl = state.gl.domElement;
    const rect = canvasEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = mouse.current.x - centerX;
    const dy = mouse.current.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const inRange = dist < proximityRadius;

    if (inRange) {
      // Direction toward the cursor, normalized and capped at maxTilt —
      // this is the "face turns toward you" behavior
      const nx = Math.max(-1, Math.min(1, dx / proximityRadius));
      const ny = Math.max(-1, Math.min(1, dy / proximityRadius));
      targetRotation.current.y = nx * maxTilt;
      targetRotation.current.x = ny * maxTilt * 0.6;
    } else {
      // Outside the radius: revert toward the gentle idle sway rather
      // than snapping to a hard 0,0 — keeps it feeling alive at rest too
      targetRotation.current.y = idleTiltY;
      targetRotation.current.x = idleTiltX;
    }

    // Ease toward the target every frame — this is what makes both the
    // "look at cursor" and "revert to resting" transitions feel weighted
    // and smooth rather than snapping instantly
    const ease = inRange ? 0.08 : 0.05;
    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * ease;
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * ease;

    group.current.rotation.x = currentRotation.current.x;
    group.current.rotation.y = currentRotation.current.y;
  });

  return (
    <group ref={group}>
      <Center>
        <primitive object={scene} scale={scale} />
      </Center>
    </group>
  );
}

export default function FloatingCat(props: FloatingCatProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []); // avoids SSR mismatch, WebGL is client-only

  if (!ready) return null;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 1, 3], fov: 40 }} gl={{ toneMappingExposure: 1.3 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 4, 5]} intensity={1.5} />
        <directionalLight position={[-3, 2, -4]} intensity={0.6} />
        <Environment preset="city" />
        <Bounds fit clip observe margin={2.2}>
          <Model {...props} />
        </Bounds>
      </Canvas>
    </div>
  );
}