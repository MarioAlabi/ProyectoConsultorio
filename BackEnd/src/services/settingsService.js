import { db } from "../config/db.js";
import { clinicSettings } from "../models/schema.js";
import { eq } from "drizzle-orm";

export const updateSettings = async (clinicName, address, logoBase64) => {
    const [existing] = await db.select().from(clinicSettings).where(eq(clinicSettings.id, 1));

    if (existing) {
        const updateData = { clinicName, address };
        if (logoBase64) {
            updateData.logoUrl = logoBase64; 
        }
        
        await db.update(clinicSettings).set(updateData).where(eq(clinicSettings.id, 1));
    } else {
        await db.insert(clinicSettings).values({
            id: 1,
            clinicName,
            address, 
            logoUrl: logoBase64 || null
        });
    }

    return await getSettings();
};

export const getSettings = async () => {
    const [settings] = await db.select().from(clinicSettings).where(eq(clinicSettings.id, 1));
    return settings || null;
};