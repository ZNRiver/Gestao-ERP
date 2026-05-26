import { supabase } from '../lib/supabase.js';
import { Cliente } from '../types/index.js';

export const clienteService = {
  async list() {
    const { data, error } = await supabase.from('clientes').select('*').order('nome');
    if (error) throw new Error(error.message);
    return data as Cliente[];
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data as Cliente;
  },

  async create(payload: Partial<Cliente>) {
    const { data, error } = await supabase.from('clientes').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as Cliente;
  },

  async update(id: string, payload: Partial<Cliente>) {
    const { data, error } = await supabase.from('clientes').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as Cliente;
  },

  async remove(id: string) {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
