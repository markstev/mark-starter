import { Layout } from "@/components/layout/layout";

interface SSEDemoLayoutProps {
  children: React.ReactNode;
}

export default function SSEDemoLayout({ children }: SSEDemoLayoutProps) {
  return (
    <Layout showLeftNav={true}>
      {children}
    </Layout>
  );
} 