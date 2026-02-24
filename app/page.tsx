import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Ticker from "@/components/landing/Ticker";
import DashboardPreview from "@/components/landing/DashboardPreview";
import PainPoints from "@/components/landing/PainPoints";
import HowItWorks from "@/components/landing/HowItWorks";
import Providers from "@/components/landing/Providers";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import Waitlist from "@/components/landing/Waitlist";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <Ticker />
      <DashboardPreview />
      <PainPoints />
      <HowItWorks />
      <Providers />
      <Testimonials />
      <Pricing />
      <Waitlist />
      <Footer />
    </>
  );
}
