'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import Link from 'next/link';
import { 
  ArrowLeft, 
  RotateCcw, 
  Trash2, 
  Info,
  Trash
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  deletedAt: string;
}

export default function TrashPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchDeletedTasks();
    }
  }, [user, loading, router]);

  const fetchDeletedTasks = async () => {
    try {
      setFetching(true);
      const response = await api.get('/tasks/deleted');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching deleted tasks:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleRestore = async (taskId: string) => {
    try {
      await api.patch(`/tasks/${taskId}/restore`);
      fetchDeletedTasks();
    } catch (error) {
      console.error('Error restoring task:', error);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('¿Estás seguro de que quieres vaciar la papelera? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete('/tasks/empty');
      setTasks([]);
    } catch (error) {
      console.error('Error emptying trash:', error);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 w-full">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Papelera</h1>
            <p className="text-slate-400">Tareas eliminadas recientemente</p>
          </div>
        </div>

        {tasks.length > 0 && (
          <button 
            onClick={handleEmptyTrash}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all"
          >
            <Trash2 size={18} />
            Vaciar Papelera
          </button>
        )}
      </header>

      <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl mb-8 flex gap-3 items-center text-indigo-300 text-sm">
        <Info size={20} />
        <p>Las tareas en la papelera se eliminarán automáticamente después de 30 días.</p>
      </div>

      <div className="space-y-4">
        {fetching ? (
          <p className="text-center py-10 text-slate-500">Cargando papelera...</p>
        ) : tasks.length > 0 ? (
          tasks.map(task => (
            <div key={task.id} className="glass p-5 flex items-center justify-between group">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">{task.title}</h3>
                <p className="text-sm text-slate-500">Eliminada el: {new Date(task.deletedAt).toLocaleDateString()}</p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleRestore(task.id)}
                  className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
                  title="Restaurar"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 glass opacity-50">
            <Trash className="mx-auto mb-4 text-slate-600" size={48} />
            <p className="text-slate-400 text-lg">La papelera está vacía</p>
          </div>
        )}
      </div>
    </div>
  );
}
