"use client";

import { useState } from "react";
import { api, ApiError } from "@/components/admin/api";
import { useToast } from "@/components/providers/toast";
import { AdminCard, AdminField, Alert } from "@/components/admin/ui";
import { ImageInput } from "@/components/admin/image-input";
import { IconPlus, IconTrash } from "@/components/icons";

type Hero = {
  eyebrow: string;
  heading: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  image: string;
  stats: { value: string; label: string }[];
};

type Highlights = { title: string; items: { icon: string; title: string; text: string }[] };

type About = {
  title: string;
  story: string;
  philosophy: string;
  chefName: string;
  chefTitle: string;
  chefNote: string;
  images: string[];
  stats: { value: string; label: string }[];
};

const ICONS = ["leaf", "flame", "shield", "clock", "users", "scooter", "star", "spark"];

export function ContentForm({ hero, highlights, about }: { hero: Hero; highlights: Highlights; about: About }) {
  const { toast } = useToast();
  const [heroForm, setHeroForm] = useState<Hero>(hero);
  const [highlightsForm, setHighlightsForm] = useState<Highlights>(highlights);
  const [aboutForm, setAboutForm] = useState<About>(about);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveBlock = async (key: string, data: unknown) => {
    setSaving(key);
    setError(null);
    try {
      await api.put("/api/admin/content", { key, data });
      toast("Content saved — the website updates within a minute.", "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save that content block.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-5">
      {error ? <Alert kind="error">{error}</Alert> : null}

      <AdminCard
        title="Home page hero"
        description="The first thing every visitor sees."
        action={
          <button type="button" className="btn btn-sm btn-primary" onClick={() => saveBlock("home.hero", heroForm)} disabled={saving === "home.hero"}>
            {saving === "home.hero" ? "Saving…" : "Save hero"}
          </button>
        }
      >
        <div className="space-y-4">
          <AdminField label="Eyebrow" id="h-eyebrow" hint="small line above the heading">
            <input id="h-eyebrow" className="field" value={heroForm.eyebrow} onChange={(event) => setHeroForm({ ...heroForm, eyebrow: event.target.value })} />
          </AdminField>
          <AdminField label="Heading" id="h-heading" hint="press Enter for a line break — the second line is highlighted">
            <textarea id="h-heading" className="field min-h-20" value={heroForm.heading} onChange={(event) => setHeroForm({ ...heroForm, heading: event.target.value })} />
          </AdminField>
          <AdminField label="Description" id="h-desc">
            <textarea id="h-desc" className="field min-h-24" value={heroForm.description} onChange={(event) => setHeroForm({ ...heroForm, description: event.target.value })} />
          </AdminField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Primary button text" id="h-cta1">
              <input id="h-cta1" className="field" value={heroForm.primaryCta} onChange={(event) => setHeroForm({ ...heroForm, primaryCta: event.target.value })} />
            </AdminField>
            <AdminField label="Secondary button text" id="h-cta2">
              <input id="h-cta2" className="field" value={heroForm.secondaryCta} onChange={(event) => setHeroForm({ ...heroForm, secondaryCta: event.target.value })} />
            </AdminField>
          </div>
          <ImageInput label="Hero background" id="h-image" value={heroForm.image} onChange={(url) => setHeroForm({ ...heroForm, image: url })} />

          <fieldset className="rounded-xl border border-ink-100 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">Hero stats</legend>
            <div className="space-y-2">
              {heroForm.stats.map((stat, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className="field w-28"
                    value={stat.value}
                    placeholder="12+"
                    aria-label={`Stat ${index + 1} value`}
                    onChange={(event) => {
                      const stats = [...heroForm.stats];
                      stats[index] = { ...stat, value: event.target.value };
                      setHeroForm({ ...heroForm, stats });
                    }}
                  />
                  <input
                    className="field flex-1"
                    value={stat.label}
                    placeholder="Years of dhaba cooking"
                    aria-label={`Stat ${index + 1} label`}
                    onChange={(event) => {
                      const stats = [...heroForm.stats];
                      stats[index] = { ...stat, label: event.target.value };
                      setHeroForm({ ...heroForm, stats });
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => setHeroForm({ ...heroForm, stats: heroForm.stats.filter((_, i) => i !== index) })}
                    aria-label={`Remove stat ${index + 1}`}
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline mt-3"
              onClick={() => setHeroForm({ ...heroForm, stats: [...heroForm.stats, { value: "", label: "" }] })}
            >
              <IconPlus className="h-4 w-4" /> Add stat
            </button>
          </fieldset>
        </div>
      </AdminCard>

      <AdminCard
        title="Highlights"
        description="The feature cards below the hero."
        action={
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => saveBlock("home.highlights", highlightsForm)}
            disabled={saving === "home.highlights"}
          >
            {saving === "home.highlights" ? "Saving…" : "Save highlights"}
          </button>
        }
      >
        <AdminField label="Section title" id="hl-title">
          <input id="hl-title" className="field" value={highlightsForm.title} onChange={(event) => setHighlightsForm({ ...highlightsForm, title: event.target.value })} />
        </AdminField>

        <div className="mt-4 space-y-3">
          {highlightsForm.items.map((item, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-ink-100 p-3 sm:grid-cols-[140px_1fr_auto]">
              <select
                className="field"
                value={item.icon}
                aria-label={`Highlight ${index + 1} icon`}
                onChange={(event) => {
                  const items = [...highlightsForm.items];
                  items[index] = { ...item, icon: event.target.value };
                  setHighlightsForm({ ...highlightsForm, items });
                }}
              >
                {ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
              <div className="space-y-2">
                <input
                  className="field"
                  value={item.title}
                  placeholder="Fresh Ingredients"
                  aria-label={`Highlight ${index + 1} title`}
                  onChange={(event) => {
                    const items = [...highlightsForm.items];
                    items[index] = { ...item, title: event.target.value };
                    setHighlightsForm({ ...highlightsForm, items });
                  }}
                />
                <input
                  className="field"
                  value={item.text}
                  placeholder="Vegetables cut daily…"
                  aria-label={`Highlight ${index + 1} text`}
                  onChange={(event) => {
                    const items = [...highlightsForm.items];
                    items[index] = { ...item, text: event.target.value };
                    setHighlightsForm({ ...highlightsForm, items });
                  }}
                />
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline self-start"
                onClick={() => setHighlightsForm({ ...highlightsForm, items: highlightsForm.items.filter((_, i) => i !== index) })}
                aria-label={`Remove highlight ${index + 1}`}
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline mt-3"
          onClick={() => setHighlightsForm({ ...highlightsForm, items: [...highlightsForm.items, { icon: "spark", title: "", text: "" }] })}
        >
          <IconPlus className="h-4 w-4" /> Add highlight
        </button>
      </AdminCard>

      <AdminCard
        title="About page"
        description="Your story, the chef and the numbers you're proud of."
        action={
          <button type="button" className="btn btn-sm btn-primary" onClick={() => saveBlock("about", aboutForm)} disabled={saving === "about"}>
            {saving === "about" ? "Saving…" : "Save about"}
          </button>
        }
      >
        <div className="space-y-4">
          <AdminField label="Page title" id="a-title">
            <input id="a-title" className="field" value={aboutForm.title} onChange={(event) => setAboutForm({ ...aboutForm, title: event.target.value })} />
          </AdminField>
          <AdminField label="Story" id="a-story" hint="leave a blank line between paragraphs">
            <textarea id="a-story" className="field min-h-40" value={aboutForm.story} onChange={(event) => setAboutForm({ ...aboutForm, story: event.target.value })} />
          </AdminField>
          <AdminField label="Philosophy quote" id="a-philosophy">
            <textarea id="a-philosophy" className="field min-h-20" value={aboutForm.philosophy} onChange={(event) => setAboutForm({ ...aboutForm, philosophy: event.target.value })} />
          </AdminField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Chef name" id="a-chef">
              <input id="a-chef" className="field" value={aboutForm.chefName} onChange={(event) => setAboutForm({ ...aboutForm, chefName: event.target.value })} />
            </AdminField>
            <AdminField label="Chef title" id="a-chef-title">
              <input id="a-chef-title" className="field" value={aboutForm.chefTitle} onChange={(event) => setAboutForm({ ...aboutForm, chefTitle: event.target.value })} />
            </AdminField>
          </div>
          <AdminField label="Chef quote" id="a-chef-note">
            <textarea id="a-chef-note" className="field min-h-20" value={aboutForm.chefNote} onChange={(event) => setAboutForm({ ...aboutForm, chefNote: event.target.value })} />
          </AdminField>

          <fieldset className="rounded-xl border border-ink-100 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">About images</legend>
            <div className="space-y-3">
              {aboutForm.images.map((image, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1">
                    <ImageInput
                      label={`Image ${index + 1}`}
                      id={`a-image-${index}`}
                      value={image}
                      onChange={(url) => {
                        const images = [...aboutForm.images];
                        images[index] = url;
                        setAboutForm({ ...aboutForm, images });
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline mt-7"
                    onClick={() => setAboutForm({ ...aboutForm, images: aboutForm.images.filter((_, i) => i !== index) })}
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline mt-3"
              onClick={() => setAboutForm({ ...aboutForm, images: [...aboutForm.images, ""] })}
            >
              <IconPlus className="h-4 w-4" /> Add image
            </button>
          </fieldset>

          <fieldset className="rounded-xl border border-ink-100 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">About stats</legend>
            <div className="space-y-2">
              {aboutForm.stats.map((stat, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className="field w-28"
                    value={stat.value}
                    aria-label={`About stat ${index + 1} value`}
                    onChange={(event) => {
                      const stats = [...aboutForm.stats];
                      stats[index] = { ...stat, value: event.target.value };
                      setAboutForm({ ...aboutForm, stats });
                    }}
                  />
                  <input
                    className="field flex-1"
                    value={stat.label}
                    aria-label={`About stat ${index + 1} label`}
                    onChange={(event) => {
                      const stats = [...aboutForm.stats];
                      stats[index] = { ...stat, label: event.target.value };
                      setAboutForm({ ...aboutForm, stats });
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => setAboutForm({ ...aboutForm, stats: aboutForm.stats.filter((_, i) => i !== index) })}
                    aria-label={`Remove about stat ${index + 1}`}
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline mt-3"
              onClick={() => setAboutForm({ ...aboutForm, stats: [...aboutForm.stats, { value: "", label: "" }] })}
            >
              <IconPlus className="h-4 w-4" /> Add stat
            </button>
          </fieldset>
        </div>
      </AdminCard>
    </div>
  );
}
