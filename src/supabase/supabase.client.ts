import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

let supabase: ReturnType<typeof createClient>;

export const initSupabase = (configService: ConfigService) => {
  supabase = createClient(
    configService.get<string>('SUPABASE_URL'),
    configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'),
  );
  return supabase;
};

export { supabase }; 