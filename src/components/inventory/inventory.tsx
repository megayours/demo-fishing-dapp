import { Pfp } from "@/hooks/dapp-api/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";

type InventoryProps = {
  title: string;
  items: Pfp[];
  equippedId?: number;
  onItemClick?: (item: Pfp) => void;
  onContextMenu?: (e: React.MouseEvent, item: Pfp) => void;
  className?: string;
};

export function Inventory({ 
  title, 
  items, 
  equippedId, 
  onItemClick,
  onContextMenu,
  className 
}: InventoryProps) {
  return (
    <div className={cn("bg-blue-900/30 backdrop-blur-sm border border-blue-800 rounded-lg p-8", className)}>
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      <div className="grid grid-cols-6 gap-4">
        {items.map((item) => (
          <div 
            key={item.id}
            onClick={() => onItemClick?.(item)}
            onContextMenu={(e) => onContextMenu?.(e, item)}
            className={cn(
              "group relative aspect-square rounded-lg transition-all duration-300 cursor-pointer overflow-hidden",
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
              className="object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
            />
            
            {/* Overlay with NFT info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                <p className="text-sm font-medium truncate">{item.name}</p>
              </div>
            </div>

            {/* Equipped Badge */}
            {equippedId === item.id && (
              <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                <Check className="w-3 h-3" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 