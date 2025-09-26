CREATE TABLE "rls_comment" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"parent_example_id" varchar(255) NOT NULL,
	"text" text NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "rls_comment" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
--> statement-breakpoint
ALTER TABLE "rls_comment" ADD CONSTRAINT "rls_comment_parent_example_id_rls_example_id_fk" FOREIGN KEY ("parent_example_id") REFERENCES "public"."rls_example"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rls_comment" ADD CONSTRAINT "rls_comment_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rls_comment_user_id_idx" ON "rls_comment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rls_comment_parent_example_id_idx" ON "rls_comment" USING btree ("parent_example_id");--> statement-breakpoint