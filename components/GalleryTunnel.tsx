// Gallery Tunnel (background variant) — stripped down from Originkit's
// original: no images, no color slabs, no pointer-press boost, no label.
// Just the wireframe grid, scrolling forward on its own, forever.
"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import * as THREE from "three";

const DEFAULTS = {
    background: "#000000",
    lineColor: "#B0B0B0",
    lineOpacity: 50,
    grid: 4,
    speed: 26,
    fade: 100,
    tiltStrength: 0.15,
};

const TUNNEL_WIDTH = 2;
const TUNNEL_HEIGHT = 1.8;
const SEGMENT_DEPTH = 1;
const NUM_SEGMENTS = 15;
const LINE_RADIUS = 0.003;
const SCROLL_TO_Z = 0.05;
const CAMERA_CHASE = 0.1;

const FOG_FAR = NUM_SEGMENTS * SEGMENT_DEPTH * 0.95;
const TUNNEL_SPAN = NUM_SEGMENTS * SEGMENT_DEPTH; // full loop distance a character travels before recycling

type GalleryTunnelProps = {
    background?: string;
    lineColor?: string;
    lineOpacity?: number;
    grid?: number;
    speed?: number;
    fade?: number;
    tiltStrength?: number;
    characterImageUrl?: string; // fallback: static image, same slot as characterVideoUrl
    characterVideoUrl?: string; // looping video (e.g. .mp4/.mov/.webm) — takes priority over characterImageUrl if both given
    characterChromaKey?: boolean; // true = key out a solid background color via shader (for videos without real alpha). false = use the video's native alpha channel directly (e.g. a WebM exported with true transparency)
    characterChromaKeyColor?: string; // only used when characterChromaKey is true
    characterChromaKeyThreshold?: number; // 0–1, only used when characterChromaKey is true
    characterChromaKeySmoothing?: number; // 0–1, only used when characterChromaKey is true
    characterWidth?: number; // world units — controls on-screen size
    characterOffsetX?: number; // -1 (left wall) to 1 (right wall) — where across the floor it sits
    characterTrimSeconds?: number; // if the video is longer than you want, loop only its first N seconds
    characterImageUrl2?: string; // second character, e.g. standing figure
    characterVideoUrl2?: string; // second character as a looping video instead
    characterChromaKey2?: boolean;
    characterChromaKeyColor2?: string;
    characterChromaKeyThreshold2?: number;
    characterChromaKeySmoothing2?: number;
    characterWidth2?: number;
    characterOffsetX2?: number;
    characterDelaySeconds2?: number; // how many seconds behind the first character it trails
    characterTrimSeconds2?: number; // loop only the first N seconds of this video
    characterRepeat?: number; // how many evenly-spaced copies of EACH character to spawn — 1 (default) is the original single-copy behavior; higher values close the gap between reappearances
    style?: CSSProperties;
};

export default function GalleryTunnel(props: GalleryTunnelProps) {
    const {
        background = DEFAULTS.background,
        lineColor = DEFAULTS.lineColor,
        lineOpacity = DEFAULTS.lineOpacity,
        grid = DEFAULTS.grid,
        speed = DEFAULTS.speed,
        fade = DEFAULTS.fade,
        tiltStrength = DEFAULTS.tiltStrength,
        characterImageUrl,
        characterVideoUrl,
        characterChromaKey = false,
        characterChromaKeyColor = "#000000",
        characterChromaKeyThreshold = 0.25,
        characterChromaKeySmoothing = 0.1,
        characterWidth = 0.9,
        characterOffsetX = 0.65,
        characterTrimSeconds,
        characterImageUrl2,
        characterVideoUrl2,
        characterChromaKey2 = false,
        characterChromaKeyColor2 = "#000000",
        characterChromaKeyThreshold2 = 0.25,
        characterChromaKeySmoothing2 = 0.1,
        characterWidth2 = 0.9,
        characterOffsetX2 = -0.65,
        characterDelaySeconds2 = 2,
        characterTrimSeconds2,
        characterRepeat = 1,
        style,
    } = props;

    const frameRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const frame = frameRef.current;
        const canvas = canvasRef.current;
        if (!frame || !canvas) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(background);

        const fogNear = Math.min(
            FOG_FAR * (1 - Math.min(100, Math.max(0, fade)) / 100),
            FOG_FAR - 0.01
        );
        scene.fog = new THREE.Fog(new THREE.Color(background), fogNear, FOG_FAR);

        const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
        camera.position.set(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        const lineMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(lineColor),
            transparent: true,
            opacity: Math.min(100, Math.max(0, lineOpacity)) / 100,
        });

        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin("anonymous");
        const fading: THREE.MeshBasicMaterial[] = [];
        const fadingShaders: THREE.ShaderMaterial[] = []; // chroma-key materials fade via a uniform, not .opacity
        const FADE_IN = 0.6; // seconds for the character to fade in once its texture loads

        let scrollPos = 0;
        let raf = 0;
        let alive = true;

        // Cursor-tied parallax: mouse position (normalized -1..1 from
        // screen center) drives a target camera rotation, smoothed each
        // frame so the tilt eases in/out rather than snapping.
        let targetTiltX = 0;
        let targetTiltY = 0;
        const maxTilt = Math.max(0, tiltStrength);

        const onPointerMove = (e: PointerEvent) => {
            const nx = (e.clientX / window.innerWidth) * 2 - 1; // -1 (left) to 1 (right)
            const ny = (e.clientY / window.innerHeight) * 2 - 1; // -1 (top) to 1 (bottom)
            targetTiltY = nx * maxTilt; // moving cursor right/left → camera yaws right/left
            targetTiltX = -ny * maxTilt; // moving cursor down/up → camera pitches down/up
        };
        // Listened on window, not the canvas, since this element sits behind
        // everything with pointer-events: none — window-level listeners
        // still fire regardless of CSS pointer-events on the target.
        window.addEventListener("pointermove", onPointerMove, { passive: true });

        const hw = TUNNEL_WIDTH / 2;
        const hh = TUNNEL_HEIGHT / 2;

        const cols = Math.max(1, Math.round(grid));
        const rows = Math.max(1, Math.round(grid));
        const colW = TUNNEL_WIDTH / cols;
        const rowH = TUNNEL_HEIGHT / rows;

        // Only the line geometries survive from the original — no floor/wall
        // slab planes, since there's nothing being drawn on them anymore.
        const geoTubeZ = new THREE.TubeGeometry(
            new THREE.LineCurve3(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, -SEGMENT_DEPTH)
            ),
            1,
            LINE_RADIUS,
            8
        );
        const geoTubeX = new THREE.TubeGeometry(
            new THREE.LineCurve3(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(TUNNEL_WIDTH, 0, 0)
            ),
            1,
            LINE_RADIUS,
            8
        );
        const geoTubeY = new THREE.TubeGeometry(
            new THREE.LineCurve3(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, TUNNEL_HEIGHT, 0)
            ),
            1,
            LINE_RADIUS,
            8
        );

        const tube = (
            geo: THREE.BufferGeometry,
            x: number,
            y: number,
            z = 0
        ) => {
            const m = new THREE.Mesh(geo, lineMaterial);
            m.position.set(x, y, z);
            return m;
        };

        function createSegment(z: number) {
            const group = new THREE.Group();
            group.position.z = z;

            for (let i = 0; i <= cols; i++) {
                const x = -hw + i * colW;
                group.add(tube(geoTubeZ, x, -hh));
                group.add(tube(geoTubeZ, x, hh));
            }
            for (let i = 1; i < rows; i++) {
                const y = -hh + i * rowH;
                group.add(tube(geoTubeZ, -hw, y));
                group.add(tube(geoTubeZ, hw, y));
            }
            group.add(tube(geoTubeX, -hw, -hh));
            group.add(tube(geoTubeX, -hw, hh));
            group.add(tube(geoTubeY, -hw, -hh));
            group.add(tube(geoTubeY, hw, -hh));

            return group;
        }

        const segments: THREE.Group[] = [];
        for (let i = 0; i < NUM_SEGMENTS; i++) {
            const g = createSegment(-i * SEGMENT_DEPTH);
            scene.add(g);
            segments.push(g);
        }

        // --- Character sprites: flat planes on the tunnel floor, textured
        // with your images. Each rides the same forward-motion illusion as
        // the floor segments — as the camera advances, it appears to
        // recede into the distance, then loops back around exactly like
        // a segment does, via the same recycling check used below.
        //
        // "Arrives N seconds behind" is done by starting that character's
        // z position further back (more negative) than the first, by the
        // distance the tunnel covers in N seconds at the current speed.
        const approxUnitsPerSecond = SCROLL_TO_Z * (Math.max(0, speed) / 100) * 60; // ~60fps baseline

        function createCharacter(
            imageUrl: string,
            offsetX: number,
            width: number,
            startZ: number
        ): THREE.Mesh {
            const material = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
                depthWrite: false, // avoids a transparent-PNG edge artifact against the floor lines behind it
            });
            const geo = new THREE.PlaneGeometry(1, 1);
            const mesh = new THREE.Mesh(geo, material);
            // Sitting on the floor (-hh) until the texture loads and we
            // know its real height to re-anchor precisely
            mesh.position.set(hw * offsetX, -hh, startZ);
            scene.add(mesh);

            loader.load(imageUrl, (tex) => {
                if (!alive) {
                    tex.dispose();
                    return;
                }
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.minFilter = THREE.LinearFilter;
                tex.generateMipmaps = false;
                material.map = tex;
                material.needsUpdate = true;

                // Size the plane to match the image's real aspect ratio,
                // so the character doesn't look stretched/squashed
                const aspect = tex.image.width / tex.image.height;
                const h = width / aspect;
                mesh.scale.set(width, h, 1);
                // Re-anchor vertically so the BOTTOM of the image sits on
                // the floor, not its center (PlaneGeometry is centered by
                // default)
                mesh.position.y = -hh + h / 2;

                fading.push(material); // reuses the fade-in mechanism below
            });

            return mesh;
        }

        // Same idea as createCharacter, but driven by a looping HTML5
        // <video> element instead of a static image — THREE.VideoTexture
        // automatically pulls the current video frame each render, so no
        // manual per-frame texture update is needed.
        const videoElements: HTMLVideoElement[] = [];

        function createVideoCharacter(
            videoUrl: string,
            offsetX: number,
            width: number,
            startZ: number,
            useChromaKey: boolean,
            keyColorHex: string,
            keyThreshold: number,
            keySmoothing: number,
            trimSeconds?: number
        ): THREE.Mesh {
            const video = document.createElement("video");
            video.src = videoUrl;
            // When trimming to a shorter duration than the file's actual
            // length, native `loop` would eventually replay the untrimmed
            // tail too — so looping is handled manually via `timeupdate`
            // instead, and native loop is turned off.
            video.loop = trimSeconds ? false : true;
            video.muted = true; // required for autoplay in every major browser
            video.playsInline = true;
            video.autoplay = true;
            video.crossOrigin = "anonymous";
            videoElements.push(video);

            if (trimSeconds) {
                const onTimeUpdate = () => {
                    if (video.currentTime >= trimSeconds) {
                        video.currentTime = 0;
                        video.play().catch(() => {});
                    }
                };
                video.addEventListener("timeupdate", onTimeUpdate);
            }

            const texture = new THREE.VideoTexture(video);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;

            let material: THREE.MeshBasicMaterial | THREE.ShaderMaterial;

            if (useChromaKey) {
                // No real alpha in the video — key out a solid background
                // color via shader, like a green-screen done at render
                // time instead of in the video file itself.
                const keyColor = new THREE.Color(keyColorHex);
                material = new THREE.ShaderMaterial({
                    uniforms: {
                        map: { value: texture },
                        keyColor: { value: keyColor },
                        threshold: { value: keyThreshold },
                        smoothing: { value: keySmoothing },
                        opacity: { value: 0 },
                    },
                    vertexShader: `
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform sampler2D map;
                        uniform vec3 keyColor;
                        uniform float threshold;
                        uniform float smoothing;
                        uniform float opacity;
                        varying vec2 vUv;
                        void main() {
                            vec4 texColor = texture2D(map, vUv);
                            float dist = distance(texColor.rgb, keyColor);
                            float alpha = smoothstep(threshold, threshold + smoothing, dist);
                            gl_FragColor = vec4(texColor.rgb, alpha * opacity);
                        }
                    `,
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                });
            } else {
                // The video already has a real alpha channel (e.g. WebM
                // exported with transparency) — just display it directly,
                // no keying needed.
                material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                });
            }

            const geo = new THREE.PlaneGeometry(1, 1);
            const mesh = new THREE.Mesh(geo, material);
            mesh.position.set(hw * offsetX, -hh, startZ);
            scene.add(mesh);

            const setupAspect = () => {
                if (!alive) return;
                const aspect = video.videoWidth / video.videoHeight;
                const h = width / aspect;
                mesh.scale.set(width, h, 1);
                mesh.position.y = -hh + h / 2;
                if (material instanceof THREE.ShaderMaterial) {
                    fadingShaders.push(material);
                } else {
                    fading.push(material);
                }
            };
            if (video.readyState >= 1) {
                setupAspect();
            } else {
                video.addEventListener("loadedmetadata", setupAspect, { once: true });
            }

            // Some browsers still require play() to be called explicitly
            // even with autoplay set — .catch() silences the (harmless)
            // console warning some browsers log when this races with the
            // metadata still loading.
            video.play().catch(() => {});

            return mesh;
        }

        const characters: THREE.Mesh[] = [];
        const repeatCount = Math.max(1, Math.round(characterRepeat));
        const repeatSpacing = TUNNEL_SPAN / repeatCount; // evenly spread across one full loop

        // Slot 1 — spawns `repeatCount` copies, each offset by one
        // repeat-spacing further back. All of them share the same
        // recycling rule later (jump forward by a full span once passed),
        // so more copies simply means a shorter wait between reappearances
        // of this character, not a different mechanism.
        if (characterVideoUrl) {
            for (let r = 0; r < repeatCount; r++) {
                characters.push(
                    createVideoCharacter(
                        characterVideoUrl,
                        characterOffsetX,
                        characterWidth,
                        -SEGMENT_DEPTH * 4 - r * repeatSpacing,
                        characterChromaKey,
                        characterChromaKeyColor,
                        characterChromaKeyThreshold,
                        characterChromaKeySmoothing,
                        characterTrimSeconds
                    )
                );
            }
        } else if (characterImageUrl) {
            for (let r = 0; r < repeatCount; r++) {
                characters.push(
                    createCharacter(
                        characterImageUrl,
                        characterOffsetX,
                        characterWidth,
                        -SEGMENT_DEPTH * 4 - r * repeatSpacing
                    )
                );
            }
        }

        // Slot 2 — starts further back by however far the tunnel covers
        // in characterDelaySeconds2, so it consistently arrives later.
        // Same repeat treatment as slot 1 above.
        if (characterVideoUrl2 || characterImageUrl2) {
            const delayOffset = approxUnitsPerSecond * characterDelaySeconds2;
            const startZ2 = -SEGMENT_DEPTH * 4 - delayOffset; // starts further back, so it takes longer to arrive

            if (characterVideoUrl2) {
                for (let r = 0; r < repeatCount; r++) {
                    characters.push(
                        createVideoCharacter(
                            characterVideoUrl2,
                            characterOffsetX2,
                            characterWidth2,
                            startZ2 - r * repeatSpacing,
                            characterChromaKey2,
                            characterChromaKeyColor2,
                            characterChromaKeyThreshold2,
                            characterChromaKeySmoothing2,
                            characterTrimSeconds2
                        )
                    );
                }
            } else if (characterImageUrl2) {
                for (let r = 0; r < repeatCount; r++) {
                    characters.push(
                        createCharacter(
                            characterImageUrl2,
                            characterOffsetX2,
                            characterWidth2,
                            startZ2 - r * repeatSpacing
                        )
                    );
                }
            }
        }

        const resize = () => {
            // frame.clientWidth/clientHeight measure the PRE-scale layout
            // size (149.25vw/vh from the page's scale-to-fit wrapper),
            // not what's actually visible on screen. Correcting by the
            // known 0.67 scale factor here gives the renderer a buffer
            // size matching the TRUE visible size — without this, the
            // buffer ends up ~1.5x oversized, which is what was causing
            // rendering to fail entirely on more complex scenes.
            const w = Math.max(1, frame.clientWidth * 0.67);
            const h = Math.max(1, frame.clientHeight * 0.67);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
        };
        const ro = new ResizeObserver(resize);
        ro.observe(frame);
        resize();

        const speedFactor = Math.max(0, speed) / 100;
        let last = 0;

        const animate = (now: number) => {
            if (!alive) return;
            raf = requestAnimationFrame(animate);
            const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
            last = now;

            scrollPos += speedFactor;

            const want = -SCROLL_TO_Z * scrollPos;
            camera.position.z += CAMERA_CHASE * (want - camera.position.z);

            // Ease the camera's rotation toward the cursor-driven target —
            // same lerp-toward-target pattern as the forward-motion chase
            // above, just applied to rotation instead of position.
            camera.rotation.x += CAMERA_CHASE * (targetTiltX - camera.rotation.x);
            camera.rotation.y += CAMERA_CHASE * (targetTiltY - camera.rotation.y);

            const span = NUM_SEGMENTS * SEGMENT_DEPTH;
            const z = camera.position.z;
            for (const seg of segments) {
                if (seg.position.z > z + SEGMENT_DEPTH) {
                    let min = 0;
                    for (const s of segments) min = Math.min(min, s.position.z);
                    seg.position.z = min - SEGMENT_DEPTH;
                } else if (seg.position.z < z - span - SEGMENT_DEPTH) {
                    let max = -999999;
                    for (const s of segments) max = Math.max(max, s.position.z);
                    seg.position.z = max + SEGMENT_DEPTH;
                }
            }

            // Each character loops through the same recycling rule as the
            // floor segments: once the camera has passed it, jump it a
            // full tunnel-span ahead so it recedes into the distance
            // and gradually approaches again — a continuous, seamless
            // loop synced to the exact same motion as the floor itself.
            for (const c of characters) {
                if (c.position.z > z + SEGMENT_DEPTH) {
                    c.position.z -= span;
                }
            }

            for (let i = fading.length - 1; i >= 0; i--) {
                const m = fading[i];
                m.opacity = Math.min(1, m.opacity + dt / FADE_IN);
                if (m.opacity >= 1) fading.splice(i, 1);
            }
            for (let i = fadingShaders.length - 1; i >= 0; i--) {
                const m = fadingShaders[i];
                m.uniforms.opacity.value = Math.min(1, m.uniforms.opacity.value + dt / FADE_IN);
                if (m.uniforms.opacity.value >= 1) fadingShaders.splice(i, 1);
            }

            renderer.render(scene, camera);
        };
        raf = requestAnimationFrame(animate);

        return () => {
            alive = false;
            cancelAnimationFrame(raf);
            ro.disconnect();
            window.removeEventListener("pointermove", onPointerMove);
            geoTubeZ.dispose();
            geoTubeX.dispose();
            geoTubeY.dispose();
            lineMaterial.dispose();
            for (const c of characters) {
                c.geometry.dispose();
                const mat = c.material as THREE.MeshBasicMaterial | THREE.ShaderMaterial;
                if (mat instanceof THREE.ShaderMaterial) {
                    (mat.uniforms.map?.value as THREE.Texture | undefined)?.dispose();
                } else {
                    mat.map?.dispose();
                }
                mat.dispose();
            }
            for (const v of videoElements) {
                v.pause();
                v.removeAttribute("src");
                v.load(); // releases the decoder/network resources
            }
            renderer.dispose();
        };
    }, [
        background,
        lineColor,
        lineOpacity,
        grid,
        speed,
        fade,
        tiltStrength,
        characterImageUrl,
        characterVideoUrl,
        characterChromaKey,
        characterChromaKeyColor,
        characterChromaKeyThreshold,
        characterChromaKeySmoothing,
        characterWidth,
        characterOffsetX,
        characterTrimSeconds,
        characterImageUrl2,
        characterVideoUrl2,
        characterChromaKey2,
        characterChromaKeyColor2,
        characterChromaKeyThreshold2,
        characterChromaKeySmoothing2,
        characterWidth2,
        characterOffsetX2,
        characterDelaySeconds2,
        characterTrimSeconds2,
        characterRepeat,
    ]);

    return (
        <div
            ref={frameRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100vw", height: "100vh", backgroundColor: background }}
            />
        </div>
    );
}