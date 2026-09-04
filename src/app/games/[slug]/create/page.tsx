import { CreateRoomForm } from "./CreateRoomForm";

export default async function CreateRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CreateRoomForm slug={slug} />;
}
