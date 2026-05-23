import { Nav }    from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { TopBar } from "@/components/marketing/TopBar";
import { PromoTicker } from "@/components/marketing/PromoTicker";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <Nav topOffset="36px" />
      <main className="pt-[90px] pb-12">{children}</main>
      <Footer />
      <PromoTicker />
    </>
  );
}
