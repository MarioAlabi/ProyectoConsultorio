import { validationResult, body } from "express-validator";

export const loginValidator = [
    body("correo")
        .isEmail().withMessage("Debe ser un correo electrónico válido")
        .notEmpty().withMessage("El correo es obligatorio"),
    body("contrasena")
        .isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres")
        .notEmpty().withMessage("La contraseña es obligatoria")
];
export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                campo: err.path,
                mensaje: err.msg
            }))
        });
    }
    next();
};