import { select } from 'd3';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { LegendChartService } from './legend-chart.service';
import { PerformanceChartService } from './performance-chart.service';
import { RangeChartService } from './range-chart.service';
import { SectorChartService } from './sector-chart.service';
import { redrawAll, renderAll } from 'dc';
import { CountryChartService } from './country-chart.service';
import { CommonVariablesService } from './common-variables.service';
import { Injectable } from '@angular/core';
import crossfilter from 'crossfilter2';

@Injectable({
  providedIn: 'root'
})
export class CrossfilterService {

  subscritionRange!: Subscription;

  activeFiltersRange: any = [];
  // dump: number = 0; //FIXME: da rimuovere quando calcolo ctv è corretto

  constructor(
    private cv: CommonVariablesService,
    private datePipe: DatePipe,
    private countryServ: CountryChartService,
    private sectorServ: SectorChartService,
    private rangeServ: RangeChartService,
    private performanceServ: PerformanceChartService,
    private legendServ: LegendChartService

  ) { }

  //nel csv fornito ci sono celle lasciate bianche, questa funzione le riempie con l'ultimo valore presente nelle celle precendenti
  fillData(){
    let data = [...this.cv.jsonData];
    let lastWeightValue = "";
    let lastCapValue = "";
    let result: any;
    data.forEach((element: any) => {
      if (element.weight) lastWeightValue = element.weight
      // else if(element.daily_return_eur === "0.0") element.weight = "0"
      else element.weight = lastWeightValue
      if (element.market_capitalization_usd) lastCapValue = element.market_capitalization_usd
      else element.market_capitalization_usd = lastCapValue
    });
    result = JSON.stringify(data, null, 4)
    this.cv.jsonData = JSON.parse(result)
  }

  //nel dataset fornito per le date di ribilanciamento sono forniti record sia per i titoli azionari precedenti che per quelli ribilanciati; questa funzione rimuove i titoli precedenti per il giorno di ribilanciamento, lasciando come fondi presenti nel portafoglio solamente quelli nuovi
  filterDuplicateRecords(){
    let data = [...this.cv.jsonData];
    let dateDiRibilanciamento: any = [];
    let result: any;
    data.forEach((element: any) => {
        if (dateDiRibilanciamento.indexOf(element.rebalancing_date) === -1){
            dateDiRibilanciamento.push(element.rebalancing_date)
        }
    })
    dateDiRibilanciamento = dateDiRibilanciamento.sort()
    for (let i = data.length - 1; i >= 0; i--){
        let element = data[i];
        let rebalancingDateIndex = dateDiRibilanciamento.indexOf(element.rebalancing_date)
        if (rebalancingDateIndex < data.length - 1) {       //esclusione per evitare indexOutOfBounds
            let nextRebalancingDate = dateDiRibilanciamento[rebalancingDateIndex + 1]
            if (element.pricingdate === nextRebalancingDate){
                data = data.filter((e: any, index: any)=> index !== i)
            }
        }
    }
    result = JSON.stringify(data, null, 4)
    this.cv.jsonData = JSON.parse(result)

    this.filterRecordsValueZero()
  }

  filterRecordsValueZero(){
    for (let i = this.cv.jsonData.length - 1; i >= 0; i--) {
      const el = this.cv.jsonData[i];
      if (el.PRICECLOSEADJEUR === 0) {
        this.cv.jsonData.splice(i, 1)
      }
    }
  }

  appendSubscriptions(){
    this.subscritionRange = this.rangeServ.activateFn.asObservable().subscribe(() => {
      this.activeFiltersRange = this.cv.rangeChart.filters().length > 0 ? this.cv.rangeChart.filters()[0] : [];
      if (this.cv.rangeChart.filters().length > 0) {
        // this.calculatePrezzoIniziale(this.cv.rangeChart.filters()[0][0])
        this.cv.performanceGroup = this.cv.dataDimension.group().reduce(this.reduceAdd(), this.reduceRemove(), this.reduceInit);
        select("#chart-performance").select("svg").remove()
        this.performanceServ.drawPerformanceChart(this.cv.rangeChart.filters()[0][0], this.cv.rangeChart.filters()[0][1])
        this.cv.performanceChart.render()
      } else {
        // this.cv.prezzoIniziale = this.dump
        select("#chart-performance").select("svg").remove()
        this.cv.performanceGroup = this.cv.dataDimension.group().reduce(this.reduceAdd(), this.reduceRemove(), this.reduceInit);
        this.performanceServ.drawPerformanceChart(this.cv.minScaleTime, this.cv.maxScaleTime)
        this.cv.performanceChart.render()
      }
    })
  }

  setCrossfilter(){
    this.appendSubscriptions();
    this.cv.ndx = crossfilter(this.cv.jsonData);
    this.setDimension();
    this.setGroups();
  }

  setDimension(){
    this.cv.dataDimension = this.cv.ndx.dimension((d: any) => new Date(d.pricingdate))
    //this.cv.performanceDimension = this.cv.ndx.dimension((d: any) => d.PRICECLOSEADJEUR)
    this.cv.countryDimension = this.cv.ndx.dimension((d: any) => d.country)
    this.cv.sectorDimension = this.cv.ndx.dimension((d: any) => d.sector)
    this.cv.legendDimension = this.cv.ndx.dimension((d: any) => d.COMPANYNAME)

    this.cv.minScaleTime = new Date(this.cv.dataDimension.bottom(1)[0].pricingdate);
    this.cv.maxScaleTime = new Date(this.cv.dataDimension.top(1)[0].pricingdate);

    // this.calculatePrezzoIniziale(this.cv.minScaleTime)
    // this.dump = this.cv.prezzoIniziale
  }

  setGroups(){
    this.cv.dataGroup = this.cv.dataDimension.group()
    this.cv.legendGroup = this.cv.legendDimension.group()
    this.cv.performanceGroup = this.cv.dataDimension.group().reduce(this.reduceAdd(), this.reduceRemove(), this.reduceInit)
    this.cv.countryGroup = this.cv.countryDimension.group().reduceSum((d: any) => d.weight)
    this.cv.sectorGroup = this.cv.sectorDimension.group().reduceSum((d: any) => d.weight)
  }

  // calculatePrezzoIniziale(date: Date){
  //   this.cv.prezzoIniziale = 0
  //   let data = [...this.cv.ndx.all()]
  //   let records = data.filter((value: any) => {
  //     let temp = this.datePipe.transform(date, "YYYY-MM-dd")!
  //     return value.pricingdate === temp
  //   })
  //   if (records.length === 0) {
  //     var [ closest ] = data.sort((a: any,b: any) => {
  //       const [aDate, bDate] = [a,b].map((d: any) => Math.abs((new Date(d.pricingdate) as any) - (date as any)));
  //       return aDate - bDate;
  //     });
  //     records = data.filter((value: any) => value.pricingdate === closest.pricingdate)
  //   }

  //   records.forEach((el: any) => {
  //     this.cv.prezzoIniziale += (Number(el.weight) * Number(el.PRICECLOSEADJEUR))
  //   })
  // }

  drawCharts(){
    this.countryServ.drawMSChart()
    this.legendServ.drawLegendChart()
    this.sectorServ.drawSectorChart()
    this.rangeServ.drawRangeChart()
    this.performanceServ.drawPerformanceChart(this.cv.minScaleTime, this.cv.maxScaleTime)

    this.cv.arrayBenchmark.forEach((el: any) => {
      this.calcolaRendimentiMediBenchmarck(el.pricingdate, +el.daily_return_eur, +el.weight, false)
    })

    window.onresize = function () {
      setTimeout(() => {
        renderAll()
      }, 1)
    }

    renderAll()
  }

  resettaGrafici() {
    this.cv.rangeChart.filterAll()
    this.cv.legendChart.filterAll()
    this.cv.countryPieChart.filterAll()
    this.cv.sectorPieChart.filterAll()
    this.cv.performanceChart.filterAll()
    redrawAll()
  }

  settaFocus(range: string) {
    let primaData;
    switch (range) {
      case 'dec': primaData = this.cv.minScaleTime;
        break;
      case '5a': primaData = new Date(this.cv.maxScaleTime.getFullYear() - 5, this.cv.maxScaleTime.getMonth(), this.cv.maxScaleTime.getDate());
        break;
      case '3a': primaData = new Date(this.cv.maxScaleTime.getFullYear() - 3, this.cv.maxScaleTime.getMonth(), this.cv.maxScaleTime.getDate());
        break;
      case '1a': primaData = new Date(this.cv.maxScaleTime.getFullYear() - 1, this.cv.maxScaleTime.getMonth(), this.cv.maxScaleTime.getDate());
        break;
      case 'ytd': primaData = new Date(this.cv.maxScaleTime.getFullYear(), 0, 1);
        break;
      case '3m': primaData = new Date(this.cv.maxScaleTime.getFullYear(), this.cv.maxScaleTime.getMonth() - 3, this.cv.maxScaleTime.getDate());
        break;
      case '1m': primaData = new Date(this.cv.maxScaleTime.getFullYear(), this.cv.maxScaleTime.getMonth() - 1, this.cv.maxScaleTime.getDate());
        break;
    }

    this.cv.rangeChart.filter([primaData, this.cv.maxScaleTime])
  }



  //------------------FUNZIONI DI RIDUZIONE PER CROSSFILTER--------------------------
  // rendimentiTot: any = {}

  // calculateDailyReturn(company: any, startDay: string, currentDay: string){
  //   if (currentDay === "2012-02-13") {
  //     console.log();

  //   }
  //   let prevDate = this.datePipe.transform(new Date(new Date(currentDay).setDate(new Date(currentDay).getDate() - 1)), "yyyy-MM-dd")!
  //   if (!this.rendimentiTot[company.companyid]) this.rendimentiTot[company.companyid] = {}

  //   if (startDay === currentDay || JSON.stringify(this.rendimentiTot[company.companyid]) === JSON.stringify({})) {
  //     this.rendimentiTot[company.companyid][currentDay] = {
  //       rendimento: Number(company.daily_return_eur),
  //       counter: 1,
  //       media_pesata_rendimenti: Number(company.daily_return_eur)
  //     }
  //     return Number(company.daily_return_eur)

  //   } else {
  //     if (!this.rendimentiTot[company.companyid][prevDate]) {
  //       prevDate = Object.keys(this.rendimentiTot[company.companyid])[Object.keys(this.rendimentiTot[company.companyid]).length-1]
  //     }

  //     let prevRendObj: any = this.rendimentiTot[company.companyid][prevDate]
  //     let r = (Number(company.daily_return_eur) * (Number(prevRendObj.rendimento) + 1)) + Number(prevRendObj.rendimento)

  //     if (!this.rendimentiTot[company.companyid][currentDay]) this.rendimentiTot[company.companyid][currentDay] = {}

  //     this.rendimentiTot[company.companyid][currentDay]["rendimento"] = r
  //     this.rendimentiTot[company.companyid][currentDay]["counter"] = prevRendObj.counter+1

  //     let media_rendimenti = (prevRendObj.media_pesata_rendimenti + r)/(prevRendObj.counter+1);

  //     this.rendimentiTot[company.companyid][currentDay]["media_pesata_rendimenti"] = media_rendimenti;
  //     return media_rendimenti;
  //   }
  // }

  calcolaRendimentiMedi(currentDay: string, r: number, price: number, p: number, isRemove: boolean){
    //variabile che serve a far funzionare add e reduce nel modo corretto,
    //nel caso che si stia facendo una remove sarà negativo in modo da sottrarre peso e rendimento al peso totale
    let a = 1;
    if (isRemove){
      a = -1;
    }
    if (!this.cv.rendimentiMedi[currentDay] ){
      this.cv.rendimentiMedi[currentDay] = {
        somma_r: 0,
        somma_prezzi: 0,
        somma_pesi: 0,
        r_g_medio: 0,
        p_g_medio: 0,
        r_m_tot: 0
      }
    }

    this.cv.rendimentiMedi[currentDay].somma_r += (r*p)*a;
    this.cv.rendimentiMedi[currentDay].somma_r = parseFloat(this.cv.rendimentiMedi[currentDay].somma_r.toFixed(10));

    this.cv.rendimentiMedi[currentDay].somma_prezzi += (price*p)*a;
    this.cv.rendimentiMedi[currentDay].somma_prezzi = parseFloat(this.cv.rendimentiMedi[currentDay].somma_prezzi.toFixed(10));

    this.cv.rendimentiMedi[currentDay].somma_pesi += p*a;
    this.cv.rendimentiMedi [currentDay].somma_pesi = parseFloat(this.cv.rendimentiMedi[currentDay].somma_pesi.toFixed(10));

    if (this.cv.rendimentiMedi[currentDay].somma_pesi!=0) {
      this.cv.rendimentiMedi[currentDay].r_g_medio = this.cv.rendimentiMedi[currentDay].somma_r/this.cv.rendimentiMedi[currentDay].somma_pesi;
      this.cv.rendimentiMedi[currentDay].r_g_medio = parseFloat(this.cv.rendimentiMedi[currentDay].r_g_medio.toFixed(10));
      this.cv.rendimentiMedi[currentDay].p_g_medio = this.cv.rendimentiMedi[currentDay].somma_prezzi/this.cv.rendimentiMedi[currentDay].somma_pesi;
      this.cv.rendimentiMedi[currentDay].p_g_medio = parseFloat(this.cv.rendimentiMedi[currentDay].p_g_medio.toFixed(10));
    } else {
      this.cv.rendimentiMedi[currentDay].r_g_medio = 0;
      this.cv.rendimentiMedi[currentDay].p_g_medio = 0;
    };
  }

  calcolaRendimentiMediBenchmarck(currentDay: string, r: number, p: number, isRemove: boolean){
    //variabile che serve a far funzionare add e reduce nel modo corretto,
    //nel caso che si stia facendo una remove sarà negativo in modo da sottrarre peso e rendimento al peso totale
    let a = 1;
    if (isRemove){
      a = -1;
    }
    if (!this.cv.rendimentiMediBenchmark[currentDay] ){
      this.cv.rendimentiMediBenchmark[currentDay] = {
        somma_r: 0,
        somma_pesi: 0,
        r_g_medio: 0,
        r_m_tot: 0,
      }
    }

    this.cv.rendimentiMediBenchmark[currentDay].somma_r += (r*p)*a;
    this.cv.rendimentiMediBenchmark[currentDay].somma_r = parseFloat(this.cv.rendimentiMediBenchmark[currentDay].somma_r.toFixed(10))
    this.cv.rendimentiMediBenchmark[currentDay].somma_pesi += p*a;
    this.cv.rendimentiMediBenchmark [currentDay].somma_pesi = parseFloat(this.cv.rendimentiMediBenchmark[currentDay].somma_pesi.toFixed(10))
    if (this.cv.rendimentiMediBenchmark[currentDay].somma_pesi!=0) {
      this.cv.rendimentiMediBenchmark[currentDay].r_g_medio = this.cv.rendimentiMediBenchmark[currentDay].somma_r/this.cv.rendimentiMediBenchmark[currentDay].somma_pesi;
      this.cv.rendimentiMediBenchmark[currentDay].r_g_medio = parseFloat(this.cv.rendimentiMediBenchmark[currentDay].r_g_medio.toFixed(10))
    } else this.cv.rendimentiMediBenchmark[currentDay].r_g_medio = 0;
  }


  reduceAdd(){
    let that = this;
    return function(p: any, v: any) {
      that.calcolaRendimentiMedi(v.pricingdate, +v.daily_return_eur, +v.PRICECLOSEADJEUR, +v.weight, false);
      p.rendimento = 0;
      return p;
    }
  }

  reduceRemove(){
    let that = this;
    return function(p: any, v: any) {
      that.calcolaRendimentiMedi(v.pricingdate, +v.daily_return_eur, +v.PRICECLOSEADJEUR, +v.weight, true);
      p.rendimento = 0;
      return p;
    }
  }

  reduceInit(){
    return { rendimento: 0 }
  }

}






  // filterPerformance() {
  //   //aggiungere variabile sto filtrando
  //   let legendFilters = this.cv.legendChart.filters(),
  //   sectorFilters = this.cv.sectorPieChart.filters(),
  //   countryFilters = this.cv.countryPieChart.filters(),
  //   start = this.activeFiltersRange.length > 0 ? this.activeFiltersRange[0] : this.cv.minScaleTime,
  //   end = this.activeFiltersRange.length > 0 ? this.activeFiltersRange[1] : this.cv.maxScaleTime;

  //   if (legendFilters.length > 0 || sectorFilters.length > 0 || countryFilters.length > 0) {
  //     let datasource = [
  //       ...this.cv.jsonData.filter((v: any) => {
  //         return (
  //           new Date(v.pricingdate).setHours(0,0,0,0) >= new Date(start).setHours(0,0,0,0) &&
  //           new Date(v.pricingdate).setHours(0,0,0,0) <= new Date(end).setHours(0,0,0,0)
  //         )
  //       })
  //     ];

  //     let resL: any = []
  //     legendFilters.forEach((f: string) => {
  //       resL = resL.concat(datasource.filter((v: any) => v.COMPANYNAME === f))
  //     });

  //     let resS: any = []
  //     sectorFilters.forEach((f: any) => {
  //       resS = resS.concat(datasource.filter((v: any) => v.sector === f))
  //     });

  //     let resC: any = []
  //     countryFilters.forEach((f: any) => {
  //       resC = resC.concat(datasource.filter((v: any) => v.country === f))
  //     });

  //     datasource = resL.concat(resS.concat(resC));

  //     let temp_ndx = crossfilter(datasource),
  //     tempDimensionData = temp_ndx.dimension((d: any) => new Date(d.pricingdate))

  //     this.cv.performanceGroup = tempDimensionData.group().reduce(this.reduceAdd(), this.reduceRemove(), this.reduceInit);
  //     select("#chart-performance").select("svg").remove();
  //     this.performanceServ.drawPerformanceChart(start, end, tempDimensionData);
  //     this.cv.performanceChart.render();
  //   } else   {
  //     select("#chart-performance").select("svg").remove()
  //     this.cv.performanceGroup = this.cv.dataDimension.group().reduce(this.reduceAdd(), this.reduceRemove(), this.reduceInit);
  //     this.performanceServ.drawPerformanceChart(start, end)
  //     this.cv.performanceChart.render()
  //   }


  // }
