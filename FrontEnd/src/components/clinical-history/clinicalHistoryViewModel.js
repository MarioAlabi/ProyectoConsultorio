export const getClinicalHistoryViewModel = (history) => {
  const items = Array.isArray(history?.items) ? history.items : [];

  return {
    isEmpty: !!history?.empty || items.length === 0,
    rangeYears: history?.rangeYears || 5,
    items: items.map((item) => ({
      consultationId: item.consultationId,
      consultationDate: item.consultationDate,
      anamnesis: item.anamnesis || "",
      physicalExam: item.physicalExam || "",
      diagnosis: item.diagnosis || "No se registro diagnostico en esta consulta.",
      labResults: item.labResults || "",
      observations: item.observations || "",
      reason: item.reason || "",
      status: item.status || "",
      doctorName: item.doctor?.name || "No disponible",
      medications: Array.isArray(item.medications) ? item.medications : [],
    })),
  };
};
