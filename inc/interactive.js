/* ===========================================
   Interactive Effects for mga.is Presentations
   Typewriter, Glitch, and 3D Tilt effects
   =========================================== */

(function() {
    'use strict';

    // Initialize when Reveal is ready
    if (typeof Reveal !== 'undefined') {
        Reveal.on('ready', init);
        Reveal.on('slidechanged', onSlideChanged);
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof Reveal !== 'undefined') {
                Reveal.on('ready', init);
                Reveal.on('slidechanged', onSlideChanged);
            } else {
                init();
            }
        });
    }

    function init() {
        initTypewriter();
        initGlitch();
        initTilt();
    }

    function onSlideChanged(event) {
        // Reset and reinitialize effects for new slide
        const currentSlide = event.currentSlide;
        if (currentSlide) {
            // Reset typewriter elements on this slide
            const typewriters = currentSlide.querySelectorAll('.typewriter:not([data-typed])');
            typewriters.forEach(runTypewriter);
        }
    }

    // ==========================================
    // Typewriter Effect
    // ==========================================
    function initTypewriter() {
        const typewriters = document.querySelectorAll('.typewriter');
        typewriters.forEach(function(el) {
            // Store original text
            el.dataset.text = el.textContent;
            el.textContent = '';
            el.style.borderRight = '2px solid currentColor';

            // Only type if element is visible (on current slide)
            if (isElementVisible(el)) {
                runTypewriter(el);
            }
        });
    }

    function runTypewriter(el) {
        if (el.dataset.typed) return;

        const text = el.dataset.text || el.textContent;
        const speed = parseInt(el.dataset.speed) || 50;
        let index = 0;

        el.textContent = '';
        el.dataset.typed = 'true';

        function type() {
            if (index < text.length) {
                el.textContent += text.charAt(index);
                index++;
                setTimeout(type, speed);
            } else {
                // Remove cursor after typing is done
                setTimeout(function() {
                    el.style.borderRight = 'none';
                }, 1000);
            }
        }

        // Small delay before starting
        setTimeout(type, 300);
    }

    // ==========================================
    // Glitch Effect
    // ==========================================
    function initGlitch() {
        const glitchElements = document.querySelectorAll('.glitch');

        glitchElements.forEach(function(el) {
            // Create glitch layers
            const text = el.textContent;
            el.dataset.text = text;

            // Add pseudo-element support via CSS variables
            el.style.setProperty('--glitch-text', `"${text}"`);

            // Add automatic glitch on interval for elements with data-auto
            if (el.dataset.auto !== undefined) {
                const interval = parseInt(el.dataset.auto) || 3000;
                setInterval(function() {
                    triggerGlitch(el);
                }, interval);
            }
        });
    }

    function triggerGlitch(el) {
        el.classList.add('active');
        setTimeout(function() {
            el.classList.remove('active');
        }, 500);
    }

    // ==========================================
    // 3D Tilt Effect
    // ==========================================
    function initTilt() {
        const tiltElements = document.querySelectorAll('.tilt');

        tiltElements.forEach(function(el) {
            el.style.transition = 'transform 0.1s ease';
            el.style.transformStyle = 'preserve-3d';

            el.addEventListener('mousemove', function(e) {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const maxTilt = 10; // degrees
                const tiltX = ((y - centerY) / centerY) * maxTilt;
                const tiltY = ((centerX - x) / centerX) * maxTilt;

                el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
            });

            el.addEventListener('mouseleave', function() {
                el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
            });
        });
    }

    // ==========================================
    // Utility Functions
    // ==========================================
    function isElementVisible(el) {
        // Check if element is in the current Reveal.js slide
        if (typeof Reveal !== 'undefined') {
            const currentSlide = Reveal.getCurrentSlide();
            return currentSlide && currentSlide.contains(el);
        }
        return true;
    }

    // Expose for manual control
    window.InteractiveEffects = {
        typewriter: runTypewriter,
        glitch: triggerGlitch,
        reinit: init
    };

})();
