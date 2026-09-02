import { useEffect, useState } from 'react';
import { Users, ShieldCheck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { backendGet } from '../api/backend';

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  createdAtUtc: string;
  emailConfirmed: boolean;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    backendGet<AdminUser[]>('/api/admin/users')
      .then(setUsers)
      .catch(() => setError('No tienes permisos para ver esta sección o no se pudo cargar.'))
      .finally(() => setLoading(false));
  }, []);

  return <div className="space-y-6 max-w-lg mx-auto pb-8">
    <Helmet><title>Usuarios | FitPlanner Pro</title></Helmet>
    <header>
      <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest">Administración</h2>
      <h1 className="text-3xl font-black tracking-tight italic uppercase">Usuarios</h1>
    </header>
    {loading ? <div className="py-20 text-center text-white/30 animate-pulse">Cargando usuarios…</div> : error ? <div className="glass-card p-5 text-sm text-red-300">{error}</div> : <div className="space-y-3">
      <div className="flex items-center gap-3 text-primary text-sm font-bold"><Users size={18} /> {users.length} usuarios registrados</div>
      {users.map((user) => <div key={user.id} className="glass-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><ShieldCheck size={18} /></div>
        <div className="min-w-0"><p className="font-bold truncate">{user.displayName || 'Sin nombre'}</p><p className="text-xs text-white/40 truncate">{user.email}</p><p className="text-[10px] text-white/25 uppercase">Registrado {new Date(user.createdAtUtc).toLocaleDateString('es-BO')}</p></div>
      </div>)}
    </div>}
  </div>;
}
