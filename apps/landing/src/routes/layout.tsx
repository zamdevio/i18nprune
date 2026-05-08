import { Outlet } from "react-router-dom";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import { ScrollToTopOnNavigate } from "../components/scroll-to-top";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ScrollToTopOnNavigate />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
