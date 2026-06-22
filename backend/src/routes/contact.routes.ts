import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/connection.js';
import { contactMessages } from '../db/schema.js';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  ai_screening_passed: z.boolean().optional().default(false),
});

router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = contactSchema.parse(req.body);

    await db.insert(contactMessages).values({
      sender_name: parsed.name,
      sender_email: parsed.email,
      message: parsed.message,
      ai_screening_passed: parsed.ai_screening_passed,
    });

    const resendApiKey = process.env.RESEND_API_KEY;
    const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL;
    const sendingDomain = process.env.SYSTEM_SENDING_DOMAIN || 'onboarding@resend.dev';

    if (resendApiKey && receiverEmail) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: sendingDomain,
          to: receiverEmail,
          subject: `[NexusDoc] New Contact Message from ${parsed.name}`,
          html: `<p><strong>From:</strong> ${parsed.name} (${parsed.email})</p><p>${parsed.message}</p>`
        });
      } catch (emailErr) {
        console.error('[RESEND_DISPATCH_ERROR]', emailErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
      return;
    }
    next(error);
  }
});

export default router;
