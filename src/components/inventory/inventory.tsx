import { Pfp } from "@/hooks/dapp-api/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

type InventoryProps = {
  title: string;
  items: Pfp[];
  equippedId?: number;
  onItemClick?: (item: Pfp) => void;
  className?: string;
};

export function Inventory({ 
  title, 
  items, 
  equippedId, 
  onItemClick,
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
            className={cn(
              "group relative aspect-square bg-blue-950/50 border rounded-lg transition-all duration-300 cursor-pointer overflow-hidden",
              equippedId === item.id 
                ? "border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]" 
                : "border-blue-800 hover:border-blue-400"
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
              <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                Equipped
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 