import 'dotenv/config';
import { auth } from "./config/auth.js";
// Asegúrate de importar el cliente de tu DB. 
// Aquí asumo que tu config exporta el cliente Drizzle o la conexión como 'db'
import { connectDB, db } from "./config/db.js"; 
import { ROLES } from "./constants/roles.js";

const createUsers = async () => {
    try {
        console.log("🌱 Iniciando siembra de usuarios...");
        await connectDB();

        const usersToCreate = [
            {
                email: "admin@consultorio.com",
                password: "AdminPassword123!",
                name: "Administrador Sistema",
                role: ROLES.ADMIN,
                dui: "00000000-0",
                jvpm: null
            },
            {
                email: "doctor@consultorio.com",
                password: "DoctorPassword123!",
                name: "Dr. Gregory House",
                role: ROLES.DOCTOR,
                dui: "00000000-1",
                jvpm: "12345"
            },
            {
                email: "assistant@consultorio.com",
                password: "AssistantPassword123!",
                name: "Ana Recepción",
                role: ROLES.ASSISTANT,
                dui: "00000000-2",
                jvpm: null
            }
        ];

        for (const u of usersToCreate) {
            console.log(`⏳ Creando cuenta básica para: ${u.email}...`);
            
            try {
                // 1. Usamos la API pública para que encripte la contraseña y genere el ID
                // (Ignoramos el rol aquí para que no de el error 400)
                await auth.api.signUpEmail({
                    body: {
                        email: u.email,
                        password: u.password,
                        name: u.name,
                        dui: u.dui,
                        jvpm: u.jvpm
                    }
                });

                console.log(`🔧 Ascendiendo a rol [${u.role}] y verificando email...`);
                
                // 2. Inyectamos los permisos de "superusuario" (o el rol que le toque)
                // y verificamos el correo directamente en la base de datos
                // NOTA: Usa 'user' o 'users' según se llame la tabla en tu base de datos
                await db.execute(
  `UPDATE users SET role = '${u.role}', email_verified = 1 WHERE email = '${u.email}'`
);
                
                console.log(`✅ ¡${u.email} listo!`);

            } catch (err) {
                 // Si el error es que ya existe, lo ignoramos para que siga con el siguiente
                 if(err.message?.includes('already exists') || err.body?.code === 'USER_ALREADY_EXISTS'){
                    console.log(`⚠️ El usuario ${u.email} ya existía.`);
                 } else {
                    throw err; // Si es otro error, que lo muestre
                 }
            }
        }

        console.log("🎉 Seeding finalizado con éxito. Ya puedes iniciar sesión.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error grave en el seed:", error);
        process.exit(1);
    }
};

createUsers();