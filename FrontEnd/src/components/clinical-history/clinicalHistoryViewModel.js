export const getClinicalHistoryViewModel = (history) => {
  const items = Array.isArray(history?.items) ? history.items : [];

  return {
    isEmpty: !!history?.empty || items.length === 0,
    rangeYears: history?.rangeYears || 5,
    message: history?.message || "",
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
      coverageType: item.coverage?.type || "private",
      insurerName: item.coverage?.insurerName || "",
      agreedAmount: item.coverage?.agreedAmount ?? null,
      medications: Array.isArray(item.medications) ? item.medications : [],
    })),
  };
};
