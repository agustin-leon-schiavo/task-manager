import { Response } from 'express';
import { Task } from '../models/task';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/authMiddleware';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const chatWithAssistant = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { history, message } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'No autenticado' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ message: 'La clave de API de Gemini no está configurada en el servidor.' });
    return;
  }

  // Obtener tareas del usuario para el contexto
  const tasks = await Task.findAll({ where: { userId } });

  const tasksContext = tasks.map(t => 
    `- Título: ${t.title}, Estado: ${t.status}, Prioridad: ${t.priority}, Vencimiento: ${t.dueDate || 'Sin fecha'}`
  ).join('\n');

  const systemInstruction = `Eres un asistente virtual inteligente para una aplicación de gestión de tareas.
Tu objetivo es ayudar al usuario a organizar y entender sus tareas actuales. Sé conciso, amigable y utiliza un formato limpio (viñetas si es necesario).

INFORMACION DEL CONTEXTO
- FECHA ACTUAL: ${new Date().toLocaleString()}
- Usa esta fecha como referencia absoluta para cualquier cálculo de tiempo (ej. "mañana", "la próxima semana", "ayer").

REGLAS PARA RESPONDER
- Si el usuario pregunta por cuestiones ajenas a la aplicacion, responde de forma educada que solo puedes ayudar con tareas.

A continuación tienes la lista actual de tareas del usuario:
${tasksContext ? tasksContext : 'El usuario no tiene tareas registradas actualmente.'}`;

  const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = ai.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    systemInstruction
  });

  // Sanitización robusta del historial para la API de Gemini:
  // 1. Debe empezar con 'user'.
  // 2. Debe terminar con 'model' (porque sendMessage enviará el siguiente 'user').
  // 3. Debe alternar estrictamente: user, model, user, model...
  let cleanHistory = Array.isArray(history) ? [...history] : [];

  // Remover mensajes iniciales hasta encontrar uno con rol 'user'
  while (cleanHistory.length > 0 && cleanHistory[0].role !== 'user') {
    cleanHistory.shift();
  }

  const sanitizedHistory: any[] = [];
  let expectedRole: 'user' | 'model' = 'user';

  for (const msg of cleanHistory) {
    if (msg.role === expectedRole && msg.parts && Array.isArray(msg.parts)) {
      sanitizedHistory.push({
        role: msg.role,
        parts: msg.parts
      });
      expectedRole = expectedRole === 'user' ? 'model' : 'user';
    }
  }

  // Como sendMessage() enviará el mensaje del usuario, el historial de chat debe terminar en 'model'.
  while (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role !== 'model') {
    sanitizedHistory.pop();
  }

  try {
    const chat = model.startChat({
      history: sanitizedHistory,
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({ answer: responseText });
  } catch (error) {
    console.error('Error al comunicarse con la API de IA:', error);
    res.status(500).json({ message: 'Hubo un error al procesar tu solicitud con el asistente de IA.' });
  }
});
