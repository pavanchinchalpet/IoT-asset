import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/devices';
import telemetryRoutes from './routes/telemetry';
import { setupSocketHandlers } from './socket/socketHandlers';

// Load environment variables
dotenv.config({ path: '.env' });

// Debug environment variables
console.log('🔧 Environment Debug:');
console.log('PORT from env:', process.env.PORT);
console.log('NODE_ENV from env:', process.env.NODE_ENV);
console.log('ALLOWED_ORIGINS from env:', process.env.ALLOWED_ORIGINS);

// Initialize Prisma with connection management
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Handle database connection
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('📊 Database connected successfully');
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    console.log('🔄 Database will auto-reconnect when needed (Neon free tier may be sleeping)');
  }
}

// Connect to database on startup
connectDatabase();

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

const app = express();
const server = http.createServer(app);
// Get allowed origins from environment or use defaults
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'development') {
    // In development, allow all localhost origins
    return [
      "http://localhost:3000",
      "http://localhost:3001", 
      "http://localhost:3002",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001"
    ];
  }
  
  // Production origins
  const prodOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];
  const allowedOrigins = [
    "http://localhost:3000",
    "https://iot-asset.vercel.app"
  ];
  
  return [...prodOrigins, ...allowedOrigins];
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
// CORS configuration
if (process.env.NODE_ENV === 'development') {
  // Simple CORS for development
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
} else {
  // More restrictive CORS for production
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
}

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'OK', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      database: 'disconnected',
      error: 'Database unavailable (may be sleeping)',
      timestamp: new Date().toISOString() 
    });
  }
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

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const deviceId = socket.handshake.auth.deviceId;
    
    // Allow device connections without user authentication
    if (deviceId && !token) {
      console.log(`🤖 Device connection allowed: ${deviceId}`);
      socket.data.deviceId = deviceId;
      socket.data.isDevice = true;
      return next();
    }
    
    // Require token for user connections
    if (!token) {
      console.log('❌ Socket connection rejected: No token provided for user connection');
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token for user connections
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      console.log('❌ Socket connection rejected: Invalid token');
      return next(new Error('Invalid token'));
    }

    // Attach user to socket
    socket.data.user = user;
    socket.data.isDevice = false;
    console.log(`✅ Socket authenticated for user: ${user.email}`);
    next();
  } catch (error) {
    console.log('❌ Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

// Socket.io setup
setupSocketHandlers(io);

const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket: http://localhost:${PORT}`);
});