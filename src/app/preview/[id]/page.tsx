import { redirect } from 'next/navigation';

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: Readonly<PreviewPageProps>) {
  const { id } = await params;

  redirect(`/transacoes/${id}`);
}
