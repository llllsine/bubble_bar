/**
 * Lightweight 2-D physics loop for bubble positions.
 * Uses requestAnimationFrame via setInterval fallback on RN.
 *
 * Each bubble is a soft-body circle; forces:
 *   - Gravity-like tilt (from device accelerometer)
 *   - Mutual repulsion (Coulomb-style, capped)
 *   - Spring attraction toward a "home" cluster centre
 *   - Damping
 */

import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import { useTaskStore } from '../store/taskStore';
import { BUBBLE_RADIUS } from '../constants/colors';
import { Task } from '../types/task';

const TICK_MS        = 32;   // ~30 fps
const DAMPING        = 0.88;
const TILT_FORCE     = 0.25;
const SPRING_K       = 0.018;
const REPULSE_DIST   = 160;
const REPULSE_FORCE  = 38;

function bubbleRadius(task: Task): number {
  const { min, max } = BUBBLE_RADIUS;
  return min + ((task.importance - 1) / 4) * (max - min);
}

export function usePhysics(canvasW: number, canvasH: number) {
  const store       = useTaskStore();
  const accelRef    = useRef({ x: 0, y: 0 });
  const stateRef    = useRef<Record<string, { x: number; y: number; vx: number; vy: number }>>({});

  // Subscribe to accelerometer
  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener((d) => {
      accelRef.current = { x: d.x, y: -d.y }; // flip y for screen coords
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const tasks   = store.getActiveTasks();
      const accel   = accelRef.current;
      const cx      = canvasW / 2;
      const cy      = canvasH / 2;

      // Initialise positions for new tasks
      tasks.forEach((t) => {
        if (!stateRef.current[t.id]) {
          stateRef.current[t.id] = {
            x: cx + (Math.random() - 0.5) * 120,
            y: cy + (Math.random() - 0.5) * 120,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
          };
        }
      });

      // Remove stale entries
      Object.keys(stateRef.current).forEach((id) => {
        if (!tasks.find((t) => t.id === id)) delete stateRef.current[id];
      });

      // Integrate
      tasks.forEach((t) => {
        const s  = stateRef.current[t.id];
        const r  = bubbleRadius(t);

        // Spring toward centre
        let fx = (cx - s.x) * SPRING_K;
        let fy = (cy - s.y) * SPRING_K;

        // Tilt (accelerometer)
        fx += accel.x * TILT_FORCE;
        fy += accel.y * TILT_FORCE;

        // Mutual repulsion
        tasks.forEach((other) => {
          if (other.id === t.id) return;
          const os   = stateRef.current[other.id];
          if (!os) return;
          const dx   = s.x - os.x;
          const dy   = s.y - os.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          if (dist < REPULSE_DIST) {
            const mag = REPULSE_FORCE / (dist * dist);
            fx += (dx / dist) * mag;
            fy += (dy / dist) * mag;
          }
        });

        s.vx = (s.vx + fx) * DAMPING;
        s.vy = (s.vy + fy) * DAMPING;
        s.x += s.vx;
        s.y += s.vy;

        // Boundary clamp
        s.x = Math.max(r, Math.min(canvasW - r, s.x));
        s.y = Math.max(r, Math.min(canvasH - r, s.y));

        store.updateBubblePosition(t.id, s.x, s.y);
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [canvasW, canvasH]);
}
