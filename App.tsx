import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameMap } from './components/GameMap';
import { 
  GRID_W, GRID_H, MAP_CONFIGS, MAP_PATH_VARIATIONS,
  TOWER_STATS, ENEMY_STATS, SPELL_STATS,
  BASE_STARTING_MONEY, STARTING_LIVES, STARTING_MANA, MAX_MANA, MANA_REGEN_RATE, FPS, SHOP_ITEMS, SHOP_REROLL_COST 
} from './constants';
import { 
  Tower, Enemy, Projectile, Soldier, ActiveSpell, VisualEffect,
  GameState, TowerType, EnemyType, SpellType, AppScreen, MapConfig, AppSettings, GameMode,
  TowerConfig, SpellConfig
} from './types';
import { 
  Play, Pause, FastForward, 
  Coins, Heart, Zap, 
  Settings, X, Book, Bug, Gem, Briefcase, RefreshCw, Backpack, Skull, Download, Upload, HelpCircle, Terminal, Map as MapIcon, Shield, Save, Lock, LogOut, Package
} from 'lucide-react';
import { AudioController } from './audio';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.START);
  const [previousScreen, setPreviousScreen] = useState<AppScreen>(AppScreen.START);

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
    gameMode: GameMode.STORY,
    isDevMode: false
  });
  
  // CRITICAL FIX: Ref to track latest state inside game loop
  const gameStateRef = useRef<GameState>(gameState);
  useEffect(() => {
      gameStateRef.current = gameState;
  }, [gameState]);

  const [settings, setSettings] = useState<AppSettings>({ musicVolume: 0.3, sfxVolume: 0.5 });
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTacticalMenu, setShowTacticalMenu] = useState(false);
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [devInputCode, setDevInputCode] = useState('');
  const [selectedStoryLevel, setSelectedStoryLevel] = useState<number | null>(null);
  const [compendiumTab, setCompendiumTab] = useState<'TOWERS' | 'ENEMIES' | 'SPELLS' | 'ITEMS'>('TOWERS');

  const towersRef = useRef<Tower[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const soldiersRef = useRef<Soldier[]>([]);
  const activeSpellsRef = useRef<ActiveSpell[]>([]);
  const visualEffectsRef = useRef<VisualEffect[]>([]);
  const spellCooldownsRef = useRef<Record<string, number>>({}); 
  
  // Refs for scrolling
  const towerScrollRef = useRef<HTMLDivElement>(null);
  
  const audioRef = useRef<AudioController>(new AudioController());

  const [renderEntities, setRenderEntities] = useState({
    towers: [] as Tower[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    soldiers: [] as Soldier[],
    activeSpells: [] as ActiveSpell[],
    visualEffects: [] as VisualEffect[]
  });

  const frameRef = useRef<number>(0);
  const enemiesToSpawnRef = useRef<EnemyType[]>([]);
  const waveInProgressRef = useRef<boolean>(false);
  const nextWaveCountdownRef = useRef<number>(0);
  const activeBuffsRef = useRef<{rage: number, slow: number}>({ rage: 0, slow: 0 });

  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [selectedSpellType, setSelectedSpellType] = useState<SpellType | null>(null);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenTutorial_v2');
    if (!hasSeen) setShowTutorial(true);
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial_v2', 'true');
  };

  const handleTowerScroll = (e: React.WheelEvent) => {
    if (towerScrollRef.current) {
        towerScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // --- KEYBOARD SHORTCUTS FOR SPELLS (1-9) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== AppScreen.GAME || showSettings || showDevConsole || showTutorial) return;
      
      const key = e.key;
      const spellKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const spellTypes = Object.values(SpellType);
      
      if (spellKeys.includes(key)) {
        const index = parseInt(key) - 1;
        if (index >= 0 && index < spellTypes.length) {
          const type = spellTypes[index];
          // Check unlock level
          const config = SPELL_STATS[type];
          if (config.unlockLevel <= gameStateRef.current.maxUnlockedLevel || gameStateRef.current.isDevMode) {
             setSelectedSpellType(type);
             setSelectedTowerType(null);
             setSelectedTowerId(null);
             spawnFloatingText(GRID_W/2, GRID_H-2, `${config.name} SELECTED`, '#00ffff');
          }
        }
      }
      
      if (e.key === 'Escape') {
          setSelectedSpellType(null);
          setSelectedTowerType(null);
          setSelectedTowerId(null);
          setShowSettings(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, showSettings, showDevConsole, showTutorial]);

  const getCurrentMapConfig = (): MapConfig => {
      if (gameState.gameMode === GameMode.ENDLESS) return MAP_CONFIGS[4];
      
      let baseConfig: MapConfig;
      let themeKey: string;

      if (gameState.currentLevelId >= 9) { baseConfig = MAP_CONFIGS[3]; themeKey = 'volcano'; }
      else if (gameState.currentLevelId >= 7) { baseConfig = MAP_CONFIGS[2]; themeKey = 'glacier'; }
      else if (gameState.currentLevelId >= 4) { baseConfig = MAP_CONFIGS[1]; themeKey = 'desert'; }
      else { baseConfig = MAP_CONFIGS[0]; themeKey = 'forest'; }

      const variations = MAP_PATH_VARIATIONS[themeKey];
      const variationIndex = (gameState.currentLevelId - 1) % variations.length;
      return { ...baseConfig, coordinates: variations[variationIndex] };
  };
  
  const currentMap = getCurrentMapConfig();

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

  const hasItem = (id: string) => gameState.inventory.includes(id);
  
  const getStartMoney = (level: number, mode: GameMode) => {
      let money = mode === GameMode.ENDLESS ? 2000 : BASE_STARTING_MONEY + (level * 100);
      if (hasItem('P_START')) money += 200;
      return money;
  };

  const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
      if (visualEffectsRef.current.length > 20) visualEffectsRef.current.shift(); // Performance Limit
      visualEffectsRef.current.push({
          id: `v-${Date.now()}-${Math.random()}`,
          x, y, text, color,
          life: 60, maxLife: 60, vy: -0.02, type: 'TEXT'
      });
  };

  const spawnBeamEffect = (x: number, y: number, ex: number, ey: number, color: string) => {
      if (visualEffectsRef.current.length > 20) visualEffectsRef.current.shift();
      visualEffectsRef.current.push({
          id: `b-${Date.now()}-${Math.random()}`,
          x, y, ex, ey, color,
          life: 15, maxLife: 15, type: 'BEAM'
      });
  };

  const rollShopItems = useCallback((currentInventory: string[]) => {
      const getPoolByRarity = (rarity: string) => {
          return SHOP_ITEMS.filter(item => {
              if (item.rarity !== rarity) return false;
              if ((item.type === 'UNLOCK' || item.type === 'PASSIVE' || item.type === 'SPECIAL') && currentInventory.includes(item.id)) {
                  return false;
              }
              return true;
          });
      };
      const selection: string[] = [];
      for(let i = 0; i < 3; i++) {
          const roll = Math.random();
          let targetRarity = roll > 0.98 ? 'S' : (roll > 0.90 ? 'A' : (roll > 0.70 ? 'B' : (roll > 0.40 ? 'C' : 'D')));
          let pool = getPoolByRarity(targetRarity);
          if (pool.length === 0) pool = getPoolByRarity('D'); 
          if (pool.length === 0) pool = getPoolByRarity('C');
          if (pool.length > 0) selection.push(pool[Math.floor(Math.random() * pool.length)].id);
      }
      return selection;
  }, []);

  useEffect(() => {
      if (gameState.shopStock.length === 0) setGameState(prev => ({ ...prev, shopStock: rollShopItems(prev.inventory) }));
  }, []);

  const rerollShop = () => {
      if (gameState.diamonds >= SHOP_REROLL_COST || gameState.isDevMode) {
          if (!gameState.isDevMode) setGameState(prev => ({ ...prev, diamonds: prev.diamonds - SHOP_REROLL_COST }));
          setGameState(prev => ({ ...prev, shopStock: rollShopItems(prev.inventory) }));
          audioRef.current.playBuild();
      } else audioRef.current.playError();
  };

  const buyShopItem = (itemId: string) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if (gameState.diamonds >= item.cost || gameState.isDevMode) {
        setGameState(prev => {
            // 1. Deduct cost
            const newDiamonds = prev.isDevMode ? prev.diamonds : prev.diamonds - item.cost;
            // 2. Add to inventory
            const newInventory = [...prev.inventory, item.id];
            
            // 3. Immediately replace the bought slot with a new random item
            const stockIndex = prev.shopStock.findIndex(id => id === itemId);
            const newStock = [...prev.shopStock];
            
            if (stockIndex !== -1) {
                // Find pool for replacement
                const getPoolByRarity = (rarity: string) => {
                    return SHOP_ITEMS.filter(si => {
                        if (si.rarity !== rarity) return false;
                        // Filter unique owned items
                        if ((si.type === 'UNLOCK' || si.type === 'PASSIVE' || si.type === 'SPECIAL') && newInventory.includes(si.id)) {
                            return false;
                        }
                        // Filter duplicate visible items (don't show what's already in other 2 slots)
                        const otherSlots = newStock.filter((_, idx) => idx !== stockIndex);
                        if (otherSlots.includes(si.id)) return false;
                        
                        return true;
                    });
                };

                const roll = Math.random();
                let targetRarity = roll > 0.98 ? 'S' : (roll > 0.90 ? 'A' : (roll > 0.70 ? 'B' : (roll > 0.40 ? 'C' : 'D')));
                
                let pool = getPoolByRarity(targetRarity);
                if (pool.length === 0) pool = getPoolByRarity('D');
                if (pool.length === 0) pool = getPoolByRarity('C');
                if (pool.length === 0) pool = getPoolByRarity('B');

                // Pick new item or fallback
                if (pool.length > 0) {
                    newStock[stockIndex] = pool[Math.floor(Math.random() * pool.length)].id;
                } else {
                    // Fallback to Gold if everything is somehow bought out
                    newStock[stockIndex] = 'C_GOLD';
                }
            }

            return { 
                ...prev, 
                diamonds: newDiamonds,
                inventory: newInventory,
                shopStock: newStock
            };
        });
        audioRef.current.playBuild();
    } else {
        audioRef.current.playError();
    }
  };

  const useConsumable = (itemId: string) => {
      const index = gameState.inventory.indexOf(itemId);
      if (index === -1 && !gameState.isDevMode) return;

      const item = SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) return;

      let used = true;
      switch(itemId) {
          case 'C_NUKE':
              if (enemiesRef.current.length > 0) {
                  enemiesRef.current.forEach(e => {
                      e.hp -= 1000;
                      spawnFloatingText(e.x, e.y, '1000', '#ff0000');
                  });
              } else {
                  used = false; // Don't waste if no enemies
                  spawnFloatingText(currentMap.coordinates[0].x, currentMap.coordinates[0].y, 'NO TARGETS', '#fff');
              }
              if (used) {
                  visualEffectsRef.current.push({
                      id: `nuke-${Date.now()}`, x: GRID_W/2, y: GRID_H/2, 
                      text: 'NUKE DETECTED', color: '#ff0000', life: 60, maxLife: 60, type: 'TEXT' 
                  });
              }
              break;
          case 'C_RAGE':
              activeBuffsRef.current.rage = 600; 
              break;
          case 'C_LIFE':
              setGameState(prev => ({...prev, lives: prev.lives + 5}));
              break;
          case 'C_EMP':
              enemiesRef.current.forEach(e => e.frozen = 300);
              break;
          case 'C_REPAIR':
              towersRef.current.forEach(t => t.hp = t.maxHp);
              break;
          case 'C_SLOW':
              activeBuffsRef.current.slow = 900;
              break;
          case 'C_MANA':
              setGameState(prev => ({...prev, mana: prev.maxMana}));
              break;
          case 'C_GOLD':
               setGameState(prev => ({...prev, money: prev.money + 500}));
               break;
          default:
              used = false;
      }

      if (used) {
          if (!gameState.isDevMode) {
              const newInv = [...gameState.inventory];
              newInv.splice(index, 1);
              setGameState(prev => ({...prev, inventory: newInv}));
          }
          audioRef.current.playBuild(); 
          spawnFloatingText(currentMap.coordinates[0].x, currentMap.coordinates[0].y, `${item.name} USED`, '#fff');
      }
  };

  const spawnWave = useCallback((waveNum: number) => {
    const queue: EnemyType[] = [];
    if (gameStateRef.current.gameMode === GameMode.ENDLESS) {
        const count = 5 + Math.floor(waveNum * 1.5);
        for (let i = 0; i < count; i++) {
             const r = Math.random();
             if (waveNum > 20 && r > 0.9) queue.push(EnemyType.SUPER_BOSS);
             else if (waveNum > 15 && r > 0.85) queue.push(EnemyType.BOSS);
             else if (waveNum > 10 && r > 0.8) queue.push(EnemyType.TANK);
             else if (waveNum > 5 && r > 0.7) queue.push(EnemyType.SCORPION);
             else if (waveNum > 3 && r > 0.6) queue.push(EnemyType.ORC);
             else queue.push(EnemyType.GOBLIN);
        }
    } else {
        const globalWave = (gameStateRef.current.currentLevelId - 1) * 10 + waveNum;
        let count = 4 + Math.floor(Math.pow(globalWave, 0.9)); 
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
            if (gameStateRef.current.currentLevelId % 5 === 0) queue.push(EnemyType.SUPER_BOSS);
        }
    }
    enemiesToSpawnRef.current = queue;
    waveInProgressRef.current = true;
    audioRef.current.playBuild();
  }, []);

  const resetLevel = (currentLevel: number, mode: GameMode) => {
    const startMoney = getStartMoney(currentLevel, mode);
    setGameState(prev => ({
      ...prev, gameMode: mode, currentLevelId: currentLevel, money: startMoney, lives: STARTING_LIVES,
      wave: 1, mana: STARTING_MANA, isPlaying: true, isGameOver: false, isLevelComplete: false, gameSpeed: 1,
    }));
    towersRef.current = []; enemiesRef.current = []; projectilesRef.current = []; soldiersRef.current = [];
    activeSpellsRef.current = []; visualEffectsRef.current = []; enemiesToSpawnRef.current = [];
    spellCooldownsRef.current = {}; waveInProgressRef.current = false; frameRef.current = 0;
    nextWaveCountdownRef.current = 0; activeBuffsRef.current = { rage: 0, slow: 0 };
    setSelectedTowerId(null);
    syncRenderState();
    if (hasItem('MERCENARY') || gameStateRef.current.isDevMode) {
        const start = currentMap.coordinates[currentMap.coordinates.length - 1];
        for(let i=0; i<2; i++) soldiersRef.current.push({ id: `merc-${i}`, originTowerId: 'merc', x: start.x, y: start.y, hp: 500, maxHp: 500, damage: 50, range: 3, engagedEnemyId: null, respawnTime: 0 });
    }
    if (mode === GameMode.ENDLESS) spawnWave(1);
  };

  const syncRenderState = () => {
    setRenderEntities({
      towers: [...towersRef.current], enemies: [...enemiesRef.current], projectiles: [...projectilesRef.current],
      soldiers: [...soldiersRef.current], activeSpells: [...activeSpellsRef.current], visualEffects: [...visualEffectsRef.current],
    });
  };

  const getSaveData = () => ({ gameState, settings, towers: towersRef.current, enemies: enemiesRef.current, soldiers: soldiersRef.current, activeSpells: activeSpellsRef.current, spellCooldowns: spellCooldownsRef.current, frame: frameRef.current, enemiesToSpawn: enemiesToSpawnRef.current, waveInProgress: waveInProgressRef.current });
  const saveGameLocal = () => { localStorage.setItem('towerDefenseSave_v6', JSON.stringify(getSaveData())); alert('存档已保存。'); };
  const loadGameLocal = () => { const raw = localStorage.getItem('towerDefenseSave_v6'); if (raw) loadGameFromData(JSON.parse(raw)); };
  const loadGameFromData = (data: any) => { if (data.gameState) setGameState(data.gameState); if (data.settings) setSettings(data.settings); towersRef.current = data.towers || []; enemiesRef.current = data.enemies || []; soldiersRef.current = data.soldiers || []; activeSpellsRef.current = data.activeSpells || []; spellCooldownsRef.current = data.spellCooldowns || {}; frameRef.current = data.frame || 0; enemiesToSpawnRef.current = data.enemiesToSpawn || []; waveInProgressRef.current = data.waveInProgress || false; projectilesRef.current = []; visualEffectsRef.current = []; syncRenderState(); setScreen(AppScreen.GAME); };
  const exportSaveFile = () => { const blob = new Blob([JSON.stringify(getSaveData())], {type: 'application/json'}); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `CyberSave_${Date.now()}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); };
  const importSaveFile = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if(file) { const reader = new FileReader(); reader.onload = (ev) => loadGameFromData(JSON.parse(ev.target?.result as string)); reader.readAsText(file); } };

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    const interval = 1000 / FPS;
    const loop = (time: number) => {
      animationFrameId = requestAnimationFrame(loop);
      const delta = time - lastTime;
      if (screen === AppScreen.GAME && gameStateRef.current.isPlaying && !gameStateRef.current.isGameOver && !gameStateRef.current.isLevelComplete && delta >= interval) {
        lastTime = time - (delta % interval);
        for (let s = 0; s < gameStateRef.current.gameSpeed; s++) updateGame();
        syncRenderState();
      }
    };
    if (gameState.isPlaying) animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState.isPlaying, gameState.isGameOver, gameState.isLevelComplete, gameState.gameSpeed, screen]);

  const updateGame = () => {
    frameRef.current++;
    const state = gameStateRef.current; // Use Ref for current state in loop

    if (state.isDevMode && frameRef.current % 60 === 0) setGameState(prev => ({ ...prev, money: 999999, mana: prev.maxMana, diamonds: 999999 }));
    if (activeBuffsRef.current.rage > 0) activeBuffsRef.current.rage--;
    if (activeBuffsRef.current.slow > 0) activeBuffsRef.current.slow--;
    
    // Passive Income
    if (waveInProgressRef.current && frameRef.current % 120 === 0) {
        let income = 5;
        // Bank interest
        const banks = towersRef.current.filter(t => t.type === TowerType.BANK);
        if (banks.length > 0) {
            income += Math.floor(state.money * 0.01 * banks.length);
        }
        setGameState(prev => ({ ...prev, money: prev.money + income }));
        spawnFloatingText(currentMap.coordinates[currentMap.coordinates.length-1].x, currentMap.coordinates[currentMap.coordinates.length-1].y, `+${income}g`, '#facc15');
    }
    const regen = MANA_REGEN_RATE * (hasItem('P_MANA') ? 1.5 : 1.0);
    setGameState(prev => ({ ...prev, mana: Math.min(prev.maxMana, prev.mana + regen) }));

    if (state.gameMode === GameMode.ENDLESS && !waveInProgressRef.current && enemiesRef.current.length === 0) {
        if (nextWaveCountdownRef.current <= 0) nextWaveCountdownRef.current = 180;
        else { nextWaveCountdownRef.current--; if (nextWaveCountdownRef.current === 0) { setGameState(prev => ({ ...prev, wave: prev.wave + 1 })); spawnWave(state.wave + 1); } }
    }

    // --- SOLDIER COMBAT LOGIC ---
    const nextSoldiers: Soldier[] = [];
    soldiersRef.current.forEach(soldier => {
        if (soldier.hp <= 0) {
            // If soldier dies, release engaging enemy
            const enemy = enemiesRef.current.find(e => e.id === soldier.engagedEnemyId);
            if (enemy) enemy.engagedWithSoldierId = null;
            return; 
        }

        // Find Target if idle
        if (!soldier.engagedEnemyId) {
            const target = enemiesRef.current.find(e => 
                !e.engagedWithSoldierId && 
                ((e.x - soldier.x)**2 + (e.y - soldier.y)**2) <= 0.64 // PERFORMANCE: Squared distance <= 0.8^2
            );
            if (target) {
                soldier.engagedEnemyId = target.id;
                target.engagedWithSoldierId = soldier.id;
            }
        }

        // Fight Logic
        if (soldier.engagedEnemyId) {
            const enemy = enemiesRef.current.find(e => e.id === soldier.engagedEnemyId);
            if (!enemy || enemy.hp <= 0) {
                 soldier.engagedEnemyId = null; // Enemy dead/gone
            } else {
                 // Fight every second (60 frames)
                 if (frameRef.current % 60 === 0) {
                     // Soldier attacks enemy
                     enemy.hp -= soldier.damage;
                     spawnFloatingText(enemy.x, enemy.y, Math.floor(soldier.damage).toString(), '#ffffff');
                     
                     // Enemy attacks soldier
                     const enemyDmg = Math.max(5, state.wave * 2);
                     soldier.hp -= enemyDmg;
                     spawnFloatingText(soldier.x, soldier.y, `-${enemyDmg}`, '#ff0000');
                 }
            }
        }
        nextSoldiers.push(soldier);
    });
    soldiersRef.current = nextSoldiers;
    // ----------------------------

    if (waveInProgressRef.current) {
      if (enemiesToSpawnRef.current.length > 0) {
        if (frameRef.current % Math.max(15, 60 - (state.wave * 2)) === 0) { 
          const type = enemiesToSpawnRef.current.shift()!;
          const start = currentMap.coordinates[0];
          const multiplier = state.gameMode === GameMode.ENDLESS ? Math.pow(1.15, state.wave) : Math.pow(1.05, (state.currentLevelId - 1) * 10 + state.wave);
          enemiesRef.current.push({
            id: `e-${Date.now()}-${Math.random()}`, type, x: start.x, y: start.y, pathIndex: 0, progress: 0,
            hp: ENEMY_STATS[type].hp * multiplier, maxHp: ENEMY_STATS[type].hp * multiplier, speed: ENEMY_STATS[type].speed,
            frozen: 0, poisoned: 0, rooted: 0, confused: 0, engagedWithSoldierId: null, reward: ENEMY_STATS[type].reward,
          });
        }
      } else if (enemiesRef.current.length === 0) {
        waveInProgressRef.current = false;
        
        // --- LEVEL COMPLETE LOGIC ---
        if (state.gameMode === GameMode.STORY && state.wave >= 10) {
            setGameState(prev => ({ ...prev, isPlaying: false, isLevelComplete: true, maxUnlockedLevel: Math.max(prev.maxUnlockedLevel, prev.currentLevelId + 1), shopStock: rollShopItems(prev.inventory) })); 
            audioRef.current.playLevelWin();
        } else if (state.gameMode === GameMode.STORY) {
            setGameState(prev => ({ ...prev, wave: prev.wave + 1 }));
        }
      }
    }

    activeSpellsRef.current = activeSpellsRef.current.filter(spell => {
        const config = SPELL_STATS[spell.type];
        const age = frameRef.current - spell.startTime;
        const levelScaler = 1 + ((state.gameMode === GameMode.ENDLESS ? state.wave : state.currentLevelId) * 1.5);
        const radiusSq = spell.radius * spell.radius; // PERFORMANCE: Pre-calc squared radius

        // Immediate Effects Triggered on first frame of spell existence
        if (age === 0) {
             if (spell.type === SpellType.HEAL) {
                 towersRef.current.forEach(t => { t.hp = t.maxHp; });
                 spawnFloatingText(currentMap.coordinates[currentMap.coordinates.length-1].x, currentMap.coordinates[currentMap.coordinates.length-1].y, "REPAIRED", '#00ff00');
             }
             if (spell.type === SpellType.METEOR || spell.type === SpellType.THUNDER || spell.type === SpellType.PLASMA_RAY) {
                 let hit = false;
                 enemiesRef.current.forEach(e => {
                     // PERFORMANCE: Squared distance check
                     const distSq = (e.x - spell.x)**2 + (e.y - spell.y)**2;
                     if (distSq <= radiusSq) {
                         e.hp -= config.damage * levelScaler;
                         spawnFloatingText(e.x, e.y, Math.floor(config.damage * levelScaler).toString(), '#ff0000');
                         hit = true;
                     }
                 });
                 if (hit) audioRef.current.playShoot(TowerType.CANNON); // Explosion sound
             }
        }

        if (age < spell.duration) {
            if (spell.type === SpellType.BLIZZARD) enemiesRef.current.forEach(e => { if ((e.x-spell.x)**2 + (e.y-spell.y)**2 <= radiusSq) { e.frozen = 10; if (frameRef.current % 30 === 0) e.hp -= config.damage * levelScaler; } });
            if (spell.type === SpellType.ROOT) enemiesRef.current.forEach(e => { if ((e.x-spell.x)**2 + (e.y-spell.y)**2 <= radiusSq) e.rooted = 10; });
            if (spell.type === SpellType.ACID_RAIN) enemiesRef.current.forEach(e => { if ((e.x-spell.x)**2 + (e.y-spell.y)**2 <= radiusSq) { if(frameRef.current % 20 === 0) { e.hp -= config.damage * levelScaler; e.poisoned = 20; } } });
            if (spell.type === SpellType.TIME_STOP) enemiesRef.current.forEach(e => e.rooted = 5); // Constant stun
            return true;
        }
        return false;
    });

    const aliveTowers: Tower[] = [];
    const isRage = activeBuffsRef.current.rage > 0;
    const radars = towersRef.current.filter(t => t.type === TowerType.RADAR);
    
    // GLOBAL TECH LEVEL: Towers gain +30% damage per level of the game
    const globalTechMultiplier = 1 + (state.currentLevelId - 1) * 0.3;

    towersRef.current.forEach(tower => {
      if (tower.hp <= 0) { if (selectedTowerId === tower.id) setSelectedTowerId(null); return; }
      aliveTowers.push(tower);
      
      let rangeBuff = 1.0;
      if (tower.type !== TowerType.RADAR) radars.forEach(r => { 
          // PERFORMANCE: Squared check
          if ((r.x-tower.x)**2 + (r.y-tower.y)**2 <= r.range**2) rangeBuff += 0.2; 
      });
      const effectiveRange = tower.range * rangeBuff;
      const effectiveRangeSq = effectiveRange * effectiveRange; // PERFORMANCE: Pre-calc

      if (tower.type === TowerType.BANK || tower.type === TowerType.RADAR) return;
      if (tower.type === TowerType.MINE && (hasItem('AUTO_MINER') || state.isDevMode) && waveInProgressRef.current && frameRef.current % 180 === 0) {
           const gain = 10 + tower.level * 5; setGameState(p => ({ ...p, money: p.money + gain })); spawnFloatingText(tower.x, tower.y, `+${gain}`, '#facc15');
      }

      // --- BARRACKS LOGIC ---
      if (tower.type === TowerType.BARRACKS) {
          const mySoldiers = soldiersRef.current.filter(s => s.originTowerId === tower.id);
          // Limit to 3 soldiers, check cooldown
          if (mySoldiers.length < 3 && frameRef.current - tower.lastShotTime >= tower.cooldown) {
              // Find a path tile within range to spawn on
              // PERFORMANCE: Squared distance
              const rangeSq = tower.range * tower.range;
              const nearbyPath = currentMap.coordinates.filter(c => (c.x - tower.x)**2 + (c.y - tower.y)**2 <= rangeSq);
              if (nearbyPath.length > 0) {
                  const spawnPos = nearbyPath[Math.floor(Math.random() * nearbyPath.length)];
                  soldiersRef.current.push({
                      id: `sol-${Date.now()}-${Math.random()}`,
                      x: spawnPos.x,
                      y: spawnPos.y,
                      hp: tower.maxHp * (1 + tower.level * 0.5),
                      maxHp: tower.maxHp * (1 + tower.level * 0.5),
                      damage: tower.damage * (1 + tower.level * 0.2),
                      range: 0,
                      engagedEnemyId: null,
                      originTowerId: tower.id,
                      respawnTime: 0
                  });
                  tower.lastShotTime = frameRef.current;
                  audioRef.current.playBuild();
              }
          }
          return; // Skip shooting logic
      }
      // ----------------------
      
      // Calculate Attack Speed with Overclock Spell Buff
      let cooldown = isRage ? tower.cooldown / 2 : tower.cooldown;
      const overclockSpell = activeSpellsRef.current.find(s => s.type === SpellType.OVERCLOCK && (tower.x-s.x)**2 + (tower.y-s.y)**2 <= s.radius**2); // PERFORMANCE
      if (overclockSpell) cooldown *= 0.5;

      if (frameRef.current - tower.lastShotTime >= cooldown) {
          // PERFORMANCE: Squared distance check
          const enemiesInRange = enemiesRef.current.filter(e => (e.x - tower.x)**2 + (e.y - tower.y)**2 <= effectiveRangeSq);
          if (enemiesInRange.length > 0) {
              const target = enemiesInRange[0];
              audioRef.current.playShoot(tower.type);
              tower.lastShotTime = frameRef.current;
              
              if (tower.type === TowerType.RAILGUN) {
                  spawnBeamEffect(tower.x, tower.y, target.x, target.y, '#3b82f6');
                  enemiesInRange.forEach(e => { 
                      const dmg = tower.damage * globalTechMultiplier;
                      e.hp -= dmg; 
                      spawnFloatingText(e.x, e.y, Math.floor(dmg).toString(), '#fff'); 
                  });
              } else {
                 let dmg = tower.damage * globalTechMultiplier;
                 if (hasItem('P_CRIT') && Math.random() < 0.05) dmg *= 2;
                 projectilesRef.current.push({id: `p-${Date.now()}-${Math.random()}`, type: tower.type, x: tower.x, y: tower.y, targetId: target.id, damage: dmg, speed: 0.5, color: TOWER_STATS[tower.type].color});
              }
              tower.hp -= 0.1;
          }
      }
    });
    towersRef.current = aliveTowers;
    
    // Move Projectiles
    const nextProjs: Projectile[] = [];
    projectilesRef.current.forEach(p => {
        const t = enemiesRef.current.find(e => e.id === p.targetId);
        if (t) {
            const dx = t.x - p.x, dy = t.y - p.y;
            const distSq = dx*dx + dy*dy; // PERFORMANCE: Check squared distance first
            const speedSq = p.speed * p.speed;

            if (distSq < speedSq) { 
                t.hp -= p.damage; 
                spawnFloatingText(t.x, t.y, Math.floor(p.damage).toString(), '#fff'); 
                setGameState(prev => ({...prev, mana: Math.min(prev.maxMana, prev.mana + 1)})); 
            } else { 
                const d = Math.sqrt(distSq); // Only calc sqrt if needed for normalization
                p.x += dx/d*p.speed; 
                p.y += dy/d*p.speed; 
                nextProjs.push(p); 
            }
        }
    });
    projectilesRef.current = nextProjs;

    // Move Enemies
    const nextEnemies: Enemy[] = [];
    enemiesRef.current.forEach(e => {
        if (e.hp <= 0) {
            setGameState(p => ({...p, money: p.money + e.reward}));
            spawnFloatingText(e.x, e.y, `+${e.reward}`, '#facc15');
            if(state.gameMode===GameMode.ENDLESS) setGameState(p => ({...p, diamonds: p.diamonds+1}));
            
            // Release engaged soldier
            if (e.engagedWithSoldierId) {
                const s = soldiersRef.current.find(sol => sol.id === e.engagedWithSoldierId);
                if (s) s.engagedEnemyId = null;
            }

        } else {
            // Only move if not fighting a soldier
            if (!e.engagedWithSoldierId) {
                e.progress += e.speed;
                if (e.progress >= 1) { e.pathIndex++; e.progress = 0; }
                if (e.pathIndex >= currentMap.coordinates.length - 1) { setGameState(p => ({...p, lives: p.lives - 1})); audioRef.current.playGameOver(); }
                else {
                    const c = currentMap.coordinates[e.pathIndex], n = currentMap.coordinates[e.pathIndex+1];
                    if (c && n) { e.x = c.x + (n.x-c.x)*e.progress; e.y = c.y + (n.y-c.y)*e.progress; nextEnemies.push(e); }
                }
            } else {
                nextEnemies.push(e); // Still alive, just stopped
            }
        }
    });
    enemiesRef.current = nextEnemies;

    if (state.lives <= 0 && !state.isGameOver) setGameState(p => ({...p, isGameOver: true}));
    
    visualEffectsRef.current = visualEffectsRef.current.filter(v => { v.life--; v.y += (v.vy || 0); return v.life > 0; });
  };

  const handleTileClick = (x: number, y: number) => {
    // 1. Spell Casting Logic
    if (selectedSpellType) {
        const spellConfig = SPELL_STATS[selectedSpellType];
        
        // Check Ultimate Condition
        if (spellConfig.isUltimate && gameState.mana < gameState.maxMana && !gameState.isDevMode) {
             audioRef.current.playError();
             spawnFloatingText(x, y, "REQ. MAX MANA", '#ff0000');
             return;
        }

        // Check Cost
        if (gameState.mana >= spellConfig.manaCost || gameState.isDevMode) {
            // Deduct Mana
            if (!gameState.isDevMode) {
                setGameState(prev => ({
                    ...prev, 
                    mana: spellConfig.isUltimate ? 0 : prev.mana - spellConfig.manaCost
                }));
            }

            // Spawn Active Spell Effect
            activeSpellsRef.current.push({
                id: `s-${Date.now()}`,
                type: selectedSpellType,
                x, y,
                startTime: frameRef.current,
                duration: spellConfig.duration,
                radius: spellConfig.radius
            });

            audioRef.current.playBuild();
            setSelectedSpellType(null); // Reset Selection
        } else {
            audioRef.current.playError();
            spawnFloatingText(x, y, "NO MANA", '#ff0000');
        }
        return;
    }

    // 2. Tower Placement Logic
    if (selectedTowerType) {
        if (!towersRef.current.some(t => t.x === x && t.y === y) && !currentMap.coordinates.some(c => c.x === x && c.y === y)) {
            const cfg = TOWER_STATS[selectedTowerType];
            if (gameState.money >= cfg.cost) {
                setGameState(p => ({...p, money: p.money - cfg.cost}));
                towersRef.current.push({id: `t-${Date.now()}`, type: selectedTowerType, x, y, range: cfg.range, damage: cfg.damage, cooldown: cfg.cooldown, lastShotTime: 0, level: 1, hp: cfg.maxHp, maxHp: cfg.maxHp, investedCost: cfg.cost});
                setSelectedTowerType(null);
                audioRef.current.playBuild();
            }
        }
    } else {
        const t = towersRef.current.find(t => t.x === x && t.y === y);
        setSelectedTowerId(t ? t.id : null);
    }
  };

  const renderDevConsole = () => (
      <div className="absolute inset-0 bg-black/90 z-[200] flex items-center justify-center">
          <div className="cp-panel p-8 w-80">
              <div className="flex justify-between items-center mb-4">
                   <h2 className="text-xl font-tech text-neon-pink flex items-center gap-2"><Bug/> DEV_ACCESS</h2>
                   <button onClick={() => setShowDevConsole(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
              </div>
              <div className="bg-black border border-gray-700 p-4 mb-4 text-center text-2xl font-mono text-neon-cyan tracking-widest h-16 flex items-center justify-center">
                  {devInputCode.padEnd(4, '_')}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                  {[1,2,3,4,5,6,7,8,9].map(n => (
                      <button key={n} onClick={() => setDevInputCode(p => (p + n).slice(0,4))} className="cp-btn-outline h-12 text-xl font-bold">{n}</button>
                  ))}
                  <button onClick={() => setDevInputCode('')} className="cp-btn-danger h-12 text-sm">CLR</button>
                  <button onClick={() => setDevInputCode(p => (p + '0').slice(0,4))} className="cp-btn-outline h-12 text-xl font-bold">0</button>
                  <button onClick={() => {
                      if (devInputCode === '2077') {
                          setGameState(p => ({ ...p, isDevMode: true, money: 999999, diamonds: 999999, maxUnlockedLevel: 10 }));
                          setShowDevConsole(false);
                          audioRef.current.playBuild();
                      } else {
                          audioRef.current.playError();
                          setDevInputCode('');
                      }
                  }} className="cp-btn-primary h-12 text-sm bg-green-500 border-none text-black">ENT</button>
              </div>
              <div className="text-xs text-gray-500 text-center font-mono">SECURE CHANNEL // CODE REQUIRED</div>
          </div>
      </div>
  );

  const renderStartScreen = () => (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-cyber-grid relative z-10 p-8">
        <h1 className="text-8xl font-black text-neon-pink mb-2 tracking-tighter cp-glitch font-tech" data-text="NEON DEFENSE">NEON DEFENSE</h1>
        <div className="text-2xl text-neon-cyan tracking-[0.5em] mb-12 font-bold font-mono">by:凌宇不是淋鱼</div>
        
        <div className="flex flex-col gap-6 w-96 z-20">
            <button onClick={() => setScreen(AppScreen.LEVEL_SELECT)} className="cp-btn-primary text-xl">
                INITIATE MISSION
            </button>
            <button 
                onClick={() => { if(gameState.maxUnlockedLevel >= 10 || gameState.isDevMode) { resetLevel(1, GameMode.ENDLESS); setScreen(AppScreen.GAME); }}} 
                disabled={!(gameState.maxUnlockedLevel >= 10 || gameState.isDevMode)}
                className="cp-btn-outline text-lg uppercase tracking-widest hover:bg-neon-pink hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                ∞ ENDLESS MODE
            </button>
            <button onClick={loadGameLocal} className="cp-btn-outline text-lg uppercase tracking-widest">
                RESUME SESSION
            </button>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setScreen(AppScreen.SHOP)} className="cp-panel p-4 text-center hover:bg-gray-800 transition-colors border-l-4 border-l-neon-purple">
                    <div className="text-2xl mb-2">🛒</div>
                    <div className="text-sm font-bold text-neon-purple font-tech">NEON MARKET</div>
                </button>
                <button onClick={() => { setPreviousScreen(AppScreen.START); setScreen(AppScreen.COMPENDIUM); }} className="cp-panel p-4 text-center hover:bg-gray-800 transition-colors border-l-4 border-l-neon-cyan">
                    <div className="text-2xl mb-2">💾</div>
                    <div className="text-sm font-bold text-neon-cyan font-tech">DATABASE</div>
                </button>
            </div>
            <button onClick={() => setShowSettings(true)} className="cp-btn-outline text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                <Settings size={16}/> SYSTEM SETTINGS
            </button>
            <div className="flex justify-between mt-4">
                <button onClick={() => setShowTutorial(true)} className="text-gray-400 hover:text-white flex items-center gap-2"><HelpCircle size={16}/> HELP</button>
                <button onClick={() => setShowDevConsole(true)} className="text-gray-800 hover:text-neon-cyan"><Bug size={16}/></button>
            </div>
        </div>
    </div>
  );

  const renderLevelSelect = () => {
    const levelInfo = selectedStoryLevel ? (selectedStoryLevel <= 3 ? MAP_CONFIGS[0] : (selectedStoryLevel <= 6 ? MAP_CONFIGS[1] : (selectedStoryLevel <= 8 ? MAP_CONFIGS[2] : MAP_CONFIGS[3]))) : null;
    return (
    <div className="w-full h-screen flex bg-black relative z-10">
        <div className="w-1/2 flex flex-col border-r border-gray-800 bg-glass-bg backdrop-blur h-full">
            <div className="p-12 pb-6 flex-none flex justify-between items-center">
                <h2 className="text-4xl font-bold text-white border-l-8 border-neon-cyan pl-4 font-tech">MISSION SELECT</h2>
                <button onClick={() => setScreen(AppScreen.START)} className="text-gray-500 hover:text-white">BACK</button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 pt-0 custom-scrollbar">
                <div className="grid grid-cols-3 gap-6">
                    {Array.from({length: 10}).map((_, i) => {
                        const locked = i + 1 > gameState.maxUnlockedLevel && !gameState.isDevMode;
                        return (
                        <button 
                            key={i} 
                            onMouseEnter={() => setSelectedStoryLevel(i+1)}
                            onClick={() => { if(!locked) { resetLevel(i+1, GameMode.STORY); setScreen(AppScreen.GAME); }}}
                            className={`aspect-square cp-panel flex flex-col items-center justify-center relative group ${locked ? 'opacity-30 cursor-not-allowed' : 'hover:border-neon-pink cursor-pointer'}`}
                        >
                            <div className="text-4xl font-bold text-gray-500 group-hover:text-white transition-colors font-tech">{i+1}</div>
                            {locked && <Lock className="absolute top-2 right-2 text-red-500 w-4 h-4"/>}
                            <div className="absolute bottom-2 left-2 text-[10px] text-gray-500 font-mono">SECTOR {i+1}</div>
                        </button>
                        )
                    })}
                </div>
            </div>
        </div>
        <div className="w-1/2 p-12 flex flex-col justify-center relative overflow-hidden bg-cyber-grid">
             {levelInfo ? (
                 <div className="relative z-10 animate-pulse">
                     <div className="text-neon-pink font-mono text-sm mb-2">ENCRYPTED TRANSMISSION...</div>
                     <h1 className="text-6xl font-black text-white mb-6 uppercase font-tech text-neon-cyan">{levelInfo.name}</h1>
                     <p className="text-xl text-gray-300 mb-8 leading-relaxed font-bold border-l-4 border-neon-purple pl-6 font-mono">
                         "{levelInfo.storyIntro}"
                     </p>
                     <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 font-mono">
                         <div className="bg-black/50 p-2 border border-gray-700">BIOME: {levelInfo.theme.name}</div>
                         <div className="bg-black/50 p-2 border border-gray-700">THREAT: HIGH</div>
                     </div>
                 </div>
             ) : (
                 <div className="text-gray-600 text-center font-mono">AWAITING SELECTION...</div>
             )}
        </div>
    </div>
  )};

  const renderCompendium = () => (
      <div className="w-full h-screen bg-dark-bg flex flex-col z-50">
          <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-glass-bg backdrop-blur">
              <div className="flex gap-4 font-tech">
                  <button onClick={() => setCompendiumTab('TOWERS')} className={`px-6 py-2 font-bold ${compendiumTab==='TOWERS'?'text-neon-cyan border-b-2 border-neon-cyan':'text-gray-500'}`}>DEFENSE UNITS</button>
                  <button onClick={() => setCompendiumTab('ENEMIES')} className={`px-6 py-2 font-bold ${compendiumTab==='ENEMIES'?'text-neon-pink border-b-2 border-neon-pink':'text-gray-500'}`}>THREATS</button>
                  <button onClick={() => setCompendiumTab('SPELLS')} className={`px-6 py-2 font-bold ${compendiumTab==='SPELLS'?'text-neon-purple border-b-2 border-neon-purple':'text-gray-500'}`}>PROTOCOLS</button>
                  <button onClick={() => setCompendiumTab('ITEMS')} className={`px-6 py-2 font-bold ${compendiumTab==='ITEMS'?'text-yellow-400 border-b-2 border-yellow-400':'text-gray-500'}`}>GEAR</button>
              </div>
              <button onClick={() => { setScreen(previousScreen); if(previousScreen===AppScreen.GAME) setGameState(p=>({...p,isPlaying:true})); }}><X className="text-white"/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 bg-cyber-grid">
              <div className="grid grid-cols-3 gap-6">
                  {compendiumTab === 'TOWERS' && (Object.values(TOWER_STATS) as TowerConfig[]).map(t => (
                      <div key={t.type} className="cp-panel p-4 flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                              <div className={`text-4xl p-2 rounded bg-black/50 border border-gray-700`}>{t.icon}</div>
                              <div className="text-right"><div className="text-xl font-bold text-white font-tech">{t.name}</div><div className="text-xs text-neon-cyan font-mono">TIER {t.unlockLevel}</div></div>
                          </div>
                          <p className="text-sm text-gray-300 h-12 font-mono">{t.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-2 pt-2 border-t border-gray-700">
                              <div>DMG: <span className="text-white">{t.damage}</span></div>
                              <div>RNG: <span className="text-white">{t.range}</span></div>
                              <div>SPD: <span className="text-white">{(60/t.cooldown).toFixed(1)}/s</span></div>
                              <div>COST: <span className="text-yellow-400">${t.cost}</span></div>
                          </div>
                      </div>
                  ))}
                  {compendiumTab === 'ENEMIES' && (Object.values(ENEMY_STATS) as { hp: number; speed: number; reward: number; color: string }[]).map((e, i) => (
                       <div key={i} className="cp-panel p-4 flex flex-col gap-2 border-l-4 border-neon-pink">
                           <div className="text-4xl mb-2">{i===4?'👹':(i===5?'🐲':'👾')}</div>
                           <div className="text-xl font-bold text-neon-pink font-tech">THREAT CLASS {i+1}</div>
                           <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-300">
                               <div>HP: {e.hp}</div>
                               <div>SPD: {e.speed}</div>
                               <div>BOUNTY: ${e.reward}</div>
                           </div>
                       </div>
                  ))}
                  {compendiumTab === 'SPELLS' && (Object.values(SPELL_STATS) as SpellConfig[]).map(s => (
                       <div key={s.type} className="cp-panel p-4 flex flex-col gap-2 border-l-4 border-neon-purple">
                           <div className="text-4xl mb-2">{s.icon}</div>
                           <div className="text-xl font-bold text-neon-purple font-tech">{s.name}</div>
                           <p className="text-sm text-gray-300 font-mono">{s.description}</p>
                           <div className="text-xs text-neon-cyan mt-2 font-mono">MANA: {s.manaCost}</div>
                       </div>
                  ))}
                  {compendiumTab === 'ITEMS' && SHOP_ITEMS.map((item, i) => {
                       const color = item.rarity === 'S' ? 'border-yellow-400' : (item.rarity === 'A' ? 'border-neon-purple' : (item.rarity === 'B' ? 'border-neon-cyan' : 'border-gray-600'));
                       return (
                       <div key={i} className={`cp-panel p-4 flex flex-col gap-2 border-l-4 ${color}`}>
                           <div className="flex justify-between items-center">
                               <div className="text-4xl mb-2">{item.icon}</div>
                               <div className="text-xs font-bold text-gray-400 font-mono px-2 border border-gray-600 rounded">RANK {item.rarity}</div>
                           </div>
                           <div className="text-xl font-bold text-white font-tech">{item.name}</div>
                           <p className="text-sm text-gray-300 font-mono">{item.description}</p>
                           <div className="text-xs text-yellow-400 mt-2 font-mono">COST: {item.cost}💎</div>
                       </div>
                  )})}
              </div>
          </div>
      </div>
  );

  const renderTutorial = () => (
      <div className="absolute inset-0 bg-black/95 z-[100] flex items-center justify-center p-12">
          <div className="w-full max-w-4xl cp-panel p-8 relative bg-dark-bg">
              <div className="absolute top-0 left-0 bg-neon-cyan text-black font-bold px-4 py-1 font-tech">NEURAL LINK: TUTORIAL // STEP {tutorialStep+1}/4</div>
              <div className="mt-12 flex gap-8">
                  <div className="w-1/3 text-9xl flex items-center justify-center bg-black/50 border border-gray-700 text-neon-pink shadow-[0_0_20px_rgba(255,0,255,0.2)]">
                      {tutorialStep===0 ? '🏹' : (tutorialStep===1 ? '💎' : (tutorialStep===2 ? '🔥' : '🛒'))}
                  </div>
                  <div className="w-2/3 flex flex-col justify-center">
                      <h2 className="text-3xl font-bold text-white mb-4 font-tech">
                          {tutorialStep===0 ? 'DEPLOY DEFENSES' : (tutorialStep===1 ? 'MANAGE RESOURCES' : (tutorialStep===2 ? 'ELEMENTAL COUNTERS' : 'BLACK MARKET'))}
                      </h2>
                      <p className="text-xl text-gray-300 leading-relaxed mb-8 font-mono">
                          {tutorialStep===0 && "Click on towers at the bottom to select them, then click on the grid to build. Towers cost Gold. Build a maze to slow down enemies."}
                          {tutorialStep===1 && "Killing enemies grants Gold. Diamonds are rare currency found in Endless Mode or from Bosses. Mana regenerates slowly - hit enemies to recharge it faster."}
                          {tutorialStep===2 && "Enemies have weaknesses. Ice slows them down. Fire deals fast damage. Snipers take out high-HP targets. Use Spells (Right side) when overwhelmed."}
                          {tutorialStep===3 && "Visit the Black Market to spend Diamonds on powerful permanent upgrades and one-time consumables like Nukes. Items are saved in your Inventory."}
                      </p>
                      <div className="flex justify-end gap-4">
                          {tutorialStep < 3 ? (
                              <button onClick={() => setTutorialStep(p => p+1)} className="cp-btn-primary">NEXT {">>"}</button>
                          ) : (
                              <button onClick={closeTutorial} className="cp-btn-primary" style={{borderColor: 'var(--neon-cyan)'}}>JACK OUT (CLOSE)</button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center font-sans overflow-hidden">
        {showTutorial && renderTutorial()}
        {showDevConsole && renderDevConsole()}

        {screen === AppScreen.START && renderStartScreen()}
        {screen === AppScreen.LEVEL_SELECT && renderLevelSelect()}
        {screen === AppScreen.COMPENDIUM && renderCompendium()}
        
        {screen === AppScreen.SHOP && (
            <div className="w-full h-screen bg-black flex">
                <div className="flex-1 p-12 flex flex-col border-r border-gray-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-cyber-grid opacity-30"></div>
                    <div className="flex justify-between items-center mb-12 z-10">
                         <h2 className="text-5xl font-black text-neon-purple italic font-tech">BLACK MARKET</h2>
                         <button onClick={() => setScreen(AppScreen.START)} className="text-gray-500 hover:text-white">EXIT</button>
                    </div>
                    <div className="flex gap-4 mb-8 z-10">
                        {gameState.shopStock.map((id, i) => {
                            const item = SHOP_ITEMS.find(it => it.id === id); if(!item) return null;
                            const color = item.rarity === 'S' ? 'border-yellow-400 shadow-yellow-400/20' : (item.rarity === 'A' ? 'border-neon-purple shadow-purple-500/20' : 'border-gray-600');
                            return (
                                <div key={i} className={`flex-1 cp-panel p-6 flex flex-col items-center text-center border-t-4 ${color} hover:bg-white/5 transition-colors shadow-lg`}>
                                    <div className="text-6xl mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{item.icon}</div>
                                    <div className="font-bold text-white text-xl mb-2 font-tech">{item.name}</div>
                                    <div className="text-xs text-gray-400 mb-4 h-12 font-mono">{item.description}</div>
                                    <button onClick={() => buyShopItem(id)} className="mt-auto cp-btn-primary w-full text-sm">BUY {item.cost}💎</button>
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex justify-center z-10">
                        <button onClick={rerollShop} className="cp-btn-outline flex items-center gap-2"><RefreshCw/> REROLL STOCK ({SHOP_REROLL_COST}💎)</button>
                    </div>
                </div>
                <div className="w-96 bg-glass-bg border-l border-gray-700 p-6 flex flex-col backdrop-blur">
                    <div className="flex items-center gap-2 text-2xl font-bold text-white mb-6 font-tech"><Backpack/> INVENTORY</div>
                    <div className="flex items-center gap-2 text-neon-cyan font-mono mb-6 p-2 border border-neon-cyan bg-cyan-900/20">
                        <Gem size={16}/> BALANCE: {gameState.diamonds}
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                         {gameState.inventory.map((id, i) => {
                             const item = SHOP_ITEMS.find(it => it.id === id);
                             return item ? <div key={i} className="flex items-center gap-4 p-2 border border-gray-700 bg-black/50"><span className="text-xl">{item.icon}</span><span className="text-sm text-gray-300 font-mono">{item.name}</span></div> : null;
                         })}
                    </div>
                </div>
            </div>
        )}

        {screen === AppScreen.GAME && (
            <div className="w-full h-screen flex flex-col relative bg-black">
                <div className="h-16 bg-glass-bg border-b border-gray-800 flex items-center justify-between px-6 z-20 backdrop-blur">
                     <div className="flex gap-8 font-mono text-xl">
                         <div className="flex items-center gap-2 text-yellow-400"><Coins size={20}/> {Math.floor(gameState.money)}</div>
                         <div className="flex items-center gap-2 text-red-500"><Heart size={20}/> {gameState.lives}</div>
                         <div className="flex items-center gap-2 text-blue-400 w-48 relative">
                             <div className="absolute inset-0 bg-blue-900/30 skew-x-12 border border-blue-500/30"></div>
                             <div className="h-2 bg-neon-cyan skew-x-12 shadow-[0_0_10px_cyan]" style={{width: `${(gameState.mana/gameState.maxMana)*100}%`}}></div>
                             <span className="absolute right-0 top-4 text-xs">MANA</span>
                         </div>
                     </div>
                     <div className="flex gap-4 items-center">
                         {gameState.gameMode === GameMode.STORY && !waveInProgressRef.current && !gameState.isLevelComplete && (
                             <button onClick={() => spawnWave(gameState.wave)} className="cp-btn-danger animate-pulse border-red-500 text-red-500 hover:bg-red-500 hover:text-black">INITIATE WAVE</button>
                         )}
                         <div className="font-mono text-2xl font-bold text-white px-4 border-l border-r border-gray-700">WAVE {gameState.wave}</div>
                         <button 
                             onClick={() => setGameState(p => ({...p, gameSpeed: p.gameSpeed === 1 ? 2 : (p.gameSpeed === 2 ? 4 : 1)}))} 
                             className="cp-btn-outline h-10 w-16 flex items-center justify-center font-bold font-mono"
                         >
                             {gameState.gameSpeed}x
                         </button>
                         <button onClick={() => setShowSettings(true)} className="p-2 hover:text-neon-cyan transition-colors"><Settings/></button>
                         <button onClick={() => { setPreviousScreen(AppScreen.GAME); setCompendiumTab('TOWERS'); setScreen(AppScreen.COMPENDIUM); setGameState(p=>({...p,isPlaying:false})); }} className="p-2 hover:text-neon-pink transition-colors"><Book/></button>
                     </div>
                </div>
                
                <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-cyber-grid">
                    <GameMap 
                        mapConfig={currentMap} towers={renderEntities.towers} enemies={renderEntities.enemies} projectiles={renderEntities.projectiles} soldiers={renderEntities.soldiers} activeSpells={renderEntities.activeSpells} visualEffects={renderEntities.visualEffects}
                        selectedSpellType={selectedSpellType} selectedTowerId={selectedTowerId} onTileClick={handleTileClick} gridWidth={GRID_W} gridHeight={GRID_H} isBuilding={!!selectedTowerType}
                    />
                    
                    {/* TACTICAL HOTBAR (SPELLS) */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1 bg-black/80 p-2 rounded-t-lg border-t border-x border-neon-cyan z-30">
                        {(Object.values(SPELL_STATS) as SpellConfig[]).map((spell, i) => {
                             const locked = spell.unlockLevel > gameState.maxUnlockedLevel && !gameState.isDevMode;
                             const canAfford = gameState.mana >= spell.manaCost || gameState.isDevMode;
                             return (
                                 <button 
                                    key={spell.type}
                                    onClick={() => {
                                        if (!locked) {
                                            setSelectedSpellType(spell.type);
                                            setSelectedTowerType(null);
                                            setSelectedTowerId(null);
                                        }
                                    }}
                                    className={`
                                        w-12 h-14 border border-gray-700 relative flex flex-col items-center justify-center
                                        ${selectedSpellType === spell.type ? 'bg-neon-pink/20 border-neon-pink' : 'bg-black/50 hover:bg-gray-800'}
                                        ${locked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                 >
                                    <div className="absolute top-0 left-1 text-[10px] text-neon-cyan font-mono">{i+1}</div>
                                    <div className="text-xl">{locked ? <Lock size={14}/> : spell.icon}</div>
                                    { !locked && <div className={`text-[10px] font-bold ${canAfford ? 'text-neon-cyan' : 'text-red-500'}`}>{spell.manaCost}</div> }
                                 </button>
                             )
                        })}
                    </div>

                    <div className="absolute bottom-32 left-8 flex flex-col gap-2">
                        <button onClick={() => setShowTacticalMenu(!showTacticalMenu)} className="cp-btn-primary bg-orange-500 text-black flex items-center gap-2" style={{ borderColor: 'orange', boxShadow: 'none' }}><Briefcase size={16}/> TACTICAL</button>
                        {showTacticalMenu && (
                             <div className="cp-panel p-2 flex flex-col gap-1 w-48 max-h-64 overflow-y-auto custom-scrollbar bg-black/90">
                                 {SHOP_ITEMS.filter(i => i.type === 'CONSUMABLE' && gameState.inventory.includes(i.id)).map(item => (
                                     <button key={item.id} onClick={() => useConsumable(item.id)} className="text-left text-xs p-2 hover:bg-white/10 text-white flex justify-between items-center font-mono border-b border-gray-800">
                                         <span>{item.name}</span>
                                         <span className="text-neon-cyan font-bold">x{gameState.inventory.filter(id => id === item.id).length}</span>
                                     </button>
                                 ))}
                                 {gameState.inventory.filter(id => SHOP_ITEMS.find(si => si.id === id)?.type === 'CONSUMABLE').length === 0 && (
                                     <div className="text-gray-500 text-xs p-2 font-mono">EMPTY. VISIT SHOP.</div>
                                 )}
                             </div>
                        )}
                    </div>
                </div>

                <div 
                    ref={towerScrollRef}
                    onWheel={handleTowerScroll}
                    className="h-28 bg-glass-bg border-t border-gray-800 flex items-center px-4 gap-2 overflow-x-auto z-20 custom-scrollbar backdrop-blur"
                >
                     {(Object.values(TOWER_STATS) as TowerConfig[]).filter(t => t.unlockLevel <= gameState.maxUnlockedLevel || gameState.isDevMode).map(t => (
                         <button 
                             key={t.type} 
                             onClick={() => { setSelectedTowerType(t.type); setSelectedSpellType(null); setSelectedTowerId(null); }}
                             className={`min-w-[90px] h-20 cp-panel flex flex-col items-center justify-center gap-1 transition-all group ${selectedTowerType===t.type ? 'border-neon-cyan bg-cyan-900/20 shadow-[0_0_10px_cyan]' : 'hover:bg-white/5'}`}
                         >
                             <div className={`text-2xl ${t.color.replace('bg-', 'text-')}`}>{t.icon}</div>
                             <div className="text-[9px] font-bold text-gray-400 font-tech">{t.name}</div>
                             <div className="text-[10px] text-neon-cyan font-mono">${t.cost}</div>
                         </button>
                     ))}
                </div>
            </div>
        )}
        
        {showSettings && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[100]">
                <div className="cp-panel p-8 w-96 relative bg-dark-bg">
                    <button onClick={() => setShowSettings(false)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><X/></button>
                    <h2 className="text-2xl font-bold text-neon-cyan mb-6 font-tech">SYSTEM SETTINGS</h2>
                    <div className="space-y-6">
                         <div>
                             <label className="text-xs text-neon-pink mb-2 block font-mono">AUDIO FREQUENCY</label>
                             <input type="range" max="1" step="0.1" value={settings.musicVolume} onChange={e => setSettings(p => ({...p, musicVolume: parseFloat(e.target.value)}))} className="w-full accent-neon-pink"/>
                         </div>
                         <div>
                             <label className="text-xs text-neon-pink mb-2 block font-mono">SFX GAIN</label>
                             <input type="range" max="1" step="0.1" value={settings.sfxVolume} onChange={e => setSettings(p => ({...p, sfxVolume: parseFloat(e.target.value)}))} className="w-full accent-neon-cyan"/>
                         </div>
                         <div className="grid grid-cols-2 gap-4 mt-8">
                             <button onClick={saveGameLocal} className="cp-btn-outline text-xs"><Save className="inline w-3 h-3 mr-1"/> SAVE LOCAL</button>
                             <button onClick={exportSaveFile} className="cp-btn-outline text-xs"><Download className="inline w-3 h-3 mr-1"/> EXPORT FILE</button>
                             <label className="cp-btn-outline text-xs cursor-pointer text-center block col-span-2">
                                 <Upload className="inline w-3 h-3 mr-1"/> IMPORT FILE
                                 <input type="file" accept=".json" onChange={importSaveFile} className="hidden"/>
                             </label>
                             <button onClick={() => { setScreen(AppScreen.START); setShowSettings(false); setGameState(p => ({...p, isPlaying: false})); }} className="col-span-2 cp-btn-danger text-center font-bold"><LogOut className="inline w-4 h-4 mr-2"/> ABORT MISSION</button>
                         </div>
                    </div>
                </div>
            </div>
        )}

        {gameState.isLevelComplete && (
            <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center">
                <div className="cp-panel p-12 text-center border-t-8 border-green-500 shadow-[0_0_50px_rgba(0,255,0,0.2)]">
                    <h2 className="text-6xl font-black text-white mb-2 font-tech text-neon-cyan">MISSION ACCOMPLISHED</h2>
                    <p className="text-green-500 font-mono mb-8">SECTOR SECURED. TRANSFERRING FUNDS...</p>
                    <div className="flex gap-4 justify-center">
                        <button onClick={() => { const next = gameState.currentLevelId + 1; resetLevel(next, GameMode.STORY); setGameState(p => ({...p, currentLevelId: next, maxUnlockedLevel: Math.max(p.maxUnlockedLevel, next), money: getStartMoney(next, GameMode.STORY) + Math.floor(gameState.money * (hasItem('INSURANCE')?1:0.5)) })); }} className="cp-btn-primary">NEXT SECTOR {">>"}</button>
                    </div>
                </div>
            </div>
        )}
        
        {selectedTowerId && (() => {
             const t = towersRef.current.find(tow => tow.id === selectedTowerId); if (!t) return null;
             const cfg = TOWER_STATS[t.type];
             return (
                 <div className="absolute right-8 top-32 w-72 cp-panel p-6 z-40 bg-glass-bg">
                     <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
                         <div className={`text-3xl ${cfg.color.replace('bg-', 'text-')}`}>{cfg.icon}</div>
                         <div><div className="font-bold text-white font-tech">{cfg.name}</div><div className="text-xs text-neon-cyan font-mono">LVL {t.level}</div></div>
                     </div>
                     <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-6 text-gray-300">
                         <div>DMG: {Math.floor(t.damage)}</div>
                         <div>RNG: {t.range.toFixed(1)}</div>
                     </div>
                     <div className="flex flex-col gap-2">
                         <button onClick={() => { 
                             const cost = Math.floor(cfg.cost * Math.pow(1.5, t.level));
                             if (t.level < 10 && (gameState.money >= cost || gameState.isDevMode)) {
                                 if(!gameState.isDevMode) setGameState(p => ({...p, money: p.money - cost}));
                                 t.level++; t.damage *= 1.2; t.hp = t.maxHp *= 1.2; t.investedCost += cost;
                                 audioRef.current.playBuild(); syncRenderState();
                             }
                         }} disabled={t.level >= 10} className="cp-btn-outline w-full text-center">UPGRADE ${Math.floor(cfg.cost * Math.pow(1.5, t.level))}</button>
                         <button onClick={() => { 
                             setGameState(p => ({...p, money: p.money + Math.floor(t.investedCost * 0.7)}));
                             towersRef.current = towersRef.current.filter(x => x.id !== t.id);
                             setSelectedTowerId(null); audioRef.current.playSell(); syncRenderState();
                         }} className="cp-btn-danger w-full text-center">DISMANTLE</button>
                     </div>
                 </div>
             )
        })()}

    </div>
  );
}
