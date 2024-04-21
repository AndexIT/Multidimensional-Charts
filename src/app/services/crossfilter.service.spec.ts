import { TestBed } from '@angular/core/testing';

import { CrossfilterService } from './crossfilter.service';

describe('CrossfilterService', () => {
  let service: CrossfilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CrossfilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
