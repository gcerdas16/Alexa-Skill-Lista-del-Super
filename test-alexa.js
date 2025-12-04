const axios = require('axios');

// Simular petición de Alexa para agregar "leche"
const alexaRequest = {
  "version": "1.0",
  "session": {
    "new": true,
    "sessionId": "test-session",
    "application": {
      "applicationId": "test-app"
    }
  },
  "request": {
    "type": "IntentRequest",
    "requestId": "test-request",
    "intent": {
      "name": "AgregarProductoIntent",
      "slots": {
        "producto": {
          "name": "producto",
          "value": "leche"
        }
      }
    }
  }
};

// Enviar petición
axios.post('http://localhost:3000/alexa', alexaRequest)
  .then(response => {
    console.log('✅ Respuesta de Alexa:');
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });
