import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TreeMorphState } from '../types';

interface InteractiveTreeProps {
  treeState: TreeMorphState;
}

// Configuration
const PARTICLE_COUNT = 3500;
const ORNAMENT_COUNT = 150;
const TREE_HEIGHT = 8;
const TREE_RADIUS_BASE = 3.5;
const SCATTER_RADIUS = 15;

// Helper to generate random point in sphere
const randomInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
};

// Helper to generate point on cone volume
const randomInCone = (height: number, radiusBase: number) => {
  const y = Math.random() * height; // Height from bottom
  const rAtHeight = (1 - y / height) * radiusBase;
  const theta = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * rAtHeight; // Uniform distribution in circle
  
  return new THREE.Vector3(
    r * Math.cos(theta),
    y,
    r * Math.sin(theta)
  );
};

// Helper for ornament placement (surface of cone)
const randomOnConeSurface = (height: number, radiusBase: number) => {
  const y = Math.random() * height;
  const rAtHeight = (1 - y / height) * radiusBase;
  const theta = Math.random() * Math.PI * 2;
  // Push slightly out for ornaments
  const r = rAtHeight + 0.1;
  
  return new THREE.Vector3(
    r * Math.cos(theta),
    y,
    r * Math.sin(theta)
  );
};

export const InteractiveTree: React.FC<InteractiveTreeProps> = ({ treeState }) => {
  const needlesMesh = useRef<THREE.InstancedMesh>(null);
  const ornamentsMesh = useRef<THREE.InstancedMesh>(null);
  const starMesh = useRef<THREE.Mesh>(null);

  // --- Data Generation ---
  
  const needleData = useMemo(() => {
    const temp = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const scatterPos = randomInSphere(SCATTER_RADIUS);
      const treePos = randomInCone(TREE_HEIGHT, TREE_RADIUS_BASE);
      
      // Needles look better if they point slightly up and out in tree mode
      const treeRot = new THREE.Euler(
        (Math.random() - 0.5) * 0.5, 
        Math.random() * Math.PI * 2, 
        (Math.random() - 0.5) * 0.5
      );
      
      const scatterRot = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      temp.push({ scatterPos, treePos, scatterRot, treeRot, speed: 0.02 + Math.random() * 0.04 });
    }
    return temp;
  }, []);

  const ornamentData = useMemo(() => {
    const temp = [];
    const colors = [
      new THREE.Color("#ffd700"), // Gold
      new THREE.Color("#ff3366"), // Deep Pink/Red
      new THREE.Color("#ffffff"), // Silver
    ];

    for (let i = 0; i < ORNAMENT_COUNT; i++) {
      const scatterPos = randomInSphere(SCATTER_RADIUS);
      const treePos = randomOnConeSurface(TREE_HEIGHT, TREE_RADIUS_BASE);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const scale = 0.15 + Math.random() * 0.25;

      temp.push({ 
        scatterPos, 
        treePos, 
        color, 
        scale,
        speed: 0.015 + Math.random() * 0.03 
      });
    }
    return temp;
  }, []);

  // --- Frame Loop (Animation) ---

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state, delta) => {
    const isTree = treeState === TreeMorphState.TREE_SHAPE;
    const time = state.clock.elapsedTime;

    // 1. Animate Needles
    if (needlesMesh.current) {
      needleData.forEach((data, i) => {
        const targetPos = isTree ? data.treePos : data.scatterPos;
        const targetRot = isTree ? data.treeRot : data.scatterRot;

        // If scattered, add some floating motion
        if (!isTree) {
          tempVec.copy(targetPos).addScalar(Math.sin(time + i) * 0.5);
        } else {
          tempVec.copy(targetPos);
        }

        // Lerp Position manually for granular control (or use damp() from maath)
        // Here we use a simple proprietary lerp storage on the object isn't needed as we reconstruct every frame
        // But for performance with transitions, we need current state. 
        // We will read current matrix, extract position, lerp, and write back.
        
        needlesMesh.current!.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        // Smooth damping
        dummy.position.lerp(tempVec, data.speed * 60 * delta); // Adjust speed
        
        // Rotation Damping
        const targetQuat = new THREE.Quaternion().setFromEuler(targetRot);
        if (!isTree) {
            // Spin slowly when scattered
            targetQuat.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), time * 0.1));
        }
        dummy.quaternion.slerp(targetQuat, data.speed * 60 * delta);

        // Scale
        dummy.scale.setScalar(isTree ? 1 : 0.5); // Shrink slightly when scattered

        dummy.updateMatrix();
        needlesMesh.current!.setMatrixAt(i, dummy.matrix);
      });
      needlesMesh.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Animate Ornaments
    if (ornamentsMesh.current) {
      ornamentData.forEach((data, i) => {
        const targetPos = isTree ? data.treePos : data.scatterPos;
        
        ornamentsMesh.current!.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        // If tree, add gentle sway
        if (isTree) {
             tempVec.copy(targetPos);
             // Gentle bobbing
             tempVec.y += Math.sin(time * 2 + i) * 0.05;
        } else {
            // Floating
            tempVec.copy(targetPos).add(new THREE.Vector3(
                Math.sin(time * 0.5 + i),
                Math.cos(time * 0.3 + i),
                Math.sin(time * 0.7 + i)
            ));
        }

        dummy.position.lerp(tempVec, data.speed * 50 * delta);
        
        // Keep ornaments upright or spinning
        dummy.rotation.set(0, time * 0.5 + i, 0);
        dummy.updateMatrix(); // Rotation updated via rotation property setter internal to Object3D

        ornamentsMesh.current!.setMatrixAt(i, dummy.matrix);
        // We set colors in layout effect, no need here
      });
      ornamentsMesh.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Animate Star
    if (starMesh.current) {
        const targetY = isTree ? TREE_HEIGHT + 0.5 : 20; // Fly away high when scattered
        const currentY = starMesh.current.position.y;
        starMesh.current.position.y = THREE.MathUtils.lerp(currentY, targetY, delta * 2);
        
        // Spin the star
        starMesh.current.rotation.y += delta * 0.5;
        starMesh.current.scale.setScalar(THREE.MathUtils.lerp(starMesh.current.scale.x, isTree ? 1.5 : 0, delta * 3));
    }
  });

  // Set initial colors and scales for Ornaments
  useLayoutEffect(() => {
    if (ornamentsMesh.current) {
        ornamentData.forEach((data, i) => {
            dummy.scale.setScalar(data.scale);
            dummy.updateMatrix();
            ornamentsMesh.current!.setMatrixAt(i, dummy.matrix);
            ornamentsMesh.current!.setColorAt(i, data.color);
        });
        ornamentsMesh.current.instanceMatrix.needsUpdate = true;
        ornamentsMesh.current.instanceColor!.needsUpdate = true;
    }
    // Set scales for Needles
    if (needlesMesh.current) {
         needleData.forEach((_, i) => {
            dummy.scale.set(0.1, 0.4, 0.1); // Thin needles
            dummy.updateMatrix();
            needlesMesh.current!.setMatrixAt(i, dummy.matrix);
         });
         needlesMesh.current.instanceMatrix.needsUpdate = true;
    }
  }, [ornamentData, needleData, dummy]);


  return (
    <group>
        {/* Needles: Instanced Mesh */}
        <instancedMesh ref={needlesMesh} args={[undefined, undefined, PARTICLE_COUNT]}>
            <coneGeometry args={[0.2, 1, 4]} /> {/* Low poly cone for needle */}
            <meshStandardMaterial 
                color="#044f33" 
                roughness={0.4} 
                metalness={0.1} 
                emissive="#001a10"
                emissiveIntensity={0.2}
            />
        </instancedMesh>

        {/* Ornaments: Instanced Mesh */}
        <instancedMesh ref={ornamentsMesh} args={[undefined, undefined, ORNAMENT_COUNT]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial 
                roughness={0.1} 
                metalness={1} 
                envMapIntensity={2}
            />
        </instancedMesh>

        {/* The Grand Star */}
        <mesh ref={starMesh} position={[0, TREE_HEIGHT + 0.5, 0]}>
            <octahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial 
                color="#ffd700" 
                emissive="#ffd700" 
                emissiveIntensity={2} 
                toneMapped={false} 
            />
            {/* Inner Glow light */}
            <pointLight distance={5} intensity={5} color="#ffd700" />
        </mesh>
    </group>
  );
};