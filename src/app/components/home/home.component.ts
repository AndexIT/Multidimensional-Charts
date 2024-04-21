import { MatTableDataSource } from '@angular/material/table';
import { LegendChartService } from './../../services/legend-chart.service';
import { CommonVariablesService } from './../../services/common-variables.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { SidenavService } from 'src/app/services/sidenav.service';
import { CrossfilterService } from 'src/app/services/crossfilter.service';
import { Papa } from 'ngx-papaparse';
import { renderAll, redrawAll } from 'dc';
import { HttpClient } from '@angular/common/http';
import * as dc from "dc"
import * as d3 from "d3"
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss', './dc.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  ready: boolean = false;
  delayedReady: boolean = false;
  subscription!: Subscription;
  eventsSubject: Subject<void> = new Subject<void>();

  datasourceSubs!: Subscription;

  //Paginator
  public paginator!: MatPaginator;
  @ViewChild('paginator') set matPaginatorPassati(mp: MatPaginator) {
    this.paginator = mp;
  }

  //Sort
  public sort!: MatSort;
  @ViewChild('sort') set matSort(ms: MatSort) {
    this.sort = ms;
  }

  constructor(
    private sidenavServ: SidenavService,
    public crossfilter: CrossfilterService,
    public cv: CommonVariablesService,
    private legendChart: LegendChartService,
    private csvParser: Papa,
    private http: HttpClient
  ) {
    this.subscription = this.sidenavServ.receiveMessage().subscribe(() => {
      setTimeout(() => {
        renderAll()
      }, 1);
    })
  }

  ngOnInit(): void {
    dc.config.defaultColors([...d3.schemeSet3])

    this.datasourceSubs = this.cv.setDatasourceSubject.asObservable().subscribe(() => {
      this.cv.info_ratio_datasource.sort = this.sort;
      this.cv.info_ratio_datasource.paginator = this.paginator;
    })

    // this.parseCsv();

    this.http.get("./assets/formatted_csv_data.json").subscribe((result: any) => {
      result.sort((a: any,b: any) => new Date(a.pricingdate).setHours(0,0,0,0) - new Date(b.pricingdate).setHours(0,0,0,0));

      this.cv.jsonData = result


      let repeated = ""
      let array: any[] = []

      this.cv.jsonData.forEach((el: any, i: number) => {
        if (el.pricingdate !== repeated) {
          repeated = el.pricingdate
          array.push({
            "rebalancing_date": el.rebalancing_date,
            "companyid": el.companyid,
            "pricingdate": el.pricingdate,
            "weight": "0.25",
            "daily_return_eur": el.daily_return_eur,
            "market_capitalization_usd": el.market_capitalization_usd,
            "sector": el.sector,
            "country": el.country,
            "currency": el.currency,
            "PRICECLOSEADJEUR": el.PRICECLOSEADJEUR,
            "COMPANYNAME": el.COMPANYNAME,
            "isBenchmark": true
          })
          array.push({
            "rebalancing_date": this.cv.jsonData[i+1].rebalancing_date,
            "companyid": this.cv.jsonData[i+1].companyid,
            "pricingdate": this.cv.jsonData[i+1].pricingdate,
            "weight": "0.25",
            "daily_return_eur": this.cv.jsonData[i+1].daily_return_eur,
            "market_capitalization_usd": this.cv.jsonData[i+1].market_capitalization_usd,
            "sector": this.cv.jsonData[i+1].sector,
            "country": this.cv.jsonData[i+1].country,
            "currency": this.cv.jsonData[i+1].currency,
            "PRICECLOSEADJEUR": this.cv.jsonData[i+1].PRICECLOSEADJEUR,
            "COMPANYNAME": this.cv.jsonData[i+1].COMPANYNAME,
            "isBenchmark": true
          })
          array.push({
            "rebalancing_date": this.cv.jsonData[i+2].rebalancing_date,
            "companyid": this.cv.jsonData[i+2].companyid,
            "pricingdate": this.cv.jsonData[i+2].pricingdate,
            "weight": "0.25",
            "daily_return_eur": this.cv.jsonData[i+2].daily_return_eur,
            "market_capitalization_usd": this.cv.jsonData[i+2].market_capitalization_usd,
            "sector": this.cv.jsonData[i+2].sector,
            "country": this.cv.jsonData[i+2].country,
            "currency": this.cv.jsonData[i+2].currency,
            "PRICECLOSEADJEUR": this.cv.jsonData[i+2].PRICECLOSEADJEUR,
            "COMPANYNAME": this.cv.jsonData[i+2].COMPANYNAME,
            "isBenchmark": true
          })
          array.push({
            "rebalancing_date": this.cv.jsonData[i+3].rebalancing_date,
            "companyid": this.cv.jsonData[i+3].companyid,
            "pricingdate": this.cv.jsonData[i+3].pricingdate,
            "weight": "0.25",
            "daily_return_eur": this.cv.jsonData[i+3].daily_return_eur,
            "market_capitalization_usd": this.cv.jsonData[i+3].market_capitalization_usd,
            "sector": this.cv.jsonData[i+3].sector,
            "country": this.cv.jsonData[i+3].country,
            "currency": this.cv.jsonData[i+3].currency,
            "PRICECLOSEADJEUR": this.cv.jsonData[i+3].PRICECLOSEADJEUR,
            "COMPANYNAME": this.cv.jsonData[i+3].COMPANYNAME,
            "isBenchmark": true
          })

        }

      })

      this.cv.arrayBenchmark = array;

      this.crossfilter.fillData();
      this.crossfilter.filterDuplicateRecords();
      this.crossfilter.setCrossfilter();

      this.ready = true

      setTimeout(() => {
        this.crossfilter.drawCharts();
      }, 1);
      setTimeout(() => {
        this.delayedReady = true;
      }, 800);
    })

  }

  ngOnDestroy(): void {
    if(this.subscription) this.subscription.unsubscribe();
    if(this.datasourceSubs) this.datasourceSubs.unsubscribe();
    this.crossfilter.subscritionRange.unsubscribe();
  }

  redraw(){
    this.cv.checked = !this.cv.checked;
    this.cv.performanceChart.redraw();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.legendChart.applyFilter(filterValue)
  }

  getH(){
    return document.body.clientHeight/2
  }

  getW(){
    return document.body.clientWidth/2
  }

  parseCsv(){
    let options1 = {
      download: true,
      // worker: true,
      // header: true,
      complete: (parsedData: any, file: any) => {
        var headerRow = parsedData.data.splice(0, 1)[0];
        parsedData.data.splice(parsedData.data.length-1, 1)
        var csvData = parsedData.data;

        csvData.forEach((element: any) => {
          this.cv.jsonData.push({})
          element.forEach((column: any, i: number) => {
            this.cv.jsonData[this.cv.jsonData.length - 1][headerRow[i]] = column
          });
        });

        this.csvParser.parse("../../../assets/Price_table.csv", options2);
      }
    };

    let options2 = {
      download: true,
      // worker: true,
      // header: true,
      complete: (parsedData: any, file: any) => {
        var headerRow = parsedData.data.splice(0, 1)[0];
        parsedData.data.splice(parsedData.data.length-1, 1)
        let csvData = parsedData.data;
        var result: any = []

        csvData.forEach((element: any) => {
          result.push({})
          element.forEach((column: any, i: number) => {
            result[result.length - 1][headerRow[i]] = column
          });
        });

        let map = result.map((e: any) => (e.PRICEDATE) +"_"+e.COMPANYID)

        this.processLargeArray(this.cv.jsonData, map, result)
      }
    }
    this.csvParser.parse("../../../assets/dataset_S2E.csv", options1);
  }

  findObj(el: any, resultCsv: any[]){
    resultCsv = resultCsv.filter((v: any) => v.COMPANYID === el.companyid)
    var dateToFind: any = new Date(el.pricingdate);

    var [ closest ] = resultCsv.sort((a: any,b: any) => {

      const [aDate, bDate] = [a,b].map((d: any) => Math.abs((new Date(d.PRICEDATE) as any) - dateToFind));

      return aDate - bDate;

    });

    if (!closest || closest == undefined || [closest].length > 1) {
      if (el.companyid !== "881635") { //TODO: compagnia assente
        console.log("ERORORE Nuovo" , el);
        closest = {
          "COMPANYNAME": el.companyid,
          "MARKETCAPUSD": "",
          "PRICECLOSEADJEUR": ""
        }
      } else {
        closest = {
          "COMPANYNAME": "881635",
          "MARKETCAPUSD": "",
          "PRICECLOSEADJEUR": ""
        }
      }
    }
    return closest
  }

  processLargeArray(array: any, map: any, resultCsv: any) {
    // set this to whatever number of items you can process at once
    var chunk = array.length;
    var index = 0;
    let that = this
    function doChunk() {
        var cnt = chunk;
        while (cnt-- && index < array.length) {
          var el = array[index]
          var i = map.indexOf(el.pricingdate + "_" + el.companyid)
          if (i < 0) {
            var obj = that.findObj(el, resultCsv)
            el["PRICECLOSEADJEUR"] = obj.PRICECLOSEADJEUR
            el["market_capitalization_usd"] = obj.MARKETCAPUSD
            el["COMPANYNAME"] = obj.COMPANYNAME
          } else {
            el["PRICECLOSEADJEUR"] = resultCsv[i].PRICECLOSEADJEUR
            el["market_capitalization_usd"] = resultCsv[i].MARKETCAPUSD
            el["COMPANYNAME"] = resultCsv[i].COMPANYNAME
          }
            ++index;
        }
        if (index < array.length) {
            // set Timeout for async iteration
            setTimeout(doChunk, 1);
        } else {
          console.log(array);
          localStorage.setItem("ARRAY_ELABORATO", array)
          alert("Completato")
        }
    }
    doChunk();
  }
}
