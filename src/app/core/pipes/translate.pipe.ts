import { Pipe, PipeTransform, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { Subscription } from 'rxjs';

@Pipe({
    name: 'translate',
    standalone: true,
    pure: false // Impure to update on language change
})
export class TranslatePipe implements PipeTransform, OnDestroy {
    private currentLang: string = '';
    private sub: Subscription;

    constructor(private translationService: TranslationService, private _ref: ChangeDetectorRef) {
        this.sub = this.translationService.currentLang$.subscribe(lang => {
            this.currentLang = lang;
            this._ref.markForCheck();
        });
    }

    transform(key: string): string {
        return this.translationService.get(key);
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
    }
}
