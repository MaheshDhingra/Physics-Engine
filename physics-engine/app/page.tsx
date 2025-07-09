"use client";

import React, { useRef, useState } from 'react';
import PhysicsEngine, { PhysicsEngineRef } from "./components/PhysicsEngine";

export default function Home() {
  const physicsEngineRef = useRef<PhysicsEngineRef>(null);
  const [gravityInput, setGravityInput] = useState<string>('9.8');
  const [frictionEnabled, setFrictionEnabled] = useState<boolean>(true);
  const [elasticityInput, setElasticityInput] = useState<string>('0.7'); // New state for elasticity
  const [bodyRadius, setBodyRadius] = useState<string>('20');
  const [bodyMass, setBodyMass] = useState<string>('10');
  const [bodyColor, setBodyColor] = useState<string>('#0000FF'); // Changed default to hex for color input

  const handleGravityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGravityInput(e.target.value);
    const newGravity = parseFloat(e.target.value);
    if (!isNaN(newGravity) && physicsEngineRef.current) {
      physicsEngineRef.current.setGravityMagnitude(newGravity);
    }
  };

  const handleFrictionToggle = () => {
    setFrictionEnabled((prev) => {
      const newState = !prev;
      if (physicsEngineRef.current) {
        physicsEngineRef.current.setFrictionEnabled(newState);
      }
      return newState;
    });
  };

  const handleElasticityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setElasticityInput(e.target.value);
    const newElasticity = parseFloat(e.target.value);
    if (!isNaN(newElasticity) && physicsEngineRef.current) {
      physicsEngineRef.current.setElasticity(newElasticity);
    }
  };

  const handleAddBody = () => {
    const radius = parseFloat(bodyRadius);
    const mass = parseFloat(bodyMass);
    if (!isNaN(radius) && !isNaN(mass) && physicsEngineRef.current) {
      physicsEngineRef.current.addBody({
        position: { x: 400 + (Math.random() - 0.5) * 100, y: 50 }, // Randomize initial x slightly
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 },
        mass: mass,
        radius: radius,
        color: bodyColor,
      });
    }
  };

  const handleClearBodies = () => {
    if (physicsEngineRef.current) {
      physicsEngineRef.current.clearBodies();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Physics Engine</h1>

      <div className="controls-menu mb-8 p-4 border rounded-lg shadow-md bg-white">
        <h2 className="text-gray-700 text-2xl font-semibold mb-4">Controls</h2>

        <div className="mb-4">
          <label htmlFor="gravity" className="block text-lg font-medium text-gray-700">
            Gravity Magnitude (m/s²):
          </label>
          <input
            type="number"
            id="gravity"
            value={gravityInput}
            onChange={handleGravityChange}
            className="text-gray-700 mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            step="0.1"
          />
        </div>

        <div className="mb-4 flex items-center">
          <label htmlFor="friction" className="text-lg font-medium text-gray-700 mr-3">
            Friction:
          </label>
          <input
            type="checkbox"
            id="friction"
            checked={frictionEnabled}
            onChange={handleFrictionToggle}
            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="elasticity" className="block text-lg font-medium text-gray-700">
            Elasticity (0.0 - 1.0):
          </label>
          <input
            type="number"
            id="elasticity"
            value={elasticityInput}
            onChange={handleElasticityChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            step="0.05"
            min="0"
            max="1"
          />
        </div>

        <h3 className="text-xl font-semibold mb-3 mt-6">Add New Body</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="bodyRadius" className="block text-sm font-medium text-gray-700">
              Radius:
            </label>
            <input
              type="number"
              id="bodyRadius"
              value={bodyRadius}
              onChange={(e) => setBodyRadius(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              step="1"
            />
          </div>
          <div>
            <label htmlFor="bodyMass" className="block text-sm font-medium text-gray-700">
              Mass:
            </label>
            <input
              type="number"
              id="bodyMass"
              value={bodyMass}
              onChange={(e) => setBodyMass(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              step="1"
            />
          </div>
          <div>
            <label htmlFor="bodyColor" className="block text-sm font-medium text-gray-700">
              Color:
            </label>
            <input
              type="color"
              id="bodyColor"
              value={bodyColor}
              onChange={(e) => setBodyColor(e.target.value)}
              className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>
        <button
          onClick={handleAddBody}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"
        >
          Add Body
        </button>
        <button
          onClick={handleClearBodies}
          className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Clear All Bodies
        </button>
      </div>

      <PhysicsEngine ref={physicsEngineRef} />
    </main>
  );
}
