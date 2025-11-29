import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/towerdd/', // !!! 必须与你的 GitHub 仓库名一致，前后都要加斜杠 !!!
})
