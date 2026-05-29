export const LEAD_FORM_STEPS = [
  { id: 0, label: "Details", heading: "Lead & contact details" },
  { id: 1, label: "Equipment", heading: "Equipment & issue details" },
] as const;

export const LEAD_FORM_LAST_STEP = LEAD_FORM_STEPS[LEAD_FORM_STEPS.length - 1].id;
