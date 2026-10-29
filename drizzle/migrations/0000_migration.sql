CREATE TABLE public.relics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  language text NOT NULL CHECK (language IN ('python','javascript','java','cpp','c')),
  code text NOT NULL CHECK (char_length(code) BETWEEN 1 AND 8000),
  result jsonb,
  edit_token uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT (id, title, language, code, result, created_at) ON public.relics TO anon, authenticated;
GRANT INSERT (title, language, code, result, edit_token) ON public.relics TO anon, authenticated;
GRANT ALL ON public.relics TO service_role;
ALTER TABLE public.relics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view relics" ON public.relics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can save relics" ON public.relics FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX relics_created_at_idx ON public.relics (created_at DESC);

CREATE OR REPLACE FUNCTION public.rename_relic(_id uuid, _token uuid, _title text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  UPDATE public.relics SET title = left(btrim(_title), 80) WHERE id = _id AND edit_token = _token AND char_length(btrim(_title)) > 0;
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n > 0;
END $$;

CREATE OR REPLACE FUNCTION public.delete_relic(_id uuid, _token uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  DELETE FROM public.relics WHERE id = _id AND edit_token = _token;
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n > 0;
END $$;
GRANT EXECUTE ON FUNCTION public.rename_relic(uuid, uuid, text), public.delete_relic(uuid, uuid) TO anon, authenticated;