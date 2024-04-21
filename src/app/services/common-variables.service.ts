import { Subject } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { Injectable } from '@angular/core';
import crossfilter from 'crossfilter2';

@Injectable({
  providedIn: 'root'
})
export class CommonVariablesService {

  setDatasourceSubject = new Subject<void>();

  jsonData: any[] = [];
  ndx!: crossfilter.Crossfilter<any>;
  dataGroup!: crossfilter.Group<any, crossfilter.NaturallyOrderedValue, unknown>;
  dataDimension!: crossfilter.Dimension<any, any>;
  countryPieChart: any;
  countryTooltipVisible: boolean = false;
  pie_tooltip_text: string = "";
  pie_tooltip_value: string = "";
  countryDimension!: crossfilter.Dimension<any, any>;
  countryGroup!: crossfilter.Group<any, crossfilter.NaturallyOrderedValue, unknown>;
  sectorDimension!: crossfilter.Dimension<any, any>;
  sectorGroup!: crossfilter.Group<any, crossfilter.NaturallyOrderedValue, unknown>;
  sectorTooltipVisible: boolean = false;
  sectorPieChart: any;
  performanceGroup!: crossfilter.Group<any, crossfilter.NaturallyOrderedValue, unknown>;
  rangeChart: any;
  x_range: any;
  minScaleTime: any
  maxScaleTime: any
  rangeTooltipVisble: boolean = false;
  rangeTooltipDate: any;
  rangeTooltipValue: any;
  performanceChart: any;
  performanceTooltipVisible: boolean = false;
  x_performance: any;
  data_tooltip_text: string = "";
  ctv_tooltip1_text: string = "";
  ctv_tooltip2_text: string = "";
  performanceDimension!: crossfilter.Dimension<any, any>;
  legendChart: any;
  legendDimension!: crossfilter.Dimension<any, any>;
  legendGroup!: crossfilter.Group<any, crossfilter.NaturallyOrderedValue, unknown>;
  performance_tooltip_text: string = "";

  prezzoIniziale: number = 0

  checked: boolean = true

  rendimentiMedi: any = {};
  rendimentiMediBenchmark: any = {};

  rendimentiMediPerf: any = {};
  rendimentiMediPerfBench: any = {};
  rendimentiMediRange: any = {};
  rendimentiMediRangeBench: any = {};
  arrayBenchmark: any[] = [];
  info_ratio: any = [];
  info_ratio_datasource!: MatTableDataSource<any>;
  maxDD: number = 0;
  MDD_datasource!: MatTableDataSource<{ maxDD: number; }>;


  constructor() { }
}
