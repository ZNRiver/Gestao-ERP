import { supabase } from '../lib/supabase.js';
import { Colaborador, Cargo, RegistroPonto, Falta } from '../types/index.js';

export const colaboradorService = {
  async list() {
    const { data, error } = await supabase
      .from('colaboradores')
      .select('*, cargo:cargos(*)')
      .order('nome');
    if (error) throw new Error(error.message);
    return data as Colaborador[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('colaboradores')
      .select('*, cargo:cargos(*)')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data as Colaborador;
  },

  async create(payload: Partial<Colaborador>) {
    const { data, error } = await supabase
      .from('colaboradores')
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Colaborador;
  },

  async update(id: string, payload: Partial<Colaborador>) {
    const { data, error } = await supabase
      .from('colaboradores')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Colaborador;
  },

  async delete(id: string) {
    const { data: colab } = await supabase.from('colaboradores').select('profile_id').eq('id', id).single();
    const { error } = await supabase.from('colaboradores').delete().eq('id', id);
    if (error) throw new Error(error.message);
    if (colab?.profile_id) {
      await supabase.from('profiles').delete().eq('id', colab.profile_id);
    }
  },
};

export const cargoService = {
  async list() {
    const { data } = await supabase.from('cargos').select('*').order('nome');
    return data as Cargo[];
  },

  async create(payload: Partial<Cargo>) {
    const { data, error } = await supabase.from('cargos').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as Cargo;
  },

  async update(id: string, payload: Partial<Cargo>) {
    const { data, error } = await supabase.from('cargos').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as Cargo;
  },
};

export const pontoService = {
  async listByColaborador(colaboradorId: string, mes: string) {
    const [y, m] = mes.split('-').map(Number);
    const inicio = `${y}-${String(m).padStart(2, '0')}-01`;
    const fim = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`; // ultimo dia do mes
    const { data } = await supabase
      .from('registros_ponto')
      .select('*')
      .eq('colaborador_id', colaboradorId)
      .gte('data', inicio)
      .lte('data', fim)
      .order('data');
    return data as RegistroPonto[];
  },

  async baterPonto(colaboradorId: string, tipo: string) {
    const hoje = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().split(' ')[0];

    // Verifica se já existe registro hoje
    const { data: existente } = await supabase
      .from('registros_ponto')
      .select('*')
      .eq('colaborador_id', colaboradorId)
      .eq('data', hoje)
      .single();

    if (existente) {
      const update: Record<string, string> = {};
      if (tipo === 'entrada') update.entrada = hora;
      else if (tipo === 'saida_almoco') update.saida_almoco = hora;
      else if (tipo === 'volta_almoco') update.volta_almoco = hora;
      else if (tipo === 'saida') update.saida = hora;

      const { data } = await supabase.from('registros_ponto').update(update).eq('id', existente.id).select().single();
      return data;
    } else {
      const insert: Record<string, string> = { colaborador_id: colaboradorId, data: hoje };
      if (tipo === 'entrada') insert.entrada = hora;
      else if (tipo === 'saida_almoco') insert.saida_almoco = hora;
      else if (tipo === 'volta_almoco') insert.volta_almoco = hora;
      else if (tipo === 'saida') insert.saida = hora;

      const { data } = await supabase.from('registros_ponto').insert(insert).select().single();
      return data;
    }
  },

  async updateRegistroPonto(id: string, payload: { entrada?: string; saida_almoco?: string; volta_almoco?: string; saida?: string }) {
    const { data, error } = await supabase.from('registros_ponto').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as RegistroPonto;
  },
};

export const faltasService = {
  async list() {
    const { data } = await supabase
      .from('faltas')
      .select('*, colaborador:colaboradores(nome)')
      .order('data', { ascending: false });
    return data as Falta[];
  },

  async create(payload: Partial<Falta>) {
    const { data, error } = await supabase.from('faltas').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as Falta;
  },

  async toggleAbonada(id: string) {
    const { data: atual } = await supabase.from('faltas').select('abonada').eq('id', id).single();
    if (!atual) throw new Error('Falta não encontrada');
    const { data } = await supabase.from('faltas').update({ abonada: !atual.abonada }).eq('id', id).select().single();
    return data as Falta;
  },
};
