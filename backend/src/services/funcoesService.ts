import { supabase } from '../lib/supabase.js';
import { Funcao } from '../types/index.js';

export const funcoesService = {
  async list() {
    const { data, error } = await supabase.from('funcoes').select('*').order('role');
    if (error) throw new Error(error.message);
    return data as Funcao[];
  },

  async create(payload: { role: string; nome_exibicao: string; descricao?: string; permissoes?: string[] }) {
    const { data, error } = await supabase.from('funcoes').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as Funcao;
  },

  async update(role: string, payload: { nome_exibicao?: string; descricao?: string; permissoes?: string[] }) {
    const { data, error } = await supabase.from('funcoes').update(payload).eq('role', role).select().single();
    if (error) throw new Error(error.message);
    return data as Funcao;
  },

  async remove(role: string) {
    const { error } = await supabase.from('funcoes').delete().eq('role', role);
    if (error) throw new Error(error.message);
  },
};
