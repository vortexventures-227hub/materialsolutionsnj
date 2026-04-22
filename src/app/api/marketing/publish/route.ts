import { handleMarketingPublishRequest } from './handler';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return handleMarketingPublishRequest(request);
}
