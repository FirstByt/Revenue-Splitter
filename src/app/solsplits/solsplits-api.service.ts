import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  DepositsResponse,
  DepositSortField,
  SplitterDetailsDto,
  SplitterSortField,
  SplittersResponse,
  SortingDir,
} from './models';

@Injectable({ providedIn: 'root' })
export class SolsplitsApiService {
  private base = 'https://splitter-api.solsplits.com/splitter/api';

  constructor(private http: HttpClient) {}

  getSplitters(opts: {
    publicKey: string;
    page?: number;
    limit?: number;
    sortingField?: SplitterSortField;
    sortingDirection?: SortingDir;
  }) {
    let p = new HttpParams().set('publicKey', opts.publicKey);
    if (opts.page != null) p = p.set('page', String(opts.page));
    if (opts.limit != null) p = p.set('limit', String(opts.limit));
    if (opts.sortingField) p = p.set('sortingField', opts.sortingField);
    if (opts.sortingDirection) p = p.set('sortingDirection', opts.sortingDirection);

    return this.http.get<SplittersResponse>(`${this.base}/splitters`, { params: p });
  }

  getSplitterById(splitterId: string, publicKey: string) {
    const p = new HttpParams().set('publicKey', publicKey);
    return this.http.get<SplitterDetailsDto>(`${this.base}/splitters/${splitterId}`, { params: p });
  }

  getDeposits(opts: {
    publicKey: string; 
    splitter: string;
    page?: number;
    limit?: number; 
    sortingField?: DepositSortField;
    sortingDirection?: SortingDir;
  }) {
    let p = new HttpParams()
      .set('publicKey', opts.publicKey)
      .set('splitter', opts.splitter);

    if (opts.page != null) p = p.set('page', String(opts.page));
    if (opts.limit != null) p = p.set('limit', String(opts.limit));
    if (opts.sortingField) p = p.set('sortingField', opts.sortingField);
    if (opts.sortingDirection) p = p.set('sortingDirection', opts.sortingDirection);

    return this.http.get<DepositsResponse>(`${this.base}/splitters/deposits`, { params: p });
  }
}
