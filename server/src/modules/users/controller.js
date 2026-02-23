import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/db.js";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8)
});

export const createUser = async (req, res) => {
  try {
    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { email, name, password } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const completeUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "staff",
        organizationId: req.user.organizationId,
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

export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.userId) {
       return res.status(400).json({ error: "Cannot deactivate your own account" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.organizationId !== req.user.organizationId) {
       return res.status(403).json({ error: "Forbidden: User in different organization" });
    }

    const deactivatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false }
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

export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.organizationId !== req.user.organizationId) {
       return res.status(403).json({ error: "Forbidden: User in different organization" });
    }

    const activatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: true }
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

export const getUsers = async (req, res) => {
  try {
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

export const updateOrganization = async (req, res) => {
  try {
    const { name, currency } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const updatedOrg = await prisma.organization.update({
      where: { id: req.user.organizationId },
      data: { 
        name,
        ...(currency && { currency: currency.toUpperCase() })
      }
    });

    res.status(200).json({ organization: updatedOrg });
  } catch (error) {
    console.error("Update Organization Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
