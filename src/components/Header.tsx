import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, User, List, X } from "@phosphor-icons/react";
import { useState } from "react";
import logo from "@/assets/logo.png";

const navLinks = [
  { label: "início", to: "/" },
  { label: "estoque", to: "/produtos" },
  { label: "quem somos", to: "/sobre-nos" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e1e1e] bg-[#0d0d0d]/90 backdrop-blur-md">
      <div className="container-bp flex h-14 items-center justify-between">

        {/* Logo — 8-bit pixelated, upper-right feel via flex order */}
        <Link to="/" className="flex items-center gap-2 order-first">
          <img
            src={logo}
            alt="brekpuff"
            className="h-7 w-7 opacity-60"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="logo-pixel">
            brek<span>puff</span>
            <span className="ml-1 text-[10px] text-[#444] font-normal">.net</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-xs font-mono tracking-widest uppercase transition-colors ${location.pathname === link.to
                ? "text-[#7BFA6B]"
                : "text-[#555] hover:text-[#999]"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link to="/carrinho">
            <button
              className="flex h-8 w-8 items-center justify-center text-[#555] hover:text-[#7BFA6B] transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart size={18} />
            </button>
          </Link>
          <Link to="/auth">
            <button
              className="flex h-8 w-8 items-center justify-center text-[#555] hover:text-[#7BFA6B] transition-colors"
              aria-label="Conta"
            >
              <User size={18} />
            </button>
          </Link>
          <button
            className="flex h-8 w-8 items-center justify-center text-[#555] hover:text-[#7BFA6B] transition-colors md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={18} /> : <List size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-[#1e1e1e] bg-[#0d0d0d] px-5 py-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block py-3 text-xs font-mono uppercase tracking-widest ${location.pathname === link.to
                ? "text-[#7BFA6B]"
                : "text-[#555]"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
