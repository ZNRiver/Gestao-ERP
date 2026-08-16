import { buildUpdateSql, query, queryOne } from '../lib/db.js';
import { Cargo, Colaborador, Falta, RegistroPonto } from '../types/index.js';

export const colaboradorService = {
  async list() {
    return query<Colaborador>(
      `SELECT c.*, to_jsonb(cj) AS cargo
       FROM colaboradores c
       LEFT JOIN cargos cj ON cj.id = c.cargo_id
       ORDER BY c.nome`,
    );
  },

  async getById(id: string) {
    const row = await queryOne<Colaborador>(
      `SELECT c.*, to_jsonb(cj) AS cargo
       FROM colaboradores c
       LEFT JOIN cargos cj ON cj.id = c.cargo_id
       WHERE c.id = $1`,
      [id],
    );
    if (!row) throw new Error('Colaborador não encontrado');
    return row;
  },

  async create(payload: Partial<Colaborador>) {
    const row = await queryOne<Colaborador>(
      `INSERT INTO colaboradores
         (profile_id, cargo_id, matricula, nome, cpf, data_admissao, data_desligamento, status, salario)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        payload.profile_id || null,
        payload.cargo_id || null,
        payload.matricula,
        payload.nome,
        payload.cpf || null,
        payload.data_admissao || null,
        payload.data_desligamento || null,
        payload.status || 'ativo',
        payload.salario ?? 0,
      ],
    );
    if (!row) throw new Error('Erro ao criar colaborador');
    return row;
  },

  async update(id: string, payload: Partial<Colaborador>) {
    const { text, params } = buildUpdateSql('colaboradores', payload, { withUpdatedAt: true });
    const row = await queryOne<Colaborador>(text, [id, ...params]);
    if (!row) throw new Error('Colaborador não encontrado');
    return row;
  },

  async delete(id: string) {
    const colab = await queryOne<{ profile_id: string | null }>(
      `SELECT profile_id FROM colaboradores WHERE id = $1`,
      [id],
    );
    await query(`DELETE FROM colaboradores WHERE id = $1`, [id]);
    if (colab?.profile_id) {
      await query(`DELETE FROM profiles WHERE id = $1`, [colab.profile_id]);
    }
  },
};

export const cargoService = {
  async list() {
    return query<Cargo>(`SELECT * FROM cargos ORDER BY nome`);
  },

  async create(payload: Partial<Cargo>) {
    const row = await queryOne<Cargo>(
      `INSERT INTO cargos (nome, descricao, salario_base, carga_horaria_semanal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [payload.nome, payload.descricao || null, payload.salario_base ?? 0, payload.carga_horaria_semanal ?? 44],
    );
    if (!row) throw new Error('Erro ao criar cargo');
    return row;
  },

  async update(id: string, payload: Partial<Cargo>) {
    const { text, params } = buildUpdateSql('cargos', payload);
    const row = await queryOne<Cargo>(text, [id, ...params]);
    if (!row) throw new Error('Cargo não encontrado');
    return row;
  },
};

export const pontoService = {
  async listByColaborador(colaboradorId: string, mes: string) {
    const [y, m] = mes.split('-').map(Number);
    const inicio = `${y}-${String(m).padStart(2, '0')}-01`;
    const fim = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`; // ultimo dia do mes
    return query<RegistroPonto>(
      `SELECT * FROM registros_ponto
       WHERE colaborador_id = $1 AND data BETWEEN $2 AND $3
       ORDER BY data`,
      [colaboradorId, inicio, fim],
    );
  },

  async baterPonto(colaboradorId: string, tipo: string) {
    const hoje = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().split(' ')[0];

    const existente = await queryOne<RegistroPonto>(
      `SELECT * FROM registros_ponto WHERE colaborador_id = $1 AND data = $2`,
      [colaboradorId, hoje],
    );

    if (existente) {
      const update: Record<string, string> = {};
      if (tipo === 'entrada') update.entrada = hora;
      else if (tipo === 'saida_almoco') update.saida_almoco = hora;
      else if (tipo === 'volta_almoco') update.volta_almoco = hora;
      else if (tipo === 'saida') update.saida = hora;

      if (Object.keys(update).length === 0) return existente;
      return queryOne<RegistroPonto>(
        `UPDATE registros_ponto SET ${Object.keys(update)
          .map((k, i) => `"${k}" = $${i + 2}`)
          .join(', ')} WHERE id = $1 RETURNING *`,
        [existente.id, ...Object.values(update)],
      );
    } else {
      const insert: Record<string, string> = { colaborador_id: colaboradorId, data: hoje };
      if (tipo === 'entrada') insert.entrada = hora;
      else if (tipo === 'saida_almoco') insert.saida_almoco = hora;
      else if (tipo === 'volta_almoco') insert.volta_almoco = hora;
      else if (tipo === 'saida') insert.saida = hora;

      return queryOne<RegistroPonto>(
        `INSERT INTO registros_ponto (${Object.keys(insert)
          .map((k) => `"${k}"`)
          .join(', ')}) VALUES (${Object.keys(insert)
          .map((_, i) => `$${i + 1}`)
          .join(', ')}) RETURNING *`,
        Object.values(insert),
      );
    }
  },

  async updateRegistroPonto(id: string, payload: { entrada?: string; saida_almoco?: string; volta_almoco?: string; saida?: string }) {
    const { text, params } = buildUpdateSql('registros_ponto', payload);
    const row = await queryOne<RegistroPonto>(text, [id, ...params]);
    if (!row) throw new Error('Registro de ponto não encontrado');
    return row;
  },
};

export const faltasService = {
  async list() {
    return query<Falta>(
      `SELECT f.*,
         CASE WHEN c.id IS NULL THEN NULL
              ELSE jsonb_build_object('nome', c.nome)
         END AS colaborador
       FROM faltas f
       LEFT JOIN colaboradores c ON c.id = f.colaborador_id
       ORDER BY f.data DESC`,
    );
  },

  async create(payload: Partial<Falta>) {
    const row = await queryOne<Falta>(
      `INSERT INTO faltas (colaborador_id, data, tipo, justificativa, abonada)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        payload.colaborador_id,
        payload.data,
        payload.tipo || 'sem_justificativa',
        payload.justificativa || null,
        payload.abonada ?? false,
      ],
    );
    if (!row) throw new Error('Erro ao registrar falta');
    return row;
  },

  async toggleAbonada(id: string) {
    const atual = await queryOne<Falta>(`SELECT * FROM faltas WHERE id = $1`, [id]);
    if (!atual) throw new Error('Falta não encontrada');
    const row = await queryOne<Falta>(
      `UPDATE faltas SET abonada = $2 WHERE id = $1 RETURNING *`,
      [id, !atual.abonada],
    );
    return row;
  },
};
