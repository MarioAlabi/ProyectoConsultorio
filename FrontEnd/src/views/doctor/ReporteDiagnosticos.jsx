import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
    useDiagnosticsReport,
    useDiagnosisCatalog,
} from "../../hooks/useDiagnosticsReport";
import { useAnalyzeReport } from "../../hooks/useAIClinical";

const CURRENT_YEAR = new Date().getFullYear();

// Paleta derivada del sistema de diseño (tokens CSS no aplican en SVG, así que
// mapeamos a literales correspondientes al theme.css).
const CHART_COLORS = ["#285444", "#4a6b82", "#c08a3e", "#3f6b4a", "#c85a3c", "#6b4a82"];

export const ReporteDiagnosticos = () => {
    const [filters, setFilters] = useState({
        fromYear: CURRENT_YEAR - 2,
        toYear: CURRENT_YEAR,
        diagnosisCode: "",
    });
    const [submitted, setSubmitted] = useState(null);

    const { data: catalog = [], isLoading: catalogLoading } = useDiagnosisCatalog();
    const report = useDiagnosticsReport(submitted, !!submitted);
    const analyzeReport = useAnalyzeReport();
    const [aiAnalysis, setAiAnalysis] = useState(null);

    const chartByYearData = useMemo(() => {
        if (!report.data?.byYear) return [];
        return report.data.byYear.map((y) => ({ year: String(y.year), total: y.total }));
    }, [report.data]);

    const chartByCodeData = useMemo(() => {
        if (!report.data?.byCode) return [];
        // Top 6 por total.
        return report.data.byCode.slice(0, 6).map((c) => ({
            code: c.code,
            name: c.name.length > 24 ? c.name.slice(0, 24) + "…" : c.name,
            total: c.total,
        }));
    }, [report.data]);

    const onSubmit = (e) => {
        e.preventDefault();
        if (filters.fromYear > filters.toYear) {
            toast.error("El año inicial no puede ser mayor al final.");
            return;
        }
        setSubmitted({ ...filters });
        setAiAnalysis(null);
    };

    const handleAnalyze = () => {
        if (!report.data) return;
        analyzeReport.mutate(
            {
                byYear: report.data.byYear,
                period: `${submitted.fromYear} - ${submitted.toYear}`,
                totalConsultations: report.data.totals.totalConsultations,
            },
            {
                onSuccess: (result) => {
                    setAiAnalysis(result);
                    toast.success("Análisis IA generado.");
                },
            }
        );
    };

    const exportPDF = () => {
        if (!report.data) return;
        const doc = new jsPDF({ orientation: "p", unit: "pt", format: "letter" });

        doc.setFontSize(18);
        doc.setTextColor(40, 84, 68);
        doc.text("Reporte de diagnósticos", 40, 50);

        doc.setFontSize(11);
        doc.setTextColor(96, 103, 95);
        doc.text(`Período: ${submitted.fromYear} – ${submitted.toYear}`, 40, 72);
        doc.text(`Total consultas: ${report.data.totals.totalConsultations}`, 40, 88);
        doc.text(`Diagnósticos únicos: ${report.data.totals.uniqueDiagnoses}`, 40, 104);
        doc.text(`% codificadas: ${report.data.totals.codedPercentage}%`, 40, 120);

        autoTable(doc, {
            startY: 140,
            head: [["Código CIE-10", "Diagnóstico", "Total", "Por año"]],
            body: report.data.byCode.map((row) => [
                row.code,
                row.name,
                String(row.total),
                Object.entries(row.years)
                    .map(([y, c]) => `${y}: ${c}`)
                    .join("  "),
            ]),
            theme: "striped",
            headStyles: { fillColor: [40, 84, 68], textColor: 255 },
            styles: { fontSize: 9, cellPadding: 6 },
        });

        if (aiAnalysis) {
            const finalY = doc.lastAutoTable.finalY + 20;
            doc.setFontSize(13);
            doc.setTextColor(40, 84, 68);
            doc.text("Análisis por IA", 40, finalY);
            doc.setFontSize(10);
            doc.setTextColor(36, 39, 37);
            const lines = doc.splitTextToSize(aiAnalysis.narrative, 520);
            doc.text(lines, 40, finalY + 18);
        }

        doc.save(`reporte-diagnosticos_${submitted.fromYear}-${submitted.toYear}.pdf`);
    };

    const exportExcel = async () => {
        if (!report.data) return;
        const wb = new ExcelJS.Workbook();
        wb.creator = "Consultorio";
        wb.created = new Date();

        const ws1 = wb.addWorksheet("Por diagnóstico");
        ws1.addRow(["Reporte de diagnósticos"]).font = { bold: true, size: 14 };
        ws1.addRow([`Período: ${submitted.fromYear} – ${submitted.toYear}`]);
        ws1.addRow([]);
        // Columnas dinámicas por año para comparación YoY
        const years = report.data.byYear.map((y) => y.year);
        const headerRow = ws1.addRow(["Código CIE-10", "Diagnóstico", ...years.map(String), "Total"]);
        headerRow.font = { bold: true };
        headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF285444" } };
        headerRow.eachCell((c) => {
            c.font = { bold: true, color: { argb: "FFFFFFFF" } };
        });

        for (const row of report.data.byCode) {
            const yearValues = years.map((y) => row.years[y] || 0);
            ws1.addRow([row.code, row.name, ...yearValues, row.total]);
        }

        ws1.columns.forEach((col, i) => {
            col.width = i === 1 ? 45 : i === 0 ? 14 : 10;
        });

        const ws2 = wb.addWorksheet("Por año");
        ws2.addRow(["Año", "Total consultas"]).font = { bold: true };
        for (const y of report.data.byYear) {
            ws2.addRow([y.year, y.total]);
        }

        if (aiAnalysis) {
            const ws3 = wb.addWorksheet("Análisis IA");
            ws3.addRow(["Análisis generado por IA"]).font = { bold: true, size: 13 };
            ws3.addRow([]);
            const row = ws3.addRow([aiAnalysis.narrative]);
            row.alignment = { wrapText: true, vertical: "top" };
            ws3.getColumn(1).width = 100;
            if (aiAnalysis.highlights?.length) {
                ws3.addRow([]);
                ws3.addRow(["Puntos destacados:"]).font = { bold: true };
                for (const h of aiAnalysis.highlights) ws3.addRow([`• ${h}`]);
            }
        }

        const buffer = await wb.xlsx.writeBuffer();
        saveAs(
            new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
            `reporte-diagnosticos_${submitted.fromYear}-${submitted.toYear}.xlsx`
        );
    };

    return (
        <div className="page" style={{ maxWidth: "1240px" }}>
            <header className="page-header">
                <div className="page-header__title">
                    <span className="page-header__eyebrow">Analítica</span>
                    <h1 className="page-header__heading">Reporte de diagnósticos</h1>
                    <p className="page-header__sub">
                        Tendencias año a año, frecuencia por código CIE-10 y comparación interanual.
                        Filtra por tipo de diagnóstico o analiza todos los registros.
                    </p>
                </div>
            </header>

            <form
                onSubmit={onSubmit}
                className="card"
                style={{
                    marginBottom: "1.5rem",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1rem",
                    alignItems: "flex-end",
                }}
            >
                <div className="form-group" style={{ minWidth: "100px" }}>
                    <label className="form-label">Año desde</label>
                    <input
                        type="number"
                        className="form-input"
                        value={filters.fromYear}
                        min={2000}
                        max={CURRENT_YEAR}
                        onChange={(e) => setFilters((p) => ({ ...p, fromYear: Number(e.target.value) }))}
                    />
                </div>
                <div className="form-group" style={{ minWidth: "100px" }}>
                    <label className="form-label">Año hasta</label>
                    <input
                        type="number"
                        className="form-input"
                        value={filters.toYear}
                        min={2000}
                        max={CURRENT_YEAR}
                        onChange={(e) => setFilters((p) => ({ ...p, toYear: Number(e.target.value) }))}
                    />
                </div>
                <div className="form-group" style={{ flex: "1 1 260px", minWidth: "240px" }}>
                    <label className="form-label">Tipo de diagnóstico (opcional)</label>
                    <select
                        className="form-input"
                        value={filters.diagnosisCode}
                        onChange={(e) => setFilters((p) => ({ ...p, diagnosisCode: e.target.value }))}
                        disabled={catalogLoading}
                    >
                        <option value="">Todos los diagnósticos</option>
                        {catalog.map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.code} — {c.name} ({c.count})
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="btn btn-primary">
                    <i className="ri-search-line"></i> Generar reporte
                </button>
            </form>

            {report.isLoading && (
                <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--fg-muted)" }}>
                    Generando reporte…
                </div>
            )}

            {report.isError && (
                <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--accent-coral)" }}>
                    No se pudo generar el reporte.
                </div>
            )}

            {report.data && (
                <>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "1rem",
                            marginBottom: "1.5rem",
                        }}
                    >
                        <div className="stat-card stat-card--brand">
                            <span className="stat-card__accent" />
                            <div className="stat-card__label"><i className="ri-file-list-3-line"></i> Total consultas</div>
                            <div className="stat-card__value">{report.data.totals.totalConsultations}</div>
                            <div className="stat-card__meta">En el período</div>
                        </div>
                        <div className="stat-card stat-card--slate">
                            <span className="stat-card__accent" />
                            <div className="stat-card__label"><i className="ri-hashtag"></i> Diagnósticos únicos</div>
                            <div className="stat-card__value">{report.data.totals.uniqueDiagnoses}</div>
                            <div className="stat-card__meta">Códigos CIE-10 distintos</div>
                        </div>
                        <div className="stat-card stat-card--forest">
                            <span className="stat-card__accent" />
                            <div className="stat-card__label"><i className="ri-checkbox-circle-line"></i> % codificadas</div>
                            <div className="stat-card__value">{report.data.totals.codedPercentage}%</div>
                            <div className="stat-card__meta">Con CIE-10 asignado</div>
                        </div>
                        <div className="stat-card stat-card--ochre">
                            <span className="stat-card__accent" />
                            <div className="stat-card__label"><i className="ri-question-line"></i> Sin codificar</div>
                            <div className="stat-card__value">{report.data.totals.uncoded}</div>
                            <div className="stat-card__meta">Pendientes de codificar</div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                        <button
                            type="button"
                            className="btn btn-ai"
                            disabled={analyzeReport.isPending}
                            onClick={handleAnalyze}
                        >
                            <i className="ri-sparkling-2-line"></i>
                            {analyzeReport.isPending ? "Analizando…" : "Análisis con IA"}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={exportPDF}>
                            <i className="ri-file-pdf-line"></i> Exportar PDF
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={exportExcel}>
                            <i className="ri-file-excel-2-line"></i> Exportar Excel
                        </button>
                    </div>

                    {aiAnalysis && (
                        <div
                            className="card-elevated"
                            style={{
                                marginBottom: "1.5rem",
                                background: "var(--accent-plum-soft)",
                                border: "1px solid var(--accent-plum)",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            fontSize: "0.72rem",
                                            fontWeight: 600,
                                            letterSpacing: "0.1em",
                                            textTransform: "uppercase",
                                            color: "var(--accent-plum)",
                                            marginBottom: "0.5rem",
                                        }}
                                    >
                                        <i className="ri-sparkling-2-line"></i> Análisis por IA
                                    </div>
                                    <p style={{ margin: 0, color: "var(--fg-primary)", lineHeight: 1.6 }}>
                                        {aiAnalysis.narrative}
                                    </p>
                                    {aiAnalysis.highlights?.length > 0 && (
                                        <ul style={{ margin: "0.75rem 0 0 1.25rem", color: "var(--fg-secondary)" }}>
                                            {aiAnalysis.highlights.map((h, i) => (
                                                <li key={i}>{h}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAiAnalysis(null)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)" }}
                                >
                                    <i className="ri-close-line"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1.5rem",
                            marginBottom: "1.5rem",
                        }}
                    >
                        <div className="card">
                            <h2 className="card-heading">Consultas por año</h2>
                            <div style={{ width: "100%", height: 280 }}>
                                <ResponsiveContainer>
                                    <LineChart data={chartByYearData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ebeeea" />
                                        <XAxis dataKey="year" stroke="#60675f" />
                                        <YAxis stroke="#60675f" allowDecimals={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#285444"
                                            strokeWidth={3}
                                            dot={{ fill: "#285444", r: 5 }}
                                            name="Consultas"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="card">
                            <h2 className="card-heading">Top 6 diagnósticos</h2>
                            <div style={{ width: "100%", height: 280 }}>
                                <ResponsiveContainer>
                                    <BarChart data={chartByCodeData} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ebeeea" />
                                        <XAxis type="number" stroke="#60675f" allowDecimals={false} />
                                        <YAxis
                                            type="category"
                                            dataKey="code"
                                            stroke="#60675f"
                                            width={60}
                                        />
                                        <Tooltip
                                            formatter={(value, name, props) => [value, props.payload.name]}
                                        />
                                        <Bar dataKey="total" fill="#285444" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-subtle)" }}>
                            <h2 className="card-heading" style={{ margin: 0 }}>
                                Detalle por diagnóstico
                            </h2>
                        </div>
                        {report.data.byCode.length === 0 ? (
                            <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--fg-muted)" }}>
                                No hay diagnósticos registrados en este período.
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Diagnóstico</th>
                                            {report.data.byYear.map((y) => (
                                                <th key={y.year} style={{ textAlign: "center" }}>{y.year}</th>
                                            ))}
                                            <th style={{ textAlign: "right" }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.data.byCode.map((row) => (
                                            <tr key={row.code}>
                                                <td style={{ fontFamily: "var(--font-mono)", color: "var(--brand)", fontWeight: 600 }}>
                                                    {row.code}
                                                </td>
                                                <td>{row.name}</td>
                                                {report.data.byYear.map((y) => (
                                                    <td key={y.year} style={{ textAlign: "center" }}>
                                                        {row.years[y.year] || 0}
                                                    </td>
                                                ))}
                                                <td
                                                    style={{
                                                        textAlign: "right",
                                                        fontWeight: 700,
                                                        color: "var(--fg-primary)",
                                                    }}
                                                >
                                                    {row.total}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {!report.data && !report.isLoading && !report.isError && (
                <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--fg-muted)" }}>
                    Selecciona un rango de años y pulsa <strong>Generar reporte</strong>.
                </div>
            )}
        </div>
    );
};
