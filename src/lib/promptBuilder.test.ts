import { describe, it, expect } from 'vitest';
import {
  buildPrompt,
  buildPosePrompt,
  buildStudioPrompt,
  SHOE_NEGATIVE_PROMPT,
  EXPERT_PERSONA,
  PAIR_DIRECTIVE,
  ZERO_CHANGE_DIRECTIVE,
  ENGLISH_DIRECTIVE,
} from './promptBuilder';

describe('buildPrompt', () => {
  it('falls back to Stüdyo when vibe is unknown', () => {
    const p = buildPrompt('NOPE');
    expect(p).toMatch(/white infinity background/);
  });

  it('embeds the shoe type label when not generic', () => {
    expect(buildPrompt('Stüdyo', 'Sneaker')).toMatch(/\(Sneaker\)/);
  });

  it('skips type label for "Genel Ayakkabı"', () => {
    expect(buildPrompt('Stüdyo', 'Genel Ayakkabı')).toMatch(/footwear item/);
  });

  it('includes the custom prompt verbatim', () => {
    expect(buildPrompt('Sokak', 'Boots', 'leather', 'with red laces')).toMatch(/with red laces/);
  });

  it('Albüm vibe references magazine layout', () => {
    expect(buildPrompt('Albüm')).toMatch(/magazine/);
  });

  it('embeds expert persona, english, pair and zero-change directives', () => {
    const p = buildPrompt('Stüdyo');
    expect(p).toContain(EXPERT_PERSONA);
    expect(p).toContain(ENGLISH_DIRECTIVE);
    expect(p).toContain(PAIR_DIRECTIVE);
    expect(p).toContain(ZERO_CHANGE_DIRECTIVE);
  });

  it('exports a non-empty negative prompt with mirrored-pair guard', () => {
    expect(SHOE_NEGATIVE_PROMPT.length).toBeGreaterThan(20);
    expect(SHOE_NEGATIVE_PROMPT).toMatch(/clones|mirrored/);
  });
});

describe('buildPosePrompt', () => {
  it('embeds character lock + persona + pair directive', () => {
    const p = buildPosePrompt('koltuk-bel-alti', 'Sneaker');
    expect(p).toContain('CHARACTER LOCK');
    expect(p).toContain(EXPERT_PERSONA);
    expect(p).toContain(PAIR_DIRECTIVE);
    expect(p).toMatch(/\(Sneaker\)/);
    expect(p).toMatch(/SEATED on a mid-century/);
  });

  it('falls back to buildPrompt when poseId is unknown', () => {
    const p = buildPosePrompt('Stüdyo', 'Boots');
    expect(p).toMatch(/white infinity background/);
  });
});

describe('buildStudioPrompt', () => {
  it('design mode includes user prompt', () => {
    const p = buildStudioPrompt({ isDesignMode: true, customPrompt: 'glittery red sole' });
    expect(p).toMatch(/glittery red sole/);
    expect(p).toContain(EXPERT_PERSONA);
  });

  it('photo mode emphasizes 1:1 detail preservation', () => {
    const p = buildStudioPrompt({ isDesignMode: false });
    expect(p).toMatch(/1:1 detail preservation/);
    expect(p).toContain(ZERO_CHANGE_DIRECTIVE);
  });
});
