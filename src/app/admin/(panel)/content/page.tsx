import { NoAccess, requireAdminPage } from "@/lib/admin-guard";
import { getContent } from "@/lib/queries";
import { ContentForm } from "@/components/admin/content-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content" };

export default async function AdminContentPage() {
  if (!(await requireAdminPage("content.manage"))) return <NoAccess what="website content" />;

  const [hero, highlights, about] = await Promise.all([
    getContent("home.hero", {
      eyebrow: "",
      heading: "",
      description: "",
      primaryCta: "View Menu",
      secondaryCta: "Order Online",
      image: "/images/hero.webp",
      stats: [] as { value: string; label: string }[],
    }),
    getContent("home.highlights", { title: "", items: [] as { icon: string; title: string; text: string }[] }),
    getContent("about", {
      title: "",
      story: "",
      philosophy: "",
      chefName: "",
      chefTitle: "",
      chefNote: "",
      images: [] as string[],
      stats: [] as { value: string; label: string }[],
    }),
  ]);

  return <ContentForm hero={hero} highlights={highlights} about={about} />;
}
