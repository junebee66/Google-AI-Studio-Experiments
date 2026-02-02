
import React, { useMemo, useRef } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ForestProps {
  modelUrl: string;
}

export const Forest: React.FC<ForestProps> = ({ modelUrl }) => {
  return (
    <group>
      <Station modelUrl={modelUrl} />
    </group>
  );
};

const Station: React.FC<{ modelUrl: string }> = ({ modelUrl }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelUrl);
  
  // Subtle orbital rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
      groupRef.current.rotation.z += 0.0002;
    }
  });

  // Enhance the model materials for a high-fidelity look
  const processedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.envMapIntensity = 2.5;
          mat.metalness = 0.95;
          mat.roughness = 0.05;
          // Ensure materials respond well to the space lighting
          if (mat.map) mat.map.anisotropy = 16;
        }
      }
    });
    return clone;
  }, [scene]);

  // Adjusting scale to 0.4 for consistent sizing across A, B, and D versions
  return (
    <Center>
      <group ref={groupRef} scale={0.4}>
        <primitive object={processedScene} />
      </group>
    </Center>
  );
};
