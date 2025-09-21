CREATE TABLE "feature_flags" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"default_state" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "feature_flags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "rls_example" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"public_token" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "rls_example" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_feature_flags" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"feature_flag_id" varchar(255) NOT NULL,
	"enabled" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "rls_example" ADD CONSTRAINT "rls_example_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feature_flags" ADD CONSTRAINT "user_feature_flags_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feature_flags" ADD CONSTRAINT "user_feature_flags_feature_flag_id_feature_flags_id_fk" FOREIGN KEY ("feature_flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feature_flags_name_idx" ON "feature_flags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "rls_example_public_token_idx" ON "rls_example" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "user_feature_flags_user_id_idx" ON "user_feature_flags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_feature_flags_feature_flag_id_idx" ON "user_feature_flags" USING btree ("feature_flag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_feature_flags_user_flag_unique" ON "user_feature_flags" USING btree ("user_id","feature_flag_id");