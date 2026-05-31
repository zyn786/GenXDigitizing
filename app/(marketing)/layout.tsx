import { Nav }    from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { TopBar } from "@/components/marketing/TopBar";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <Nav topOffset="36px" />
      <main className="pt-[100px] pb-4 sm:pb-6">{children}</main>
      <Footer />
    </>
  );
}
