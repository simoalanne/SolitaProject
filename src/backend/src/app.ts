import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, resolve, join } from 'path'
import assessRouter from './assess/router.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const frontendPath = resolve(__dirname, '../../frontend/dist')

const app = express()
app.use(express.json())

app.use('/api/assess', assessRouter)

app.use(express.static(frontendPath))
// SPA fallback for React Router
app.get('/*splat', (_, res) => {
  res.sendFile(join(frontendPath, 'index.html'))
})

export default app
