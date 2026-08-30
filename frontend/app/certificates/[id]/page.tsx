import { CertificateDetailClient } from "./CertificateDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CertificateDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <CertificateDetailClient id={id} />;
}
