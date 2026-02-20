import { PrismaClient } from '@prisma/client';

const rawPrisma = new PrismaClient();

// Use Prisma Client Extension to prevent better-auth from crashing the server
// when trying to delete a Session that doesn't exist (e.g. concurrent logout or invalid token)
export const prisma = rawPrisma.$extends({
  query: {
    session: {
      async delete({ args, query }) {
        try {
          return await query(args);
        } catch (error) {
          if (error.code === 'P2025') {
            // Null or mock standard response, better-auth expects it to not throw if possible
            return null;
          }
          throw error;
        }
      }
    }
  }
});
