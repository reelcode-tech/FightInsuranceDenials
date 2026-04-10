export const APP_NAME = "DenialWatch";
export const APP_DESCRIPTION = "Crowdsourced Health Insurance Denial Observatory & AI Action Platform";

export const INSURERS = [
  "UnitedHealthcare",
  "Cigna",
  "Aetna",
  "Blue Cross Blue Shield",
  "Humana",
  "Kaiser Permanente",
  "Centene",
  "Molina Healthcare",
  "Other"
];

export const PLAN_TYPES = [
  "PPO",
  "HMO",
  "POS",
  "EPO",
  "Medicare Advantage",
  "Medicaid",
  "Other"
];

export const STATUS_COLORS = {
  denied: "text-red-500 bg-red-500/10",
  appealing: "text-amber-500 bg-amber-500/10",
  overturned: "text-emerald-500 bg-emerald-500/10",
  sustained: "text-gray-500 bg-gray-500/10",
};
