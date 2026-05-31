import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const app = express();
  app.use(express.json());

  // Tạo Vite dev server ở middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Dùng Vite middleware để serve frontend
  app.use(vite.middlewares);

  const PORT = process.env.PORT || 5173;
  app.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
  });
}

main().catch(console.error);