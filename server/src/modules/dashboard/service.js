import { prisma } from "../../config/db.js";

export const getSummary = async (organizationId) => {
  if (!organizationId) {
    return { totalRevenue: 0, totalPending: 0, invoiceCount: 0 };
  }

  const [totalRevenueResult, totalPendingResult, invoiceCount] = await Promise.all([
    prisma.invoice.aggregate({
      where: { organizationId, status: "PAID" },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { organizationId, status: { in: ["DRAFT", "SENT", "OVERDUE"] } },
      _sum: { total: true },
    }),
    prisma.invoice.count({
      where: { organizationId },
    }),
  ]);

  return {
    totalRevenue: totalRevenueResult._sum.total || 0,
    totalPending: totalPendingResult._sum.total || 0,
    invoiceCount,
  };
};

export const getRevenue = async (organizationId, range) => {
  if (!organizationId) {
    return [];
  }

  let startDate = new Date();
  if (range === "7d") startDate.setDate(startDate.getDate() - 7);
  else if (range === "30d") startDate.setDate(startDate.getDate() - 30);
  else if (range === "90d") startDate.setDate(startDate.getDate() - 90);
  else startDate = new Date(0); 

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: "PAID",
      issueDate: { gte: startDate },
    },
    select: {
      issueDate: true,
      total: true,
    },
    orderBy: { issueDate: "asc" }
  });

  
  const groupedData = invoices.reduce((acc, invoice) => {
    const date = invoice.issueDate.toISOString().split("T")[0];
    if (!acc[date]) acc[date] = 0;
    acc[date] += invoice.total;
    return acc;
  }, {});

  return Object.keys(groupedData).map(date => ({
    date,
    revenue: groupedData[date]
  }));
};
