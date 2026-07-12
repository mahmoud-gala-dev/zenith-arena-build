
REVOKE ALL ON FUNCTION public.get_page_by_preview_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_page_by_preview_token(text) TO anon, authenticated;
