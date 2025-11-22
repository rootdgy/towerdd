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
  POISON = 'POISON'
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
  BLIZZARD = 'BLIZZARD'
}

export enum AppScreen {
  START = 'START',
  LEVEL_SELECT = 'LEVEL_SELECT',
  GAME = 'GAME'
}

export interface AppSettings {
  musicVolume: number; // 0.0 to 1.0
  sfxVolume: number;   // 0.0 to 1.0
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
  pathIndex: number; // Current index in the path array
  progress: number; // 0.0 to 1.0 progress to next tile
  frozen: number; // frames remaining
  poisoned: number; // frames remaining
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
  investedCost: number; // Total money spent (build + upgrades)
  hp: number; // Current durability
  maxHp: number; // Max durability
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
  respawnTime: number; // 0 if alive
}

export interface ActiveSpell extends Entity {
  type: SpellType;
  startTime: number; // Frame number when cast
  duration: number; // Duration in frames
  radius: number;
}

export interface GameState {
  money: number;
  lives: number;
  wave: number; // Current wave in the level (1-10)
  currentLevelId: number; // 1, 2, 3...
  maxUnlockedLevel: number; // Highest level unlocked
  mana: number;
  maxMana: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isLevelComplete: boolean;
  gameSpeed: number;
}

export interface TowerConfig {
  name: string;
  type: TowerType;
  cost: number;
  range: number;
  damage: number;
  cooldown: number; // frames
  maxHp: number; // Starting durability (number of shots/actions)
  decayRate: number; // HP lost per action
  description: string;
  color: string;
  icon: string;
}

export interface SpellConfig {
  name: string;
  type: SpellType;
  manaCost: number;
  cooldown: number; // frames
  radius: number;
  damage: number; // Instant damage (Meteor) or tick damage (Blizzard)
  duration: number; // frames (0 for instant)
  description: string;
  color: string;
  icon: React.ReactNode;
}