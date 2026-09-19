"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, setConsoleFunction, ShaderMaterial, Vector2 } from "three";

// @react-three/fiber 9.x still creates a THREE.Clock, which three r183+ warns about.
setConsoleFunction((type, message, ...params) => {
  if (type === "warn" && message.startsWith("THREE.Clock:")) return;
  console[type](message, ...params);
});

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
varying vec2 vUv;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

const float ZOOM = 2.0;
const float WARP = 3.5;
const float FLOW_SPEED = 0.25;

const float MOUSE_FALLOFF = 15.0;
const float MOUSE_PUSH = 0.03;
const float MOUSE_CUTOFF_START = 0.12;
const float MOUSE_CUTOFF_END = 0.22;

const float NORMAL_STEP = 0.004;
const float BUMP = 0.34;
const float SHININESS = 40.0;
const float GLOSS = 1.8;

const vec3 DEEP = vec3(0.030, 0.034, 0.044);
const vec3 BODY = vec3(0.040, 0.046, 0.054);
const vec3 SHEEN = vec3(0.13, 0.20, 0.24);
const vec3 REFLECTION = vec3(0.15, 0.22, 0.26);

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    mat2 rotate = mat2(0.8, 0.6, -0.6, 0.8);

    for (int i = 0; i < 3; i++) {
        value += amplitude * noise(p);
        p = rotate * p * 2.02;
        amplitude *= 0.5;
    }

    return value;
}

float liquid(vec2 p, float t) {
    vec2 q = vec2(
        fbm(p + vec2(0.0, t)),
        fbm(p + vec2(5.2, 1.3) - t * 0.8)
    );

    vec2 r = vec2(
        fbm(p + WARP * q + vec2(1.7, 9.2) + t * 0.5),
        fbm(p + WARP * q + vec2(8.3, 2.8) - t * 0.4)
    );

    return fbm(p + WARP * r);
}

void main() {
    vec2 aspectScale = vec2(u_resolution.x / u_resolution.y, 1.0);

    vec2 uv = (gl_FragCoord.xy / u_resolution) * aspectScale;
    vec2 mouse = (u_mouse * 0.5 + 0.5) * aspectScale;

    vec2 toMouse = mouse - uv;
    float distanceToMouse = length(toMouse);
    vec2 direction = toMouse / max(distanceToMouse, 1e-4);

    float falloff = exp(-distanceToMouse * MOUSE_FALLOFF);
    float shape = distanceToMouse * MOUSE_FALLOFF * 2.71828
        * (1.0 - smoothstep(MOUSE_CUTOFF_START, MOUSE_CUTOFF_END, distanceToMouse));
    uv += direction * falloff * shape * MOUSE_PUSH;

    vec2 p = uv * ZOOM;
    float t = u_time * FLOW_SPEED;

    float n = liquid(p, t);
    float nx = liquid(p + vec2(NORMAL_STEP, 0.0), t);
    float ny = liquid(p + vec2(0.0, NORMAL_STEP), t);

    vec3 normal = normalize(vec3(
        -(nx - n) / NORMAL_STEP * BUMP,
        -(ny - n) / NORMAL_STEP * BUMP,
        1.0
    ));

    vec3 light = normalize(vec3(-0.5, 0.7, 0.45));
    vec3 halfway = normalize(light + vec3(0.0, 0.0, 1.0));

    float specular = pow(max(dot(normal, halfway), 0.0), SHININESS);
    float rim = pow(1.0 - normal.z, 3.0);

    float diffuse = max(dot(normal, light), 0.0);

    vec3 reflected = reflect(vec3(0.0, 0.0, -1.0), normal);
    float reflection = pow(max(dot(reflected, light), 0.0), GLOSS);

    float metal = specular + rim * 0.3;
    metal = pow(clamp(metal, 0.0, 1.0), 1.2);

    gl_FragColor = vec4(DEEP + BODY * diffuse + REFLECTION * reflection + SHEEN * metal, 1.0);
}
`;

type FluidUniforms = {
  u_time: { value: number };
  u_resolution: { value: Vector2 };
  u_mouse: { value: Vector2 };
};

type PointerTarget = { x: number; y: number; active: boolean };

// Overall speed of the fluid. Lower is slower.
const TIME_SCALE = 0.4;

// How fast the ripple catches up to the real cursor, per frame. The liquid is
// heavy, so the disturbance lags behind the pointer and drags a trail after it.
// Lower is thicker.
const POINTER_DAMPING = 0.05;

// Parks the ripple far off-canvas until the pointer first moves, so the page
// doesn't load with a dent in the middle of the screen.
const OFFSCREEN = 10;

function FluidPlane({ pointer }: { pointer: React.RefObject<PointerTarget> }) {
  const materialRef = useRef<ShaderMaterial>(null);
  const snapped = useRef(false);

  const { size, viewport } = useThree();

  const uniforms = useMemo<FluidUniforms>(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new Vector2(1, 1) },
      u_mouse: { value: new Vector2(OFFSCREEN, OFFSCREEN) },
    }),
    [],
  );

  useFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) return;

    const u = material.uniforms as FluidUniforms;

    u.u_time.value = clock.getElapsedTime() * TIME_SCALE;
    u.u_resolution.value.set(size.width * viewport.dpr, size.height * viewport.dpr);

    const target = pointer.current;
    if (!target?.active) return;

    if (!snapped.current) {
      u.u_mouse.value.set(target.x, target.y);
      snapped.current = true;
      return;
    }

    u.u_mouse.value.x = MathUtils.lerp(u.u_mouse.value.x, target.x, POINTER_DAMPING);
    u.u_mouse.value.y = MathUtils.lerp(u.u_mouse.value.y, target.y, POINTER_DAMPING);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function HeroCanvas({ className = "" }: { className?: string }) {
  const pointer = useRef<PointerTarget>({ x: OFFSCREEN, y: OFFSCREEN, active: false });

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      pointer.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -((event.clientY / window.innerHeight) * 2 - 1),
        active: true,
      };
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <div aria-hidden className={className}>
      <Canvas
        gl={{ antialias: false, alpha: false }}
        dpr={[1, 2]}
      >
        <FluidPlane pointer={pointer} />
      </Canvas>
    </div>
  );
}

const HeroCanvasNoSSR = dynamic(() => Promise.resolve(HeroCanvas), {
  ssr: false,
});

export function HeroBackground({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`${className} bg-[#050505]`}>
      <HeroCanvasNoSSR className="absolute inset-0" />
    </div>
  );
}
