import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminControls from "./AdminControls";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B0B0B] text-[#E0E0E0] font-mono selection:bg-[#3AFF5C] selection:text-black">
      <Header />
      <main className="flex-1 relative">
        <Outlet />
      </main>
      <Footer />
      <AdminControls />
    </div>
  );
}
