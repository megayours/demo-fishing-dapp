import { BaseToken } from "@/hooks/dapp-api/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

type InventoryProps<T extends BaseToken> = {
  title: string;
  items: T[];
  equippedId?: number;
  onItemClick?: (item: T) => void;
  onContextMenu?: (item: T) => void;
  className?: string;
};

export function Inventory<T extends BaseToken>({ 
  title, 
  items, 
  equippedId, 
  onItemClick,
  onContextMenu,
  className 
}: InventoryProps<T>) {
  return (
    <div className={cn("bg-blue-900/30 backdrop-blur-sm border border-blue-800 rounded-lg p-4", className)}>
      {/* Title with total count */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
        <span className="text-sm text-blue-200">
          Total: {items.length}
        </span>
      </div>

      {/* Grid of items - 2 columns on mobile, 6 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.map((item) => (
          <div 
            key={`${item.project}-${item.collection}-${item.id}`}
            onClick={() => onItemClick?.(item)}
            className={cn(
              "group relative aspect-square rounded-lg transition-all duration-300 cursor-pointer overflow-hidden",
              "min-h-[140px] sm:min-h-[160px]",
              equippedId === item.id 
                ? "bg-emerald-950/30 border-2 border-emerald-400/50" 
                : "bg-blue-950/50 border border-blue-800 hover:border-blue-400"
            )}
          >
            {/* NFT Image */}
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            />
            
            {/* Equipped Badge - Top right */}
            {equippedId === item.id && (
              <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-emerald-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-lg">
                <Check className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            )}

            {/* Amount Badge - If exists, top right */}
            {'amount' in item && (item as any).amount > 0 && (
              <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-emerald-500/90 backdrop-blur-sm text-white text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 rounded-full shadow-lg min-w-[20px] text-center">
                ×{(item as any).amount}
              </div>
            )}

            {/* Transfer Button - If exists */}
            {onContextMenu && (
              <button
                type="button"
                onClick={(e) => {
                  console.log('Button clicked');
                  e.preventDefault();
                  e.stopPropagation();
                  onContextMenu(item);
                }}
                className={cn(
                  "absolute top-1 left-1 sm:top-2 sm:left-2 p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-200 z-50",
                  "bg-blue-900/80 hover:bg-blue-800 active:bg-blue-700",
                  "opacity-100",
                  "min-w-[32px] min-h-[32px] sm:min-w-[40px] sm:min-h-[40px]",
                  "flex items-center justify-center"
                )}
              >
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            )}
            
            {/* Item Info Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-xs sm:text-sm font-medium text-white truncate">{item.name}</p>
                {'defense' in item && (
                  <p className="text-xs text-blue-200">Defense: {(item as any).defense}</p>
                )}
                {'damage' in item && (
                  <p className="text-xs text-blue-200">Damage: {(item as any).damage}</p>
                )}
                {'durability' in item && (
                  <p className="text-xs text-blue-200">Durability: {(item as any).durability}</p>
                )}
                {'weight' in item && (
                  <p className="text-xs text-blue-200">Weight: {(item as any).weight}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}