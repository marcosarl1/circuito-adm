import { Component, computed, DestroyRef, inject, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PostsService } from '../services/posts.service';
import { PostFormCardComponent } from '../components/post-form-card/post-form-card.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { PostFormState } from '../../../shared/models/post.model';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmModalService } from '../../../shared/services/confirm-modal.service';

@Component({
  selector: 'app-posts',
  imports: [PostFormCardComponent, ConfirmModalComponent],
  templateUrl: './posts.component.html',
})
export class PostsComponent implements OnDestroy {
  private destroyRef = inject(DestroyRef);
  private postsService = inject(PostsService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);
  private confirmModal = inject(ConfirmModalService);

  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  loading = this.loadingService.loading;
  imagePreview = signal('');
  selectedImageName = signal('');
  imageError = signal('');
  formData = signal<PostFormState>(this.createEmptyForm());
  private formHash = computed(() => {
    const f = this.formData();
    // hash determinístico dos campos que afetam o preview/publicação
    return JSON.stringify({
      imagem: f.imagem ? `${f.imagem.name}:${f.imagem.size}:${f.imagem.type}` : null,
      titulo: f.titulo,
      slug: f.slug,
      descricao: f.descricao,
      conteudoText: f.conteudoText,
      imagensText: f.imagensText,
      autor: f.autor,
      data: f.data,
    });
  });
  isFormValid = computed(() => {
    const f = this.formData();
    return !!(
      f.imagem &&
      f.slug.trim() &&
      f.titulo.trim() &&
      f.descricao.trim() &&
      f.conteudoText.trim() &&
      f.data.trim() &&
      f.autor.trim()
    );
  });

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    // revoke previous blob url to avoid memory leak
    const prev = this.imagePreview();
    if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);

    if (!file) {
      this.imageError.set('');
      this.formData.update((f) => ({ ...f, imagem: null }));
      this.selectedImageName.set('');
      this.imagePreview.set('');
      input.value = '';
      return;
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.imageError.set('Formato inválido. Use JPG, PNG ou WebP.');
      input.value = '';
      this.formData.update((f) => ({ ...f, imagem: null }));
      this.selectedImageName.set('');
      this.imagePreview.set('');
      return;
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      this.imageError.set('Imagem muito grande. Máximo 5MB.');
      input.value = '';
      this.formData.update((f) => ({ ...f, imagem: null }));
      this.selectedImageName.set('');
      this.imagePreview.set('');
      return;
    }

    this.imageError.set('');
    this.formData.update((f) => ({ ...f, imagem: file }));
    this.selectedImageName.set(file.name);
    this.imagePreview.set(URL.createObjectURL(file));
  }

  publishPost() {
    if (!this.validateForm()) {
      const hasImage = !!this.formData().imagem;
      this.toastService.error(
        hasImage
          ? 'Preencha os campos obrigatórios antes de publicar.'
          : 'Selecione a imagem da capa e preencha os campos obrigatórios.',
      );
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

  async handleResetRequest(): Promise<void> {
    if (this.isFormPristine()) {
      this.resetForm();
      return;
    }
    const confirmed = await this.confirmModal.confirm(
      'Tem certeza que deseja limpar o formulário? Todo o conteúdo preenchido será perdido.',
      {
        title: 'Limpar formulário?',
        confirmText: 'Limpar',
        cancelText: 'Cancelar',
        variant: 'default',
      },
    );
    if (!confirmed) return;
    this.resetForm();
  }

  resetForm() {
    const prev = this.imagePreview();
    if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
    this.formData.set(this.createEmptyForm());
    this.imagePreview.set('');
    this.selectedImageName.set('');
    this.imageError.set('');
  }

  private isFormPristine(): boolean {
    const f = this.formData();
    const empty = this.createEmptyForm();
    return (
      !f.imagem &&
      f.titulo.trim() === '' &&
      f.slug.trim() === '' &&
      f.descricao.trim() === '' &&
      f.conteudoText.trim() === '' &&
      f.imagensText.trim() === '' &&
      f.autor === empty.autor &&
      f.data === empty.data
    );
  }

  onTitleChange(titulo: string) {
    this.formData.update((f) => ({
      ...f,
      slug: this.generateSlug(titulo),
    }));
  }

  private validateForm(): boolean {
    return this.isFormValid();
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
