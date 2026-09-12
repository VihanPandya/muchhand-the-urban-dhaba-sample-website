import type { NextRequest } from "next/server";
import { fail, guardRate, handleError, ok } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { reservationSchema } from "@/lib/validation";
import { generateReservationReference } from "@/lib/orders";
import { notifyAdmins } from "@/lib/notifications";
import { getBusinessHours, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** POST /api/reservations — request a table. */
export async function POST(req: NextRequest) {
  const limited = guardRate(req, "reservations", 6, 60_000);
  if (limited) return limited;

  try {
    assertSameOrigin(req);
    const input = reservationSchema.parse(await req.json());

    const date = new Date(`${input.date}T00:00:00.000Z`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < new Date(today.getTime() - 86400000)) {
      return fail("Please choose today or a future date.", 422);
    }

    const hours = await getBusinessHours();
    const day = hours.find((h) => h.dayOfWeek === date.getUTCDay());
    if (day && !day.isOpen) {
      return fail("We're closed on that day. Please pick another date.", 422);
    }

    const settings = await getSettings();
    const customer = await prisma.customer.upsert({
      where: { phone: input.phone },
      create: { name: input.name, phone: input.phone, email: input.email },
      update: { name: input.name, email: input.email ?? undefined },
    });

    const reservation = await prisma.reservation.create({
      data: {
        reference: generateReservationReference(),
        customerId: customer.id,
        name: input.name,
        phone: input.phone,
        email: input.email,
        date,
        time: input.time,
        guests: input.guests,
        specialRequest: input.specialRequest,
      },
    });

    await notifyAdmins({
      type: "RESERVATION",
      title: `New reservation · ${reservation.reference}`,
      message: `${input.name} requested a table for ${input.guests} on ${input.date} at ${input.time}.`,
      link: "/admin/reservations",
      email: settings.notifyOnReservation
        ? {
            to: settings.notifyEmail,
            subject: `Table request ${reservation.reference} — ${input.date} ${input.time}`,
            body: `${input.name} (${input.phone}) requested a table for ${input.guests}.\nDate: ${input.date} ${input.time}\nNote: ${input.specialRequest ?? "—"}`,
          }
        : undefined,
    });

    return ok({ reference: reservation.reference, status: reservation.status }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
