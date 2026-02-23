import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db.js';
import { generateToken } from '../../utils/jwt.js';

export const registerOrganization = async ({ name, email, password, organizationName }) => {
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('User already exists');
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const user = await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
            data: {
                name: organizationName,
            },
        });

        return await tx.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'admin',
                organizationId: organization.id,
            },
        });
    });

    const token = generateToken({
        userId: user.id,
        role: user.role,
        organizationId: user.organizationId,
    });

    return { user, token };
};

export const loginUser = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true },
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
        throw new Error('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    const token = generateToken({
        userId: user.id,
        role: user.role,
        organizationId: user.organizationId,
    });

    return { user, token };
};

export const getUserById = async (id) => {
    return await prisma.user.findUnique({
        where: { id },
        include: { organization: true },
    });
};
