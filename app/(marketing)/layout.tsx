import { Nav }    from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { TopBar } from "@/components/marketing/TopBar";
import { PageTransition } from "@/components/shared/PageTransition";
import { BackToTop } from "@/components/shared/BackToTop";
import { ExitIntent } from "@/components/shared/ExitIntent";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageTransition />
      <TopBar />
      <Nav topOffset="36px" />
      <ExitIntent />
      <main className="pt-[100px] pb-4 sm:pb-6">{children}</main>
      <Footer />
      <BackToTop />
    </>
  );
}
