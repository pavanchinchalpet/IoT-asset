import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const operatorPassword = await bcrypt.hash('operator123', 10);
  const viewerPassword = await bcrypt.hash('viewer123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@iot.com' },
      update: {},
      create: {
        email: 'admin@iot.com',
        password: adminPassword,
        role: 'ADMIN'
      }
    }),
    prisma.user.upsert({
      where: { email: 'operator@iot.com' },
      update: {},
      create: {
        email: 'operator@iot.com',
        password: operatorPassword,
        role: 'OPERATOR'
      }
    }),
    prisma.user.upsert({
      where: { email: 'viewer@iot.com' },
      update: {},
      create: {
        email: 'viewer@iot.com',
        password: viewerPassword,
        role: 'VIEWER'
      }
    })
  ]);

  console.log('👥 Created users:', users.map((u: any) => `${u.email} (${u.role})`));

  // Create cement plant devices
  const devices = await Promise.all([
    prisma.device.upsert({
      where: { id: 'kiln-temp-01' },
      update: {},
      create: {
        id: 'kiln-temp-01',
        name: 'Kiln Temperature Sensor #1',
        location: 'Kiln Area - Zone A',
        type: 'temperature'
      }
    }),
    prisma.device.upsert({
      where: { id: 'kiln-temp-02' },
      update: {},
      create: {
        id: 'kiln-temp-02',
        name: 'Kiln Temperature Sensor #2',
        location: 'Kiln Area - Zone B',
        type: 'temperature'
      }
    }),
    prisma.device.upsert({
      where: { id: 'conveyor-motor-01' },
      update: {},
      create: {
        id: 'conveyor-motor-01',
        name: 'Conveyor Motor #1',
        location: 'Production Line A',
        type: 'motor'
      }
    }),
    prisma.device.upsert({
      where: { id: 'power-meter-01' },
      update: {},
      create: {
        id: 'power-meter-01',
        name: 'Power Consumption Meter',
        location: 'Main Electrical Panel',
        type: 'power'
      }
    }),
    prisma.device.upsert({
      where: { id: 'vibration-01' },
      update: {},
      create: {
        id: 'vibration-01',
        name: 'Vibration Sensor',
        location: 'Crusher Unit',
        type: 'vibration'
      }
    })
  ]);

  console.log('🏭 Created cement plant devices:', devices.map((d: any) => d.name));

  // Generate some historical telemetry data
  const now = new Date();
  const hoursAgo = 24;
  
  for (const device of devices) {
    const telemetryData: Array<{
      deviceId: string;
      metric: string;
      value: number;
      unit: string;
      createdAt: Date;
    }> = [];
    
    for (let i = hoursAgo; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      
      switch (device.type) {
        case 'temperature':
          telemetryData.push({
            deviceId: device.id,
            metric: 'temperature',
            value: 800 + Math.random() * 400, // 800-1200°C
            unit: '°C',
            createdAt: timestamp
          });
          break;
          
        case 'motor':
          telemetryData.push({
            deviceId: device.id,
            metric: 'rpm',
            value: 1400 + Math.random() * 200, // 1400-1600 RPM
            unit: 'rpm',
            createdAt: timestamp
          });
          telemetryData.push({
            deviceId: device.id,
            metric: 'current',
            value: 15 + Math.random() * 10, // 15-25 A
            unit: 'A',
            createdAt: timestamp
          });
          break;
          
        case 'power':
          telemetryData.push({
            deviceId: device.id,
            metric: 'power',
            value: 500 + Math.random() * 300, // 500-800 kW
            unit: 'kW',
            createdAt: timestamp
          });
          telemetryData.push({
            deviceId: device.id,
            metric: 'voltage',
            value: 380 + Math.random() * 40, // 380-420 V
            unit: 'V',
            createdAt: timestamp
          });
          break;
          
        case 'vibration':
          telemetryData.push({
            deviceId: device.id,
            metric: 'vibration',
            value: Math.random() * 10, // 0-10 mm/s
            unit: 'mm/s',
            createdAt: timestamp
          });
          break;
      }
    }
    
    await prisma.telemetry.createMany({
      data: telemetryData
    });
  }

  console.log('📊 Generated historical telemetry data');
  console.log('✅ Seeding completed!');
  
  console.log('\n🔑 Login credentials:');
  console.log('Admin: admin@iot.com / admin123');
  console.log('Operator: operator@iot.com / operator123');
  console.log('Viewer: viewer@iot.com / viewer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });