import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function apkMimePlugin() {
  return {
    name: 'apk-mime',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/Plataforma%20Softinsa.apk') {
          const filePath = path.resolve(__dirname, 'public', 'Plataforma Softinsa.apk')
          try {
            const stat = fs.statSync(filePath)
            res.writeHead(200, {
              'Content-Type': 'application/vnd.android.package-archive',
              'Content-Length': stat.size,
            })
            fs.createReadStream(filePath).pipe(res)
            return
          } catch {
            res.writeHead(404)
            res.end('Not found')
            return
          }
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apkMimePlugin()],
})
