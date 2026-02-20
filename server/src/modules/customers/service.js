import { prisma } from "../../config/db.js";

export const createCustomer = async (organizationId, data) => {
  return await prisma.customer.create({
    data: {
      ...data,
      organizationId,
    },
  });
};

export const getCustomers = async (organizationId, { page = 1, limit = 10, search = "", filters = {} }) => {
  if (!organizationId) {
    return { data: [], total: 0, page: Number(page), limit: Number(limit) };
  }

  const skip = (page - 1) * limit;
  const where = {
    organizationId,
    ...filters,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count({ where }),
  ]);

  return { data, total, page: Number(page), limit: Number(limit) };
};

export const getCustomerById = async (organizationId, id, filters = {}) => {
  if (!organizationId) return null;
  return await prisma.customer.findFirst({
    where: { id, organizationId, ...filters },
  });
};

export const updateCustomer = async (organizationId, id, data, filters = {}) => {
  return await prisma.customer.updateMany({
    where: { id, organizationId, ...filters },
    data,
  });
};

export const deleteCustomer = async (organizationId, id, filters = {}) => {
  return await prisma.customer.deleteMany({
    where: { id, organizationId, ...filters },
  });
};
