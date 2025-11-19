import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, AlertCircle, Command, Wand2, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { ImageState, AppStatus } from './types';
import { editImageWithGemini } from './services/geminiService';
import { downloadImage } from './utils/imageUtils';

const SUGGESTIONS = [
  "Remove the background completely",
  "Make the background a professional white studio",
  "Add a soft vintage filter",
  "Turn this into a pencil sketch",
  "Remove the text from the image",
  "Make the lighting more dramatic"
];

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null);
  const [editedImageBase64, setEditedImageBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleImageSelected = (image: ImageState) => {
    setOriginalImage(image);
    setEditedImageBase64(null);
    setStatus(AppStatus.IDLE);
    setError(null);
  };

  const handleClear = () => {
    setOriginalImage(null);
    setEditedImageBase64(null);
    setStatus(AppStatus.IDLE);
    setPrompt('');
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!originalImage?.base64 || !prompt.trim()) return;

    setStatus(AppStatus.LOADING);
    setError(null);
    setEditedImageBase64(null);

    try {
      const resultBase64 = await editImageWithGemini(
        originalImage.base64,
        originalImage.mimeType,
        prompt
      );
      setEditedImageBase64(resultBase64);
      setStatus(AppStatus.SUCCESS);
      
      // Scroll to result on mobile
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during generation.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleDownload = () => {
    if (editedImageBase64) {
      downloadImage(`data:image/png;base64,${editedImageBase64}`, `edited-image-${Date.now()}.png`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-dark-950 to-dark-900 text-slate-200">
      {/* Header */}
      <header className="border-b border-white/5 bg-dark-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-brand-500 to-purple-600 p-2 rounded-lg">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">PixelPerfect AI</span>
          </div>
          
          {originalImage && (
            <Button variant="ghost" onClick={handleClear} className="text-sm">
              <RotateCcw className="w-4 h-4 mr-2" /> Start Over
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Input & Controls */}
        <div className="w-full lg:w-5/12 space-y-6 flex flex-col">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white leading-tight">
              Transform images with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">Text Prompts</span>
            </h1>
            <p className="text-slate-400">
              Upload an image and describe how you want to change it using Gemini 2.5 Flash Image.
            </p>
          </div>

          {/* Uploader */}
          <ImageUploader 
            onImageSelected={handleImageSelected} 
            currentImage={originalImage}
            onClear={handleClear}
          />

          {/* Prompt Input - Only show if image is uploaded */}
          {originalImage && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
              <form onSubmit={handleSubmit} className="relative">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-purple-600 rounded-xl blur opacity-25 group-focus-within:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="Describe your edit (e.g., 'Remove the background' or 'Add a neon glow')"
                    className="relative w-full bg-dark-900 border border-dark-700 rounded-xl p-4 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:bg-dark-800 transition-all resize-none h-32 shadow-xl"
                    disabled={status === AppStatus.LOADING}
                  />
                  <div className="absolute bottom-3 right-3">
                     <Button 
                        type="submit" 
                        disabled={!prompt.trim() || status === AppStatus.LOADING}
                        className="rounded-lg !p-2"
                     >
                       {status === AppStatus.LOADING ? <span className="sr-only">Loading</span> : <Sparkles className="w-5 h-5" />}
                     </Button>
                  </div>
                </div>
              </form>

              {/* Suggestions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Try these prompts</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(s)}
                      className="text-xs bg-dark-800 hover:bg-dark-700 border border-dark-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl flex items-start gap-3 text-red-200">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="w-full lg:w-7/12 min-h-[400px] relative lg:sticky lg:top-24" ref={resultRef}>
           {!originalImage ? (
             /* Empty State */
             <div className="w-full h-full min-h-[400px] border-2 border-dashed border-dark-800 rounded-3xl flex flex-col items-center justify-center text-slate-600 bg-dark-900/30">
               <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
               <p className="text-lg font-medium">Your masterpiece awaits</p>
               <p className="text-sm opacity-60">Upload an image to start editing</p>
             </div>
           ) : (
             /* Result Area */
             <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-[600px] bg-dark-950 rounded-3xl overflow-hidden border border-dark-800 shadow-2xl group">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}></div>

                {status === AppStatus.LOADING ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-dark-950/80 backdrop-blur-sm">
                      <div className="relative">
                        <div className="w-24 h-24 border-t-4 border-brand-500 border-solid rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Sparkles className="w-8 h-8 text-brand-400 animate-pulse" />
                        </div>
                      </div>
                      <p className="mt-6 text-lg font-medium text-white animate-pulse">Gemini is dreaming...</p>
                      <p className="text-sm text-slate-400 mt-2 max-w-xs text-center">Generating new pixels based on your vision.</p>
                   </div>
                ) : status === AppStatus.SUCCESS && editedImageBase64 ? (
                   <>
                    <img 
                      src={`data:image/png;base64,${editedImageBase64}`} 
                      alt="Edited Result" 
                      className="relative z-10 w-full h-full object-contain animate-in fade-in duration-700"
                    />
                    <div className="absolute bottom-6 right-6 z-20 flex gap-3">
                      <Button onClick={handleDownload} variant="primary" icon={<Download className="w-4 h-4"/>}>
                        Download
                      </Button>
                    </div>
                    <div className="absolute top-6 left-6 z-20 px-3 py-1 bg-brand-600/90 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-lg">
                       AI Generated
                    </div>
                   </>
                ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-slate-500">
                      <Command className="w-12 h-12 mb-3 opacity-30" />
                      <p>Ready to process</p>
                   </div>
                )}
             </div>
           )}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12 py-8 bg-dark-950">
         <div className="max-w-6xl mx-auto px-4 text-center text-slate-600 text-sm">
           <p>Powered by Google Gemini 2.5 Flash Image API</p>
         </div>
      </footer>
    </div>
  );
};

export default App;