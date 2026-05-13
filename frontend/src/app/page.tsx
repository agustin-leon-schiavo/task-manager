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

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  fileUrl?: string;
}

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
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

  const toggleComplete = async (task: Task) => {
    try {
      await api.put(`/tasks/${task.id}`, { completed: !task.completed });
      fetchTasks(); // Refrescar lista
    } catch (error) {
      console.error('Error toggling task:', error);
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

  return (
    <div className="max-w-6xl mx-auto p-6 w-full">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Hola, {user.email.split('@')[0]}
          </h1>
          <p className="text-slate-400 mt-1">
            Tienes {tasks.length} {tasks.length === 1 ? 'tarea pendiente' : 'tareas pendientes'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
          >
            <Plus size={20} />
            Nueva Tarea
          </button>
          <Link 
            href="/trash"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-all border border-white/5"
            title="Papelera"
          >
            <Trash2 size={20} />
            <span className="font-medium">Papelera</span>
          </Link>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all border border-white/5"
          >
            <LogOut size={20} />
            <span className="font-medium">Salir</span>
          </button>
        </div>
      </header>

      {/* Toolbar: Buscador y Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar tareas..." 
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
            <option value="">Todas las prioridades</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
      </div>

      {/* Lista de Tareas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fetching ? (
          <p className="text-slate-500 col-span-full text-center py-10">Actualizando tareas...</p>
        ) : tasks.length > 0 ? (
          tasks.map(task => (
            <div key={task.id} className="glass p-6 hover:border-indigo-500/50 transition-all group flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {task.priority}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(task)}
                    className="text-slate-500 hover:text-indigo-400 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(task.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                    title="Borrar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <h3 className={`text-xl font-semibold mb-2 ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                {task.title}
              </h3>
              <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                {task.description || 'Sin descripción'}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <button 
                  onClick={() => toggleComplete(task)}
                  className="flex items-center gap-2 text-slate-500 text-sm hover:text-white transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="text-emerald-500" size={18} />
                  ) : (
                    <Clock size={18} />
                  )}
                  <span>{task.completed ? 'Completada' : 'Pendiente'}</span>
                </button>
                
                {task.fileUrl && (
                  <a 
                    href={task.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <Paperclip size={18} />
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 glass">
            <p className="text-slate-400">No se encontraron tareas</p>
          </div>
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
