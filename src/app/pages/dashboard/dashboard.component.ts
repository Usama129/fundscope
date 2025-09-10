import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Dashboards } from "../../lib/highcharts-dashboards";
import GtaData from "../../data/GTA.json";
import GtlData from "../../data/GTL.json";
import GzpData from "../../data/GZP.json";
import GbvData from "../../data/GBV.json";
import GjhData from "../../data/GJH.json";
import { FundPricePoint } from '../../types/FundPricePoint';
import { getDailyReturns, stdev } from '../../helper';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

enum FundCode {
  GTA = "GTA",
  GTL = "GTL",
  GZP = "GZP",
  GBV = "GBV",
  GJH = "GJH"
}

const FundName = {
  [FundCode.GTA]: "GARANTİ PORTFÖY ALTIN FONU",
  [FundCode.GTL]: "Garanti Portföy Birinci Para Piyasası (TL) Fonu",
  [FundCode.GZP]: "GARANTİ PORTFÖY BİRİNCİ FON SEPETİ FONU",
  [FundCode.GBV]: "Blockchain Teknolojileri Değişken Fon",
  [FundCode.GJH]: "GARANTİ PORTFÖY PARA PİYASASI SERBEST (TL) FONU"
}

const FundDataMap = {
  [FundCode.GTA]: GtaData,
  [FundCode.GTL]: GtlData,
  [FundCode.GZP]: GzpData,
  [FundCode.GBV]: GbvData,
  [FundCode.GJH]: GjhData
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatSelectModule, MatFormFieldModule, FormsModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLElement>;

  private options: any = {};
  private board?: any;

  selectedFund: FundCode = FundCode.GTA;
  private currentFundData: FundPricePoint[] = [];

  constructor(public elementRef: ElementRef) { }

  ngOnInit(): void {
    this.setFundData();
  }

  ngAfterViewInit(): void {
    this.setOptions();
    this.board = Dashboards.board(this.host.nativeElement, this.options);
  }

  getFunds(): FundCode[] {
    return Object.values(FundCode);
  }

  switchFund(symbol: FundCode) {
    this.selectedFund = symbol;
    this.setFundData();

    if (this.board && typeof this.board.destroy === 'function') {
      this.board.destroy();
    }
    this.host.nativeElement.innerHTML = '';

    this.setOptions();
    this.board = Dashboards.board(this.host.nativeElement, this.options);
  }

  private setFundData(): void {
    let rows: FundPricePoint[] = FundDataMap[this.selectedFund];
    this.currentFundData = rows
      .filter(r => r && r.date)
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  }

  private setOptions(): void {
    this.options = {
      gui: {
        layouts: [{
          id: 'layout-1',
          rows: [
            { cells: [{ id: 'kpi-cell-0' }, { id: 'kpi-cell-1' }, { id: 'kpi-cell-2' }] },
            { cells: [{ id: 'cell-0' }] }
          ]
        }]
      },

      dataPool: {
        connectors: [
          {
            id: 'prices',
            type: 'JSON',
            options: {
              data: this.currentFundData,
              beforeParse: (raw: FundPricePoint[]) => [
                ['x', 'y'],
                ...raw.map(r => [Date.parse(r.date), r.closePrice])
              ]
            }
          },
          {
            id: 'ytd',
            type: 'JSON',
            options: {
              data: [['ytd'], [this.getYtdReturn(this.currentFundData)]]
            }
          },
          {
            id: 'volatility',
            type: 'JSON',
            options: {
              data: [['volatility'], [this.getStandardDev(this.currentFundData) * 100]]
            }
          }
        ]
      },

      components: [
        {
          renderTo: 'cell-0',
          type: 'Highcharts',
          chartConstructor: 'stockChart',
          connector: {
            id: 'prices',
            columnAssignment: [{
              seriesId: 'fund-series',
              data: ['x', 'y']
            }]
          },
          chartOptions: {
            chart: { type: 'line' },
            title: { text: `Fund NAV Change (TRY) · ${this.selectedFund} - ${FundName[this.selectedFund].toUpperCase()}` },
            rangeSelector: {
              selected: 3,
              buttons: [
                { type: 'month', count: 1, text: '1M' },
                { type: 'month', count: 3, text: '3M' },
                { type: 'ytd', text: 'YTD' },
                { type: 'year', count: 1, text: '1Y' },
                { type: 'all', text: 'MAX' }
              ]
            },
            xAxis: { type: 'datetime' },
            yAxis: { title: { text: 'NAV (TRY)' }, tickAmount: 6 },
            tooltip: { xDateFormat: '%Y-%m-%d', pointFormat: '<b>{point.y:.6f} TRY</b>' },
            legend: { enabled: false },
            series: [{
              id: 'fund-series',
              name: this.selectedFund,
              type: 'line'
            }]
          }
        },
        {
          type: 'KPI',
          renderTo: 'kpi-cell-0',
          connector: { id: 'prices' },
          columnName: 'y',
          title: {
            text: 'Latest NAV',
            style: { fontSize: '24px', paddingBottom: '8px'}
          },
          valueFormatter: (value: number) => `${Number(value).toFixed(3)} TRY`,
          minFontSize: 26,
          subtitle: {
            text: 'As of yesterday',
            style: { color: '#6B7280', fontSize: '12px', fontWeight: '500', paddingTop: "10px" }
          },
          style: {
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(17, 24, 39, .08)',
            padding: '10px 10px 12px'
          }
        },
        {
          type: 'KPI',
          renderTo: 'kpi-cell-1',
          title: {
            text: 'YTD Return',
            style: { fontSize: '24px', paddingBottom: '8px' }
          },
          connector: { id: 'ytd' },
          columnName: 'ytd',
          valueFormatter: (value: number) => `${Number(value).toFixed(2)}%`,
          minFontSize: 26,
          subtitle: {
            text: 'Year To Date',
            style: { color: '#6B7280', fontSize: '12px', fontWeight: '500', paddingTop: "10px" }
          },
          style: {
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(17, 24, 39, .08)',
            padding: '10px 10px 12px'
          }
        },
        {
          type: 'KPI',
          renderTo: 'kpi-cell-2',
           title: {
            text: 'Volatility',
            style: { fontSize: '24px', paddingBottom: '8px' }
          },
          connector: { id: 'volatility' },
          columnName: 'volatility',
          valueFormatter: (value: number) => `${Number(value).toFixed(2)}%`,
          minFontSize: 26,
          subtitle: {
            text: 'Annualized Standard Deviation (daily)',
            style: { color: '#6B7280', fontSize: '12px', fontWeight: '500', paddingTop: "12px" }
          },
          style: {
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(17, 24, 39, .08)',
            padding: '10px 10px 12px'
          }
        }
      ]
    };
  }

  private filterLastYear(data: FundPricePoint[]): FundPricePoint[] {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return data.filter(p => {
      const t = Date.parse(p.date);
      return !isNaN(t) && t >= oneYearAgo.getTime();
    });
  }

  getLatestNav(): number {
    const last = this.currentFundData[this.currentFundData.length - 1];
    return last?.closePrice ?? NaN;
  }

  getYtdReturn(fundData: FundPricePoint[]): number {
    if (!fundData.length) return NaN;
    const latest = fundData.reduce((a, b) => (b.date > a.date ? b : a));
    const thisYear = new Date().getUTCFullYear();
    const janPoints = fundData.filter(p => {
      const d = new Date(p.date);
      return d.getUTCFullYear() === thisYear && d.getUTCMonth() === 0;
    });
    if (!janPoints.length) return NaN;
    const januaryStart = janPoints.reduce((a, b) => (b.date < a.date ? b : a));
    return ((latest.closePrice - januaryStart.closePrice) / januaryStart.closePrice) * 100;
  }

  getStandardDev(fundData: FundPricePoint[]): number {
    const lastYearData = this.filterLastYear(fundData);
    const dailyReturns = getDailyReturns(lastYearData);
    return stdev(dailyReturns, true);
  }

  ngOnDestroy(): void {
    this.board?.destroy?.();
  }
}