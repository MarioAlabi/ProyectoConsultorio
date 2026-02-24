import { auth } from "../config/auth.js";

export const isAuth = async (req, res, next) => {
    try {

        const session = await auth.api.getSession({
            headers: req.headers
        });
        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Acceso denegado: Debes iniciar sesión para ver este contenido."
            });
        }
        req.user = session.user;
        req.session = session.session;

        next();
    } catch (error) {
        next(error);
    }
};