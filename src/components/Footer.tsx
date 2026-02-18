import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export default function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] bg-[#0a0a0a] mt-auto">
      <div className="container-bp py-10">
        <div className="grid gap-8 md:grid-cols-4">

          {/* Brand */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="brekpuff" className="h-6 w-6 opacity-50" style={{ imageRendering: "pixelated" }} />
              <span className="logo-pixel">brek<span>puff</span></span>
            </Link>
            <p className="text-[11px] font-mono text-[#3a3a3a] leading-relaxed">
              Fornecedor discreto. Sigilo absoluto.<br />
              Embalagem descaracterizada.
            </p>
          </div>

          {/* Nav */}
          <div>
            <h4 className="mb-3 text-[9px] font-mono text-[#333] uppercase tracking-[0.3em]">navegação</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-[11px] font-mono text-[#444] hover:text-[#7BFA6B] transition-colors">início</Link></li>
              <li><Link to="/produtos" className="text-[11px] font-mono text-[#444] hover:text-[#7BFA6B] transition-colors">estoque</Link></li>
              <li><Link to="/sobre-nos" className="text-[11px] font-mono text-[#444] hover:text-[#7BFA6B] transition-colors">quem somos</Link></li>
            </ul>
          </div>

          {/* Conta */}
          <div>
            <h4 className="mb-3 text-[9px] font-mono text-[#333] uppercase tracking-[0.3em]">conta</h4>
            <ul className="space-y-2">
              <li><Link to="/auth" className="text-[11px] font-mono text-[#444] hover:text-[#7BFA6B] transition-colors">entrar</Link></li>
              <li><Link to="/carrinho" className="text-[11px] font-mono text-[#444] hover:text-[#7BFA6B] transition-colors">carrinho</Link></li>
              <li><Link to="/usuario/minha-conta" className="text-[11px] font-mono text-[#444] hover:text-[#7BFA6B] transition-colors">minha conta</Link></li>
            </ul>
          </div>

          {/* Pagamento */}
          <div>
            <h4 className="mb-3 text-[9px] font-mono text-[#333] uppercase tracking-[0.3em]">pagamento</h4>
            <ul className="space-y-2">
              <li className="text-[11px] font-mono text-[#444]">pix</li>
              <li className="text-[11px] font-mono text-[#444]">link anônimo</li>
              <li className="text-[11px] font-mono text-[#444]">bitcoin · lightning</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-[#141414] pt-6 flex items-center justify-between">
          <p className="text-[10px] font-mono text-[#2a2a2a]">
            © {new Date().getFullYear()} brekpuff.net
          </p>
          <p className="text-[10px] font-mono text-[#2a2a2a]">
            zero logs · sua privacidade é nossa regra
          </p>
        </div>
      </div>
    </footer>
  );
}
