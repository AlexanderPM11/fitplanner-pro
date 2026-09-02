import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import { backendRequest } from '../api/backend';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    try {
      await backendRequest('/api/auth/reset-password', { email: params.get('email'), token: params.get('token'), newPassword: password });
      setDone(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.'); }
  }

  return <div className="min-h-screen flex items-center justify-center p-5"><div className="glass-card w-full max-w-md p-8">
    <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-background"><KeyRound size={26}/></div>
    {done ? <div className="text-center"><CheckCircle2 className="mx-auto mb-4 text-primary" size={40}/><h1 className="text-2xl font-black">Contraseña actualizada</h1><p className="mt-2 text-sm text-white/50">Ya puedes volver a entrar con tus nuevas credenciales.</p><button className="btn-primary mt-6 w-full" onClick={() => navigate('/')}>Ir a iniciar sesión</button></div> : <><h1 className="text-2xl font-black">Crea una nueva contraseña</h1><p className="mt-2 text-sm text-white/50">Usa al menos 8 caracteres para proteger tu cuenta.</p><form onSubmit={submit} className="mt-6 space-y-4"><input autoFocus required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nueva contraseña" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-primary"/>{error && <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300">{error}</p>}<button className="btn-primary w-full">Guardar contraseña</button></form></>}
  </div></div>;
}
