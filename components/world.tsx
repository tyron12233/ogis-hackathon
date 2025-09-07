
import React, { useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { PointerLockControls, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { WorldData, DreamObjectData } from '@/lib/types';

interface WorldProps {
    worldData: WorldData;
}

const DreamObject: React.FC<{ data: DreamObjectData }> = ({ data }) => {
    const texture = useLoader(THREE.TextureLoader, data.textureData!);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    const meshRef = useRef<THREE.Mesh>(null!);

    const getGeometry = () => {
        switch (data.shape) {
            case 'box':
                return <boxGeometry args={data.scale} />;
            case 'sphere':
                return <sphereGeometry args={[data.scale[0] / 2, 32, 32]} />;
            case 'cylinder':
                return <cylinderGeometry args={[data.scale[0] / 2, data.scale[0] / 2, data.scale[1], 32]} />;
            case 'cone':
                return <coneGeometry args={[data.scale[0] / 2, data.scale[1], 32]} />;
            case 'torus':
                return <torusGeometry args={[data.scale[0] / 2, data.scale[1] / 4, 16, 100]} />;
            case 'plane':
                return <planeGeometry args={[data.scale[0], data.scale[1]]} />;
            default:
                return <boxGeometry args={data.scale} />;
        }
    };

    return (
        <mesh ref={meshRef} position={data.position} rotation={(data.rotation.map((r: number) => THREE.MathUtils.degToRad(r)) as unknown) as [number, number, number]}>
            {getGeometry()}
            <meshStandardMaterial map={texture} roughness={0.5} metalness={0.2} />
        </mesh>
    );
};


const World: React.FC<WorldProps> = ({ worldData }) => {
    return (
        <>
            <ambientLight intensity={worldData.ambientLightIntensity} />
            <directionalLight
                position={[10, 20, 5]}
                intensity={1.5}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />
            <fog attach="fog" args={[worldData.fogColor, 10, 60]} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {worldData.objects.map((obj: DreamObjectData, index: number) => (
                <DreamObject key={index} data={obj} />
            ))}

            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
            </mesh>

            <PointerLockControls />
            <Text
                position={[0, 4, -10]}
                color="#00ff00"
                fontSize={0.5}
                font="/fonts/ShareTechMono-Regular.ttf" // Assuming this path is handled by a server
                anchorX="center"
                anchorY="middle"
                outlineColor="black"
                outlineWidth={0.02}
            >
                Click to explore. WASD to move. Mouse to look.
            </Text>
        </>
    );
};

export default World;
