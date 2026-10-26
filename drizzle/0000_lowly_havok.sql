CREATE TABLE "users" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"kakao_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_kakao_id_unique" UNIQUE("kakao_id")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"user_id" varchar(16) NOT NULL,
	"itinerary_id" varchar(12) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_itinerary_id_pk" PRIMARY KEY("user_id","itinerary_id")
);
--> statement-breakpoint
CREATE TABLE "saved_itineraries" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"owner_id" varchar(16) NOT NULL,
	"break_start" date NOT NULL,
	"region_code" varchar(16) NOT NULL,
	"picks" jsonb NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_itinerary_id_saved_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."saved_itineraries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_itineraries" ADD CONSTRAINT "saved_itineraries_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "favorites_user_created" ON "favorites" USING btree ("user_id","created_at");