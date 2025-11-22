import { TowerType, TowerConfig, Coordinate, EnemyType, SpellType, SpellConfig, MapConfig } from './types';

export const GRID_W = 20;
export const GRID_H = 12;
export const FPS = 60;
export const TILE_SIZE = 40;

// --- MAP DEFINITIONS ---

const PATH_FOREST: Coordinate[] = [
  { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, 
  { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 }, 
  { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 },
  { x: 7, y: 3 }, { x: 7, y: 2 }, 
  { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 10, y: 2 }, { x: 11, y: 2 },
  { x: 11, y: 3 }, { x: 11, y: 4 }, { x: 11, y: 5 }, { x: 11, y: 6 }, { x: 11, y: 7 },
  { x: 10, y: 7 }, { x: 9, y: 7 }, 
  { x: 9, y: 8 }, { x: 9, y: 9 }, 
  { x: 10, y: 9 }, { x: 11, y: 9 }, { x: 12, y: 9 }, { x: 13, y: 9 }, { x: 14, y: 9 },
  { x: 14, y: 8 }, { x: 14, y: 7 }, { x: 14, y: 6 },
  { x: 15, y: 6 }, { x: 16, y: 6 }, { x: 17, y: 6 }, { x: 18, y: 6 }, { x: 19, y: 6 }
];

const PATH_DESERT: Coordinate[] = [
  {x:0,y:0}, {x:1,y:0}, {x:2,y:0}, {x:3,y:0}, {x:4,y:0}, {x:5,y:0},
  {x:5,y:1}, {x:5,y:2}, {x:4,y:2}, {x:3,y:2}, {x:2,y:2}, {x:1,y:2},
  {x:1,y:3}, {x:1,y:4}, {x:2,y:4}, {x:3,y:4}, {x:4,y:4}, {x:5,y:4}, {x:6,y:4}, {x:7,y:4},
  {x:7,y:5}, {x:7,y:6}, {x:6,y:6}, {x:5,y:6}, {x:4,y:6},
  {x:4,y:7}, {x:4,y:8}, {x:5,y:8}, {x:6,y:8}, {x:7,y:8}, {x:8,y:8}, {x:9,y:8}, {x:10,y:8},
  {x:10,y:7}, {x:10,y:6}, {x:11,y:6}, {x:12,y:6}, {x:13,y:6},
  {x:13,y:5}, {x:13,y:4}, {x:14,y:4}, {x:15,y:4}, {x:16,y:4}, {x:17,y:4},
  {x:17,y:5}, {x:17,y:6}, {x:17,y:7}, {x:17,y:8}, {x:17,y:9}, {x:18,y:9}, {x:19,y:9}
];

const PATH_VOLCANO: Coordinate[] = [
  {x:0,y:5}, {x:1,y:5}, {x:2,y:5}, 
  {x:2,y:4}, {x:2,y:3}, {x:3,y:3}, {x:4,y:3}, {x:5,y:3}, {x:6,y:3},
  {x:6,y:4}, {x:6,y:5}, {x:6,y:6}, {x:6,y:7}, {x:6,y:8},
  {x:5,y:8}, {x:4,y:8}, {x:3,y:8}, 
  {x:3,y:9}, {x:3,y:10}, {x:4,y:10}, {x:5,y:10}, {x:6,y:10}, {x:7,y:10}, {x:8,y:10}, {x:9,y:10},
  {x:9,y:9}, {x:9,y:8}, {x:9,y:7}, {x:9,y:6}, {x:9,y:5}, {x:9,y:4}, {x:9,y:3}, {x:9,y:2}, {x:9,y:1},
  {x:10,y:1}, {x:11,y:1}, {x:12,y:1}, {x:13,y:1}, {x:14,y:1}, {x:15,y:1},
  {x:15,y:2}, {x:15,y:3}, {x:15,y:4}, {x:15,y:5}, {x:15,y:6},
  {x:14,y:6}, {x:13,y:6}, {x:12,y:6}, {x:11,y:6}, 
  {x:11,y:7}, {x:11,y:8}, {x:12,y:8}, {x:13,y:8}, {x:14,y:8}, {x:15,y:8}, {x:16,y:8}, {x:17,y:8}, {x:18,y:8}, {x:19,y:8}
];

export const MAP_CONFIGS: MapConfig[] = [
  {
    id: 'forest',
    name: '迷雾森林',
    coordinates: PATH_FOREST,
    theme: {
      name: 'Forest',
      background: 'bg-green-900',
      path: 'bg-stone-700',
      pathBorder: 'border-green-800',
      gridLight: 'bg-green-950',
      gridDark: 'bg-green-900'
    },
    description: '经典的防守地形，适合新手练习。'
  },
  {
    id: 'desert',
    name: '灼热沙丘',
    coordinates: PATH_DESERT,
    theme: {
      name: 'Desert',
      background: 'bg-amber-700',
      path: 'bg-amber-200',
      pathBorder: 'border-amber-800',
      gridLight: 'bg-amber-600',
      gridDark: 'bg-amber-700'
    },
    description: '蜿蜒曲折的沙路，敌人更容易在此聚集。'
  },
  {
    id: 'volcano',
    name: '末日火山',
    coordinates: PATH_VOLCANO,
    theme: {
      name: 'Volcano',
      background: 'bg-slate-900',
      path: 'bg-red-900/50',
      pathBorder: 'border-red-600',
      gridLight: 'bg-slate-800',
      gridDark: 'bg-slate-900'
    },
    description: 'BOSS的老巢，极度危险的螺旋死路。'
  }
];

export const STARTING_MONEY = 250; 
export const STARTING_LIVES = 20;
export const STARTING_MANA = 50;
export const MAX_MANA = 100;
export const MANA_REGEN_RATE = 0.1; // Mana per frame

export const TOWER_STATS: Record<TowerType, TowerConfig> = {
  [TowerType.ARCHER]: {
    name: '弓箭手',
    type: TowerType.ARCHER,
    cost: 60,
    range: 3.5,
    damage: 20,
    cooldown: 40,
    maxHp: 100,
    decayRate: 1,
    description: '基础单体攻击',
    color: 'bg-blue-500',
    icon: '🏹'
  },
  [TowerType.CANNON]: {
    name: '加农炮',
    type: TowerType.CANNON,
    cost: 150,
    range: 2.5,
    damage: 40,
    cooldown: 90,
    maxHp: 80,
    decayRate: 1,
    description: '范围伤害，攻速慢',
    color: 'bg-red-600',
    icon: '💣'
  },
  [TowerType.FLAMETHROWER]: {
    name: '火焰喷射器',
    type: TowerType.FLAMETHROWER,
    cost: 220,
    range: 2.2,
    damage: 8,
    cooldown: 5,
    maxHp: 300, // Many shots but low damage per shot
    decayRate: 1,
    description: '超高攻速，短射程',
    color: 'bg-orange-500',
    icon: '🔥'
  },
  [TowerType.ICE]: {
    name: '寒冰塔',
    type: TowerType.ICE,
    cost: 250,
    range: 3.5,
    damage: 10,
    cooldown: 45,
    maxHp: 100,
    decayRate: 1,
    description: '减速敌人',
    color: 'bg-cyan-400',
    icon: '❄️'
  },
  [TowerType.POISON]: {
    name: '毒液塔',
    type: TowerType.POISON,
    cost: 280,
    range: 4,
    damage: 5,
    cooldown: 50,
    maxHp: 100,
    decayRate: 1,
    description: '持续毒性伤害',
    color: 'bg-lime-600',
    icon: '🤢'
  },
  [TowerType.SNIPER]: {
    name: '狙击手',
    type: TowerType.SNIPER,
    cost: 300,
    range: 8,
    damage: 150,
    cooldown: 160,
    maxHp: 40, // Low shots, high impact
    decayRate: 1,
    description: '超远距离，高伤害',
    color: 'bg-emerald-700',
    icon: '🔭'
  },
  [TowerType.TESLA]: {
    name: '电磁塔',
    type: TowerType.TESLA,
    cost: 350,
    range: 3,
    damage: 60,
    cooldown: 55,
    maxHp: 80,
    decayRate: 1,
    description: '高能爆发伤害',
    color: 'bg-indigo-500',
    icon: '⚡'
  },
  [TowerType.LASER]: {
    name: '激光塔',
    type: TowerType.LASER,
    cost: 400,
    range: 3,
    damage: 5,
    cooldown: 6,
    maxHp: 400, // Very durable
    decayRate: 1,
    description: '持续激光输出',
    color: 'bg-purple-600',
    icon: '🔦'
  },
  [TowerType.MISSILE]: {
    name: '导弹发射井',
    type: TowerType.MISSILE,
    cost: 500,
    range: 12,
    damage: 120,
    cooldown: 140,
    maxHp: 30, // Very few shots
    decayRate: 1,
    description: '全图范围攻击',
    color: 'bg-slate-600',
    icon: '🚀'
  },
  [TowerType.BARRACKS]: {
    name: '兵营',
    type: TowerType.BARRACKS,
    cost: 100,
    range: 2, 
    damage: 5, 
    cooldown: 300, 
    maxHp: 15, // Can spawn 15 soldiers
    decayRate: 1,
    description: '生产士兵阻挡敌人',
    color: 'bg-orange-700',
    icon: '🛡️'
  },
  [TowerType.MINE]: {
    name: '金矿',
    type: TowerType.MINE,
    cost: 200,
    range: 0,
    damage: 0,
    cooldown: 180, 
    maxHp: 12, // Can generate gold 12 times
    decayRate: 1,
    description: '+15 金币 / 3秒',
    color: 'bg-yellow-500',
    icon: '💰'
  }
};

export const SPELL_STATS: Record<SpellType, SpellConfig> = {
  [SpellType.METEOR]: {
    name: '陨石术',
    type: SpellType.METEOR,
    manaCost: 40,
    cooldown: 300, // 5 seconds
    radius: 2.5,
    damage: 200,
    duration: 30, // Visual fade out duration
    description: '造成大范围巨额伤害',
    color: 'rgba(239, 68, 68, 0.5)', // red
    icon: '☄️'
  },
  [SpellType.BLIZZARD]: {
    name: '暴风雪',
    type: SpellType.BLIZZARD,
    manaCost: 30,
    cooldown: 480, // 8 seconds
    radius: 3,
    damage: 1, // Dot damage
    duration: 240, // 4 seconds
    description: '减速并造成持续伤害',
    color: 'rgba(59, 130, 246, 0.4)', // blue
    icon: '❄️'
  }
};

export const ENEMY_STATS: Record<EnemyType, { hp: number; speed: number; reward: number; color: string }> = {
  [EnemyType.GOBLIN]: { hp: 35, speed: 0.06, reward: 5, color: 'text-green-400' },
  [EnemyType.ORC]: { hp: 120, speed: 0.04, reward: 12, color: 'text-green-700' },
  [EnemyType.TANK]: { hp: 350, speed: 0.02, reward: 25, color: 'text-gray-400' }, // Slow, tanky
  [EnemyType.SCORPION]: { hp: 70, speed: 0.09, reward: 15, color: 'text-yellow-600' }, // Fast
  [EnemyType.BOSS]: { hp: 800, speed: 0.025, reward: 100, color: 'text-purple-500' },
  [EnemyType.SUPER_BOSS]: { hp: 4000, speed: 0.015, reward: 600, color: 'text-red-600 animate-pulse' },
};