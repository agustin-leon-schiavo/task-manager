'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.needsVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        setError(err.response?.data?.message || 'Error al iniciar sesión. Revisa tus credenciales.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="glass w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-500/20 p-3 rounded-2xl mb-4">
            <LogIn className="text-indigo-400" size={32} />
          </div>
          <h1 className="text-3xl font-bold">Bienvenido</h1>
          <p className="text-slate-400 mt-2">Gestiona tus tareas con estilo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                placeholder="tu@email.com"
                className="input-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                className="input-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-indigo-400 font-semibold hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
