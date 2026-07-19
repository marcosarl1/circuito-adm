import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PostsService } from "../../services/posts.service";
import { PostFormCardComponent } from "../../components/posts/post-form-card/post-form-card.component";
import { PostFormState } from "../../shared/models/post.model";
import { finalize } from "rxjs";

@Component({
  selector: "app-posts",
  standalone: true,
  imports: [CommonModule, PostFormCardComponent],
  templateUrl: "./posts.component.html",
})
export class PostsComponent {
  private destroyRef = inject(DestroyRef);

  loading = false;
  successMessage = "";
  errorMessage = "";
  imagePreview = "";
  selectedImageName = "";

  formData: PostFormState = this.createEmptyForm();

  constructor(private postsService: PostsService) {}

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.formData.imagem = file;
    this.selectedImageName = file?.name ?? "";

    if (!file) {
      this.imagePreview = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = String(reader.result ?? "");
    };
    reader.readAsDataURL(file);
  }

  publishPost() {
    if (!this.validateForm()) {
      this.showError("Preencha os campos obrigatórios antes de publicar.");
      return;
    }

    if (!this.formData.imagem) {
      this.showError("Selecione a imagem principal da postagem.");
      return;
    }

    const payload = this.buildFormData();
    this.loading = true;

    this.postsService
      .publishPost(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: () => {
          this.showSuccess("Postagem publicada com sucesso!");
          this.loading = false;
          this.resetForm();
        },
        error: (error) => {
          this.showError(`Erro ao publicar postagem: ${error.message}`);
          this.loading = false;
        },
      });
  }

  resetForm() {
    this.formData = this.createEmptyForm();
    this.imagePreview = "";
    this.selectedImageName = "";
  }

  onTitleChange(titulo: string) {
    this.formData.slug = this.generateSlug(titulo);
  }

  private validateForm(): boolean {
    return !!(
      this.formData.slug &&
      this.formData.titulo &&
      this.formData.descricao &&
      this.formData.data &&
      this.formData.autor
    );
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    formData.append("imagem", this.formData.imagem!, this.formData.imagem!.name);
    formData.append("slug", this.formData.slug);
    formData.append("titulo", this.formData.titulo);
    formData.append("descricao", this.formData.descricao);
    formData.append("data", this.formData.data);
    formData.append("autor", this.formData.autor);
    formData.append("imagens", JSON.stringify(this.splitMultilineText(this.formData.imagensText)));
    formData.append(
      "conteudo",
      JSON.stringify(this.splitMultilineText(this.formData.conteudoText)),
    );
    return formData;
  }

  private generateSlug(titulo: string): string {
    return titulo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  private createEmptyForm(): PostFormState {
    const today = new Date().toLocaleDateString("sv-SE");
    return {
      imagem: null,
      slug: "",
      titulo: "",
      descricao: "",
      data: today,
      autor: "Equipe Circuito",
      imagensText: "",
      conteudoText: "",
    };
  }

  private splitMultilineText(value: string): string[] {
    return value
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  private showSuccess(message: string, duration = 5000) {
    this.successMessage = message;
    setTimeout(() => (this.successMessage = ""), duration);
  }

  private showError(message: string, duration = 5000) {
    this.errorMessage = message;
    setTimeout(() => (this.errorMessage = ""), duration);
  }
}
