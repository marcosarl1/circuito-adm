export interface PostFormState {
  imagem: File | null;
  slug: string;
  titulo: string;
  descricao: string;
  data: string; // yyyy-MM-dd
  autor: string;
  imagensText: string;
  conteudoText: string;
}

export interface PostCreatePayload {
  imagem: File;
  slug: string;
  titulo: string;
  descricao: string;
  data: string;
  autor: string;
  imagens: string[];
  conteudo: string[];
}
