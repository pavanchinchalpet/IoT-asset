import { io, Socket } from 'socket.io-client';
import { DeviceRegistration, TelemetryData, TelemetryMetric } from '../types';

interface DeviceConfig {
  id: string;
  name: string;
  location: string;
  type: string;
  telemetryInterval?: number;
}

class IoTDeviceSimulator {
  private config: DeviceConfig;
  private serverUrl: string;
  private socket: Socket | null = null;
  private isRunning: boolean = false;
  private telemetryInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(deviceConfig: DeviceConfig, serverUrl: string = 'http://localhost:3001') {
    this.config = deviceConfig;
    this.serverUrl = serverUrl;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        auth: {
          deviceId: this.config.id
        }
      });

      this.socket.on('connect', () => {
        console.log(`🔌 Device ${this.config.name} connected to server`);
        this.registerDevice();
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log(`🔌 Device ${this.config.name} disconnected`);
        this.isRunning = false;
      });

      this.socket.on('device:registered', (data: { success: boolean; device: any }) => {
        console.log(`✅ Device ${this.config.name} registered successfully`);
        this.startTelemetry();
        this.startHeartbeat();
      });

      this.socket.on('device:error', (error: { error: string }) => {
        console.error(`❌ Device ${this.config.name} error:`, error);
        reject(error);
      });

      this.socket.on('telemetry:error', (error: { error: string }) => {
        console.error(`📊 Telemetry error for ${this.config.name}:`, error);
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error(`🔌 Connection error for ${this.config.name}:`, error);
        reject(error);
      });
    });
  }

  private registerDevice(): void {
    if (!this.socket) return;

    const registrationData: DeviceRegistration = {
      deviceId: this.config.id,
      deviceName: this.config.name,
      location: this.config.location,
      type: this.config.type
    };

    this.socket.emit('device:register', registrationData);
  }

  private startTelemetry(): void {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
    }

    this.isRunning = true;
    this.telemetryInterval = setInterval(() => {
      if (!this.isRunning || !this.socket) return;

      const metrics = this.generateMetrics();
      const telemetryData: TelemetryData = {
        deviceId: this.config.id,
        metrics
      };

      this.socket.emit('telemetry:data', telemetryData);

      console.log(`📊 ${this.config.name} sent telemetry:`, 
        metrics.map(m => `${m.name}: ${m.value}${m.unit || ''}`).join(', ')
      );
    }, this.config.telemetryInterval || 5000);
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (!this.isRunning || !this.socket) return;

      this.socket.emit('device:heartbeat', {
        deviceId: this.config.id
      });
    }, 30000); // Every 30 seconds
  }

  private generateMetrics(): TelemetryMetric[] {
    const metrics: TelemetryMetric[] = [];

    switch (this.config.type) {
      case 'temperature':
        metrics.push({
          name: 'temperature',
          value: this.generateTemperature(),
          unit: '°C'
        });
        break;

      case 'motor':
        metrics.push(
          {
            name: 'rpm',
            value: this.generateRPM(),
            unit: 'rpm'
          },
          {
            name: 'current',
            value: this.generateCurrent(),
            unit: 'A'
          },
          {
            name: 'temperature',
            value: this.generateMotorTemperature(),
            unit: '°C'
          }
        );
        break;

      case 'power':
        metrics.push(
          {
            name: 'power',
            value: this.generatePower(),
            unit: 'kW'
          },
          {
            name: 'voltage',
            value: this.generateVoltage(),
            unit: 'V'
          },
          {
            name: 'current',
            value: this.generateCurrent(),
            unit: 'A'
          }
        );
        break;

      case 'vibration':
        metrics.push({
          name: 'vibration',
          value: this.generateVibration(),
          unit: 'mm/s'
        });
        break;

      default:
        metrics.push({
          name: 'value',
          value: Math.random() * 100
        });
    }

    return metrics;
  }

  private generateTemperature(): number {
    // Kiln temperature: 800-1200°C with some variation
    const baseTemp = 1000;
    const variation = 200;
    const noise = (Math.random() - 0.5) * 50;
    return Math.round((baseTemp + (Math.random() - 0.5) * variation + noise) * 10) / 10;
  }

  private generateRPM(): number {
    // Motor RPM: 1400-1600 with small variations
    const baseRPM = 1500;
    const variation = 100;
    const noise = (Math.random() - 0.5) * 20;
    return Math.round(baseRPM + (Math.random() - 0.5) * variation + noise);
  }

  private generateCurrent(): number {
    // Current: 15-25A with variations
    const baseCurrent = 20;
    const variation = 5;
    const noise = (Math.random() - 0.5) * 2;
    return Math.round((baseCurrent + (Math.random() - 0.5) * variation + noise) * 10) / 10;
  }

  private generateMotorTemperature(): number {
    // Motor temperature: 60-90°C
    const baseTemp = 75;
    const variation = 15;
    const noise = (Math.random() - 0.5) * 5;
    return Math.round((baseTemp + (Math.random() - 0.5) * variation + noise) * 10) / 10;
  }

  private generatePower(): number {
    // Power consumption: 500-800kW
    const basePower = 650;
    const variation = 150;
    const noise = (Math.random() - 0.5) * 30;
    return Math.round((basePower + (Math.random() - 0.5) * variation + noise) * 10) / 10;
  }

  private generateVoltage(): number {
    // Voltage: 380-420V
    const baseVoltage = 400;
    const variation = 20;
    const noise = (Math.random() - 0.5) * 5;
    return Math.round((baseVoltage + (Math.random() - 0.5) * variation + noise) * 10) / 10;
  }

  private generateVibration(): number {
    // Vibration: 0-10 mm/s
    const baseVibration = 3;
    const variation = 4;
    const noise = (Math.random() - 0.5) * 2;
    return Math.round((baseVibration + (Math.random() - 0.5) * variation + noise) * 100) / 100;
  }

  disconnect(): void {
    this.isRunning = false;
    
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    console.log(`🔌 Device ${this.config.name} simulator stopped`);
  }
}

export default IoTDeviceSimulator;