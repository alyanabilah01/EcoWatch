
import React, { useState, useRef, useEffect } from 'react';
import { analyzeScientificImage } from '../services/geminiService';
import { Post, AIAnalysisResult } from '../types';
import { MOCK_USER } from '../constants';

interface UploadAreaProps {
  onPostCreated: (post: Post) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onPostCreated }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsCameraOpen(true);
      setAiResult(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please ensure you have granted permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Use actual video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPreviewUrl(dataUrl);
        processImage(dataUrl);
        stopCamera();
      }
    }
  };

  const processImage = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const result: AIAnalysisResult = await analyzeScientificImage(base64);
      setAiResult(result);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Failed to analyze image. Please try again.");
      setPreviewUrl(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePublish = () => {
    if (!aiResult || !previewUrl) return;

    const newPost: Post = {
      id: `post-${Date.now()}`,
      userId: MOCK_USER.id,
      userName: MOCK_USER.name,
      userAvatar: MOCK_USER.avatar,
      userPoints: MOCK_USER.points,
      imageUrl: previewUrl,
      speciesName: aiResult.speciesName,
      scientificName: aiResult.scientificName,
      description: aiResult.description,
      habitat: aiResult.habitat,
      funFact: aiResult.funFact,
      caption: caption.trim() || undefined,
      timestamp: Date.now(),
      likes: 0,
      comments: [],
    };

    onPostCreated(newPost);
    setPreviewUrl(null);
    setAiResult(null);
    setCaption('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 transition-all">
      <div className="flex items-center gap-4 mb-4">
        <img src={MOCK_USER.avatar} alt="Me" className="w-10 h-10 rounded-full object-cover" />
        <button 
          onClick={startCamera}
          disabled={isAnalyzing || isCameraOpen}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-left px-4 py-2.5 rounded-full text-gray-500 text-sm transition-colors disabled:opacity-50"
        >
          {isAnalyzing ? "AI is identifying your find..." : "Document a new species discovery..."}
        </button>
      </div>

      {isCameraOpen && (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-4 border border-gray-200 shadow-inner">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
            <button 
              onClick={stopCamera}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-2 rounded-full font-bold text-sm transition-all border border-white/30"
            >
              Cancel
            </button>
            <button 
              onClick={capturePhoto}
              className="bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 border-4 border-white"
            >
              <div className="w-6 h-6 rounded-full border-2 border-white"></div>
            </button>
          </div>
          
          <div className="absolute top-4 left-4">
            <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded uppercase tracking-widest font-bold border border-white/20">
              Live Camera
            </span>
          </div>
        </div>
      )}

      {!previewUrl && !isCameraOpen && (
        <div className="flex border-t border-gray-100 pt-3">
          <button 
            onClick={startCamera}
            className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg text-sm font-semibold text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Capture Now
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg text-sm font-semibold text-gray-600 transition-colors">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Location
          </button>
        </div>
      )}

      {previewUrl && (
        <div className="space-y-4 mt-2 animate-fadeIn">
          <div className="relative rounded-lg overflow-hidden h-64 bg-gray-100 border border-gray-200">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-lg animate-pulse">Gemini analyzing...</p>
              </div>
            )}
            {!isAnalyzing && aiResult && (
              <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </div>
            )}
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Tell us about your discovery... (e.g., 'Found this near the old oak tree!')"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none resize-none min-h-[80px]"
          />

          <div className="flex gap-3">
            <button 
              onClick={() => {
                setPreviewUrl(null);
                setAiResult(null);
                setCaption('');
              }}
              className="flex-1 py-2.5 text-gray-600 font-bold text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handlePublish}
              disabled={isAnalyzing || !aiResult}
              className={`flex-[2] py-2.5 text-white font-bold text-sm rounded-lg shadow-md transition-all ${
                isAnalyzing || !aiResult 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 active:scale-95'
              }`}
            >
              {isAnalyzing ? "Waiting for ID..." : "Share Discovery (+100 pts)"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadArea;
