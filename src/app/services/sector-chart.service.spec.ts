import { TestBed } from '@angular/core/testing';

import { SectorChartService } from './sector-chart.service';

describe('SectorChartService', () => {
  let service: SectorChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SectorChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
