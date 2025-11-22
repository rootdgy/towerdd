
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameMap } from './components/GameMap';
import { 
  GRID_W, GRID_H, MAP_CONFIGS,
  TOWER_STATS, ENEMY_STATS, SPELL_STATS,
  BASE_STARTING_MONEY, STARTING_LIVES, STARTING_MANA, MAX_MANA, MANA_REGEN_RATE, FPS, SHOP_ITEMS, SHOP_REROLL_COST 
} from './constants';
import { 
  Tower, Enemy, Projectile, Soldier, ActiveSpell,
  GameState, TowerType, EnemyType, SpellType, AppScreen, MapConfig, AppSettings, GameMode
} from './types';
import { 
  Play, Pause, RotateCcw, FastForward, 
  Coins, Heart, ShieldAlert, Zap, Flame, 
  ArrowUpCircle, Trash2, Save, Upload, Lock, MapPin, Trophy,
  Settings, X, Volume2, Music, Book, HelpCircle, Terminal, Cpu, Radio, Gem, ShoppingCart, Infinity as InfinityIcon, Briefcase, RefreshCw, Backpack, Skull
} from 'lucide-react';
import { AudioController } from './audio';

// --- Main Component ---

export default function App() {
  // --- State ---
  const [screen, setScreen] = useState<AppScreen>(AppScreen.START);

  const [gameState, setGameState] = useState<GameState>({
    money: BASE_STARTING_MONEY,
    diamonds: 0,
    inventory: [],
    shopStock: [],
    lives: STARTING_LIVES,
    wave: 1,
    currentLevelId: 1,
    maxUnlockedLevel: 1,
    mana: STARTING_MANA,
    maxMana: MAX_MANA,
    isPlaying: false,
    isGameOver: false,
    isLevelComplete: false,
    gameSpeed: 1,
    gameMode: GameMode.STORY
  });

  const [settings, setSettings] = useState<AppSettings>({
    musicVolume: 0.3,
    sfxVolume: 0.5
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showTacticalMenu, setShowTacticalMenu] = useState(false);

  // Entity Refs
  const towersRef = useRef<Tower[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const soldiersRef = useRef<Soldier[]>([]);
  const activeSpellsRef = useRef<ActiveSpell[]>([]);
  const spellCooldownsRef = useRef<Record<string, number>>({}); 
  
  // Audio Ref
  const audioRef = useRef<AudioController>(new AudioController());

  // Rendering state
  const [renderEntities, setRenderEntities] = useState({
    towers: [] as Tower[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    soldiers: [] as Soldier[],
    activeSpells: [] as ActiveSpell[],
  });

  const frameRef = useRef<number>(0);
  const enemiesToSpawnRef = useRef<EnemyType[]>([]);
  const waveInProgressRef = useRef<boolean>(false);
  const nextWaveCountdownRef = useRef<number>(0);
  const activeBuffsRef = useRef<{rage: number, slow: number}>({ rage: 0, slow: 0 });

  // Selection
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [selectedSpellType, setSelectedSpellType] = useState<SpellType | null>(null);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);

  // Current Map Configuration
  const getCurrentMapConfig = (): MapConfig => {
      if (gameState.gameMode === GameMode.ENDLESS) return MAP_CONFIGS[3]; // Void map
      if (gameState.currentLevelId >= 10) return MAP_CONFIGS[2];
      if (gameState.currentLevelId >= 5) return MAP_CONFIGS[1];
      return MAP_CONFIGS[0];
  };
  
  const currentMap = getCurrentMapConfig();

  // --- Audio Init & Updates ---
  useEffect(() => {
      audioRef.current.setVolumes(settings.musicVolume, settings.sfxVolume);
  }, [settings.musicVolume, settings.sfxVolume]);

  useEffect(() => {
      const audio = audioRef.current;
      if (screen === AppScreen.GAME && !gameState.isGameOver && !gameState.isLevelComplete) {
          audio.init();
          audio.resume();
          audio.startMusic(currentMap.theme.name);
      } else {
          audio.stopMusic();
      }
  }, [screen, gameState.isGameOver, gameState.isLevelComplete, currentMap.theme.name]);

  const initAudioOnInteraction = () => {
      audioRef.current.init();
      audioRef.current.resume();
  };

  // --- Helper: Helpers for Passives ---
  const hasItem = (id: string) => gameState.inventory.includes(id);
  
  const getStartMoney = (level: number, mode: GameMode) => {
      let money = mode === GameMode.ENDLESS ? 2000 : BASE_STARTING_MONEY + (level * 100);
      if (hasItem('P_START')) money += 200;
      return money;
  };

  // --- Shop Logic ---
  const rollShopItems = useCallback((currentInventory: string[]) => {
      const pool = SHOP_ITEMS.filter(item => {
          // Don't show if it's unique and already owned
          if ((item.type === 'UNLOCK' || item.type === 'PASSIVE' || item.type === 'SPECIAL') && currentInventory.includes(item.id)) {
              return false;
          }
          return true;
      });

      const selection: string[] = [];
      for(let i = 0; i < 3; i++) {
          if (pool.length === 0) break;
          const idx = Math.floor(Math.random() * pool.length);
          selection.push(pool[idx].id);
      }
      return selection;
  }, []);

  // Ensure shop has stock on init
  useEffect(() => {
      if (gameState.shopStock.length === 0) {
          setGameState(prev => ({ ...prev, shopStock: rollShopItems(prev.inventory) }));
      }
  }, []);

  const rerollShop = () => {
      if (gameState.diamonds >= SHOP_REROLL_COST) {
          setGameState(prev => ({
              ...prev,
              diamonds: prev.diamonds - SHOP_REROLL_COST,
              shopStock: rollShopItems(prev.inventory)
          }));
          audioRef.current.playBuild();
      } else {
          audioRef.current.playError();
      }
  };

  // --- Game Logic Helpers ---

  const spawnWave = useCallback((waveNum: number) => {
    const queue: EnemyType[] = [];
    
    if (gameState.gameMode === GameMode.ENDLESS) {
        const waveFactor = waveNum;
        const count = 5 + Math.floor(waveFactor * 1.5);
        
        for (let i = 0; i < count; i++) {
             const r = Math.random();
             if (waveFactor > 20 && r > 0.9) queue.push(EnemyType.SUPER_BOSS);
             else if (waveFactor > 15 && r > 0.85) queue.push(EnemyType.BOSS);
             else if (waveFactor > 10 && r > 0.8) queue.push(EnemyType.TANK);
             else if (waveFactor > 5 && r > 0.7) queue.push(EnemyType.SCORPION);
             else if (waveFactor > 3 && r > 0.6) queue.push(EnemyType.ORC);
             else queue.push(EnemyType.GOBLIN);
        }
    } else {
        const globalWave = (gameState.currentLevelId - 1) * 10 + waveNum;
        let count = 4 + Math.floor(Math.pow(globalWave, 1.0));

        for (let i = 0; i < count; i++) {
            const rand = Math.random();
            if (globalWave >= 18 && rand > 0.8) queue.push(EnemyType.SCORPION);
            else if (globalWave >= 10 && rand > 0.7 && i % 3 === 0) queue.push(EnemyType.TANK);
            else if (globalWave >= 4 && rand > 0.5) queue.push(EnemyType.ORC);
            else if (globalWave >= 25 && i % 10 === 0) queue.push(EnemyType.BOSS);
            else queue.push(EnemyType.GOBLIN);
        }

        if (waveNum === 10) {
            queue.push(EnemyType.BOSS);
            if (gameState.currentLevelId % 5 === 0) queue.push(EnemyType.SUPER_BOSS);
        }
    }

    enemiesToSpawnRef.current = queue;
    waveInProgressRef.current = true;
    audioRef.current.playBuild();
  }, [gameState.currentLevelId, gameState.gameMode]);

  const resetLevel = (currentLevel: number, mode: GameMode) => {
    const startMoney = getStartMoney(currentLevel, mode);
    
    setGameState(prev => ({
      ...prev,
      gameMode: mode,
      money: startMoney,
      lives: STARTING_LIVES + (hasItem('C_LIFE') ? 0 : 0), // Applied via consumable not start
      wave: 1,
      mana: STARTING_MANA,
      isPlaying: true,
      isGameOver: false,
      isLevelComplete: false,
      gameSpeed: 1,
    }));

    towersRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];
    soldiersRef.current = [];
    activeSpellsRef.current = [];
    enemiesToSpawnRef.current = [];
    spellCooldownsRef.current = {};
    waveInProgressRef.current = false;
    frameRef.current = 0;
    nextWaveCountdownRef.current = 0;
    activeBuffsRef.current = { rage: 0, slow: 0 };
    setSelectedTowerId(null);
    syncRenderState();

    // Mercenary Contract: Spawn 2 soldiers at start
    if (hasItem('MERCENARY')) {
        const start = currentMap.coordinates[currentMap.coordinates.length - 1]; // Base
        for(let i=0; i<2; i++) {
            soldiersRef.current.push({
                id: `merc-${i}`,
                originTowerId: 'merc-hq',
                x: start.x + (Math.random() - 0.5),
                y: start.y + (Math.random() - 0.5),
                hp: 500, maxHp: 500,
                damage: 50, range: 3,
                engagedEnemyId: null, respawnTime: 0
            });
        }
    }
    
    if (mode === GameMode.ENDLESS) spawnWave(1);
  };

  const syncRenderState = () => {
    setRenderEntities({
      towers: [...towersRef.current],
      enemies: [...enemiesRef.current],
      projectiles: [...projectilesRef.current],
      soldiers: [...soldiersRef.current],
      activeSpells: [...activeSpellsRef.current],
    });
  };

  // --- Save / Load ---
  const saveGameLocal = () => {
      const data = { 
          gameState, settings, towers: towersRef.current, 
          enemies: enemiesRef.current, soldiers: soldiersRef.current, 
          activeSpells: activeSpellsRef.current, spellCooldowns: spellCooldownsRef.current,
          frame: frameRef.current, enemiesToSpawn: enemiesToSpawnRef.current,
          waveInProgress: waveInProgressRef.current
      };
      localStorage.setItem('towerDefenseSave_v6', JSON.stringify(data));
      alert('系统: 存档已保存。');
  };

  const loadGameLocal = () => {
      const raw = localStorage.getItem('towerDefenseSave_v6');
      if (!raw) { alert('系统: 没有找到存档。'); return; }
      const data = JSON.parse(raw);
      if (data.gameState) setGameState(data.gameState);
      if (data.settings) setSettings(data.settings);
      towersRef.current = data.towers || [];
      enemiesRef.current = data.enemies || [];
      soldiersRef.current = data.soldiers || [];
      activeSpellsRef.current = data.activeSpells || [];
      spellCooldownsRef.current = data.spellCooldowns || {};
      frameRef.current = data.frame || 0;
      enemiesToSpawnRef.current = data.enemiesToSpawn || [];
      waveInProgressRef.current = data.waveInProgress || false;
      projectilesRef.current = [];
      syncRenderState();
      setScreen(AppScreen.GAME);
  };

  // --- Game Loop ---
  
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    const interval = 1000 / FPS;

    const loop = (time: number) => {
      animationFrameId = requestAnimationFrame(loop);
      const delta = time - lastTime;

      if (screen === AppScreen.GAME && gameState.isPlaying && !gameState.isGameOver && !gameState.isLevelComplete && delta >= interval) {
        lastTime = time - (delta % interval);
        const steps = gameState.gameSpeed;
        for (let s = 0; s < steps; s++) {
            updateGame();
        }
        syncRenderState();
      }
    };

    if (gameState.isPlaying) animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState.isPlaying, gameState.isGameOver, gameState.isLevelComplete, gameState.gameSpeed, screen]);


  const updateGame = () => {
    frameRef.current++;

    // Buff Timers
    if (activeBuffsRef.current.rage > 0) activeBuffsRef.current.rage--;
    if (activeBuffsRef.current.slow > 0) activeBuffsRef.current.slow--;

    // Passive Income & Energy Siphon (ONLY DURING WAVES)
    if (waveInProgressRef.current && frameRef.current % 120 === 0) {
        setGameState(prev => ({ ...prev, money: prev.money + 5 }));
    }
    
    const regen = MANA_REGEN_RATE * (hasItem('P_MANA') ? 1.5 : 1.0);
    setGameState(prev => ({ ...prev, mana: Math.min(prev.maxMana, prev.mana + regen) }));

    // Endless Mode Auto-Wave
    if (gameState.gameMode === GameMode.ENDLESS) {
        if (!waveInProgressRef.current && enemiesRef.current.length === 0) {
            if (nextWaveCountdownRef.current <= 0) {
                nextWaveCountdownRef.current = 180;
            } else {
                nextWaveCountdownRef.current--;
                if (nextWaveCountdownRef.current === 0) {
                    setGameState(prev => ({ ...prev, wave: prev.wave + 1 }));
                    spawnWave(gameState.wave + 1);
                }
            }
        }
    }

    // 1. Wave Spawning
    if (waveInProgressRef.current) {
      if (enemiesToSpawnRef.current.length > 0) {
        const spawnRate = Math.max(15, 60 - (gameState.wave * 2));
        if (frameRef.current % spawnRate === 0) { 
          const type = enemiesToSpawnRef.current.shift()!;
          const start = currentMap.coordinates[0];
          let hpMultiplier = gameState.gameMode === GameMode.ENDLESS ? Math.pow(1.15, gameState.wave) : Math.pow(1.12, (gameState.currentLevelId - 1) * 10 + gameState.wave);
          
          enemiesRef.current.push({
            id: `e-${Date.now()}-${Math.random()}`,
            type,
            x: start.x,
            y: start.y,
            pathIndex: 0, progress: 0,
            hp: ENEMY_STATS[type].hp * hpMultiplier, maxHp: ENEMY_STATS[type].hp * hpMultiplier,
            speed: ENEMY_STATS[type].speed,
            frozen: 0, poisoned: 0, rooted: 0,
            engagedWithSoldierId: null,
            reward: ENEMY_STATS[type].reward,
          });
        }
      } else if (enemiesRef.current.length === 0) {
        waveInProgressRef.current = false;
        if (gameState.gameMode === GameMode.STORY) {
            if (gameState.wave >= 10) {
                setGameState(prev => ({ ...prev, isPlaying: false, isLevelComplete: true, maxUnlockedLevel: Math.max(prev.maxUnlockedLevel, prev.currentLevelId + 1), shopStock: rollShopItems(prev.inventory) })); // Refresh shop
                audioRef.current.playLevelWin();
            } else {
                setGameState(prev => ({ ...prev, wave: prev.wave + 1 }));
                // Story mode pauses between waves for player to click "Start"
            }
        }
      }
    }

    // 2. Spells
    const survivingSpells: ActiveSpell[] = [];
    activeSpellsRef.current.forEach(spell => {
        const config = SPELL_STATS[spell.type];
        const levelScaler = 1 + ((gameState.gameMode === GameMode.ENDLESS ? gameState.wave : gameState.currentLevelId) * 0.3);
        const effectiveDamage = config.damage * levelScaler;
        const age = frameRef.current - spell.startTime;
        if (age < spell.duration) {
            survivingSpells.push(spell);
            if (spell.type === SpellType.BLIZZARD) {
                enemiesRef.current.forEach(e => { if (Math.sqrt((e.x-spell.x)**2 + (e.y-spell.y)**2) <= spell.radius) { e.frozen = 10; if (frameRef.current % 30 === 0) e.hp -= effectiveDamage; } });
            } else if (spell.type === SpellType.ROOT) {
                enemiesRef.current.forEach(e => { if (Math.sqrt((e.x-spell.x)**2 + (e.y-spell.y)**2) <= spell.radius) e.rooted = 10; });
            }
        }
    });
    activeSpellsRef.current = survivingSpells;

    // 3. Towers
    const aliveTowers: Tower[] = [];
    const isRage = activeBuffsRef.current.rage > 0;

    towersRef.current.forEach(tower => {
      if (tower.hp <= 0) {
          if (selectedTowerId === tower.id) setSelectedTowerId(null);
          return; 
      }
      aliveTowers.push(tower);
      const tConfig = TOWER_STATS[tower.type];

      // Auto-Miner Item Logic (ONLY DURING WAVES)
      if (tower.type === TowerType.MINE && hasItem('AUTO_MINER')) {
           if (waveInProgressRef.current && frameRef.current % 180 === 0) {
               setGameState(prev => ({ ...prev, money: prev.money + (10 + tower.level * 5) }));
           }
      }

      if (tower.type === TowerType.REPAIR) {
          if (frameRef.current - tower.lastShotTime >= tower.cooldown) {
              const damaged = towersRef.current.filter(t => t.id !== tower.id && t.hp < t.maxHp && Math.sqrt((t.x-tower.x)**2 + (t.y-tower.y)**2) <= tower.range);
              if (damaged.length > 0) {
                  damaged[0].hp = Math.min(damaged[0].maxHp, damaged[0].hp + 10 + (tower.level * 5));
                  tower.lastShotTime = frameRef.current;
              }
          }
          return;
      }
      if (tower.type === TowerType.SLOW) {
           enemiesRef.current.forEach(e => { if (Math.sqrt((e.x-tower.x)**2 + (e.y-tower.y)**2) <= tower.range) e.frozen = 2; });
           if (frameRef.current % 60 === 0) tower.hp -= tConfig.decayRate;
           return;
      }
      if (tower.type === TowerType.MINE) {
        // Mine only works during waves
        if (waveInProgressRef.current && frameRef.current - tower.lastShotTime >= tower.cooldown) {
          setGameState(prev => ({ ...prev, money: prev.money + (15 + (tower.level - 1) * 10) }));
          tower.lastShotTime = frameRef.current;
          tower.hp -= tConfig.decayRate;
          audioRef.current.playBuild(); 
        }
        return; 
      }
      if (tower.type === TowerType.BARRACKS) {
        const mySoldiers = soldiersRef.current.filter(s => s.originTowerId === tower.id);
        if (mySoldiers.length < (3 + tower.level - 1) && frameRef.current - tower.lastShotTime >= (isRage ? tower.cooldown / 2 : tower.cooldown)) {
            const levelScaler = 1 + ((gameState.gameMode === GameMode.ENDLESS ? gameState.wave : gameState.currentLevelId) * 0.2);
            const hp = (80 + (gameState.wave * 10)) * (1 + (tower.level * 0.2)) * levelScaler;
            soldiersRef.current.push({
                id: `s-${tower.id}-${Date.now()}`, originTowerId: tower.id, x: tower.x, y: tower.y,
                hp, maxHp: hp, damage: tower.damage * levelScaler, range: 1.5, engagedEnemyId: null, respawnTime: 0
            });
            tower.lastShotTime = frameRef.current;
            tower.hp -= (isRage ? tConfig.decayRate * 2 : tConfig.decayRate);
        }
        return;
      }
      
      const baseCooldown = tower.cooldown * (1 - (tower.level - 1) * 0.05);
      const effectiveCooldown = isRage ? baseCooldown / 2 : baseCooldown;

      if (frameRef.current - tower.lastShotTime >= effectiveCooldown) {
        let target: Enemy | undefined;
        if (tower.type === TowerType.SNIPER) {
            target = enemiesRef.current.filter(e => Math.sqrt((e.x - tower.x)**2 + (e.y - tower.y)**2) <= tower.range).sort((a, b) => b.hp - a.hp)[0];
        } else {
            target = enemiesRef.current.find(e => Math.sqrt((e.x - tower.x)**2 + (e.y - tower.y)**2) <= tower.range);
        }

        if (target) {
          audioRef.current.playShoot(tower.type);
          // Depleted Uranium Passive
          let damage = tower.damage * (hasItem('P_DMG') && (tower.type===TowerType.ARCHER || tower.type===TowerType.SNIPER || tower.type===TowerType.CANNON) ? 1.15 : 1.0);
          // Crit Module Passive
          if (hasItem('P_CRIT') && Math.random() < 0.05) damage *= 2;

          projectilesRef.current.push({
            id: `p-${Date.now()}-${Math.random()}`,
            type: tower.type, x: tower.x, y: tower.y, targetId: target.id, damage,
            speed: (tower.type === TowerType.SNIPER || tower.type === TowerType.MISSILE) ? 0.6 : 0.3,
            color: TOWER_STATS[tower.type].color.replace('bg-', 'bg-'), // simplifiction
            splashRadius: (tower.type === TowerType.CANNON || tower.type === TowerType.MISSILE || tower.type === TowerType.TESLA) ? 2.0 : 0,
            effectType: (tower.type === TowerType.ICE ? 'FREEZE' : (tower.type === TowerType.POISON ? 'POISON' : undefined))
          });
          tower.lastShotTime = frameRef.current;
          tower.hp -= (isRage ? tConfig.decayRate * 2 : tConfig.decayRate);
        }
      }
    });
    towersRef.current = aliveTowers;

    // 4 & 5. Soldiers & Projectiles
    soldiersRef.current.forEach(s => {
        if (s.engagedEnemyId) {
            const e = enemiesRef.current.find(en => en.id === s.engagedEnemyId);
            if (e) {
                if (frameRef.current % 30 === 0) { e.hp -= s.damage; s.hp -= 5; audioRef.current.playHit(); }
            } else s.engagedEnemyId = null;
        } else {
            const nearest = enemiesRef.current.find(e => Math.sqrt((e.x-s.x)**2 + (e.y-s.y)**2) < 3 && !e.engagedWithSoldierId);
            if (nearest && Math.sqrt((nearest.x-s.x)**2 + (nearest.y-s.y)**2) < 0.5) { s.engagedEnemyId = nearest.id; nearest.engagedWithSoldierId = s.id; }
            else if (nearest) { const dx=nearest.x-s.x, dy=nearest.y-s.y, d=Math.sqrt(dx*dx+dy*dy); s.x+=dx/d*0.05; s.y+=dy/d*0.05; }
        }
    });
    soldiersRef.current = soldiersRef.current.filter(s => s.hp > 0);

    const activeProjs: Projectile[] = [];
    projectilesRef.current.forEach(proj => {
      const target = enemiesRef.current.find(e => e.id === proj.targetId);
      if (!target) return;
      const dx = target.x - proj.x, dy = target.y - proj.y, dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < proj.speed) {
        audioRef.current.playHit();
        setGameState(prev => ({...prev, mana: Math.min(prev.maxMana, prev.mana + 1)}));
        if (proj.splashRadius) {
            enemiesRef.current.forEach(e => { if (Math.sqrt((e.x-target.x)**2 + (e.y-target.y)**2) <= proj.splashRadius!) e.hp -= proj.damage; });
        } else {
            target.hp -= proj.damage;
            if (proj.effectType === 'FREEZE') target.frozen = 60;
            if (proj.effectType === 'POISON') target.poisoned = 300;
        }
      } else {
        proj.x += dx/dist*proj.speed; proj.y += dy/dist*proj.speed; activeProjs.push(proj);
      }
    });
    projectilesRef.current = activeProjs;

    // 6. Enemies
    const survivedEnemies: Enemy[] = [];
    const pathCoords = currentMap.coordinates;
    const isTimeSlow = activeBuffsRef.current.slow > 0;

    enemiesRef.current.forEach(enemy => {
      if (enemy.hp <= 0) {
        // Greed Algorithm Passive
        const greedMult = hasItem('P_GREED') ? 1.1 : 1.0;
        setGameState(prev => ({ 
            ...prev, 
            money: prev.money + (enemy.reward * greedMult),
            diamonds: prev.diamonds + (gameState.gameMode === GameMode.ENDLESS ? (enemy.type === EnemyType.BOSS ? 5 : 1) : 0)
        }));
        const s = soldiersRef.current.find(s => s.engagedEnemyId === enemy.id); if(s) s.engagedEnemyId = null;
        return;
      }
      if (enemy.poisoned > 0) { if (frameRef.current % 30 === 0) enemy.hp -= 2; enemy.poisoned--; }
      
      if (!enemy.engagedWithSoldierId) {
          let moveSpeed = enemy.speed * (isTimeSlow ? 0.2 : 1.0); // Time Dilation effect
          if (enemy.rooted > 0) { moveSpeed = 0; enemy.rooted--; }
          else if (enemy.frozen > 0) { moveSpeed *= 0.5; enemy.frozen--; }
          
          enemy.progress += moveSpeed;
          if (enemy.progress >= 1) { enemy.pathIndex++; enemy.progress = 0; }
          if (enemy.pathIndex >= pathCoords.length - 1) {
              setGameState(prev => {
                  const newLives = prev.lives - 1;
                  if (newLives <= 0) {
                      audioRef.current.playGameOver();
                      return { ...prev, lives: 0, isGameOver: true, shopStock: rollShopItems(prev.inventory) }; // Refresh shop on loss
                  }
                  return { ...prev, lives: newLives };
              });
          } else {
              const curr = pathCoords[enemy.pathIndex], next = pathCoords[enemy.pathIndex + 1];
              if (curr && next) { enemy.x = curr.x + (next.x - curr.x) * enemy.progress; enemy.y = curr.y + (next.y - curr.y) * enemy.progress; survivedEnemies.push(enemy); }
          }
      } else survivedEnemies.push(enemy);
    });
    enemiesRef.current = survivedEnemies;
  };

  // --- Item Usage ---
  const useConsumable = (itemId: string) => {
      const index = gameState.inventory.indexOf(itemId);
      if (index === -1) return;
      const newInv = [...gameState.inventory];
      newInv.splice(index, 1);
      setGameState(prev => ({ ...prev, inventory: newInv }));
      audioRef.current.playBuild();
      setShowTacticalMenu(false);

      // Effects
      switch(itemId) {
          case 'C_GOLD': setGameState(p => ({...p, money: p.money + 500})); break;
          case 'C_MANA': setGameState(p => ({...p, mana: p.maxMana})); break;
          case 'C_LIFE': setGameState(p => ({...p, lives: p.lives + 5})); break;
          case 'C_REPAIR': towersRef.current.forEach(t => t.hp = t.maxHp); break;
          case 'C_NUKE': enemiesRef.current.forEach(e => e.hp -= 1000); break;
          case 'C_EMP': enemiesRef.current.forEach(e => e.rooted = 300); break;
          case 'C_RAGE': activeBuffsRef.current.rage = 600; break;
          case 'C_SLOW': activeBuffsRef.current.slow = 900; break;
      }
  };

  const buyShopItem = (itemId: string) => {
      const item = SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) return;
      if (gameState.diamonds >= item.cost) {
          setGameState(prev => ({
              ...prev, diamonds: prev.diamonds - item.cost,
              inventory: [...prev.inventory, itemId]
          }));
          audioRef.current.playBuild();
      } else audioRef.current.playError();
  };

  // --- Interaction (Build) ---
  const handleTileClick = (x: number, y: number) => {
    // ... (Spell logic same as before)
    if (selectedSpellType) {
        // ... Logic hidden for brevity, assume same as before but scaling ...
        // Copying simplified logic back:
        const config = SPELL_STATS[selectedSpellType];
        if (config.isUltimate && gameState.mana < gameState.maxMana) return;
        if (!config.isUltimate && gameState.mana < config.manaCost) return;
        
        setGameState(p => ({...p, mana: config.isUltimate ? 0 : p.mana - config.manaCost}));
        spellCooldownsRef.current[selectedSpellType] = frameRef.current + config.cooldown;
        activeSpellsRef.current.push({ id: `s-${Date.now()}`, type: selectedSpellType, x, y, startTime: frameRef.current, duration: config.duration, radius: config.radius });
        
        if (selectedSpellType === SpellType.THUNDER) {
            const target = enemiesRef.current.filter(e => Math.sqrt((e.x-x)**2+(e.y-y)**2) <= config.radius).sort((a,b) => b.hp - a.hp)[0];
            if (target) target.hp -= 2000 * (1 + gameState.wave * 0.3);
        } else if (selectedSpellType === SpellType.HEAL) {
            towersRef.current.forEach(t => t.hp = t.maxHp);
        } else if (selectedSpellType === SpellType.METEOR) {
            enemiesRef.current.forEach(e => { if (Math.sqrt((e.x-x)**2+(e.y-y)**2)<=config.radius) e.hp -= config.damage * (1+gameState.wave*0.3); });
        }
        setSelectedSpellType(null);
        return;
    }

    // Build Logic
    if (selectedTowerType) {
        if (currentMap.coordinates.some(p => p.x===x && p.y===y) || towersRef.current.some(t => t.x===x && t.y===y)) return;
        const config = TOWER_STATS[selectedTowerType];
        if (gameState.money >= config.cost) {
            setGameState(p => ({...p, money: p.money - config.cost}));
            // Apply Passives
            const rangeMult = hasItem('P_RANGE') ? 1.1 : 1.0;
            const hpMult = hasItem('P_HP') ? 1.2 : 1.0;
            
            towersRef.current.push({
                id: `t-${Date.now()}`, type: selectedTowerType, x, y,
                range: config.range * rangeMult, damage: config.damage, cooldown: config.cooldown, lastShotTime: 0, level: 1, investedCost: config.cost,
                hp: config.maxHp * hpMult, maxHp: config.maxHp * hpMult
            });
            audioRef.current.playBuild();
            syncRenderState();
            setSelectedTowerType(null);
        }
    } else {
        const t = towersRef.current.find(t => t.x===x && t.y===y);
        setSelectedTowerId(t ? t.id : null);
    }
  };

  // --- Render ---
  const renderShop = () => {
      // Aggregate inventory for display
      const counts: Record<string, number> = {};
      gameState.inventory.forEach(id => counts[id] = (counts[id] || 0) + 1);

      return (
        <div className="flex h-screen bg-black text-white overflow-hidden relative">
            <div className="absolute inset-0 cyber-grid opacity-20"></div>
            <div className="scanlines"></div>
            
            {/* Left: Slot Machine */}
            <div className="flex-1 p-8 flex flex-col z-10 border-r border-gray-800">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-4xl font-bold text-yellow-400 cyber-glitch" data-text="地下黑市">地下黑市</h2>
                    <div className="flex gap-4">
                         <div className="border border-cyan-500 px-4 py-2 bg-black/50 text-cyan-400 font-mono flex gap-2 items-center"><Gem className="w-4 h-4"/> {gameState.diamonds}</div>
                         <button onClick={() => setScreen(AppScreen.START)} className="cyber-btn text-gray-400 hover:text-white">离开</button>
                    </div>
                </div>

                {/* Slot Machine UI */}
                <div className="flex gap-6 mb-8 bg-gray-900 p-6 rounded-xl border-4 border-yellow-600 shadow-[0_0_50px_rgba(202,138,4,0.2)]">
                    {gameState.shopStock.map((itemId, idx) => {
                        const item = SHOP_ITEMS.find(i => i.id === itemId);
                        if (!item) return null;
                        const canAfford = gameState.diamonds >= item.cost;
                        return (
                            <div key={idx} className="flex-1 bg-black border-2 border-yellow-800 p-1 cyber-clip flex flex-col relative overflow-hidden group hover:border-yellow-400 transition-colors">
                                <div className="bg-gray-900 h-full p-4 flex flex-col items-center text-center">
                                    <div className="text-6xl mb-4 animate-bounce">{item.icon}</div>
                                    <div className="text-lg font-bold text-yellow-100 mb-1">{item.name}</div>
                                    <div className="text-xs text-yellow-600 font-mono uppercase mb-2">{item.type === 'UNLOCK' ? '解锁许可' : item.type === 'PASSIVE' ? '被动增益' : item.type === 'CONSUMABLE' ? '消耗品' : '特殊道具'}</div>
                                    <p className="text-xs text-gray-400 flex-1 leading-tight">{item.description}</p>
                                    <div className="text-2xl font-bold text-white mt-4 mb-2 flex items-center gap-2">{item.cost} <Gem className="w-4 h-4"/></div>
                                    <button 
                                        onClick={() => buyShopItem(itemId)}
                                        disabled={!canAfford}
                                        className={`w-full py-2 font-bold cyber-clip mt-2 text-sm ${canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-black' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                                    >
                                        购买
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="flex justify-center">
                    <button onClick={rerollShop} className="flex items-center gap-2 px-12 py-4 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-900/30 cyber-clip shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all active:scale-95">
                        <RefreshCw className="w-6 h-6 animate-spin-slow" /> 刷新货物 ({SHOP_REROLL_COST} <Gem className="w-4 h-4"/>)
                    </button>
                </div>
            </div>

            {/* Right: Inventory */}
            <div className="w-80 bg-gray-900/90 p-6 flex flex-col z-10 border-l-2 border-cyan-500/30 backdrop-blur-md">
                <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2"><Backpack className="w-5 h-5"/> 物品清单</h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {Object.entries(counts).map(([id, count]) => {
                        const item = SHOP_ITEMS.find(i => i.id === id);
                        if (!item) return null;
                        return (
                            <div key={id} className="bg-black/60 border border-gray-700 p-3 cyber-clip-sm flex gap-3 items-center">
                                <div className="text-2xl">{item.icon}</div>
                                <div>
                                    <div className="text-sm font-bold text-gray-200">{item.name}</div>
                                    <div className="text-xs text-cyan-500 font-mono">数量: {count}</div>
                                </div>
                            </div>
                        )
                    })}
                    {gameState.inventory.length === 0 && <div className="text-gray-600 text-center italic mt-10 text-sm">背包空空如也...</div>}
                </div>
            </div>
        </div>
      );
  };

  const renderSettingsModal = () => {
    if (!showSettings) return null;
    return (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-gray-900 border-2 border-cyan-500 p-6 w-96 shadow-[0_0_20px_rgba(6,182,212,0.3)] relative cyber-clip">
          <button onClick={() => setShowSettings(false)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><X /></button>
          <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center gap-2"><Settings /> 系统设置</h2>
          
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2"><Music className="w-4 h-4"/> 音乐音量</label>
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={settings.musicVolume}
                onChange={(e) => setSettings(p => ({...p, musicVolume: parseFloat(e.target.value)}))}
                className="w-full accent-cyan-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2"><Volume2 className="w-4 h-4"/> 音效音量</label>
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={settings.sfxVolume}
                onChange={(e) => setSettings(p => ({...p, sfxVolume: parseFloat(e.target.value)}))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

           <div className="mt-8 pt-4 border-t border-gray-700 flex justify-between">
              <button onClick={saveGameLocal} className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm"><Save className="w-4 h-4"/> 保存进度</button>
              <button onClick={() => { localStorage.removeItem('towerDefenseSave_v6'); window.location.reload(); }} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"><Trash2 className="w-4 h-4"/> 重置存档</button>
           </div>
        </div>
      </div>
    );
  };

  const renderStartScreen = () => (
    <div className="flex flex-col items-center justify-center space-y-8 relative z-10">
      <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 cyber-glitch mb-4 tracking-tighter" data-text="赛博防线">赛博防线</h1>
      <div className="text-cyan-500/50 font-mono text-sm tracking-widest mb-8">SYSTEM INITIALIZED // V.2.0.77</div>
      
      <div className="flex flex-col gap-4 w-64">
        <button 
          onClick={() => setScreen(AppScreen.LEVEL_SELECT)}
          className="cyber-btn bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-4 px-8 clip-path-polygon transition-all hover:translate-x-2 flex items-center justify-center gap-2"
        >
          <MapPin className="w-5 h-5"/> 出击
        </button>
        
        <button 
          onClick={loadGameLocal}
          className="cyber-btn border border-cyan-500 text-cyan-400 hover:bg-cyan-900/20 py-4 px-8 clip-path-polygon transition-all hover:translate-x-2 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5"/> 继续
        </button>

        <button 
          onClick={() => setScreen(AppScreen.SHOP)}
          className="cyber-btn border border-yellow-500 text-yellow-400 hover:bg-yellow-900/20 py-3 px-8 clip-path-polygon transition-all hover:translate-x-2 flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-5 h-5"/> 进入黑市
        </button>

        <button 
          onClick={() => setScreen(AppScreen.COMPENDIUM)}
          className="cyber-btn border border-gray-600 text-gray-400 hover:text-white hover:border-white py-3 px-8 clip-path-polygon transition-all hover:translate-x-2 flex items-center justify-center gap-2"
        >
          <Book className="w-5 h-5"/> 数据库
        </button>
      </div>

      <button onClick={() => setShowSettings(true)} className="absolute top-4 right-4 text-gray-500 hover:text-white p-2">
        <Settings />
      </button>
    </div>
  );

  const renderLevelSelect = () => (
    <div className="w-full max-w-4xl z-10 flex flex-col h-[80vh]">
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <h2 className="text-4xl font-bold text-white flex items-center gap-3"><MapPin className="w-8 h-8 text-cyan-500"/> 区域选择</h2>
        <button onClick={() => setScreen(AppScreen.START)} className="text-gray-500 hover:text-white flex items-center gap-2"><RotateCcw className="w-4 h-4"/> 返回</button>
      </div>

      <div className="grid grid-cols-2 gap-6 overflow-y-auto pr-2">
         <div 
            onClick={() => { resetLevel(1, GameMode.STORY); setScreen(AppScreen.GAME); }}
            className="col-span-2 bg-gray-900/80 border-l-4 border-cyan-500 p-6 hover:bg-gray-800 cursor-pointer transition-all group relative overflow-hidden"
         >
            <div className="absolute right-0 top-0 text-9xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none"><Briefcase /></div>
            <h3 className="text-2xl font-bold text-cyan-400 mb-2">剧情战役</h3>
            <p className="text-gray-400 mb-4">穿越3个独特的生物群落，解锁新技术，击败巨型BOSS。</p>
            <div className="flex gap-4 text-sm font-mono text-gray-500">
                <span>当前进度: LVL {gameState.maxUnlockedLevel}</span>
            </div>
         </div>

         <div 
            onClick={() => { 
                if (gameState.maxUnlockedLevel >= 10) { // Unlock condition
                    resetLevel(1, GameMode.ENDLESS); 
                    setScreen(AppScreen.GAME); 
                }
            }}
            className={`col-span-2 bg-gray-900/80 border-l-4 border-fuchsia-500 p-6 transition-all group relative overflow-hidden ${gameState.maxUnlockedLevel < 10 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800 cursor-pointer'}`}
         >
            <div className="absolute right-0 top-0 text-9xl opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none"><InfinityIcon /></div>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-bold text-fuchsia-400 mb-2">虚空无尽模式</h3>
                    <p className="text-gray-400 mb-4">在无限生成的波次中生存。获取钻石的绝佳场所。</p>
                </div>
                {gameState.maxUnlockedLevel < 10 && <div className="flex items-center gap-2 text-red-500 border border-red-500/50 px-3 py-1 text-sm"><Lock className="w-4 h-4"/> 需通关战役解锁</div>}
            </div>
         </div>
      </div>
    </div>
  );

  const renderCompendium = () => {
    return (
        <div className="w-full max-w-5xl h-[80vh] bg-gray-900/90 border border-gray-700 flex flex-col relative z-10 cyber-clip">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3"><Book className="w-6 h-6 text-yellow-500"/> 数据库</h2>
                <button onClick={() => setScreen(AppScreen.START)} className="text-gray-400 hover:text-white"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
                <div>
                    <h3 className="text-xl font-bold text-cyan-400 mb-4 border-b border-cyan-500/30 pb-2">防御塔</h3>
                    <div className="space-y-4">
                        {Object.values(TOWER_STATS).map(t => {
                             const isLocked = t.unlockLevel > gameState.maxUnlockedLevel;
                             return (
                                <div key={t.type} className={`flex gap-4 items-start bg-black/40 p-3 rounded border border-white/5 ${isLocked ? 'opacity-50' : ''}`}>
                                    <div className={`w-10 h-10 flex items-center justify-center text-xl rounded ${isLocked ? 'bg-gray-800' : t.color}`}>
                                        {isLocked ? <HelpCircle className="w-5 h-5 text-gray-500"/> : t.icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white flex items-center gap-2">
                                            {t.name} 
                                            {!isLocked && <span className="text-xs text-yellow-500 font-mono">${t.cost}</span>}
                                        </div>
                                        <p className="text-sm text-gray-400">{isLocked ? `解锁等级: ${t.unlockLevel}` : t.description}</p>
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-red-400 mb-4 border-b border-red-500/30 pb-2">威胁情报</h3>
                    <div className="space-y-4">
                         {Object.entries(ENEMY_STATS).map(([key, e]) => (
                            <div key={key} className="flex gap-4 items-center bg-black/40 p-3 rounded border border-white/5">
                                <div className={`text-2xl w-10 text-center ${e.color}`}>
                                    {key === EnemyType.GOBLIN ? '👿' : key === EnemyType.ORC ? '👺' : key === EnemyType.TANK ? '🗿' : key === EnemyType.SCORPION ? '🦂' : key === EnemyType.BOSS ? '👹' : '🐲'}
                                </div>
                                <div>
                                    <div className="font-bold text-white capitalize">
                                        {key === EnemyType.GOBLIN ? '哥布林' : key === EnemyType.ORC ? '兽人战士' : key === EnemyType.TANK ? '重装坦克' : key === EnemyType.SCORPION ? '机械蝎' : key === EnemyType.BOSS ? '领主' : '终焉巨兽'}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono">HP: {e.hp} // SPD: {e.speed}</div>
                                </div>
                            </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
      {screen === AppScreen.SHOP ? renderShop() : (screen === AppScreen.GAME ? (
        <>
          <div className="scanlines"></div>
          {/* ... HUD ... */}
          <div className="w-full max-w-5xl flex items-center justify-between bg-black/80 p-3 mb-4 border-b-2 border-t-2 border-cyan-500/30 relative z-10 backdrop-blur">
             {/* ... Resources (Money/Lives/Mana) ... */}
             <div className="flex items-center gap-6 font-mono text-white">
                 <div className="flex items-center text-yellow-400" title="资金"><Coins className="w-5 h-5 mr-2"/>{Math.floor(gameState.money)}</div>
                 <div className="flex items-center text-red-500" title="核心生命"><Heart className="w-5 h-5 mr-2"/>{gameState.lives}</div>
                 <div className="flex items-center text-cyan-400" title="黑市货币"><Gem className="w-5 h-5 mr-2"/>{gameState.diamonds}</div>
                 <div className="flex items-center text-blue-500" title="能量">
                     <div className="w-24 h-2 bg-gray-800 border border-blue-500 relative"><div className="h-full bg-blue-500 transition-all" style={{width: `${(gameState.mana/gameState.maxMana)*100}%`}}></div></div>
                 </div>
             </div>
             <div className="flex items-center gap-4">
                 {/* Wave Control for Story Mode */}
                 {!waveInProgressRef.current && !gameState.isLevelComplete && gameState.gameMode === GameMode.STORY && (
                     <button 
                        onClick={() => spawnWave(gameState.wave)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-1 font-bold text-sm animate-pulse border border-green-400"
                     >
                        <Skull className="w-4 h-4"/> 启动波次
                     </button>
                 )}
                 {waveInProgressRef.current && (
                     <div className="text-red-500 text-sm animate-pulse flex items-center gap-2 font-bold">⚠️ 敌袭警报 ⚠️</div>
                 )}

                 <div className="font-mono text-fuchsia-400">WAVE {gameState.wave}</div>
                 <button onClick={() => setScreen(AppScreen.START)} className="text-red-500 text-xs border border-red-500/50 px-2 py-1 hover:bg-red-900/20">撤离</button>
             </div>
          </div>

          <div className="relative z-10 border-4 border-gray-800 shadow-2xl">
             <GameMap
                mapConfig={currentMap}
                towers={renderEntities.towers} enemies={renderEntities.enemies} projectiles={renderEntities.projectiles} soldiers={renderEntities.soldiers} activeSpells={renderEntities.activeSpells}
                selectedSpellType={selectedSpellType} selectedTowerId={selectedTowerId} onTileClick={handleTileClick} gridWidth={GRID_W} gridHeight={GRID_H}
             />
             
             {/* Tactical Menu Overlay */}
             <div className="absolute bottom-4 left-4 z-50">
                 <button onClick={() => setShowTacticalMenu(!showTacticalMenu)} className="cyber-btn cyber-clip bg-orange-600 hover:bg-orange-500 text-black font-bold px-4 py-2 flex items-center gap-2">
                     <Briefcase className="w-4 h-4"/> 战术背包
                 </button>
                 {showTacticalMenu && (
                     <div className="absolute bottom-12 left-0 bg-black/90 border border-orange-500/50 p-4 w-64 flex flex-col gap-2 backdrop-blur-md">
                         {SHOP_ITEMS.filter(i => i.type === 'CONSUMABLE' && gameState.inventory.includes(i.id)).map(item => (
                             <button key={item.id} onClick={() => useConsumable(item.id)} className="flex items-center justify-between p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600">
                                 <span className="flex items-center gap-2">{item.icon} <span className="text-xs font-bold text-gray-300">{item.name}</span></span>
                                 <span className="text-xs text-orange-500">x{gameState.inventory.filter(id => id === item.id).length}</span>
                             </button>
                         ))}
                         {gameState.inventory.filter(id => SHOP_ITEMS.find(i => i.id === id)?.type === 'CONSUMABLE').length === 0 && (
                             <div className="text-gray-500 text-xs italic p-2">无可用战术道具</div>
                         )}
                     </div>
                 )}
             </div>
             
             {/* Active Buff Indicators */}
             <div className="absolute top-4 right-4 flex flex-col gap-2 z-40">
                 {activeBuffsRef.current.rage > 0 && <div className="bg-red-600 text-white text-xs px-2 py-1 animate-pulse border border-white">狂暴: {Math.ceil(activeBuffsRef.current.rage/60)}s</div>}
                 {activeBuffsRef.current.slow > 0 && <div className="bg-blue-600 text-white text-xs px-2 py-1 animate-pulse border border-white">时缓: {Math.ceil(activeBuffsRef.current.slow/60)}s</div>}
             </div>
          </div>

          {renderSettingsModal()}
          
          {gameState.isLevelComplete && (
               <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
                   <h2 className="text-6xl text-yellow-400 cyber-glitch" data-text="任务完成">任务完成</h2>
                   <button onClick={() => {
                        const next = gameState.currentLevelId + 1;
                        // Insurance Policy logic check
                        const keepRatio = hasItem('INSURANCE') ? 1.0 : 0.5;
                        const carry = Math.floor(gameState.money * keepRatio);
                        resetLevel(next, GameMode.STORY);
                        setGameState(p => ({...p, currentLevelId: next, maxUnlockedLevel: Math.max(p.maxUnlockedLevel, next), money: getStartMoney(next, GameMode.STORY) + carry, shopStock: rollShopItems(p.inventory) }));
                   }} className="cyber-btn px-8 py-3 bg-yellow-600 text-black mt-8 font-bold">前往下一区域</button>
               </div>
          )}
          {gameState.isGameOver && (
               <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
                   <h2 className="text-6xl text-red-600 cyber-glitch" data-text="系统离线">系统离线</h2>
                   <div className="flex gap-4 mt-8">
                       <button onClick={() => setScreen(AppScreen.START)} className="cyber-btn px-6 py-3 border border-gray-500 text-gray-400">放弃</button>
                       <button onClick={() => {
                           // Insurance Logic
                           const keepRatio = hasItem('INSURANCE') ? 1.0 : 0.0;
                           const carry = Math.floor(gameState.money * keepRatio);
                           resetLevel(gameState.currentLevelId, gameState.gameMode);
                           if (keepRatio > 0) setGameState(p => ({...p, money: p.money + carry}));
                       }} className="cyber-btn px-6 py-3 bg-white text-black font-bold">重试</button>
                   </div>
               </div>
          )}
          
          {/* Build Deck */}
          <div className="w-full max-w-5xl flex gap-2 mt-4 overflow-x-auto pb-2 relative z-10 custom-scrollbar">
              {Object.values(TOWER_STATS).filter(t => t.unlockLevel <= gameState.maxUnlockedLevel).map(tower => (
                  <button
                      key={tower.type}
                      onClick={() => { setSelectedTowerType(tower.type); setSelectedSpellType(null); setSelectedTowerId(null); }}
                      className={`flex flex-col items-center p-2 border-2 min-w-[80px] transition-all clip-path-polygon ${selectedTowerType === tower.type ? 'border-yellow-400 bg-yellow-900/30 scale-105' : 'border-gray-600 bg-gray-900/50 hover:border-gray-400'}`}
                  >
                      <div className={`w-8 h-8 rounded flex items-center justify-center text-lg mb-1 ${tower.color}`}>{tower.icon}</div>
                      <div className="text-[10px] font-bold text-gray-300">{tower.name}</div>
                      <div className="text-[10px] text-yellow-500">${tower.cost}</div>
                  </button>
              ))}
              <div className="w-[1px] bg-gray-600 mx-2"></div>
              {Object.values(SPELL_STATS).filter(s => s.unlockLevel <= gameState.maxUnlockedLevel).map(spell => {
                  const onCooldown = (spellCooldownsRef.current[spell.type] || 0) > frameRef.current;
                  const cooldownTime = onCooldown ? Math.ceil(((spellCooldownsRef.current[spell.type] || 0) - frameRef.current) / 60) : 0;
                  const canAfford = gameState.mana >= (spell.isUltimate ? gameState.maxMana : spell.manaCost);
                  
                  return (
                      <button
                          key={spell.type}
                          disabled={onCooldown || !canAfford}
                          onClick={() => { setSelectedSpellType(spell.type); setSelectedTowerType(null); setSelectedTowerId(null); }}
                          className={`flex flex-col items-center p-2 border-2 min-w-[80px] transition-all clip-path-polygon relative ${selectedSpellType === spell.type ? 'border-cyan-400 bg-cyan-900/30 scale-105' : 'border-gray-600 bg-gray-900/50'} ${(onCooldown || !canAfford) ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}`}
                      >
                          <div className="text-2xl mb-1">{spell.icon}</div>
                          <div className="text-[10px] font-bold text-gray-300 text-center leading-tight">{spell.name}</div>
                          <div className="text-[10px] text-blue-400">{spell.isUltimate ? '满能量' : spell.manaCost + ' MP'}</div>
                          {onCooldown && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-bold text-xl">{cooldownTime}</div>}
                      </button>
                  )
              })}
          </div>

          {/* Selection Details */}
          {selectedTowerId && (() => {
             const t = towersRef.current.find(tow => tow.id === selectedTowerId);
             if (!t) return null;
             const config = TOWER_STATS[t.type];
             const upgradeCost = Math.floor(config.cost * Math.pow(1.5, t.level));
             const sellValue = Math.floor(t.investedCost * 0.7);
             
             return (
                 <div className="absolute right-4 top-20 w-64 bg-gray-900/90 border border-cyan-500 p-4 flex flex-col gap-2 z-40 backdrop-blur-md cyber-clip">
                     <h3 className="font-bold text-cyan-400 text-lg flex items-center gap-2">{config.icon} {config.name} LVL {t.level}</h3>
                     <div className="text-xs text-gray-300 mb-2">{config.description}</div>
                     <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                         <div className="bg-black/50 p-1">伤害: <span className="text-white">{Math.floor(t.damage)}</span></div>
                         <div className="bg-black/50 p-1">范围: <span className="text-white">{t.range.toFixed(1)}</span></div>
                         <div className="bg-black/50 p-1">攻速: <span className="text-white">{(60/t.cooldown).toFixed(1)}/s</span></div>
                         <div className="bg-black/50 p-1">耐久: <span className={`${t.hp < t.maxHp/3 ? 'text-red-500' : 'text-green-400'}`}>{Math.floor(t.hp)}/{t.maxHp}</span></div>
                     </div>
                     <button 
                         onClick={() => {
                             if (gameState.money >= upgradeCost) {
                                 setGameState(p => ({...p, money: p.money - upgradeCost}));
                                 t.level++;
                                 t.damage *= 1.2;
                                 t.maxHp *= 1.2;
                                 t.hp = t.maxHp;
                                 t.investedCost += upgradeCost;
                                 audioRef.current.playBuild();
                                 syncRenderState();
                             } else audioRef.current.playError();
                         }}
                         className={`py-2 font-bold border ${gameState.money >= upgradeCost ? 'border-yellow-500 text-yellow-500 hover:bg-yellow-900/30' : 'border-gray-600 text-gray-600'}`}
                     >
                         升级 (${upgradeCost})
                     </button>
                     <button 
                         onClick={() => {
                             setGameState(p => ({...p, money: p.money + sellValue}));
                             towersRef.current = towersRef.current.filter(tow => tow.id !== t.id);
                             setSelectedTowerId(null);
                             audioRef.current.playSell();
                             syncRenderState();
                         }}
                         className="py-2 font-bold border border-red-500 text-red-500 hover:bg-red-900/30"
                     >
                         拆除 (+${sellValue})
                     </button>
                 </div>
             )
          })()}

        </>
      ) : (screen === AppScreen.COMPENDIUM ? renderCompendium() : (screen === AppScreen.LEVEL_SELECT ? renderLevelSelect() : renderStartScreen())))}
    </div>
  );
}
