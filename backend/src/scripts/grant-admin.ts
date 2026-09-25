import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';

const userId = process.argv[2];
if (!userId) throw new Error('Usage: npm run admin:grant -- <user-uuid>');

const [updated] = await db.update(users).set({ is_admin: true, updated_at: new Date() }).where(eq(users.id, userId)).returning({
  id: users.id, email: users.email, is_admin: users.is_admin,
});

if (!updated) throw new Error('User not found.');
console.log(`Admin capability granted to ${updated.email} (${updated.id}).`);
