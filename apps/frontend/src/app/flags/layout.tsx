import { Layout } from "@/components/layout/layout";

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <Layout showLeftNav={true}>
      {children}
    </Layout>
  );
} 