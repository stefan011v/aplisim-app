import { describe, expect, it } from "vitest";
import {
  accessRequestStatusOptions,
  clientHealth,
  clientStatusClasses,
  clientStatusOptions,
  leadStageHealth,
  leadStatusClasses,
  prettyTicketStatus,
  ticketCategoryOptions,
  ticketPriorityClasses,
  ticketStatusOptions,
  toneClasses,
} from "./domain";

const allOptionLists = {
  clientStatusOptions,
  ticketStatusOptions,
  ticketCategoryOptions,
  accessRequestStatusOptions,
};

describe("option lists", () => {
  it.each(Object.entries(allOptionLists))(
    "%s has unique values and a label for each",
    (_name, options) => {
      const values = options.map((option) => option.value);

      expect(new Set(values).size).toBe(values.length);
      expect(options.every((option) => option.label)).toBe(true);
    }
  );
});

describe("labels", () => {
  it("maps a stored value to its display label", () => {
    expect(prettyTicketStatus("waiting_client")).toBe("Waiting client");
  });

  it("falls back to the raw value when it is not a known option", () => {
    expect(prettyTicketStatus("archived")).toBe("archived");
  });

  it("renders a dash for a missing value", () => {
    expect(prettyTicketStatus(null)).toBe("—");
  });
});

describe("tones", () => {
  it("gives every status its own class string", () => {
    expect(clientStatusClasses("active")).toContain("emerald");
    expect(clientStatusClasses("paused")).toContain("amber");
    expect(leadStatusClasses("lost")).toContain("rose");
    expect(ticketPriorityClasses("urgent")).toContain("rose");
  });

  it("falls back to the neutral tone for unknown values", () => {
    expect(clientStatusClasses("whatever")).toBe(toneClasses("indigo"));
    expect(ticketPriorityClasses(undefined)).toBe(toneClasses("indigo"));
  });
});

describe("health", () => {
  it("reads client health from status", () => {
    expect(clientHealth({ status: "active" }).label).toBe("Healthy");
    expect(clientHealth({ status: "closed" }).tone).toBe("slate");
  });

  it("handles a missing client without throwing", () => {
    expect(clientHealth(null).label).toBe("—");
  });

  it("reads lead stage health from status", () => {
    expect(leadStageHealth("won").label).toBe("Converted");
    expect(leadStageHealth("unknown").label).toBe("Early");
  });
});
