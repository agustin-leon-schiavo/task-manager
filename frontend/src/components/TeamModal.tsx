'use client';

import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { X, Users, Search, UserCheck, UserMinus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface User {
  id: string;
  email: string;
  role: string;
  adminId?: string | null;
  createdAt: string;
}

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamUpdated: () => void;
}

export default function TeamModal({ isOpen, onClose, onTeamUpdated }: TeamModalProps) {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      // Filtramos para no mostrar al administrador logueado
      const filteredUsers = response.data.filter((u: User) => u.id !== currentUser?.id);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMember = async (targetUser: User) => {
    const isMember = targetUser.adminId === currentUser?.id;
    setActionLoadingId(targetUser.id);
    try {
      // Si ya es miembro, enviamos adminId como null, de lo contrario enviamos el ID del admin actual
      const nextAdminId = isMember ? null : currentUser?.id;
      await api.put(`/users/${targetUser.id}/assign-admin`, { adminId: nextAdminId });
      
      // Actualizar estado local
      setUsers(prev => prev.map(u => 
        u.id === targetUser.id ? { ...u, adminId: nextAdminId } : u
      ));
      onTeamUpdated();
    } catch (error) {
      console.error('Error updating user assignment:', error);
      alert('Error al actualizar la asignación del usuario');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  const filteredUsersList = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass w-full max-w-lg relative animate-in fade-in zoom-in duration-300 flex flex-col max-h-[80vh] overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors z-10 bg-slate-900/50 p-1 rounded-full backdrop-blur-md"
        >
          <X size={24} />
        </button>

        <div className="p-8 flex flex-col h-full overflow-hidden">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Users className="text-indigo-400" />
            {t('modal_manage_team')}
          </h2>

          {/* Buscador de usuarios */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder={t('search_users_placeholder') || 'Buscar usuarios por email...'}
              className="input-icon w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lista de usuarios */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-[300px] max-h-[45vh]">
            {loading ? (
              <p className="text-slate-500 text-center py-10">{t('updating_tasks')}</p>
            ) : filteredUsersList.length === 0 ? (
              <p className="text-slate-500 text-center py-10">No se encontraron usuarios</p>
            ) : (
              filteredUsersList.map((u) => {
                const isMySubordinate = u.adminId === currentUser?.id;
                return (
                  <div 
                    key={u.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isMySubordinate 
                        ? 'bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/30' 
                        : 'bg-slate-950/40 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div>
                      <p className="text-white font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-[280px]">
                        {u.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full capitalize">
                          {u.role}
                        </span>
                        {u.adminId && !isMySubordinate && (
                          <span className="text-[10px] text-amber-500/70 font-medium">
                            En otro equipo
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleToggleMember(u)}
                      disabled={actionLoadingId === u.id}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isMySubordinate
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                          : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {actionLoadingId === u.id ? (
                        <span className="h-3 w-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                      ) : isMySubordinate ? (
                        <>
                          <UserMinus size={14} />
                          {t('team_remove') || 'Quitar'}
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} />
                          {t('team_add') || 'Añadir'}
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition-all text-sm"
            >
              {t('modal_cancel') || 'Cerrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
