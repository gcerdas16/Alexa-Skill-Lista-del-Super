const express = require('express');
const Alexa = require('ask-sdk-core');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Inicializar bot de Telegram
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const chatId = process.env.TELEGRAM_CHAT_ID;

// Array para almacenar productos (en memoria por ahora)
let listaCompras = [];

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
    listaCompras.push({
      producto: producto,
      fecha: new Date().toLocaleString('es-ES')
    });
    
    // Enviar mensaje a Telegram
    try {
      const mensaje = `🛒 Nuevo producto agregado:\n\n📦 ${producto}\n⏰ ${new Date().toLocaleString('es-ES')}`;
      await bot.sendMessage(chatId, mensaje);
      console.log('Mensaje enviado a Telegram:', producto);
    } catch (error) {
      console.error('Error al enviar mensaje a Telegram:', error);
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
});
