"use client";

import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

interface Vector2D {
  x: number;
  y: number;
}

interface Body {
  id: string; // Unique identifier for each body
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  mass: number;
  radius: number; // For circular bodies
  color: string;
}

export interface PhysicsEngineRef {
  addBody: (body: Omit<Body, 'id'>) => void;
  setGravityMagnitude: (magnitude: number) => void;
  setFrictionEnabled: (enabled: boolean) => void;
  setElasticity: (elasticity: number) => void;
  clearBodies: () => void;
}

const PhysicsEngine = forwardRef<PhysicsEngineRef, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodiesRef = useRef<Body[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const lastTime = useRef<number>(0);

  const [gravityMagnitude, setGravityMagnitude] = useState<number>(9.8);
  const [frictionEnabled, setFrictionEnabled] = useState<boolean>(true);
  const [elasticity, setElasticity] = useState<number>(0.7); // New state for elasticity

  const GRAVITY = { x: 0, y: gravityMagnitude }; // m/s^2

  const addBody = useCallback((newBody: Omit<Body, 'id'>) => {
    bodiesRef.current.push({ ...newBody, id: Math.random().toString(36).substr(2, 9) });
  }, []);

  const clearBodies = useCallback(() => {
    bodiesRef.current = [];
  }, []);

  const updatePhysics = useCallback((deltaTime: number) => {
    bodiesRef.current = bodiesRef.current.map((body) => {
      // Apply gravity
      const forceX = body.mass * GRAVITY.x;
      const forceY = body.mass * GRAVITY.y;

      const accelerationX = forceX / body.mass;
      const accelerationY = forceY / body.mass;

      // Update velocity
      let newVelocityX = body.velocity.x + accelerationX * deltaTime;
      let newVelocityY = body.velocity.y + accelerationY * deltaTime;

      // Apply friction if enabled and on the ground (or near a wall)
      if (frictionEnabled) {
        const frictionCoefficient = 0.9; // A simple friction model
        if (body.position.y + body.radius >= (canvasRef.current?.height || 0) - 1) { // On the ground
          newVelocityX *= frictionCoefficient;
        }
        if (body.position.x + body.radius >= (canvasRef.current?.width || 0) - 1 || body.position.x - body.radius <= 1) { // Against a wall
          newVelocityY *= frictionCoefficient;
        }
      }

      // Update position
      const newPositionX = body.position.x + newVelocityX * deltaTime;
      const newPositionY = body.position.y + newVelocityY * deltaTime;

      return {
        ...body,
        velocity: { x: newVelocityX, y: newVelocityY },
        position: { x: newPositionX, y: newPositionY },
      };
    });

    // Collision detection and response
    for (let i = 0; i < bodiesRef.current.length; i++) {
      for (let j = i + 1; j < bodiesRef.current.length; j++) {
        const bodyA = bodiesRef.current[i];
        const bodyB = bodiesRef.current[j];

        const distance = Math.sqrt(
          (bodyA.position.x - bodyB.position.x) ** 2 +
          (bodyA.position.y - bodyB.position.y) ** 2
        );

        if (distance < bodyA.radius + bodyB.radius) {
          // Collision detected, resolve it
          const normalX = (bodyB.position.x - bodyA.position.x) / distance;
          const normalY = (bodyB.position.y - bodyA.position.y) / distance;

          const relativeVelocityX = bodyB.velocity.x - bodyA.velocity.x;
          const relativeVelocityY = bodyB.velocity.y - bodyA.velocity.y;

          const dotProduct = relativeVelocityX * normalX + relativeVelocityY * normalY;

          // Only resolve if bodies are moving towards each other
          if (dotProduct < 0) {
            const impulse = (-(1 + elasticity) * dotProduct) / (1 / bodyA.mass + 1 / bodyB.mass);

            const impulseX = impulse * normalX;
            const impulseY = impulse * normalY;

            bodyA.velocity.x -= impulseX / bodyA.mass;
            bodyA.velocity.y -= impulseY / bodyA.mass;
            bodyB.velocity.x += impulseX / bodyB.mass;
            bodyB.velocity.y += impulseY / bodyB.mass;

            // Separate bodies to prevent sticking
            const overlap = bodyA.radius + bodyB.radius - distance;
            const separationX = (overlap / 2) * normalX;
            const separationY = (overlap / 2) * normalY;

            bodyA.position.x -= separationX;
            bodyA.position.y -= separationY;
            bodyB.position.x += separationX;
            bodyB.position.y += separationY;
          }
        }
      }
    }

    // Boundary collision
    bodiesRef.current.forEach((body) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Floor
      if (body.position.y + body.radius > canvas.height) {
        body.position.y = canvas.height - body.radius;
        body.velocity.y *= -elasticity; // Bounce with elasticity
        if (Math.abs(body.velocity.y) < 0.1) body.velocity.y = 0; // Stop small bounces
      }
      // Ceiling
      if (body.position.y - body.radius < 0) {
        body.position.y = body.radius;
        body.velocity.y *= -elasticity;
        if (Math.abs(body.velocity.y) < 0.1) body.velocity.y = 0;
      }
      // Right wall
      if (body.position.x + body.radius > canvas.width) {
        body.position.x = canvas.width - body.radius;
        body.velocity.x *= -elasticity;
        if (Math.abs(body.velocity.x) < 0.1) body.velocity.x = 0;
      }
      // Left wall
      if (body.position.x - body.radius < 0) {
        body.position.x = body.radius;
        body.velocity.x *= -elasticity;
        if (Math.abs(body.velocity.x) < 0.1) body.velocity.x = 0;
      }
    });

  }, [gravityMagnitude, frictionEnabled, elasticity]); // Dependencies for physics updates

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bodiesRef.current.forEach((body) => {
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, body.radius, 0, Math.PI * 2);
      ctx.fillStyle = body.color;
      ctx.fill();
      ctx.closePath();
    });
  }, []);

  const gameLoop = useCallback((currentTime: number) => {
    if (!lastTime.current) {
      lastTime.current = currentTime;
    }
    const deltaTime = (currentTime - lastTime.current) / 1000; // Convert to seconds
    lastTime.current = currentTime;

    updatePhysics(deltaTime);
    draw();

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [updatePhysics, draw]);

  useEffect(() => {
    // Initial body for demonstration
    addBody({
      position: { x: 400, y: 50 }, // Centered horizontally
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      mass: 10,
      radius: 20,
      color: 'blue',
    });

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameLoop, addBody]);

  useImperativeHandle(ref, () => ({
    addBody,
    setGravityMagnitude,
    setFrictionEnabled,
    setElasticity,
    clearBodies,
  }));

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ border: '1px solid black', background: '#f0f0f0' }}
    />
  );
});

PhysicsEngine.displayName = 'PhysicsEngine';

export default PhysicsEngine;
