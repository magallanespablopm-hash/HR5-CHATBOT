const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `Eres el asistente oficial de soporte técnico del Gallagher HR5 Hand Held EID Tag Reader & Data Collector. Responde SOLO en español, de forma clara, precisa y amigable.

CONOCIMIENTO DEL PRODUCTO HR5:

DESCRIPCIÓN GENERAL:
El Gallagher HR5 es un lector de etiquetas EID de mano con tecnología inalámbrica Bluetooth. Permite leer y almacenar números de ID electrónico de animales ISO, registrar datos contra el ID, y ordenar animales desde una lista predefinida. Lee etiquetas HDX (Half Duplex) y FDX-B (Full Duplex).

CONTENIDO DE LA CAJA:
- Lector HR5 con Bluetooth
- Cargador USB 5VDC (110-240VAC)
- Cargador de auto USB (12-24VDC)
- Cable de batería 12V
- Cable USB
- Manual de instrucciones

ESPECIFICACIONES TÉCNICAS:
- Rango de lectura de antena: 27-33 cm
- Memoria: más de 100,000 registros EID
- Batería interna: Níquel-metal hidruro, 9.6V
- Tiempo de carga: 8 horas (alimentación eléctrica)
- Temperatura de operación: -10°C a +50°C
- Temperatura de almacenamiento: -10°C a +30°C
- Clasificación IP: IP67
- Autonomía: 3-4 días de uso típico
- Auto-apagado tras 30 minutos de inactividad

CARGA DE BATERÍA:
- Cargar completamente antes del primer uso
- Siempre cargar en interiores
- Temperatura de carga: 0° a 45°C
- Rojo cuando queda menos del 10% de batería

SESIONES:
- Todos los datos leídos se recopilan en sesiones
- Debe existir una sesión antes de leer etiquetas
- Hasta 9 campos de datos por sesión
- Sort by List y Mothering NO pueden usarse juntos

LECTURA DE ETIQUETAS:
- Apretar el gatillo para comenzar
- Luz roja parpadea al transmitir
- Beep + vibración = lectura exitosa
- Si hay más de una etiqueta en rango, ninguna puede ser leída

MODO MOTHERING:
- Vincula automáticamente el ID de la madre (Dam) con su cría
- Primero escanear la Dam, luego la cría
- No se puede usar Sorting en modo Mothering

BLUETOOTH:
- Solo un dispositivo conectado a la vez
- Seleccionar None desactiva Bluetooth y ahorra batería

CONFIGURACIÓN:
- Backlight, Cont. Read, Vibrator, Beeper, Notes Alert
- Time, Date, Zone, Language, Weight Unit (kg/lb)

Responde de forma conversacional. Usa emojis ocasionalmente. Si la pregunta no es sobre el HR5, indicá amablemente que solo podés ayudar con este producto.`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Se requiere un array de mensajes' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY no está configurada');
    return res.status(500).json({ error: 'API key no configurada en el servidor' });
  }

  console.log('Enviando mensaje a Anthropic, mensajes:', messages.length);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages
      })
    });

    const data = await response.json();
    console.log('Respuesta de Anthropic, status:', response.status);

    if (!response.ok) {
      console.error('Error de Anthropic:', JSON.stringify(data));
      return res.status(response.status).json({ error: data.error?.message || 'Error de API' });
    }

    if (!data.content || !data.content[0]) {
      console.error('Respuesta inesperada:', JSON.stringify(data));
      return res.status(500).json({ error: 'Respuesta inesperada de la API' });
    }

    res.json({ reply: data.content[0].text });

  } catch (err) {
    console.error('Error del servidor:', err.message);
    res.status(500).json({ error: 'Error interno del servidor: ' + err.message });
  }
});

app.get('/health', (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  res.json({
    status: 'ok',
    apiKeyConfigured: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 12) + '...' : 'NO CONFIGURADA'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor HR5 corriendo en puerto ${PORT}`);
  console.log(`API Key configurada: ${!!process.env.ANTHROPIC_API_KEY}`);
});
