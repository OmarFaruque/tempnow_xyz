export const defaultMaintenanceSettings = {
  enabled: false,
  title: "We’ll be back shortly",
  message:
    "We’re carrying out scheduled improvements to make the experience faster and more reliable. Please check back again soon.",
  availableDate: "",
}

export function normalizeMaintenanceSettings(value: unknown) {
  if (!value || typeof value !== "object") {
    return { ...defaultMaintenanceSettings }
  }

  return {
    ...defaultMaintenanceSettings,
    ...(value as Partial<typeof defaultMaintenanceSettings>),
  }
}