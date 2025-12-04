import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { TreeMorphState } from '../types';
import { InteractiveTree } from './InteractiveTree';

interface SceneProps {
  treeState: TreeMorphState;
}

export const Scene: React.FC<SceneProps> = ({ treeState }) => {
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: false, toneMappingExposure: 1.5 }}>
      <PerspectiveCamera makeDefault position={[0, 2, 12]} fov={45} />
      
      {/* Controls */}
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={5}
        maxDistance={20}
        autoRotate={treeState === TreeMorphState.TREE_SHAPE}
        autoRotateSpeed={0.5}
        dampingFactor={0.05}
      />

      {/* Lighting - Cinematic Setup */}
      <ambientLight intensity={0.2} color="#004030" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        color="#ffd700" 
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={1.5} color="#00ffcc" />
      <pointLight position={[0, -5, 5]} intensity={0.5} color="#ff0044" />

      {/* Environment for Reflections */}
      <Environment preset="city" />
      
      {/* Background Ambience */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={['#000505', 5, 30]} />

      {/* The Core Experience */}
      <group position={[0, -2, 0]}>
        <InteractiveTree treeState={treeState} />
        <ContactShadows opacity={0.6} scale={20} blur={2} far={4.5} color="#000000" />
      </group>

      {/* Post Processing for the "Arix Signature" Glow */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.4}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </Canvas>
  );
};