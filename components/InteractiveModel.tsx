'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Environment, Center, Bounds } from '@react-three/drei';
import type { Group } from 'three';

type InteractiveModelProps = {
  url: string;
  // Name of the animation clip to loop (e.g. "Walk", "Idle"). Leave
  // undefined for static objects like the headphones/vinyl that don't
  // have — or don't need — a baked-in animation.
  animationName?: string;
  scale?: number;
  position?: [number, number, number];
};

function Model({ url, animationName, scale = 1, position = [0, 0, 0] }: InteractiveModelProps) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);

  // Rotation is stored in a ref (not React state) so dragging updates
  // every frame without triggering a re-render — keeps it smooth.
  const rotation = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!animationName) return;
    const action = actions[animationName];
    if (!action) {
      // Helpful during setup: lists the actual clip names baked into
      // your .glb so you can copy the exact string into animationName.
      console.warn(
        `Animation "${animationName}" not found. Available clips:`,
        Object.keys(actions)
      );
      return;
    }
    action.reset().play(); // loops by default
    return () => {
      action.stop();
    };
  }, [actions, animationName]);

  useFrame(() => {
    if (group.current) {
      group.current.rotation.y = rotation.current.y;
      group.current.rotation.x = rotation.current.x;
    }
  });

  return (
    <group
      ref={group}
      position={position}
      onPointerDown={(e: any) => {
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        dragging.current = true;
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e: any) => {
        if (!dragging.current) return;
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;
        rotation.current.y += dx * 0.01;
        rotation.current.x += dy * 0.01;
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerOut={() => {
        dragging.current = false;
      }}
    >
      {/* Center re-anchors the model on its actual visual middle rather
          than whatever origin point it was exported with — without this,
          rotation swings around an off-center pivot and parts of the
          model swing outside the camera's view */}
      <Center>
        <primitive object={scene} scale={scale} />
      </Center>
    </group>
  );
}

export default function InteractiveModel(props: InteractiveModelProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []); // avoids SSR mismatch, WebGL is client-only

  if (!ready) return null;

  return (
    <div style={{ width: '100%', height: '100%', cursor: 'grab' }}>
      <Canvas
        camera={{ position: [0, 1, 3], fov: 40 }}
        gl={{ toneMappingExposure: 1.3 }}
      >
        {/* Brighter, more even lighting than a single dim directional light —
            closer to the fully-lit studio setup Neural4D's viewer uses */}
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 4, 5]} intensity={1.5} />
        <directionalLight position={[-3, 2, -4]} intensity={0.6} />
        {/* Environment provides realistic reflected/ambient light — without
            it, PBR materials (which most .glb exports use) can look flat
            and underlit even with strong direct lights */}
        <Environment preset="city" />
        {/* Bounds auto-fits the camera around the model's full bounding
            sphere with margin — since a bounding sphere doesn't change
            size as the model rotates, this guarantees it stays fully in
            frame at every angle, not just the front-facing pose */}
        <Bounds fit clip observe margin={1.4}>
          <Model {...props} />
        </Bounds>
      </Canvas>
    </div>
  );
}