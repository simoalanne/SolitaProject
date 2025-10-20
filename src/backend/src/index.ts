import 'dotenv/config'
import app from './app.ts'

const port = process.env.PORT ? Number(process.env.PORT) : 3000

/**
 * Initializes and starts the HTTP server for the application.
 * 
 * This function launches the Express app on the configured port.
 * It also sets up graceful shutdown handlers to ensure the server terminates
 * cleanly when the process receives termination signals (`SIGINT` or `SIGTERM`).
 */
const startServer = () => {
  const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })

  setupGracefulShutdown(server)
}

/**
 * Sets up a graceful shutdown for the server.
 * 
 * This function listens for process termination signals (`SIGINT` and `SIGTERM`)
 * and ensures the server is closed cleanly before the process exits.
 * 
 * @param server the HTTP server instance to be gracefully shut down.
 */
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
