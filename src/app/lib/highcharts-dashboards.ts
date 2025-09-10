import Dashboards from '@highcharts/dashboards/es-modules/masters/dashboards.src.js';
import Highcharts from 'highcharts/highstock';
import * as DataGrid from '@highcharts/dashboards/datagrid';
import '@highcharts/dashboards/es-modules/masters/modules/layout.src.js';
import '@highcharts/dashboards/modules/layout';

Dashboards.HighchartsPlugin.custom.connectHighcharts(Highcharts);
Dashboards.GridPlugin.custom.connectGrid(DataGrid);
Dashboards.PluginHandler.addPlugin(Dashboards.HighchartsPlugin);
Dashboards.PluginHandler.addPlugin(Dashboards.GridPlugin);

export { Dashboards };
