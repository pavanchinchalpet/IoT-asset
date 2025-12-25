# IoT Asset Management Dashboard

A full-stack web application for managing and monitoring IoT devices with role-based user access, featuring real-time data visualization and cement plant monitoring simulation.

## 🚀 Live Demo

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **WebSocket**: http://localhost:3001

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with SSR
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Time-series charts and data visualization
- **Socket.io Client** - Real-time WebSocket communication
- **Axios** - HTTP client for API calls
- **Lucide React** - Modern icon library

### Backend
- **Node.js + Express** - Server framework
- **TypeScript** - Type-safe server development
- **Socket.io** - WebSocket server for real-time communication
- **JWT Authentication** - Secure token-based auth
- **Prisma ORM** - Database toolkit and query builder
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Database
- **Neon PostgreSQL** - Cloud-hosted PostgreSQL database
- **Prisma Schema** - Database modeling and migrations

## ✨ Features

### 🔐 Authentication & Authorization
- Role-based access control (Admin, Operator, Viewer)
- JWT token-based authentication
- Secure password hashing
- Session management

### 📊 Real-time Dashboard
- Live device status monitoring
- Real-time telemetry data updates
- Interactive time-series charts
- Device connectivity indicators
- System statistics and metrics

### 📱 Device Management
- Device listing with pagination
- Advanced search and filtering
- Device registration and configuration
- Connection status tracking
- Device type categorization

### 🏭 Cement Plant Simulation
- **Kiln Temperature Sensors** (800-1200°C)
- **Conveyor Motor Sensors** (RPM, Current)
- **Power Consumption Meters** (kW, Voltage)
- **Vibration Sensors** (mm/s)
- Real-time alerts and thresholds
- Historical data visualization

### 📈 Analytics
- Device performance metrics
- Telemetry trend analysis
- Efficiency calculations
- Alert history tracking
- Data export capabilities

## 🏗️ Project Structure

```
IoT/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth middleware
│   │   ├── socket/         # WebSocket handlers
│   │   ├── simulator/      # IoT device simulation
│   │   ├── types/          # TypeScript definitions
│   │   └── server.ts       # Main server file
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── .env                # Environment variables
│   └── package.json
│
├── frontend/               # Next.js React app
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   └── contexts/      # React contexts
│   ├── .env               # Environment variables
│   ├── .env.local         # Local overrides
│   └── package.json
│
├── README.md              # This file
├── SETUP.md              # Detailed setup guide
└── QUICK_START.md        # Quick start guide
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Neon PostgreSQL** account (free tier available)

### 1. Clone & Install
```bash
# Clone the repository
git clone <your-repo-url>
cd IoT

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with sample data
npm run db:seed
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# → Runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# → Runs on http://localhost:3000
```

**Terminal 3 - IoT Simulator (Optional):**
```bash
cd backend
npm run simulate
# → Connects to backend and sends fake sensor data
```

## 🔧 Environment Configuration

### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-128-characters-long"
PORT=3001
```

### Frontend (.env)
```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Application Settings
NEXT_PUBLIC_APP_NAME=IoT Asset Management Dashboard
NEXT_PUBLIC_ENVIRONMENT=development
```

### Frontend (.env.local)
```env
# Local Development Overrides
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEBUG_MODE=true
```

## 👥 Default User Accounts

After running `npm run db:seed`, you can login with:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | admin@iot.com | admin123 | Full access, user management |
| **Operator** | operator@iot.com | operator123 | Device control, monitoring |
| **Viewer** | viewer@iot.com | viewer123 | Read-only access |

## 📊 Database Schema

### Tables
- **User** - Authentication and role management
- **Device** - IoT device information and status
- **Telemetry** - Sensor data and metrics

### Relationships
- User → Role (ADMIN, OPERATOR, VIEWER)
- Device → Telemetry (One-to-Many)
- Device types: temperature, motor, power, vibration

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Devices
- `GET /api/devices` - List devices (with pagination)
- `GET /api/devices/:id` - Get device details
- `POST /api/devices` - Create device (Admin only)
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device (Admin only)
- `GET /api/devices/stats/overview` - Device statistics

### Telemetry
- `GET /api/telemetry/device/:deviceId` - Get device telemetry
- `GET /api/telemetry/latest` - Latest telemetry for all devices
- `GET /api/telemetry/aggregate/:deviceId` - Aggregated telemetry data

## 🔄 WebSocket Events

### Client → Server
- `device:register` - Register IoT device
- `telemetry:data` - Send sensor data
- `device:heartbeat` - Device keepalive

### Server → Client
- `device:status` - Device online/offline status
- `telemetry:update` - Real-time telemetry data
- `device:registered` - Device registration confirmation

## 🧪 Available Scripts

### Backend
```bash
npm run dev        # Start development server
npm run build      # Build TypeScript
npm run start      # Start production server
npm run simulate   # Run IoT device simulator
npm run db:generate # Generate Prisma client
npm run db:push    # Push schema to database
npm run db:seed    # Seed database with sample data
```

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use:**
- Backend uses port 3001, frontend uses port 3000
- Change ports in `.env` files if needed

**Database Connection Issues:**
- Ensure Neon database is active (free tier sleeps after inactivity)
- Check DATABASE_URL format and credentials
- Run `npx prisma db push` to wake up the database

**TypeScript Errors:**
- Run `npx prisma generate` after schema changes
- Restart TypeScript language server in VS Code

**WebSocket Connection Failed:**
- Ensure backend is running before starting simulator
- Check CORS settings in backend server

## 🚀 Production Deployment

### Recommended Platforms
- **Frontend**: Vercel, Netlify
- **Backend**: Render, Railway, Fly.io
- **Database**: Neon PostgreSQL (already configured)

### Environment Variables for Production
- Generate new JWT_SECRET for production
- Update NEXT_PUBLIC_API_URL to production backend URL
- Enable SSL/HTTPS for all connections

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the SETUP.md file
- Open an issue on GitHub