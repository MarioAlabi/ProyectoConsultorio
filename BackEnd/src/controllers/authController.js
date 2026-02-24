//ruta: src/controllers/authController.js
import * as authService from "../services/authService.js";

export const login = async (req, res, next) => {
    try {
        const { correo, contrasena } = req.body;
        const result = await authService.loginUser(correo, contrasena);
        
        res.status(200).json({
            success: true,
            message: "Inicio de sesión exitoso",
            user: result.user,
            session: result.session
        });
    } catch (error) {
        next(error); 
    }
};

export const logoutUser = async (headers) => {
    return await auth.api.signOut({
        headers: headers
    });
};