// Spectral Veil - Signature GPU Canvas WGSL Shader for Midnight Haunt
// Layered procedural noise, slow-moving mist tendrils, violet & toxic-green energy

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

struct Uniforms {
    time: f32,
    intensity: f32,
    spectralEnergy: f32,
    reducedMode: f32,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@vertex
fn vs_main(@builtin(vertex_index) idx: u32) -> VertexOutput {
    var out: VertexOutput;
    // Generate full-screen triangle covering [-1, 1]
    let x = f32(i32(idx) * 2 - 1);
    let y = f32(i32(idx & 1u) * 4 - 1);
    out.position = vec4<f32>(x, y, 0.0, 1.0);
    out.uv = vec2<f32>(x * 0.5 + 0.5, 1.0 - (y * 0.5 + 0.5));
    return out;
}

// Procedural pseudo-random hash
fn hash2(p: vec2<f32>) -> f32 {
    let q = fract(p * vec2<f32>(123.34, 456.21));
    let d = dot(q, q + 45.32);
    return fract(d);
}

// 2D Value Noise
fn noise2(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);

    let a = hash2(i + vec2<f32>(0.0, 0.0));
    let b = hash2(i + vec2<f32>(1.0, 0.0));
    let c = hash2(i + vec2<f32>(0.0, 1.0));
    let d = hash2(i + vec2<f32>(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Fractal Brownian Motion (fBm) for organic drifting spectral mist
fn fbm(p: vec2<f32>, octaves: i32) -> f32 {
    var v = 0.0;
    var a = 0.5;
    var shift = vec2<f32>(100.0, 100.0);
    var pos = p;
    for (var i = 0; i < octaves; i = i + 1) {
        v = v + a * noise2(pos);
        pos = pos * 2.0 + shift;
        a = a * 0.5;
    }
    return v;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let uv = in.uv;
    let t = uniforms.time * 0.35;
    let intensity = uniforms.intensity;
    let energy = uniforms.spectralEnergy;

    // Distorted coordinates for supernatural wisp flow
    let q = vec2<f32>(
        fbm(uv + vec2<f32>(0.0, t * 0.15), 3),
        fbm(uv + vec2<f32>(t * 0.1, 0.0), 3)
    );

    let r = vec2<f32>(
        fbm(uv + 1.2 * q + vec2<f32>(1.7, 9.2) + 0.15 * t, 3),
        fbm(uv + 1.2 * q + vec2<f32>(8.3, 2.8) + 0.126 * t, 3)
    );

    let f = fbm(uv + r * 1.5, 4);

    // Color ramps:
    // Base Void: #08040B -> Crypt Mist: #170F24 -> Ghostlight: #9D4EDD -> Spectral Flame: #39FF14
    let colMist = vec3<f32>(0.09, 0.06, 0.14);   // Crypt Mist
    let colViolet = vec3<f32>(0.615, 0.306, 0.867); // Ghostlight Violet
    let colToxic = vec3<f32>(0.224, 1.0, 0.078);   // Spectral Flame Green

    var col = mix(colMist, colViolet, clamp(f * f * 2.5, 0.0, 1.0));
    // Accentuate high-energy ridges with toxic green
    let ridge = clamp(length(q) * f * energy, 0.0, 1.0);
    col = mix(col, colToxic, pow(ridge, 2.2) * 0.85);

    // Radial vignette / soft luminous edge
    let distFromCenter = distance(uv, vec2<f32>(0.5, 0.5));
    let alpha = smoothstep(0.7, 0.15, distFromCenter) * clamp(f * 1.4 * intensity, 0.0, 1.0);

    return vec4<f32>(col, alpha * 0.85);
}
