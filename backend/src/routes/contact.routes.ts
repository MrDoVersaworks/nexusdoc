import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/connection.js';
import { contactMessages } from '../db/schema.js';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import { contactRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  email: z.string().trim().email('Invalid email address').max(255),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000),
  website: z.string().max(255).optional(),
});

router.post('/', contactRateLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = contactSchema.parse(req.body);

    // Honeypot: legitimate clients never populate this field.
    if (parsed.website && parsed.website.trim().length > 0) {
      res.status(202).json({ success: true, message: 'Message received.' });
      return;
    }

    await db.insert(contactMessages).values({
      sender_name: parsed.name,
      sender_email: parsed.email,
      message: parsed.message,
      ai_screening_passed: false,
    });

    const resendApiKey = process.env.RESEND_API_KEY;
    const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL;
    const sendingDomain = process.env.SYSTEM_SENDING_DOMAIN;

    if (resendApiKey && receiverEmail && sendingDomain) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: sendingDomain,
          to: receiverEmail,
          subject: `[NexusDoc] New Contact Message from ${parsed.name}`,
          text: `From: ${parsed.name} (${parsed.email})\n\n${parsed.message}`,
        });
      } catch (emailErr) {
        // Persistence is authoritative; failed notification remains visible in admin inbox.
        console.error('[RESEND_DISPATCH_ERROR]', emailErr);
      }
    }

    res.status(201).json({ success: true, message: 'Message received successfully.' });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400, 'ERR_VALIDATION'));
      return;
    }
    next(error);
  }
});

export default router;
