import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Loader2, X } from 'lucide-react';
import { VisionState } from '../types';
import { analyzeImage } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

export const VisionInterface: React.FC = () => {
  const [visionState, setVisionState] = useState<VisionState>({ image: null, mimeType: null });
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setVisionState({
        image: ev.target?.result as string,
        mimeType: file.type
      });
      setResult(''); // Clear previous result
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!visionState.image || !visionState.mimeType) return;
    
    setIsLoading(true);
    setResult('');
    
    try {
      const responseText = await analyzeImage(visionState.image, visionState.mimeType, prompt);
      setResult(responseText);
    } catch (error) {
      console.error("Vision error", error);
      setResult("Error analyzing image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setVisionState({ image: null, mimeType: null });
    setResult('');
    setPrompt('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col md:flex-row p-4 gap-6 overflow-hidden">
      {/* Left Panel: Upload & Preview */}
      <div className="flex-1 flex flex-col gap-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <ImageIcon className="text-purple-400" /> Image Input
        </h2>
        
        {!visionState.image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-slate-800 transition-all group"
          >
            <div className="p-4 bg-slate-700 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} className="text-slate-400 group-hover:text-purple-400" />
            </div>
            <p className="text-slate-400 font-medium">Click to upload an image</p>
            <p className="text-slate-500 text-sm mt-2">Supports JPG, PNG, WebP</p>
          </div>
        ) : (
          <div className="flex-1 relative rounded-xl overflow-hidden bg-black flex items-center justify-center group">
            <img src={visionState.image} alt="Preview" className="max-w-full max-h-full object-contain" />
            <button 
              onClick={clearImage}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500/80 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
            >
              <X size={20} />
            </button>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
        />

        <div className="space-y-3">
          <label className="text-sm text-slate-400 font-medium ml-1">Prompt (Optional)</label>
          <div className="relative">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Describe the scenery..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          <button 
            onClick={handleAnalyze}
            disabled={!visionState.image || isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </button>
        </div>
      </div>

      {/* Right Panel: Results */}
      <div className="flex-1 flex flex-col bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 min-h-[300px]">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
          <Sparkles className="text-amber-400" /> Analysis Result
        </h2>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {result ? (
            <div className="prose prose-invert prose-lg max-w-none text-slate-200 leading-relaxed">
              <ReactMarkdown>
                {result}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 italic">
              Result will appear here...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};