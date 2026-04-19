import { Hono } from 'hono'
import { cors } from 'hono/cors'
import card from './routes/card'
import admin from './routes/admin'

export interface Env {
  DB: D1Database
  IMAGES: R2Bucket
  API_KEY: string
  R2_PUBLIC_URL: string
}

const app = new Hono<{ Bindings: Env }>()

// CORS — allow the extension to call the API from any origin
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type', 'X-API-Key'],
  }),
)

// Health check
app.get('/', (c) => c.json({ name: 'Arcane Tab API', status: 'ok' }))

// Card endpoint (public)
app.route('/api/card', card)

// Admin endpoints (API key protected)
app.route('/api/admin', admin)

export default app
