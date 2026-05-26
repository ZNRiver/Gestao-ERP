const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'meta/llama-3.3-70b-instruct';

interface PrevisaoInput {
  produto: {
    descricao: string;
    categoria?: string;
    estoque_atual: number;
    estoque_minimo: number;
    estoque_maximo: number;
  };
  historico: { data: string; quantidade: number }[];
  diaSemana: { nome: string; fator: number }[];
}

interface PrevisaoOutput {
  previsao7dias: number;
  previsao30dias: number;
  previsaoDiaria: number[];
  recomendacao: 'aumentar' | 'reduzir' | 'manter';
  sugestao: string;
  confianca: number;
}

function buildPrompt(input: PrevisaoInput): string {
  const hoje = new Date();
  const dataAtual = hoje.toISOString().split('T')[0];
  const mes = hoje.getMonth() + 1;
  const dia = hoje.getDate();

  const mediaDiaria = input.historico.length > 0
    ? (input.historico.reduce((s, v) => s + v.quantidade, 0) / input.historico.length).toFixed(1)
    : 'sem dados';

  return `Você é o analista-chefe de demanda de um ERP industrial. Você tem conhecimento enciclopédico sobre feriados brasileiros, sazonalidade de mercado, eventos comerciais e padrões de consumo.

Hoje é ${dataAtual} (${dia}/${mes}).

Analise os dados abaixo e retorne UM JSON com:

{
  "previsao7dias": <número total estimado para os próximos 7 dias>,
  "previsao30dias": <número total estimado para os próximos 30 dias>,
  "previsaoDiaria": [<valor dia 1>, <valor dia 2>, ..., <valor dia 7>],
  "recomendacao": "aumentar" | "reduzir" | "manter",
  "sugestao": "<explicação curta em português citando eventos reais e sazonalidade>",
  "confianca": <0.0 a 1.0>
}

REGRAS:
- "previsaoDiaria" deve conter 7 números (um para cada dia). Dias úteis maiores, domingos e feriados menores.
- A soma de previsaoDiaria deve ser igual a previsao7dias.
- Use SEU CONHECIMENTO sobre o calendário brasileiro: feriados fixos e móveis (Carnaval, Páscoa, Corpus Christi), datas comerciais (Black Friday, Dia das Mães, Dia dos Namorados, Dia dos Pais, Dia das Crianças), férias escolares (julho, dezembro/janeiro), e eventos sazonais.
- Considere o mês atual e os próximos 30 dias. Por exemplo: se está perto do Natal, a demanda sobe. Se é janeiro (férias), a demanda cai. Se é Black Friday, dispara.
- Use o nome e a categoria do produto para identificar o tipo (bebida, alimento, limpeza, etc.) e aplicar sazonalidade específica: bebidas sobem no verão, alimentos perecíveis têm prazos menores, material de limpeza tem alta em campanhas sazonais, etc.
- A sugestão deve explicar o motivo da previsão citando eventos e sazonalidade reais do período.

## Produto
Descrição: ${input.produto.descricao}
Categoria: ${input.produto.categoria || 'Sem categoria'}
Estoque atual: ${input.produto.estoque_atual}
Estoque mínimo: ${input.produto.estoque_minimo}
Estoque máximo: ${input.produto.estoque_maximo}

## Histórico de Vendas (últimos 84 dias)
Média diária: ${mediaDiaria} unidades
Total de registros: ${input.historico.length}
${input.historico.length > 0 ? `Início: ${input.historico[0]?.data || '?'} | Fim: ${input.historico[input.historico.length - 1]?.data || '?'}` : 'Produto novo sem vendas anteriores'}

## Perfil de Dia da Semana
${input.diaSemana.map(d => `- ${d.nome}: ${d.fator}x`).join('\n')}

Responda APENAS com o JSON, sem markdown.`;
}

let ultimaRequisicao = 0;
const DELAY_MINIMO = 2500;

async function esperarSeNecessario() {
  const agora = Date.now();
  const diff = agora - ultimaRequisicao;
  if (diff < DELAY_MINIMO) {
    await new Promise(r => setTimeout(r, DELAY_MINIMO - diff));
  }
  ultimaRequisicao = Date.now();
}

async function callNvidia(prompt: string, maxTokens = 600): Promise<any | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  try {
    await esperarSeNecessario();

    const res = await fetch(NVIDIA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[NVIDIA] Erro HTTP:', res.status, text.slice(0, 500));
      return null;
    }

    const body = await res.json();
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      console.error('[NVIDIA] Sem conteúdo. Resposta:', JSON.stringify(body).slice(0, 500));
      return null;
    }

    let cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    try {
      return JSON.parse(cleaned);
    } catch {
      console.error('[NVIDIA] JSON inválido. Content:', content.slice(0, 300));
      return null;
    }
  } catch (err) {
    console.error('[NVIDIA] Exceção:', err);
    return null;
  }
}

export const aiService = {
  async gerarCalendario(): Promise<{ nome: string; tipo: string; data_inicio: string; data_fim?: string; impacto_estimado: number; descricao: string }[] | null> {
    const hoje = new Date();
    const prompt = `Você é um especialista em calendário brasileiro. Hoje é ${hoje.toISOString().split('T')[0]}.

Liste TODOS os feriados nacionais, datas comemorativas comerciais e eventos sazonais relevantes para o comércio/indústria nos próximos 60 dias. Inclua também eventos que já estão ocorrendo hoje.

Retorne UM JSON com:
{
  "eventos": [
    {
      "nome": "<nome do evento>",
      "tipo": "feriado" | "promocao" | "evento" | "sazonal",
      "data_inicio": "YYYY-MM-DD",
      "data_fim": "YYYY-MM-DD",
      "impacto_estimado": <0.5 a 3.0>,
      "descricao": "<explicação do impacto no consumo>"
    }
  ]
}

REGRAS:
- Feriados nacionais brasileiros (ex: Tiradentes, Dia do Trabalho, Independência, Aparecida, Finados, Proclamação, Natal, Ano Novo, etc.)
- Datas móveis (Carnaval, Páscoa, Corpus Christi) — calcule corretamente para ${hoje.getFullYear()}
- Datas comerciais (Dia das Mães, Dia dos Namorados, Dia dos Pais, Dia das Crianças, Black Friday)
- Períodos sazonais (férias escolares julho/dezembro-janeiro, volta às aulas)
- "impacto_estimado" reflete o efeito nas vendas: >1.0 aumenta, <1.0 reduz
- Feriados que param o comércio (Natal, Ano Novo, Carnaval) = impacto baixo (0.5-0.7)
- Datas comerciais (Dia das Mães, Black Friday, Natal) = impacto alto (1.5-2.5)
- Períodos de férias = impacto moderado (0.7-0.9)

Retorne APENAS o JSON com o array "eventos".`;

    const json = await callNvidia(prompt, 1000);
    if (!json || !Array.isArray(json.eventos) || json.eventos.length === 0) return null;

    return json.eventos.map((e: any) => ({
      nome: e.nome,
      tipo: e.tipo,
      data_inicio: e.data_inicio,
      data_fim: e.data_fim || e.data_inicio,
      impacto_estimado: e.impacto_estimado || 1.0,
      descricao: e.descricao || '',
    }));
  },

  async gerarPrevisao(input: PrevisaoInput): Promise<PrevisaoOutput | null> {
    const json = await callNvidia(buildPrompt(input), 700);
    if (!json) return null;

    const diaria = Array.isArray(json.previsaoDiaria) && json.previsaoDiaria.length === 7
      ? json.previsaoDiaria.map((v: any) => Math.round(Number(v)))
      : [];

    return {
      previsao7dias: Math.round(json.previsao7dias),
      previsao30dias: Math.round(json.previsao30dias),
      previsaoDiaria: diaria,
      recomendacao: json.recomendacao,
      sugestao: json.sugestao,
      confianca: json.confianca,
    };
  },

  async gerarRecomendacoesGlobais(
    produtos: { id: string; nome: string; categoria?: string; estoque_atual: number; estoque_minimo: number; estoque_maximo: number; mediaDiaria: number; diasCobertura: number; tendencia: string }[]
  ): Promise<{ produto_nome: string; recomendacao: 'aumentar' | 'reduzir' | 'manter'; acao: string; urgencia: 'baixa' | 'media' | 'alta'; motivo: string }[] | null> {
    const hoje = new Date();
    const dataAtual = hoje.toISOString().split('T')[0];

    const prompt = `Você é um analista sênior de supply chain de um ERP industrial. Você domina o calendário brasileiro de feriados, eventos comerciais e sazonalidade.

Hoje é ${dataAtual}.

Analise o portfólio completo de produtos e retorne UM JSON com:

{
  "recomendacoes": [
    {
      "produto_nome": "<nome do produto>",
      "recomendacao": "aumentar" | "reduzir" | "manter",
      "acao": "<ação prática e numérica: ex: 'Comprar 50 unidades urgentemente' ou 'Reduzir produção em 30%'>",
      "urgencia": "baixa" | "media" | "alta",
      "motivo": "<explicação em português ligando dados a eventos de mercado reais deste período>"
    }
  ]
}

REGRAS DE ANÁLISE (use seu conhecimento do calendário e mercado brasileiro):
- Se estoque < estoque_minimo e tendência é alta → "aumentar" urgência alta
- Se dias de cobertura < 15 e vendas subindo → "aumentar"
- Se estoque > estoque_maximo e tendência é queda → "reduzir" para evitar excesso
- Considere feriados, datas sazonais e eventos comerciais REAIS deste período para ajustar as recomendações
- Use o nome e a categoria do produto para identificar o tipo (bebida, alimento, limpeza, etc.) e aplicar sazonalidade específica a cada um
- Se estoque equilibrado → "manter"
- Retorne UMA recomendação para CADA produto listado, sem exceção

## Produtos
${produtos.map(p =>
  `- ${p.nome} (${p.categoria || 'sem categoria'}): estoque ${p.estoque_atual}/${p.estoque_minimo}/${p.estoque_maximo}, média ${p.mediaDiaria.toFixed(1)}/dia, cobertura ${p.diasCobertura.toFixed(0)}d, tendência ${p.tendencia}`
).join('\n')}

Retorne APENAS o JSON com o array "recomendacoes".`;

    const json = await callNvidia(prompt, 1000);
    if (!json || !Array.isArray(json.recomendacoes) || json.recomendacoes.length === 0) return null;

    return json.recomendacoes.map((r: any) => ({
      produto_nome: r.produto_nome || '',
      recomendacao: r.recomendacao,
      acao: r.acao,
      urgencia: r.urgencia,
      motivo: r.motivo,
    }));
  },
};
