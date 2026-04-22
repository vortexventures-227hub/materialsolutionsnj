import { handleBatchPublishPreviewRequest } from './handler';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleBatchPublishPreviewRequest(request);
}
