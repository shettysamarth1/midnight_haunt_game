-- The Hollow Warden Controller & Spectral Veil GPU Canvas Renderer
-- Implements the Rive Layout protocol, integrates the WGSL Spectral Veil shader,
-- and renders The Hollow Warden spectral character.

type WardenState = {
    canvas: GPUCanvas?,
    pipeline: GPUPipeline?,
    shader: Shader?,
    sampler: ImageSampler?,
    elapsed: number,
    state: string, -- Dormant, Watching, Curious, Threatening, Attacking, Defeated
    targetX: number,
    targetY: number,
    eyeX: number,
    eyeY: number,
    flare: number,
    size: Vector,
    bodyPaint: Paint,
    corePaint: Paint,
    eyePaint: Paint,
    glowPaint: Paint,
    path: Path,
}

function init(self: WardenState, context: Context): boolean
    -- 1. Initialize Rive GPU Canvas and WGSL Pipeline
    local shader = context:shader('spectral_veil')
    if shader ~= nil then
        self.shader = shader
        local canvas = context:gpuCanvas({ width = 500, height = 500 })
        if canvas ~= nil then
            self.canvas = canvas
            self.pipeline = GPUPipeline.new({
                vertex = shader,
                fragment = shader,
                vertexLayout = {},
                colorTargets = {{ format = canvas.format }}
            })
            self.sampler = ImageSampler('clamp', 'clamp', 'bilinear')
        end
    end

    -- 2. Setup 2D vector paints for the character
    self.bodyPaint = Paint.with({
        color = Color.rgb(157, 78, 221), -- Ghostlight violet
        style = 'fill',
    })
    self.corePaint = Paint.with({
        color = Color.rgb(224, 214, 230), -- Bone White core
        style = 'fill',
    })
    self.eyePaint = Paint.with({
        color = Color.rgb(57, 255, 20), -- Toxic Green spectral eyes
        style = 'fill',
    })
    self.glowPaint = Paint.with({
        color = Color.rgb(57, 255, 20),
        style = 'stroke',
        thickness = 3,
    })

    self.path = Path.new()
    return true
end

function resize(self: WardenState, size: Vector)
    self.size = size
    if self.canvas ~= nil and size.x > 0 and size.y > 0 then
        self.canvas:resize(math.floor(size.x), math.floor(size.y))
    end
end

function pointerMove(self: WardenState, event: PointerEvent)
    self.targetX = event.position.x
    self.targetY = event.position.y
    -- Shift to Curious / Watching when mouse tracks
    if self.state == 'Dormant' or self.state == 'Watching' then
        self.state = 'Curious'
    end
end

function pointerDown(self: WardenState, event: PointerEvent)
    -- Provoking the Warden triggers Threatening state flare
    self.state = 'Threatening'
    self.flare = 1.0
end

function advance(self: WardenState, seconds: number): boolean
    self.elapsed += seconds

    -- Smooth eye / head tracking
    local w = if self.size.x > 0 then self.size.x else 500
    local h = if self.size.y > 0 then self.size.y else 500
    local centerX = w * 0.5
    local centerY = h * 0.42

    local dx = (self.targetX - centerX) / (w * 0.5)
    local dy = (self.targetY - centerY) / (h * 0.5)

    -- Clamp tracking range
    local targetEyeX = math.clamp(dx * 16, -18, 18)
    local targetEyeY = math.clamp(dy * 14, -14, 14)

    local k = 1 - math.exp(-6 * seconds)
    self.eyeX += (targetEyeX - self.eyeX) * k
    self.eyeY += (targetEyeY - self.eyeY) * k

    -- Decay flare
    if self.flare > 0 then
        self.flare = math.max(0, self.flare - seconds * 1.5)
    end

    return true
end

function draw(self: WardenState, renderer: Renderer)
    local w = if self.size.x > 0 then self.size.x else 500
    local h = if self.size.y > 0 then self.size.y else 500

    -- 1. If GPU Canvas pipeline is ready, render the WGSL Spectral Veil background
    if self.canvas ~= nil and self.pipeline ~= nil and self.canvas.width > 0 then
        local pass = self.canvas:beginRenderPass({
            color = {{
                loadOp = 'clear',
                storeOp = 'store',
                clearColor = {0.03, 0.015, 0.045, 0.85} -- deep crypt mist
            }}
        })
        pass:setPipeline(self.pipeline)
        pass:draw(3, 1, 0)
        pass:finish()

        if self.sampler ~= nil then
            renderer:drawImage(self.canvas.image, self.sampler, 'srcOver', 1)
        end
    end

    -- 2. Render The Hollow Warden spectral character
    local cx = w * 0.5
    local cy = h * 0.42 + math.sin(self.elapsed * 2.2) * 8.0 -- floating levitation bob

    -- Spectral Outer Mantle (Floating Tendrils)
    self.path:reset()
    self.path:moveTo(Vector.xy(cx, cy - 90))
    self.path:cubicTo(
        Vector.xy(cx + 80, cy - 90),
        Vector.xy(cx + 95, cy + 20),
        Vector.xy(cx + 60, cy + 90 + math.sin(self.elapsed * 3.5) * 12)
    )
    self.path:cubicTo(
        Vector.xy(cx + 30, cy + 70),
        Vector.xy(cx + 10, cy + 110 + math.cos(self.elapsed * 4.0) * 14),
        Vector.xy(cx, cy + 75)
    )
    self.path:cubicTo(
        Vector.xy(cx - 10, cy + 110 + math.sin(self.elapsed * 4.2) * 14),
        Vector.xy(cx - 30, cy + 70),
        Vector.xy(cx - 60, cy + 90 + math.cos(self.elapsed * 3.7) * 12)
    )
    self.path:cubicTo(
        Vector.xy(cx - 95, cy + 20),
        Vector.xy(cx - 80, cy - 90),
        Vector.xy(cx, cy - 90)
    )
    self.path:close()
    renderer:drawPath(self.path, self.bodyPaint)

    -- Bone White Core Mask / Skull
    self.path:reset()
    self.path:moveTo(Vector.xy(cx, cy - 70))
    self.path:cubicTo(Vector.xy(cx + 45, cy - 70), Vector.xy(cx + 50, cy), Vector.xy(cx + 30, cy + 45))
    self.path:cubicTo(Vector.xy(cx + 15, cy + 55), Vector.xy(cx - 15, cy + 55), Vector.xy(cx - 30, cy + 45))
    self.path:cubicTo(Vector.xy(cx - 50, cy), Vector.xy(cx - 45, cy - 70), Vector.xy(cx, cy - 70))
    self.path:close()
    renderer:drawPath(self.path, self.corePaint)

    -- Glowing Toxic-Green Spectral Eyes (Track Pointer)
    local ex = self.eyeX
    local ey = self.eyeY
    local eyeRadius = 6.0 + self.flare * 3.0

    -- Left Eye
    self.path:reset()
    self.path:moveTo(Vector.xy(cx - 18 + ex - eyeRadius, cy - 15 + ey))
    self.path:lineTo(Vector.xy(cx - 18 + ex, cy - 15 + ey - eyeRadius * 1.3))
    self.path:lineTo(Vector.xy(cx - 18 + ex + eyeRadius, cy - 15 + ey))
    self.path:lineTo(Vector.xy(cx - 18 + ex, cy - 15 + ey + eyeRadius * 0.8))
    self.path:close()
    renderer:drawPath(self.path, self.eyePaint)

    -- Right Eye
    self.path:reset()
    self.path:moveTo(Vector.xy(cx + 18 + ex - eyeRadius, cy - 15 + ey))
    self.path:lineTo(Vector.xy(cx + 18 + ex, cy - 15 + ey - eyeRadius * 1.3))
    self.path:lineTo(Vector.xy(cx + 18 + ex + eyeRadius, cy - 15 + ey))
    self.path:lineTo(Vector.xy(cx + 18 + ex, cy - 15 + ey + eyeRadius * 0.8))
    self.path:close()
    renderer:drawPath(self.path, self.eyePaint)
end

return function(context: Context): Layout<WardenState>
    return {
        canvas = nil,
        pipeline = nil,
        shader = nil,
        sampler = nil,
        elapsed = 0,
        state = 'Watching',
        targetX = 250,
        targetY = 250,
        eyeX = 0,
        eyeY = 0,
        flare = 0,
        size = Vector.xy(500, 500),
        bodyPaint = Paint.new(),
        corePaint = Paint.new(),
        eyePaint = Paint.new(),
        glowPaint = Paint.new(),
        path = Path.new(),
        init = init,
        resize = resize,
        pointerMove = pointerMove,
        pointerDown = pointerDown,
        advance = advance,
        draw = draw,
    }
end
