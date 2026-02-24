export const errorHandler = (err, req, res, next) => {
    console.error(`[Error Log]: ${err.stack}`);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Error interno del servidor",
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
};