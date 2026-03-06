export type AcquisitionEventName =
  | "client_landing_view"
  | "client_directory_search"
  | "client_profile_view"
  | "client_primary_contact_click"
  | "client_lead_submit"
  | "client_shortlist_ready"
  | "coach_membership_view"
  | "coach_pricing_view"
  | "coach_join_click"
  | "coach_register_start"
  | "coach_checkout_start"
  | "coach_activation_complete";

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackAcquisitionEvent(
  eventName: AcquisitionEventName,
  params: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;

  const payload = {
    ...params,
    event_category: params.event_category ?? "acquisition",
  };

  try {
    window.dataLayer?.push({
      event: eventName,
      ...payload,
    });
  } catch {
    // no-op
  }

  try {
    window.gtag?.("event", eventName, payload);
  } catch {
    // no-op
  }

  try {
    window.clarity?.("event", eventName);
  } catch {
    // no-op
  }
}
