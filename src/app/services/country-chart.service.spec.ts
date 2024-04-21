import { TestBed } from '@angular/core/testing';

import { CountryChartService } from './country-chart.service';

describe('CountryChartService', () => {
  let service: CountryChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CountryChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
