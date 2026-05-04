import { describe, it, expect } from 'vitest';
import { ZINES, HISTORICAL_FIGURES, TREASURES, HEALING_ITEMS } from '../data.js';

describe('ZINES', () => {
    it('exports exactly 19 zines', () => {
        expect(Object.keys(ZINES)).toHaveLength(19);
    });

    it.each(Object.entries(ZINES))('"%s" has a non-empty title and content', (key, zine) => {
        expect(typeof zine.title).toBe('string');
        expect(zine.title.length).toBeGreaterThan(0);
        expect(typeof zine.content).toBe('string');
        expect(zine.content.length).toBeGreaterThan(0);
    });
});

describe('HISTORICAL_FIGURES', () => {
    it('exports exactly 9 figures', () => {
        expect(Object.keys(HISTORICAL_FIGURES)).toHaveLength(9);
    });

    it.each(Object.entries(HISTORICAL_FIGURES))('"%s" has name, era, and dialogue', (key, figure) => {
        expect(typeof figure.name).toBe('string');
        expect(figure.name.length).toBeGreaterThan(0);
        expect(typeof figure.era).toBe('string');
        expect(figure.era.length).toBeGreaterThan(0);
        expect(figure.dialogue).toBeDefined();
    });

    it.each(Object.entries(HISTORICAL_FIGURES))('"%s" has a greeting node with choices array', (key, figure) => {
        expect(figure.dialogue.greeting).toBeDefined();
        expect(Array.isArray(figure.dialogue.greeting.choices)).toBe(true);
        expect(figure.dialogue.greeting.text.length).toBeGreaterThan(0);
    });

    it.each(Object.entries(HISTORICAL_FIGURES))('"%s" dialogue choices all point to existing nodes', (key, figure) => {
        const nodes = Object.keys(figure.dialogue);
        for (const [nodeName, node] of Object.entries(figure.dialogue)) {
            for (const choice of node.choices) {
                expect(
                    nodes,
                    `In figure "${key}", node "${nodeName}", choice "${choice.text}" points to missing node "${choice.next}"`
                ).toContain(choice.next);
            }
        }
    });

    it.each(Object.entries(HISTORICAL_FIGURES))('"%s" has a farewell node with no choices', (key, figure) => {
        expect(figure.dialogue.farewell).toBeDefined();
        expect(figure.dialogue.farewell.choices).toEqual([]);
    });
});

describe('TREASURES', () => {
    it('exports at least one treasure', () => {
        expect(Object.keys(TREASURES).length).toBeGreaterThan(0);
    });

    it.each(Object.entries(TREASURES))('treasure "%s" has name and desc', (key, treasure) => {
        expect(typeof treasure.name).toBe('string');
        expect(treasure.name.length).toBeGreaterThan(0);
        expect(typeof treasure.desc).toBe('string');
        expect(treasure.desc.length).toBeGreaterThan(0);
    });
});

describe('HEALING_ITEMS', () => {
    it('exports at least one healing item', () => {
        expect(Object.keys(HEALING_ITEMS).length).toBeGreaterThan(0);
    });

    it.each(Object.entries(HEALING_ITEMS))('healing item "%s" has a positive integer healing value', (key, item) => {
        expect(typeof item.name).toBe('string');
        expect(item.name.length).toBeGreaterThan(0);
        expect(typeof item.desc).toBe('string');
        expect(item.desc.length).toBeGreaterThan(0);
        expect(typeof item.healing).toBe('number');
        expect(item.healing).toBeGreaterThan(0);
        expect(Number.isInteger(item.healing)).toBe(true);
    });

    it('healing values are in ascending order by item type', () => {
        const values = Object.values(HEALING_ITEMS).map(i => i.healing);
        const sorted = [...values].sort((a, b) => a - b);
        expect(values).toEqual(sorted);
    });
});
