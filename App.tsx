
import React, { useState, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  PerspectiveCamera, 
  Stars,
  Loader,
  BakeShadows,
  Float
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { Rocket, Scan, Terminal, X, MapPin, Orbit, Cpu, Layers } from 'lucide-react';
import { Forest } from './components/Trees';
import { generateEcosystemReport } from './services/geminiService';
import { EcosystemReport } from './types';

// NASA ISS Model URLs
const MODELS = {
  VERSION_A: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/International%20Space%20Station%20(ISS)%20(A)/International%20Space%20Station%20(ISS)%20(A).glb',
  VERSION_B: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/International%20Space%20Station%20(ISS)%20(B)/International%20Space%20Station%20(ISS)%20(B).glb',
  VERSION_D: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/International%20Space%20Station%20(ISS)%20(D)%20(IGOAL)/International%20Space%20Station%20(ISS).glb'
};

// --- Overlay Components ---

const UIOverlay: React.FC<{ 
  onScan: () => void;
  isScanning: boolean;
  report: EcosystemReport | null;
  setReport: (r: EcosystemReport | null) => void;
  currentModel: string;
  onModelChange: (url: string) => void;
}> = ({ onScan, isScanning, report, setReport, currentModel, onModelChange }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 md:p-10">
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
          <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <Orbit className="text-cyan-400 w-6 h-6 animate-pulse" />
            ISS <span className="text-cyan-400 font-light">TRACKER</span>
          </h1>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1">International Space Station Explorer</p>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <div className="hidden md:flex bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl flex-col items-end gap-1 shadow-2xl">
            <div className="flex items-center gap-2 text-[10px] text-cyan-400/70">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
              LIVE TELEMETRY
            </div>
            <div className="text-xs font-mono text-white/60 uppercase">
              {currentModel === MODELS.VERSION_A ? 'ALPHA-01' : currentModel === MODELS.VERSION_B ? 'BRAVO-02' : 'DELTA-04'}
            </div>
          </div>
        </div>
      </div>

      {/* Center Reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/5 rounded-full w-24 h-24 flex items-center justify-center opacity-10">
        <div className="w-1 h-1 bg-cyan-500 rounded-full shadow-[0_0_10px_cyan]" />
      </div>

      {/* Bottom Interface */}
      <div className="relative flex flex-col md:flex-row gap-6 items-end justify-between pointer-events-auto w-full">
        {/* Left: Report section */}
        <div className="w-full md:w-1/4 z-20">
          {report && (
            <div className="bg-black/90 backdrop-blur-xl border border-cyan-500/30 p-6 rounded-2xl w-full md:w-96 animate-in slide-in-from-bottom-5 fade-in duration-300 shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-cyan-400">{report.species}</h2>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">{report.scientificName}</p>
                </div>
                <button onClick={() => setReport(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-4 h-4 text-white/50" />
                </button>
              </div>
              <div className="space-y-4">
                <div className={`text-[10px] px-2 py-0.5 rounded border inline-block ${
                  report.health === 'Healthy' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                  'bg-orange-500/10 border-orange-500/30 text-orange-400'
                }`}>
                  STATUS: {report.health.toUpperCase()}
                </div>
                <p className="text-sm text-white/70 leading-relaxed font-light">
                  {report.description}
                </p>
                <div className="bg-cyan-950/20 border border-cyan-500/10 p-3 rounded-lg text-xs flex gap-3 italic text-cyan-200/60">
                  <Terminal className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span>{report.funFact}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center: Model Selector Dock - Absolutely Centered */}
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 z-30 flex flex-col items-center gap-4">
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl flex gap-1.5 shadow-2xl">
            <button 
              onClick={() => onModelChange(MODELS.VERSION_A)}
              className={`px-4 py-3 rounded-xl text-[11px] font-bold uppercase transition-all flex items-center gap-2 ${currentModel === MODELS.VERSION_A ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              Model A
            </button>
            <button 
              onClick={() => onModelChange(MODELS.VERSION_B)}
              className={`px-4 py-3 rounded-xl text-[11px] font-bold uppercase transition-all flex items-center gap-2 ${currentModel === MODELS.VERSION_B ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              Model B
            </button>
            <button 
              onClick={() => onModelChange(MODELS.VERSION_D)}
              className={`px-4 py-3 rounded-xl text-[11px] font-bold uppercase transition-all flex items-center gap-2 ${currentModel === MODELS.VERSION_D ? 'bg-cyan-500 text-black shadow-[0_0_20_rgba(6,182,212,0.4)]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              Model D
            </button>
          </div>
        </div>

        {/* Right: Telemetry and Action button */}
        <div className="flex flex-col gap-3 items-end w-full md:w-1/4 z-20">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl text-[10px] space-y-2 text-white/50 w-full md:min-w-[240px] shadow-xl">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 uppercase tracking-tighter"><MapPin className="w-3 h-3 text-cyan-400" /> Orbital Pos</span>
              <span className="text-white font-mono">408KM ALT</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 uppercase tracking-tighter"><Rocket className="w-3 h-3 text-cyan-400" /> Velocity</span>
              <span className="text-white font-mono">27,600 KM/H</span>
            </div>
          </div>

          <button 
            disabled={isScanning}
            onClick={onScan}
            className={`
              w-full md:w-auto group relative flex items-center justify-center gap-3 px-12 py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs transition-all shadow-2xl
              ${isScanning ? 'bg-cyan-900/40 text-cyan-500 cursor-wait' : 'bg-white text-black hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] active:scale-95'}
            `}
          >
            <Scan className={`w-4 h-4 ${isScanning ? 'animate-spin' : 'group-hover:rotate-90 transition-transform'}`} />
            {isScanning ? 'Analyzing...' : 'Analyze Station'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Scene Component ---

const Scene = ({ modelUrl }: { modelUrl: string }) => {
  const isModelD = modelUrl === MODELS.VERSION_D;
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 15, 40]} fov={45} near={0.1} />
      <OrbitControls 
        autoRotate={false}
        enablePan={true}
        panSpeed={0.8}
        // Allow even more zoom for model D specifically
        minDistance={isModelD ? 0.2 : 2} 
        maxDistance={150} 
        enableDamping 
        dampingFactor={0.05}
      />
      
      <ambientLight intensity={0.15} />
      <directionalLight 
        position={[50, 30, 30]} 
        intensity={3.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-30, -10, -30]} intensity={1.5} color="#3366ff" />
      <pointLight position={[20, -20, 20]} intensity={0.5} color="#00ffff" />
      
      <color attach="background" args={['#000000']} />
      <Stars radius={200} depth={100} count={18000} factor={6} saturation={0} fade speed={0.4} />
      <Environment preset="night" />
      
      <Suspense fallback={null}>
        <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
          <Forest modelUrl={modelUrl} />
        </Float>
      </Suspense>

      <BakeShadows />

      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom 
          intensity={1.8} 
          luminanceThreshold={0.55} 
          luminanceSmoothing={0.15} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <ToneMapping />
      </EffectComposer>
    </>
  );
};

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState<EcosystemReport | null>(null);
  const [activeModel, setActiveModel] = useState(MODELS.VERSION_D);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setReport(null);
    
    const lat = (Math.random() - 0.5) * 180;
    const lng = (Math.random() - 0.5) * 360;

    const data = await generateEcosystemReport(lat, lng);
    setReport(data);
    setIsScanning(false);
  }, []);

  return (
    <div className="w-full h-screen bg-black select-none overflow-hidden text-white">
      <UIOverlay 
        onScan={handleScan} 
        isScanning={isScanning} 
        report={report} 
        setReport={setReport}
        currentModel={activeModel}
        onModelChange={setActiveModel}
      />
      
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ 
          antialias: true, 
          stencil: false, 
          alpha: false, 
          powerPreference: 'high-performance' 
        }}
        onContextMenu={(e) => e.preventDefault()} // Standard practice for right-click pan in apps
      >
        <Scene modelUrl={activeModel} />
      </Canvas>
      
      <Loader 
        containerStyles={{ background: '#000000' }} 
        innerStyles={{ width: '200px', height: '1px', background: '#333' }}
        barStyles={{ background: '#22d3ee', height: '1px' }}
        dataStyles={{ fontSize: '10px', color: '#22d3ee', marginTop: '10px', letterSpacing: '2px' }}
      />
    </div>
  );
}
