import { supabase } from '../lib/supabase.js';
import { Alerta } from '../types/index.js';

export const alertaService = {
  async list(limit = 100) {
    const { data } = await supabase
      .from('alertas')
      .select('*, produto:produtos(descricao, codigo)')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data as Alerta[];
  },

  async marcarLido(id: string) {
    const { data } = await supabase.from('alertas').update({ lido: true }).eq('id', id).select().single();
    return data as Alerta;
  },

  async marcarTodosLidos() {
    const { error } = await supabase.from('alertas').update({ lido: true }).eq('lido', false);
    if (error) throw new Error(error.message);
  },

  async countNaoLidos() {
    const { count } = await supabase.from('alertas').select('*', { count: 'exact', head: true }).eq('lido', false);
    return count || 0;
  },
};
