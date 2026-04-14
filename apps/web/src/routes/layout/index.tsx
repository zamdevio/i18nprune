import { Outlet } from "react-router-dom";
import { Footer } from "../../components/footer";
import { Header } from "../../components/header";
import { ScrollToTopOnNavigate } from "../../components/scroll-to-top";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background selection:bg-sidebar-primary/30 selection:text-sidebar-primary">
      <ScrollToTopOnNavigate />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
