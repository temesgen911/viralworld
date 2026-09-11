import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiApp } from './src/server/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(apiApp);
app.use(express.static(path.resolve(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`VIRAL server running on port ${PORT}`);
});
