import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../config/db.js';

export const authenticate = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Verify user is still active in DB
    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { isActive: true }
    });

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized: User no longer exists' });
    }

    if (!user.isActive) {
        return res.status(403).json({ error: 'Forbidden: Account is deactivated' });
    }

    req.user = {
        id: decoded.userId,
        role: decoded.role,
        organizationId: decoded.organizationId
    };
    next();
};

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};
