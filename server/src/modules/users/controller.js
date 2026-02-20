import { z } from "zod";
import { prisma } from "../../config/db.js";
import { auth } from "../../auth/auth.js";
import { hashPassword } from "better-auth/crypto";

// Validation schema for creating a user
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8)
});

// POST /users
export const createUser = async (req, res) => {
  try {
    const validationDate = createUserSchema.safeParse(req.body);
    if (!validationDate.success) {
      return res.status(400).json({ error: validationDate.error.errors });
    }
    
    const { email, name, password } = validationDate.data;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await hashPassword(password);

    // Create the staff user natively using Prisma
    const completeUser = await prisma.user.create({
      data: {
        email,
        name,
        role: "staff",
        organizationId: req.user.organizationId,
        emailVerified: true,
      }
    });

    // Create the Better Auth account record with hashed password
    await prisma.account.create({
      data: {
        accountId: email,
        providerId: "credential",
        userId: completeUser.id,
        password: hashedPassword,
      }
    });

    res.status(201).json({
      message: "Staff user created successfully",
      user: {
        id: completeUser.id,
        email: completeUser.email,
        name: completeUser.name,
        role: completeUser.role,
        organizationId: completeUser.organizationId
      }
    });
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// PATCH /users/:id/deactivate
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: prevent self-deactivation 
    if (id === req.user.id) {
       return res.status(400).json({ error: "Cannot deactivate your own admin account" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Ensure they belong to the same organization
    if (targetUser.organizationId !== req.user.organizationId) {
       return res.status(403).json({ error: "Forbidden: User in different organization" });
    }

    const deactivatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    res.status(200).json({
      message: "User deactivated successfully",
      user: { id: deactivatedUser.id, isActive: deactivatedUser.isActive }
    });
  } catch (error) {
    console.error("Deactivate User Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// PATCH /users/:id/activate
export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Ensure they belong to the same organization
    if (targetUser.organizationId !== req.user.organizationId) {
       return res.status(403).json({ error: "Forbidden: User in different organization" });
    }

    const activatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: true
      }
    });

    res.status(200).json({
      message: "User activated successfully",
      user: { id: activatedUser.id, isActive: activatedUser.isActive }
    });
  } catch (error) {
    console.error("Activate User Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /users
export const getUsers = async (req, res) => {
  try {
    if (!req.user.organizationId) {
      return res.status(200).json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: { organizationId: req.user.organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /me
export const getCurrentUser = async (req, res) => {
  try {
    // req.user is attached by the requireAuth middleware
    if (!req.user) {
      return res.status(404).json({ error: "Session missing user" });
    }

    // Exclude password and sensitive info if any were attached
    const { password, ...safeUser } = req.user;
    
    res.status(200).json({ user: safeUser });
  } catch (error) {
    console.error("Get Current User Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// PATCH /users/organization
export const updateOrganization = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can update organization details" });
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: req.user.organizationId },
      data: { name }
    });

    res.status(200).json({ organization: updatedOrg });
  } catch (error) {
    console.error("Update Organization Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
