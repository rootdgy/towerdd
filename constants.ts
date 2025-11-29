

import { TowerType, TowerConfig, Coordinate, EnemyType, SpellType, SpellConfig, MapConfig, ShopItem } from './types';
import React from 'react';

export const GRID_W = 20;
export const GRID_H = 12;
export const FPS = 60;
export const TILE_SIZE = 40;

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
const PATH_FOREST_VAR_1: Coordinate[] = PATH_FOREST.map(p => ({ x: p.x, y: GRID_H - 1 - p.y }));
const PATH_FOREST_VAR_2: Coordinate[] = PATH_FOREST.map(p => ({ x: GRID_W - 1 - p.x, y: p.y })).reverse();

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
const PATH_DESERT_VAR_1: Coordinate[] = PATH_DESERT.map(p => ({ x: p.x, y: GRID_H - 1 - p.y }));

const PATH_GLACIER: Coordinate[] = [
    {x:0,y:2}, {x:1,y:2}, {x:2,y:2}, {x:2,y:1}, {x:2,y:0},
    {x:3,y:0}, {x:4,y:0}, {x:5,y:0}, {x:6,y:0}, {x:6,y:1}, {x:6,y:2},
    {x:5,y:2}, {x:4,y:2}, {x:4,y:3}, {x:4,y:4}, {x:4,y:5},
    {x:5,y:5}, {x:6,y:5}, {x:7,y:5}, {x:8,y:5}, {x:8,y:4}, {x:8,y:3},
    {x:9,y:3}, {x:10,y:3}, {x:11,y:3}, {x:12,y:3}, {x:12,y:4}, {x:12,y:5},
    {x:12,y:6}, {x:11,y:6}, {x:10,y:6}, {x:10,y:7}, {x:10,y:8},
    {x:11,y:8}, {x:12,y:8}, {x:13,y:8}, {x:14,y:8}, {x:15,y:8},
    {x:15,y:7}, {x:15,y:6}, {x:16,y:6}, {x:17,y:6}, {x:17,y:7}, {x:17,y:8}, {x:17,y:9}, {x:17,y:10}, {x:18,y:10}, {x:19,y:10}
];
const PATH_GLACIER_VAR_1: Coordinate[] = PATH_GLACIER.map(p => ({ x: p.x, y: GRID_H - 1 - p.y }));

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

export const MAP_PATH_VARIATIONS: Record<string, Coordinate[][]> = {
    'forest': [PATH_FOREST, PATH_FOREST_VAR_1, PATH_FOREST_VAR_2],
    'desert': [PATH_DESERT, PATH_DESERT_VAR_1],
    'glacier': [PATH_GLACIER, PATH_GLACIER_VAR_1],
    'volcano': [PATH_VOLCANO]
};

export const MAP_CONFIGS: MapConfig[] = [
  {
    id: 'forest',
    name: '第一章: 迷雾废墟 (Forest)',
    coordinates: PATH_FOREST,
    theme: {
      name: 'Forest',
      background: 'bg-green-950',
      path: 'bg-stone-800',
      pathBorder: 'border-green-800',
      gridLight: 'bg-green-900',
      gridDark: 'bg-green-950'
    },
    description: '杰森的避难所被发现了。他必须利用这片充满辐射的废墟丛林作为掩护，向西撤离。',
    storyIntro: '我是杰森。它们来了...那些怪物攻破了101号避难所。我和幸存者小队被迫进入这片迷雾废墟。传说这里有一座旧时代的通讯塔，也许能联系上抵抗军。必须守住这条小路，为大家争取撤离时间！'
  },
  {
    id: 'desert',
    name: '第二章: 辐射荒原 (Desert)',
    coordinates: PATH_DESERT,
    theme: {
      name: 'Desert',
      background: 'bg-amber-900',
      path: 'bg-orange-200/20',
      pathBorder: 'border-orange-700',
      gridLight: 'bg-amber-800',
      gridDark: 'bg-amber-900'
    },
    description: '穿过森林后是死亡沙海。这里不仅炎热，还潜伏着机械毒蝎。',
    storyIntro: '好消息：我们逃出了森林。坏消息：前面是“死亡沙海”。水资源正在耗尽，而且我感觉到地底下有什么东西在移动...是那些机械变异体。它们想把我们困死在这片灼热的炼狱里。'
  },
  {
    id: 'glacier',
    name: '第三章: 永冻冰原 (Glacier)',
    coordinates: PATH_GLACIER,
    theme: {
      name: 'Glacier',
      background: 'bg-cyan-950',
      path: 'bg-slate-100/30',
      pathBorder: 'border-cyan-400',
      gridLight: 'bg-cyan-900',
      gridDark: 'bg-cyan-950'
    },
    description: '为了寻找信号，杰森必须翻越这座极寒山脉。',
    storyIntro: '通讯塔的信号指向北方的高山。这里的温度低得可怕，连怪物的行动都变慢了，但我们的防御塔也面临冻结的风险。暴风雪要来了，这可能是最后的宁静。'
  },
  {
    id: 'volcano',
    name: '终章: 地狱熔炉 (Volcano)',
    coordinates: PATH_VOLCANO,
    theme: {
      name: 'Volcano',
      background: 'bg-red-950',
      path: 'bg-orange-900/40',
      pathBorder: 'border-red-600',
      gridLight: 'bg-red-900',
      gridDark: 'bg-red-950'
    },
    description: '撤离点就在火山口。怪物的巢穴也在这里。最终决战。',
    storyIntro: '这是最后一步。撤离飞船就在火山口上方。但这里也是怪物的孵化巢穴。地表在震动，熔岩在沸腾...它们要把我们淹没在这里。必须坚持到飞船降落！为了生存！'
  },
  {
    id: 'void',
    name: '虚空裂隙 (无尽模式)',
    coordinates: PATH_ENDLESS,
    theme: {
      name: 'Void',
      background: 'bg-black',
      path: 'bg-fuchsia-900/20',
      pathBorder: 'border-fuchsia-600',
      gridLight: 'bg-gray-950',
      gridDark: 'bg-black'
    },
    description: '杰森的噩梦...没有尽头。测试你的极限。',
    storyIntro: '这不是现实...这是模拟训练，或者是死后的梦魇？无论如何，战斗没有尽头。看看你能坚持多久。'
  }
];

export const BASE_STARTING_MONEY = 300; 
export const STARTING_LIVES = 20;
export const STARTING_MANA = 0;
export const MAX_MANA = 100;
export const MANA_REGEN_RATE = 0.02;
export const SHOP_REROLL_COST = 50;

export const SHOP_ITEMS: ShopItem[] = [
  // --- UNLOCKS & SPECIALS (High Rarity) ---
  { id: 'UNLOCK_THUNDER', name: '雷神许可', description: '永久解锁 [雷神之怒] 终极技能。', cost: 100, type: 'UNLOCK', icon: '🌩️', targetId: 'THUNDER', rarity: 'S' },
  { id: 'INSURANCE', name: '保险单', description: '特殊：游戏失败保留100%金币。', cost: 500, type: 'SPECIAL', icon: '📝', rarity: 'S' },
  { id: 'AUTO_MINER', name: '自动矿机', description: '特殊：金矿塔自动产出金币。', cost: 400, type: 'SPECIAL', icon: '🤖', rarity: 'A' },
  { id: 'MERCENARY', name: '佣兵契约', description: '特殊：开局自带2名强力特种兵。', cost: 300, type: 'SPECIAL', icon: '🔫', rarity: 'A' },
  { id: 'GLITCH_BOX', name: '神秘盲盒', description: '特殊：随机获得大量资源或一无所有。', cost: 50, type: 'SPECIAL', icon: '🎲', rarity: 'B' },

  // --- PASSIVES (Mid Rarity) ---
  { id: 'P_CRIT', name: '暴击模块', description: '被动：5% 几率造成双倍伤害。', cost: 250, type: 'PASSIVE', icon: '🎯', rarity: 'A' },
  { id: 'P_GREED', name: '贪婪算法', description: '被动：击杀金币 +10%。', cost: 200, type: 'PASSIVE', icon: '🤑', rarity: 'A' },
  { id: 'P_MANA', name: '能量回收', description: '被动：法力回复速度 +50%。', cost: 180, type: 'PASSIVE', icon: '🌀', rarity: 'B' },
  { id: 'P_DMG', name: '贫铀弹药', description: '被动：物理塔伤害 +15%。', cost: 150, type: 'PASSIVE', icon: '☠️', rarity: 'B' },
  { id: 'P_HP', name: '合金装甲', description: '被动：塔耐久度 +20%。', cost: 120, type: 'PASSIVE', icon: '🛡️', rarity: 'C' },
  { id: 'P_RANGE', name: '神经超频', description: '被动：所有塔范围 +10%。', cost: 100, type: 'PASSIVE', icon: '📡', rarity: 'C' },
  { id: 'P_START', name: '初始特权', description: '被动：初始金币 +200。', cost: 80, type: 'PASSIVE', icon: '🎫', rarity: 'C' },

  // --- CONSUMABLES (Low Rarity) ---
  { id: 'C_NUKE', name: '天基武器', description: '消耗品：全屏真实伤害 10000 点。', cost: 50, type: 'CONSUMABLE', icon: '☢️', rarity: 'B' },
  { id: 'C_RAGE', name: '狂暴激素', description: '消耗品：塔攻速翻倍 (10秒)，耐久流失翻倍。', cost: 35, type: 'CONSUMABLE', icon: '💉', rarity: 'C' },
  { id: 'C_LIFE', name: '生命骇客', description: '消耗品：基地生命 +5。', cost: 30, type: 'CONSUMABLE', icon: '❤️', rarity: 'C' },
  { id: 'C_EMP', name: '电磁脉冲', description: '消耗品：全屏敌人定身 5 秒。', cost: 25, type: 'CONSUMABLE', icon: '⚡', rarity: 'D' },
  { id: 'C_REPAIR', name: '纳米修复', description: '消耗品：修复所有塔。', cost: 20, type: 'CONSUMABLE', icon: '🔧', rarity: 'D' },
  { id: 'C_SLOW', name: '时间膨胀', description: '消耗品：敌人全屏减速 80% (15秒)。', cost: 20, type: 'CONSUMABLE', icon: '🐌', rarity: 'D' },
  { id: 'C_MANA', name: '法力注射', description: '消耗品：回满法力值。', cost: 15, type: 'CONSUMABLE', icon: '🔋', rarity: 'D' },
  { id: 'C_GOLD', name: '紧急资金', description: '消耗品：立即获得 500 金币。', cost: 10, type: 'CONSUMABLE', icon: '💰', rarity: 'D' },
];

export const TOWER_STATS: Record<TowerType, TowerConfig> = {
  // --- TIER 1 (Basic) ---
  [TowerType.ARCHER]: {
    name: '弓箭手', type: TowerType.ARCHER, cost: 60, range: 3.5, damage: 20, cooldown: 40, maxHp: 100, decayRate: 0.1,
    description: '基础单体', color: 'bg-blue-500', icon: '🏹', unlockLevel: 1
  },
  [TowerType.BARRACKS]: {
    name: '兵营', type: TowerType.BARRACKS, cost: 100, range: 2, damage: 5, cooldown: 300, maxHp: 20, decayRate: 0.1,
    description: '生产士兵', color: 'bg-orange-700', icon: '🛡️', unlockLevel: 1
  },
  [TowerType.CANNON]: {
    name: '加农炮', type: TowerType.CANNON, cost: 150, range: 2.5, damage: 40, cooldown: 90, maxHp: 80, decayRate: 0.1,
    description: '范围伤害', color: 'bg-red-600', icon: '💣', unlockLevel: 1
  },
  [TowerType.SHOTGUN]: {
    name: '霰弹塔', type: TowerType.SHOTGUN, cost: 120, range: 2, damage: 15, cooldown: 50, maxHp: 120, decayRate: 0.1,
    description: '近身爆发', color: 'bg-zinc-500', icon: '💥', unlockLevel: 1
  },
  
  // --- TIER 2 (Advanced) ---
  [TowerType.SNIPER]: {
    name: '狙击手', type: TowerType.SNIPER, cost: 300, range: 8, damage: 150, cooldown: 160, maxHp: 40, decayRate: 0.1,
    description: '超远高伤', color: 'bg-emerald-700', icon: '🔭', unlockLevel: 2
  },
  [TowerType.ICE]: {
    name: '寒冰塔', type: TowerType.ICE, cost: 250, range: 3.5, damage: 10, cooldown: 45, maxHp: 100, decayRate: 0.1,
    description: '减速敌人', color: 'bg-cyan-400', icon: '❄️', unlockLevel: 2
  },
  [TowerType.MINE]: {
    name: '金矿', type: TowerType.MINE, cost: 200, range: 0, damage: 0, cooldown: 180, maxHp: 20, decayRate: 0.1,
    description: '产出金币', color: 'bg-yellow-500', icon: '💰', unlockLevel: 2
  },
  [TowerType.FLAMETHROWER]: {
    name: '火焰塔', type: TowerType.FLAMETHROWER, cost: 220, range: 2.2, damage: 8, cooldown: 5, maxHp: 300, decayRate: 0.1,
    description: '极快攻速', color: 'bg-orange-500', icon: '🔥', unlockLevel: 3
  },
  [TowerType.REPAIR]: {
    name: '维修站', type: TowerType.REPAIR, cost: 150, range: 3, damage: 0, cooldown: 60, maxHp: 100, decayRate: 0,
    description: '修理建筑', color: 'bg-pink-500', icon: '🔧', unlockLevel: 3
  },
  [TowerType.GATLING]: {
    name: '加特林', type: TowerType.GATLING, cost: 400, range: 4, damage: 12, cooldown: 15, maxHp: 150, decayRate: 0.2,
    description: '越射越快', color: 'bg-stone-400', icon: '🔫', unlockLevel: 3
  },
  [TowerType.STUNNER]: {
    name: '震荡波', type: TowerType.STUNNER, cost: 350, range: 3, damage: 20, cooldown: 100, maxHp: 100, decayRate: 0.1,
    description: '几率眩晕', color: 'bg-violet-400', icon: '😵', unlockLevel: 4
  },
  [TowerType.MORTAR]: {
    name: '迫击炮', type: TowerType.MORTAR, cost: 380, range: 6, damage: 80, cooldown: 120, maxHp: 60, decayRate: 0.1,
    description: '远程AOE', color: 'bg-stone-600', icon: '🧨', unlockLevel: 4
  },
  [TowerType.SAWBLADE]: {
    name: '锯齿塔', type: TowerType.SAWBLADE, cost: 300, range: 3, damage: 40, cooldown: 70, maxHp: 200, decayRate: 0.1,
    description: '流血伤害', color: 'bg-red-800', icon: '⚙️', unlockLevel: 4
  },
  [TowerType.RADAR]: {
    name: '雷达站', type: TowerType.RADAR, cost: 300, range: 4, damage: 0, cooldown: 0, maxHp: 80, decayRate: 0.05,
    description: '增加射程', color: 'bg-green-300', icon: '📡', unlockLevel: 4
  },
  
  // --- TIER 3 (Elite) ---
  [TowerType.LASER]: {
    name: '激光塔', type: TowerType.LASER, cost: 500, range: 3.5, damage: 25, cooldown: 6, maxHp: 400, decayRate: 0.1,
    description: '持续高伤', color: 'bg-purple-600', icon: '🔦', unlockLevel: 5
  },
  [TowerType.TESLA]: {
    name: '电磁塔', type: TowerType.TESLA, cost: 550, range: 3.5, damage: 150, cooldown: 55, maxHp: 80, decayRate: 0.1,
    description: '连锁闪电', color: 'bg-indigo-500', icon: '⚡', unlockLevel: 5
  },
  [TowerType.POISON]: {
    name: '毒液塔', type: TowerType.POISON, cost: 450, range: 4, damage: 20, cooldown: 50, maxHp: 100, decayRate: 0.1,
    description: '猛烈毒素', color: 'bg-lime-600', icon: '🤢', unlockLevel: 5
  },
  [TowerType.VOID_RAY]: {
    name: '虚空光束', type: TowerType.VOID_RAY, cost: 800, range: 5, damage: 10, cooldown: 5, maxHp: 300, decayRate: 0.1,
    description: '伤害递增', color: 'bg-violet-900', icon: '🟣', unlockLevel: 6
  },
  [TowerType.INCINERATOR]: {
    name: '焚化炉', type: TowerType.INCINERATOR, cost: 700, range: 2.5, damage: 5, cooldown: 5, maxHp: 300, decayRate: 0.1,
    description: '全周燃烧', color: 'bg-orange-800', icon: '🌋', unlockLevel: 6
  },
  [TowerType.HACKER]: {
    name: '黑客塔', type: TowerType.HACKER, cost: 600, range: 4, damage: 10, cooldown: 60, maxHp: 50, decayRate: 0.1,
    description: '混乱敌人', color: 'bg-green-500', icon: '💻', unlockLevel: 6
  },
  [TowerType.BANK]: {
    name: '银行', type: TowerType.BANK, cost: 1000, range: 0, damage: 0, cooldown: 300, maxHp: 50, decayRate: 0.05,
    description: '金币利息', color: 'bg-yellow-200', icon: '🏦', unlockLevel: 7
  },
  [TowerType.PRISM]: {
    name: '光棱塔', type: TowerType.PRISM, cost: 750, range: 5, damage: 60, cooldown: 40, maxHp: 150, decayRate: 0.1,
    description: '多重激光', color: 'bg-rose-400', icon: '🌈', unlockLevel: 7
  },
  [TowerType.LINKER]: {
    name: '链接塔', type: TowerType.LINKER, cost: 650, range: 4, damage: 30, cooldown: 30, maxHp: 100, decayRate: 0.1,
    description: '伤害共享', color: 'bg-teal-500', icon: '🔗', unlockLevel: 7
  },
  
  // --- TIER 4 (Ultimate Boss Killers) ---
  [TowerType.MISSILE]: {
    name: '导弹井', type: TowerType.MISSILE, cost: 1200, range: 12, damage: 800, cooldown: 140, maxHp: 200, decayRate: 0.1,
    description: '全图打击', color: 'bg-slate-600', icon: '🚀', unlockLevel: 8
  },
  [TowerType.SLOW]: {
    name: '时空塔', type: TowerType.SLOW, cost: 1000, range: 4, damage: 0, cooldown: 0, maxHp: 500, decayRate: 0.05,
    description: '极强减速', color: 'bg-fuchsia-800', icon: '⏳', unlockLevel: 8
  },
  [TowerType.RAILGUN]: {
    name: '轨道炮', type: TowerType.RAILGUN, cost: 2000, range: 20, damage: 3000, cooldown: 200, maxHp: 150, decayRate: 0.2,
    description: '直线穿透', color: 'bg-blue-900', icon: '🚄', unlockLevel: 9
  },
  [TowerType.NUKE]: {
    name: '核弹井', type: TowerType.NUKE, cost: 3000, range: 99, damage: 8000, cooldown: 600, maxHp: 200, decayRate: 0.5,
    description: '清屏核爆', color: 'bg-green-900', icon: '☢️', unlockLevel: 9
  },
  [TowerType.DRONE]: {
    name: '无人机母舰', type: TowerType.DRONE, cost: 2500, range: 5, damage: 150, cooldown: 20, maxHp: 400, decayRate: 0.1,
    description: '蜂群攻击', color: 'bg-slate-300', icon: '🛸', unlockLevel: 9
  },
  [TowerType.BLACK_HOLE]: {
    name: '黑洞发生器', type: TowerType.BLACK_HOLE, cost: 4000, range: 4, damage: 300, cooldown: 10, maxHp: 500, decayRate: 0.2,
    description: '吞噬一切', color: 'bg-black border-white border', icon: '🕳️', unlockLevel: 10
  },
  [TowerType.EXECUTIONER]: {
    name: '处决者', type: TowerType.EXECUTIONER, cost: 5000, range: 3, damage: 1000, cooldown: 60, maxHp: 300, decayRate: 0.1,
    description: '斩杀低血量', color: 'bg-red-950', icon: '☠️', unlockLevel: 10
  }
};

export const SPELL_STATS: Record<SpellType, SpellConfig> = {
  [SpellType.METEOR]: {
    name: '1. 陨石术', type: SpellType.METEOR, manaCost: 40, cooldown: 300, radius: 2.5, damage: 500, duration: 30, 
    description: '造成大范围巨额伤害', color: 'rgba(239, 68, 68, 0.5)', icon: '☄️', unlockLevel: 1
  },
  [SpellType.BLIZZARD]: {
    name: '2. 暴风雪', type: SpellType.BLIZZARD, manaCost: 30, cooldown: 480, radius: 3, damage: 5, duration: 240, 
    description: '减速并造成持续伤害', color: 'rgba(59, 130, 246, 0.4)', icon: '❄️', unlockLevel: 2
  },
  [SpellType.ROOT]: {
    name: '3. 自然缠绕', type: SpellType.ROOT, manaCost: 35, cooldown: 350, radius: 2.5, damage: 0, duration: 120, 
    description: '定身范围内的敌人', color: 'rgba(16, 185, 129, 0.5)', icon: '🌿', unlockLevel: 3
  },
  [SpellType.ACID_RAIN]: {
    name: '4. 酸雨腐蚀', type: SpellType.ACID_RAIN, manaCost: 50, cooldown: 400, radius: 3, damage: 5, duration: 300, 
    description: '持续腐蚀敌人护甲与血量', color: 'rgba(132, 204, 22, 0.4)', icon: '🧪', unlockLevel: 4
  },
  [SpellType.OVERCLOCK]: {
    name: '5. 机械超频', type: SpellType.OVERCLOCK, manaCost: 45, cooldown: 600, radius: 4, damage: 0, duration: 300, 
    description: '范围内防御塔攻速提升', color: 'rgba(234, 179, 8, 0.4)', icon: '⚙️', unlockLevel: 5
  },
  [SpellType.PLASMA_RAY]: {
    name: '6. 等离子射流', type: SpellType.PLASMA_RAY, manaCost: 60, cooldown: 500, radius: 2, damage: 1500, duration: 15, 
    description: '小范围毁灭性打击', color: 'rgba(168, 85, 247, 0.6)', icon: '⚛️', unlockLevel: 6
  },
  [SpellType.TIME_STOP]: {
    name: '7. 时空静止', type: SpellType.TIME_STOP, manaCost: 80, cooldown: 900, radius: 99, damage: 0, duration: 180, 
    description: '全屏敌人暂停行动', color: 'rgba(255, 255, 255, 0.2)', icon: '⏱️', unlockLevel: 7
  },
  [SpellType.HEAL]: {
    name: '8. 神圣之光 (终极)', type: SpellType.HEAL, manaCost: 100, cooldown: 400, radius: 6, damage: 0, duration: 40, 
    description: '【终极】瞬间修复所有建筑', color: 'rgba(34, 197, 94, 0.4)', icon: '✨', unlockLevel: 8, isUltimate: true
  },
  [SpellType.THUNDER]: {
    name: '9. 雷神之怒 (终极)', type: SpellType.THUNDER, manaCost: 100, cooldown: 600, radius: 3, damage: 5000, duration: 20, 
    description: '【终极】毁灭性雷击', color: 'rgba(253, 224, 71, 0.6)', icon: '🌩️', unlockLevel: 9, isUltimate: true
  }
};

export const ENEMY_STATS: Record<EnemyType, { hp: number; speed: number; reward: number; color: string }> = {
  [EnemyType.GOBLIN]: { hp: 10, speed: 0.06, reward: 5, color: 'text-green-400' }, 
  [EnemyType.ORC]: { hp: 40, speed: 0.04, reward: 12, color: 'text-green-700' },
  [EnemyType.TANK]: { hp: 120, speed: 0.02, reward: 25, color: 'text-gray-400' }, 
  [EnemyType.SCORPION]: { hp: 35, speed: 0.09, reward: 15, color: 'text-yellow-600' }, 
  [EnemyType.BOSS]: { hp: 800, speed: 0.025, reward: 100, color: 'text-purple-500' },
  [EnemyType.SUPER_BOSS]: { hp: 4000, speed: 0.015, reward: 600, color: 'text-red-600 animate-pulse' },
};