
import React, { useMemo, useState } from 'react';
import { GRID_H, GRID_W, TOWER_STATS, SPELL_STATS, ENEMY_STATS } from '../constants';
import { Enemy, Projectile, Soldier, Tower, TowerType, ActiveSpell, SpellType, EnemyType, MapConfig } from '../types';
import { Star } from 'lucide-react';

interface GameMapProps {
  mapConfig: MapConfig;
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  soldiers: Soldier[];
  activeSpells: ActiveSpell[];
  selectedSpellType: SpellType | null;
  selectedTowerId: string | null;
  onTileClick: (x: number, y: number) => void;
  gridWidth: number;
  gridHeight: number;
}

const TILE_SIZE_PX = 40;

export const GameMap: React.FC<GameMapProps> = ({
  mapConfig,
  towers,
  enemies,
  projectiles,
  soldiers,
  activeSpells,
  selectedSpellType,
  selectedTowerId,
  onTileClick,
}) => {
  
  const [hoverPos, setHoverPos] = useState<{x: number, y: number} | null>(null);
  const { coordinates, theme } = mapConfig;
  const isVoid = theme.name === 'Void';

  // Pre-calculate the path set for quick lookup
  const pathSet = useMemo(() => {
    const set = new Set<string>();
    coordinates.forEach(p => set.add(`${p.x},${p.y}`));
    return set;
  }, [coordinates]);

  const isPath = (x: number, y: number) => pathSet.has(`${x},${y}`);

  // Handle mouse move for targeting reticle
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedSpellType) {
      if (hoverPos) setHoverPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE_PX);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE_PX);
    
    if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) {
      setHoverPos({ x, y });
    }
  };

  // Render Grid Background
  const renderGrid = () => {
    const tiles = [];
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const isPathTile = isPath(x, y);
        const isStart = x === coordinates[0].x && y === coordinates[0].y;
        const isEnd = x === coordinates[coordinates.length - 1].x && y === coordinates[coordinates.length - 1].y;

        let bgColor = isPathTile ? theme.path : theme.gridDark;
        let borderColor = 'border-black/10';

        if (isStart) bgColor = isVoid ? 'bg-fuchsia-500/80 border-fuchsia-300 border-2' : 'bg-green-500/80 border-green-300 border-2';
        if (isEnd) bgColor = isVoid ? 'bg-red-600/80 border-red-300 border-2' : 'bg-red-600/80 border-red-300 border-2';

        // Checkered grass pattern for aesthetics
        if (!isPathTile) {
           borderColor = 'border-white/5';
           if ((x + y) % 2 === 0) {
             bgColor = theme.gridLight;
           }
        } else {
           borderColor = theme.pathBorder; // optional path border
        }

        tiles.push(
          <div
            key={`${x}-${y}`}
            className={`absolute border ${borderColor} ${bgColor} transition-colors`}
            style={{
              width: TILE_SIZE_PX,
              height: TILE_SIZE_PX,
              left: x * TILE_SIZE_PX,
              top: y * TILE_SIZE_PX,
            }}
            onClick={() => onTileClick(x, y)}
          >
            {isStart && <span className="text-[10px] absolute inset-0 flex items-center justify-center text-white font-bold z-10">起点</span>}
            {isEnd && <span className="text-[10px] absolute inset-0 flex items-center justify-center text-white font-bold z-10">基地</span>}
          </div>
        );
      }
    }
    return tiles;
  };

  const renderEnemyIcon = (type: EnemyType) => {
    switch(type) {
      case EnemyType.SUPER_BOSS: return '🐲';
      case EnemyType.BOSS: return '👹';
      case EnemyType.TANK: return '🗿';
      case EnemyType.SCORPION: return '🦂';
      case EnemyType.ORC: return '👺';
      default: return '👿';
    }
  };

  return (
    <div 
        className={`relative overflow-hidden shadow-2xl border-4 border-gray-800 rounded-lg ${theme.background} cursor-crosshair`}
        style={{ width: GRID_W * TILE_SIZE_PX, height: GRID_H * TILE_SIZE_PX }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverPos(null)}
    >
      {/* 1. Base Grid */}
      {renderGrid()}

      {/* 2. Towers */}
      {towers.map(tower => {
        const isSelected = tower.id === selectedTowerId;
        const hpPercent = (tower.hp / tower.maxHp) * 100;

        return (
          <div
            key={tower.id}
            onClick={(e) => {
              e.stopPropagation();
              onTileClick(tower.x, tower.y);
            }}
            className={`absolute rounded-md flex items-center justify-center text-xl z-10 
              ${TOWER_STATS[tower.type].color} 
              ${isSelected ? 'ring-2 ring-white scale-110 z-20 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'shadow-lg'}
              transition-all duration-200
            `}
            style={{
              width: TILE_SIZE_PX - 4,
              height: TILE_SIZE_PX - 4,
              left: tower.x * TILE_SIZE_PX + 2,
              top: tower.y * TILE_SIZE_PX + 2,
            }}
          >
            {TOWER_STATS[tower.type].icon}
            
            {/* Durability Bar */}
            <div className="absolute -bottom-1 w-full h-1 bg-gray-900 rounded-full overflow-hidden">
               <div 
                 className={`h-full ${hpPercent < 30 ? 'bg-red-500' : 'bg-green-400'}`} 
                 style={{ width: `${hpPercent}%` }}
               />
            </div>

            {/* Level Indicators */}
            <div className="absolute -top-2 flex justify-center w-full space-x-0.5">
              {Array.from({ length: tower.level }).map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300 drop-shadow-md" />
              ))}
            </div>
            
            {/* Range indicator if selected */}
            {isSelected && (
              <div 
                className="absolute rounded-full bg-white/10 border border-white/30 pointer-events-none z-0 animate-pulse"
                style={{
                  width: tower.range * 2 * TILE_SIZE_PX,
                  height: tower.range * 2 * TILE_SIZE_PX,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            )}
          </div>
        );
      })}

      {/* 3. Soldiers */}
      {soldiers.map(soldier => (
        <div
          key={soldier.id}
          className="absolute z-20 flex items-center justify-center transition-all duration-100 linear"
          style={{
            width: 16,
            height: 16,
            left: soldier.x * TILE_SIZE_PX + (TILE_SIZE_PX/2) - 8,
            top: soldier.y * TILE_SIZE_PX + (TILE_SIZE_PX/2) - 8,
          }}
        >
          <div className="w-full h-full bg-blue-400 rounded-full border border-white shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
          {/* Health Bar for Soldier */}
          <div className="absolute -top-2 w-6 h-1 bg-gray-700 rounded-full overflow-hidden">
             <div 
               className="h-full bg-green-500" 
               style={{ width: `${(soldier.hp / soldier.maxHp) * 100}%`}}
             />
          </div>
        </div>
      ))}

      {/* 4. Enemies */}
      {enemies.map(enemy => {
        const isSuperBoss = enemy.type === EnemyType.SUPER_BOSS;
        const isBoss = enemy.type === EnemyType.BOSS;
        const isTank = enemy.type === EnemyType.TANK;
        
        let size = 20;
        if (isSuperBoss) size = 60;
        else if (isBoss || isTank) size = 30;
        
        const offset = size / 2;
        
        const left = enemy.x * TILE_SIZE_PX + (TILE_SIZE_PX / 2) - offset;
        const top = enemy.y * TILE_SIZE_PX + (TILE_SIZE_PX / 2) - offset;
        const isFrozen = enemy.frozen > 0;
        const isPoisoned = enemy.poisoned > 0;
        const isRooted = enemy.rooted > 0;
        
        return (
          <div
            key={enemy.id}
            className="absolute z-30 flex flex-col items-center justify-center"
            style={{
              width: size,
              height: size,
              left: left,
              top: top,
            }}
          >
             {/* Sprite */}
             <div className={`
                flex items-center justify-center
                ${enemy.engagedWithSoldierId ? 'animate-bounce' : ''} 
                ${isFrozen ? 'brightness-150 hue-rotate-180' : ''}
                ${isRooted ? 'grayscale opacity-80' : ''}
                ${isPoisoned ? 'animate-pulse saturate-200 sepia' : ''}
                ${isSuperBoss ? 'text-5xl drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]' : (isBoss || isTank ? 'text-3xl' : 'text-2xl')}
                ${ENEMY_STATS[enemy.type].color}
             `}>
                {renderEnemyIcon(enemy.type)}
             </div>
             {isFrozen && <div className="absolute -right-2 -top-2 text-xs">❄️</div>}
             {isPoisoned && <div className="absolute -left-2 -top-2 text-xs">🤢</div>}
             {isRooted && <div className="absolute -right-2 top-2 text-xs">🌿</div>}

             {/* Health Bar */}
             <div className={`absolute -top-3 bg-gray-800 border border-black rounded-sm overflow-hidden ${isSuperBoss ? 'w-16 h-2' : 'w-8 h-1.5'}`}>
               <div 
                 className={`h-full ${enemy.engagedWithSoldierId ? 'bg-red-600' : 'bg-purple-500'}`} 
                 style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
               />
             </div>
          </div>
        );
      })}

      {/* 5. Projectiles */}
      {projectiles.map(proj => (
        <div
          key={proj.id}
          className={`absolute z-40 rounded-full shadow-[0_0_8px_rgba(253,224,71,0.8)] ${proj.color}`}
          style={{
            width: proj.type === TowerType.SNIPER ? 4 : 8,
            height: proj.type === TowerType.SNIPER ? 4 : 8,
            left: proj.x * TILE_SIZE_PX + (TILE_SIZE_PX / 2) - 4,
            top: proj.y * TILE_SIZE_PX + (TILE_SIZE_PX / 2) - 4,
          }}
        />
      ))}

      {/* 6. Active Spell Effects */}
      {activeSpells.map(spell => {
        const pxSize = spell.radius * 2 * TILE_SIZE_PX;
        const left = spell.x * TILE_SIZE_PX + (TILE_SIZE_PX / 2) - (pxSize / 2);
        const top = spell.y * TILE_SIZE_PX + (TILE_SIZE_PX / 2) - (pxSize / 2);
        const config = SPELL_STATS[spell.type];

        return (
          <div
            key={spell.id}
            className={`absolute rounded-full pointer-events-none z-20 animate-pulse`}
            style={{
              width: pxSize,
              height: pxSize,
              left: left,
              top: top,
              backgroundColor: config.color,
              boxShadow: `0 0 20px ${config.color}`,
              border: `2px solid ${spell.type === SpellType.METEOR ? 'orange' : 'cyan'}`,
            }}
          >
             {/* Inner visual flair */}
             {spell.type === SpellType.METEOR && (
               <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-50">
                  <div className="w-1/2 h-1/2 bg-red-500 rounded-full"></div>
               </div>
             )}
             {spell.type === SpellType.BLIZZARD && (
               <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30 animate-spin">
                  ❄️
               </div>
             )}
             {spell.type === SpellType.THUNDER && (
               <div className="absolute inset-0 flex items-center justify-center animate-ping">
                  <div className="text-6xl">⚡</div>
               </div>
             )}
             {spell.type === SpellType.HEAL && (
               <div className="absolute inset-0 flex items-center justify-center animate-bounce opacity-50">
                  <div className="text-4xl">✨</div>
               </div>
             )}
             {spell.type === SpellType.ROOT && (
               <div className="absolute inset-0 flex items-center justify-center opacity-50">
                  <div className="text-4xl">🌿</div>
               </div>
             )}
          </div>
        );
      })}

      {/* 7. Targeting Reticle */}
      {selectedSpellType && hoverPos && (
        <div 
          className="absolute rounded-full pointer-events-none border-2 border-white/50 z-50 flex items-center justify-center"
          style={{
            width: SPELL_STATS[selectedSpellType].radius * 2 * TILE_SIZE_PX,
            height: SPELL_STATS[selectedSpellType].radius * 2 * TILE_SIZE_PX,
            left: hoverPos.x * TILE_SIZE_PX + (TILE_SIZE_PX / 2) - (SPELL_STATS[selectedSpellType].radius * TILE_SIZE_PX),
            top: hoverPos.y * TILE_SIZE_PX + (TILE_SIZE_PX / 2) - (SPELL_STATS[selectedSpellType].radius * TILE_SIZE_PX),
            backgroundColor: SPELL_STATS[selectedSpellType].color,
          }}
        >
           <div className="text-white opacity-80 text-2xl animate-bounce">
             {SPELL_STATS[selectedSpellType].icon}
           </div>
        </div>
      )}

    </div>
  );
};
