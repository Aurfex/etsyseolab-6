import React, { useEffect, useRef } from 'react';

const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const mouse = { x: 0, y: 0, radius: 180 };
    const particleCount = 150; // Increased count as requested
    const centerAttraction = 0.05; // Subtle drift towards center

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        
        const colors = ['#9333ea', '#a855f7', '#6366f1', '#4f46e5'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = 1;
      }

      update() {
        // Continuous organic movement with a "sine" wave influence for life
        this.x += this.speedX + Math.sin(Date.now() * 0.001 + this.x) * 0.1;
        this.y += this.speedY + Math.cos(Date.now() * 0.001 + this.y) * 0.1;

        // Subtle pull towards center-top, but with a "limit" so they don't clump
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dxCenter = centerX - this.x;
        const dyCenter = centerY - this.y;
        const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);

        if (distCenter > 100) { // Only pull if they are far away
            this.x += dxCenter * 0.0001;
            this.y += dyCenter * 0.0001;
        }

        // Mouse interaction (Stronger but shorter range for a "poke" feel)
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouse.radius - distance) / mouse.radius;
          // Push away slightly if too close, pull if medium
          const directionX = forceDirectionX * force * 0.8; 
          const directionY = forceDirectionY * force * 0.8;

          this.x -= directionX; // Change to repulsion for a "liquid" feel
          this.y -= directionY;
        }

        // Keep alpha high throughout the page for glassmorphism sections
        this.alpha = 0.8;

        if (this.x > canvas.width) this.x = 0;
        else if (this.x < 0) this.x = canvas.width;
        
        if (this.y > canvas.height) this.y = 0;
        else if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        if (!ctx) return;
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const drawLines = () => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) { // Slightly shorter lines for cleaner look
            const opacity = (1 - distance / 120) * particles[a].alpha * particles[b].alpha;
            ctx.strokeStyle = `rgba(147, 51, 234, ${opacity * 0.3})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      console.log('Animating particles...');
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      drawLines();
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        background: 'transparent'
      }}
    />
  );
};

export default ParticleBackground;