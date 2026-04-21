import InventoryOpenGraphImage from '../../inventory/[slug]/opengraph-image';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  return InventoryOpenGraphImage({ params: context.params });
}
