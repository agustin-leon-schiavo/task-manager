'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import api from '@/services/api';

function VerifyEmailForm() {
  const { verifyEmail } = useAuth();
  const searchParams = useSearchParams();
  
  const emailParam = searchParams?.get('email') || '';
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Temporizador para el reenvío de código
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (code.length !== 6) {
      setError('El código debe ser de 6 dígitos');
      return;
    }

    setIsSubmitting(true);

    try {
      await verifyEmail(email, code);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código de verificación incorrecto o expirado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setMessage('');

    try {
      const res = await api.post('/auth/resend-code', { email });
      setMessage(res.data.message || 'Código reenviado con éxito.');
      setResendCooldown(60); // 60 segundos de espera
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al reenviar el código.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 ml-1">Correo Electrónico</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="email"
            placeholder="tu@email.com"
            className="input-icon"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={!!emailParam}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 ml-1 text-center block">Código de 6 dígitos</label>
        <input
          type="text"
          maxLength={6}
          placeholder="000000"
          className="text-center text-3xl tracking-[12px] font-bold py-4 uppercase border-white/20 bg-slate-950/80 rounded-xl"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
          required
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-sm text-center">
          {message}
        </div>
      )}

      <button
        type="submit"
        className="btn-primary w-full py-4 flex items-center justify-center gap-2"
        disabled={isSubmitting || code.length !== 6}
      >
        {isSubmitting ? 'Verificando...' : 'Verificar Cuenta'}
      </button>

      <div className="flex flex-col items-center gap-4 pt-2">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 transition-colors bg-transparent border-none p-0 cursor-pointer"
        >
          <RefreshCw size={16} />
          {resendCooldown > 0 
            ? `Reenviar código en ${resendCooldown}s` 
            : 'Reenviar código de verificación'}
        </button>
        
        <Link 
          href="/login" 
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al Inicio de Sesión
        </Link>
      </div>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="glass w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-500/20 p-3 rounded-2xl mb-4 animate-pulse">
            <ShieldCheck className="text-indigo-400" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-center">Verificación de Correo</h1>
          <p className="text-slate-400 mt-2 text-center text-sm">
            Ingresa el código OTP de 6 dígitos que enviamos a tu bandeja de entrada.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
          </div>
        }>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
