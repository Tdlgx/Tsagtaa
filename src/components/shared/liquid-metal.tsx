"use client";

import { useEffect, useRef, type JSX } from "react";

import { cn } from "@/lib/utils";

export type LiquidMetalProps = {
  /** Reflection tint ramp, dark to light: the first stains the deep pools, the last tints the bright bands. */
  colors?: readonly string[];
  /** What the dark pools sink into; match the surface behind so the metal melts into the edges. */
  bg?: string;
  /** 1 = solid metal sheet, 0 = only the bright metal renders and the page shows through the pools. */
  bgAlpha?: number;
  /** 0.05–2. Lower = slow, expensive molten drift; higher = lively quicksilver. */
  speed?: number;
  /** 0.5–4. Lower = a few huge blobs; higher = many small ripples. */
  scale?: number;
  /** 0–1. Higher = heavy slow mercury with smooth blobs; lower = runny metal with fine ripples. */
  viscosity?: number;
  /** 0–2.5. Hot white light pings on the curvature peaks; 0 = matte satin. */
  specular?: number;
  /** 0.5–2.2. Higher = hard graphic chrome stripes; lower = soft pewter sheen. */
  contrast?: number;
  /** 0–360°. Direction the metal streams: 0 = horizontal drift, 90 = rising columns. */
  flowAngle?: number;
  /** 0.2–2.5. Surface depth: higher = deep churning waves, lower = a near-flat satin sheet. */
  relief?: number;
  /** 0–1. Animated film grain; also hides gradient banding. */
  grain?: number;
  /** 0–1. How hard the pointer dents the metal (a dip, a raised rim, slow ripple rings); 0 = off. */
  mouse?: number;
  /** Fraction of the screen's pixel density to render at; lower is faster and softer. */
  quality?: number;
  className?: string;
};

/* Shaders ------------------------------------------------------------------- */

const VERTEX = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uC0, uC1, uC2, uC3, uC4, uBg;
uniform float uBgAlpha, uScale, uDetail, uSpecular, uContrast, uRelief, uGrain;
uniform vec2 uFlow;     // cos, sin of the flow angle
uniform vec3 uPointer;  // xy in surface space, z = how deep the dent is (0..1)
uniform vec2 uRipple;   // x = seconds since the rings started, y = their strength

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Gradient noise, roughly -0.7..0.7.
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i), f), dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash2(i + vec2(1.0)), f - vec2(1.0)), u.x),
    u.y
  );
}

// Four octaves; uDetail (from viscosity) sets how much fine ripple survives.
float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 turn = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    value += amp * noise(p);
    p = turn * p;
    amp *= uDetail;
  }
  return value;
}

// Height of the metal at a point: domain-warped noise, stretched and drifting along the flow.
float surface(vec2 uv) {
  vec2 p = vec2(dot(uv, uFlow), dot(uv, vec2(-uFlow.y, uFlow.x))) * uScale;
  p.x *= 0.55;
  float t = uTime;
  p.x -= t * 0.35;
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.21)), fbm(p + vec2(5.2, 1.3) - vec2(0.0, t * 0.17)));
  vec2 r = vec2(
    fbm(p + 1.1 * q + vec2(1.7, 9.2) + t * 0.12),
    fbm(p + 1.1 * q + vec2(8.3, 2.8) - t * 0.10)
  );
  float h = fbm(p + 1.2 * r);

  // The pointer presses a soft dip with a raised meniscus rim around it…
  vec2 toPointer = uv - uPointer.xy;
  float d = length(toPointer);
  h += uPointer.z * (-0.09 * exp(-d * d / 0.008) + 0.045 * exp(-pow((d - 0.11) / 0.035, 2.0)));
  // …and one or two slow rings radiate out from it.
  h += uRipple.y * 0.012 * sin(d * 18.0 - uRipple.x * 3.5) * exp(-d * 6.0) * smoothstep(0.0, 0.06, d);
  return h;
}

vec3 ramp(float x) {
  x = clamp(x, 0.0, 1.0) * 4.0;
  if (x < 1.0) return mix(uC0, uC1, x);
  if (x < 2.0) return mix(uC1, uC2, x - 1.0);
  if (x < 3.0) return mix(uC2, uC3, x - 2.0);
  return mix(uC3, uC4, x - 3.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float e = 1.5 / uRes.y;
  float h = surface(uv);
  float hx = surface(uv + vec2(e, 0.0));
  float hy = surface(uv + vec2(0.0, e));
  float tilt = 0.3 * uRelief;
  vec3 n = normalize(vec3((h - hx) / e * tilt, (h - hy) / e * tilt, 1.0));

  // Chrome = a studio environment reflected in a curved mirror: stretched light/dark bands.
  vec3 refl = reflect(vec3(0.0, 0.0, -1.0), n);
  float band = (refl.y * 1.4 + refl.x * 0.6) * 4.5 + h * 1.4;
  float shade = 0.5 + 0.5 * sin(band * 2.8);
  shade = smoothstep(0.12, 0.88, shade); // crisp chrome edges between the bands
  shade = clamp((shade - 0.5) * uContrast + 0.5, 0.0, 1.0);
  vec3 color = ramp(shade);

  // Low ground is a pool; the metal darkens as it curls down into it.
  float metal = smoothstep(-0.13, -0.09, h);
  color *= mix(0.4, 1.0, smoothstep(-0.11, -0.06, h));

  vec3 light = normalize(vec3(-0.35, 0.55, 0.75));
  float spec = pow(max(dot(refl, light), 0.0), 60.0) * uSpecular;
  color += spec * mix(vec3(1.0), uC4, 0.35) * metal;

  color = mix(uBg, color, metal);
  float alpha = mix(uBgAlpha, 1.0, metal);

  float grain = fract(sin(dot(gl_FragCoord.xy + uTime * 61.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  color += grain * uGrain * 0.06;

  gl_FragColor = vec4(color * alpha, alpha);
}
`;

/* Helpers ------------------------------------------------------------------- */

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  const number = Number.parseInt(full, 16);
  return [((number >> 16) & 255) / 255, ((number >> 8) & 255) / 255, (number & 255) / 255];
}

/** Any number of colors → exactly the 5 stops the shader blends between. */
function toFiveStops(colors: readonly string[]): [number, number, number][] {
  const rgb = (colors.length > 0 ? colors : ["#000000", "#ffffff"]).map(hexToRgb);
  return Array.from({ length: 5 }, (_, i) => {
    const at = (i / 4) * (rgb.length - 1);
    const low = rgb[Math.floor(at)] ?? rgb[0]!;
    const high = rgb[Math.ceil(at)] ?? low;
    const mix = at - Math.floor(at);
    return [0, 1, 2].map((c) => low[c]! + (high[c]! - low[c]!) * mix) as [number, number, number];
  });
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const DEFAULTS: Required<Omit<LiquidMetalProps, "className">> = {
  colors: ["#0b0c0f", "#1c2409", "#6f8c12", "#c2f41e", "#ecffb8"],
  bg: "#0b0c0f",
  bgAlpha: 1,
  speed: 0.35,
  scale: 0.9,
  viscosity: 0.6,
  specular: 1.2,
  contrast: 1.3,
  flowAngle: 25,
  relief: 1.1,
  grain: 0.35,
  mouse: 0.8,
  quality: 0.75,
};

type Params = Required<Omit<LiquidMetalProps, "className">>;

/**
 * Molten chrome surface (WebGL). It drifts on its own; the pointer dents it
 * with a soft dip, a raised rim and slow rings, and it relaxes a couple of
 * seconds after the pointer rests. Fills its positioned parent and listens
 * for the pointer on that parent, so the content on top stays clickable.
 * Pauses off screen and in background tabs; "reduce motion" gets one still
 * frame. Without WebGL the parent's own background shows.
 */
export function LiquidMetal({ className, ...props }: LiquidMetalProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<Params>({ ...DEFAULTS, ...props });

  // The animation loop reads the latest props from here every frame.
  useEffect(() => {
    paramsRef.current = { ...DEFAULTS, ...props };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    // One triangle that covers the whole canvas.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const names = [
      "uRes",
      "uTime",
      "uC0",
      "uC1",
      "uC2",
      "uC3",
      "uC4",
      "uBg",
      "uBgAlpha",
      "uScale",
      "uDetail",
      "uSpecular",
      "uContrast",
      "uRelief",
      "uGrain",
      "uFlow",
      "uPointer",
      "uRipple",
    ] as const;
    const u = Object.fromEntries(
      names.map((name) => [name, gl.getUniformLocation(program, name)]),
    ) as Record<(typeof names)[number], WebGLUniformLocation | null>;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Size the drawing buffer to the element, at a fraction of the pixel density.
    const resize = (): void => {
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * paramsRef.current.quality;
      const width = Math.max(1, Math.round(host.clientWidth * scale));
      const height = Math.max(1, Math.round(host.clientHeight * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };
    resize();

    // Pointer: where it is (eased), how deep the dent is, and the ring clock.
    const pointer = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      press: 0,
      lastMove: -1e9,
      rippleStart: -1e9,
    };
    const toSurface = (event: PointerEvent): [number, number] => {
      const rect = host.getBoundingClientRect();
      return [
        (event.clientX - rect.left - rect.width / 2) / rect.height,
        (rect.height / 2 - (event.clientY - rect.top)) / rect.height,
      ];
    };
    const onMove = (event: PointerEvent): void => {
      const now = performance.now();
      const [x, y] = toSurface(event);
      if (pointer.press < 0.05) {
        // A fresh touch: start where the pointer is, not where it last left.
        pointer.x = x;
        pointer.y = y;
        pointer.rippleStart = now;
      }
      pointer.targetX = x;
      pointer.targetY = y;
      pointer.lastMove = now;
    };
    const onDown = (event: PointerEvent): void => {
      onMove(event);
      pointer.rippleStart = performance.now();
    };
    const onLeave = (): void => {
      pointer.lastMove = -1e9;
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointerleave", onLeave);

    let visible = true;
    let frame = 0;
    let last = performance.now();
    let time = 7.3; // start mid-flow, not from a blank first frame

    const draw = (now: number): void => {
      const p = paramsRef.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Thick metal also moves slower.
      time += dt * p.speed * (1.25 - 0.6 * p.viscosity);

      // Dent eases in while the pointer moves, relaxes ~2 s after it rests.
      const active = now - pointer.lastMove < 1200;
      pointer.press += ((active ? 1 : 0) - pointer.press) * (active ? 0.08 : 0.025);
      pointer.x += (pointer.targetX - pointer.x) * 0.12;
      pointer.y += (pointer.targetY - pointer.y) * 0.12;
      const rippleT = (now - pointer.rippleStart) / 1000;
      const rippleStrength = p.mouse * Math.exp(-rippleT * 0.45) * Math.min(1, pointer.press * 2);

      resize();
      const stops = toFiveStops(p.colors);
      const angle = (p.flowAngle * Math.PI) / 180;
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, time);
      [u.uC0, u.uC1, u.uC2, u.uC3, u.uC4].forEach((loc, i) => gl.uniform3fv(loc, stops[i]!));
      gl.uniform3fv(u.uBg, hexToRgb(p.bg));
      gl.uniform1f(u.uBgAlpha, p.bgAlpha);
      gl.uniform1f(u.uScale, p.scale);
      gl.uniform1f(u.uDetail, 0.52 - 0.24 * p.viscosity);
      gl.uniform1f(u.uSpecular, p.specular);
      gl.uniform1f(u.uContrast, p.contrast);
      gl.uniform1f(u.uRelief, p.relief);
      gl.uniform1f(u.uGrain, p.grain);
      gl.uniform2f(u.uFlow, Math.cos(angle), Math.sin(angle));
      gl.uniform3f(u.uPointer, pointer.x, pointer.y, reduceMotion ? 0 : pointer.press * p.mouse);
      gl.uniform2f(u.uRipple, rippleT, reduceMotion ? 0 : rippleStrength);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number): void => {
      draw(now);
      frame = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const start = (): void => {
      if (frame || reduceMotion) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };

    // Run only while on screen and in the foreground tab.
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
    });
    observer.observe(host);
    const onVisibility = (): void => {
      if (!document.hidden && visible) start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const resizeObserver = new ResizeObserver(() => {
      if (reduceMotion) draw(performance.now());
    });
    resizeObserver.observe(host);

    if (reduceMotion) draw(performance.now());
    else start();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerleave", onLeave);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    />
  );
}
