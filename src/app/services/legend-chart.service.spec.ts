import { TestBed } from '@angular/core/testing';

import { LegendChartService } from './legend-chart.service';

describe('LegendChartService', () => {
  let service: LegendChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LegendChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
