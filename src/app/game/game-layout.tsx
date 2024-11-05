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
import { useQueryClient, UseMutateFunction } from "@tanstack/react-query";
import { useChromia } from "@/lib/chromia-connect/chromia-context";

type GameState = "idle" | "casting" | "fishing";
type FishDirection = "left" | "right";

interface SwimmingFish {
  id: number;
  x: number;
  y: number;
  direction: FishDirection;
  speed: number;
}

interface SplashEffect {
  id: number;
  x: number;
  y: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'loading' | 'success' | 'error';
}

export default function GameLayout() {
  const queryClient = useQueryClient();
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
  const { chromiaClient, chromiaSession } = useChromia();

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

  // Pre-load the pull operation to prevent first-catch lag
  useEffect(() => {
    if (gameState === "fishing") {
      // Warm up the mutation cache
      queryClient.getMutationCache().build(queryClient, {
        mutationKey: ['pull_fishing_rod'],
        mutationFn: () => {
          pullRod();
          return Promise.resolve();
        },
      });
    }
  }, [gameState, queryClient, pullRod]);

  // Add a new state to track if we're currently catching a fish
  const [isCatching, setIsCatching] = useState(false);

  // Check for fish collision with bob
  useEffect(() => {
    if (gameState !== "fishing" || isCatching) return;

    const checkCollision = () => {
      console.log('Checking collisions...', {
        bobPosition,
        fishCount: fish.length,
        isCatching
      });

      const catchableFish = fish.find(f => {
        // Calculate center points
        const bobY = bobPosition;
        const fishY = f.y;
        const fishX = f.x;
        
        // More lenient collision detection
        const verticalProximity = Math.abs(fishY - bobY) < 25;
        const horizontalProximity = Math.abs(fishX - 50) < 20;

        // Debug every fish position
        console.log('Fish position:', {
          fishId: f.id,
          fishX,
          fishY,
          bobY,
          verticalDistance: Math.abs(fishY - bobY),
          horizontalDistance: Math.abs(fishX - 50),
          isVerticalHit: verticalProximity,
          isHorizontalHit: horizontalProximity,
          willCatch: verticalProximity && horizontalProximity
        });
        
        return verticalProximity && horizontalProximity;
      });

      if (catchableFish && !isCatching) {
        console.log('Caught fish!', {
          fishId: catchableFish.id,
          position: { x: catchableFish.x, y: catchableFish.y },
          bobPosition
        });

        setIsCatching(true);
        setBobPosition(-10);
        setScore(prev => prev + 1);
        setFish(prev => prev.filter(f => f.id !== catchableFish.id));
        
        console.log('Calling pullRod mutation...');
        pullRod();

        setTimeout(() => {
          setBobPosition(20);
          setIsCatching(false);
          console.log('Reset bob position to 20, ready to catch again');
        }, 1500);
      }
    };

    // Check for collisions less frequently to reduce log spam
    const interval = setInterval(checkCollision, 100); // Reduced from 60fps to 10fps
    return () => clearInterval(interval);
  }, [gameState, fish, bobPosition, pullRod, isCatching]);

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

      if (e.code === "ArrowDown") {
        setBobPosition(prev => Math.min(prev + 5, 80));
      } else if (e.code === "ArrowUp") {
        setBobPosition(prev => Math.max(prev - 5, 20));
      }
    };

    // Use capture phase to intercept events before other handlers
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [gameState]);

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

  const [splashEffects, setSplashEffects] = useState<SplashEffect[]>([]);

  // Handle click/touch on game area
  const handleGameAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== "fishing") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Add splash effect
    const newSplash = { id: Date.now(), x, y };
    setSplashEffects(prev => [...prev, newSplash]);

    // Remove splash effect after animation
    setTimeout(() => {
      setSplashEffects(prev => prev.filter(splash => splash.id !== newSplash.id));
    }, 1000);

    // Check if we clicked on a fish
    const clickedFish = fish.find(f => {
      const distanceX = Math.abs(f.x - x);
      const distanceY = Math.abs(f.y - y);
      return distanceX < 10 && distanceY < 10; // Increased hit box
    });

    if (clickedFish) {
      setScore(prev => prev + 1);
      setFish(prev => prev.filter(f => f.id !== clickedFish.id));
      pullRod();
    }
  };

  // Start game when instructions are closed
  const handleStartGame = () => {
    setShowInstructions(false);
    setGameState("fishing"); // Start spawning fish
  };

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type']) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toast Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              "animate-slide-down px-4 py-2 rounded-lg shadow-lg text-white min-w-[200px] text-center",
              {
                'bg-blue-500': toast.type === 'loading',
                'bg-emerald-500': toast.type === 'success',
                'bg-red-500': toast.type === 'error'
              }
            )}
          >
            {toast.type === 'loading' && (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {toast.message}
              </div>
            )}
            {toast.type !== 'loading' && toast.message}
          </div>
        ))}
      </div>

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
          className="bg-blue-900/30 backdrop-blur-sm border border-blue-800 rounded-lg p-8 h-[600px] relative overflow-hidden cursor-crosshair"
          onClick={handleGameAreaClick}
        >
          {/* Instructions */}
          {showInstructions ? (
            <div className="absolute top-4 left-4 z-50 bg-black/70 p-4 rounded-lg text-white max-w-md">
              <h3 className="text-lg font-bold mb-2">How to Play:</h3>
              <p className="text-sm mb-4">Click on the fish to catch them!</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartGame();
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors text-sm"
              >
                Start Fishing!
              </button>
            </div>
          ) : (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
              {gameState === "idle" && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setGameState("fishing");
                  }}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
                >
                  Start Fishing
                </button>
              )}
            </div>
          )}

          {/* Water Animation */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-blue-950/40">
            <div className="absolute inset-0 opacity-30 bg-[url('/waves.png')] bg-repeat-x animate-wave" />
          </div>

          {/* Splash Effects */}
          {splashEffects.map(splash => (
            <div
              key={splash.id}
              className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ 
                left: `${splash.x}%`, 
                top: `${splash.y}%` 
              }}
            >
              {/* Ripple Effect */}
              <div className="absolute inset-0 animate-ripple rounded-full border-4 border-cyan-400/30" />
              <div className="absolute inset-0 animate-ripple-delayed rounded-full border-2 border-cyan-400/20" />
              {/* Splash Particles */}
              <div className="absolute inset-0 animate-splash">
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-400/60 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
          ))}

          {/* Swimming Fish */}
          {fish.map(f => (
            <Fish 
              key={f.id}
              className={cn(
                "absolute text-cyan-400 w-12 h-12 transition-transform duration-200 z-15 cursor-pointer",
                f.direction === "left" ? "scale-x-1" : "scale-x-[-1]"
              )}
              style={{ 
                top: `${f.y}%`,
                left: `${f.x}%`,
                filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.3))'
              }}
            />
          ))}

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
          <Inventory
            title="Your Caught Fishes"
            items={caughtFishes ?? []}
            className="space-y-4"
          />
        )}

        {/* Found Equipment Inventory */}
        {isLoadingArmor || isLoadingWeapons ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : (
          <Inventory
            title="Found Equipment"
            items={equipment}
            onContextMenu={(item) => {
              if (!isCrosschainTransferPending) {
                showToast('Transferring to Battle Game...', 'loading');
                crosschainTransfer(
                  {
                    project: item.project,
                    collection: item.collection,
                    id: item.id,
                    amount: 1
                  },
                  {
                    onSuccess: () => {
                      showToast('Successfully transferred to Battle Game!', 'success');
                    },
                    onError: () => {
                      showToast('Failed to transfer. Please try again.', 'error');
                    }
                  }
                );
              }
            }}
          />
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
      </section>
    </div>
  );
} 