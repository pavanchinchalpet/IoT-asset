export interface User {
  id: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  createdAt: Date;
}

export interface Device {
  id: string;
  name: string;
  location: string | null;
  type: string;
  isOnline: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
  telemetryCount?: number;
  _count?: {
    telemetry: number;
  };
}

export interface Telemetry {
  id: string;
  deviceId: string;
  metric: string;
  value: number;
  unit: string | null;
  createdAt: Date;
}

export interface DeviceRegistration {
  deviceId: string;
  deviceName: string;
  location?: string;
  type?: string;
}

export interface TelemetryData {
  deviceId: string;
  metrics: TelemetryMetric[];
}

export interface TelemetryMetric {
  name: string;
  value: number;
  unit?: string;
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface DeviceQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  type?: string;
}

export interface TelemetryQuery {
  metric?: string;
  hours?: string;
  limit?: string;
}

export interface ConnectedDevice {
  socketId: string;
  device: Device;
}

export interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  telemetryCount: number;
}