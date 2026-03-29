import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';

export function requireAuth(hasSession: boolean): boolean {
  if (!supabase || !hasSession) {
    toast.error('Faça login para editar');
    return false;
  }
  return true;
}
