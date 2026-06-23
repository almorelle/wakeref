-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
                                   id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
                                   name text NOT NULL UNIQUE,
                                   slug text NOT NULL UNIQUE,
                                   color text,
                                   sort_order integer DEFAULT 0,
                                   CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.figures (
                                id integer NOT NULL DEFAULT nextval('figures_id_seq'::regclass),
                                slug text NOT NULL UNIQUE,
                                name text NOT NULL,
                                category_id integer,
                                sport USER-DEFINED NOT NULL DEFAULT 'wakeboard'::sport_type,
                                difficulty smallint NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
                                description text,
                                description_en text,
                                tips ARRAY,
                                tips_en ARRAY,
                                is_switch boolean NOT NULL DEFAULT false,
                                switch_of integer,
                                published boolean NOT NULL DEFAULT true,
                                created_at timestamp with time zone DEFAULT now(),
                                updated_at timestamp with time zone DEFAULT now(),
                                contexts ARRAY,
                                approach ARRAY,
                                rotation ARRAY,
                                inverted boolean NOT NULL DEFAULT false,
                                rewind boolean NOT NULL DEFAULT false,
                                spin smallint NOT NULL DEFAULT 0,
                                inverts smallint NOT NULL DEFAULT 0,
                                rewind_degs ARRAY NOT NULL DEFAULT '{}'::smallint[],
                                built_on_id integer,
                                rotation_type ARRAY NOT NULL DEFAULT '{}'::text[] CHECK (rotation_type <@ ARRAY['ole'::text, 'handle_pass'::text]),
                                sports ARRAY NOT NULL,
                                tips_seated ARRAY,
                                tips_seated_en ARRAY,
                                tips_wakeskate ARRAY,
                                tips_wakeskate_en ARRAY,
                                CONSTRAINT figures_pkey PRIMARY KEY (id),
                                CONSTRAINT figures_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
                                CONSTRAINT figures_switch_of_fkey FOREIGN KEY (switch_of) REFERENCES public.figures(id),
                                CONSTRAINT figures_built_on_id_fkey FOREIGN KEY (built_on_id) REFERENCES public.figures(id)
);
CREATE TABLE public.prerequisites (
                                      figure_id integer NOT NULL,
                                      requires_id integer NOT NULL,
                                      CONSTRAINT prerequisites_pkey PRIMARY KEY (figure_id, requires_id),
                                      CONSTRAINT prerequisites_figure_id_fkey FOREIGN KEY (figure_id) REFERENCES public.figures(id),
                                      CONSTRAINT prerequisites_requires_id_fkey FOREIGN KEY (requires_id) REFERENCES public.figures(id)
);
CREATE TABLE public.videos (
                               id integer NOT NULL DEFAULT nextval('videos_id_seq'::regclass),
                               figure_id integer NOT NULL,
                               title text,
                               file_path text,
                               source_type USER-DEFINED NOT NULL DEFAULT 'upload'::video_source,
                               source_url text,
                               creator_name text,
                               creator_url text,
                               caption text,
                               takedown_requested boolean NOT NULL DEFAULT false,
                               takedown_email text,
                               takedown_at timestamp with time zone,
                               sort_order integer DEFAULT 0,
                               uploaded_at timestamp with time zone DEFAULT now(),
                               sport USER-DEFINED,
                               performer_gender text CHECK (performer_gender = ANY (ARRAY['man'::text, 'woman'::text, 'other'::text])),
                               CONSTRAINT videos_pkey PRIMARY KEY (id),
                               CONSTRAINT videos_figure_id_fkey FOREIGN KEY (figure_id) REFERENCES public.figures(id)
);
CREATE TABLE public.takedown_requests (
                                          id integer NOT NULL DEFAULT nextval('takedown_requests_id_seq'::regclass),
                                          video_id integer,
                                          name text,
                                          email text NOT NULL,
                                          message text,
                                          handled boolean NOT NULL DEFAULT false,
                                          created_at timestamp with time zone DEFAULT now(),
                                          CONSTRAINT takedown_requests_pkey PRIMARY KEY (id),
                                          CONSTRAINT takedown_requests_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id)
);
CREATE TABLE public.video_submissions (
                                          id integer NOT NULL DEFAULT nextval('video_submissions_id_seq'::regclass),
                                          figure_id integer NOT NULL,
                                          source_url text NOT NULL,
                                          title text,
                                          creator_name text,
                                          creator_url text,
                                          caption text,
                                          status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
                                          submitted_at timestamp with time zone DEFAULT now(),
                                          CONSTRAINT video_submissions_pkey PRIMARY KEY (id),
                                          CONSTRAINT video_submissions_figure_id_fkey FOREIGN KEY (figure_id) REFERENCES public.figures(id)
);
CREATE TABLE public.compositions (
                                     id text NOT NULL,
                                     name text CHECK (name IS NULL OR char_length(name) <= 80),
                                     data jsonb NOT NULL CHECK (pg_column_size(data) <= 51200),
                                     score integer,
                                     created_at timestamp with time zone NOT NULL DEFAULT now(),
                                     CONSTRAINT compositions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.figure_views (
                                     figure_id integer NOT NULL,
                                     day date NOT NULL DEFAULT CURRENT_DATE,
                                     views integer NOT NULL DEFAULT 0,
                                     CONSTRAINT figure_views_pkey PRIMARY KEY (figure_id, day),
                                     CONSTRAINT figure_views_figure_id_fkey FOREIGN KEY (figure_id) REFERENCES public.figures(id)
);
CREATE TABLE public.judge_runs (
                                   id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
                                   name text NOT NULL CHECK (char_length(name) <= 120),
                                   discipline USER-DEFINED NOT NULL,
                                   grid_key text NOT NULL,
                                   difficulty text NOT NULL CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])),
                                   category text,
                                   source_type USER-DEFINED NOT NULL DEFAULT 'upload'::video_source,
                                   video_path text,
                                   video_url text,
                                   solution jsonb NOT NULL CHECK (pg_column_size(solution) <= 51200),
                                   published boolean NOT NULL DEFAULT false,
                                   created_at timestamp with time zone NOT NULL DEFAULT now(),
                                   updated_at timestamp with time zone NOT NULL DEFAULT now(),
                                   CONSTRAINT judge_runs_pkey PRIMARY KEY (id)
);