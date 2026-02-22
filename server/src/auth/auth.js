import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization } from "better-auth/plugins";
import { prisma } from "../config/db.js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8080/api/auth",
  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin(),
    organization()
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Verify if this user was created without an organization (e.g. public signup)
          // We refetch because Better Auth `user` param might not have `organizationId` depending on schema config.
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
          if (dbUser && !dbUser.organizationId) {
            // First signup public flow: Create a new Organization
            const orgTitle = user.name ? `${user.name}'s Organization` : "My Organization";
            const newOrg = await prisma.organization.create({
              data: { name: orgTitle, slug: `${user.id}-org` }
            });
            // Assing user to this new organization and set role to admin
            await prisma.user.update({
              where: { id: user.id },
              data: {
                role: "admin",
                organizationId: newOrg.id
              }
            });
          }
        }
      }
    }
  },
  logger: {
    level: "debug"
  },
  advanced: {
    cookieOptions: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production" ? true : false,
    }
  }
});
