import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

// CA-02: Ejecución de respaldo manual [cite: 67, 68]
export const backupDB = (req, res) => {
    const fileName = `backup_${Date.now()}.sql`;
    const filePath = path.join(process.cwd(), 'backups', fileName);

    // Asegurar que la carpeta de backups exista
    if (!fs.existsSync('backups')) fs.mkdirSync('backups');

    const cmd = `mysqldump -h ${process.env.DB_HOST} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${filePath}`;


    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error("❌ ERROR REAL DE CONSOLA:", stderr || error.message);
            // Cambiamos temporalmente el send para ver el error en la pantalla blanca
            return res.status(500).send(`Falla interna: ${stderr || error.message}`);
        }
        res.download(filePath);
    });
    /*exec(cmd, (error) => {
        if (error) return res.status(500).send("Error al generar el respaldo");
        res.download(filePath);
    });*/
};

// Lógica para Restaurar Respaldo
export const restoreDB = (req, res) => {
    if (!req.files || !req.files.file) return res.status(400).send("No se subió ningún archivo");

    const file = req.files.file;
    const tempPath = path.join(process.cwd(), 'backups', 'temp_restore.sql');

    file.mv(tempPath, (err) => {
        if (err) return res.status(500).send("Error al procesar el archivo");

        const cmd = `mysql -h ${process.env.DB_HOST} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} < ${tempPath}`;

        exec(cmd, (error) => {
            if (error) return res.status(500).send("Error al restaurar la base de datos");
            res.send({ message: "Base de datos restaurada con éxito" });
        });
    });
};