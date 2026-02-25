import { auth } from "../src/config/auth.js";
import { connectDB } from "../src/config/db.js";
import 'dotenv/config';

const createUsers = async () => {
    try {
        console.log("Starting data seeding...");
        await connectDB();

        const usersToCreate = [
            {
                email: "admin@consultorio.com",
                password: "AdminPassword123!",
                name: "Central Administrator",
                role: "admin",
                username: "admin_root"
            },
            {
                email: "doctor@consultorio.com",
                password: "DoctorPassword123!",
                name: "Dr. Gregory House",
                role: "doctor",
                username: "dr_house"
            },
            {
                email: "assistant@consultorio.com",
                password: "AssistantPassword123!",
                name: "Ana Reception",
                role: "assistant",
                username: "ana_recep"
            }
        ];

        for (const u of usersToCreate) {
            console.log(`Creating user: ${u.email}...`);
            await auth.api.signUpEmail({
                body: {
                    email: u.email,
                    password: u.password,
                    name: u.name,
                    role: u.role,
                    username: u.username
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
