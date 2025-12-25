import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { DeviceRegistration, TelemetryData, ConnectedDevice } from '../types';

const prisma = new PrismaClient();

export const setupSocketHandlers = (io: Server): void => {
  const connectedDevices = new Map<string, ConnectedDevice>();

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Device registration
    socket.on('device:register', async (data: DeviceRegistration) => {
      try {
        const { deviceId, deviceName, location, type } = data;
        
        // Update or create device
        const device = await prisma.device.upsert({
          where: { id: deviceId },
          update: {
            isOnline: true,
            lastSeenAt: new Date()
          },
          create: {
            id: deviceId,
            name: deviceName,
            location: location || 'Unknown',
            type: type || 'sensor',
            isOnline: true,
            lastSeenAt: new Date()
          }
        });

        connectedDevices.set(deviceId, {
          socketId: socket.id,
          device
        });

        socket.join(`device:${deviceId}`);
        
        console.log(`📱 Device registered: ${deviceName} (${deviceId})`);
        
        // Broadcast device status update
        io.emit('device:status', {
          deviceId,
          isOnline: true,
          lastSeenAt: new Date()
        });

        socket.emit('device:registered', { success: true, device });
      } catch (error) {
        console.error('Device registration error:', error);
        socket.emit('device:error', { error: 'Registration failed' });
      }
    });

    // Telemetry data reception with batching
    socket.on('telemetry:data', async (data: TelemetryData) => {
      try {
        const { deviceId, metrics } = data;

        if (!deviceId || !metrics || !Array.isArray(metrics)) {
          socket.emit('telemetry:error', { error: 'Invalid telemetry data format' });
          return;
        }

        // Batch create telemetry records for better performance
        const telemetryRecords = await prisma.telemetry.createMany({
          data: metrics.map(metric => ({
            deviceId,
            metric: metric.name,
            value: metric.value,
            unit: metric.unit || null
          }))
        });

        // Update device last seen
        await prisma.device.update({
          where: { id: deviceId },
          data: { lastSeenAt: new Date() }
        });

        // Get the created records for broadcasting
        const createdRecords = await prisma.telemetry.findMany({
          where: {
            deviceId,
            createdAt: { gte: new Date(Date.now() - 1000) } // Last second
          },
          orderBy: { createdAt: 'desc' },
          take: metrics.length
        });

        // Broadcast telemetry to dashboard clients
        io.emit('telemetry:update', {
          deviceId,
          data: createdRecords,
          timestamp: new Date()
        });

        console.log(`📊 Telemetry received from ${deviceId}: ${metrics.length} metrics`);
      } catch (error) {
        console.error('Telemetry processing error:', error);
        socket.emit('telemetry:error', { error: 'Failed to process telemetry' });
      }
    });

    // Device heartbeat
    socket.on('device:heartbeat', async (data: { deviceId: string }) => {
      try {
        const { deviceId } = data;
        
        await prisma.device.update({
          where: { id: deviceId },
          data: { lastSeenAt: new Date() }
        });

        socket.emit('device:heartbeat:ack', { timestamp: new Date() });
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);

      // Find and mark device as offline
      for (const [deviceId, deviceInfo] of connectedDevices.entries()) {
        if (deviceInfo.socketId === socket.id) {
          try {
            await prisma.device.update({
              where: { id: deviceId },
              data: { isOnline: false }
            });

            // Broadcast device offline status
            io.emit('device:status', {
              deviceId,
              isOnline: false,
              lastSeenAt: new Date()
            });

            connectedDevices.delete(deviceId);
            console.log(`📱 Device offline: ${deviceId}`);
          } catch (error) {
            console.error('Device disconnect error:', error);
          }
          break;
        }
      }
    });
  });

  // Periodic cleanup of stale devices (optimized)
  setInterval(async () => {
    try {
      const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
      
      const staleDevices = await prisma.device.findMany({
        where: {
          isOnline: true,
          lastSeenAt: { lt: staleThreshold }
        },
        select: {
          id: true,
          lastSeenAt: true
        }
      });

      if (staleDevices.length > 0) {
        // Batch update for better performance
        await prisma.device.updateMany({
          where: {
            isOnline: true,
            lastSeenAt: { lt: staleThreshold }
          },
          data: { isOnline: false }
        });

        staleDevices.forEach((device: any) => {
          io.emit('device:status', {
            deviceId: device.id,
            isOnline: false,
            lastSeenAt: device.lastSeenAt
          });
          connectedDevices.delete(device.id);
        });

        console.log(`🧹 Marked ${staleDevices.length} stale devices as offline`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, 60000); // Run every minute
};