CREATE TABLE "rls_org_example" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"organization_id" varchar(128) NOT NULL,
	"public_token" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "rls_org_example" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rls_org_example" ADD CONSTRAINT "rls_org_example_organization_id_users_user_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rls_org_example_public_token_idx" ON "rls_org_example" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "rls_org_example_organization_id_idx" ON "rls_org_example" USING btree ("organization_id");