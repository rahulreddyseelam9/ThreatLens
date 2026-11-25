import Navbar from "./Navbar";
import Footer from "./Footer";

export default function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen bg-tl-bg">
      <Navbar />
      <main className="relative">{children}</main>
      <Footer />
    </div>
  );
}
