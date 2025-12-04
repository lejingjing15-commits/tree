import React, { useState, Suspense } from 'react';
import { Scene } from './components/Scene';
import { UIOverlay } from './components/UIOverlay';
import { TreeMorphState } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeMorphState>(TreeMorphState.TREE_SHAPE);

  const toggleState = () => {
    setTreeState((prev) => 
      prev === TreeMorphState.TREE_SHAPE 
        ? TreeMorphState.SCATTERED 
        : TreeMorphState.TREE_SHAPE
    );
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-black via-[#001a1a] to-black text-white overflow-hidden">
      {/* 3D Scene Container */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-[#ffd700] font-display animate-pulse">Loading Arix Experience...</div>}>
          <Scene treeState={treeState} />
        </Suspense>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UIOverlay treeState={treeState} onToggle={toggleState} />
      </div>
    </div>
  );
};

export default App;