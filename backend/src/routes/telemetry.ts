import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { TelemetryQuery } from '../types';

const router = express.Router();
const prisma = new PrismaClient();

// Get telemetry data for a device
router.get('/device/:deviceId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const {
      metric = 'all',
      hours = '24',
      limit = '1000'
    } = req.query as TelemetryQuery;

    const hoursAgo = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);
    const limitNum = Math.min(parseInt(limit), 5000); // Cap at 5000 for performance

    const where = {
      deviceId,
      createdAt: { gte: hoursAgo },
      ...(metric !== 'all' && { metric })
    };

    const telemetry = await prisma.telemetry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limitNum,
      select: {
        id: true,
        metric: true,
        value: true,
        unit: true,
        createdAt: true
      }
    });

    res.json(telemetry);
  } catch (error) {
    console.error('Get telemetry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest telemetry for all devices
router.get('/latest', authenticateToken, async (req: Request, res: Response) => {
  try {
    const devices = await prisma.device.findMany({
      select: {
        id: true,
        name: true,
        isOnline: true,
        lastSeenAt: true,
        telemetry: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            metric: true,
            value: true,
            unit: true,
            createdAt: true
          }
        }
      }
    });

    const latestTelemetry = devices.map((device: any) => ({
      deviceId: device.id,
      deviceName: device.name,
      isOnline: device.isOnline,
      lastSeen: device.lastSeenAt,
      latestData: device.telemetry[0] || null
    }));

    res.json(latestTelemetry);
  } catch (error) {
    console.error('Get latest telemetry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get aggregated telemetry data
router.get('/aggregate/:deviceId', authenticateToken, async (req: Request, res: Response): Promise<Response> => {
  try {
    const { deviceId } = req.params;
    const { metric, hours = '24' } = req.query as TelemetryQuery;

    if (!metric) {
      return res.status(400).json({ error: 'Metric parameter is required' });
    }

    const hoursAgo = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

    const telemetry = await prisma.telemetry.findMany({
      where: {
        deviceId,
        metric,
        createdAt: { gte: hoursAgo }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        value: true,
        createdAt: true
      }
    });

    if (telemetry.length === 0) {
      return res.json({ data: [], stats: null });
    }

    const values = telemetry.map((t: any) => t.value);
    const stats = {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
      count: values.length
    };

    return res.json({
      data: telemetry,
      stats
    });
  } catch (error) {
    console.error('Get aggregate telemetry error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;