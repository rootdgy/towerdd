
import { TowerType, TowerConfig, Coordinate, EnemyType, SpellType, SpellConfig, MapConfig, ShopItem } from './types';
import React from 'react';

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

// Generate zig-zag endless path
const PATH_ENDLESS: Coordinate[] = [];
for (let y = 0; y < GRID_H; y+=2) {
  if ((y/2) % 2 === 0) {
    for (let x = 0; x < GRID_W; x++) PATH_ENDLESS.push({x, y});
    if (y < GRID_H - 2) PATH_ENDLESS.push({x: GRID_W - 1, y: y + 1});
  } else {
    for (let x = GRID_W - 1; x >= 0; x--) PATH_ENDLESS.push({x, y});
    if (y < GRID_H - 2) PATH_ENDLESS.push({x: 0, y: y + 1});
  }
}

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
  },
  {
    id: 'void',
    name: '虚空裂隙 (无尽)',
    coordinates: PATH_ENDLESS,
    theme: {
      name: 'Void',
      background: 'bg-black',
      path: 'bg-fuchsia-900/20',
      pathBorder: 'border-fuchsia-600',
      gridLight: 'bg-gray-950',
      gridDark: 'bg-black'
    },
    description: '没有尽头的死亡回廊。测试你的极限。'
  }
];

export const BASE_STARTING_MONEY = 300; 
export const STARTING_LIVES = 20;
export const STARTING_MANA = 0;
export const MAX_MANA = 100;
export const MANA_REGEN_RATE = 0.02;
export const SHOP_REROLL_COST = 50;

export const SHOP_ITEMS: ShopItem[] = [
  // --- UNLOCKS & SPECIALS ---
  { id: 'UNLOCK_THUNDER', name: '雷神许可', description: '永久解锁 [雷神之怒] 终极技能。', cost: 100, type: 'UNLOCK', icon: '🌩️', targetId: 'THUNDER' },
  { id: 'MERCENARY', name: '佣兵契约', description: '特殊：开局自带2名强力特种兵。', cost: 300, type: 'SPECIAL', icon: '🔫' },
  { id: 'AUTO_MINER', name: '自动矿机', description: '特殊：金矿塔自动产出金币。', cost: 400, type: 'SPECIAL', icon: '🤖' },
  { id: 'GLITCH_BOX', name: '神秘盲盒', description: '特殊：随机获得大量资源或一无所有。', cost: 50, type: 'SPECIAL', icon: '🎲' },
  { id: 'INSURANCE', name: '保险单', description: '特殊：游戏失败保留100%金币。', cost: 500, type: 'SPECIAL', icon: '📝' },

  // --- CONSUMABLES ---
  { id: 'C_GOLD', name: '紧急资金', description: '消耗品：立即获得 500 金币。', cost: 10, type: 'CONSUMABLE', icon: '💰' },
  { id: 'C_EMP', name: '电磁脉冲', description: '消耗品：全屏敌人定身 5 秒。', cost: 25, type: 'CONSUMABLE', icon: '⚡' },
  { id: 'C_NUKE', name: '天基武器', description: '消耗品：全屏真实伤害 1000 点。', cost: 50, type: 'CONSUMABLE', icon: '☢️' },
  { id: 'C_MANA', name: '法力注射', description: '消耗品：回满法力值。', cost: 15, type: 'CONSUMABLE', icon: '🔋' },
  { id: 'C_REPAIR', name: '纳米修复', description: '消耗品：修复所有塔。', cost: 20, type: 'CONSUMABLE', icon: '🔧' },
  { id: 'C_LIFE', name: '生命骇客', description: '消耗品：基地生命 +5。', cost: 30, type: 'CONSUMABLE', icon: '❤️' },
  { id: 'C_RAGE', name: '狂暴激素', description: '消耗品：塔攻速翻倍 (10秒)，耐久流失翻倍。', cost: 35, type: 'CONSUMABLE', icon: '💉' },
  { id: 'C_SLOW', name: '时间膨胀', description: '消耗品：敌人全屏减速 80% (15秒)。', cost: 20, type: 'CONSUMABLE', icon: '🐌' },

  // --- PASSIVES ---
  { id: 'P_RANGE', name: '神经超频', description: '被动：所有塔范围 +10%。', cost: 100, type: 'PASSIVE', icon: '📡' },
  { id: 'P_DMG', name: '贫铀弹药', description: '被动：物理塔伤害 +15%。', cost: 150, type: 'PASSIVE', icon: '☠️' },
  { id: 'P_HP', name: '合金装甲', description: '被动：塔耐久度 +20%。', cost: 120, type: 'PASSIVE', icon: '🛡️' },
  { id: 'P_GREED', name: '贪婪算法', description: '被动：击杀金币 +10%。', cost: 200, type: 'PASSIVE', icon: '🤑' },
  { id: 'P_MANA', name: '能量回收', description: '被动：法力回复速度 +50%。', cost: 180, type: 'PASSIVE', icon: '🌀' },
  { id: 'P_START', name: '初始特权', description: '被动：初始金币 +200。', cost: 80, type: 'PASSIVE', icon: '🎫' },
  { id: 'P_CRIT', name: '暴击模块', description: '被动：5% 几率造成双倍伤害。', cost: 250, type: 'PASSIVE', icon: '🎯' }
];

export const TOWER_STATS: Record<TowerType, TowerConfig> = {
  [TowerType.ARCHER]: {
    name: '弓箭手',
    type: TowerType.ARCHER,
    cost: 60,
    range: 3.5,
    damage: 20,
    cooldown: 40,
    maxHp: 100,
    decayRate: 0.1,
    description: '基础单体攻击，攻击回复法力',
    color: 'bg-blue-500',
    icon: '🏹',
    unlockLevel: 1
  },
  [TowerType.BARRACKS]: {
    name: '兵营',
    type: TowerType.BARRACKS,
    cost: 100,
    range: 2, 
    damage: 5, 
    cooldown: 300, 
    maxHp: 20, 
    decayRate: 0.1,
    description: '生产士兵阻挡敌人',
    color: 'bg-orange-700',
    icon: '🛡️',
    unlockLevel: 1
  },
  [TowerType.CANNON]: {
    name: '加农炮',
    type: TowerType.CANNON,
    cost: 150,
    range: 2.5,
    damage: 40,
    cooldown: 90,
    maxHp: 80,
    decayRate: 0.1,
    description: '范围伤害，攻速慢',
    color: 'bg-red-600',
    icon: '💣',
    unlockLevel: 1
  },
  [TowerType.SNIPER]: {
    name: '狙击手',
    type: TowerType.SNIPER,
    cost: 300,
    range: 8,
    damage: 150,
    cooldown: 160,
    maxHp: 40,
    decayRate: 0.1,
    description: '超远距离，高伤害',
    color: 'bg-emerald-700',
    icon: '🔭',
    unlockLevel: 2
  },
  [TowerType.ICE]: {
    name: '寒冰塔',
    type: TowerType.ICE,
    cost: 250,
    range: 3.5,
    damage: 10,
    cooldown: 45,
    maxHp: 100,
    decayRate: 0.1,
    description: '减速敌人',
    color: 'bg-cyan-400',
    icon: '❄️',
    unlockLevel: 3
  },
  [TowerType.MINE]: {
    name: '金矿',
    type: TowerType.MINE,
    cost: 200,
    range: 0,
    damage: 0,
    cooldown: 180, 
    maxHp: 20, 
    decayRate: 0.1,
    description: '+15 金币 / 3秒',
    color: 'bg-yellow-500',
    icon: '💰',
    unlockLevel: 3
  },
  [TowerType.FLAMETHROWER]: {
    name: '火焰喷射器',
    type: TowerType.FLAMETHROWER,
    cost: 220,
    range: 2.2,
    damage: 8,
    cooldown: 5,
    maxHp: 300,
    decayRate: 0.1,
    description: '超高攻速，短射程',
    color: 'bg-orange-500',
    icon: '🔥',
    unlockLevel: 4
  },
  [TowerType.LASER]: {
    name: '激光塔',
    type: TowerType.LASER,
    cost: 400,
    range: 3,
    damage: 5,
    cooldown: 6,
    maxHp: 400,
    decayRate: 0.1,
    description: '持续激光输出',
    color: 'bg-purple-600',
    icon: '🔦',
    unlockLevel: 5
  },
  [TowerType.REPAIR]: {
    name: '维修站',
    type: TowerType.REPAIR,
    cost: 150,
    range: 3, 
    damage: 0, 
    cooldown: 60, 
    maxHp: 100, 
    decayRate: 0, // Self-sustaining
    description: '自动修理周围建筑',
    color: 'bg-pink-500',
    icon: '🔧',
    unlockLevel: 5
  },
  [TowerType.TESLA]: {
    name: '电磁塔',
    type: TowerType.TESLA,
    cost: 350,
    range: 3,
    damage: 60,
    cooldown: 55,
    maxHp: 80,
    decayRate: 0.1,
    description: '高能爆发伤害',
    color: 'bg-indigo-500',
    icon: '⚡',
    unlockLevel: 6
  },
  [TowerType.POISON]: {
    name: '毒液塔',
    type: TowerType.POISON,
    cost: 280,
    range: 4,
    damage: 5,
    cooldown: 50,
    maxHp: 100,
    decayRate: 0.1,
    description: '持续毒性伤害',
    color: 'bg-lime-600',
    icon: '🤢',
    unlockLevel: 6
  },
  [TowerType.MISSILE]: {
    name: '导弹发射井',
    type: TowerType.MISSILE,
    cost: 500,
    range: 12,
    damage: 120,
    cooldown: 140,
    maxHp: 30,
    decayRate: 0.1,
    description: '全图范围攻击',
    color: 'bg-slate-600',
    icon: '🚀',
    unlockLevel: 7
  },
  [TowerType.SLOW]: {
    name: '时空塔',
    type: TowerType.SLOW,
    cost: 350,
    range: 3, 
    damage: 0, 
    cooldown: 0, 
    maxHp: 200, 
    decayRate: 0.05, 
    description: '大幅减速周围敌人',
    color: 'bg-fuchsia-800',
    icon: '⏳',
    unlockLevel: 7
  }
};

export const SPELL_STATS: Record<SpellType, SpellConfig> = {
  [SpellType.METEOR]: {
    name: '陨石术',
    type: SpellType.METEOR,
    manaCost: 40,
    cooldown: 300, 
    radius: 2.5,
    damage: 200,
    duration: 30, 
    description: '造成大范围巨额伤害',
    color: 'rgba(239, 68, 68, 0.5)', 
    icon: '☄️',
    unlockLevel: 1
  },
  [SpellType.BLIZZARD]: {
    name: '暴风雪',
    type: SpellType.BLIZZARD,
    manaCost: 30,
    cooldown: 480, 
    radius: 3,
    damage: 1, 
    duration: 240, 
    description: '减速并造成持续伤害',
    color: 'rgba(59, 130, 246, 0.4)', 
    icon: '❄️',
    unlockLevel: 2
  },
  [SpellType.ROOT]: {
    name: '自然缠绕',
    type: SpellType.ROOT,
    manaCost: 35,
    cooldown: 350, 
    radius: 2.5,
    damage: 0, 
    duration: 120, // 2 seconds
    description: '定身范围内的敌人',
    color: 'rgba(16, 185, 129, 0.5)', // Emerald
    icon: '🌿',
    unlockLevel: 4
  },
  [SpellType.HEAL]: {
    name: '神圣之光 (终极)',
    type: SpellType.HEAL,
    manaCost: 100, // Display only, logic uses maxMana
    cooldown: 400, 
    radius: 6,
    damage: 0, 
    duration: 40, 
    description: '【终极技能】需满蓝。瞬间修复所有建筑。',
    color: 'rgba(34, 197, 94, 0.4)', // Green
    icon: '✨',
    unlockLevel: 5,
    isUltimate: true
  },
  [SpellType.THUNDER]: {
    name: '雷神之怒 (终极)',
    type: SpellType.THUNDER,
    manaCost: 100, // Display only
    cooldown: 600, 
    radius: 3,
    damage: 2000, // Huge single target
    duration: 20, 
    description: '【终极技能】需满蓝。毁灭性单体打击。',
    color: 'rgba(253, 224, 71, 0.6)', // Yellow
    icon: '🌩️',
    unlockLevel: 7,
    isUltimate: true
  }
};

export const ENEMY_STATS: Record<EnemyType, { hp: number; speed: number; reward: number; color: string }> = {
  [EnemyType.GOBLIN]: { hp: 35, speed: 0.06, reward: 5, color: 'text-green-400' },
  [EnemyType.ORC]: { hp: 100, speed: 0.04, reward: 12, color: 'text-green-700' },
  [EnemyType.TANK]: { hp: 300, speed: 0.02, reward: 25, color: 'text-gray-400' }, 
  [EnemyType.SCORPION]: { hp: 60, speed: 0.09, reward: 15, color: 'text-yellow-600' }, 
  [EnemyType.BOSS]: { hp: 600, speed: 0.025, reward: 100, color: 'text-purple-500' },
  [EnemyType.SUPER_BOSS]: { hp: 3000, speed: 0.015, reward: 600, color: 'text-red-600 animate-pulse' },
};
