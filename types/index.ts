export type SupabaseUser = {
  id: string;
  email: string;
};

export type Doc = {
  id: string;
  user_id: string;
  title: string;
  content_html: string;
  created_at: string;
  updated_at: string;
};
