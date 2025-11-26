// HUD Stats Animation - Subtle value fluctuations for digital life feel

interface StatConfig {
    element: HTMLElement | null;
    baseValue: number;
    variance: number;
    format: (value: number) => string;
    updateInterval: number;
    lastUpdate: number;
}

const stats: Map<string, StatConfig> = new Map();

export function initHUD(): void {
    // Cognitive Load - fluctuates between 82-92%
    const cognitive = document.querySelector('[data-stat="cognitive"]') as HTMLElement;
    if (cognitive) {
        stats.set('cognitive', {
            element: cognitive,
            baseValue: 87.3,
            variance: 5,
            format: (v) => `${v.toFixed(1)}%`,
            updateInterval: 2000 + Math.random() * 1000,
            lastUpdate: 0,
        });
    }

    // Caffeine Half-Life - slowly decreases then jumps up
    const caffeine = document.querySelector('[data-stat="caffeine"]') as HTMLElement;
    if (caffeine) {
        stats.set('caffeine', {
            element: caffeine,
            baseValue: 4.2,
            variance: 0.3,
            format: (v) => `${v.toFixed(1)}h`,
            updateInterval: 5000 + Math.random() * 2000,
            lastUpdate: 0,
        });
    }

    // Abstraction Layers - occasionally shifts
    const layers = document.querySelector('[data-stat="layers"]') as HTMLElement;
    if (layers) {
        stats.set('layers', {
            element: layers,
            baseValue: 7,
            variance: 2,
            format: (v) => `${Math.round(v)}`,
            updateInterval: 8000 + Math.random() * 4000,
            lastUpdate: 0,
        });
    }

    // Reality Sync - high but fluctuates slightly
    const sync = document.querySelector('[data-stat="sync"]') as HTMLElement;
    if (sync) {
        stats.set('sync', {
            element: sync,
            baseValue: 98.7,
            variance: 1.5,
            format: (v) => `${v.toFixed(1)}%`,
            updateInterval: 3000 + Math.random() * 2000,
            lastUpdate: 0,
        });
    }

    // Entropy Resistance - text status that occasionally changes
    const entropy = document.querySelector('[data-stat="entropy"]') as HTMLElement;
    if (entropy) {
        stats.set('entropy', {
            element: entropy,
            baseValue: 0,
            variance: 0,
            format: () => {
                const states = ['NOMINAL', 'STABLE', 'OPTIMAL', 'NOMINAL', 'NOMINAL'];
                return states[Math.floor(Math.random() * states.length)];
            },
            updateInterval: 10000 + Math.random() * 5000,
            lastUpdate: 0,
        });
    }
}

export function updateHUD(elapsedTime: number): void {
    const now = elapsedTime * 1000; // Convert to ms

    stats.forEach((config, _key) => {
        if (now - config.lastUpdate > config.updateInterval) {
            if (config.element) {
                let newValue: number;
                if (config.variance > 0) {
                    newValue = config.baseValue + (Math.random() - 0.5) * 2 * config.variance;
                } else {
                    newValue = config.baseValue;
                }

                // Glitch effect - brief text scramble
                const originalText = config.format(newValue);
                config.element.textContent = scrambleText(originalText);

                // Restore after brief delay
                setTimeout(() => {
                    if (config.element) {
                        config.element.textContent = originalText;
                    }
                }, 50);

                config.lastUpdate = now;
                config.updateInterval = getBaseInterval(config) + Math.random() * 2000;
            }
        }
    });
}

function getBaseInterval(config: StatConfig): number {
    // Return a reasonable base interval
    if (config.variance === 0) return 10000;
    if (config.variance < 1) return 5000;
    if (config.variance < 3) return 3000;
    return 2000;
}

function scrambleText(text: string): string {
    const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?0123456789';
    let result = '';
    for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ' || text[i] === '.' || text[i] === '%') {
            result += text[i];
        } else {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
    }
    return result;
}
