import { prisma } from "../../config/db.js";

export const createInvoice = async (organizationId, data) => {
  const { customerId, items, issueDate, dueDate, taxRate } = data;
  
  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const invoiceIssueDate = issueDate ? new Date(issueDate) : new Date();
  const invoiceDueDate = dueDate ? new Date(dueDate) : new Date(new Date().setDate(new Date().getDate() + 30));

  // Transaction
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        organizationId,
        customerId,
        issueDate: invoiceIssueDate,
        dueDate: invoiceDueDate,
        subtotal,
        tax,
        total,
        status: "DRAFT",
      },
    });

    const invoiceItemsData = items.map(item => ({
      organizationId,
      invoiceId: invoice.id,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price,
    }));

    await tx.invoiceItem.createMany({
      data: invoiceItemsData,
    });

    return await tx.invoice.findUnique({
      where: { id: invoice.id },
      include: { items: true },
    });
  });
};

export const getInvoices = async (organizationId, { status, startDate, endDate, customerId, assignedToId, page = 1, limit = 10 }) => {
  if (!organizationId) {
    return { data: [], total: 0, page: Number(page), limit: Number(limit) };
  }

  const skip = (page - 1) * limit;
  const where = {
    organizationId,
    ...(status && { status }),
    ...(customerId && { customerId }),
    ...(assignedToId && { customer: { assignedToId } }),
    ...((startDate || endDate) && {
      issueDate: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      }
    })
  };

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { issueDate: "desc" },
      include: { customer: true },
    }),
    prisma.invoice.count({ where }),
  ]);

  const now = new Date();
  const processedData = data.map(inv => {
    if (inv.status !== "PAID" && inv.status !== "DRAFT" && new Date(inv.dueDate) < now) {
      return { ...inv, status: "OVERDUE" };
    }
    return inv;
  });

  return { data: processedData, total, page: Number(page), limit: Number(limit) };
};

export const updateInvoiceStatus = async (organizationId, id, status) => {
  await prisma.invoice.updateMany({
    where: { id, organizationId },
    data: { status },
  });
};

export const updateInvoiceStatusMany = async (organizationId, id, status) => {
  await prisma.invoice.updateMany({
    where: { id, organizationId },
    data: { status },
  });
};

export const getInvoiceById = async (organizationId, id, assignedToId) => {
  if (!organizationId) return null;
  const invoice = await prisma.invoice.findFirst({
    where: { 
      id, 
      organizationId,
      ...(assignedToId && { customer: { assignedToId } })
    },
    include: { items: true, customer: true, payments: true },
  });

  if (invoice && invoice.status !== "PAID" && invoice.status !== "DRAFT" && new Date(invoice.dueDate) < new Date()) {
    invoice.status = "OVERDUE";
  }
  return invoice;
};

export const deleteInvoice = async (organizationId, id, assignedToId) => {
  if (assignedToId) {
    const inv = await getInvoiceById(organizationId, id, assignedToId);
    if (!inv) return null;
  }
  return await prisma.invoice.deleteMany({
    where: { id, organizationId },
  });
};

export const updateInvoice = async (organizationId, id, data, assignedToId) => {
  const { customerId, items, issueDate, dueDate, taxRate, status } = data;
  
  return await prisma.$transaction(async (tx) => {
    const current = await tx.invoice.findFirst({
      where: { 
        id, 
        organizationId,
        ...(assignedToId && { customer: { assignedToId } })
      },
      include: { items: true },
    });
    if (!current) throw new Error("Invoice not found");

    let subtotal = current.subtotal;
    let tax = current.tax;
    let total = current.total;

    if (items) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      subtotal = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
      tax = subtotal * ((taxRate !== undefined ? taxRate : (current.tax / current.subtotal * 100 || 0)) / 100);
      total = subtotal + tax;

      const invoiceItemsData = items.map(item => ({
        organizationId,
        invoiceId: id,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      }));
      await tx.invoiceItem.createMany({ data: invoiceItemsData });
    } else if (taxRate !== undefined) {
      tax = subtotal * (taxRate / 100);
      total = subtotal + tax;
    }

    const updated = await tx.invoice.update({
      where: { id },
      data: {
        ...(customerId && { customerId }),
        ...(issueDate && { issueDate: new Date(issueDate) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(status && { status }),
        subtotal,
        tax,
        total,
      },
      include: { items: true, customer: true, payments: true },
    });

    if (updated.status !== "PAID" && updated.status !== "DRAFT" && new Date(updated.dueDate) < new Date()) {
      updated.status = "OVERDUE";
    }

    return updated;
  });
};
