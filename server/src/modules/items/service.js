import { prisma } from "../../config/db.js";

export const createItem = async (organizationId, data) => {
  return await prisma.item.create({
    data: {
      ...data,
      organizationId,
    },
  });
};

export const getItems = async (organizationId, { page = 1, limit = 10, search = "" }) => {
  if (!organizationId) {
    return { data: [], total: 0, page: Number(page), limit: Number(limit) };
  }

  const skip = (page - 1) * limit;
  const where = {
    organizationId,
    ...(search && {
      name: { contains: search, mode: "insensitive" },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.item.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.item.count({ where }),
  ]);

  return { data, total, page: Number(page), limit: Number(limit) };
};

export const getItemById = async (organizationId, id) => {
  if (!organizationId) return null;
  return await prisma.item.findFirst({
    where: { id, organizationId },
  });
};

export const updateItem = async (organizationId, id, data) => {
  return await prisma.item.updateMany({
    where: { id, organizationId },
    data,
  });
};

export const deleteItem = async (organizationId, id) => {
  return await prisma.item.deleteMany({
    where: { id, organizationId },
  });
};
