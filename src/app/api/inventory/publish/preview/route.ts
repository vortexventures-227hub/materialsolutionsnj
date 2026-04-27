import { handleBatchPublishPreviewRequest } from './handler';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  return handleBatchPublishPreviewRequest(request);
}
