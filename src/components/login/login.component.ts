import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    imports: [CommonModule],
})
export class LoginComponent {
    email = signal('');
    password = signal('');
    loading = signal(false);
    error = signal<string | null>(null);
    isSignUp = signal(false); // Toggle between login and sign up

    constructor(private supabase: SupabaseService) { }

    onEmailChange(event: Event) {
        this.email.set((event.target as HTMLInputElement).value);
    }

    onPasswordChange(event: Event) {
        this.password.set((event.target as HTMLInputElement).value);
    }

    toggleMode() {
        this.isSignUp.update(val => !val);
        this.error.set(null);
    }

    async handleSubmit(event: Event) {
        event.preventDefault();
        if (!this.email() || !this.password()) {
            this.error.set('Por favor, preencha todos os campos.');
            return;
        }

        this.loading.set(true);
        this.error.set(null);

        try {
            if (this.isSignUp()) {
                await this.supabase.signUp(this.email(), this.password());
                alert('Cadastro realizado! Verifique seu email para confirmar.');
                this.isSignUp.set(false);
            } else {
                await this.supabase.signIn(this.email(), this.password());
                // Reload page to update auth state in AppComponent
                window.location.reload();
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            this.error.set(err.message || 'Ocorreu um erro na autenticação.');
        } finally {
            this.loading.set(false);
        }
    }
}
