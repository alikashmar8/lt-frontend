import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { Direction } from '@angular/cdk/bidi';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  public currentLang = new BehaviorSubject<string>('ar');
  public currentDir: BehaviorSubject<Direction> = new BehaviorSubject<Direction>('rtl');
  public supportedLangs = ['ar', 'en'];
  private isBrowser: boolean;

  constructor(
    private translate: TranslateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Get language from local storage or default to Arabic
    let savedLang = 'ar'; // Default to Arabic

    // Only access localStorage in browser environment
    if (this.isBrowser) {
      try {
        savedLang = localStorage.getItem('selectedLang') || 'ar';
      } catch (e) {
        console.error('Error accessing localStorage', e);
      }
    }

    this.initLanguage(savedLang);
  }

  initLanguage(lang: string): void {
    if (!this.supportedLangs.includes(lang)) {
      lang = 'ar'; // Default to Arabic if unsupported language
    }

    // Set language and direction
    this.translate.setDefaultLang('ar');
    this.translate.use(lang);
    this.currentLang.next(lang);

    // Set text direction based on language
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.currentDir.next(dir as Direction);

    // Store in local storage (only in browser)
    if (this.isBrowser) {
      try {
        localStorage.setItem('selectedLang', lang);

        // Update document attributes (only available in browser)
        document.documentElement.lang = lang;
        document.documentElement.dir = dir;
        document.body.dir = dir;
      } catch (e) {
        console.error('Error storing language preference', e);
      }
    }
  }

  switchLanguage(lang: string): void {
    this.initLanguage(lang);
  }

  getCurrentLang(): string {
    return this.currentLang.value;
  }

  isCurrentLang(lang: string): boolean {
    return this.currentLang.value === lang;
  }

  isRTL(): boolean {
    return this.currentDir.value === 'rtl';
  }
}
