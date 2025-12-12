import { Component, Input } from '@angular/core';
import { NgIf, NgFor, DecimalPipe, PercentPipe, DatePipe } from '@angular/common';
import { SalesFlowData } from '../../models/sales-flow.model';
import { MaxSalesPipe } from '../../pipes/max-sales.pipe';

@Component({
    selector: 'app-sales-flow-card',
    standalone: true,
    imports: [NgIf, NgFor, DecimalPipe, PercentPipe, DatePipe, MaxSalesPipe],
    templateUrl: './sales-flow-card.component.html',
    styleUrls: ['./sales-flow-card.component.scss'],
})
export class SalesFlowCardComponent {
    @Input() data: SalesFlowData | null = null;

    get isPositiveSalesDiff(): boolean {
        return (this.data?.summary.diffSalesPct ?? 0) >= 0;
    }

    get isPositiveVolumeDiff(): boolean {
        return (this.data?.summary.diffVolumePct ?? 0) >= 0;
    }
}
