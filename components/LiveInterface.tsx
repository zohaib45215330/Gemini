import React from 'react';
import { Mic, MicOff, Activity, AlertCircle } from 'lucide-react';
import { useLiveSession } from '../hooks/useLiveSession';

export const LiveInterface: React.FC = () => {
  const { isConnected, error, volume, connect, disconnect } = useLiveSession();

  const handleToggle = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  // Simple visualizer bars
  const bars = 5;
  const getBarHeight = (index: number) => {
    if (!isConnected) return 'h-2';
    // Create a wave effect based on volume and index
    const baseHeight = 20;
    const varying = volume * 100 * (1 + Math.sin(Date.now() / 200 + index)); 
    // Clamp
    const h = Math.min(100, Math.max(10, baseHeight + varying));
    return `${h}%`;
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-white relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isConnected ? 'opacity-20' : 'opacity-0'}`}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full blur-[128px]" />
        </div>

        <div className="z-10 flex flex-col items-center gap-8 max-w-md w-full">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Gemini Live</h2>
                <p className="text-slate-400">Real-time multimodal voice interaction</p>
            </div>

            {/* Main Interaction Circle */}
            <div className="relative group">
                 {/* Ripple Effect */}
                {isConnected && (
                    <>
                    <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20" />
                    <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-pulse" />
                    </>
                )}
                
                <button
                    onClick={handleToggle}
                    className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                        isConnected 
                        ? 'bg-red-500 hover:bg-red-600 shadow-red-900/50' 
                        : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/50'
                    }`}
                >
                    {isConnected ? <MicOff size={48} /> : <Mic size={48} />}
                </button>
            </div>

            {/* Status & Visualizer */}
            <div className="h-24 w-full flex items-center justify-center gap-2">
                {isConnected ? (
                    <div className="flex items-center gap-1.5 h-16">
                        {[...Array(bars)].map((_, i) => (
                             <div 
                                key={i}
                                className="w-3 bg-blue-400 rounded-full transition-all duration-75"
                                style={{ height: getBarHeight(i) }}
                             />
                        ))}
                    </div>
                ) : (
                    <div className="text-slate-500 font-medium flex items-center gap-2">
                        <Activity size={20} />
                        <span>Ready to connect</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-900/50">
                    <AlertCircle size={18} />
                    <span className="text-sm">{error}</span>
                </div>
            )}
            
            <div className="text-xs text-slate-500 text-center max-w-xs">
                Ensure your microphone permissions are granted. This uses the Gemini Live API with low-latency Websockets.
            </div>
        </div>
    </div>
  );
};
