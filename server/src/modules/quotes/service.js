import { PrismaClient, QuoteStatus } from "@prisma/client";
const prisma = new PrismaClient();

const generateQuoteNumber = async (organizationId) => {
  const count = await prisma.quote.count({ where: { organizationId } });
  const padded = String(count + 1).padStart(4, "0");
  return `QT-${padded}`;
};

export const createQuote = async (organizationId, userId, data) => {
  // Recalculate totals server-side
  let calculatedSubtotal = 0;
  let calculatedTax = 0;
  
  const items = data.items.map((item) => {
    const itemTotal = item.quantity * item.rate;
    const itemTax = item.tax || 0;
    calculatedSubtotal += itemTotal;
    calculatedTax += itemTax;
    
    return {
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      tax: itemTax,
      total: itemTotal + itemTax
    };
  });

  const calculatedTotal = calculatedSubtotal + calculatedTax;
  
  const quoteNumber = await generateQuoteNumber(organizationId);

  return await prisma.$transaction(async (tx) => {
    const newQuote = await tx.quote.create({
      data: {
        organizationId,
        customerId: data.customerId,
        createdById: userId,
        quoteNumber,
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        status: data.status || QuoteStatus.DRAFT,
        subtotal: calculatedSubtotal,
        tax: calculatedTax,
        total: calculatedTotal,
        items: {
          create: items
        }
      },
      include: {
        customer: true,
        items: true,
        createdBy: true
      }
    });

    return newQuote;
  });
};

export const getQuotes = async (organizationId, queries, userId, userRole) => {
  const { status, customerId, page = 1, limit = 10 } = queries;
  const skip = (page - 1) * limit;

  const where = { organizationId };
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  
  // If staff, can they only see their own?
  // "Staff can only see quotes from their organization" -> Already implied by where.organizationId.
  // The business rule says: 
  // - "Staff can only see quotes from their organization" - Organization filter covers this.

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      skip,
      take: limit,
      include: { customer: true, createdBy: true },
      orderBy: [{ createdAt: "desc" }]
    }),
    prisma.quote.count({ where })
  ]);

  return {
    data: quotes,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getQuoteById = async (organizationId, id) => {
  return await prisma.quote.findFirst({
    where: { organizationId, id },
    include: {
      items: true,
      customer: true,
      createdBy: true,
      organization: true
    }
  });
};

export const updateQuote = async (organizationId, quoteId, userId, userRole, data) => {
  const existingQuote = await prisma.quote.findFirst({
    where: { organizationId, id: quoteId }
  });

  if (!existingQuote) throw new Error("Quote not found");
  
  // "Staff can only edit quotes they created"
  if (userRole !== "admin" && existingQuote.createdById !== userId) {
    throw new Error("Forbidden: You can only edit quotes you created");
  }

  // Handle updates in transaction to ensure consistency
  // Note: Only updating status and dates for simplicity, or full recalculation if items change.
  // Full update for quotes allows modifying items too.
  return await prisma.$transaction(async (tx) => {
    let updateData = { ...data, items: undefined };

    if (data.items) {
      let calculatedSubtotal = 0;
      let calculatedTax = 0;
      
      const newItems = data.items.map(item => {
        const itemTotal = item.quantity * item.rate;
        const itemTax = item.tax || 0;
        calculatedSubtotal += itemTotal;
        calculatedTax += itemTax;
        
        return {
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          tax: itemTax,
          total: itemTotal + itemTax
        };
      });

      updateData.subtotal = calculatedSubtotal;
      updateData.tax = calculatedTax;
      updateData.total = calculatedSubtotal + calculatedTax;

      // Delete old items and insert new ones
      await tx.quoteItem.deleteMany({
        where: { quoteId }
      });

      updateData.items = {
        create: newItems
      };
    }

    if (updateData.issueDate) updateData.issueDate = new Date(updateData.issueDate);
    if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);

    return await tx.quote.update({
      where: { id: quoteId },
      data: updateData,
      include: {
        customer: true,
        items: true,
        createdBy: true
      }
    });
  });
};

export const deleteQuote = async (organizationId, quoteId, userId, userRole) => {
  const existingQuote = await prisma.quote.findFirst({
    where: { organizationId, id: quoteId }
  });

  if (!existingQuote) throw new Error("Quote not found");
  
  if (userRole !== "admin" && existingQuote.createdById !== userId) {
    throw new Error("Forbidden: You can only delete quotes you created");
  }

  return await prisma.quote.delete({
    where: { id: quoteId }
  });
};

