import { getBillingSummaryData, getViewerContextFromHeaders } from "./platform-data";

export class AccessControlError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "AccessControlError";
  }
}

const shouldBypassPaidAccess = () =>
  process.env.NODE_ENV === "development" && process.env.BYPASS_PAID_ACCESS === "true";

export const assertPaidFeatureAccess = async (headers: Headers) => {
  if (shouldBypassPaidAccess()) {
    return;
  }

  const viewer = getViewerContextFromHeaders(headers);
  if (!viewer.uid || !viewer.email) {
    throw new AccessControlError("Sign in to use this paid feature.", 401);
  }

  const billing = await getBillingSummaryData(viewer);
  if (!billing.premiumActive) {
    throw new AccessControlError("Paid access is required for this feature.", 403);
  }
};
