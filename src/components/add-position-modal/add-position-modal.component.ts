import {
  Component,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { supabase } from '../../supabaseClient';

@Component({
  selector: 'app-add-position-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="backdrop" (click)="onClose()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Adicionar Nova Posição</h2>
          <button type="button" class="icon-btn" (click)="onClose()">✕</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- CARTA (dropdown simples vindo do Supabase) -->
          <div class="form-group">
            <label class="label">Nome da Carta</label>

            <select class="input" formControlName="carta">
              <option value="">Selecione...</option>

              <!-- lista vinda de this.cardNames -->
              <option *ngFor="let card of cardNames" [value]="card">
                {{ card }}
              </option>
            </select>

            <small class="hint" *ngIf="loadingCards">
              🔄 Carregando cartas...
            </small>
            <small class="hint error" *ngIf="!loadingCards && cardNames.length === 0">
              ⚠️ Nenhuma carta encontrada.
            </small>
          </div>

          <div class="row">
            <div class="form-group">
              <label class="label">Preço de Compra (R$)</label>
              <input
                type="number"
                class="input"
                formControlName="precoCompra"
                step="0.01"
                min="0"
              />
            </div>

            <div class="form-group">
              <label class="label">Quantidade</label>
              <input
                type="number"
                class="input"
                formControlName="quantidade"
                min="1"
              />
            </div>
          </div>

          <div class="row">
            <div class="form-group">
              <label class="label">Idioma</label>
              <select class="input" formControlName="idioma">
                <option value="">Selecione...</option>
                <option value="PT-BR">PT-BR</option>
                <option value="ING">ING</option>
                <option value="JPN">JPN</option>
              </select>
            </div>

            <div class="form-group">
              <label class="label">Condição</label>
              <select class="input" formControlName="condicao">
                <option value="">Selecione...</option>
                <option value="NM">NM (Near Mint)</option>
                <option value="SP">SP (Slightly Played)</option>
                <option value="MP">MP (Moderately Played)</option>
                <option value="HP">HP (Heavily Played)</option>
                <option value="D">D (Damaged)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="label">Data da Compra (dd/mm/aaaa)</label>
            <input
              type="date"
              class="input"
              formControlName="dataCompra"
            />
          </div>

          <div class="buttons">
            <button
              type="button"
              class="btn secondary"
              (click)="onClose()"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn primary"
              [disabled]="form.invalid || saving"
            >
              {{ saving ? 'Salvando...' : 'Adicionar Posição' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      backdrop-filter: blur(4px);
    }
    .modal {
      width: 520px;
      max-width: 95vw;
      background: #0f172a;
      color: #f9fafb;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      border: 1px solid #1e293b;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    h2 {
      margin: 0;
      color: #22c55e;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .icon-btn {
      border: none;
      background: transparent;
      color: #9ca3af;
      font-size: 18px;
      cursor: pointer;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .input {
      width: 100%;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid #334155;
      background: #1e293b;
      color: #f8fafc;
      font-size: 14px;
      transition: all 0.2s;
    }
    .input:focus {
      outline: none;
      border-color: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }
    .btn {
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn.secondary {
      background: #1e293b;
      color: #e5e7eb;
      border: 1px solid #334155;
    }
    .btn.secondary:hover {
      background: #253045;
      border-color: #475569;
    }
    .btn.primary {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.3);
    }
    .btn.primary:hover:not([disabled]) {
      transform: translateY(-1px);
      box-shadow: 0 6px 10px -1px rgba(34, 197, 94, 0.4);
    }
    .btn.primary[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .hint {
      font-size: 11px;
      color: #64748b;
      font-style: italic;
    }
    .hint.error {
      color: #ef4444;
    }
  `],
})
export class AddPositionModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  form!: FormGroup;
  loadingCards = false;
  saving = false;

  // nomes de carta vindos do Supabase
  cardNames: string[] = [];

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      carta: ['', Validators.required],
      precoCompra: [null, [Validators.required, Validators.min(0.01)]],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      idioma: ['', Validators.required],
      condicao: ['', Validators.required],
      dataCompra: ['', Validators.required],
    });

    this.loadCards();
  }

  /** Busca lista de cartas na tabela public.myp_cards_meg (campo carta) */
  private async loadCards(): Promise<void> {
    this.loadingCards = true;
    console.log('🔍 Buscando cartas em public.myp_cards_meg.carta...');

    const { data, error } = await supabase
      .from('myp_cards_meg')
      .select('carta')
      .order('carta', { ascending: true });

    if (error || !data) {
      console.error('Erro ao buscar cartas', error);
      this.cardNames = [];
      this.loadingCards = false;
      return;
    }

    const names = Array.from(
      new Set(
        data
          .map((row: any) => row.carta as string | null)
          .filter((c): c is string => !!c && c.trim().length > 0),
      ),
    );

    this.cardNames = names;
    this.loadingCards = false;
    console.log(`✅ ${this.cardNames.length} cartas carregadas`);
  }

  onClose(): void {
    this.closed.emit();
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.saving = true;
    const formVal = this.form.value;

    try {
      console.log('💾 [Modal] Iniciando processo de salvamento...');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Usuário não autenticado!');
        this.saving = false;
        return;
      }

      console.log('👤 [Modal] Usuário autenticado:', user.id);

      // 1. Insert into portfolio_cards
      const positionData = {
        user_id: user.id,
        carta: formVal.carta,
        preco_compra: formVal.precoCompra,
        qtd: formVal.quantidade,
        idioma: formVal.idioma,
        estado: formVal.condicao, // Corrigido de 'condicao' para 'estado'
        data_compra: formVal.dataCompra
      };

      console.log('📋 [Modal] Dados do portfólio:', positionData);

      const { error: portfolioError } = await supabase
        .from('portfolio_cards')
        .insert(positionData);

      if (portfolioError) {
        console.error('❌ [Modal] Erro ao salvar no portfólio:', portfolioError);
        throw portfolioError;
      }

      console.log('✅ [Modal] Portfólio salvo com sucesso!');

      // 2. Insert into transactions (BUY)
      const transactionData = {
        user_id: user.id,
        transaction_type: 'BUY',
        carta: formVal.carta,
        quantidade: formVal.quantidade,
        preco_unitario: formVal.precoCompra,
        idioma: formVal.idioma,
        estado: formVal.condicao,
        data_transacao: formVal.dataCompra,
        notas: 'Compra adicionada via modal'
      };

      console.log('💰 [Modal] Dados da transação:', transactionData);

      const { error: transactionError, data: transactionResult } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select();

      if (transactionError) {
        console.error('❌ [Modal] Erro ao registrar transação:', transactionError);
        alert(`ATENÇÃO: Posição salva no portfólio, mas a transação não foi registrada.\n\nErro: ${transactionError.message}\n\nVerifique se você executou o script create_transactions_table.sql no Supabase!`);
      } else {
        console.log('✅ [Modal] Transação salva com sucesso!', transactionResult);
      }

      console.log('✅ [Modal] Processo completo!');
      this.saved.emit(formVal);
      this.onClose();

    } catch (error: any) {
      console.error('❌ [Modal] Erro ao salvar:', error);
      alert(`Erro ao salvar posição: ${error.message || JSON.stringify(error)}`);
    } finally {
      this.saving = false;
    }
  }
}
