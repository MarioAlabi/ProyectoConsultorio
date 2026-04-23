import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

// CA-02: Ejecución de respaldo manual [cite: 67, 68]
export const backupDB = (req, res) => {
    const fileName = `backup_clinica_${Date.now()}.sql`;
    
    // 2. MAGIA: Usamos la carpeta temporal nativa del servidor, no la de tu proyecto
    const filePath = path.join(os.tmpdir(), fileName);

    const cmd = `mysqldump -h ${process.env.DB_HOST} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${filePath}`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error("❌ ERROR AL RESPALDAR:", stderr || error.message);
            return res.status(500).send("Error al generar el respaldo");
        }

        // 3. SEGUNDA MAGIA: res.download tiene una función oculta (un callback)
        // que se dispara JUSTO CUANDO EL USUARIO TERMINA DE DESCARGAR EL ARCHIVO.
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error("❌ Error al enviar el archivo al cliente:", err);
            }
            
            // 4. AUTODESTRUCCIÓN: Borramos el archivo del servidor para que no quede rastro
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`✅ Archivo temporal ${fileName} destruido del servidor.`);
            }
        });
    });
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