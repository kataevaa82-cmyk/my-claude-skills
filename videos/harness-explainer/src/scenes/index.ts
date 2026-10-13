import React from 'react';
import {Bars, Receipts, SameEngine, TripCompare} from './compare';
import {CustomInstructions, Hub, SkillFolder} from './custom';
import {AgentLoop, Desk, Memory, Permissions, SkillsIntro, SystemPrompt, Tools} from './details';
import {Checklist, Homework, Outro, PromptCompare, Summary} from './final';
import {Agenda, Chapter, Dictionary, Equation, HookChat, Horse, TitleCard} from './intro';
import {PartsGrid, Sage, TextInOut} from './model';
import {Injection, Myths, Quiz, SafetyRules} from './safety';
import {Shot} from './shot';

export const SCENES: Record<string, React.FC<any>> = {
  hookChat: HookChat,
  titleCard: TitleCard,
  agenda: Agenda,
  chapter: Chapter,
  dictionary: Dictionary,
  horse: Horse,
  equation: Equation,
  textInOut: TextInOut,
  sage: Sage,
  partsGrid: PartsGrid,
  systemPrompt: SystemPrompt,
  tools: Tools,
  shot: Shot,
  agentLoop: AgentLoop,
  desk: Desk,
  memory: Memory,
  permissions: Permissions,
  skillsIntro: SkillsIntro,
  sameEngine: SameEngine,
  bars: Bars,
  tripCompare: TripCompare,
  receipts: Receipts,
  skillFolder: SkillFolder,
  hub: Hub,
  customInstructions: CustomInstructions,
  safetyRules: SafetyRules,
  injection: Injection,
  myths: Myths,
  quiz: Quiz,
  checklist: Checklist,
  promptCompare: PromptCompare,
  summary: Summary,
  homework: Homework,
  outro: Outro,
};
