import IoTDeviceSimulator from './deviceSimulator';

interface DeviceConfig {
  id: string;
  name: string;
  location: string;
  type: string;
  telemetryInterval: number;
}

// Cement Plant Device Configurations
const deviceConfigs: DeviceConfig[] = [
  {
    id: 'kiln-temp-01',
    name: 'Kiln Temperature Sensor #1',
    location: 'Kiln Area - Zone A',
    type: 'temperature',
    telemetryInterval: 3000 // 3 seconds
  },
  {
    id: 'kiln-temp-02',
    name: 'Kiln Temperature Sensor #2',
    location: 'Kiln Area - Zone B',
    type: 'temperature',
    telemetryInterval: 3000
  },
  {
    id: 'conveyor-motor-01',
    name: 'Conveyor Motor #1',
    location: 'Production Line A',
    type: 'motor',
    telemetryInterval: 5000 // 5 seconds
  },
  {
    id: 'power-meter-01',
    name: 'Power Consumption Meter',
    location: 'Main Electrical Panel',
    type: 'power',
    telemetryInterval: 10000 // 10 seconds
  },
  {
    id: 'vibration-01',
    name: 'Vibration Sensor',
    location: 'Crusher Unit',
    type: 'vibration',
    telemetryInterval: 2000 // 2 seconds
  }
];

class CementPlantSimulation {
  private serverUrl: string;
  private devices: IoTDeviceSimulator[] = [];
  private isRunning: boolean = false;

  constructor(serverUrl: string = 'http://localhost:8000') {
    this.serverUrl = serverUrl;
  }

  async start(): Promise<void> {
    console.log('🏭 Starting Cement Plant IoT Simulation...');
    console.log(`🔗 Connecting to server: ${this.serverUrl}`);

    this.isRunning = true;

    // Create and connect all devices
    for (const config of deviceConfigs) {
      try {
        const device = new IoTDeviceSimulator(config, this.serverUrl);
        await device.connect();
        this.devices.push(device);
        
        // Add small delay between device connections
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to connect device ${config.name}:`, error);
      }
    }

    console.log(`✅ Connected ${this.devices.length}/${deviceConfigs.length} devices`);
    console.log('🚀 Cement Plant simulation is running...');
    console.log('📊 Telemetry data is being sent to the dashboard');
    console.log('Press Ctrl+C to stop the simulation');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping simulation...');
      this.stop();
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Stopping simulation...');
      this.stop();
    });
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    console.log('🔌 Disconnecting all devices...');

    this.devices.forEach(device => {
      device.disconnect();
    });

    console.log('✅ Simulation stopped');
    process.exit(0);
  }

  // Add random device failures for realistic simulation
  simulateRandomFailures(): void {
    if (!this.isRunning) return;

    setInterval(() => {
      if (this.devices.length === 0) return;

      // 5% chance of temporary device failure
      if (Math.random() < 0.05) {
        const randomDevice = this.devices[Math.floor(Math.random() * this.devices.length)];
        console.log(`⚠️  Simulating temporary failure for ${randomDevice['config'].name}`);
        
        randomDevice.disconnect();
        
        // Reconnect after 30-60 seconds
        const reconnectDelay = 30000 + Math.random() * 30000;
        setTimeout(async () => {
          try {
            console.log(`🔄 Reconnecting ${randomDevice['config'].name}`);
            await randomDevice.connect();
          } catch (error) {
            console.error(`Failed to reconnect ${randomDevice['config'].name}:`, error);
          }
        }, reconnectDelay);
      }
    }, 60000); // Check every minute
  }
}

// Start simulation if this file is run directly
if (require.main === module) {
  const serverUrl = process.argv[2] || 'http://localhost:8000';
  const simulation = new CementPlantSimulation(serverUrl);
  
  simulation.start().catch(error => {
    console.error('Failed to start simulation:', error);
    process.exit(1);
  });

  // Enable random failures after 2 minutes
  setTimeout(() => {
    simulation.simulateRandomFailures();
  }, 120000);
}

export default CementPlantSimulation;