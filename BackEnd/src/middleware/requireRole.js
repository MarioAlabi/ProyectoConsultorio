import { auth } from "../config/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export const requireRole = (allowedRoles) => async (req, res, next) => {
    try {
        if (!req.user) {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });

            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: "Access denied: You must log in to view this content.",
                });
            }

            req.user = session.user;
            req.session = session.session;
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to access this resource.",
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};
