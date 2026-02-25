import 'dotenv/config';
import { auth } from "./config/auth.js";
import { connectDB } from "./config/db.js";
import { ROLES } from "./constants/roles.js";

const createUsers = async () => {
    try {
        console.log("Starting data seeding...");
        await connectDB();

        const usersToCreate = [
            {
                email: "admin@consultorio.com",
                password: "AdminPassword123!",
                name: "Central Administrator",
                role: ROLES.ADMIN,
            },
            {
                email: "doctor@consultorio.com",
                password: "DoctorPassword123!",
                name: "Dr. Gregory House",
                role: ROLES.DOCTOR,
            },
            {
                email: "assistant@consultorio.com",
                password: "AssistantPassword123!",
                name: "Ana Reception",
                role: ROLES.ASSISTANT,
            }
        ];

        for (const u of usersToCreate) {
            console.log(`Creating user: ${u.email}...`);
            await auth.api.createUser({
                body: {
                    email: u.email,
                    password: u.password,
                    name: u.name,
                    role: u.role,
                }
            });
        }

        console.log("Seeding completed successfully. You can now log in.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

createUsers();
