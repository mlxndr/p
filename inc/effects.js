/* ===========================================
   Canvas-Based Effects Engine for mga.is
   Particle system, starfield, gradient mesh
   =========================================== */

(function() {
    'use strict';

    // Store active effect and canvas
    let activeEffect = null;
    let canvas = null;
    let ctx = null;
    let animationFrame = null;

    // Effect registry
    const effects = {
        particles: ParticleEffect,
        starfield: StarfieldEffect,
        gradient: GradientMeshEffect
    };

    // Initialize when Reveal is ready
    if (typeof Reveal !== 'undefined') {
        Reveal.on('ready', init);
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof Reveal !== 'undefined') {
                Reveal.on('ready', init);
            }
        });
    }

    function init() {
        // Create canvas element
        canvas = document.createElement('canvas');
        canvas.id = 'effects-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;
        document.body.insertBefore(canvas, document.body.firstChild);
        ctx = canvas.getContext('2d');

        // Handle resize
        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        // Watch for theme changes via CSS variable
        checkThemeEffect();

        // Use MutationObserver to watch theme link changes
        const themeLink = document.getElementById('theme');
        if (themeLink) {
            const observer = new MutationObserver(function() {
                // Small delay to let CSS load
                setTimeout(checkThemeEffect, 100);
            });
            observer.observe(themeLink, { attributes: true, attributeFilter: ['href'] });
        }
    }

    function checkThemeEffect() {
        const reveal = document.querySelector('.reveal');
        if (!reveal) return;

        const computedStyle = getComputedStyle(reveal);
        const effect = computedStyle.getPropertyValue('--theme-effect').trim();

        if (effect && effect !== 'none' && effects[effect]) {
            startEffect(effect);
        } else {
            stopEffect();
        }
    }

    function startEffect(effectName) {
        if (activeEffect && activeEffect.name === effectName) return;

        stopEffect();

        const EffectClass = effects[effectName];
        if (EffectClass) {
            activeEffect = new EffectClass(canvas, ctx);
            activeEffect.name = effectName;
            canvas.style.opacity = '1';
            animate();
        }
    }

    function stopEffect() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        if (activeEffect && activeEffect.destroy) {
            activeEffect.destroy();
        }
        activeEffect = null;
        if (canvas) {
            canvas.style.opacity = '0';
        }
    }

    function animate() {
        if (!activeEffect) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        activeEffect.update();
        activeEffect.draw();

        animationFrame = requestAnimationFrame(animate);
    }

    // ==========================================
    // Particle Effect (for Neon Cyber theme)
    // ==========================================
    function ParticleEffect(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particles = [];
        this.particleCount = 60;

        // Get theme colors
        const reveal = document.querySelector('.reveal');
        const style = getComputedStyle(reveal);
        this.color1 = style.getPropertyValue('--theme-effect-color1').trim() || '#00ffff';
        this.color2 = style.getPropertyValue('--theme-effect-color2').trim() || '#ff00ff';

        // Initialize particles
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                color: Math.random() > 0.5 ? this.color1 : this.color2
            });
        }
    }

    ParticleEffect.prototype.update = function() {
        for (let p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;

            // Wrap around edges
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
        }
    };

    ParticleEffect.prototype.draw = function() {
        const ctx = this.ctx;

        // Draw particles
        for (let p of this.particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fill();
        }

        // Draw connections between nearby particles
        ctx.shadowBlur = 0;
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - dist / 150)})`;
                    ctx.stroke();
                }
            }
        }
    };

    ParticleEffect.prototype.destroy = function() {
        this.particles = [];
    };

    // ==========================================
    // Starfield Effect (for Deep Space theme)
    // ==========================================
    function StarfieldEffect(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.stars = [];
        this.starCount = 200;

        // Initialize stars with depth
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                z: Math.random() * 3 + 0.5,
                brightness: Math.random()
            });
        }
    }

    StarfieldEffect.prototype.update = function() {
        for (let star of this.stars) {
            // Slow drift
            star.x += 0.02 * star.z;

            // Twinkle
            star.brightness += (Math.random() - 0.5) * 0.05;
            star.brightness = Math.max(0.2, Math.min(1, star.brightness));

            // Wrap around
            if (star.x > this.canvas.width) {
                star.x = 0;
                star.y = Math.random() * this.canvas.height;
            }
        }
    };

    StarfieldEffect.prototype.draw = function() {
        const ctx = this.ctx;

        for (let star of this.stars) {
            const size = star.z * 1.5;
            const alpha = star.brightness * (star.z / 3.5);

            ctx.beginPath();
            ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();

            // Add glow to brighter stars
            if (star.brightness > 0.7 && star.z > 2) {
                ctx.beginPath();
                ctx.arc(star.x, star.y, size * 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200, 220, 255, ${alpha * 0.3})`;
                ctx.fill();
            }
        }
    };

    StarfieldEffect.prototype.destroy = function() {
        this.stars = [];
    };

    // ==========================================
    // Gradient Mesh Effect (for Gradient Wave theme)
    // ==========================================
    function GradientMeshEffect(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.time = 0;

        // Color stops for gradient
        const reveal = document.querySelector('.reveal');
        const style = getComputedStyle(reveal);
        this.color1 = style.getPropertyValue('--theme-effect-color1').trim() || '#667eea';
        this.color2 = style.getPropertyValue('--theme-effect-color2').trim() || '#764ba2';
        this.color3 = style.getPropertyValue('--theme-effect-color3').trim() || '#6B8DD6';
    }

    GradientMeshEffect.prototype.update = function() {
        this.time += 0.005;
    };

    GradientMeshEffect.prototype.draw = function() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Create animated gradient positions
        const x1 = Math.sin(this.time) * w * 0.3 + w * 0.3;
        const y1 = Math.cos(this.time * 0.7) * h * 0.3 + h * 0.3;
        const x2 = Math.cos(this.time * 0.8) * w * 0.3 + w * 0.7;
        const y2 = Math.sin(this.time * 0.6) * h * 0.3 + h * 0.7;

        // First radial gradient
        const grad1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, w * 0.6);
        grad1.addColorStop(0, this.hexToRgba(this.color1, 0.4));
        grad1.addColorStop(1, 'transparent');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, w, h);

        // Second radial gradient
        const grad2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, w * 0.5);
        grad2.addColorStop(0, this.hexToRgba(this.color2, 0.3));
        grad2.addColorStop(1, 'transparent');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, w, h);

        // Third gradient for more depth
        const x3 = Math.sin(this.time * 1.2) * w * 0.2 + w * 0.5;
        const y3 = Math.cos(this.time * 0.9) * h * 0.2 + h * 0.5;
        const grad3 = ctx.createRadialGradient(x3, y3, 0, x3, y3, w * 0.4);
        grad3.addColorStop(0, this.hexToRgba(this.color3, 0.25));
        grad3.addColorStop(1, 'transparent');
        ctx.fillStyle = grad3;
        ctx.fillRect(0, 0, w, h);
    };

    GradientMeshEffect.prototype.hexToRgba = function(hex, alpha) {
        // Handle both #RGB and #RRGGBB formats
        let r, g, b;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    GradientMeshEffect.prototype.destroy = function() {
        // Nothing to clean up
    };

    // Expose for manual control if needed
    window.EffectsEngine = {
        start: startEffect,
        stop: stopEffect,
        check: checkThemeEffect
    };

})();
