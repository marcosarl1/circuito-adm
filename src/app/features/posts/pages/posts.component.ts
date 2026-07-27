import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PostsService } from '../services/posts.service';
import { PostFormCardComponent } from '../components/post-form-card/post-form-card.component';
import { PostFormState } from '../../../shared/models/post.model';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-posts',
  imports: [PostFormCardComponent],
  templateUrl: './posts.component.html',
})
export class PostsComponent {
  private destroyRef = inject(DestroyRef);
  private postsService = inject(PostsService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);

  loading = this.loadingService.loading;
  imagePreview = signal('');
  selectedImageName = signal('');
  formData = signal<PostFormState>(this.createEmptyForm());

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.formData.update((f) => ({ ...f, imagem: file }));
    this.selectedImageName.set(file?.name ?? '');

    if (!file) {
      this.imagePreview.set('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview.set(String(reader.result ?? ''));
    };
    reader.readAsDataURL(file);
  }

  publishPost() {
    if (!this.validateForm()) {
      this.toastService.error(
        'Preencha os campos obrigatórios antes de publicar.',
      );
      return;
    }

    if (!this.formData().imagem) {
      this.toastService.error('Selecione a imagem principal da postagem.');
      return;
    }

    const payload = this.buildFormData();

    this.postsService
      .publishPost(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Postagem publicada com sucesso!');
          this.resetForm();
        },
        error: (error) => {
          this.toastService.error(
            `Erro ao publicar postagem: ${error.message}`,
          );
        },
      });
  }

  resetForm() {
    this.formData.set(this.createEmptyForm());
    this.imagePreview.set('');
    this.selectedImageName.set('');
  }

  onTitleChange(titulo: string) {
    this.formData.update((f) => ({
      ...f,
      slug: this.generateSlug(titulo),
    }));
  }

  private validateForm(): boolean {
    const f = this.formData();
    return !!(f.slug && f.titulo && f.descricao && f.data && f.autor);
  }

  private buildFormData(): FormData {
    const f = this.formData();
    const formData = new FormData();
    const image = f.imagem;
    if (!image) {
      throw new Error('Imagem obrigatória');
    }
    formData.append('imagem', image, image.name);
    formData.append('slug', f.slug);
    formData.append('titulo', f.titulo);
    formData.append('descricao', f.descricao);
    formData.append('data', f.data);
    formData.append('autor', f.autor);
    formData.append(
      'imagens',
      JSON.stringify(this.splitMultilineText(f.imagensText)),
    );
    formData.append(
      'conteudo',
      JSON.stringify(this.splitMultilineText(f.conteudoText)),
    );
    return formData;
  }

  private generateSlug(titulo: string): string {
    return titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  private createEmptyForm(): PostFormState {
    const today = new Date().toLocaleDateString('sv-SE');
    return {
      imagem: null,
      slug: '',
      titulo: '',
      descricao: '',
      data: today,
      autor: 'Equipe Circuito',
      imagensText: '',
      conteudoText: '',
    };
  }

  private splitMultilineText(value: string): string[] {
    return value
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
}
