import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { select } from 'd3';
import { pieChart, htmlLegend } from 'dc';
import { CommonVariablesService } from './common-variables.service';

@Injectable({
  providedIn: 'root'
})
export class SectorChartService {

  constructor(private cv: CommonVariablesService) { }

  drawSectorChart(){
    let that = this;

    this.cv.sectorPieChart = pieChart("#chart-sector");

    this.cv.sectorPieChart
      .width(180)
      .height(180)
      .radius(80)
      .dimension(this.cv.sectorDimension)
      .group(this.remove_empty_bins(this.cv.sectorGroup))
      .legend(htmlLegend().container('#legend-sector').horizontal("false").highlightSelected("true").legendText((d: any) => {
        return d.name + ' - ' + (d.data / this.cv.sectorGroup.all().reduce(function (a: any, v: any) { return a + v.value; }, 0) * 100).toFixed(2) + "%"
      }))
      .transitionDuration(0)
      // .ordinalColors(['#03a9f5', '#fec107', '#06d441', '#383838', '#0070a0', '#0093d3', '#21bcff', '#56c4f5', '#ff9700', '#fec107', '#ffd54f', '#06d441', '#008c2b', '#717171'])
      .title(() => {
        return ""
      })
      .on("renderlet", () => {
        select("#chart-sector").select(".pie-slice-group").selectAll("g")
          .on("mouseover", function(d){
            that.cv.sectorTooltipVisible = true;
            select("#sector-tooltip").style("display", "block").style("font-family", "Roboto")
          })
          .on("mousemove", function(event){
            let color = event.currentTarget.innerHTML.split(" ")[1].split("=")[1].replaceAll('"', '');
            that.cv.pie_tooltip_text = event.currentTarget.__data__.data.key + ': ';
            that.cv.pie_tooltip_value = (event.currentTarget.__data__.data.value / that.cv.sectorGroup.all().reduce(function (a: any, v: any) { return a + v.value; }, 0) * 100).toFixed(2) + "%"
            select("#sector-tooltip").style("top", (event.clientY)+15+"px").style("left",(event.clientX)+20+"px");
            select("#sector-tooltip").select(".square-color").style("background-color", color)
          })
          .on("mouseout", function(){
            that.cv.sectorTooltipVisible = false;
            select("#sector-tooltip").style("display", "none");
          });
      })
  }

  remove_empty_bins(source_group: any) {
    return {
      all: () => {
        return source_group.all().filter((d: any) => {
          return d.value != 0;
        });
      }
    }
  }

}
