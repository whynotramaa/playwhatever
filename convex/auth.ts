import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { requireRunMutationCtx } from "@convex-dev/better-auth/utils";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { betterAuth } from "better-auth/minimal";
import { anonymous, emailOTP } from "better-auth/plugins";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL || "http://localhost:3000";

export const authComponent = createClient<DataModel>(components.betterAuth);

/**
 * Sends through Resend's REST API. No SDK: it is one POST.
 * Without RESEND_API_KEY the code goes to the Convex logs instead, so local
 * development works before email is set up.
 */
const sendEmail = async (to: string, subject: string, otp: string) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[auth] RESEND_API_KEY unset. Code for ${to} is ${otp}`);
    return;
  }
  const from = process.env.EMAIL_FROM || "PlayWhatever <onboarding@resend.dev>";
  // Resend rejects a malformed sender with a 422 that is easy to misread as
  // "email is broken". A shell eating the angle bracket in `convex env set`
  // is the usual cause, so say so here rather than in the logs of the 500.
  if (!/^[^<>]*<[^<>@\s]+@[^<>@\s]+>$|^[^<>@\s]+@[^<>@\s]+$/.test(from.trim())) {
    console.error(
      `[auth] EMAIL_FROM is malformed: ${JSON.stringify(from)}. ` +
        `Expected 'Name <user@your-verified-domain>'. Quote the value: ` +
        `npx convex env set EMAIL_FROM 'Name <user@domain>'`
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: `Your PlayWhatever code is ${otp}. It expires in 10 minutes. If you did not ask for it, ignore this email.`,
      html: `<div style="margin:0;background:#181824;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#f7f7ff">
  <div style="max-width:520px;margin:0 auto;position:relative;background:#232334;border:1px solid rgba(255,255,255,.12);border-radius:24px;overflow:hidden;box-shadow:0 12px 28px rgba(0,0,0,.28)">
    <div style="height:6px;background:#ff6652"></div>
    <div style="padding:28px 24px 32px">
      <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#c5c4d1">PlayWhatever <span style="color:#ff6652">✦</span></div>
      <div style="height:22px;line-height:22px;color:#ff6652;font-size:23px;letter-spacing:2px;transform:rotate(-3deg)">〰〰〰</div>
      <div style="margin:0 0 18px">
        <span style="display:inline-block;margin-right:6px;padding:7px 11px;background:#ded4ff;border:2px solid #f7f7ff;border-radius:999px;color:#363300;font-size:18px;line-height:1;transform:rotate(-7deg)">🎲</span>
        <span style="display:inline-block;padding:7px 11px;background:#d9f3e4;border:2px solid #f7f7ff;border-radius:999px;color:#363300;font-size:18px;line-height:1;transform:rotate(5deg)">🎟️</span>
      </div>
      <p style="margin:0 0 8px;font-size:26px;line-height:1.15;font-weight:700;color:#f7f7ff">${subject}</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#c5c4d1">Your six-digit code is ready. Drop it in and get back to your crew.</p>
      <div style="position:relative;margin:0 0 24px;padding:24px 18px;background:#f4e900;border-radius:16px;color:#363300;text-align:center">
        <div style="margin-bottom:8px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">Your room ticket</div>
        <div style="font-size:40px;line-height:1;font-weight:700;letter-spacing:.18em">${otp}</div>
        <div style="margin-top:12px;font-size:12px;opacity:.72">Expires in 10 minutes</div>
      </div>
      <div style="height:22px;line-height:22px;color:#ff6652;font-size:22px;letter-spacing:3px;text-align:right;transform:rotate(2deg)">〰〰</div>
      <p style="margin:0;font-size:13px;line-height:1.55;color:#8c8b99">If you did not ask for this code, you can ignore this email. No one else needs it.</p>
    </div>
  </div>
</div>`,
    }),
  });
  if (!response.ok) {
    // Surface the reason in the Convex logs. Better Auth turns a thrown error
    // into a generic failure, so without this line the cause is invisible.
    const detail = await response.text();
    console.error(`[auth] Resend ${response.status} for ${to} from ${from}: ${detail}`);
    throw new Error(`Resend rejected the email: ${response.status} ${detail}`);
  }
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    trustedOrigins: (process.env.TRUSTED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      // No session until the OTP is confirmed. This is what makes the login
      // page's "credentials, then code" flow the only way in.
      requireEmailVerification: true,
      minPasswordLength: 8,
    },
    emailVerification: {
      // The client always asks for the code explicitly. Better Auth's implicit
      // sends skip the existing-unverified-user case, which strands anyone who
      // signs up twice on a code screen that never receives a code.
      autoSignInAfterVerification: true,
    },
    socialProviders: {
      google: {
        enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
    plugins: [
      convex({ authConfig }),
      anonymous({
        // A guest who signs in keeps the room they are already sitting in.
        onLinkAccount: async ({ anonymousUser, newUser }) => {
          await requireRunMutationCtx(ctx).runMutation(internal.profiles.transferGuestData, {
            fromUserId: anonymousUser.user.id,
            toUserId: newUser.user.id,
          });
        },
      }),
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        allowedAttempts: 5,
        storeOTP: "hashed",
        overrideDefaultEmailVerification: true,
        sendVerificationOTP: async ({ email, otp, type }) => {
          const subject =
            type === "forget-password"
              ? "Reset your PlayWhatever password"
              : "Confirm your email for PlayWhatever";
          await sendEmail(email, subject, otp);
        },
      }),
    ],
  });
};
