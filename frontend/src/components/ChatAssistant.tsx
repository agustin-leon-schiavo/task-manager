'use client';

import React, { useState, useRef, useEffect } from 'react';
import api from '@/services/api';
import { Bot, X, Send, User, Loader2 } from 'lucide-react';

interface MessagePart {
  text: string;
}

interface Message {
  role: 'user' | 'model';
  parts: MessagePart[];
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    
    // Agregamos el mensaje del usuario a la UI inmediatamente
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', parts: [{ text: userText }] }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Como "messages" siempre tiene un número par de mensajes (pregunta y respuesta),
      // rebanar un número par (ej: los últimos 10) asegura que el historial empiece con 'user'
      // y termine con 'model'.
      const slidingWindowHistory = messages.slice(-10);

      // Enviamos el historial al backend y el nuevo mensaje
      const response = await api.post('/assistant/chat', {
        history: slidingWindowHistory,
        message: userText
      });

      // Agregamos la respuesta del asistente
      setMessages(prev => [
        ...prev,
        { role: 'model', parts: [{ text: response.data.answer }] }
      ]);
    } catch (error) {
      console.error('Error al comunicarse con el asistente:', error);
      setMessages(prev => [
        ...prev,
        { role: 'model', parts: [{ text: 'Hubo un error al procesar tu solicitud. Inténtalo más tarde.' }] }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante para abrir el chat */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 hover:scale-105 transition-all z-40 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <Bot size={28} />
      </button>

      {/* Ventana del chat */}
      <div 
        className={`fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-3rem)] flex flex-col bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden z-50 transition-all origin-bottom-right duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
        style={{ height: '500px', maxHeight: 'calc(100vh - 6rem)' }}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/50">
          <div className="flex items-center gap-2 text-white font-semibold">
            <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">
              <Bot size={20} />
            </div>
            Asistente IA
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 mt-10">
              <Bot size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">¡Hola! Soy tu asistente inteligente.<br/>Pregúntame sobre tus tareas pendientes.</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot size={16} />
                </div>
              )}
              
              <div 
                className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-slate-800/80 text-slate-200 rounded-tl-sm border border-white/5'
                }`}
              >
                {/* Mostramos el texto con saltos de línea */}
                {msg.parts[0].text.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i !== msg.parts[0].text.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Bot size={16} />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-800/80 rounded-tl-sm border border-white/5 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Área de entrada */}
        <div className="p-4 bg-slate-900/50 border-t border-white/10">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre tus tareas..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 disabled:hover:text-slate-600 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
