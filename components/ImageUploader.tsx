import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { fileToBase64 } from '../utils/imageUtils';
import { ImageState } from '../types';

interface ImageUploaderProps {
  onImageSelected: (image: ImageState) => void;
  currentImage: ImageState | null;
  onClear: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, currentImage, onClear }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      onImageSelected({
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
        mimeType: file.type,
      });
    } catch (err) {
      console.error('Error processing file', err);
    }
  }, [onImageSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  if (currentImage?.previewUrl) {
    return (
      <div className="relative group w-full max-w-md mx-auto aspect-square bg-dark-800 rounded-2xl overflow-hidden border border-dark-700 shadow-2xl">
        <img 
          src={currentImage.previewUrl} 
          alt="Original" 
          className="w-full h-full object-contain bg-checkerboard" 
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button 
            onClick={onClear}
            className="bg-red-500/90 text-white px-4 py-2 rounded-full flex items-center hover:bg-red-500 transition-colors backdrop-blur-sm"
          >
            <X className="w-4 h-4 mr-2" /> Remove Image
          </button>
        </div>
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-xs font-medium text-white border border-white/10">
          Original
        </div>
      </div>
    );
  }

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`w-full max-w-md mx-auto aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden
        ${isDragging 
          ? 'border-brand-500 bg-brand-500/10 scale-[1.02]' 
          : 'border-dark-600 bg-dark-800/50 hover:border-brand-500/50 hover:bg-dark-800'
        }`}
    >
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleChange} 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      <div className="bg-dark-700 p-4 rounded-full mb-4 text-brand-400 shadow-inner">
        {isDragging ? <ImageIcon className="w-8 h-8 animate-bounce" /> : <Upload className="w-8 h-8" />}
      </div>
      
      <h3 className="text-lg font-semibold text-slate-200 mb-1">
        {isDragging ? 'Drop it here!' : 'Upload an image'}
      </h3>
      <p className="text-sm text-slate-400 text-center px-8">
        Drag and drop or click to select.<br/> Supports JPG, PNG, WebP.
      </p>
    </div>
  );
};