import {
  getBillingSummaryData,
  getViewerContextFromHeaders,
  type ViewerContext,
} from "./platform-data";

export class AccessControlError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);
    this.name = "AccessControlError";
    this.status = status;
  }
}

const shouldBypassPaidAccess = () =>
  process.env.NODE_ENV === "development" && process.env.BYPASS_PAID_ACCESS === "true";

export const assertAuthenticatedAccess = async (headers: Headers): Promise<ViewerContext> => {
  const viewer = await getViewerContextFromHeaders(headers);
  if (!viewer.uid || !viewer.email) {
    throw new AccessControlError("Authentication required.", 401);
  }
  return viewer;
};

export const assertPaidFeatureAccess = async (
  headers: Headers,
  existingViewer?: ViewerContext
): Promise<ViewerContext> => {
  if (shouldBypassPaidAccess()) {
    return existingViewer ?? (await getViewerContextFromHeaders(headers));
  }

  const viewer = existingViewer ?? (await assertAuthenticatedAccess(headers));
  const billing = await getBillingSummaryData(viewer);
  if (!billing.premiumActive) {
    throw new AccessControlError("Paid access is required for this feature.", 403);
  }

  return viewer;
};
