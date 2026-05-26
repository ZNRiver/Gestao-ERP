import { supabase } from '../lib/supabase.js';
import { Fornecedor } from '../types/index.js';

export const fornecedorService = {
  async list() {
    const { data, error } = await supabase.from('fornecedores').select('*').order('nome');
    if (error) throw new Error(error.message);
    return data as Fornecedor[];
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('fornecedores').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data as Fornecedor;
  },

  async create(payload: Partial<Fornecedor>) {
    const { data, error } = await supabase.from('fornecedores').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as Fornecedor;
  },

  async update(id: string, payload: Partial<Fornecedor>) {
    const { data, error } = await supabase.from('fornecedores').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as Fornecedor;
  },

  async remove(id: string) {
    const { error } = await supabase.from('fornecedores').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
