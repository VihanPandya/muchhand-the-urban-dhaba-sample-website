import type { NextRequest } from "next/server";
import { guardRate, handleError, ok } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validation";
import { notifyAdmins } from "@/lib/notifications";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** POST /api/contact — contact form submissions land in the admin inbox. */
export async function POST(req: NextRequest) {
  const limited = guardRate(req, "contact", 5, 60_000);
  if (limited) return limited;

  try {
    assertSameOrigin(req);
    const input = contactSchema.parse(await req.json());
    const settings = await getSettings();

    const message = await prisma.contactMessage.create({ data: input });

    await notifyAdmins({
      type: "CONTACT",
      title: "New enquiry",
      message: `${input.name}: ${input.subject}`,
      link: "/admin/messages",
      email: settings.notifyOnContact
        ? {
            to: settings.notifyEmail,
            subject: `Website enquiry — ${input.subject}`,
            body: `${input.name} (${input.phone})\n${input.email ?? ""}\n\n${input.message}`,
          }
        : undefined,
    });

    return ok({ id: message.id }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
