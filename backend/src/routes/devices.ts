import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { DeviceQuery, DeviceStats } from '../types';

const router = express.Router();
const prisma = new PrismaClient();

// Get all devices with pagination and filtering
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      status = 'all',
      type = 'all'
    } = req.query as DeviceQuery;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { location: { contains: search, mode: 'insensitive' as const } }
          ]
        } : {},
        status !== 'all' ? { isOnline: status === 'online' } : {},
        type !== 'all' ? { type } : {}
      ]
    };

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { telemetry: true }
          }
        }
      }),
      prisma.device.count({ where })
    ]);

    res.json({
      devices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get device by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        telemetry: {
          orderBy: { createdAt: 'desc' },
          take: 100
        },
        _count: {
          select: { telemetry: true }
        }
      }
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    return res.json(device);
  } catch (error) {
    console.error('Get device error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create device (Admin only)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { name, location, type = 'sensor' } = req.body;

    const device = await prisma.device.create({
      data: {
        name,
        location,
        type
      }
    });

    res.status(201).json(device);
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update device (Admin/Operator)
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'OPERATOR']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location, type } = req.body;

    const device = await prisma.device.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(type && { type })
      }
    });

    res.json(device);
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete device (Admin only)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.device.delete({
      where: { id }
    });

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get device statistics
router.get('/stats/overview', authenticateToken, async (req: Request, res: Response) => {
  try {
    const [total, online, offline, telemetryCount] = await Promise.all([
      prisma.device.count(),
      prisma.device.count({ where: { isOnline: true } }),
      prisma.device.count({ where: { isOnline: false } }),
      prisma.telemetry.count()
    ]);

    const stats: DeviceStats = {
      total,
      online,
      offline,
      telemetryCount
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;