import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/devices';
import telemetryRoutes from './routes/telemetry';
import { setupSocketHandlers } from './socket/socketHandlers';

dotenv.config();

const app = express();
const server = http.createServer(app);
// Get allowed origins from environment or use defaults
const getAllowedOrigins = () => {
  const prodOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];
  const devOrigins = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"];
  
  // Always allow Vercel frontend in production
  const vercelOrigins = ["https://iot-asset.vercel.app"];
  
  if (process.env.NODE_ENV === 'production') {
    return [...prodOrigins, ...vercelOrigins];
  }
  
  return [...prodOrigins, ...vercelOrigins, ...devOrigins];
};

const allowedOrigins = getAllowedOrigins();

console.log('🌐 CORS Configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ALLOWED_ORIGINS env var:', process.env.ALLOWED_ORIGINS);
console.log('Final allowed origins:', allowedOrigins);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware - More permissive CORS for production debugging
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, be more permissive for debugging
    if (process.env.NODE_ENV === 'production') {
      // Allow Vercel domains
      if (origin.includes('vercel.app') || origin.includes('iot-asset')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    origin: req.headers.origin,
    allowedOrigins: allowedOrigins,
    timestamp: new Date().toISOString()
  });
});

// Socket.IO test endpoint
app.get('/api/socket-test', (req, res) => {
  res.json({
    message: 'Socket.IO server is running',
    connectedClients: io.engine.clientsCount,
    transports: ['polling', 'websocket'],
    cors: {
      origin: allowedOrigins,
      credentials: true
    },
    timestamp: new Date().toISOString()
  });
});

// Socket.io setup
setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket: http://localhost:${PORT}`);
});