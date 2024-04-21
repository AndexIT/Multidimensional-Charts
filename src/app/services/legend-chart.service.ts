import { Subject } from 'rxjs';
import { CommonVariablesService } from './common-variables.service';
import { Injectable } from '@angular/core';
import { group, select } from 'd3';
import { pieChart, htmlLegend } from 'dc';

@Injectable({
  providedIn: 'root'
})
export class LegendChartService {
  filter: string = "";

  constructor(private cv: CommonVariablesService) { }

  drawLegendChart(){
    this.cv.legendChart = pieChart("#legend-chart");

    this.cv.legendChart
      .width(null)
      .height(null)
      .radius(null)
      .dimension(this.cv.legendDimension)
      .group(this.remove_empty_bins(this.cv.legendGroup))
      .legend(htmlLegend().container('#legenda-legend').horizontal("true").highlightSelected("true"))
      // .ordinalColors(['#03a9f5', '#fec107', '#06d441', '#383838', '#0070a0', '#0093d3', '#21bcff', '#56c4f5', '#ff9700', '#fec107', '#ffd54f', '#06d441', '#008c2b', '#717171'])
  }

  remove_empty_bins(source_group: any) {
    let that = this;
    return {
      all: () => {
        return source_group.all().filter((d: any) => {
          return d.value != 0 && d.key.toLowerCase().includes(that.filter);
        });
      }
    }
  }

  applyFilter(f: string){
    this.filter = f
    this.cv.legendChart.redraw()
  }
}
