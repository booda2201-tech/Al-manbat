import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import type { ApiAdvertisement, ApiAnnouncement, ApiVideo } from '../api/api.models';
import { apiUrl, unwrapList } from '../api/api.util';
import type { HeroAd } from '../types';

@Injectable({ providedIn: 'root' })
export class ContentApiService {
  constructor(private http: HttpClient) {}

  announcements(): Observable<ApiAnnouncement[]> {
    return this.list<ApiAnnouncement>('/api/Announcements/GetAll');
  }

  advertisements(): Observable<ApiAdvertisement[]> {
    return this.list<ApiAdvertisement>('/api/Advertisements/GetAll');
  }

  videos(): Observable<ApiVideo[]> {
    return this.list<ApiVideo>('/api/Videos/GetAll');
  }

  private list<T>(path: string): Observable<T[]> {
    return this.http.get(apiUrl(path), { params: { activeOnly: true } }).pipe(
      map((body) => unwrapList(body) as T[]),
      catchError(() => of([]))
    );
  }
}

function line(ar?: string | null, en?: string | null, plain?: string | null): { ar: string; en: string } | undefined {
  const arabic = (ar || plain || en || '').trim();
  const english = (en || plain || ar || '').trim();
  if (!arabic && !english) return undefined;
  return { ar: arabic || english, en: english || arabic };
}

export function mapAdvertisement(dto: ApiAdvertisement): HeroAd | null {
  const image = (dto.imageUrl || '').trim();
  const heading = line(dto.headingAr, dto.headingEn, dto.heading);
  if (!image || !heading || dto.isActive === false) return null;
  const primaryLabel = line(dto.primaryLabelAr, dto.primaryLabelEn, dto.primaryLabel);
  const secondaryLabel = line(dto.secondaryLabelAr, dto.secondaryLabelEn, dto.secondaryLabel);
  const primaryTo = (dto.primaryLink || '').trim();
  const secondaryTo = (dto.secondaryLink || '').trim();
  return {
    id: `ad-${dto.id}`,
    image,
    badge: line(dto.badgeAr, dto.badgeEn, dto.badge),
    eyebrow: line(dto.eyebrowAr, dto.eyebrowEn, dto.eyebrow) || { ar: '', en: '' },
    heading,
    body: line(dto.bodyAr, dto.bodyEn, dto.body) || { ar: '', en: '' },
    primary: primaryLabel && primaryTo ? { label: primaryLabel, to: primaryTo } : undefined,
    secondary: secondaryLabel && secondaryTo ? { label: secondaryLabel, to: secondaryTo } : undefined,
  };
}

export function bySort<T extends { sortOrder?: number | null; id: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) || a.id - b.id);
}
