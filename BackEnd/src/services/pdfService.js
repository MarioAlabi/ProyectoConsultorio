import puppeteer from 'puppeteer';

export const generateConsultationPdf = async (documentData, clinicSettings) => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Estructura HTML "Sándwich" con estilos minimalistas y elegantes
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1f2937; line-height: 1.6; padding: 40px; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; }
                .clinic-info { text-align: right; }
                .clinic-name { color: #0d9488; font-size: 22px; font-weight: bold; margin: 0; }
                .logo { max-height: 80px; max-width: 200px; object-fit: contain; }
                
                .patient-section { background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
                .section-title { font-weight: bold; color: #374151; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; margin-bottom: 5px; }
                
                .content-body { min-height: 400px; white-space: pre-wrap; font-size: 16px; margin-bottom: 50px; text-align: justify; }
                
                .footer { margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; }
                .signature-line { width: 250px; border-top: 1px solid #1f2937; margin: 0 auto 10px; }
                .doctor-name { font-weight: bold; font-size: 16px; margin: 0; }
                .doctor-jvpm { font-size: 13px; color: #6b7280; margin: 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${clinicSettings.logoUrl}" class="logo" alt="Logo">
                <div class="clinic-info">
                    <p class="clinic-name">${clinicSettings.clinicName}</p>
                    <p style="font-size: 12px; margin: 5px 0;">${clinicSettings.address || ''}</p>
                </div>
            </div>

            <div class="patient-section">
                <div><span class="section-title">Paciente:</span><br>${documentData.patientName}</div>
                <div><span class="section-title">Expediente:</span><br>${documentData.fileNumber}</div>
                <div><span class="section-title">DUI:</span><br>${documentData.patientDui || 'N/A'}</div>
                <div><span class="section-title">Fecha:</span><br>${new Date().toLocaleDateString('es-SV')}</div>
            </div>

            <div class="content-body">
                ${documentData.finalText}
            </div>

            <div class="footer">
                <div class="signature-line"></div>
                <p class="doctor-name">Dr. ${documentData.doctorName}</p>
                <p class="doctor-jvpm">JVPM: ${documentData.doctorJvpm || 'Pendiente'}</p>
                <p class="doctor-jvpm">${documentData.doctorSpecialty || ''}</p>
            </div>
        </body>
        </html>
    `;

    await page.setContent(htmlContent);
    
    // Generamos el PDF como Buffer
    const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });

    await browser.close();
    
    // Retornamos el Base64 para guardarlo en la DB
    return pdfBuffer.toString('base64');
};