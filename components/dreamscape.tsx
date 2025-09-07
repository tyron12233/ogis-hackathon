"use client";

import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { GeneratedDream } from '@/lib/types';

const SceneLoader: React.FC = () => (
    <Html center>
        <div className="text-white text-sm sm:text-base font-medium">Entering dream…</div>
    </Html>
);

const Scene: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
    const texture = useTexture(imageUrl);
    texture.mapping = THREE.EquirectangularReflectionMapping;

    // Use an imperative material to avoid JSX intrinsic typing issues
    const material = useMemo(
        () => new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
        [texture]
    );

    return (
        <>
            <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={-0.4} autoRotate autoRotateSpeed={0.5} />
            {/* Inverted sphere to create an immersive panorama */}
            <Sphere args={[500, 60, 40]} scale={[-1, 1, 1]} material={material} />
        </>
    );
};

const Dreamscape: React.FC<{ dream: GeneratedDream; onDreamAgain: () => void }> = ({ dream, onDreamAgain }) => {
    return (
        <div className="w-full flex flex-col items-center space-y-6">
            <div className="text-center card px-5 py-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold neon-text">
                    {dream.title}
                </h2>
                <p className="text-stone-400 mt-1">Click and drag to look around.</p>
            </div>

            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
                <Suspense
                    fallback={
                        <div className="w-full h-full flex items-center justify-center">
                            <p className="text-stone-300">Constructing 3D world…</p>
                        </div>
                    }
                >
                    <Canvas camera={{ position: [0, 0, 0.1] }}>
                        <Suspense fallback={<SceneLoader />}>
                            <Scene imageUrl={dream.imageUrl} />
                        </Suspense>
                    </Canvas>
                </Suspense>
            </div>

            <button
                onClick={onDreamAgain}
                className="px-6 py-2 font-semibold text-stone-200 bg-stone-800 border border-stone-700 rounded-md hover:bg-stone-700 transition-colors duration-300"
            >
                Dream Again
            </button>
        </div>
    );
};

export default Dreamscape;

