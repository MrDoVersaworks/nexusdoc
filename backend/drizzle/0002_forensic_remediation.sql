-- Forensic remediation migration.
-- This migration intentionally fails on case-colliding legacy identities instead of
-- silently choosing an account to merge.

DO $$
BEGIN
  IF EXISTS (
    SELECT lower(email)
    FROM users
    GROUP BY lower(email)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot normalize user emails: case-insensitive duplicates exist. Reconcile duplicate accounts before applying migration 0002.';
  END IF;
END $$;
--> statement-breakpoint

UPDATE users SET email = lower(trim(email));
--> statement-breakpoint

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN IF NOT EXISTS encrypted_resend_key text;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN IF NOT EXISTS resend_key_iv varchar(32);
--> statement-breakpoint
ALTER TABLE users ADD COLUMN IF NOT EXISTS resend_key_tag varchar(32);
--> statement-breakpoint
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_email varchar(255);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users ((lower(email)));
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS storage_cleanup_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  blob_url text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reason varchar(100) NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  sender_name varchar(255) NOT NULL,
  sender_email varchar(255) NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  ai_screening_passed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  google_analytics_id varchar(50),
  termly_uuid varchar(50),
  privacy_policy_content text,
  terms_of_service_content text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

ALTER TABLE platform_reviews ADD COLUMN IF NOT EXISTS status varchar(20);
--> statement-breakpoint
UPDATE platform_reviews SET status = 'approved' WHERE status IS NULL OR status = '';
--> statement-breakpoint
ALTER TABLE platform_reviews ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE platform_reviews ALTER COLUMN status SET NOT NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS storage_cleanup_tasks_created_idx ON storage_cleanup_tasks (created_at);
CREATE INDEX IF NOT EXISTS contact_messages_created_idx ON contact_messages (created_at);
CREATE INDEX IF NOT EXISTS platform_reviews_status_created_idx ON platform_reviews (status, created_at);
