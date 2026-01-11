import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Language = 'es' | 'en';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    private currentLangSubject = new BehaviorSubject<Language>('es');
    public currentLang$ = this.currentLangSubject.asObservable();

    private dictionary: Record<Language, Record<string, string>> = {
        es: {
            'MENU_TITLE': 'Menú',
            'MENU_SUBTITLE': 'Explora nuestros sabores',
            'TABS_ALL': 'Todos',
            'ADD_TO_CART': 'Agregar',
            'CART_TITLE': 'Tu Cuenta',
            'TABLE': 'Mesa',
            'EMPTY_CART': 'Tu carrito está vacío',
            'EMPTY_CART_MSG': 'Aún no has pedido nada.',
            'VIEW_MENU': 'Ver Menú',
            'SECTION_KITCHEN': 'En Cocina / Entregado',
            'SECTION_NEW': 'Tu Selección Actual',
            'SUBTOTAL_CONFIRMED': 'Subtotal Confirmado',
            'TOTAL_PAY': 'Total a Pagar',
            'BTN_MORE': 'Más',
            'BTN_CONFIRM': 'Confirmar Pedido',
            'WAITING_ITEMS': 'Esperando items...',
            'SENDING': 'Enviando...',
            'CONFIRM_NEW': 'Confirmar Nuevos',
            'BACK_MENU': 'Volver al Menú',
            'WELCOME_TITLE': 'Bienvenidos',
            'WELCOME_MSG': 'Por favor selecciona tu idioma',
            'STATUS_PENDING': 'Pendiente',
            'STATUS_PREPARING': 'Preparando',
            'STATUS_READY': 'Listo',
            'STATUS_SERVED': 'Servido'
        },
        en: {
            'MENU_TITLE': 'Menu',
            'MENU_SUBTITLE': 'Explore our flavors',
            'TABS_ALL': 'All',
            'ADD_TO_CART': 'Add',
            'CART_TITLE': 'Your Bill',
            'TABLE': 'Table',
            'EMPTY_CART': 'Your cart is empty',
            'EMPTY_CART_MSG': 'You haven\'t ordered anything yet.',
            'VIEW_MENU': 'View Menu',
            'SECTION_KITCHEN': 'In Kitchen / Served',
            'SECTION_NEW': 'Current Selection',
            'SUBTOTAL_CONFIRMED': 'Confirmed Subtotal',
            'TOTAL_PAY': 'Total to Pay',
            'BTN_MORE': 'More',
            'BTN_CONFIRM': 'Confirm Order',
            'WAITING_ITEMS': 'Waiting for items...',
            'SENDING': 'Sending...',
            'CONFIRM_NEW': 'Confirm New Items',
            'BACK_MENU': 'Back to Menu',
            'WELCOME_TITLE': 'Welcome',
            'WELCOME_MSG': 'Please select your language',
            'STATUS_PENDING': 'Pending',
            'STATUS_PREPARING': 'Preparing',
            'STATUS_READY': 'Ready',
            'STATUS_SERVED': 'Served'
        }
    };

    constructor() {
        try {
            const saved = localStorage.getItem('app_lang') as Language;
            if (saved) {
                this.setLanguage(saved);
            }
        } catch (e) {
            console.warn('LocalStorage access denied (Private Mode?)', e);
        }
    }

    setLanguage(lang: Language) {
        this.currentLangSubject.next(lang);
        try {
            localStorage.setItem('app_lang', lang);
        } catch (e) {
            // Ignore if persistence fails
        }
    }

    get(key: string): string {
        return this.dictionary[this.currentLangSubject.value][key] || key;
    }

    getCurrentLang(): Language {
        return this.currentLangSubject.value;
    }
}
