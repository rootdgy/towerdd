
import React, { useMemo, useState } from 'react';
import { GRID_H, GRID_W, TOWER_STATS, SPELL_STATS, ENEMY_STATS } from '../constants';
import { Enemy, Projectile, Soldier, Tower, TowerType, ActiveSpell, SpellType, EnemyType, MapConfig, VisualEffect } from '../types';
import { Star } from 'lucide-react';

interface GameMapProps {
  mapConfig: MapConfig;
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  soldiers: Soldier[];
  activeSpells: ActiveSpell[];
  visualEffects: VisualEffect[];
  selectedSpellType: SpellType | null;
  selectedTowerId: string | null;
  onTileClick: (x: number, y: number) => void;
  gridWidth: number;
  gridHeight: number;
  isBuilding: boolean;
}

const TILE_SIZE_PX = 40;

export const GameMap: React.FC<GameMapProps> = ({
  mapConfig,
  towers,
  enemies,
  projectiles,
  soldiers,
  activeSpells,
  visualEffects,
  selectedSpellType,
  selectedTowerId,
  onTileClick,
  isBuilding
}) => {
  
  const [hoverPos, setHoverPos] = useState<{x: number, y: number} | null>(null);
  const { coordinates, theme } = mapConfig;
  const isVoid = theme.name === 'Void';
  const isGlacier = theme.name === 'Glacier';

  const pathSet = useMemo(() => {
    const set = new Set<string>();
    coordinates.forEach(p => set.add(`${p.x},${p.y}`));
    return set;
  }, [coordinates]);
  
  // OPTIMIZATION: Cache tower positions for O(1) lookup during grid render
  const towerPositions = useMemo(() => {
    const s = new Set<string>();
    towers.forEach(t => s.add(`${t.x},${t.y}`));
    return s;
  }, [towers]);

  const isPath = (x: number, y: number) => pathSet.has(`${x},${y}`);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE_PX);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE_PX);
    
    if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) {
      setHoverPos({ x, y });
    }
  };

  const renderGrid = () => {
    const tiles = [];
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const isPathTile = isPath(x, y);
        const isStart = x === coordinates[0].x && y === coordinates[0].y;
        const isEnd = x === coordinates[coordinates.length - 1].x && y === coordinates[coordinates.length - 1].y;

        let bgColor = isPathTile ? theme.path : theme.gridDark;
        let borderColor = 'border-black/10';

        if (isStart) bgColor = isVoid ? 'bg-fuchsia-500/80 border-fuchsia-300 border-2' : (isGlacier ? 'bg-cyan-600/80 border-cyan-300 border-2' : 'bg-green-500/80 border-green-300 border-2');
        if (isEnd) bgColor = isVoid ? 'bg-red-600/80 border-red-300 border-2' : 'bg-red-600/80 border-red-300 border-2';

        if (!isPathTile) {
           borderColor = 'border-white/5';
           if ((x + y) % 2 === 0) {
             bgColor = theme.gridLight;
           }
        } else {
           borderColor = theme.pathBorder;
        }

        let overlay = null;
        if (isBuilding && hoverPos && hoverPos.x === x && hoverPos.y === y) {
            // OPTIMIZATION: Use Set check instead of array.some
            const hasTower = towerPositions.has(`${x},${y}`);
            const isValid = !isPathTile && !hasTower;
            overlay = (
                <div className={`absolute inset-0 border-2 ${isValid ? 'border-green-500 bg-green-500/30' : 'border-red-500 bg-red-500/30'} animate-pulse z-20`}></div>
            );
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
            {overlay}
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
      {renderGrid()}

      {towers.map(tower => {
        const isSelected = tower.id === selectedTowerId;
        const hpPercent = (tower.hp / tower.maxHp) * 100;

        // Check if under Overclock effect
        // OPTIMIZATION: Squared distance
        const isOverclocked = activeSpells.some(s => s.type === SpellType.OVERCLOCK && (s.x-tower.x)**2 + (s.y-tower.y)**2 <= s.radius**2);

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
              ${isOverclocked ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
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
            <div className="absolute -bottom-1 w-full h-1 bg-gray-900 rounded-full overflow-hidden">
               <div className={`h-full ${hpPercent < 30 ? 'bg-red-500' : 'bg-green-400'}`} style={{ width: `${hpPercent}%` }} />
            </div>
            <div className="absolute -top-2 flex justify-center w-full space-x-0.5">
              {Array.from({ length: Math.min(5, tower.level) }).map((_, i) => (
                <Star key={i} className="w-2 h-2 text-yellow-300 fill-yellow-300 drop-shadow-md" />
              ))}
              {tower.level > 5 && <span className="text-[10px] text-yellow-300 font-bold ml-1">+{tower.level-5}</span>}
            </div>
            
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

      {soldiers.map(soldier => (
        <div key={soldier.id} className="absolute z-20 flex items-center justify-center" style={{ width: 16, height: 16, left: soldier.x * TILE_SIZE_PX + 12, top: soldier.y * TILE_SIZE_PX + 12 }}>
          <div className="w-full h-full bg-blue-400 rounded-full border border-white shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
          <div className="absolute -top-2 w-6 h-1 bg-gray-700 rounded-full overflow-hidden">
             <div className="h-full bg-green-500" style={{ width: `${(soldier.hp / soldier.maxHp) * 100}%`}} />
          </div>
        </div>
      ))}

      {enemies.map(enemy => {
        const isSuperBoss = enemy.type === EnemyType.SUPER_BOSS;
        const size = isSuperBoss ? 60 : (enemy.type === EnemyType.BOSS || enemy.type === EnemyType.TANK ? 30 : 20);
        const offset = size / 2;
        
        return (
          <div
            key={enemy.id}
            className="absolute z-30 flex flex-col items-center justify-center transition-transform"
            style={{ width: size, height: size, left: enemy.x * TILE_SIZE_PX + 20 - offset, top: enemy.y * TILE_SIZE_PX + 20 - offset }}
          >
             <div className={`
                flex items-center justify-center
                ${enemy.engagedWithSoldierId ? 'animate-bounce' : ''} 
                ${enemy.frozen > 0 ? 'brightness-150 hue-rotate-180' : ''}
                ${enemy.rooted > 0 ? 'grayscale opacity-80' : ''}
                ${enemy.poisoned > 0 ? 'animate-pulse saturate-200 sepia' : ''}
                ${enemy.confused > 0 ? 'scale-y-[-1]' : ''}
                ${isSuperBoss ? 'text-5xl drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]' : 'text-2xl'}
                ${ENEMY_STATS[enemy.type].color}
                ${enemy.lastHitTime && Date.now() - enemy.lastHitTime < 100 ? 'brightness-200 contrast-50' : ''}
             `}>
                {renderEnemyIcon(enemy.type)}
             </div>
             <div className={`absolute -top-3 bg-gray-800 border border-black rounded-sm overflow-hidden ${isSuperBoss ? 'w-16 h-2' : 'w-8 h-1.5'}`}>
               <div className={`h-full ${enemy.engagedWithSoldierId ? 'bg-red-600' : 'bg-purple-500'}`} style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
             </div>
          </div>
        );
      })}

      {projectiles.map(proj => (
        <div
          key={proj.id}
          className={`absolute z-40 rounded-full shadow-[0_0_8px_rgba(253,224,71,0.8)] ${proj.color}`}
          style={{
            width: proj.type === TowerType.SNIPER ? 4 : 8,
            height: proj.type === TowerType.SNIPER ? 4 : 8,
            left: proj.x * TILE_SIZE_PX + 16,
            top: proj.y * TILE_SIZE_PX + 16,
          }}
        />
      ))}

      {activeSpells.map(spell => {
        const pxSize = spell.radius * 2 * TILE_SIZE_PX;
        const config = SPELL_STATS[spell.type];
        return (
          <div
            key={spell.id}
            className={`absolute rounded-full pointer-events-none z-20 ${spell.type === SpellType.OVERCLOCK ? 'animate-spin-slow' : 'animate-pulse'}`}
            style={{
              width: pxSize, height: pxSize,
              left: spell.x * TILE_SIZE_PX + 20 - (pxSize / 2),
              top: spell.y * TILE_SIZE_PX + 20 - (pxSize / 2),
              backgroundColor: config.color,
              boxShadow: `0 0 20px ${config.color}`,
              opacity: 0.4
            }}
          ></div>
        );
      })}

      {/* Visual Effects (Beams, Text, Explosions) */}
      {visualEffects.map(vfx => {
         if (vfx.type === 'BEAM') {
             // Calculate length and angle
             const dx = (vfx.ex! - vfx.x) * TILE_SIZE_PX;
             const dy = (vfx.ey! - vfx.y) * TILE_SIZE_PX;
             const length = Math.sqrt(dx*dx + dy*dy);
             const angle = Math.atan2(dy, dx) * 180 / Math.PI;
             
             return (
                 <div 
                    key={vfx.id}
                    className="absolute z-50 pointer-events-none origin-left animate-pulse"
                    style={{
                        left: vfx.x * TILE_SIZE_PX + 20,
                        top: vfx.y * TILE_SIZE_PX + 20,
                        width: length,
                        height: 4,
                        backgroundColor: vfx.color,
                        transform: `rotate(${angle}deg)`,
                        boxShadow: `0 0 10px ${vfx.color}`,
                        opacity: vfx.life / vfx.maxLife
                    }}
                 />
             )
         }

         return (
          <div
            key={vfx.id}
            className="absolute z-[100] text-sm font-bold pointer-events-none"
            style={{
                left: vfx.x * TILE_SIZE_PX + 10,
                top: vfx.y * TILE_SIZE_PX,
                color: vfx.color,
                textShadow: '0 1px 2px black',
                opacity: vfx.life / vfx.maxLife,
                transform: 'translateY(-20px)'
            }}
          >
              {vfx.text}
          </div>
         )
      })}
    </div>
  );
};
