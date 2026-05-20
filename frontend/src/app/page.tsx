'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  Clock,
  Paperclip,
  Pencil
} from 'lucide-react';
import TaskModal from '@/components/TaskModal';
import KanbanBoard from '@/components/KanbanBoard';
import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  fileUrl?: string;
}

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const handleEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTaskToEdit(null);
  };

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchTasks();
    }
  }, [user, loading, router]);

  const fetchTasks = async () => {
    try {
      setFetching(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await api.get('/tasks', { params });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleTaskMove = async (taskId: string, newStatus: Task['status']) => {
    // Actualización optimista
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
      fetchTasks(); // Revertir en caso de error
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('¿Mover esta tarea a la papelera?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks(); // Refrescar lista
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Ejecutar búsqueda cuando cambien los filtros
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (user) fetchTasks();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, priorityFilter]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  const pendingTasksCount = tasks.filter(t => t.status !== 'done').length;
  const username = user.email.split('@')[0];
  const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);

  return (
    <div className="max-w-6xl mx-auto p-6 w-full">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            {t('greeting')}, {capitalizedUsername}
          </h1>
          <p className="text-slate-400 mt-1">
            {pendingTasksCount === 0 
              ? t('pending_tasks_zero')
              : pendingTasksCount === 1 
                ? t('pending_tasks_one') 
                : t('pending_tasks_many', { count: pendingTasksCount })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
          >
            <Plus size={20} />
            {t('new_task')}
          </button>
          <Link 
            href="/trash"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-all border border-white/5"
            title={t('trash')}
          >
            <Trash2 size={20} />
            <span className="font-medium hidden sm:inline">{t('trash')}</span>
          </Link>
          <button 
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-white/5"
            title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          >
            <Globe size={20} />
            <span className="font-medium uppercase">{language}</span>
          </button>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all border border-white/5"
          >
            <LogOut size={20} />
            <span className="font-medium hidden sm:inline">{t('logout')}</span>
          </button>
        </div>
      </header>

      {/* Toolbar: Buscador y Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder={t('search_placeholder')}
            className="input-icon"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <select 
            className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white appearance-none outline-none focus:border-indigo-500 transition-all"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">{t('all_priorities')}</option>
            <option value="high">{t('priority_high')}</option>
            <option value="medium">{t('priority_medium')}</option>
            <option value="low">{t('priority_low')}</option>
          </select>
        </div>
      </div>

      {/* Lista de Tareas (Kanban) */}
      <div className="mt-8">
        {fetching ? (
          <p className="text-slate-500 text-center py-10">{t('updating_tasks')}</p>
        ) : (
          <KanbanBoard 
            tasks={tasks} 
            onTaskMove={handleTaskMove}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onTaskCreated={fetchTasks}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}
