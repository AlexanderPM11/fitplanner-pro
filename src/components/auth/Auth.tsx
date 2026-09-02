import React, { useState } from 'react';
import { Dumbbell, Mail, Lock, User as UserIcon, ArrowLeft, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNotification } from '../../context/NotificationContext';
import { backendRequest } from '../../api/backend';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useNotification();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await backendRequest<{ token?: string }> (isSignUp ? '/api/auth/register' : '/api/auth/login', isSignUp
        ? { email, password, displayName: fullName }
        : { email, password });
      if (result.token) localStorage.setItem('fitplanner_token', result.token);
      showToast(isSignUp ? 'Cuenta creada. Bienvenido a FitPlanner.' : 'Sesión iniciada.', 'success');
      window.location.reload();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await backendRequest('/api/auth/forgot-password', { email, frontendUrl: window.location.origin });
      showToast('Si existe una cuenta, recibirás un correo con los pasos.', 'success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el correo.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Helmet>
        <title>{isSignUp ? 'Únete a FitPlanner Pro' : 'Iniciar Sesión | FitPlanner Pro'}</title>
        <meta name="description" content="La herramienta definitiva para atletas serios. Regístrate o inicia sesión para empezar a dominar tus entrenamientos." />
      </Helmet>
        <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Dumbbell size={80} />
        </div>

          <div className="text-center mb-8">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-background shadow-[0_0_30px_rgba(199,243,107,.2)]"><Dumbbell size={28} /></div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-[-0.06em]">
            FitPlanner <span className="text-primary">Pro</span>
          </h1>
          <p className="text-white/50 text-sm">
            {isRecovering ? 'Recupera el acceso a tu cuenta' : isSignUp ? 'Tu entrenamiento empieza aquí' : 'Tu progreso te estaba esperando'}
          </p>
        </div>

        <form onSubmit={isRecovering ? handleRecovery : handleAuth} className="space-y-4">
          {isSignUp && !isRecovering && (
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
              <input
                type="text"
                placeholder="Nombre completo"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:border-primary outline-none transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input
              type="email"
                placeholder="Correo electrónico"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:border-primary outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {!isRecovering && <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input
              type="password"
              placeholder="Contraseña (mínimo 8 caracteres)"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:border-primary outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>}

          {error && (
            <div className="text-red-400 text-xs bg-red-400/10 p-3 rounded-xl border border-red-400/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? 'Procesando…' : (isRecovering ? 'Enviar instrucciones' : isSignUp ? 'Crear mi cuenta' : 'Entrar a mi cuenta')}
          </button>
        </form>

        {!isSignUp && !isRecovering && <button type="button" onClick={() => setIsRecovering(true)} className="mt-5 flex w-full items-center justify-center gap-2 text-sm text-white/45 transition-colors hover:text-primary"><KeyRound size={15}/> ¿Olvidaste tu contraseña?</button>}

        {isRecovering && <button type="button" onClick={() => setIsRecovering(false)} className="mt-5 flex w-full items-center justify-center gap-2 text-sm text-white/45 transition-colors hover:text-primary"><ArrowLeft size={15}/> Volver al inicio de sesión</button>}

        {!isRecovering && <div className="mt-8 text-center text-sm">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-white/50 hover:text-primary transition-colors font-medium"
          >
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿Aún no tienes cuenta? Regístrate'}
          </button>
        </div>}
      </motion.div>
    </div>
  );
};

export default Auth;
