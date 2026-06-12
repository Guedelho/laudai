import { describe, expect, it } from "vitest";
import { splitBoldSegments } from "./utils";

describe("splitBoldSegments", () => {
  it("returns a single non-bold segment when there are no markers", () => {
    expect(splitBoldSegments("Fígado preservado.")).toEqual([{ text: "Fígado preservado.", bold: false }]);
  });

  it("splits bold markers into bold segments", () => {
    expect(splitBoldSegments("Rim esquerdo medindo **4,1 cm**, contornos regulares.")).toEqual([
      { text: "Rim esquerdo medindo ", bold: false },
      { text: "4,1 cm", bold: true },
      { text: ", contornos regulares.", bold: false },
    ]);
  });

  it("handles multiple and adjacent markers", () => {
    expect(splitBoldSegments("**a**b**c**")).toEqual([
      { text: "a", bold: true },
      { text: "b", bold: false },
      { text: "c", bold: true },
    ]);
  });

  it("spans line breaks inside a marker", () => {
    expect(splitBoldSegments("**linha um\nlinha dois**")).toEqual([{ text: "linha um\nlinha dois", bold: true }]);
  });

  it("keeps unterminated markers as plain text", () => {
    expect(splitBoldSegments("sem **fechamento")).toEqual([{ text: "sem **fechamento", bold: false }]);
  });

  it("returns the original text for the empty string", () => {
    expect(splitBoldSegments("")).toEqual([{ text: "", bold: false }]);
  });
});
