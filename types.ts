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
  SLOW = 'SLOW'
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
  THUNDER = 'THUNDER',
  HEAL = 'HEAL',
  ROOT = 'ROOT'
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
  name: string;
  coordinates: Coordinate[];
  theme: Theme;
  description: string;
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
  engagedWithSoldierId: string | null;
  reward: number;
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
}

export interface Projectile extends Entity {
  targetId: string;
  damage: number;
  speed: number;
  color: string;
  splashRadius?: number;
  effectType?: 'FREEZE' | 'POISON';
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

export interface GameState {
  money: number;
  diamonds: number;
  inventory: string[]; // List of item IDs owned
  shopStock: string[]; // Current 3 items in shop
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
  targetId?: string;
}