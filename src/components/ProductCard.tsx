import { Link } from "react-router-dom";
import { Tag } from "@phosphor-icons/react";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  comparePriceCents?: number | null;
  imageUrl?: string;
  rating?: number;
  isNew?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default function ProductCard({
  name,
  slug,
  priceCents,
  comparePriceCents,
  imageUrl,
  isNew = false,
  onClick,
}: ProductCardProps) {
  const CardContent = (
    <>
      {/* Image with scanline hover */}
      <div className="scanline-img relative aspect-[4/3] overflow-hidden bg-[#0d0d0d]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-[40%] group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#333]">
            <Tag size={40} />
          </div>
        )}

        {/* Neon corner scrapes on image — 2 mm */}
        <div className="absolute top-0 left-0 w-[10px] h-[10px] border-t-2 border-l-2 border-[#7BFA6B] opacity-0 group-hover:opacity-100 transition-opacity duration-300 float-tl" />
        <div className="absolute bottom-0 right-0 w-[10px] h-[10px] border-b-2 border-r-2 border-[#7BFA6B] opacity-0 group-hover:opacity-100 transition-opacity duration-300 float-br" />

        {isNew && (
          <span className="absolute left-0 top-2 bg-[#7BFA6B] text-black text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5" style={{ imageRendering: "pixelated" }}>
            novo
          </span>
        )}

        {comparePriceCents && comparePriceCents > priceCents && (
          <span className="absolute right-2 top-2 bg-[#cc3333] text-white text-[9px] font-bold px-1.5 py-0.5">
            -{Math.round(((comparePriceCents - priceCents) / comparePriceCents) * 100)}%
          </span>
        )}
      </div>

      {/* Info panel */}
      <div className="relative z-10 flex flex-1 flex-col gap-3 p-3.5 border-t border-[#1e1e1e]">
        <h3 className="text-[11px] font-mono font-semibold leading-snug text-[#aaa] group-hover:text-[#d0d0d0] transition-colors line-clamp-2">
          {name}
        </h3>

        <div className="mt-auto flex items-end justify-between pt-2 border-t border-[#1a1a1a]">
          <div>
            <p className="text-[8px] text-[#444] uppercase tracking-widest mb-0.5">preço</p>
            <p className="text-sm font-bold text-[#7BFA6B] tracking-tight">{formatBRL(priceCents)}</p>
          </div>

          {/* CTA Button */}
          <button className="btn-cta" tabIndex={-1}>
            comprar
          </button>
        </div>

        {comparePriceCents && comparePriceCents > priceCents && (
          <p className="text-[9px] text-[#444] line-through -mt-2">
            {formatBRL(comparePriceCents)}
          </p>
        )}
      </div>
    </>
  );

  const baseClass =
    "card-product neon-corners group relative flex flex-col overflow-hidden cursor-pointer";

  if (onClick) {
    return (
      <div onClick={onClick} className={baseClass}>
        {CardContent}
      </div>
    );
  }

  return (
    <Link to={`/produto/${slug}`} className={baseClass}>
      {CardContent}
    </Link>
  );
}

export { formatBRL };
