import { Footer } from "@/components/marketing/Footer";
import { SimpleNav } from "@/components/marketing/SimpleNav";
import { BackToTop } from "@/components/shared/BackToTop";
import { WhatsAppWidget } from "@/components/marketing/WhatsAppWidget";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SimpleNav />
      <div>{children}</div>
      <Footer />
      <BackToTop />
      <WhatsAppWidget />
    </>
  );
}
