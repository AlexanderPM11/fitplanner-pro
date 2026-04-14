import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Activity } from 'lucide-react';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

const MediaModal: React.FC<MediaModalProps> = ({ isOpen, onClose, url, title }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col p-4 md:p-12 items-center justify-center"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black tracking-widest text-primary mb-1 flex items-center">
                <Activity size={12} className="mr-2" /> Técnica Pro
              </span>
              <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white">{title}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all active:scale-95"
            >
              <X size={24} />
            </button>
          </div>

          {/* Media Content */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-[0_0_50px_rgba(0,195,195,0.1)]"
          >
            {url.includes('.mp4') || url.includes('.webm') || url.includes('video') ? (
              <video 
                src={url} 
                className="w-full h-full object-contain" 
                autoPlay 
                loop 
                muted 
                playsInline 
                controls 
              />
            ) : (
              <img 
                src={url} 
                alt={title} 
                className="w-full h-full object-contain" 
              />
            )}
          </motion.div>

          {/* Footer Info */}
          <div className="mt-8 text-center text-white/30 text-xs font-bold uppercase tracking-widest">
            Toca fuera o usa el botón de cierre para volver al entrenamiento
          </div>
          
          {/* Click backdrop to close */}
          <div className="absolute inset-0 -z-10" onClick={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MediaModal;
