import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { TopBar } from "@/components/marketing/TopBar";
import { PageTransition } from "@/components/shared/PageTransition";
import { BackToTop } from "@/components/shared/BackToTop";
import { ExitIntent } from "@/components/shared/ExitIntent";
import { OfferBanner } from "@/components/marketing/OfferBanner";
import { LiveOrderProvider } from "@/components/social-proof/LiveOrderProvider";
import { WhatsAppWidget } from "@/components/marketing/WhatsAppWidget";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageTransition />
      <OfferBanner />
      <TopBar />
      <Nav topOffset="36px" />
      <ExitIntent />
      <LiveOrderProvider />
      <div className="pb-4 pt-[100px] sm:pb-6">{children}</div>
      <Footer />
      <BackToTop />
      <WhatsAppWidget />
    </>
  );
}
