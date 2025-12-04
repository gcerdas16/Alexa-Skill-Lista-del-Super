# Alexa Lista del Super

Backend para Alexa Skill que permite agregar productos a una lista de compras y recibir notificaciones en Telegram.

## Tecnologías

- Node.js + Express
- Alexa Skills Kit SDK
- Telegram Bot API
- Railway (deployment)

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno en `.env`:
```
PORT=3000
TELEGRAM_BOT_TOKEN=tu_token
TELEGRAM_CHAT_ID=tu_chat_id
```

3. Ejecutar en local:
```bash
npm start
```

## Endpoints

- `GET /` - Estado del servidor
- `POST /alexa` - Endpoint para Alexa Skill
- `GET /lista` - Ver lista de productos
- `DELETE /lista` - Limpiar lista

## Uso con Alexa

- "Alexa, agregar leche"
- "Alexa, necesito pan"
- "Alexa, comprar huevos"
