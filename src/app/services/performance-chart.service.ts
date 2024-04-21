import { CommonVariablesService } from './common-variables.service';
import { Injectable } from '@angular/core';
import { select, pointer, bisector, scaleTime, timeMonths } from 'd3';
import { htmlLegend, lineChart } from 'dc';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import crossfilter from 'crossfilter2';
import { MatTableDataSource } from '@angular/material/table';

@Injectable({
  providedIn: 'root'
})
export class PerformanceChartService {
  elementiMacroenomici: {data_inizio: string, descrizione: string}[] = [
    {data_inizio: "2014-04-01", descrizione: "Esempio elemento macroeconomico 1"},
    {data_inizio: "2011-01-01", descrizione: "Esempio elemento macroeconomico 2"},
    {data_inizio: "2017-01-01", descrizione: "Esempio elemento macroeconomico 3"},
    {data_inizio: "2021-01-01", descrizione: "Esempio elemento macroeconomico 4"},

  ];
  firstTime: boolean = true;

  constructor(
    private cv: CommonVariablesService,
    private datePipe: DatePipe
  ) { }

  drawPerformanceChart(min: Date, max: Date, dimension?: any){
    let that = this;
    let mPerfLeft = 60
    let mPerfTop = 60
    let mPerfRight = 40
    let mPerfBottom = 20

    this.cv.performanceChart = lineChart("#chart-performance")
    this.cv.x_performance = scaleTime().domain([min, max]);

    select("#chart-performance").append("div").attr("id","legend-performance").classed("line-legend", true);

    this.cv.performanceChart
      .zoomOutRestrict(true)
      .renderArea(false)
      .width(null)
      .height(280)
      .margins({ left: mPerfLeft, top: mPerfTop, right: mPerfRight, bottom: mPerfBottom })
      .transitionDuration(0)
      .dimension(dimension ? dimension : this.cv.dataDimension)
      .group(this.setValueGroup(this.cv.performanceGroup, min, max), 'Rendimento')
      .mouseZoomable(false)
      .x(this.cv.x_performance)
      .xUnits(timeMonths)
      .valueAccessor((p: any) => Math.round(p.value.rendimento * 1000) / 1000)
      .colors('#1f77b4')
      .legend(htmlLegend().container('#legend-performance').horizontal("true").highlightSelected("true"))
      .elasticY(true)
      .xyTipsOn(false)
      .brushOn(false)
      .renderHorizontalGridLines(true)
      .renderVerticalGridLines(true)
      .on('renderlet', (chart: any) => {

        chart.select('svg').select('g').select('g').selectAll('.mov-line').remove();

        that.elementiMacroenomici.forEach((o: {data_inizio: string, descrizione: string}) => {
          if (that.cv.x_performance(new Date(o.data_inizio)) >= 0 && that.cv.x_performance(new Date(o.data_inizio)) <= (chart.width() - 40 - 60)) {
            chart.select('svg').select('g').select('g').append("line")
              .attr('class', 'mov-line')
              .attr("x1", that.cv.x_performance(new Date(o.data_inizio)))
              .attr("y1", 0)
              .attr("x2", that.cv.x_performance(new Date(o.data_inizio)))
              .attr("y2", (chart.height() - mPerfTop - mPerfBottom))
              .style("stroke-width", 1)
              .style("stroke", "red")
              .classed("display-none", !that.cv.checked)

            chart.select('svg').select('g').select('g').append("text")
              .attr('class', 'mov-line')
              .attr("y", (chart.height() / 2) - 12)
              .attr("x", that.cv.x_performance(new Date(o.data_inizio)) - 25)
              .attr('text-anchor', 'middle')
              .text(function () {
                return o.descrizione
              })
              .style("fill", "black")
              .style("stroke", "none")
              .style("font-size", 10)
              .attr("transform", "rotate(90, " + (that.cv.x_performance(new Date(o.data_inizio)) + 5) + ", " + ((chart.height() / 2) - 12) + ")")
              .classed("display-none", !that.cv.checked)
          }
        })


        select( ".focus").remove();
        select("#performance-tooltip").style("display", "none");

        let focus = select("#chart-performance").select("svg").select(".chart-body")
        .append("g")
        .attr("class", "focus")
        .style("display", "none");

        let x0: any, _rendimento: any

        focus
          .append("line")
          .attr("class", "x-hover-line hover-line")
          .attr("y1", 0)
          .attr("y2", chart._minHeight);

        // vecchio recupero colore dinamico
        // let color = chart._legend._g._groups[0][0].children[0].innerHTML.split(">")[0].split(" ")[3].split("=")[1].replaceAll('"', '');

        let color = "#1f77b4"
        let circle = focus.append("circle").attr("r", 5).attr("id", "performance-circle").attr("stroke", color)
        select("#performance-tooltip").select(".performance-square-color").style("background-color", color)

        select("#chart-performance").select("svg")
          .on("mouseover", () => {
            that.cv.performanceTooltipVisible = true;
            focus.style("display", "block")
            select("#performance-tooltip").style("display", "block")

          })
          .on("mousemove", (event : any) => {
            x0 = chart._x.invert(pointer(event)[0] - 56);
            var bisect = bisector(function(d: any) { return d.x; }).left;

            const i = bisect(chart._stack[0].domainValues, x0, 1);

            if (i === chart._stack[0].domainValues.length) {

              focus.style("display", "none");
              select("#performance-tooltip").style("display", "none");

            } else {
                const d0 = chart._stack[0].domainValues[i - 1];
                const d1 = chart._stack[0].domainValues[i];
                _rendimento = (x0 as any) - (d0.x as any) > (d1.x as any) - (x0 as any) ? d1 : d0;

                that.cv.data_tooltip_text = _rendimento.x.getDate() + '/' + (_rendimento.x.getMonth() + 1) + '/' + _rendimento.x.getFullYear();

                that.cv.performance_tooltip_text = _rendimento.data.value.rendimento.toFixed(2) + '%';

                var bodyRect = document.body.getBoundingClientRect(),
                elemRect = document.getElementById("chart-performance")!.getBoundingClientRect(),
                leftOffset = elemRect.left - bodyRect.left;

                var bodyRectTop = document.getElementById("graphicsOffsetTarget")!.getBoundingClientRect(),
                topOffset = elemRect.top - bodyRectTop.top

                focus.style("display", "block");
                select("#performance-tooltip").style("display", "block");

                circle.style("transform", "translate(" + (0) +"px, " + chart._y(_rendimento.y) + "px)")

                focus.style("transform", "translate(" + (event.pageX - leftOffset - 57) +"px, 0px)")

                if (event.pageX < document.body.clientWidth / 2) {
                  select("#performance-tooltip").style("left", (event.pageX - leftOffset + 30) + "px");

                } else {
                  select("#performance-tooltip").style("left", (event.pageX - leftOffset - 133) + "px");
                }

                select("#performance-tooltip").style("top", (topOffset + chart._y(_rendimento.y) + 50) +"px")

            }

          })
          .on("mouseout", () => {
            that.cv.performanceTooltipVisible = false;
            focus.style("display", "none");
            select("#performance-tooltip").style("display", "none");
          });

        focus.on('click', () => {});
      })
      .yAxis().tickFormat((v: any) => `${v}%`).ticks(6);


    this.cv.performanceChart.xAxis().tickFormat((v: any) => {
      let giorno = v.getDate()
      if (giorno < 10) giorno = '0' + giorno
      let mese = v.getMonth() + 1
      if (mese < 10) mese = '0' + mese
      let anno = v.getFullYear().toString().substring(2, 4)
      return giorno + '/' + mese + '/' + anno;
    })
  }

  setValueGroup(group: crossfilter.Group<any, crossfilter.NaturallyOrderedValue, unknown>, minDate: Date, maxDate: Date){
    this.cv.rendimentiMediPerf = this.cv.rendimentiMedi;
    this.cv.rendimentiMediPerfBench = this.cv.rendimentiMediBenchmark;
    return {
      all: () => {
        let E: number = 0; //Epsilon = represents the risk-free rate of return
        let maxDelta: number | null = null;
        let MT: number | null = null;
        let objIndici: any = {};
        let movingThrough = false;

        let result = group.all().filter((el: any, i: number) => {
          let currentDay = this.datePipe.transform(el.key, "yyyy-MM-dd")!;
          let prevDate = this.datePipe.transform(new Date(new Date(currentDay).setDate(new Date(currentDay).getDate() - 1)), "yyyy-MM-dd")!
          let r_m_g_prev = this.cv.rendimentiMediPerf[prevDate] ? this.cv.rendimentiMediPerf[prevDate].r_m_tot : 0;
          let r_m_g_prev_bench = this.cv.rendimentiMediPerfBench[prevDate] ? this.cv.rendimentiMediPerfBench[prevDate].r_m_tot : 0;

          //############### Rendimenti giornalieri ###################//
          this.cv.rendimentiMediPerf[currentDay].r_m_tot =
            (
              this.cv.rendimentiMediPerf[currentDay].r_g_medio * (r_m_g_prev + 1)
            ) + r_m_g_prev;

          this.cv.rendimentiMediPerf[currentDay].r_m_tot = parseFloat(this.cv.rendimentiMediPerf[currentDay].r_m_tot.toFixed(10))

          if (this.firstTime) {
            this.cv.rendimentiMediPerfBench[currentDay].r_m_tot =
              (
                this.cv.rendimentiMediPerfBench[currentDay].r_g_medio * (r_m_g_prev_bench + 1)
              ) + r_m_g_prev_bench;

            this.cv.rendimentiMediPerfBench[currentDay].r_m_tot = parseFloat(this.cv.rendimentiMediPerfBench[currentDay].r_m_tot.toFixed(10))
          }
          //##########################################################//


          //############### Max DD e Info ratio ###################//
          if (el.key.setHours(0,0,0,0) >= minDate.setHours(0,0,0,0) && el.key.setHours(0,0,0,0) <= maxDate.setHours(0,0,0,0)){
            var [y,m,d] = currentDay.split("-");
            if (([m,d].join("-") === "01-01" || movingThrough) && this.cv.rendimentiMediPerf[y+"-12-31"]) {
              movingThrough = true;
              //info ratio
              if(!objIndici[y]) objIndici[y] = {
                differenza_rendimenti: [],
                sum_differenze: 0,
                r: [],
                sum_r: 0,
                b: [],
                sum_b: 0,
                prod_r: 0,
                prod_b: 0
              }

              objIndici[y]["differenza_rendimenti"].push(this.cv.rendimentiMediPerf[currentDay].r_m_tot - this.cv.rendimentiMediPerfBench[currentDay].r_m_tot)
              // objInfoRatio[y].sum_differenze += Math.pow(this.cv.rendimentiMediPerf[currentDay].r_m_tot - this.cv.rendimentiMediPerfBench[currentDay].r_m_tot, 2);//TODO: controllare
              objIndici[y]["sum_differenze"] += this.cv.rendimentiMediPerf[currentDay].r_m_tot - this.cv.rendimentiMediPerfBench[currentDay].r_m_tot;

              //alpha & beta
              objIndici[y].r.push(this.cv.rendimentiMediPerf[currentDay].r_m_tot);
              objIndici[y].b.push(this.cv.rendimentiMediPerfBench[currentDay].r_m_tot);
              objIndici[y].sum_r += this.cv.rendimentiMediPerf[currentDay].r_m_tot;
              objIndici[y].sum_b += this.cv.rendimentiMediPerfBench[currentDay].r_m_tot;

              objIndici[y].prod_r *= (1 + this.cv.rendimentiMediPerf[currentDay].r_m_tot);
              objIndici[y].prod_b *= (1 + this.cv.rendimentiMediPerfBench[currentDay].r_m_tot);


              if (currentDay === y+"-12-31") {
                movingThrough = false;
              }
            }

            //max dd
            if (MT == null || MT < this.cv.rendimentiMediPerf[currentDay].r_m_tot) {
              MT = this.cv.rendimentiMediPerf[currentDay].r_m_tot;
            }

            let delta = MT! - this.cv.rendimentiMediPerf[currentDay].r_m_tot;

            if (maxDelta == null || maxDelta < delta) {
              maxDelta = delta;
            }
          }
          //#######################################################//

          el.value.rendimento = (this.cv.rendimentiMediPerf[currentDay].r_m_tot);

          return el;
        });

        this.firstTime = false;

        //############### Info Ratio ###################//
        this.cv.info_ratio = [];
        for (const key in objIndici) {
          if (Object.prototype.hasOwnProperty.call(objIndici, key)) {
            const objY = objIndici[key];

            let N = objY.differenza_rendimenti.length; //corrisponde a 365 giorni (al momento vengono inclusi sabati e domeniche)
            let mu = objY.sum_differenze/N;

            let mr = objY.sum_r/N;
            let mb = objY.sum_b/N;

            let sum_cov = 0;
            let varianza = 0;
            let rStock = [];

            objY.r.forEach((r: number, i: number) => {
              var b = objY.b[i];
              sum_cov += ((r-mr)*(b-mb))
              varianza += Math.pow((r-mr),2);
            });

            varianza /= N;
            let covarianza = sum_cov/N;
            let Beta = covarianza/varianza; //TODO: da controllare perchè la formula esposta dal cliente si riferisce ad una beta stock (non a valora signolo)
            let alpha = objY.r[objY.r.length-1]-objY.b[objY.b.length-1]

            objY.b.forEach((b: number) => {
              rStock.push(alpha + (Beta * b) + E);
            })

            let jensen_A = (objY.prod_r-1) - (Beta * (objY.prod_b-1))

            let sum_deviazioni_SD = 0; //risultato sommatoria (x-mu)^2 utilizzata per deviazione standard per Info ratio

            objY.differenza_rendimenti.forEach((x: number) => {
              // sum_deviazioni_SD += (x-mu)
              sum_deviazioni_SD += Math.pow(x-mu, 2)
            })

            let stDev = (sum_deviazioni_SD/N);

            let lastDate = this.datePipe.transform(maxDate, "yyyy-MM-dd")!;

            let numeratore = this.cv.rendimentiMediPerf[lastDate].r_m_tot - this.cv.rendimentiMediPerfBench[lastDate].r_m_tot;

            this.cv.info_ratio.push({infoRatio: numeratore/stDev, beta: Beta, jAlpha: jensen_A, year: key});

          }
        }

        this.cv.info_ratio_datasource = new MatTableDataSource(this.cv.info_ratio);

        this.cv.setDatasourceSubject.next();
        //###############################################//


        //############### Max DD ###################//
        this.cv.maxDD = maxDelta!;

        this.cv.MDD_datasource = new MatTableDataSource([{maxDD: this.cv.maxDD}]);
        //##########################################//


        return result;
      }
    }
  }


}
