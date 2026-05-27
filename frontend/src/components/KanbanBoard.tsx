'use client';

import React, { useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { Pencil, Trash2, Clock, CalendarDays, Paperclip } from 'lucide-react';
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
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  fileUrl?: string;
  subtasks?: Subtask[];
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
}

const COLUMNS = [
  { id: 'todo', titleKey: 'col_todo' },
  { id: 'in-progress', titleKey: 'col_in_progress' },
  { id: 'done', titleKey: 'col_done' },
] as const;

const priorityWeight = {
  high: 3,
  medium: 2,
  low: 1
};

export default function KanbanBoard({ tasks, onTaskMove, onEdit, onDelete, onToggleSubtask }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const { t, language } = useLanguage();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];

    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      onTaskMove(taskId, newStatus);
    }
  };

  // Agrupar y ordenar tareas
  const groupedTasks = useMemo(() => {
    const grouped = {
      'todo': [] as Task[],
      'in-progress': [] as Task[],
      'done': [] as Task[]
    };

    tasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        // Fallback if status is missing or old completed boolean
        grouped['todo'].push(task);
      }
    });

    // Ordenar por prioridad (alta a baja)
    for (const key of Object.keys(grouped)) {
      grouped[key as keyof typeof grouped].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
    }

    return grouped;
  }, [tasks]);

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {COLUMNS.map(col => (
          <DroppableColumn 
            key={col.id} 
            id={col.id} 
            title={t(col.titleKey)} 
            tasks={groupedTasks[col.id]} 
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleSubtask={onToggleSubtask}
            t={t}
            language={language}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} onEdit={onEdit} onDelete={onDelete} onToggleSubtask={onToggleSubtask} t={t} language={language} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function DroppableColumn({ id, title, tasks, onEdit, onDelete, onToggleSubtask, t, language }: { id: string, title: string, tasks: Task[], onEdit: any, onDelete: any, onToggleSubtask: any, t: any, language: string }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="glass p-4 rounded-2xl flex flex-col min-h-[500px]">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="font-bold text-lg text-white">{title}</h2>
        <span className="bg-white/10 text-slate-300 py-1 px-3 rounded-full text-sm font-medium">
          {tasks.length}
        </span>
      </div>
      
      <div className="flex flex-col gap-4 flex-1">
        {tasks.map(task => (
          <DraggableTask key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} onToggleSubtask={onToggleSubtask} t={t} language={language} />
        ))}
        {tasks.length === 0 && (
          <div className="flex-1 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center p-6">
            <span className="text-slate-500 text-sm text-center">{t('drag_here')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableTask({ task, onEdit, onDelete, onToggleSubtask, t, language }: { task: Task, onEdit: any, onDelete: any, onToggleSubtask: any, t: any, language: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style}
        className="h-[180px] bg-indigo-500/10 border-2 border-indigo-500/30 border-dashed rounded-xl" 
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} onToggleSubtask={onToggleSubtask} t={t} language={language} />
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onToggleSubtask, t, language, isOverlay }: { task: Task, onEdit: any, onDelete: any, onToggleSubtask: any, t: any, language: string, isOverlay?: boolean }) {
  const getDueDateColor = () => {
    if (!task.dueDate) return 'text-slate-500';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [year, month, day] = task.dueDate.split('-');
    const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (dueDate < today) return 'text-red-400';
    if (dueDate.getTime() === today.getTime()) return 'text-amber-400';
    return 'text-slate-400';
  };
  
  const formatDate = (dateString: string) => {
    // dateString is in "YYYY-MM-DD" format
    const [year, month, day] = dateString.split('-');
    
    return language === 'en' 
      ? `${month}/${day}/${year}` 
      : `${day}/${month}/${year}`;
  };

  return (
    <div className={`bg-slate-900 border border-white/10 rounded-xl p-5 group flex flex-col gap-3 cursor-grab active:cursor-grabbing hover:border-indigo-500/50 transition-colors ${isOverlay ? 'shadow-2xl shadow-indigo-500/20 rotate-2' : ''}`}>
      <div className="flex justify-between items-start">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
          task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
          'bg-emerald-500/20 text-emerald-400'
        }`}>
          {t(`priority_${task.priority}`)}
        </span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onPointerDown={e => e.stopPropagation()}>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="text-slate-500 hover:text-indigo-400 transition-colors"
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="text-slate-500 hover:text-red-400 transition-colors"
            title="Borrar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <h3 className={`font-semibold ${task.status === 'done' ? 'line-through text-slate-500' : 'text-white'}`}>
        {task.title}
      </h3>
      {task.description ? (
        <p className="text-slate-400 text-xs line-clamp-2">
          {task.description}
        </p>
      ) : (
        <p className="text-slate-500 italic text-xs">
          {t('no_description')}
        </p>
      )}

      {/* Progress & Checklist rendering inside the card */}
      {task.subtasks && task.subtasks.length > 0 && (() => {
        const total = task.subtasks.length;
        const completed = task.subtasks.filter(s => s.completed).length;
        const percent = Math.round((completed / total) * 100);

        return (
          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/5">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
              <span>{t('progress_subtasks', { completed, total })}</span>
              <span className="font-semibold text-indigo-400">{percent}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-1.5 mt-1 max-h-[120px] overflow-y-auto pr-1">
              {task.subtasks.map(sub => (
                <label 
                  key={sub.id} 
                  className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white text-xs select-none p-0.5 rounded hover:bg-white/5 transition-colors"
                  onPointerDown={e => e.stopPropagation()} // Stop drag propagation!
                >
                  <input
                    type="checkbox"
                    checked={sub.completed}
                    onChange={() => onToggleSubtask && onToggleSubtask(task.id, sub.id)}
                    className="w-3.5 h-3.5 rounded border-white/10 text-indigo-500 bg-slate-950 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className={sub.completed ? 'line-through text-slate-500' : ''}>
                    {sub.title}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${getDueDateColor()}`}>
          <CalendarDays size={14} />
          <span>{task.dueDate ? formatDate(task.dueDate) : t('no_due_date')}</span>
        </div>
        
        {task.fileUrl && (
          <a 
            href={task.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
            onPointerDown={e => e.stopPropagation()}
          >
            <Paperclip size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
