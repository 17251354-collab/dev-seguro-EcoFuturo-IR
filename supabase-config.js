import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://plruznhbkoyqlrzswsmt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscnV6bmhia295cWxyenN3c210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMjc5OTYsImV4cCI6MjA5MzYwMzk5Nn0.kaBoeCYdnXaQWpreHvqq62uxK9wu1iXR7TvqIbhuMaY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
