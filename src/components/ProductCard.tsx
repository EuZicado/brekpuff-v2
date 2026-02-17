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
}: ProductCardProps) {
  return (
    <Link
      to={`/produto/${slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Tag size={48} />
          </div>
        )}

        {isNew && (
          <span className="absolute left-3 top-3 rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
            Novidade
          </span>
        )}

        {comparePriceCents && comparePriceCents > priceCents && (
          <span className="absolute right-3 top-3 rounded-md bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
            -{Math.round(((comparePriceCents - priceCents) / comparePriceCents) * 100)}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2">{name}</h3>
        {rating > 0 && <StarRating rating={rating} size={14} />}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">{formatBRL(priceCents)}</span>
          {comparePriceCents && comparePriceCents > priceCents && (
            <span className="text-xs text-muted-foreground line-through">
              {formatBRL(comparePriceCents)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export { formatBRL };
