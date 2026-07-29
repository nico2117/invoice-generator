CREATE EXTENSION IF NOT EXISTS unaccent;
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firmenname" text NOT NULL,
	"anrede" text NOT NULL,
	"titel" text,
	"ansprechperson" text,
	"nachname" text NOT NULL,
	"strasse" text NOT NULL,
	"hausnummer" text NOT NULL,
	"plz" text NOT NULL,
	"ort" text NOT NULL,
	"email" text,
	"notiz" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_counters" (
	"jahr" integer PRIMARY KEY NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jahr" integer NOT NULL,
	"rechnungsnummer" integer NOT NULL,
	"template_id" text NOT NULL,
	"contact_id" uuid,
	"empfaenger_snapshot" jsonb NOT NULL,
	"form_data" jsonb NOT NULL,
	"settings_snapshot" jsonb NOT NULL,
	"betrag_gesamt" numeric(12, 2) NOT NULL,
	"pdf_blob_url" text NOT NULL,
	"pdf_filename" text NOT NULL,
	"pdf_sha256" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"vereinsname" text DEFAULT '' NOT NULL,
	"strasse" text DEFAULT '' NOT NULL,
	"plz" text DEFAULT '' NOT NULL,
	"ort" text DEFAULT '' NOT NULL,
	"zvr_zahl" text DEFAULT '' NOT NULL,
	"bankname" text DEFAULT '' NOT NULL,
	"iban" text DEFAULT '' NOT NULL,
	"bic" text DEFAULT '' NOT NULL,
	"kleinunternehmer_hinweis" text DEFAULT 'Im Betrag ist keine Vorsteuer enthalten.' NOT NULL,
	"logo_blob_url" text,
	"sig1_name" text DEFAULT '' NOT NULL,
	"sig1_rolle" text DEFAULT '' NOT NULL,
	"sig2_name" text DEFAULT '' NOT NULL,
	"sig2_rolle" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_single_row" CHECK ("settings"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_jahr_nummer_idx" ON "invoices" USING btree ("jahr","rechnungsnummer");--> statement-breakpoint
CREATE INDEX "invoices_created_at_idx" ON "invoices" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "invoices_jahr_idx" ON "invoices" USING btree ("jahr");