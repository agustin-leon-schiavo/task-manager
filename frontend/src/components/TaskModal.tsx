'use client';

import React, { useState } from 'react';
import api from '@/services/api';
import { X, Upload, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
  subtasks?: Subtask[];
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  taskToEdit?: Task | null;
}

export default function TaskModal({ isOpen, onClose, onTaskCreated, taskToEdit }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'done'>('todo');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  // Efecto para cargar los datos si estamos editando
  React.useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status || 'todo');
      setDueDate(taskToEdit.dueDate || '');
      setSubtasks(taskToEdit.subtasks || []);
      setNewSubtaskTitle('');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setDueDate('');
      setSubtasks([]);
      setNewSubtaskTitle('');
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('priority', priority);
      formData.append('status', status);
      if (dueDate) formData.append('dueDate', dueDate);
      formData.append('subtasks', JSON.stringify(subtasks));
      
      if (file) {
        formData.append('file', file);
      }

      if (taskToEdit) {
        // Modo Edición
        await api.put(`/tasks/${taskToEdit.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Modo Creación
        await api.post('/tasks', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      onTaskCreated();
      onClose();
    } catch (error) {
      console.error('Error al crear la tarea:', error);
      alert(t('error_create'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass w-full max-w-lg relative animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors z-10 bg-slate-900/50 p-1 rounded-full backdrop-blur-md"
        >
          <X size={24} />
        </button>

        <div className="p-8 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <CheckCircle2 className="text-indigo-400" />
            {taskToEdit ? t('modal_edit_task') : t('modal_new_task')}
          </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">{t('modal_title')}</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('modal_title_placeholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">{t('modal_desc')}</label>
            <textarea 
              className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-base outline-none focus:border-indigo-500 transition-all min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('modal_desc_placeholder')}
            />
          </div>

          {/* Subtasks Section */}
          <div className="border-t border-white/5 pt-5">
            <label className="block text-sm font-medium text-slate-400 mb-3">{t('modal_subtasks')}</label>
            
            {subtasks.length > 0 && (
              <div className="space-y-2 mb-3 max-h-[180px] overflow-y-auto pr-1">
                {subtasks.map((sub) => (
                  <div 
                    key={sub.id} 
                    className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => {
                        setSubtasks(subtasks.map(s => s.id === sub.id ? { ...s, completed: !s.completed } : s));
                      }}
                      className="w-4 h-4 rounded border-white/10 text-indigo-500 bg-slate-950 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={sub.title}
                      onChange={(e) => {
                        setSubtasks(subtasks.map(s => s.id === sub.id ? { ...s, title: e.target.value } : s));
                      }}
                      className="flex-1 !bg-transparent !border-none !p-0 text-sm text-white focus:!ring-0 focus:!outline-none placeholder-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setSubtasks(subtasks.filter(s => s.id !== sub.id))}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder={t('modal_subtasks_placeholder')}
                className="flex-1 text-sm bg-slate-950/60"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">{t('modal_priority')}</label>
            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-xl border transition-all capitalize ${
                    priority === p 
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 font-bold' 
                      : 'border-white/5 bg-slate-900/50 text-slate-500 hover:border-white/20'
                  }`}
                >
                  {t(`priority_${p}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">{t('modal_due_date')}</label>
            <input 
              type="date" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-base outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">{t('modal_status')}</label>
            <div className="grid grid-cols-3 gap-3">
              {(['todo', 'in-progress', 'done'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-2 rounded-xl border transition-all ${
                    status === s 
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 font-bold' 
                      : 'border-white/5 bg-slate-900/50 text-slate-500 hover:border-white/20'
                  }`}
                >
                  {t(`status_${s === 'in-progress' ? 'in_progress' : s}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">{t('modal_attach')}</label>
            <div className="relative">
              <input 
                type="file" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden" 
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-all"
              >
                <Upload size={20} className="text-indigo-400" />
                <span className="text-slate-400">
                  {file ? file.name : t('modal_attach_placeholder')}
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition-all"
            >
              {t('modal_cancel')}
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary flex-1"
            >
              {isSubmitting ? t('modal_saving') : (taskToEdit ? t('modal_save') : t('modal_create'))}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
