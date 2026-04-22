import { ImageResponse } from 'next/og';

import { renderInventoryOGImage } from '@/lib/marketing/ogImage';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<ImageResponse> {
  const { slug } = await params;
  return renderInventoryOGImage(slug);
}
