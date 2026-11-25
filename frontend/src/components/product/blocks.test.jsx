import { act } from "react";
import { createRoot } from "react-dom/client";

jest.mock("@/components/common/primitives", () => ({
  SeverityBadge: () => null,
}), { virtual: true });

jest.mock("@/lib/format", () => ({
  severityColor: () => "#ffffff",
}), { virtual: true });

import { CorrelationPanel, AIPanel } from "./blocks";

describe("CorrelationPanel", () => {
  it("renders safely when correlation data is missing", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    expect(() => {
      act(() => {
        root.render(<CorrelationPanel correlation={undefined} />);
      });
    }).not.toThrow();

    expect(container.textContent).toContain("Available sources");
    expect(container.textContent).toContain("0");

    act(() => {
      root.unmount();
    });
  });
});

describe("AIPanel", () => {
  it("renders safely when AI analysis is missing", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    expect(() => {
      act(() => {
        root.render(<AIPanel ai={undefined} />);
      });
    }).not.toThrow();

    expect(container.textContent).toContain("Verdict");
    expect(container.textContent).toContain("UNKNOWN");

    act(() => {
      root.unmount();
    });
  });
});
