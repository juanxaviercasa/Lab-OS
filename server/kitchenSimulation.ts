export function getDefaultKitchenScenarios() {
  return [
    { name: "Ensalada mediterránea", culture: "Mediterránea", durationMinutes: 18, ingredientsJson: JSON.stringify(["Hojas verdes", "Tomate", "Aceite", "Hierbas"]), stagesJson: JSON.stringify(["Verificar alergias", "Dosificar ingredientes", "Mezclar en simulación", "Presentar resultado"]), riskLevel: "bajo" as const, safetyNotes: "No se envían órdenes a cuchillas, dispensadores, hornos ni superficies térmicas.", active: true },
    { name: "Sopa vegetal", culture: "Latinoamericana", durationMinutes: 35, ingredientsJson: JSON.stringify(["Verduras", "Caldo", "Especias", "Legumbres"]), stagesJson: JSON.stringify(["Confirmar dieta", "Preparar mise en place", "Modelar cocción", "Revisar presentación"]), riskLevel: "medio" as const, safetyNotes: "La fase térmica es una proyección digital; el encendido de calor permanece bloqueado.", active: true },
    { name: "Arroz con verduras", culture: "Asiática", durationMinutes: 28, ingredientsJson: JSON.stringify(["Arroz", "Verduras", "Salsa", "Semillas"]), stagesJson: JSON.stringify(["Validar preferencias", "Estimar porciones", "Simular preparación", "Documentar servicio"]), riskLevel: "medio" as const, safetyNotes: "No hay control de válvulas, calor ni dispensado físico dentro de LabOS.", active: true },
  ];
}
