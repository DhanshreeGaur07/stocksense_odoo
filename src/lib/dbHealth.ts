import { supabase } from '@/lib/supabase';

export type DbConnectionStatus = 'checking' | 'connected' | 'error';

export async function checkDbConnection(): Promise<{
  status: 'connected' | 'error';
  message: string;
  warehouseCount?: number;
}> {
  const { count, error } = await supabase.from('warehouses').select('id', { count: 'exact', head: true });

  if (error) {
    return {
      status: 'error',
      message: error.message.includes('JWT') ? 'Sign in required for data access' : error.message,
    };
  }

  return {
    status: 'connected',
    message: 'Database connected',
    warehouseCount: count ?? 0,
  };
}
