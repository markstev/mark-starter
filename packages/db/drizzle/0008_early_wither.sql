CREATE TABLE "organization_feature_flags" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"organization_id" varchar(128) NOT NULL,
	"feature_flag_id" varchar(255) NOT NULL,
	"enabled" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "organization_feature_flags" ADD CONSTRAINT "organization_feature_flags_feature_flag_id_feature_flags_id_fk" FOREIGN KEY ("feature_flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_feature_flags_organization_id_idx" ON "organization_feature_flags" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_feature_flags_feature_flag_id_idx" ON "organization_feature_flags" USING btree ("feature_flag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_feature_flags_organization_flag_unique" ON "organization_feature_flags" USING btree ("organization_id","feature_flag_id");