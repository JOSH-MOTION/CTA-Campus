// src/services/email.ts
'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailPayload) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Codetrain Campus <notifications@resend.dev>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend Error:', error);
      // We don't throw the error to the client to avoid blocking UI flow
      // for a non-critical email failure.
      return { success: false, error };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
};
