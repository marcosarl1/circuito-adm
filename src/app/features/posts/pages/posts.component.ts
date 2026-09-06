import { Component, DestroyRef, inject, OnDestroy, signal } from '@angular/core';
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
export class PostsComponent implements OnDestroy {
  private destroyRef = inject(DestroyRef);
  private postsService = inject(PostsService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);

  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  loading = this.loadingService.loading;
  imagePreview = signal('');
  selectedImageName = signal('');
  formData = signal<PostFormState>(this.createEmptyForm());

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    // revoke previous blob url to avoid memory leak
    const prev = this.imagePreview();
    if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);

    if (!file) {
      this.formData.update((f) => ({ ...f, imagem: null }));
      this.selectedImageName.set('');
      this.imagePreview.set('');
      input.value = '';
      return;
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.toastService.error('Formato inválido. Use JPG, PNG ou WebP.');
      input.value = '';
      this.formData.update((f) => ({ ...f, imagem: null }));
      this.selectedImageName.set('');
      this.imagePreview.set('');
      return;
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      this.toastService.error('Imagem muito grande. Máximo 5MB.');
      input.value = '';
      this.formData.update((f) => ({ ...f, imagem: null }));
      this.selectedImageName.set('');
      this.imagePreview.set('');
      return;
    }

    this.formData.update((f) => ({ ...f, imagem: file }));
    this.selectedImageName.set(file.name);
    this.imagePreview.set(URL.createObjectURL(file));
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
    const prev = this.imagePreview();
    if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
    this.formData.set(this.createEmptyForm());
    this.imagePreview.set('');
    this.selectedImageName.set('');
    // file input DOM value is cleared by child via effect; also clear here if ref available
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
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  ngOnDestroy(): void {
    const prev = this.imagePreview();
    if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
  }

  private createEmptyForm(): PostFormState {
    const today = new Date().toISOString().slice(0, 10);
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
