import 'dotenv/config'
import app from './app.ts'

const port = process.env.PORT ? Number(process.env.PORT) : 3000

const startServer = () => {
  const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })

  setupGracefulShutdown(server)
}

const setupGracefulShutdown = (server: import('http').Server) => {
  const shutdown = (signal: string) => {
    console.info(`\nReceived ${signal}. Shutting down gracefully...`)
    server.close(err => {
      if (err) {
        console.error('Error during shutdown:', err)
        process.exit(1)
      }
      console.info('Server stopped cleanly.')
      process.exit(0)
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

startServer()
