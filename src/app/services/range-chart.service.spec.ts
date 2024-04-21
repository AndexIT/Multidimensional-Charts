import { TestBed } from '@angular/core/testing';

import { RangeChartService } from './range-chart.service';

describe('RangeChartService', () => {
  let service: RangeChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RangeChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
