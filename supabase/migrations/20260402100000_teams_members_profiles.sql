-- Teams, members, profiles, provisioning trigger, RPCs (single team default).
-- Policies use get_my_team_id() (SECURITY DEFINER) to avoid self-referential RLS recursion.

CREATE TYPE public.team_role AS ENUM ('admin', 'developer', 'content_writer');

CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Team',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.team_role NOT NULL DEFAULT 'developer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE INDEX team_members_user_id_idx ON public.team_members (user_id);
CREATE INDEX team_members_team_id_idx ON public.team_members (team_id);

CREATE TABLE public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Must exist before policies: bypasses RLS when resolving the viewer's team.
CREATE OR REPLACE FUNCTION public.get_my_team_id ()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id
  FROM public.team_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_team_id () TO authenticated;

CREATE POLICY teams_select_member ON public.teams FOR SELECT TO authenticated USING (id = (SELECT public.get_my_team_id ()));

CREATE POLICY team_members_select_same_team ON public.team_members FOR SELECT TO authenticated USING (
  team_id = (SELECT public.get_my_team_id ())
);

CREATE POLICY user_profiles_select_team ON public.user_profiles FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE
      tm.user_id = user_profiles.user_id
      AND tm.team_id = (SELECT public.get_my_team_id ())
  )
);

CREATE POLICY user_profiles_insert_own ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY user_profiles_update_own ON public.user_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_team_members ()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  role text,
  member_since timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (tm.user_id)
    tm.user_id,
    au.email::text,
    COALESCE(NULLIF(trim(up.display_name), ''), split_part(au.email::text, '@', 1), '—'),
    tm.role::text,
    tm.created_at
  FROM public.team_members tm
  JOIN auth.users au ON au.id = tm.user_id
  LEFT JOIN public.user_profiles up ON up.user_id = tm.user_id
  WHERE tm.team_id = public.get_my_team_id ()
  ORDER BY tm.user_id, tm.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_members () TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user_team ()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid;
  r text;
  prov_team text;
BEGIN
  prov_team := NEW.raw_app_meta_data ->> 'provision_team_id';
  r := COALESCE(NEW.raw_app_meta_data ->> 'provision_role', '');

  IF
    prov_team IS NOT NULL
    AND prov_team ~ '^[0-9a-f-]{36}$'
    AND EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE
        t.id = prov_team::uuid
    )
    AND r IN ('admin', 'developer', 'content_writer')
  THEN
    INSERT INTO public.team_members(team_id, user_id, role)
    VALUES (prov_team::uuid, NEW.id, r::public.team_role)
    ON CONFLICT (team_id, user_id) DO UPDATE
    SET role = EXCLUDED.role;
  ELSE
    SELECT t.id INTO tid
    FROM public.teams t
    ORDER BY t.created_at ASC
    LIMIT 1;
    IF tid IS NULL THEN
      INSERT INTO public.teams (name)
      VALUES ('My Team')
      RETURNING id INTO tid;
      INSERT INTO public.team_members(team_id, user_id, role)
      VALUES (tid, NEW.id, 'admin');
    ELSE
      INSERT INTO public.team_members(team_id, user_id, role)
      VALUES (tid, NEW.id, 'developer');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_team ON auth.users;

CREATE TRIGGER on_auth_user_created_team
AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user_team ();

INSERT INTO public.teams (name)
SELECT 'My Team'
WHERE
  NOT EXISTS (
    SELECT 1
    FROM public.teams
  );

INSERT INTO
  public.team_members (team_id, user_id, role)
SELECT
  (
    SELECT id
    FROM public.teams
    ORDER BY created_at ASC
    LIMIT 1
  ),
  u.id,
  'admin'::public.team_role
FROM auth.users u
WHERE
  NOT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE
      tm.user_id = u.id
  )
ON CONFLICT (team_id, user_id) DO NOTHING;
