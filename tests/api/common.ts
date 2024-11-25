import type * as Playwright from '@playwright/test';

export interface EndpointResponse {
  status: number;
  data?: any;
}

export const formatResponse = async (
  res: Playwright.APIResponse,
): Promise<EndpointResponse> => {
  const body = (await res.text()) ? await res.json() : null;
  return { status: res.status(), data: body?.data || body };
};
