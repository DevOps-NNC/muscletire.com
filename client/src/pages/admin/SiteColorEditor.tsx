import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { TemplatePalette } from "@shared/siteTemplate";
import { useEffect, useState } from "react";

type PaletteKey = keyof Omit<TemplatePalette, "name">;

const paletteGroups: Array<{ label: string; fields: Array<{ key: PaletteKey; label: string; description: string }> }> = [
  {
    label: "Text",
    fields: [
      { key: "foreground", label: "Light surface text", description: "Headings and readable text on paper or card surfaces." },
      { key: "mutedForeground", label: "Muted body text", description: "Supporting copy, metadata, placeholders, and descriptions." },
      { key: "darkSurfaceForeground", label: "Dark surface text", description: "Headings and copy on dark hero, footer, and section backgrounds." },
      { key: "primaryForeground", label: "Primary button text", description: "Text and icons placed on the orange action color." },
    ],
  },
  {
    label: "UI and surfaces",
    fields: [
      { key: "primary", label: "Primary action", description: "Buttons, links, focus rings, and conversion accents." },
      { key: "accent", label: "Accent", description: "Stars, supporting emphasis, and secondary highlights." },
      { key: "background", label: "Page background", description: "The light canvas used behind public sections and forms." },
      { key: "surface", label: "Card surface", description: "Cards, inputs, dialogs, and elevated containers." },
      { key: "darkSurface", label: "Dark surface", description: "Hero, footer, dark editorial sections, and contrast panels." },
      { key: "secondary", label: "Borders and soft surfaces", description: "Dividers, input borders, chips, and secondary UI surfaces." },
    ],
  },
];

function colorInputValue(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
}

export default function SiteColorEditor({ palette, onChange }: { palette: TemplatePalette; onChange: (palette: TemplatePalette) => void }) {
  const [draftValues, setDraftValues] = useState<Record<PaletteKey, string>>(() => ({ ...palette }));

  useEffect(() => setDraftValues({ ...palette }), [palette]);

  const updateColor = (key: PaletteKey, value: string) => {
    setDraftValues(current => ({ ...current, [key]: value }));
    if (/^#[0-9a-f]{6}$/i.test(value)) onChange({ ...palette, [key]: value });
  };

  return <Card>
    <CardHeader className="pb-3">
      <CardTitle>Site colors</CardTitle>
      <CardDescription>Adjust text contrast and UI surfaces for the public site. Changes stay in the Page Editor until you save.</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-6">
      {paletteGroups.map(group => <section key={group.label} className="grid gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[.14em] text-primary">{group.label}</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {group.fields.map(field => <div key={field.key} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3">
              <div className="min-w-0">
                <Label htmlFor={`site-color-${field.key}`} className="font-bold">{field.label}</Label>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{field.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <input
                  id={`site-color-${field.key}`}
                  aria-label={field.label}
                  type="color"
                  value={colorInputValue(palette[field.key])}
                  onChange={event => updateColor(field.key, event.target.value)}
                  className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-background p-1"
                />
                <input
                  aria-label={`${field.label} hex value`}
                  value={draftValues[field.key]}
                  onChange={event => updateColor(field.key, event.target.value)}
                  onBlur={() => {
                    if (!/^#[0-9a-f]{6}$/i.test(draftValues[field.key])) setDraftValues(current => ({ ...current, [field.key]: palette[field.key] }));
                  }}
                  className="h-11 w-24 rounded-lg border border-border bg-background px-2 font-mono text-xs text-foreground"
                  inputMode="text"
                  maxLength={7}
                />
              </div>
            </div>)}
          </div>
        </div>
      </section>)}
    </CardContent>
  </Card>;
}
