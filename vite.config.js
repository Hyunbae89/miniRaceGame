import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' : GitHub Pages 같은 하위 경로 배포에서도 동작하도록 상대 경로로 빌드합니다.
export default defineConfig({
  plugins: [react()],
  base: './',
});
