// Tipos manuais para as tabelas do Supabase externo do Vizinho Indica.
// IDs de serviços/avaliações/mensagens/favoritos são int8 (number).

export interface Profile {
  id: string;
  nome: string | null;
  avatar_url: string | null;
  bio: string | null;
  condominio: string | null;
  created_at: string;
}

export interface Servico {
  id: number;
  user_id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  preco: number | null;
  fotos: string[] | null;
  ativo: boolean;
  created_at: string;
}

export interface ServicoDestaque {
  id: number;
  titulo: string;
  categoria: string | null;
  preco: number | null;
  foto: string | null;
  user_id: string;
  prestador_nome: string | null;
  prestador_avatar: string | null;
  nota_media: number | null;
  total_avaliacoes: number | null;
}

export interface Avaliacao {
  id: number;
  servico_id: number;
  user_id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
}

export interface Mensagem {
  id: number;
  remetente_id: string;
  destinatario_id: string;
  servico_id: number | null;
  conteudo: string;
  lida: boolean;
  created_at: string;
}

export interface Favorito {
  id: number;
  user_id: string;
  servico_id: number;
  created_at: string;
}
