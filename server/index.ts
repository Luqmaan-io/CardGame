import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerGameHandlers } from './gameServer';

const PORT = process.env.PORT || 3001;

const app = express();

// Required for Socket.io on Heroku
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://playpowerstack.vercel.app',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Polling first then upgrade — more reliable on Heroku
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowUpgrades: true,
});

io.on('connection', (socket) => {
  console.log(`[+] Socket connected: ${socket.id}`);
  registerGameHandlers(io, socket);
  socket.on('disconnect', () => {
    console.log(`[-] Socket disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Game server running on http://localhost:${PORT}`);
});
