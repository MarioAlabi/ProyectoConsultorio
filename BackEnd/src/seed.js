import { auth } from "../src/config/auth.js";
import { connectDB } from "../src/config/db.js";
import 'dotenv/config';

const createUsers = async () => {
    try {
        console.log("Iniciando siembra de datos (Seeding)...");
        await connectDB();

        const usersToCreate = [
            {
                email: "admin@consultorio.com",
                password: "AdminPassword123!",
                name: "Administrador Central",
                rol: "admin",
                nombreUsuario: "admin_root"
            },
            {
                email: "medico@consultorio.com",
                password: "MedicoPassword123!",
                name: "Dr. Gregory House",
                rol: "medico",
                nombreUsuario: "dr_house"
            },
            {
                email: "asistente@consultorio.com",
                password: "AsistentePassword123!",
                name: "Ana Recepción",
                rol: "asistente",
                nombreUsuario: "ana_recep"
            }
        ];

        for (const u of usersToCreate) {
            console.log(`Creating user: ${u.email}...`);
            await auth.api.signUpEmail({
                body: {
                    email: u.email,
                    password: u.password,
                    name: u.name,
                    rol: u.rol,
                    nombreUsuario: u.nombreUsuario
                }
            });
        }

        console.log("Datos sembrados con éxito. Ya puedes iniciar sesión.");
        process.exit(0);
    } catch (error) {
        console.error("Error en el seeding:", error);
        process.exit(1);
    }
};

createUsers();