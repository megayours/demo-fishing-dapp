"use client";

import { AuthButtons } from "@/components/auth/auth-buttons";
import { Fish, Loader2, ArrowDown, ArrowUp, Space, ChevronUp, ChevronDown, Shield, MoreVertical, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Inventory } from "@/components/inventory/inventory";
import { 
  useAllPfps, 
  useEquippedPfp, 
  useAllFishingRods, 
  useBuyFishingRod,
  useEquippedFishingRod,
  useEquipFishingRod,
  useUnequipFishingRod,
  usePullFishingRod,
  useCaughtFishes,
  useArmor,
  useWeapons,
  Armor
} from "@/hooks/dapp-api/useDappApi";
import Image from "next/image";
import { Weapon } from "@/hooks/dapp-api/types";
import { useCrosschainTransfer } from "@/hooks/dapp-api/useDappApi";

type GameState = "idle" | "casting" | "fishing";
type FishDirection = "left" | "right";

interface SwimmingFish {
  id: number;
  x: number;
  y: number;
  direction: FishDirection;
  speed: number;
}

export default function GameLayout() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [bobPosition, setBobPosition] = useState(0); // start at top (0%)
  const [fish, setFish] = useState<SwimmingFish[]>([]);
  const { data: allPfps, isLoading: isLoadingPfps } = useAllPfps();
  const { data: equippedPfp, isLoading: isLoadingEquipped } = useEquippedPfp();
  const { data: fishingRods, isLoading: isLoadingRods } = useAllFishingRods();
  const { data: equippedRod, isLoading: isLoadingEquippedRod } = useEquippedFishingRod();
  const { mutate: buyFishingRod, isPending: isBuyingRod } = useBuyFishingRod();
  const { mutate: equipRod, isPending: isEquippingRod } = useEquipFishingRod();
  const { mutate: unequipRod, isPending: isUnequippingRod } = useUnequipFishingRod();
  const { mutate: pullRod } = usePullFishingRod();
  const { data: caughtFishes, isLoading: isLoadingFishes } = useCaughtFishes();
  const { data: armor, isLoading: isLoadingArmor } = useArmor();
  const { data: weapons, isLoading: isLoadingWeapons } = useWeapons();

  // Instructions panel state
  const [showInstructions, setShowInstructions] = useState(true);

  const handlePfpSelect = (pfp: any) => {
    console.log("Selected PFP:", pfp);
  };

  // Fish spawning logic - fixed to ensure continuous movement
  useEffect(() => {
    if (gameState !== "fishing") return;

    const spawnFish = () => {
      const direction = Math.random() > 0.5 ? "left" : "right";
      const newFish: SwimmingFish = {
        id: Date.now(),
        x: direction === "left" ? -10 : 110, // Just outside the visible area
        y: Math.random() * 40 + 30, // Random height between 30% and 70%
        direction,
        speed: 0.2, // Slower speed for smoother movement
      };
      setFish(prev => [...prev.slice(-4), newFish]); // Keep max 5 fish at a time
    };

    // Initial fish spawn
    spawnFish();
    const interval = setInterval(spawnFish, 4000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Fish movement logic - fixed to ensure continuous movement
  useEffect(() => {
    if (gameState !== "fishing") return;

    const moveInterval = setInterval(() => {
      setFish(prev => prev
        .map(fish => ({
          ...fish,
          x: fish.direction === "left" ? 
            fish.x + fish.speed : // Moving right
            fish.x - fish.speed   // Moving left
        }))
        .filter(fish => fish.x >= -10 && fish.x <= 110) // Keep fish slightly beyond visible area
      );
    }, 16); // ~60fps

    return () => clearInterval(moveInterval);
  }, [gameState]);

  // Handle rod equipping
  const handleRodSelect = (rod: any) => {
    if (equippedRod?.id === rod.id) {
      unequipRod();
    } else {
      equipRod({
        project: rod.project,
        collection: rod.collection,
        id: rod.id
      });
    }
  };

  // Handle successful catch
  const handleCatch = () => {
    if (gameState !== "fishing") return;
    
    // Check for catch
    const catchableFish = fish.find(f => 
      Math.abs(f.y - bobPosition) < 10 && // Vertical proximity
      f.x > 45 && f.x < 55 // Horizontal proximity (center of screen)
    );

    if (catchableFish) {
      // Hide bob during catch animation
      setBobPosition(-10); // Move bob off screen
      setScore(prev => prev + 1);
      setFish(prev => prev.filter(f => f.id !== catchableFish.id));
      
      // Call the pull operation when catching a fish
      pullRod();

      // Reset bob position after catch animation
      setTimeout(() => {
        setBobPosition(20);
      }, 1500);
    }
  };

  // Keyboard controls
  useEffect(() => {
    if (gameState !== "fishing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Stop handling if we're in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Prevent default behaviors and stop propagation
      if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.code === "Space") {
        handleCatch();
      } else if (e.code === "ArrowDown") {
        setBobPosition(prev => Math.min(prev + 5, 80));
      } else if (e.code === "ArrowUp") {
        setBobPosition(prev => Math.max(prev - 5, 20));
      }
    };

    // Use capture phase to intercept events before other handlers
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [gameState, fish]);

  // Combine equipment for display
  const equipment = [
    ...(weapons ?? []),
    ...(armor ?? [])
  ];

  // Crosschain transfer function
  const { mutate: crosschainTransfer, isPending: isCrosschainTransferPending } = useCrosschainTransfer();

  // Add state for menu
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Add click handler to close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-900/50 backdrop-blur-sm border-b border-blue-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Crypto Fishing</h1>
            <span className="text-emerald-400 font-bold">Score: {score}</span>
          </div>
          <AuthButtons isHeader />
        </div>
      </header>

      {/* Game Section */}
      <section className="flex-1 container mx-auto p-4">
        <div 
          className="bg-blue-900/30 backdrop-blur-sm border border-blue-800 rounded-lg p-8 h-[600px] relative overflow-hidden"
          onClick={handleCatch} // Add click handler for mobile catch
        >
          {/* Instructions */}
          {showInstructions && (
            <div className="absolute top-4 left-4 z-50 bg-black/70 p-4 rounded-lg text-white max-w-md">
              <h3 className="text-lg font-bold mb-2">How to Play:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowDown className="w-4 h-4" /> Hold to reel in (or use buttons on mobile)
                </li>
                <li className="flex items-center gap-2">
                  <ArrowUp className="w-4 h-4" /> Hold to release line (or use buttons on mobile)
                </li>
                <li className="flex items-center gap-2">
                  <Space className="w-4 h-4" /> Press space or tap screen to catch when fish aligns with bob
                </li>
              </ul>
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent catch trigger
                  setShowInstructions(false);
                }}
                className="mt-4 text-xs text-blue-300 hover:text-blue-200 transition-colors"
              >
                Got it!
              </button>
            </div>
          )}

          {/* Water and Game Elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-blue-950/40">
            <div className="absolute inset-0 opacity-30 bg-[url('/waves.png')] bg-repeat-x animate-wave" />
          </div>

          {/* Game Elements Container */}
          <div className="relative h-full">
            {/* Character with PFP */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 flex flex-col items-center z-40">
              {equippedPfp ? (
                <>
                  {/* PFP Image Container */}
                  <div className="relative w-32 h-32">
                    <Image
                      src={equippedPfp.image}
                      alt={equippedPfp.name}
                      fill
                      className="object-cover rounded-full border-4 border-blue-400/30 shadow-[0_0_15px_rgba(96,165,250,0.3)]"
                    />
                  </div>
                  <p className="text-blue-200 text-sm font-medium mt-2">
                    {equippedPfp.name}
                  </p>
                </>
              ) : (
                // Fallback silhouette
                <div className="w-48 h-32 bg-black/20 rounded-t-full" />
              )}
            </div>

            {/* Fishing Line Container - Full Height Reference */}
            <div className="absolute inset-0">
              {/* Fishing Line */}
              <div 
                className="absolute left-1/2 w-[1px] bg-white/20 z-10"
                style={{ 
                  top: `${bobPosition}%`,
                  bottom: '140px', // Start from above PFP
                  transform: 'translateX(-50%)',
                }}
              />
              
              {/* Fishing Bob - Hide during catch */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-500"
                style={{ 
                  top: `${bobPosition}%`,
                  opacity: bobPosition < 0 ? 0 : 1 // Fade out when off screen
                }}
              >
                {/* Main bob body */}
                <div className="relative flex flex-col items-center">
                  {/* Top cone */}
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  {/* Middle section */}
                  <div className="w-3 h-4 bg-gradient-to-b from-red-500 to-white rounded-b-lg" />
                  {/* Bottom tip */}
                  <div className="w-1 h-2 bg-white rounded-b-full" />
                </div>
              </div>
            </div>

            {/* Swimming Fish */}
            {fish.map(f => (
              <Fish 
                key={f.id}
                className={cn(
                  "absolute text-cyan-400 w-12 h-12 transition-transform duration-200 z-15",
                  f.direction === "left" ? "scale-x-1" : "scale-x-[-1]"
                )}
                style={{ 
                  top: `${f.y}%`,
                  left: `${f.x}%`,
                  filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.3))'
                }}
              />
            ))}
          </div>

          {/* Game State UI */}
          {gameState === "idle" ? (
            <button 
              onClick={() => setGameState("fishing")}
              className="absolute top-4 left-1/2 -translate-x-1/2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
            >
              Start Fishing
            </button>
          ) : (
            <div className="absolute top-4 right-4 text-2xl font-bold text-emerald-400">
              Score: {score}
            </div>
          )}

          {/* Mobile Controls - Only show on touch devices */}
          {gameState === "fishing" && (
            <div className="md:hidden absolute bottom-32 left-0 right-0 flex justify-between px-8 z-50">
              {/* Reel In Button (Down) */}
              <button
                onTouchStart={() => setBobPosition(prev => Math.min(prev + 5, 80))}
                className="w-16 h-16 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm active:bg-black/50 transition-colors"
              >
                <ChevronDown className="w-8 h-8 text-white" />
              </button>

              {/* Release Line Button (Up) */}
              <button
                onTouchStart={() => setBobPosition(prev => Math.max(prev - 5, 20))}
                className="w-16 h-16 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm active:bg-black/50 transition-colors"
              >
                <ChevronUp className="w-8 h-8 text-white" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Inventory Section */}
      <section className="container mx-auto p-4 pb-8 space-y-8">
        {/* PFPs Inventory */}
        {isLoadingPfps || isLoadingEquipped ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : (
          <Inventory
            title="Your PFPs"
            items={allPfps ?? []}
            equippedId={equippedPfp?.id}
            onItemClick={handlePfpSelect}
          />
        )}

        {/* Fishing Rods Inventory */}
        {isLoadingRods || isLoadingEquippedRod ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Your Fishing Rods</h2>
              <button
                onClick={() => buyFishingRod()}
                disabled={isBuyingRod || isEquippingRod || isUnequippingRod}
                className={cn(
                  "px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-2"
                )}
              >
                {isBuyingRod ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Fish className="w-4 h-4" />
                )}
                Buy Basic Rod
              </button>
            </div>
            <Inventory
              title="Your Fishing Rods"
              items={fishingRods ?? []}
              equippedId={equippedRod?.id}
              onItemClick={handleRodSelect}
            />
          </div>
        )}

        {/* Caught Fishes Inventory */}
        {isLoadingFishes ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Your Caught Fishes</h2>
              <span className="text-blue-200">
                Total Caught: {caughtFishes?.reduce((acc, fish) => acc + fish.amount, 0) ?? 0}
              </span>
            </div>
            <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-800 rounded-lg p-8">
              {caughtFishes && caughtFishes.length > 0 ? (
                <div className="grid grid-cols-6 gap-4">
                  {caughtFishes.map((fish) => (
                    <div 
                      key={fish.id}
                      className="group relative aspect-square bg-blue-950/50 border border-blue-800 rounded-lg overflow-hidden"
                    >
                      {/* Fish Image */}
                      <Image
                        src={fish.image}
                        alt={fish.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                      
                      {/* Amount Badge */}
                      <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full shadow-lg">
                        ×{fish.amount}
                      </div>
                      
                      {/* Overlay with Fish info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                          <p className="text-sm font-medium truncate">{fish.name}</p>
                          <p className="text-xs text-blue-200">Caught: {fish.amount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-blue-200">
                  <Fish className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No fishes caught yet!</p>
                  <p className="text-sm opacity-75 mt-2">Start fishing to fill your collection</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Game Requirements Notice */}
        {(!equippedPfp || !equippedRod) && (
          <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-800 rounded-lg p-4 text-blue-200">
            <h3 className="font-bold mb-2">To start fishing, you need:</h3>
            <ul className="list-disc list-inside space-y-1">
              {!equippedPfp && (
                <li>Select a PFP to represent your character</li>
              )}
              {!equippedRod && (
                <li>Buy and equip a fishing rod</li>
              )}
            </ul>
          </div>
        )}

        {/* Equipment Inventory */}
        {isLoadingArmor || isLoadingWeapons ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Found Equipment</h2>
              <span className="text-blue-200">
                Total Found: {equipment.length}
              </span>
            </div>
            <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-800 rounded-lg p-8">
              {equipment.length > 0 ? (
                <div className="grid grid-cols-6 gap-4">
                  {equipment.map((item) => (
                    <div 
                      key={item.id}
                      className={cn(
                        "group relative aspect-square bg-blue-950/50 border border-blue-800 rounded-lg overflow-hidden",
                        "hover:border-blue-400"
                      )}
                    >
                      {/* Equipment Image */}
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                      
                      {/* Equipment Type Badge */}
                      <div className="absolute top-2 right-2 bg-blue-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full shadow-lg">
                        {(item as Weapon).damage !== undefined ? 'Weapon' : 'Armor'}
                      </div>

                      {/* Menu Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === item.id ? null : item.id);
                        }}
                        className={cn(
                          "absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 z-50",
                          "bg-blue-900/80 hover:bg-blue-800",
                          "group-hover:opacity-100 opacity-0" // Only show on hover
                        )}
                        title="Options"
                      >
                        <MoreVertical className="w-4 h-4 text-white" />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === item.id && (
                        <div 
                          className="absolute top-12 left-2 z-50 bg-blue-900/95 backdrop-blur-sm border border-blue-700 rounded-lg shadow-xl py-1 min-w-[160px]"
                          onClick={(e) => e.stopPropagation()} // Prevent click from bubbling
                        >
                          <button
                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-blue-800/50 transition-colors flex items-center gap-2"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isCrosschainTransferPending) {
                                crosschainTransfer({
                                  project: item.project,
                                  collection: item.collection,
                                  id: item.id,
                                  amount: 1
                                });
                                setOpenMenuId(null);
                              }
                            }}
                            disabled={isCrosschainTransferPending}
                          >
                            {isCrosschainTransferPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                            Transfer to Battle Game
                          </button>
                        </div>
                      )}
                      
                      {/* Overlay with Equipment info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-blue-200">
                            {(item as Weapon).damage !== undefined 
                              ? `Damage: ${(item as Weapon).damage}`
                              : `Defense: ${(item as Armor).defense}`
                            }
                          </p>
                          <p className="text-xs text-blue-200">Weight: {item.weight}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-blue-200">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No equipment found yet!</p>
                  <p className="text-sm opacity-75 mt-2">Keep fishing to find equipment</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
} 