import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameMap } from './components/GameMap';
import { 
  GRID_W, GRID_H, MAP_CONFIGS,
  TOWER_STATS, ENEMY_STATS, SPELL_STATS,
  STARTING_MONEY, STARTING_LIVES, STARTING_MANA, MAX_MANA, MANA_REGEN_RATE, FPS 
} from './constants';
import { 
  Tower, Enemy, Projectile, Soldier, ActiveSpell,
  GameState, TowerType, EnemyType, SpellType, AppScreen, MapConfig, AppSettings
} from './types';
import { 
  Play, Pause, RotateCcw, FastForward, 
  Coins, Heart, ShieldAlert, Zap, Flame, 
  ArrowUpCircle, Trash2, Save, Download, Upload, Lock, MapPin, Trophy,
  Settings, X, Volume2, Music
} from 'lucide-react';
import { AudioController } from './audio';

// --- Main Component ---

export default function App() {
  // --- State ---
  const [screen, setScreen] = useState<AppScreen>(AppScreen.START);

  const [gameState, setGameState] = useState<GameState>({
    money: STARTING_MONEY,
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
  });

  const [settings, setSettings] = useState<AppSettings>({
    musicVolume: 0.3,
    sfxVolume: 0.5
  });
  const [showSettings, setShowSettings] = useState(false);

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selection
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [selectedSpellType, setSelectedSpellType] = useState<SpellType | null>(null);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);

  // Current Map Configuration
  const getCurrentMapConfig = (): MapConfig => {
      if (gameState.currentLevelId >= 10) return MAP_CONFIGS[2];
      if (gameState.currentLevelId >= 5) return MAP_CONFIGS[1];
      return MAP_CONFIGS[0];
  };
  
  const currentMap = getCurrentMapConfig();

  // --- Audio Init & Updates ---
  useEffect(() => {
      // Init audio on mount (actually needs interaction, but we prep the ref)
      audioRef.current.setVolumes(settings.musicVolume, settings.sfxVolume);
  }, [settings.musicVolume, settings.sfxVolume]);

  useEffect(() => {
      // Handle background music based on screen and play state
      const audio = audioRef.current;
      if (screen === AppScreen.GAME && !gameState.isGameOver && !gameState.isLevelComplete) {
          audio.init(); // Ensure init
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

  // --- Game Logic Helpers ---

  const spawnWave = useCallback((waveNum: number) => {
    const queue: EnemyType[] = [];
    const globalWave = (gameState.currentLevelId - 1) * 10 + waveNum;
    let count = 5 + Math.floor(Math.pow(globalWave, 1.2));

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

    enemiesToSpawnRef.current = queue;
    waveInProgressRef.current = true;
    audioRef.current.playBuild(); // Just a notification sound for wave start
  }, [gameState.currentLevelId]);

  const resetLevel = () => {
    setGameState(prev => ({
      ...prev,
      money: STARTING_MONEY,
      lives: STARTING_LIVES,
      wave: 1,
      mana: STARTING_MANA,
      isPlaying: false,
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
    setSelectedTowerId(null);
    syncRenderState();
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

  // --- Save / Load Logic ---
  const getSaveData = () => ({
      gameState,
      settings, // Save settings too
      towers: towersRef.current,
      enemies: enemiesRef.current,
      soldiers: soldiersRef.current,
      spellCooldowns: spellCooldownsRef.current,
      frame: frameRef.current,
      activeSpells: activeSpellsRef.current,
      enemiesToSpawn: enemiesToSpawnRef.current,
      waveInProgress: waveInProgressRef.current,
      screen
  });

  const saveGameLocal = () => {
      try {
          localStorage.setItem('towerDefenseSave_v3', JSON.stringify(getSaveData()));
          audioRef.current.playBuild();
          alert('游戏进度已保存！');
      } catch (e) {
          audioRef.current.playError();
          alert('保存失败');
      }
  };

  const loadGameData = (data: any) => {
      try {
          if (data.gameState) setGameState(data.gameState);
          if (data.settings) setSettings(data.settings);
          if (data.screen) setScreen(data.screen);
          
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
          audioRef.current.playBuild();
      } catch (e) {
          console.error(e);
      }
  };

  const loadGameLocal = () => {
      const raw = localStorage.getItem('towerDefenseSave_v3');
      if (!raw) {
          audioRef.current.playError();
          alert('没有找到存档');
          return;
      }
      loadGameData(JSON.parse(raw));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              loadGameData(json);
          } catch (err) {
              audioRef.current.playError();
          }
      };
      reader.readAsText(file);
  };

  // --- The Game Loop ---
  
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

    if (gameState.isPlaying) {
        animationFrameId = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animationFrameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.isPlaying, gameState.isGameOver, gameState.isLevelComplete, gameState.gameSpeed, screen]);


  const updateGame = () => {
    frameRef.current++;

    setGameState(prev => ({
        ...prev,
        mana: Math.min(prev.maxMana, prev.mana + MANA_REGEN_RATE)
    }));

    // 1. Wave Spawning
    if (waveInProgressRef.current) {
      if (enemiesToSpawnRef.current.length > 0) {
        const spawnRate = Math.max(15, 60 - (gameState.wave * 2));
        if (frameRef.current % spawnRate === 0) { 
          const type = enemiesToSpawnRef.current.shift()!;
          const start = currentMap.coordinates[0];
          const globalWave = (gameState.currentLevelId - 1) * 10 + gameState.wave;
          let hpMultiplier = Math.pow(1.20, globalWave);
          
          enemiesRef.current.push({
            id: `e-${Date.now()}-${Math.random()}`,
            type,
            x: start.x,
            y: start.y,
            pathIndex: 0,
            progress: 0,
            hp: ENEMY_STATS[type].hp * hpMultiplier,
            maxHp: ENEMY_STATS[type].hp * hpMultiplier,
            speed: ENEMY_STATS[type].speed,
            frozen: 0,
            poisoned: 0,
            engagedWithSoldierId: null,
            reward: ENEMY_STATS[type].reward,
          });
        }
      } else if (enemiesRef.current.length === 0) {
        waveInProgressRef.current = false;
        if (gameState.wave >= 10) {
            setGameState(prev => ({
                ...prev,
                isPlaying: false,
                isLevelComplete: true,
                maxUnlockedLevel: Math.max(prev.maxUnlockedLevel, prev.currentLevelId + 1)
            }));
            audioRef.current.playLevelWin();
        } else {
            setGameState(prev => ({ ...prev, wave: prev.wave + 1, isPlaying: false }));
        }
      }
    }

    // 2. Spells (omitted for brevity, same logic)
    const survivingSpells: ActiveSpell[] = [];
    activeSpellsRef.current.forEach(spell => {
        const config = SPELL_STATS[spell.type];
        const age = frameRef.current - spell.startTime;
        if (age < spell.duration) {
            survivingSpells.push(spell);
            if (spell.type === SpellType.BLIZZARD) {
                enemiesRef.current.forEach(enemy => {
                    const dist = Math.sqrt((enemy.x - spell.x)**2 + (enemy.y - spell.y)**2);
                    if (dist <= spell.radius) {
                        enemy.frozen = 10; 
                        if (frameRef.current % 30 === 0) enemy.hp -= config.damage;
                    }
                });
            }
        }
    });
    activeSpellsRef.current = survivingSpells;

    // 3. Towers
    const aliveTowers: Tower[] = [];
    towersRef.current.forEach(tower => {
      if (tower.hp <= 0) {
          if (selectedTowerId === tower.id) setSelectedTowerId(null);
          // Tower Destroyed
          return; 
      }
      aliveTowers.push(tower);
      const tConfig = TOWER_STATS[tower.type];

      // Mine Logic
      if (tower.type === TowerType.MINE) {
        if (frameRef.current - tower.lastShotTime >= tower.cooldown) {
          const moneyGain = 15 + (tower.level - 1) * 10; 
          setGameState(prev => ({ ...prev, money: prev.money + moneyGain }));
          tower.lastShotTime = frameRef.current;
          tower.hp -= tConfig.decayRate;
          audioRef.current.playBuild(); // Coin sound
        }
        return; 
      }

      // Barracks Logic
      if (tower.type === TowerType.BARRACKS) {
        const mySoldiers = soldiersRef.current.filter(s => s.originTowerId === tower.id);
        const limit = 3 + (tower.level - 1); 
        if (mySoldiers.length < limit && frameRef.current - tower.lastShotTime >= tower.cooldown) {
            const hp = (80 + (gameState.wave * 5)) * (1 + (tower.level * 0.2));
            soldiersRef.current.push({
                id: `s-${tower.id}-${Date.now()}`,
                originTowerId: tower.id,
                x: tower.x,
                y: tower.y,
                hp,
                maxHp: hp,
                damage: tower.damage,
                range: 1.5,
                engagedEnemyId: null,
                respawnTime: 0
            });
            tower.lastShotTime = frameRef.current;
            tower.hp -= tConfig.decayRate;
        }
        return;
      }
      
      const effectiveCooldown = tower.cooldown * (1 - (tower.level - 1) * 0.05);

      if (frameRef.current - tower.lastShotTime >= effectiveCooldown) {
        let target: Enemy | undefined;
        if (tower.type === TowerType.SNIPER) {
            target = enemiesRef.current.filter(e => Math.sqrt((e.x - tower.x)**2 + (e.y - tower.y)**2) <= tower.range).sort((a, b) => b.hp - a.hp)[0];
        } else {
            target = enemiesRef.current.find(e => Math.sqrt((e.x - tower.x)**2 + (e.y - tower.y)**2) <= tower.range);
        }

        if (target) {
          audioRef.current.playShoot(tower.type);
          let effectType: 'FREEZE' | 'POISON' | undefined = undefined;
          if (tower.type === TowerType.ICE) effectType = 'FREEZE';
          if (tower.type === TowerType.POISON) effectType = 'POISON';

          projectilesRef.current.push({
            id: `p-${Date.now()}-${Math.random()}`,
            type: tower.type,
            x: tower.x,
            y: tower.y,
            targetId: target.id,
            damage: tower.damage,
            speed: (tower.type === TowerType.SNIPER || tower.type === TowerType.MISSILE) ? 0.6 : 0.3,
            color: tower.type === TowerType.CANNON ? 'bg-black' : 
                   (tower.type === TowerType.LASER ? 'bg-purple-400 shadow-purple-500' : 
                   (tower.type === TowerType.SNIPER ? 'bg-white shadow-white' : 
                   (tower.type === TowerType.FLAMETHROWER ? 'bg-orange-500' :
                   (tower.type === TowerType.ICE ? 'bg-cyan-300' :
                   (tower.type === TowerType.POISON ? 'bg-lime-500' :
                   (tower.type === TowerType.TESLA ? 'bg-indigo-300' :
                   'bg-yellow-400')))))),
            splashRadius: (tower.type === TowerType.CANNON || tower.type === TowerType.MISSILE || tower.type === TowerType.TESLA) ? 2.0 : 0,
            effectType: effectType
          });
          tower.lastShotTime = frameRef.current;
          tower.hp -= tConfig.decayRate;
        }
      }
    });
    towersRef.current = aliveTowers;

    // 4. Soldiers & 5. Projectiles (Standard logic)
    // ... (keeping existing logic, no audio triggers here usually, projectile impact handles hit sound)
    soldiersRef.current.forEach(soldier => {
      if (soldier.engagedEnemyId) {
        const enemy = enemiesRef.current.find(e => e.id === soldier.engagedEnemyId);
        if (!enemy || Math.abs(enemy.x - soldier.x) + Math.abs(enemy.y - soldier.y) > 1.5) {
            soldier.engagedEnemyId = null;
        } else {
            if (frameRef.current % 30 === 0) {
                enemy.hp -= soldier.damage;
                soldier.hp -= 5; 
                audioRef.current.playHit();
            }
            return;
        }
      }
      const nearestEnemy = enemiesRef.current.find(e => Math.sqrt((e.x - soldier.x)**2 + (e.y - soldier.y)**2) < 3 && !e.engagedWithSoldierId);
      if (nearestEnemy) {
          const dx = nearestEnemy.x - soldier.x;
          const dy = nearestEnemy.y - soldier.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 0.5) {
              soldier.engagedEnemyId = nearestEnemy.id;
              nearestEnemy.engagedWithSoldierId = soldier.id;
          } else {
              soldier.x += (dx / dist) * 0.05;
              soldier.y += (dy / dist) * 0.05;
          }
      } else {
          const tower = towersRef.current.find(t => t.id === soldier.originTowerId);
          if (tower && Math.sqrt((tower.x - soldier.x)**2 + (tower.y - soldier.y)**2) > 1) {
               const dx = tower.x - soldier.x;
               const dy = tower.y - soldier.y;
               const d = Math.sqrt(dx*dx+dy*dy);
               soldier.x += (dx/d) * 0.03;
               soldier.y += (dy/d) * 0.03;
          }
      }
    });
    soldiersRef.current = soldiersRef.current.filter(s => s.hp > 0);

    const activeProjs: Projectile[] = [];
    projectilesRef.current.forEach(proj => {
      const target = enemiesRef.current.find(e => e.id === proj.targetId);
      if (!target) return;
      const dx = target.x - proj.x;
      const dy = target.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < proj.speed) {
        audioRef.current.playHit(); // Impact Sound
        if (proj.splashRadius && proj.splashRadius > 0) {
            enemiesRef.current.forEach(e => {
                if (Math.sqrt((e.x - target.x)**2 + (e.y - target.y)**2) <= proj.splashRadius!) {
                    e.hp -= proj.damage;
                }
            });
        } else {
            target.hp -= proj.damage;
            if (proj.effectType === 'FREEZE') target.frozen = 60; 
            if (proj.effectType === 'POISON') target.poisoned = 300;
        }
      } else {
        proj.x += (dx / dist) * proj.speed;
        proj.y += (dy / dist) * proj.speed;
        activeProjs.push(proj);
      }
    });
    projectilesRef.current = activeProjs;

    // 6. Enemy Pathing
    const survivedEnemies: Enemy[] = [];
    const pathCoords = currentMap.coordinates;
    
    enemiesRef.current.forEach(enemy => {
      if (enemy.hp <= 0) {
        setGameState(prev => ({ ...prev, money: prev.money + enemy.reward }));
        const soldier = soldiersRef.current.find(s => s.engagedEnemyId === enemy.id);
        if (soldier) soldier.engagedEnemyId = null;
        return;
      }
      if (enemy.poisoned > 0) {
        if (frameRef.current % 30 === 0) enemy.hp -= 2; 
        enemy.poisoned--;
      }
      if (enemy.engagedWithSoldierId) {
          const soldier = soldiersRef.current.find(s => s.id === enemy.engagedWithSoldierId);
          if (!soldier || soldier.hp <= 0) {
              enemy.engagedWithSoldierId = null;
          } else {
              survivedEnemies.push(enemy);
              return;
          }
      }
      let moveSpeed = enemy.speed;
      if (enemy.frozen > 0) {
        moveSpeed *= 0.5; 
        enemy.frozen--;
      }
      enemy.progress += moveSpeed;
      if (enemy.progress >= 1) {
        enemy.pathIndex++;
        enemy.progress = 0;
      }
      if (enemy.pathIndex >= pathCoords.length - 1) {
        setGameState(prev => {
            const newLives = prev.lives - 1;
            if (newLives <= 0) {
                audioRef.current.playGameOver();
                return { ...prev, lives: 0, isGameOver: true };
            }
            audioRef.current.playError(); // Lost life sound
            return { ...prev, lives: newLives };
        });
      } else {
        const curr = pathCoords[enemy.pathIndex];
        const next = pathCoords[enemy.pathIndex + 1];
        if (curr && next) {
            enemy.x = curr.x + (next.x - curr.x) * enemy.progress;
            enemy.y = curr.y + (next.y - curr.y) * enemy.progress;
            survivedEnemies.push(enemy);
        }
      }
    });
    enemiesRef.current = survivedEnemies;
  };

  // --- Interaction ---

  const handleTileClick = (x: number, y: number) => {
    initAudioOnInteraction();
    if (gameState.isGameOver || gameState.isLevelComplete) return;

    // Spell Casting
    if (selectedSpellType) {
        const config = SPELL_STATS[selectedSpellType];
        if (gameState.mana >= config.manaCost) {
            setGameState(prev => ({...prev, mana: prev.mana - config.manaCost}));
            spellCooldownsRef.current[selectedSpellType] = frameRef.current + config.cooldown;
            activeSpellsRef.current.push({
                id: `spell-${Date.now()}`,
                type: selectedSpellType,
                x, y, startTime: frameRef.current, duration: config.duration, radius: config.radius
            });
            audioRef.current.playShoot(TowerType.CANNON); // Big boom sound for spell
            if (selectedSpellType === SpellType.METEOR) {
                enemiesRef.current.forEach(enemy => {
                    if (Math.sqrt((enemy.x - x)**2 + (enemy.y - y)**2) <= config.radius) {
                        enemy.hp -= config.damage;
                    }
                });
            }
            setSelectedSpellType(null);
        } else {
            audioRef.current.playError();
        }
        return;
    }

    const clickedTower = towersRef.current.find(t => t.x === x && t.y === y);
    if (clickedTower) {
        setSelectedTowerId(clickedTower.id);
        setSelectedTowerType(null);
        return;
    }

    if (selectedTowerType) {
        const pathCoords = currentMap.coordinates;
        if (pathCoords.some(p => p.x === x && p.y === y)) {
             audioRef.current.playError();
             return;
        }
        if (towersRef.current.some(t => t.x === x && t.y === y)) {
             audioRef.current.playError();
             return;
        }
        
        const config = TOWER_STATS[selectedTowerType];
        if (gameState.money >= config.cost) {
            setGameState(prev => ({ ...prev, money: prev.money - config.cost }));
            towersRef.current.push({
                id: `t-${Date.now()}`,
                type: selectedTowerType,
                x, y,
                range: config.range,
                damage: config.damage,
                cooldown: config.cooldown,
                lastShotTime: 0,
                level: 1,
                investedCost: config.cost,
                hp: config.maxHp,
                maxHp: config.maxHp
            });
            audioRef.current.playBuild();
            syncRenderState();
            setSelectedTowerType(null);
        } else {
            audioRef.current.playError();
        }
    } else {
        setSelectedTowerId(null);
    }
  };

  const upgradeSelectedTower = () => {
      const tower = towersRef.current.find(t => t.id === selectedTowerId);
      if (!tower || tower.level >= 3) return;
      const cost = Math.floor(TOWER_STATS[tower.type].cost * 0.8 * tower.level);
      if (gameState.money >= cost) {
          setGameState(prev => ({ ...prev, money: prev.money - cost }));
          tower.level++;
          tower.investedCost += cost;
          tower.damage = Math.floor(tower.damage * 1.5); 
          tower.range = tower.range * 1.1; 
          tower.maxHp = Math.floor(tower.maxHp * 1.5); 
          tower.hp = tower.maxHp; 
          audioRef.current.playBuild();
          syncRenderState();
      } else {
          audioRef.current.playError();
      }
  };

  const sellSelectedTower = () => {
      const tower = towersRef.current.find(t => t.id === selectedTowerId);
      if (!tower) return;
      const refund = Math.floor(tower.investedCost * 0.5);
      setGameState(prev => ({ ...prev, money: prev.money + refund }));
      towersRef.current = towersRef.current.filter(t => t.id !== selectedTowerId);
      soldiersRef.current = soldiersRef.current.filter(s => s.originTowerId !== selectedTowerId);
      audioRef.current.playSell();
      setSelectedTowerId(null);
      syncRenderState();
  };

  const startWave = () => {
    initAudioOnInteraction();
    if (waveInProgressRef.current) return;
    spawnWave(gameState.wave);
    setGameState(prev => ({ ...prev, isPlaying: true }));
  };

  // --- UI Components ---

  const renderSettingsModal = () => {
      if (!showSettings) return null;
      return (
          <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl shadow-2xl w-96 relative animate-in fade-in zoom-in-95 duration-200">
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                  >
                      <X />
                  </button>
                  <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                      <Settings className="w-6 h-6" /> 设置
                  </h2>
                  
                  <div className="space-y-6">
                      <div>
                          <label className="flex items-center justify-between text-gray-300 mb-2">
                              <div className="flex items-center gap-2">
                                  <Music className="w-4 h-4" /> 音乐音量
                              </div>
                              <span>{Math.round(settings.musicVolume * 100)}%</span>
                          </label>
                          <input 
                            type="range" 
                            min="0" max="1" step="0.05"
                            value={settings.musicVolume}
                            onChange={(e) => setSettings(p => ({...p, musicVolume: parseFloat(e.target.value)}))}
                            className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                      </div>
                      
                      <div>
                          <label className="flex items-center justify-between text-gray-300 mb-2">
                              <div className="flex items-center gap-2">
                                  <Volume2 className="w-4 h-4" /> 音效音量
                              </div>
                              <span>{Math.round(settings.sfxVolume * 100)}%</span>
                          </label>
                          <input 
                            type="range" 
                            min="0" max="1" step="0.05"
                            value={settings.sfxVolume}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setSettings(p => ({...p, sfxVolume: val}));
                                // Test sound on change
                                if (Math.random() > 0.8) audioRef.current.setVolumes(settings.musicVolume, val);
                            }}
                            className="w-full accent-green-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                      </div>
                  </div>

                  <div className="mt-8 text-center text-gray-500 text-xs">
                      Audio System v1.0
                  </div>
              </div>
          </div>
      );
  };

  const renderStartScreen = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 to-black text-white relative">
        {renderSettingsModal()}
        <button 
            onClick={() => { initAudioOnInteraction(); setShowSettings(true); }}
            className="absolute top-6 right-6 p-3 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
        >
            <Settings className="w-6 h-6" />
        </button>

        <div className="text-6xl font-extrabold text-yellow-500 mb-8 tracking-wider drop-shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-pulse">
            塔防纪元
        </div>
        <div className="flex gap-6">
            <button 
                onClick={() => { initAudioOnInteraction(); setScreen(AppScreen.LEVEL_SELECT); }}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-2xl transition-transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
                <Play className="fill-current" /> 开始游戏
            </button>
             <button 
                onClick={() => { initAudioOnInteraction(); loadGameLocal(); }}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-2xl transition-transform hover:scale-105 shadow-lg"
            >
                继续游戏
            </button>
        </div>
        <div className="mt-12 text-gray-500 text-sm">React Tower Defense v2.1</div>
    </div>
  );

  const renderLevelSelect = () => {
      const levels = Array.from({length: 15}, (_, i) => i + 1);
      return (
        <div className="flex flex-col items-center h-screen bg-gray-900 text-white p-8 overflow-y-auto relative">
             {renderSettingsModal()}
             <button 
                onClick={() => setShowSettings(true)}
                className="absolute top-6 right-6 p-3 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
             >
                <Settings className="w-6 h-6" />
             </button>

             <h2 className="text-4xl font-bold mb-8">选择关卡</h2>
             <div className="grid grid-cols-5 gap-6 max-w-4xl w-full">
                {levels.map(level => {
                    const isLocked = level > gameState.maxUnlockedLevel;
                    const isBoss = level % 5 === 0;
                    let mapIdx = 0;
                    if (level >= 10) mapIdx = 2;
                    else if (level >= 5) mapIdx = 1;
                    const mapName = MAP_CONFIGS[mapIdx].name;
                    const mapColor = mapIdx === 2 ? 'bg-red-900' : (mapIdx === 1 ? 'bg-amber-700' : 'bg-green-900');

                    return (
                        <button
                            key={level}
                            disabled={isLocked}
                            onClick={() => {
                                initAudioOnInteraction();
                                setGameState(prev => ({
                                    ...prev,
                                    currentLevelId: level,
                                    wave: 1,
                                    money: STARTING_MONEY, 
                                    lives: STARTING_LIVES,
                                    isGameOver: false,
                                    isLevelComplete: false,
                                    isPlaying: false
                                }));
                                resetLevel();
                                setScreen(AppScreen.GAME);
                            }}
                            className={`
                                relative h-32 rounded-xl flex flex-col items-center justify-center border-2 transition-all
                                ${isLocked 
                                    ? 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed' 
                                    : `${mapColor} border-white/20 hover:border-white hover:scale-105 cursor-pointer shadow-xl`
                                }
                            `}
                        >
                            {isLocked ? <Lock className="w-8 h-8 text-gray-500" /> : (
                                <>
                                    <span className="text-3xl font-bold">{level}</span>
                                    <span className="text-xs mt-2 opacity-80">{mapName}</span>
                                    {isBoss && <span className="absolute top-2 right-2 text-xs bg-red-600 px-1 rounded">BOSS</span>}
                                </>
                            )}
                        </button>
                    );
                })}
             </div>
             <button onClick={() => setScreen(AppScreen.START)} className="mt-12 text-gray-400 hover:text-white underline">
                返回主菜单
             </button>
        </div>
      );
  };

  if (screen === AppScreen.START) return renderStartScreen();
  if (screen === AppScreen.LEVEL_SELECT) return renderLevelSelect();

  const selectedTower = towersRef.current.find(t => t.id === selectedTowerId);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 font-sans">
      {renderSettingsModal()}
      
      {/* Header */}
      <div className="w-full max-w-5xl flex items-center justify-between bg-gray-900 p-4 rounded-xl mb-4 shadow-lg border border-gray-800">
        <div className="flex items-center space-x-6">
           <button onClick={() => setScreen(AppScreen.LEVEL_SELECT)} className="text-gray-400 hover:text-white mr-2">
             <MapPin className="w-6 h-6" />
           </button>
           <div className="flex items-center text-yellow-400" title="金币">
              <Coins className="w-6 h-6 mr-2" />
              <span className="text-2xl font-bold">{Math.floor(gameState.money)}</span>
           </div>
           <div className="flex items-center text-red-500" title="生命值">
              <Heart className="w-6 h-6 mr-2 fill-current" />
              <span className="text-2xl font-bold">{gameState.lives}</span>
           </div>
           <div className="flex items-center text-blue-400" title="法力值">
              <Flame className="w-6 h-6 mr-2" />
              <div className="flex flex-col w-24">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-100" style={{ width: `${(gameState.mana / gameState.maxMana) * 100}%` }}></div>
                  </div>
              </div>
           </div>
           <div className="flex items-center text-purple-400 border-l border-gray-700 pl-6">
              <ShieldAlert className="w-6 h-6 mr-2" />
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">关卡 {gameState.currentLevelId}</span>
                <span className="text-xl font-bold">第 {gameState.wave} / 10 波</span>
              </div>
           </div>
        </div>

        <div className="flex items-center space-x-2">
            <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400 hover:text-white" title="设置">
                <Settings className="w-5 h-5" />
            </button>
            <button onClick={saveGameLocal} className="p-2 text-gray-400 hover:text-white" title="保存">
               <Save className="w-5 h-5" />
            </button>
            <button onClick={() => { const input = fileInputRef.current; if(input) input.click(); }} className="p-2 text-gray-400 hover:text-white" title="读取">
               <Upload className="w-5 h-5" />
               <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
            </button>
            <div className="h-8 w-px bg-gray-700 mx-2"></div>
            {!gameState.isPlaying && !waveInProgressRef.current && !gameState.isGameOver && !gameState.isLevelComplete && (
                <button 
                    onClick={startWave}
                    className="flex items-center bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(34,197,94,0.5)] animate-pulse"
                >
                    <Zap className="w-5 h-5 mr-2" /> {gameState.wave === 10 ? '决战BOSS' : '下一波'}
                </button>
            )}
            {gameState.isPlaying && (
                <div className="flex bg-gray-800 rounded-lg p-1">
                    <button onClick={() => setGameState(p => ({...p, isPlaying: !p.isPlaying}))} className="p-2 hover:bg-gray-700 rounded">
                       {gameState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setGameState(p => ({...p, gameSpeed: p.gameSpeed === 1 ? 2 : 1}))} className={`p-2 hover:bg-gray-700 rounded ${gameState.gameSpeed > 1 ? 'text-blue-400' : ''}`}>
                       <FastForward className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Game Area */}
      <div className="relative">
        <GameMap
          mapConfig={currentMap}
          towers={renderEntities.towers}
          enemies={renderEntities.enemies}
          projectiles={renderEntities.projectiles}
          soldiers={renderEntities.soldiers}
          activeSpells={renderEntities.activeSpells}
          selectedSpellType={selectedSpellType}
          selectedTowerId={selectedTowerId}
          onTileClick={handleTileClick}
          gridWidth={GRID_W}
          gridHeight={GRID_H}
        />

        {gameState.isLevelComplete && (
             <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 rounded-lg backdrop-blur-sm animate-in fade-in duration-500">
                <Trophy className="w-24 h-24 text-yellow-400 mb-4 animate-bounce" />
                <h2 className="text-5xl font-extrabold text-yellow-400 mb-4 tracking-wider">关卡胜利!</h2>
                <p className="text-gray-300 mb-8 text-xl">你成功抵御了所有敌人。</p>
                <div className="flex gap-4">
                    <button onClick={() => setScreen(AppScreen.LEVEL_SELECT)} className="flex items-center bg-gray-700 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-600">返回选关</button>
                    <button onClick={() => {
                            const nextLevel = gameState.currentLevelId + 1;
                            setGameState(prev => ({
                                ...prev,
                                currentLevelId: nextLevel,
                                wave: 1,
                                money: STARTING_MONEY, 
                                lives: STARTING_LIVES,
                                isGameOver: false,
                                isLevelComplete: false,
                                isPlaying: false
                            }));
                            resetLevel();
                        }} className="flex items-center bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-500 hover:scale-105 transition-transform">下一关 <MapPin className="w-5 h-5 ml-2" /></button>
                </div>
            </div>
        )}

        {gameState.isGameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 rounded-lg backdrop-blur-sm animate-in zoom-in duration-300">
                <h2 className="text-5xl font-extrabold text-red-600 mb-4 tracking-wider">防守失败</h2>
                <p className="text-gray-300 mb-8 text-xl">止步于第 {gameState.wave} 波。</p>
                <div className="flex gap-4">
                    <button onClick={() => setScreen(AppScreen.LEVEL_SELECT)} className="flex items-center bg-gray-700 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-600">放弃</button>
                    <button onClick={resetLevel} className="flex items-center bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"><RotateCcw className="w-5 h-5 mr-2" /> 重试</button>
                </div>
            </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 w-full max-w-5xl flex gap-4 h-40">
          {selectedTower ? (
             <div className="flex-1 bg-gray-900 p-4 rounded-xl border border-yellow-500/50 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-4xl ${TOWER_STATS[selectedTower.type].color}`}>
                        {TOWER_STATS[selectedTower.type].icon}
                    </div>
                    <div>
                        <div className="text-xl font-bold text-white">{TOWER_STATS[selectedTower.type].name}</div>
                        <div className="text-gray-400 text-sm flex flex-col gap-1">
                            <span>等级 {selectedTower.level}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-red-400">{Math.floor(selectedTower.damage)} 伤害</span>
                                <span className="text-green-400 text-xs">耐久: {selectedTower.hp}/{selectedTower.maxHp}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {selectedTower.level < 3 ? (
                        <button 
                            onClick={upgradeSelectedTower}
                            disabled={gameState.money < Math.floor(TOWER_STATS[selectedTower.type].cost * 0.8 * selectedTower.level)}
                            className="flex flex-col items-center justify-center bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg transition-colors"
                        >
                            <div className="flex items-center font-bold text-white"><ArrowUpCircle className="w-5 h-5 mr-2" /> 升级</div>
                            <div className="text-yellow-300 font-mono text-sm">{Math.floor(TOWER_STATS[selectedTower.type].cost * 0.8 * selectedTower.level)} G</div>
                        </button>
                    ) : (
                        <div className="px-6 py-2 text-yellow-500 font-bold border border-yellow-500 rounded-lg text-center"><div>已达最大等级</div></div>
                    )}
                    <button onClick={sellSelectedTower} className="flex flex-col items-center justify-center bg-red-900/50 hover:bg-red-800 border border-red-700 px-4 py-2 rounded-lg transition-colors">
                         <div className="flex items-center font-bold text-red-200"><Trash2 className="w-4 h-4 mr-2" /> 出售</div>
                        <div className="text-yellow-300 font-mono text-sm">+{Math.floor(selectedTower.investedCost * 0.5)} G</div>
                    </button>
                </div>
             </div>
          ) : (
            <div className="flex-1 grid grid-cols-6 gap-2 bg-gray-900 p-3 rounded-xl border border-gray-800 overflow-y-auto">
                {Object.values(TOWER_STATS).map((tower) => {
                    const canAfford = gameState.money >= tower.cost;
                    const isSelected = selectedTowerType === tower.type;
                    return (
                        <button
                            key={tower.type}
                            onClick={() => {
                                setSelectedTowerType(tower.type);
                                setSelectedSpellType(null);
                                setSelectedTowerId(null);
                                audioRef.current.playTone(600, 'sine', 0.05, 0.05); // Click sound
                            }}
                            disabled={!canAfford && !isSelected}
                            className={`
                                relative p-1 rounded-lg border transition-all flex flex-col items-center text-center justify-center min-h-[70px]
                                ${isSelected ? 'border-blue-400 bg-gray-800 ring-2 ring-blue-500/50' : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'}
                                ${!canAfford && !isSelected ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                            `}
                            title={tower.description}
                        >
                            <div className="text-xl mb-1">{tower.icon}</div>
                            <div className="text-[10px] font-bold text-gray-300 truncate w-full px-1">{tower.name}</div>
                            <div className="text-yellow-400 font-mono text-[10px]">{tower.cost}</div>
                        </button>
                    );
                })}
            </div>
          )}
          <div className="flex-1 grid grid-cols-2 gap-2 bg-gray-900 p-3 rounded-xl border border-blue-900/30 max-w-xs">
             {Object.values(SPELL_STATS).map((spell) => {
                 const cooldownEnd = spellCooldownsRef.current[spell.type] || 0;
                 const isOnCooldown = frameRef.current < cooldownEnd;
                 const remainingCd = isOnCooldown ? Math.ceil((cooldownEnd - frameRef.current) / 60) : 0;
                 const hasMana = gameState.mana >= spell.manaCost;
                 const isSelected = selectedSpellType === spell.type;
                 return (
                    <button
                        key={spell.type}
                        onClick={() => {
                            setSelectedSpellType(spell.type);
                            setSelectedTowerType(null);
                            setSelectedTowerId(null);
                            audioRef.current.playTone(700, 'sine', 0.05, 0.05); 
                        }}
                        disabled={isOnCooldown || (!hasMana && !isSelected)}
                        className={`
                            relative p-2 rounded-lg border transition-all flex items-center text-left overflow-hidden
                            ${isSelected ? 'border-purple-400 bg-purple-900/30 ring-2 ring-purple-500/50' : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'}
                            ${(isOnCooldown || !hasMana) && !isSelected ? 'opacity-60 cursor-not-allowed' : ''}
                        `}
                    >
                        {isOnCooldown && (<div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10"><span className="font-mono font-bold text-white text-xl">{remainingCd}</span></div>)}
                        <div className="text-3xl mr-3">{spell.icon}</div>
                        <div>
                            <div className="text-xs font-bold text-gray-200">{spell.name}</div>
                            <div className="text-blue-400 font-mono text-xs font-bold">{spell.manaCost} MP</div>
                        </div>
                    </button>
                 );
             })}
          </div>
      </div>
    </div>
  );
}