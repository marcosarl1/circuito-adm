export interface KitForm {
  nome: string;
  itensText: string;
  local_retirada: string;
  data_retirada: string;
}

export interface EventFormState {
  nome_evento: string;
  data_realizacao: string;
  cidade: string;
  estado: string;
  organizador: string;
  site_coleta: string;
  data_coleta: string;
  distanciasText: string;
  horario: string;
  url_inscricao: string;
  url_imagem: string;
  categoriasText: string;
  link_edital: string;
  categorias_premiadas: string;
  preco: string;
  precosEntriesText: string;
  patrocinado: boolean;
  percurso: {
    local_largada: string;
    trajeto: string;
  };
  kits: KitForm[];
  camposProtegidosText: string;
  listaPrecosText: string;
}
