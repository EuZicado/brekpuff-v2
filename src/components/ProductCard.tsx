import { Link } from "react-router-dom";
import { Tag } from "@phosphor-icons/react";
import StarRating from "@/components/StarRating";

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
  rating = 0,
  isNew = false,
  onClick,
}: ProductCardProps) {
  const CardContent = (
    <>
      {/* Micro-fissure texture overlay */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none micro-fissure mix-blend-overlay"></div>

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted scanline-container group-hover:brightness-110 transition-all duration-300">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Tag size={48} />
          </div>
        )}

        {isNew && (
          <span className="absolute left-0 top-0 bg-primary px-3 py-1 text-xs font-bold text-black uppercase tracking-wider skew-x-[-10deg] -ml-2 mt-2">
            NOVO
          </span>
        )}

        {comparePriceCents && comparePriceCents > priceCents && (
          <span className="absolute right-2 top-2 bg-destructive px-2 py-px text-[10px] font-bold text-white border border-destructive-foreground/20">
            -{Math.round(((comparePriceCents - priceCents) / comparePriceCents) * 100)}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="relative z-10 flex flex-1 flex-col gap-3 p-4 bg-[#111111]/90 backdrop-blur-sm border-t border-[#222]">
        <h3 className="text-sm font-bold leading-tight text-gray-300 font-mono tracking-tight group-hover:text-primary transition-colors">
          {name}
        </h3>

        <div className="mt-auto flex items-baseline justify-between border-t border-[#222] pt-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">UNIT_PRICE</span>
            <span className="text-lg font-bold text-primary tracking-tighter">{formatBRL(priceCents)}</span>
          </div>
          {comparePriceCents && comparePriceCents > priceCents && (
            <span className="text-xs text-muted-foreground/50 line-through decoration-destructive decoration-2">
              {formatBRL(comparePriceCents)}
            </span>
          )}
        </div>
      </div>

      {/* Neon Scrape Border Elements */}
      <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </>
  );

  if (onClick) {
    return (
      <div
        onClick={onClick}
        className="group relative flex flex-col overflow-hidden border border-[#333] bg-[#0B0B0B] transition-all duration-300 hover:border-primary/50 cursor-pointer"
      >
        {CardContent}
      </div>
    );
  }

  return (
    <Link
      to={`/produto/${slug}`}
      className="group relative flex flex-col overflow-hidden border border-[#333] bg-[#0B0B0B] transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(58,255,92,0.15)]"
    >
      {CardContent}
    </Link>
  );
}

export { formatBRL };
