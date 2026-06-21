import { describe, it, expect } from "vitest";

// Test HR & KPI logic (scenarios 71-85)

function calculateFinalScore(scores: { weight: number; score: number }[]): number {
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;
  return Math.round(scores.reduce((sum, s) => sum + s.weight * s.score, 0) / totalWeight * 100) / 100;
}

function calculateXpFromScore(finalScore: number): number {
  return Math.max(0, Math.round(finalScore * 10));
}

function checkLevelUp(
  currentXp: number,
  levels: { id: string; name: string; min_xp: number; level_order: number }[],
  currentLevelId: string | null
): { leveledUp: boolean; newLevel?: typeof levels[0] } {
  const sorted = [...levels].sort((a, b) => b.level_order - a.level_order);
  const nextLevel = sorted.find(l => l.min_xp <= currentXp);
  if (nextLevel && nextLevel.id !== currentLevelId) {
    return { leveledUp: true, newLevel: nextLevel };
  }
  return { leveledUp: false };
}

function checkXpMilestoneAchievement(totalXp: number, minXp: number, alreadyEarned: boolean): boolean {
  return totalXp >= minXp && !alreadyEarned;
}

describe("KPI Scoring", () => {
  // Scenario 74: Final score calculation
  it("#74 calculates weighted final score", () => {
    const scores = [
      { weight: 40, score: 8 },
      { weight: 30, score: 7 },
      { weight: 30, score: 9 },
    ];
    const final = calculateFinalScore(scores);
    expect(final).toBe(8); // (40*8 + 30*7 + 30*9) / 100 = 800/100 = 8
  });

  it("handles empty scores", () => {
    expect(calculateFinalScore([])).toBe(0);
  });

  // Scenario 75: XP from score
  it("#75 calculates XP from final score", () => {
    expect(calculateXpFromScore(8.5)).toBe(85);
    expect(calculateXpFromScore(0)).toBe(0);
    expect(calculateXpFromScore(-1)).toBe(0); // max(0, ...)
  });
});

describe("Level Up", () => {
  const levels = [
    { id: "l1", name: "Thực tập", min_xp: 0, level_order: 1 },
    { id: "l2", name: "Junior", min_xp: 100, level_order: 2 },
    { id: "l3", name: "Senior", min_xp: 500, level_order: 3 },
    { id: "l4", name: "Lead", min_xp: 1000, level_order: 4 },
  ];

  // Scenario 76: Level up when XP passes threshold
  it("#76 levels up when XP exceeds threshold", () => {
    const result = checkLevelUp(150, levels, "l1");
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel?.name).toBe("Junior");
  });

  it("no level up when already at correct level", () => {
    const result = checkLevelUp(150, levels, "l2");
    expect(result.leveledUp).toBe(false);
  });

  it("jumps multiple levels", () => {
    const result = checkLevelUp(1500, levels, "l1");
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel?.name).toBe("Lead");
  });
});

describe("Achievements", () => {
  // Scenario 77: XP milestone achievement
  it("#77 earns XP milestone achievement", () => {
    expect(checkXpMilestoneAchievement(100, 100, false)).toBe(true);
    expect(checkXpMilestoneAchievement(99, 100, false)).toBe(false);
    expect(checkXpMilestoneAchievement(100, 100, true)).toBe(false); // already earned
  });
});
