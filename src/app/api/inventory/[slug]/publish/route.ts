import { handlePublishPreviewRequest, handlePublishRequest } from './handler';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return handlePublishPreviewRequest(request, slug);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return handlePublishRequest(request, slug);
}
