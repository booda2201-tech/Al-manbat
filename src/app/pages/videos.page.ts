import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import type { ApiVideo } from '../api/api.models';
import { CrumbsComponent } from '../commerce/crumbs.component';
import { bySort, ContentApiService } from '../services/content-api.service';
import { LocaleService } from '../services/locale.service';

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [CommonModule, CrumbsComponent],
  templateUrl: './videos.page.html',
})
export class VideosPageComponent implements OnInit {
  loading = true;
  videos: ApiVideo[] = [];

  constructor(public locale: LocaleService, private content: ContentApiService) {}

  ngOnInit(): void {
    this.content.videos().subscribe((rows) => {
      this.videos = bySort(rows).filter((row) => row.isActive !== false && !!(row.videoUrl || '').trim());
      this.loading = false;
    });
  }

  title(row: ApiVideo): string {
    return this.locale.isAr() ? row.titleAr || row.title || row.titleEn || '' : row.titleEn || row.title || row.titleAr || '';
  }

  description(row: ApiVideo): string {
    return this.locale.isAr()
      ? row.descriptionAr || row.description || row.descriptionEn || ''
      : row.descriptionEn || row.description || row.descriptionAr || '';
  }

  get trail() {
    return [
      { label: this.locale.isAr() ? 'الرئيسية' : 'Home', to: '/' },
      { label: this.locale.isAr() ? 'فيديوهات' : 'Videos' },
    ];
  }
}
