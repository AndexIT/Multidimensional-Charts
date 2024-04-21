import { Subject } from 'rxjs';
import { CommonVariablesService } from './common-variables.service';
import { Injectable } from '@angular/core';
import { pieChart, htmlLegend } from 'dc';
import { select } from 'd3';
const getCountryISO2 = require("country-iso-3-to-2");

@Injectable({
  providedIn: 'root'
})
export class CountryChartService {

  constructor(private cv: CommonVariablesService) { }

  drawMSChart(){
    let that = this;

    this.cv.countryPieChart = pieChart("#chart-country");

    this.cv.countryPieChart
      .width(180)
      .height(180)
      .radius(80)
      .dimension(this.cv.countryDimension)
      .group(this.remove_empty_bins(this.cv.countryGroup))
      .legend(htmlLegend().container('#legend-country').horizontal("false").highlightSelected("true").legendText((d: any) => {
        return d.name + ' - ' + (d.data / this.cv.countryGroup.all().reduce(function (a: any, v: any) { return a + v.value; }, 0) * 100).toFixed(2) + "%"
      }))
      .transitionDuration(0)
      // .ordinalColors(['#03a9f5', '#fec107', '#06d441', '#383838', '#0070a0', '#0093d3', '#21bcff', '#56c4f5', '#ff9700', '#fec107', '#ffd54f', '#06d441', '#008c2b', '#717171'])
      .title(() => {
        return ""
      })
      .on("renderlet", () => {
        select("#legend-country").selectAll(".dc-legend-item-horizontal")
        .each(function(d: any) {
          select(this).select(".dc-legend-item-color").style("border-radius", "50%").append("div").html('<span style="transform: scale(0.7);" class="fi fi-' + getCountryISO2(d.name).toLowerCase() + '" fis></span>')
        })


        select("#chart-country").select(".pie-slice-group").selectAll("g")
          .on("mouseover", function(d){
            that.cv.countryTooltipVisible = true;
            select("#country-tooltip").style("display", "block").style("font-family", "Roboto")
          })
          .on("mousemove", function(event){
            let color = event.currentTarget.innerHTML.split(" ")[1].split("=")[1].replaceAll('"', '');
            that.cv.pie_tooltip_text = event.currentTarget.__data__.data.key + ': ';
            that.cv.pie_tooltip_value = (event.currentTarget.__data__.data.value / that.cv.countryGroup.all().reduce(function (a: any, v: any) { return a + v.value; }, 0) * 100).toFixed(2) + "%"
            select("#country-tooltip").style("top", (event.clientY)+15+"px").style("left",(event.clientX)+20+"px");
            select("#country-tooltip").select(".square-color").style("background-color", color)
          })
          .on("mouseout", function(){
            that.cv.countryTooltipVisible = false;
            select("#country-tooltip").style("display", "none");
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
