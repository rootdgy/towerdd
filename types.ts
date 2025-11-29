import React from 'react';

export enum TowerType {
  ARCHER = 'ARCHER',
  BARRACKS = 'BARRACKS',
  MINE = 'MINE',
  CANNON = 'CANNON',
  SNIPER = 'SNIPER',
  LASER = 'LASER',
  FLAMETHROWER = 'FLAMETHROWER',
  ICE = 'ICE',
  TESLA = 'TESLA',
  MISSILE = 'MISSILE',
  POISON = 'POISON',
  REPAIR = 'REPAIR',
  SLOW = 'SLOW',
  // New Towers
  GATLING = 'GATLING',
  SHOTGUN = 'SHOTGUN',
  MORTAR = 'MORTAR',
  RADAR = 'RADAR',
  BANK = 'BANK',
  VOID_RAY = 'VOID_RAY',
  RAILGUN = 'RAILGUN',
  NUKE = 'NUKE',
  HACKER = 'HACKER',
  DRONE = 'DRONE',
  STUNNER = 'STUNNER',
  INCINERATOR = 'INCINERATOR',
  PRISM = 'PRISM',
  SAWBLADE = 'SAWBLADE',
  LINKER = 'LINKER',
  BLACK_HOLE = 'BLACK_HOLE',
  EXECUTIONER = 'EXECUTIONER'
}

export enum EnemyType {
  GOBLIN = 'GOBLIN',
  ORC = 'ORC',
  TANK = 'TANK',
  SCORPION = 'SCORPION',
  BOSS = 'BOSS',
  SUPER_BOSS = 'SUPER_BOSS'
}

export enum SpellType {
  METEOR = 'METEOR',
  BLIZZARD = 'BLIZZARD',
  ROOT = 'ROOT',
  ACID_RAIN = 'ACID_RAIN',
  OVERCLOCK = 'OVERCLOCK',
  PLASMA_RAY = 'PLASMA_RAY',
  TIME_STOP = 'TIME_STOP',
  HEAL = 'HEAL',
  THUNDER = 'THUNDER'
}

export enum AppScreen {
  START = 'START',
  LEVEL_SELECT = 'LEVEL_SELECT',
  GAME = 'GAME',
  COMPENDIUM = 'COMPENDIUM',
  SHOP = 'SHOP'
}

export enum GameMode {
  STORY = 'STORY',
  ENDLESS = 'ENDLESS'
}

export interface AppSettings {
  musicVolume: number;
  sfxVolume: number;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface Entity extends Coordinate {
  id: string;
}

export interface Theme {
  name: string;
  background: string;
  path: string;
  pathBorder: string;
  gridLight: string;
  gridDark: string;
}

export interface MapConfig {
  id: string;
  name: string; // Chapter Name
  coordinates: Coordinate[];
  theme: Theme;
  description: string;
  storyIntro?: string; // Narrative text
}

export interface Enemy extends Entity {
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  pathIndex: number;
  progress: number;
  frozen: number;
  poisoned: number;
  rooted: number;
  confused: number; // Moves backwards
  engagedWithSoldierId: string | null;
  reward: number;
  lastHitTime?: number; // For visual flash
}

export interface Tower extends Entity {
  type: TowerType;
  range: number;
  damage: number;
  cooldown: number;
  lastShotTime: number;
  level: number;
  investedCost: number;
  hp: number;
  maxHp: number;
  customValue?: number; // For heat, charge, interest time, etc.
  targetId?: string | null; // For locking on (Void Ray)
}

export interface Projectile extends Entity {
  targetId: string;
  damage: number;
  speed: number;
  color: string;
  splashRadius?: number;
  effectType?: 'FREEZE' | 'POISON' | 'CONFUSE' | 'STUN' | 'BURN' | 'INSTAKILL';
  type?: TowerType;
}

export interface Soldier extends Entity {
  hp: number;
  maxHp: number;
  damage: number;
  range: number;
  engagedEnemyId: string | null;
  originTowerId: string;
  respawnTime: number;
}

export interface ActiveSpell extends Entity {
  type: SpellType;
  startTime: number;
  duration: number;
  radius: number;
}

export interface VisualEffect extends Entity {
  text?: string;
  color: string;
  life: number; // Frames remaining
  maxLife: number;
  vy?: number; // Vertical velocity
  type?: 'TEXT' | 'BEAM' | 'EXPLOSION';
  ex?: number; // End X for beam
  ey?: number; // End Y for beam
}

export interface GameState {
  money: number;
  diamonds: number;
  inventory: string[]; 
  shopStock: string[]; 
  lives: number;
  wave: number;
  currentLevelId: number;
  maxUnlockedLevel: number;
  mana: number;
  maxMana: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isLevelComplete: boolean;
  gameSpeed: number;
  gameMode: GameMode;
  isDevMode: boolean;
}

export interface TowerConfig {
  name: string;
  type: TowerType;
  cost: number;
  range: number;
  damage: number;
  cooldown: number;
  maxHp: number;
  decayRate: number;
  description: string;
  color: string;
  icon: string;
  unlockLevel: number;
}

export interface SpellConfig {
  name: string;
  type: SpellType;
  manaCost: number;
  cooldown: number;
  radius: number;
  damage: number;
  duration: number;
  description: string;
  color: string;
  icon: React.ReactNode;
  unlockLevel: number;
  isUltimate?: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: React.ReactNode;
  type: 'UNLOCK' | 'CONSUMABLE' | 'PASSIVE' | 'SPECIAL';
  rarity: 'S' | 'A' | 'B' | 'C' | 'D';
  targetId?: string;
}