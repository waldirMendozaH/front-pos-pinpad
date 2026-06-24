# Front POS PinPad

Frontend Angular para procesamiento de pagos con PIN Pad Izipay. Se comunica con el servicio local **Izipay Tray** (`https://localhost:8383`) que actúa como bridge entre el browser y el dispositivo físico.

## Arquitectura

```
Browser (Angular) → HTTPS localhost:8383 → PIN Pad USB
```

- **Servicio local:** [fps-ws-abax-app-desktop-izipay](../fps-ws-abax-app-desktop-izipay)
- **Merchant ID:** `10361169` (pruebas)

## Funcionalidades

- Procesar pagos en PEN y USD
- Anulación de pagos
- Cancelación de transacciones
- Estado del dispositivo en tiempo real
- Checklist de pruebas automatizadas (16 tests)

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:4200`

## Despliegue en Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

La app se despliega en `https://front-pos-pinpad.vercel.app`. El CORS del backend ya incluye este origen.

## Requisitos

- Servicio **Izipay Tray** corriendo en `localhost:8383`
- Certificado self-signed aceptado en el navegador (visitar `https://localhost:8383/health`)
- PIN Pad conectado por USB
