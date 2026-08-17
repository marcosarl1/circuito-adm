export interface Event {
  _id: string;
  nome_evento: string;
  data_realizacao: string;
  cidade: string;
  estado: string;
  organizador: string;
  site_coleta: string;
  data_coleta: string; // ISO date
  distancias: string[];
  horario: string;
  url_inscricao: string;
  url_imagem: string;
  categorias: string[];
  link_edital: string;
  categorias_premiadas: string;
  preco: string;
  precos_entries: string[];
  patrocinado: boolean;
  percurso: EventPercurso | null;
  kits: EventKit[] | null;
  campos_protegidos: string[];
  lista_precos: string[];
}

export interface EventPercurso {
  local_largada: string;
  trajeto: string;
}

export interface EventKit {
  nome: string;
  itens: string[];
  local_retirada: string | null;
  data_retirada: string | null; // ISO date
}

export type EventCreatePayload = Omit<Event, "_id" | "horario"> & {
  horario?: string;
};

export interface EventPage {
  eventos: Event[];
  total: number;
  total_pages: number;
  page: number;
  size: number;
}
