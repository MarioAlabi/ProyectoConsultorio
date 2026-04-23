import puppeteer from 'puppeteer';

export const generateConsultationPdf = async (data) => {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();

    const fechaActual = new Date();
    const dia = fechaActual.getDate();
    const mes = fechaActual.toLocaleString('es-ES', { month: 'long' });
    const anio = fechaActual.getFullYear();

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                /* Configuración base */
                body { 
                    font-family: 'Helvetica', Arial, sans-serif; 
                    padding: 40px; 
                    color: #1a1a1a; 
                    line-height: 1.5;
                    font-size: 14px;
                }
                
                /* Encabezado */
                .header { 
                    text-align: center; 
                    border-bottom: 2px solid #285444; 
                    padding-bottom: 15px; 
                    margin-bottom: 30px; 
                }
                .header h1 { margin: 0; font-size: 22px; color: #285444; text-transform: uppercase; }
                .header h2 { margin: 3px 0; font-size: 16px; font-weight: bold; }
                .header p { margin: 1px 0; font-size: 11px; color: #444; }
                
                .doc-title { 
                    text-align: center; 
                    font-size: 18px; 
                    font-weight: bold; 
                    text-decoration: underline; 
                    margin-bottom: 25px; 
                    letter-spacing: 2px; 
                }

                /* Contenido Principal */
                .main-content { 
                    text-align: justify; 
                    min-height: 300px; 
                    margin-bottom: 30px;
                    white-space: pre-wrap; /* Mantiene los saltos de línea de la IA */
                }

                /* CONTENEDOR DE CIERRE: Evita saltos de página internos */
                .closing-wrapper {
                    page-break-inside: avoid; /* REGLA ORO: No se divide entre páginas */
                    margin-top: 20px;
                }

                .footer-date { 
                    margin-bottom: 40px; 
                    font-size: 14px; 
                }

                .signature-area { 
                    text-align: center; 
                    margin-top: 20px;
                }
                .line { 
                    width: 220px; 
                    border-top: 1px solid #000; 
                    margin: 0 auto 8px; 
                }
                .signature-name { font-weight: bold; font-size: 14px; margin: 0; }
                .signature-detail { font-size: 12px; margin: 1px 0; text-transform: uppercase; }

                /* Optimización para impresión */
                @media print {
                    .header { -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                ${data.logoUrl ? `<img src="${data.logoUrl}" style="max-height: 60px; margin-bottom: 5px;">` : ''}
                <h1>${data.clinicName}</h1>
                <h2 style="color: #444;">SANTA ANA</h2>
                <h2>${data.doctorName}</h2>
                <p>JVPM: ${data.doctorJvpm} | TEL: ${data.doctorPhone}</p>
                <p>${data.clinicAddress}</p>
            </div>

            <div class="doc-title">CONSTANCIA MÉDICA</div>

            <div class="main-content">
                ${data.textContent}
            </div>

            <div class="closing-wrapper">
                <div class="footer-date">
                    En <strong>Santa Ana</strong>, a los ${dia} días del mes de ${mes} del año ${anio}.
                </div>

                <div class="signature-area">
                    <div class="line"></div>
                    <p style="margin-bottom: 10px; font-weight: bold;">Firma y Sello Médico</p>
                    <p class="signature-name">${data.doctorName}</p>
                    <p class="signature-detail">${data.clinicName}</p>
                    <p class="signature-detail">JVPM ${data.doctorJvpm}</p>
                </div>
            </div>
        </body>
        </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { 
            top: '15mm', 
            bottom: '15mm', 
            left: '20mm', 
            right: '20mm' 
        }
    });

    await browser.close();
    return Buffer.from(pdfBuffer).toString('base64');
};