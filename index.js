const express = require('express');
const Alexa = require('ask-sdk-core');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Inicializar bot de Telegram (con polling para botones)
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const chatId = process.env.TELEGRAM_CHAT_ID;

// Array para almacenar productos (en memoria por ahora)
let listaCompras = [];

// Emojis para productos comunes
const emojiMap = {
  'leche': '🥛',
  'pan': '🍞',
  'huevo': '🥚',
  'huevos': '🥚',
  'pollo': '🍗',
  'carne': '🥩',
  'pescado': '🐟',
  'arroz': '🍚',
  'pasta': '🍝',
  'tomate': '🍅',
  'lechuga': '🥬',
  'manzana': '🍎',
  'banana': '🍌',
  'platano': '🍌',
  'naranja': '🍊',
  'queso': '🧀',
  'yogurt': '🥛',
  'mantequilla': '🧈',
  'aceite': '🫗',
  'sal': '🧂',
  'azucar': '🍬',
  'cafe': '☕',
  'te': '🍵',
  'agua': '💧',
  'refresco': '🥤',
  'cerveza': '🍺',
  'vino': '🍷'
};

// Función para obtener emoji del producto
function getEmojiForProduct(producto) {
  const productoLower = producto.toLowerCase();
  return emojiMap[productoLower] || '📦';
}

// Función para formatear la lista completa
function formatearListaCompleta() {
  if (listaCompras.length === 0) {
    return '🛒 Tu lista está vacía';
  }

  let mensaje = `🛒 *LISTA DE COMPRAS* (${listaCompras.length} producto${listaCompras.length > 1 ? 's' : ''})\n\n`;
  
  listaCompras.forEach((item, index) => {
    const emoji = getEmojiForProduct(item.producto);
    mensaje += `${index + 1}. ${emoji} ${item.producto}\n`;
  });

  const ultimoProducto = listaCompras[listaCompras.length - 1];
  const hora = new Date(ultimoProducto.fecha).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  mensaje += `\n_Último agregado: ${ultimoProducto.producto} (${hora})_`;
  
  return mensaje;
}

// ====== HANDLERS DE TELEGRAM ======

// Comando /lista - Ver lista completa
bot.onText(/\/lista/, (msg) => {
  const mensaje = formatearListaCompleta();
  const keyboard = {
    inline_keyboard: [
      [
        { text: '🗑️ Limpiar Lista', callback_data: 'limpiar_lista' }
      ]
    ]
  };
  
  bot.sendMessage(msg.chat.id, mensaje, { 
    parse_mode: 'Markdown',
    reply_markup: keyboard 
  });
});

// Comando /limpiar - Limpiar lista
bot.onText(/\/limpiar/, (msg) => {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Sí, limpiar', callback_data: 'confirmar_limpiar' },
        { text: '❌ Cancelar', callback_data: 'cancelar_limpiar' }
      ]
    ]
  };
  
  bot.sendMessage(msg.chat.id, '¿Estás seguro de que quieres limpiar toda la lista?', {
    reply_markup: keyboard
  });
});

// Comando /ayuda
bot.onText(/\/ayuda|\/start/, (msg) => {
  const mensaje = `🤖 *Bot de Lista de Compras*\n\nComandos disponibles:\n\n/lista - Ver lista completa\n/limpiar - Limpiar toda la lista\n/ayuda - Ver esta ayuda\n\n_Los productos se agregan automáticamente cuando usas Alexa_`;
  
  bot.sendMessage(msg.chat.id, mensaje, { parse_mode: 'Markdown' });
});

// Manejar callbacks de botones
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  
  if (query.data === 'limpiar_lista' || query.data === 'confirmar_limpiar') {
    listaCompras = [];
    bot.editMessageText('✅ Lista limpiada correctamente', {
      chat_id: chatId,
      message_id: messageId
    });
    bot.answerCallbackQuery(query.id, { text: 'Lista limpiada' });
  } else if (query.data === 'cancelar_limpiar') {
    bot.editMessageText('❌ Operación cancelada', {
      chat_id: chatId,
      message_id: messageId
    });
    bot.answerCallbackQuery(query.id, { text: 'Cancelado' });
  }
});

// ====== HANDLERS DE ALEXA ======

// Handler para lanzar la skill
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = '¡Hola! Dime qué producto necesitas agregar a tu lista del super.';
    
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// Handler para agregar productos
const AgregarProductoIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AgregarProductoIntent';
  },
  async handle(handlerInput) {
    const producto = Alexa.getSlotValue(handlerInput.requestEnvelope, 'producto');
    
    // Agregar producto a la lista
    const ahora = new Date();
    listaCompras.push({
      producto: producto,
      fecha: ahora.toISOString()
    });
    
    // Enviar mensaje a Telegram con formato mejorado
    try {
      const mensaje = formatearListaCompleta();
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '👁️ Ver Lista', callback_data: 'ver_lista' },
            { text: '🗑️ Limpiar Lista', callback_data: 'limpiar_lista' }
          ]
        ]
      };
      
      await bot.sendMessage(chatId, mensaje, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
      
      console.log('✅ Mensaje enviado a Telegram:', producto);
    } catch (error) {
      console.error('❌ Error al enviar mensaje a Telegram:', error);
    }
    
    const speakOutput = `He agregado ${producto} a tu lista del super. ¿Algo más?`;
    
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('¿Necesitas agregar otro producto?')
      .getResponse();
  }
};

// Handler para ayuda
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'Puedes decirme cosas como: agregar leche, necesito pan, o comprar huevos. ¿Qué necesitas?';
    
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// Handler para cancelar/parar
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speakOutput = '¡Hasta luego!';
    
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};

// Handler para errores
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error('Error:', error);
    const speakOutput = 'Lo siento, hubo un problema. Por favor intenta de nuevo.';
    
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// Construir el skill handler de Alexa
const skillBuilder = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    AgregarProductoIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .create();

// ====== RUTAS EXPRESS ======

// Ruta de salud
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Alexa Skill Backend funcionando',
    productos: listaCompras.length
  });
});

// Endpoint para Alexa
app.post('/alexa', async (req, res) => {
  try {
    const response = await skillBuilder.invoke(req.body);
    res.json(response);
  } catch (error) {
    console.error('Error en /alexa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para ver la lista actual
app.get('/lista', (req, res) => {
  res.json({
    total: listaCompras.length,
    productos: listaCompras
  });
});

// Ruta para limpiar la lista
app.delete('/lista', (req, res) => {
  listaCompras = [];
  res.json({ message: 'Lista limpiada', productos: listaCompras });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 Endpoint de Alexa: http://localhost:${PORT}/alexa`);
  console.log(`🤖 Bot de Telegram iniciado`);
});
