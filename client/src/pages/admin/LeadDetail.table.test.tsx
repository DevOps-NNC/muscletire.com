import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TableGroup } from "./LeadDetail";

describe("TableGroup", () => {
  it("renders a labeled intake section with accessible header and detail cells", () => {
    const markup = renderToStaticMarkup(
      <table>
        <TableGroup
          title="Customer contact"
          rows={[
            ["Phone", "407-555-0100"],
            ["Email", "customer@example.com"],
          ]}
        />
      </table>,
    );

    expect(markup).toContain("Customer contact");
    expect(markup).toContain("Phone");
    expect(markup).toContain("407-555-0100");
    expect(markup).toContain("Email");
  });
});
