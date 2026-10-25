// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Heading } from "../../app/components/heading";

// Component-test example: jsdom is enabled per-file via the docblock above,
// so node-env tests stay fast. Replace with real component tests per project.
afterEach(cleanup);

describe("<Heading />", () => {
  it("renders the title and optional subtitle", () => {
    render(<Heading title="Hello" subtitle="World" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Hello" }),
    ).toBeTruthy();
    expect(screen.getByText("World")).toBeTruthy();
  });

  it("omits the subtitle when not provided", () => {
    render(<Heading title="Hello" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Hello" }),
    ).toBeTruthy();
    expect(screen.queryByText("World")).toBeNull();
  });
});
