import { notImplementedYet } from "@/lib/api-handlers";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return notImplementedYet(`/api/reviews/${id}/coach-decision`);
}
