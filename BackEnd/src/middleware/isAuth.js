import { auth } from "../config/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export const isAuth = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });
        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Access denied: You must log in to view this content."
            });
        }
        req.user = session.user;
        req.session = session.session;

        next();
    } catch (error) {
        next(error);
    }
};