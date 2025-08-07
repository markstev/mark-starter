import { Layout } from "@/components/layout/layout";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default async function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <Layout showLeftNav={true}>
      {children}
    </Layout>
  );
}
