import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true
}: ConfirmationModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="glass-card w-full max-w-sm relative z-10 border-white/5 shadow-2xl overflow-hidden"
          >
            {/* Header / Accent Bar */}
            <div className={`h-1.5 w-full ${isDestructive ? 'bg-red-500' : 'bg-primary'}`} />
            
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                  isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                }`}>
                  <AlertTriangle size={32} />
                </div>
                
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2 text-white">
                  {title}
                </h3>
                
                <p className="text-sm text-white/50 mb-8 leading-relaxed">
                  {message}
                </p>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button 
                    onClick={onClose}
                    className="py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-white/5"
                  >
                    {cancelText}
                  </button>
                  <button 
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white shadow-lg transition-all ${
                      isDestructive 
                        ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20' 
                        : 'bg-primary hover:bg-primary/80 text-black shadow-primary/20'
                    }`}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </div>

            {/* Close Button Top Right */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
