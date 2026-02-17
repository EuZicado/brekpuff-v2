import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container-bp py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="brekpuff" className="h-8 w-8" />
              <span className="text-lg font-bold">
                brek<span className="text-primary">puff</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Seu fornecedor de confiança +18. Itens selecionados, sigilo absoluto. Entrega discreta, embalagem descaracterizada.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold">Navegação</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">Início</Link></li>
              <li><Link to="/produtos" className="hover:text-primary transition-colors">Estoque +18</Link></li>
              <li><Link to="/sobre-nos" className="hover:text-primary transition-colors">Quem Somos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Conta</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-primary transition-colors">Entrar</Link></li>
              <li><Link to="/carrinho" className="hover:text-primary transition-colors">Carrinho</Link></li>
              <li><Link to="/usuario/minha-conta" className="hover:text-primary transition-colors">Minha Conta</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Pagamento</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Pix</li>
              <li>Link anônimo</li>
              <li>Bitcoin (Lightning & on-chain)</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} brekpuff.net — Venda proibida para menores de 18 anos. Sua privacidade é nossa regra.
        </div>
      </div>
    </footer>
  );
}
