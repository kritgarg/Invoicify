import { prisma } from "../../config/db.js";

export const createPayment = async (organizationId, invoiceId, data) => {
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: { payments: true }
    });
    
    if (!invoice) throw new Error("Invoice not found");

    const payment = await tx.payment.create({
      data: {
        organizationId,
        invoiceId,
        amount: data.amount,
        method: data.method,
      }
    });

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + data.amount;
    
    let newStatus = invoice.status;
    if (totalPaid >= invoice.total && invoice.status !== "PAID") {
      newStatus = "PAID";
    }

    if (newStatus !== invoice.status) {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus }
      });
    }

    return payment;
  });
};

export const getPaymentsByInvoice = async (organizationId, invoiceId) => {
  if (!organizationId) return [];
  return await prisma.payment.findMany({
    where: { invoiceId, organizationId },
    orderBy: { paymentDate: "desc" },
  });
};

export const deletePayment = async (organizationId, paymentId, assignedToId) => {
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { id: paymentId, organizationId },
      include: { invoice: { include: { customer: true } } }
    });

    if (!payment) throw new Error("Payment not found");
    if (assignedToId && payment.invoice.customer.assignedToId !== assignedToId) {
       throw new Error("Payment not found");
    }

    await tx.payment.delete({
      where: { id: paymentId }
    });

    const remainingPayments = await tx.payment.findMany({
      where: { invoiceId: payment.invoiceId, organizationId }
    });
    const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);

    let newStatus = payment.invoice.status;
    if (totalPaid < payment.invoice.total && payment.invoice.status === "PAID") {
      newStatus = "SENT";
      if (payment.invoice.dueDate < new Date()) {
        newStatus = "OVERDUE";
      }
    }

    if (newStatus !== payment.invoice.status) {
      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: newStatus }
      });
    }
  });
};
