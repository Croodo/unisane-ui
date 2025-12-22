import { DocsLayout } from "@/components/docs/DocsLayout";

export default function ComponentsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsLayout>{children}</DocsLayout>;
}
