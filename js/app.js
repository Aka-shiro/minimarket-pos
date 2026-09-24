/**
 * Lógica principal para el Asistente Académico con Inteligencia Artificial
 */

// Alternar la visibilidad de la ventana del chat
function toggleChat() {
  const chatBox = document.getElementById('chat-box');
  if (chatBox) {
    chatBox.classList.toggle('chat-hidden');
  }
}

// Capturar la tecla Enter en la caja de texto
function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

// Procesar el envío de mensajes del usuario
async function sendMessage() {
  const input = document.getElementById('user-input');
  const messageText = input.value.trim();

  if (!messageText) return;

  // 1. Mostrar el mensaje enviado por el usuario
  appendMessage(messageText, 'user');
  input.value = '';

  // 2. Mostrar indicador de respuesta ("Pensando...")
  const loadingId = appendMessage('Pensando...', 'bot');

  try {
    // 3. Consultar la respuesta del asistente
    const responseText = await consultarAsistenteIA(messageText);
    const loadingMessageElement = document.getElementById(loadingId);
    if (loadingMessageElement) {
      loadingMessageElement.innerText = responseText;
    }
  } catch (error) {
    const loadingMessageElement = document.getElementById(loadingId);
    if (loadingMessageElement) {
      loadingMessageElement.innerText = 'Ocurrió un error al procesar tu consulta. Intenta nuevamente.';
    }
  }
}

// Renderizar una burbuja de mensaje en el contenedor
function appendMessage(text, sender) {
  const messagesContainer = document.getElementById('chat-messages');
  const msgDiv = document.createElement('div');
  const msgId = 'msg-' + Date.now();

  msgDiv.id = msgId;
  msgDiv.classList.add('message', sender);
  msgDiv.innerText = text;

  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  return msgId;
}

// Simulación/Lógica del Asistente Académico (Sistemas/Software)
async function consultarAsistenteIA(consulta) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const query = consulta.toLowerCase();

      if (query.includes('proyecto') || query.includes('software')) {
        resolve("Para elaborar un proyecto de software profesional: 1. Define requerimientos, 2. Diseña la arquitectura, 3. Desarrolla el código, 4. Aplica pruebas (QA) y 5. Realiza el despliegue.");
      } else if (query.includes('fases') || query.includes('desarrollo')) {
        resolve("Las fases principales son: Análisis de Requisitos, Diseño del Sistema, Codificación, Pruebas y Verificación, Despliegue y Mantenimiento.");
      } else if (query.includes('evaluacion') || query.includes('examen') || query.includes('preguntas')) {
        resolve("Aquí tienes preguntas de evaluación sobre la nube: 1. ¿Qué es SaaS, PaaS e IaaS? 2. ¿Diferencia entre nube pública y privada? 3. ¿Qué es la escalabilidad horizontal?");
      } else if (query.includes('investigacion') || query.includes('bibliografia')) {
        resolve("Para iniciar una investigación: delimita el tema, consulta bases científicas (Scopus, IEEE Xplore) y define tu metodología. Te sugiero leer 'Ingeniería de Software' de Ian Sommerville.");
      } else if (query.includes('resumen') || query.includes('resume')) {
        resolve("Puedo ayudarte a sintetizar contenidos. Por favor, ingresa o pega el texto del documento que deseas resumir.");
      } else {
        resolve("Hola. Como asistente académico especializado en Ingeniería de Sistemas, puedo ayudarte con información sobre proyectos, evaluaciones, bibliografía u horarios académicos.");
      }
    }, 900);
  });
}
