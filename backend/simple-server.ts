import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Device, Telemetry, DeviceRegistration, TelemetryData, ConnectedDevice, DeviceStats } from './src/types';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
  credentials: true
}));
app.use(express.json());

// In-memory storage (for demo purposes)
const users: User[] = [
  {
    id: '1',
    email: 'admin@iot.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123
    role: 'ADMIN',
    createdAt: new Date()
  },
  {
    id: '2',
    email: 'operator@iot.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // operator123
    role: 'OPERATOR',
    createdAt: new Date()
  },
  {
    id: '3',
    email: 'viewer@iot.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // viewer123
    role: 'VIEWER',
    createdAt: new Date()
  }
];

const devices: Device[] = [
  {
    id: 'kiln-temp-01',
    name: 'Kiln Temperature Sensor #1',
    location: 'Kiln Area - Zone A',
    type: 'temperature',
    isOnline: false,
    lastSeenAt: null,
    createdAt: new Date(),
    telemetryCount: 0
  },
  {
    id: 'kiln-temp-02',
    name: 'Kiln Temperature Sensor #2',
    location: 'Kiln Area - Zone B',
    type: 'temperature',
    isOnline: false,
    lastSeenAt: null,
    createdAt: new Date(),
    telemetryCount: 0
  },
  {
    id: 'conveyor-motor-01',
    name: 'Conveyor Motor #1',
    location: 'Production Line A',
    type: 'motor',
    isOnline: false,
    lastSeenAt: null,
    createdAt: new Date(),
    telemetryCount: 0
  },
  {
    id: 'power-meter-01',
    name: 'Power Consumption Meter',
    location: 'Main Electrical Panel',
    type: 'power',
    isOnline: false,
    lastSeenAt: null,
    createdAt: new Date(),
    telemetryCount: 0
  },
  {
    id: 'vibration-01',
    name: 'Vibration Sensor',
    location: 'Crusher Unit',
    type: 'vibration',
    isOnline: false,
    lastSeenAt: null,
    createdAt: new Date(),
    telemetryCount: 0
  }
];

const telemetry: Telemetry[] = [];

// Extended Request interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Auth middleware
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Auth routes
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: { email: string; password: string } = req.body;
    const user = users.find(u => u.email === email);

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // For demo, accept any password
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  res.json({ user: req.user });
});

// Device routes
app.get('/api/devices', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const {
    page = '1',
    limit = '10',
    search = '',
    status = 'all',
    type = 'all'
  } = req.query as { [key: string]: string };

  let filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(search.toLowerCase()) ||
                         (device.location && device.location.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = status === 'all' || 
                         (status === 'online' && device.isOnline) ||
                         (status === 'offline' && !device.isOnline);
    const matchesType = type === 'all' || device.type === type;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const total = filteredDevices.length;
  const pages = Math.ceil(total / parseInt(limit));
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedDevices = filteredDevices.slice(skip, skip + parseInt(limit));

  const devicesWithCount = paginatedDevices.map(device => ({
    ...device,
    _count: {
      telemetry: telemetry.filter(t => t.deviceId === device.id).length
    }
  }));

  res.json({
    devices: devicesWithCount,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages
    }
  });
});

app.get('/api/devices/stats/overview', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const stats: DeviceStats = {
    total: devices.length,
    online: devices.filter(d => d.isOnline).length,
    offline: devices.filter(d => !d.isOnline).length,
    telemetryCount: telemetry.length
  };

  res.json(stats);
});

app.get('/api/devices/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const device = devices.find(d => d.id === req.params.id);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  const deviceTelemetry = telemetry
    .filter(t => t.deviceId === device.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 100);

  res.json({
    ...device,
    telemetry: deviceTelemetry,
    _count: {
      telemetry: telemetry.filter(t => t.deviceId === device.id).length
    }
  });
});

// Telemetry routes
app.get('/api/telemetry/device/:deviceId', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { deviceId } = req.params;
  const { metric = 'all', hours = '24', limit = '1000' } = req.query as { [key: string]: string };

  const hoursAgo = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

  let deviceTelemetry = telemetry.filter(t => {
    const matchesDevice = t.deviceId === deviceId;
    const matchesTime = new Date(t.createdAt) >= hoursAgo;
    const matchesMetric = metric === 'all' || t.metric === metric;
    
    return matchesDevice && matchesTime && matchesMetric;
  });

  deviceTelemetry = deviceTelemetry
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, parseInt(limit));

  res.json(deviceTelemetry);
});

// Health check
app.get('/api/health', (req: Request, res: Response): void => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io setup
const connectedDevices = new Map<string, ConnectedDevice>();

io.on('connection', (socket: Socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Device registration
  socket.on('device:register', (data: DeviceRegistration) => {
    const { deviceId, deviceName, location, type } = data;
    
    // Update device status
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      device.isOnline = true;
      device.lastSeenAt = new Date();
    }

    connectedDevices.set(deviceId, {
      socketId: socket.id,
      device: device || { 
        id: deviceId, 
        name: deviceName, 
        location: location || null,
        type: type || 'sensor',
        isOnline: true,
        lastSeenAt: new Date(),
        createdAt: new Date()
      }
    });

    socket.join(`device:${deviceId}`);
    
    console.log(`📱 Device registered: ${deviceName} (${deviceId})`);
    
    // Broadcast device status update
    io.emit('device:status', {
      deviceId,
      isOnline: true,
      lastSeenAt: new Date().toISOString()
    });

    socket.emit('device:registered', { success: true, device });
  });

  // Telemetry data reception
  socket.on('telemetry:data', (data: TelemetryData) => {
    const { deviceId, metrics } = data;

    if (!deviceId || !metrics || !Array.isArray(metrics)) {
      socket.emit('telemetry:error', { error: 'Invalid telemetry data format' });
      return;
    }

    // Save telemetry data
    const telemetryRecords: Telemetry[] = metrics.map(metric => ({
      id: Date.now().toString() + Math.random(),
      deviceId,
      metric: metric.name,
      value: metric.value,
      unit: metric.unit || null,
      createdAt: new Date()
    }));

    telemetry.push(...telemetryRecords);

    // Update device last seen
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      device.lastSeenAt = new Date();
      device.telemetryCount = (device.telemetryCount || 0) + telemetryRecords.length;
    }

    // Broadcast telemetry to dashboard clients
    io.emit('telemetry:update', {
      deviceId,
      data: telemetryRecords,
      timestamp: new Date().toISOString()
    });

    console.log(`📊 Telemetry received from ${deviceId}: ${metrics.length} metrics`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);

    // Find and mark device as offline
    for (const [deviceId, deviceInfo] of connectedDevices.entries()) {
      if (deviceInfo.socketId === socket.id) {
        const device = devices.find(d => d.id === deviceId);
        if (device) {
          device.isOnline = false;
        }

        // Broadcast device offline status
        io.emit('device:status', {
          deviceId,
          isOnline: false,
          lastSeenAt: new Date().toISOString()
        });

        connectedDevices.delete(deviceId);
        console.log(`📱 Device offline: ${deviceId}`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3003;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket: http://localhost:${PORT}`);
  console.log(`\n🔑 Demo Credentials:`);
  console.log(`Admin: admin@iot.com / admin123`);
  console.log(`Operator: operator@iot.com / operator123`);
  console.log(`Viewer: viewer@iot.com / viewer123`);
});