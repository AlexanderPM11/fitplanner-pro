import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Sparkles } from 'lucide-react';

const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
      if (r) {
        r.update();
        setInterval(() => {
          r.update();
        }, 5 * 60 * 1000); // Check every 5 minutes
      }
    },
    onRegisterError(error) {
      console.log('SW registration error: ', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(needRefresh || offlineReady) && (
        <motion.div
          initial={{ y: -50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -50, opacity: 0, scale: 0.95 }}
          className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[100] flex justify-center"
        >
          <div className="glass-card bg-black/90 backdrop-blur-2xl border-primary/30 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4 w-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 animate-pulse">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="font-black italic uppercase tracking-tight text-sm text-white">
                    {needRefresh ? '¡Actualización Lista!' : 'Listo para Usar Offline'}
                  </h4>
                  <p className="text-[11px] text-white/50 font-medium leading-relaxed mt-0.5">
                    {needRefresh
                      ? 'Hay una nueva versión disponible con mejoras y correcciones.'
                      : 'La aplicación ha sido optimizada para funcionar sin conexión.'}
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                className="p-1.5 hover:bg-white/5 text-white/30 hover:text-white rounded-xl transition-colors"
                aria-label="Cerrar aviso"
              >
                <X size={16} />
              </button>
            </div>

            {needRefresh && (
              <div className="flex gap-3">
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="flex-1 py-3 px-4 bg-primary text-black rounded-2xl text-xs font-black italic uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(0,242,255,0.35)] flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} className="animate-spin-slow" />
                  Instalar Cambios
                </button>
                <button
                  onClick={close}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white/70 rounded-2xl text-xs font-black italic uppercase tracking-widest transition-all"
                >
                  Más tarde
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReloadPrompt;
