import { Layout } from "@/components/layout/layout";

interface DemoLayoutProps {
  children: React.ReactNode;
}

export default function DemoLayout({ children }: DemoLayoutProps) {
  return (
    <Layout showLeftNav={true}>
      {children}
    </Layout>
  );
} 