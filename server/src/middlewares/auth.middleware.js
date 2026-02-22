import { auth } from "../auth/auth.js";
import { prisma } from "../config/db.js";

export const requireAuth = async (req, res, next) => {
  try {
    // Debug: log cookies and key headers on the server
    console.log(`Auth Debug - URL: ${req.originalUrl}, Cookie: ${req.headers.cookie ? 'Present' : 'Missing'}, Origin: ${req.headers.origin}, Host: ${req.headers.host}`);

    // Get session from Better Auth
    const authSession = await auth.api.getSession({
      headers: req.headers
    });
    
    if (!authSession || !authSession.session) {
      console.log("Auth Error: No Session Found for request to", req.originalUrl);
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch full user to get custom fields like role, isActive, organizationId
    const user = await prisma.user.findUnique({
      where: { id: authSession.user.id },
      include: { organization: true }
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Global middleware: block access if user is inactive
    if (!user.isActive) {
      return res.status(403).json({ error: "Account deactivated" });
    }

    // Attach user and session to request object
    req.user = user;
    req.session = authSession.session;
    
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
