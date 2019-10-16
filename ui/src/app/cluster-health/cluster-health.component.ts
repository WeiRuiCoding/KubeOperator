import { Component, OnInit } from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {ClusterHealthService} from './cluster-health.service';
import {Cluster} from '../cluster/cluster';
import {ActivatedRoute} from '@angular/router';
import {ClusterHealth, Data, HealthData} from './cluster-health';
import {ClusterHealthHistory} from './cluster-health-history';

@Component({
  selector: 'app-cluster-health',
  templateUrl: './cluster-health.component.html',
  styleUrls: ['./cluster-health.component.css'],
  providers: [DatePipe, DecimalPipe]
})
export class ClusterHealthComponent implements OnInit {

  constructor(private route: ActivatedRoute, private decimalPipe: DecimalPipe,
              private datePipe: DatePipe, private clusterHealthService: ClusterHealthService) { }
  options: {};
  time: any;
  seriesArray = [];
  calendarArray = [];
  currentCluster: Cluster;
  projectName = '';
  projectId = '';
  clusterHealth: ClusterHealth = new ClusterHealth();
  clusterHealthHistories: ClusterHealthHistory[] = [];
  loading = true;

  ngOnInit() {
    this.clusterHealth.data = [];
    this.route.parent.data.subscribe(data => {
      this.currentCluster = data['cluster'];
      this.projectName = this.currentCluster.name;
      this.projectId = this.currentCluster.id;
      this.getClusterHealth();
      this.getClusterHealthHistory();
    });
  }

  getClusterHealth() {
    this.clusterHealthService.listClusterHealth(this.projectName).subscribe( res => {
        this.clusterHealth = res;
        this.loading = false;
      });
  }

  getClusterHealthHistory() {
    this.clusterHealthService.listClusterHealthHistory(this.projectId).subscribe(res => {
        this.clusterHealthHistories = res;
        const healthDataArray: HealthData[] = [];
        const nameArray = [];
        for (const clusterHealthHistory of this.clusterHealthHistories) {
          const month = clusterHealthHistory.month;
          const index = nameArray.indexOf(clusterHealthHistory.month);
          if (index > -1) {
              const healthData = healthDataArray[index];
              const data = new Data();
              data.key = clusterHealthHistory.date_created;
              data.value = clusterHealthHistory.available_rate;
              healthData.data.push(data);
          } else {
              const healthData = new HealthData();
              healthData.job = month;
              healthData.data = [];
              const data = new Data();
              data.key = clusterHealthHistory.date_created;
              data.value = clusterHealthHistory.available_rate;
              healthData.data.push(data);
              healthDataArray.push(healthData);
              nameArray.push(month);
          }
        }
        for (let i = 0 ; i < healthDataArray.length; i++) {
          const healthData = healthDataArray[i];
          this.setCalendar(i, healthData.job);
          this.setSeries(i, healthData.data);
        }
        this.setOptions(this.seriesArray, this.calendarArray);
    });
  }

  setOptions(seriesArray, calendarArray) {
    this.options = {
      tooltip: {
          position: 'top'
      },
      visualMap: [{
        min: 0,
        max: 100,
        splitNumber: 3,
        color: ['#9DE7BD', '#FF4040', '#FF4040' ],
        textStyle: {
            color: '#fff'
        },
        show: false
      }],
      calendar: calendarArray,
      series: seriesArray
    };
    console.log(this.options);
  }

  setSeries(index, data) {
     const series = {
      type: 'scatter',
      coordinateSystem: 'calendar',
      calendarIndex: index,
      symbol: 'roundRect',
      symbolSize: 35,
      data: this.getVirtualData(data)
     };
     this.seriesArray.push(series);
  }

  setCalendar(index, month) {

    let left = index;
    let top = '';
    if (index > 2) {
      left = index % 2 - 1;
      top = this.decimalPipe.transform(index / 3, '1.0-0');
    }
    const calendar = {
      orient: 'vertical',
      yearLabel: {
        margin: 40,
        show: false
      },
      monthLabel: {
        margin: 10,
        nameMap: 'cn',
      },
      dayLabel: {
        firstDay: 0,
        nameMap: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        show: false
      },
      cellSize: 40,
      left: 40 + 350 * left,
      top: parseInt(top, 0) * 220,
      range: month,
      splitLine: {
        show: false
      },
      itemStyle: {
        borderColor: '#FFFFFF'
      }
    };
    this.calendarArray.push(calendar);
  }

  getVirtualData(data) {
    const dataArray = [];
    for (const d of data) {
      dataArray.push([
         this.datePipe.transform(d.key, 'yyyy-MM-dd'),
         d.value
      ]);
    }
    return dataArray;
  }

  getClusterServiceStatus(data, job) {
    let  serviceStyle = '#9de7bd';

    for (const d of data) {
      if (d.job === job) {
        if ( d.rate !== 100) {
          serviceStyle = '#FF4040';
        }
      }
    }
    return serviceStyle;
  }
}