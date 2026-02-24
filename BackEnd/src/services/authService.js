// src/services/authService.js
import {auth} from "../config/auth.js";
export const loginUser = async (correo, contrasena) => {
    return await auth.api.signInEmail({
        body: {
            email: correo,
            password: contrasena,
        }
    });
};
export const logoutUser = async (headers) => {
    return await auth.api.signOut({
        headers: headers 
    });
};