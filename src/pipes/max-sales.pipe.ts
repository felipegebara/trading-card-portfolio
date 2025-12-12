import { Pipe, PipeTransform } from '@angular/core';
import { SalesFlowPoint } from '../models/sales-flow.model';

@Pipe({
    name: 'maxSales',
    standalone: true
})
export class MaxSalesPipe implements PipeTransform {
    transform(history: SalesFlowPoint[]): number {
        if (!history || history.length === 0) return 1;
        return Math.max(...history.map(p => p.sales));
    }
}
