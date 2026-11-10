import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Observable } from 'rxjs';
import type { ApiAdvertisement, ApiAnnouncement, ApiVideo } from '../api/api.models';
import { AdminApiService } from '../services/admin-api.service';
import { CatalogService } from '../services/catalog.service';
import { LocaleService } from '../services/locale.service';
import { StoreService } from '../services/store.service';
import { bySort } from '../services/content-api.service';
import { IconComponent } from '../ui/icon.component';

type MediaKind = 'announcements' | 'ads' | 'videos';

interface AnnouncementDraft {
  id: number;
  textAr: string;
  textEn: string;
  link: string;
  sortOrder: number;
  isActive: boolean;
}

interface AdDraft {
  id: number;
  imageUrl: string;
  imageFile?: File;
  imagePreview?: string;
  badgeAr: string;
  badgeEn: string;
  eyebrowAr: string;
  eyebrowEn: string;
  headingAr: string;
  headingEn: string;
  bodyAr: string;
  bodyEn: string;
  primaryLabelAr: string;
  primaryLabelEn: string;
  primaryLink: string;
  secondaryLabelAr: string;
  secondaryLabelEn: string;
  secondaryLink: string;
  sortOrder: number;
  isActive: boolean;
}

interface VideoDraft {
  id: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  videoUrl: string;
  videoFile?: File;
  videoName: string;
  thumbnailUrl: string;
  thumbnailFile?: File;
  thumbnailPreview?: string;
  removeThumbnail: boolean;
  sortOrder: number;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-media',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './admin-media.component.html',
})
export class AdminMediaComponent implements OnInit, OnDestroy {
  @Input() kind: MediaKind = 'announcements';
  loading = true;
  loadError = '';
  saving = false;
  formOpen = false;
  selectedId: number | null = null;
  announcements: ApiAnnouncement[] = [];
  ads: ApiAdvertisement[] = [];
  videos: ApiVideo[] = [];
  announcementDraft = blankAnnouncement();
  adDraft = blankAd();
  videoDraft = blankVideo();

  constructor(
    public locale: LocaleService,
    private admin: AdminApiService,
    private catalog: CatalogService,
    private store: StoreService
  ) {}

  linkChoices(current: string): { path: string; ar: string; en: string }[] {
    const pages = [
      { path: '', ar: 'من غير رابط', en: 'No link' },
      { path: '/listing/all', ar: 'كل المنتجات', en: 'All products' },
      { path: '/offers', ar: 'العروض', en: 'Offers' },
      { path: '/new', ar: 'وصل حديثاً', en: 'New arrivals' },
      { path: '/about', ar: 'عن المنبت', en: 'About' },
      { path: '/faq', ar: 'الأسئلة الشائعة', en: 'FAQ' },
      { path: '/videos', ar: 'الفيديوهات', en: 'Videos' },
      ...this.catalog.categories().map((category) => ({
        path: `/listing/${category.slug}`,
        ar: category.name.ar,
        en: category.name.en,
      })),
    ];
    const value = (current || '').trim();
    if (value && !pages.some((page) => page.path === value)) pages.push({ path: value, ar: value, en: value });
    return pages;
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.revokePreviews();
  }

  get note(): string {
    if (this.kind === 'announcements') {
      return this.locale.isAr()
        ? 'الجمل التي تمر في الشريط أعلى الموقع.'
        : 'Lines that scroll in the bar at the top of the site.';
    }
    if (this.kind === 'ads') {
      return this.locale.isAr()
        ? 'صور الهيرو في أول الصفحة. سطر جديد في العنوان يظهر كما هو.'
        : 'Hero images on the home page. A new line in the title is kept.';
    }
    return this.locale.isAr()
      ? 'الفيديوهات التي تظهر في صفحة الفيديوهات.'
      : 'Videos shown on the videos page.';
  }

  get addLabel(): string {
    if (this.kind === 'announcements') return this.locale.isAr() ? 'إضافة جملة' : 'Add line';
    if (this.kind === 'ads') return this.locale.isAr() ? 'إضافة إعلان' : 'Add banner';
    return this.locale.isAr() ? 'إضافة فيديو' : 'Add video';
  }

  get emptyLabel(): string {
    if (this.kind === 'announcements') return this.locale.isAr() ? 'لا توجد جمل في الشريط بعد.' : 'No ticker lines yet.';
    if (this.kind === 'ads') return this.locale.isAr() ? 'لا توجد إعلانات للهيرو بعد.' : 'No hero banners yet.';
    return this.locale.isAr() ? 'لا توجد فيديوهات بعد.' : 'No videos yet.';
  }

  openNew(): void {
    this.revokePreviews();
    this.selectedId = null;
    if (this.kind === 'announcements') this.announcementDraft = blankAnnouncement(this.nextSort(this.announcements));
    if (this.kind === 'ads') this.adDraft = blankAd(this.nextSort(this.ads));
    if (this.kind === 'videos') this.videoDraft = blankVideo(this.nextSort(this.videos));
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
    this.revokePreviews();
  }

  select(id: number): void {
    this.selectedId = this.selectedId === id ? null : id;
  }

  editAnnouncement(row: ApiAnnouncement): void {
    this.announcementDraft = {
      id: row.id,
      textAr: row.textAr || row.text || '',
      textEn: row.textEn || '',
      link: row.link || '',
      sortOrder: Number(row.sortOrder) || 0,
      isActive: row.isActive !== false,
    };
    this.formOpen = true;
    this.selectedId = null;
  }

  editAd(row: ApiAdvertisement): void {
    this.revokePreviews();
    this.adDraft = {
      id: row.id,
      imageUrl: row.imageUrl || '',
      badgeAr: row.badgeAr || row.badge || '',
      badgeEn: row.badgeEn || '',
      eyebrowAr: row.eyebrowAr || row.eyebrow || '',
      eyebrowEn: row.eyebrowEn || '',
      headingAr: row.headingAr || row.heading || '',
      headingEn: row.headingEn || '',
      bodyAr: row.bodyAr || row.body || '',
      bodyEn: row.bodyEn || '',
      primaryLabelAr: row.primaryLabelAr || row.primaryLabel || '',
      primaryLabelEn: row.primaryLabelEn || '',
      primaryLink: row.primaryLink || '',
      secondaryLabelAr: row.secondaryLabelAr || row.secondaryLabel || '',
      secondaryLabelEn: row.secondaryLabelEn || '',
      secondaryLink: row.secondaryLink || '',
      sortOrder: Number(row.sortOrder) || 0,
      isActive: row.isActive !== false,
    };
    this.formOpen = true;
    this.selectedId = null;
  }

  editVideo(row: ApiVideo): void {
    this.revokePreviews();
    this.videoDraft = {
      id: row.id,
      titleAr: row.titleAr || row.title || '',
      titleEn: row.titleEn || '',
      descriptionAr: row.descriptionAr || row.description || '',
      descriptionEn: row.descriptionEn || '',
      videoUrl: row.videoUrl || '',
      videoName: '',
      thumbnailUrl: row.thumbnailUrl || '',
      removeThumbnail: false,
      sortOrder: Number(row.sortOrder) || 0,
      isActive: row.isActive !== false,
    };
    this.formOpen = true;
    this.selectedId = null;
  }

  onAdImage(ev: Event): void {
    const file = this.picked(ev, 5 * 1024 * 1024, this.locale.isAr() ? 'صورة الإعلان أكبر من ٥ ميجا.' : 'Banner image is larger than 5 MB.');
    if (!file) return;
    this.revoke(this.adDraft.imagePreview);
    this.adDraft.imageFile = file;
    this.adDraft.imagePreview = URL.createObjectURL(file);
  }

  onVideoFile(ev: Event): void {
    const file = this.picked(ev, 50 * 1024 * 1024, this.locale.isAr() ? 'الفيديو أكبر من ٥٠ ميجا.' : 'Video is larger than 50 MB.');
    if (!file) return;
    this.videoDraft.videoFile = file;
    this.videoDraft.videoName = file.name;
  }

  onThumb(ev: Event): void {
    const file = this.picked(ev, 5 * 1024 * 1024, this.locale.isAr() ? 'صورة الغلاف أكبر من ٥ ميجا.' : 'Cover image is larger than 5 MB.');
    if (!file) return;
    this.revoke(this.videoDraft.thumbnailPreview);
    this.videoDraft.thumbnailFile = file;
    this.videoDraft.thumbnailPreview = URL.createObjectURL(file);
    this.videoDraft.removeThumbnail = false;
  }

  clearThumb(): void {
    this.revoke(this.videoDraft.thumbnailPreview);
    this.videoDraft.thumbnailFile = undefined;
    this.videoDraft.thumbnailPreview = '';
    this.videoDraft.thumbnailUrl = '';
    this.videoDraft.removeThumbnail = this.videoDraft.id > 0;
  }

  saveAnnouncement(ev: Event): void {
    ev.preventDefault();
    const draft = this.announcementDraft;
    const form = ev.target as HTMLFormElement;
    const data = new FormData(form);
    draft.textAr = String(data.get('annAr') ?? draft.textAr ?? '');
    draft.textEn = String(data.get('annEn') ?? draft.textEn ?? '');
    draft.link = String(data.get('annLink') ?? draft.link ?? '');
    const sort = Number(data.get('annSort'));
    if (Number.isFinite(sort)) draft.sortOrder = sort;
    draft.isActive = form.querySelector<HTMLInputElement>('input[name="annActive"]')?.checked ?? draft.isActive;
    if (!draft.textAr.trim() && !draft.textEn.trim()) {
      this.toast(this.locale.isAr() ? 'اكتب الجملة بالعربي أو الإنجليزي.' : 'Write the line in Arabic or English.', 'warning');
      return;
    }
    this.saving = true;
    const req = draft.id ? this.admin.updateAnnouncement(draft) : this.admin.addAnnouncement(draft);
    req.subscribe({
      next: () => this.done(this.locale.isAr() ? 'تم حفظ جملة الشريط' : 'Ticker line saved'),
      error: (err) => this.fail(err),
    });
  }

  saveAd(ev: Event): void {
    ev.preventDefault();
    const draft = this.adDraft;
    if (!draft.id && !draft.imageFile) {
      this.toast(this.locale.isAr() ? 'اختر صورة الإعلان.' : 'Choose a banner image.', 'warning');
      return;
    }
    if (!draft.headingAr.trim() && !draft.headingEn.trim()) {
      this.toast(this.locale.isAr() ? 'اكتب عنوان الإعلان.' : 'Write the banner title.', 'warning');
      return;
    }
    this.saving = true;
    const req = draft.id
      ? this.admin.updateAdvertisement(draft, draft.imageFile)
      : this.admin.addAdvertisement(draft, draft.imageFile as File);
    req.subscribe({
      next: () => this.done(this.locale.isAr() ? 'تم حفظ إعلان الهيرو' : 'Hero banner saved'),
      error: (err) => this.fail(err),
    });
  }

  saveVideo(ev: Event): void {
    ev.preventDefault();
    const draft = this.videoDraft;
    if (!draft.videoFile && !draft.videoUrl.trim()) {
      this.toast(this.locale.isAr() ? 'ارفع فيديو أو الصق رابطه.' : 'Upload a video or paste its link.', 'warning');
      return;
    }
    if (!draft.titleAr.trim() && !draft.titleEn.trim()) {
      this.toast(this.locale.isAr() ? 'اكتب عنوان الفيديو.' : 'Write the video title.', 'warning');
      return;
    }
    this.saving = true;
    const req = draft.id
      ? this.admin.updateVideo(draft, draft.videoFile, draft.thumbnailFile, draft.removeThumbnail)
      : this.admin.addVideo(draft, draft.videoFile, draft.thumbnailFile);
    req.subscribe({
      next: () => this.done(this.locale.isAr() ? 'تم حفظ الفيديو' : 'Video saved'),
      error: (err) => this.fail(err),
    });
  }

  removeAnnouncement(row: ApiAnnouncement): void {
    this.remove(row.textAr || row.textEn || row.text || '', () => this.admin.deleteAnnouncement(row.id));
  }

  removeAd(row: ApiAdvertisement): void {
    this.remove(row.headingAr || row.headingEn || row.heading || '', () => this.admin.deleteAdvertisement(row.id));
  }

  removeVideo(row: ApiVideo): void {
    this.remove(row.titleAr || row.titleEn || row.title || '', () => this.admin.deleteVideo(row.id));
  }

  announcementText(row: ApiAnnouncement): string {
    return this.locale.isAr() ? row.textAr || row.text || row.textEn || '' : row.textEn || row.text || row.textAr || '';
  }

  adTitle(row: ApiAdvertisement): string {
    return this.locale.isAr() ? row.headingAr || row.heading || row.headingEn || '' : row.headingEn || row.heading || row.headingAr || '';
  }

  videoTitle(row: ApiVideo): string {
    return this.locale.isAr() ? row.titleAr || row.title || row.titleEn || '' : row.titleEn || row.title || row.titleAr || '';
  }

  private load(): void {
    this.loading = true;
    this.loadError = '';
    const done = (): void => {
      this.loading = false;
    };
    const fail = (err: unknown): void => {
      this.loading = false;
      this.loadError = err instanceof Error && err.message ? err.message : this.locale.isAr() ? 'تعذر تحميل البيانات.' : 'Could not load the list.';
    };
    if (this.kind === 'announcements') {
      this.admin.getAnnouncements().subscribe({
        next: (rows) => {
          this.announcements = bySort(rows);
          done();
        },
        error: fail,
      });
      return;
    }
    if (this.kind === 'ads') {
      this.admin.getAdvertisements().subscribe((rows) => {
        this.ads = bySort(rows);
        done();
      });
      return;
    }
    this.admin.getVideos().subscribe((rows) => {
      this.videos = bySort(rows);
      done();
    });
  }

  private done(title: string): void {
    this.saving = false;
    this.closeForm();
    this.toast(title, 'success');
    this.load();
  }

  private fail(err: unknown): void {
    this.saving = false;
    const message = err instanceof Error && err.message ? err.message : '';
    this.toast(message || (this.locale.isAr() ? 'تعذر الحفظ. حاول مرة أخرى.' : 'Could not save. Try again.'), 'warning');
  }

  private remove(name: string, run: () => Observable<unknown>): void {
    const ok = window.confirm(this.locale.isAr() ? `حذف «${name || 'هذا العنصر'}»؟` : `Delete “${name || 'this item'}”?`);
    if (!ok) return;
    this.selectedId = null;
    this.saving = true;
    run().subscribe({
      next: () => this.done(this.locale.isAr() ? 'تم الحذف' : 'Deleted'),
      error: (err) => this.fail(err),
    });
  }

  private picked(ev: Event, max: number, tooBig: string): File | null {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    input.value = '';
    if (!file) return null;
    if (file.size > max) {
      this.toast(tooBig, 'warning');
      return null;
    }
    return file;
  }

  private nextSort(rows: Array<{ sortOrder?: number | null }>): number {
    return rows.reduce((max, row) => Math.max(max, Number(row.sortOrder) || 0), 0) + 1;
  }

  private toast(title: string, tone: 'success' | 'warning'): void {
    this.store.pushToast({ title, tone });
  }

  private revokePreviews(): void {
    this.revoke(this.adDraft.imagePreview);
    this.revoke(this.videoDraft.thumbnailPreview);
  }

  private revoke(url?: string): void {
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
  }
}

function blankAnnouncement(sortOrder = 1): AnnouncementDraft {
  return { id: 0, textAr: '', textEn: '', link: '', sortOrder, isActive: true };
}

function blankAd(sortOrder = 1): AdDraft {
  return {
    id: 0,
    imageUrl: '',
    badgeAr: '',
    badgeEn: '',
    eyebrowAr: '',
    eyebrowEn: '',
    headingAr: '',
    headingEn: '',
    bodyAr: '',
    bodyEn: '',
    primaryLabelAr: '',
    primaryLabelEn: '',
    primaryLink: '',
    secondaryLabelAr: '',
    secondaryLabelEn: '',
    secondaryLink: '',
    sortOrder,
    isActive: true,
  };
}

function blankVideo(sortOrder = 1): VideoDraft {
  return {
    id: 0,
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    videoUrl: '',
    videoName: '',
    thumbnailUrl: '',
    removeThumbnail: false,
    sortOrder,
    isActive: true,
  };
}
