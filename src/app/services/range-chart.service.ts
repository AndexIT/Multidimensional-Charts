import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { timeMonths, select, pointer, scaleTime, bisector } from 'd3';
import { lineChart } from 'dc';
import { CommonVariablesService } from './common-variables.service';
import crossfilter from 'crossfilter2';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class RangeChartService {

  activateFn = new Subject<void>();

  constructor(
    private cv: CommonVariablesService,
    private datePipe: DatePipe
  ) { }

  drawRangeChart(){
    let that = this;

    this.cv.x_range = scaleTime().domain([this.cv.minScaleTime, this.cv.maxScaleTime]);

    this.cv.rangeChart = lineChart("#range-chart");

    this.cv.rangeChart
    .width(null)
    .height(100)
    .renderArea(true)
    .margins({ left: 25, top: 30, right: 20, bottom: 0 })
    .valueAccessor((p: any) => Math.round(p.value.rendimento * 1000) / 1000)
    .transitionDuration(0)
    .dimension(this.cv.dataDimension)
    .brushOn(true)
    .x(this.cv.x_range)
    .xUnits(timeMonths)
    .elasticY(true)
    .group(this.setValueGroup(this.cv.performanceGroup))
    .on('filtered', (chart: any) => {
      this.activateFn.next()
    })
    .on('renderlet', (chart: any) => {
      select("#range-chart")
        .on("mouseover", () => this.cv.rangeTooltipVisble = true)
        .on("mousemove", (event) => {
          let x0 = chart._x.invert(pointer(event)[0] - 24);
          var bisect = bisector(function(d: any) { return d.x; }).left;

          const i = bisect(chart._stack[0].domainValues, x0, 1);
          const d0 = chart._stack[0].domainValues[i - 1];
          const d1 = chart._stack[0].domainValues[i];
          let res = d1 && ((x0 as any) - (d0.x as any) > (d1.x as any) - (x0 as any)) ? d1 : d0;

          that.cv.rangeTooltipDate = res.x
          that.cv.rangeTooltipValue = res.data.value.rendimento
          select("#range-tooltip").style("display", "block");
          select("#range-tooltip").style("top", (event.clientY)-30+"px").style("left",(event.clientX)+20+"px")

        })
        .on("mouseout", () => {
          that.cv.rangeTooltipVisble = false;
          that.cv.rangeTooltipDate = ""
          that.cv.rangeTooltipValue = ""
          // that.cv.range_tooltip_text_crisi = "";
          // that.cv.range_tooltip_text_movimenti = "";
          // that.cv.range_tooltip_text_movimenti_importo = "";
          select("#range-tooltip").style("display", "none");
        })

    })
    .on('pretransition', function (chart: any) {
      chart.select("svg").classed("svgRangeChart", true).selectAll(".tick").select("text").classed("rotateText", true)
    })

    let numberOfMonth
    numberOfMonth = this.cv.maxScaleTime.getMonth() - this.cv.minScaleTime.getMonth() + 12 * (this.cv.maxScaleTime.getFullYear() - this.cv.minScaleTime.getFullYear())
    numberOfMonth = numberOfMonth <= 36 ? numberOfMonth : 36;
    numberOfMonth = numberOfMonth >= 30 ? numberOfMonth : 30;

    this.cv.rangeChart.xAxis().tickFormat(function (v: any) {
      let giorno = v.getDate()
      if (giorno < 10) giorno = '0' + giorno
      let mese = v.getMonth() + 1
      if (mese < 10) mese = '0' + mese
      let anno = v.getFullYear().toString().substring(2, 4)
      return giorno + '/' + mese + '/' + anno;
    });
    this.cv.rangeChart.yAxis().ticks(0);
    this.cv.rangeChart.xAxis().ticks(numberOfMonth);
  }

  setValueGroup(group: crossfilter.Group<any, crossfilter.NaturallyOrderedValue, unknown>){
    this.cv.rendimentiMediRange = this.cv.rendimentiMedi;
    return {
      all: () => {
        return group.all().filter((el: any) => {
          let currentDay = this.datePipe.transform(el.key, "yyyy-MM-dd")!
          let prevDate = this.datePipe.transform(new Date(new Date(currentDay).setDate(new Date(currentDay).getDate() - 1)), "yyyy-MM-dd")!
          let r_m_g_prev = this.cv.rendimentiMediRange[prevDate] ? this.cv.rendimentiMediRange[prevDate].r_m_tot : 0;

          this.cv.rendimentiMediRange[currentDay].r_m_tot =
            (
              this.cv.rendimentiMediRange[currentDay].r_g_medio * (r_m_g_prev + 1)
            ) + r_m_g_prev;

          this.cv.rendimentiMediPerf[currentDay].r_m_tot = parseFloat(this.cv.rendimentiMediPerf[currentDay].r_m_tot.toFixed(10))

          el.value.rendimento = this.cv.rendimentiMediRange[currentDay].r_m_tot;

          return el;
        });
      }
    }
  }

}
