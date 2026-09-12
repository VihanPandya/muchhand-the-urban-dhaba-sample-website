import "server-only";
import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Notifications land in the admin dashboard first. Email and WhatsApp delivery
 * are optional providers: when the credentials are absent we say so in the log
 * rather than pretending a message went out.
 */
export async function notifyAdmins(input: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  email?: { to?: string | null; subject: string; body: string };
}): Promise<void> {
  await prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
    },
  });

  if (input.email?.to) {
    await sendEmail(input.email.to, input.email.subject, input.email.body);
  }
}

export type EmailResult = { delivered: boolean; reason?: string };

export async function sendEmail(to: string, subject: string, body: string): Promise<EmailResult> {
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.info(`[email] skipped — EMAIL_API_KEY/EMAIL_FROM not configured. Would send "${subject}" to ${to}`);
    return { delivered: false, reason: "not-configured" };
  }

  // Resend-compatible payload; swap the endpoint for any other provider.
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from, to, subject, text: body }),
    });
    if (!response.ok) {
      const reason = await response.text();
      console.error("[email] provider rejected the message", response.status, reason);
      return { delivered: false, reason: `provider-${response.status}` };
    }
    return { delivered: true };
  } catch (error) {
    console.error("[email] delivery failed", error);
    return { delivered: false, reason: "network" };
  }
}
