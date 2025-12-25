# IoT Asset Management Dashboard - Setup Guide

## 🚀 Quick Start with Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- Git

### 1. Clone and Start
```bash
git clone <your-repo-url>
cd iot-dashboard
docker-compose up -d
```

### 2. Seed Database
```bash
docker-compose exec backend npm run db:seed
```

### 3. Start IoT Simulation
```bash
docker-compose exec backend node src/simulator/runSimulation.js
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432

---

## 🛠️ Manual Setup (Development)

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your database URL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/iot_dashboard"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=3001
```

4. **Setup database**
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

5. **Start backend server**
```bash
npm run dev
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.local.example .env.local
```

4. **Start frontend server**
```bash
npm run dev
```

### IoT Device Simulation

1. **Start the simulation (in backend directory)**
```bash
node src/simulator/runSimulation.js
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@iot.com | admin123 |
| Operator | operator@iot.com | operator123 |
| Viewer | viewer@iot.com | viewer123 |

---

## 📊 Features Overview

### ✅ Completed Features

**Authentication & Authorization**
- ✅ JWT-based authentication
- ✅ Role-based access control (Admin, Operator, Viewer)
- ✅ Secure login/logout

**Real-time Dashboard**
- ✅ Live device status monitoring
- ✅ Real-time telemetry charts
- ✅ Device statistics overview
- ✅ WebSocket-based updates

**Device Management**
- ✅ Device listing with pagination
- ✅ Search and filtering
- ✅ Device status indicators
- ✅ Connection monitoring

**IoT Simulation**
- ✅ Cement plant device simulation
- ✅ Multiple device types (temperature, motor, power, vibration)
- ✅ Realistic telemetry data generation
- ✅ Connection/disconnection simulation

**Backend Services**
- ✅ REST APIs for all operations
- ✅ WebSocket server for real-time updates
- ✅ PostgreSQL with Prisma ORM
- ✅ Automatic device status detection

---

## 🏭 Cement Plant Use Case

The application simulates a cement manufacturing plant with:

**Device Types:**
- 🌡️ **Kiln Temperature Sensors** - Monitor kiln zones (800-1200°C)
- ⚙️ **Conveyor Motors** - Track RPM, current, temperature
- ⚡ **Power Meters** - Monitor power consumption and voltage
- 📳 **Vibration Sensors** - Detect equipment vibrations

**Real-time Monitoring:**
- Temperature threshold alerts (>1100°C)
- Power consumption warnings (>750kW)
- Device connectivity status
- Historical data visualization

---

## 🚀 Deployment

### Backend Deployment (Render/Railway)

1. **Create new service**
2. **Connect GitHub repository**
3. **Set environment variables:**
```env
DATABASE_URL=your-postgresql-url
JWT_SECRET=your-secret-key
PORT=3001
```
4. **Deploy from `/backend` directory**

### Frontend Deployment (Vercel)

1. **Connect GitHub repository**
2. **Set build settings:**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Root Directory: `frontend`
3. **Set environment variables:**
```env
NEXT_PUBLIC_API_URL=https://your-backend-url
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url
```

### Database (Neon/Supabase)

1. **Create PostgreSQL database**
2. **Copy connection string**
3. **Run migrations:**
```bash
npx prisma db push
npx prisma db seed
```

---

## 🔧 Development Commands

### Backend
```bash
npm run dev          # Start development server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Simulation
```bash
node src/simulator/runSimulation.js              # Start all devices
node src/simulator/runSimulation.js <server-url> # Connect to specific server
```

---

## 📝 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Devices
- `GET /api/devices` - List devices (with pagination/filtering)
- `GET /api/devices/:id` - Get device details
- `POST /api/devices` - Create device (Admin only)
- `PUT /api/devices/:id` - Update device (Admin/Operator)
- `DELETE /api/devices/:id` - Delete device (Admin only)
- `GET /api/devices/stats/overview` - Get device statistics

### Telemetry
- `GET /api/telemetry/device/:deviceId` - Get device telemetry
- `GET /api/telemetry/latest` - Get latest telemetry for all devices
- `GET /api/telemetry/aggregate/:deviceId` - Get aggregated telemetry

### WebSocket Events
- `device:register` - Register new device
- `telemetry:data` - Send telemetry data
- `device:heartbeat` - Device heartbeat
- `device:status` - Device status updates (broadcast)
- `telemetry:update` - Real-time telemetry (broadcast)

---

## 🎯 Next Steps for Production

1. **Security Enhancements**
   - Rate limiting
   - Input validation
   - CORS configuration
   - HTTPS enforcement

2. **Monitoring & Logging**
   - Application monitoring
   - Error tracking
   - Performance metrics
   - Audit logs

3. **Scalability**
   - Redis for session storage
   - Database connection pooling
   - Load balancing
   - CDN for static assets

4. **Additional Features**
   - Email notifications
   - Data export functionality
   - Advanced analytics
   - Mobile responsiveness improvements