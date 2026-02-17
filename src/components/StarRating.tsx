import { Star } from "@phosphor-icons/react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  size?: number;
}

export default function StarRating({
  rating,
  maxStars = 5,
  interactive = false,
  onRate,
  size = 18,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(i + 1)}
          className={`transition-colors duration-150 ${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
        >
          <Star
            size={size}
            weight={i < rating ? "fill" : "regular"}
            className={i < rating ? "text-primary" : "text-muted-foreground/30"}
          />
        </button>
      ))}
    </div>
  );
}
