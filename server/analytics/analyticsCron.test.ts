import { describe, expect, it } from "vitest";
import { previousCompletedWeek } from "./analyticsCron";

describe("analytics cron reporting windows", () => {
  it("selects the completed Monday through Sunday before the current week", () => {
    const range = previousCompletedWeek(new Date("2026-09-21T15:00:00.000Z"), "America/New_York");

    expect(range.startDate).toBe("2026-09-14");
    expect(range.endDate).toBe("2026-09-21");
    expect(range.isComplete).toBe(true);
  });
});
