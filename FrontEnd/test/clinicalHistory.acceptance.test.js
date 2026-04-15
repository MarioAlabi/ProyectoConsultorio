import test from "node:test";
import assert from "node:assert/strict";
import { getClinicalHistoryViewModel } from "../src/components/clinical-history/clinicalHistoryViewModel.js";

test("Escenario: Revision de antecedentes", () => {
  // Dado que estoy visualizando el perfil del paciente "Juan Perez"
  const patientName = "Juan Perez";

  const historyResponse = {
    rangeYears: 3,
    empty: false,
    items: [
      {
        consultationId: "consult-2026",
        consultationDate: "2026-03-10T09:30:00.000Z",
        diagnosis: "Hipertension arterial controlada",
        reason: "Control de presion arterial",
        status: "done",
        anamnesis: "Paciente refiere controles irregulares.",
        physicalExam: "Presion arterial elevada sin signos de alarma.",
        labResults: "Perfil lipidico pendiente.",
        observations: "Mantener tratamiento antihipertensivo y control en 30 dias",
        doctor: { name: "Dra. Morales" },
        medications: [
          {
            id: "med-1",
            name: "Losartan",
            dose: "1",
            doseUnit: "tableta(s)",
            route: "Oral",
            frequency: "12",
            duration: "30",
          },
        ],
      },
      {
        consultationId: "consult-2025",
        consultationDate: "2025-01-18T08:00:00.000Z",
        diagnosis: "Gastritis cronica",
        doctor: { name: "Dr. Lopez" },
        medications: [
          {
            id: "med-2",
            name: "Omeprazol",
            dose: "1",
            doseUnit: "capsula(s)",
            route: "Oral",
            frequency: "24",
            duration: "14",
          },
        ],
      },
    ],
  };

  // Cuando hago clic en la pestaña "Historial Clinico"
  const viewModel = getClinicalHistoryViewModel(historyResponse);

  // Entonces veo una linea de tiempo con sus consultas de los ultimos 3 anos,
  // detallando diagnostico y tratamiento.
  assert.equal(patientName, "Juan Perez");
  assert.equal(viewModel.isEmpty, false);
  assert.equal(viewModel.rangeYears, 3);
  assert.equal(viewModel.items.length, 2);

  assert.equal(viewModel.items[0].diagnosis, "Hipertension arterial controlada");
  assert.equal(viewModel.items[0].reason, "Control de presion arterial");
  assert.equal(viewModel.items[0].status, "done");
  assert.equal(viewModel.items[0].anamnesis, "Paciente refiere controles irregulares.");
  assert.equal(viewModel.items[0].physicalExam, "Presion arterial elevada sin signos de alarma.");
  assert.equal(viewModel.items[0].labResults, "Perfil lipidico pendiente.");
  assert.equal(viewModel.items[0].observations, "Mantener tratamiento antihipertensivo y control en 30 dias");
  assert.equal(viewModel.items[0].doctorName, "Dra. Morales");
  assert.equal(viewModel.items[0].medications[0].name, "Losartan");

  assert.equal(viewModel.items[1].diagnosis, "Gastritis cronica");
  assert.equal(viewModel.items[1].doctorName, "Dr. Lopez");
  assert.equal(viewModel.items[1].medications[0].name, "Omeprazol");
});

test("Escenario: Paciente sin historial clinico", () => {
  const historyResponse = {
    rangeYears: 5,
    empty: true,
    items: [],
  };

  const viewModel = getClinicalHistoryViewModel(historyResponse);

  assert.equal(viewModel.isEmpty, true);
  assert.equal(viewModel.rangeYears, 5);
  assert.deepEqual(viewModel.items, []);
});

test("Escenario: El historial clinico no expone acciones de edicion", () => {
  const historyResponse = {
    rangeYears: 5,
    empty: false,
    items: [
      {
        consultationId: "consult-readonly",
        consultationDate: "2026-02-02T10:00:00.000Z",
        diagnosis: "Rinitis alergica",
        doctor: { name: "Dra. Morales" },
        medications: [{ id: "med-readonly", name: "Loratadina" }],
      },
    ],
  };

  const viewModel = getClinicalHistoryViewModel(historyResponse);
  const item = viewModel.items[0];

  assert.equal("editUrl" in item, false);
  assert.equal("updateAction" in item, false);
  assert.equal("deleteAction" in item, false);
  assert.equal("preclinicalId" in item, false);
});
