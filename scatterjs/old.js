var data, 
    rawdata = [],
    graphs = [{x:"115",y:"116"},{x:"115",y:"117"},{x:"116",y:"117"}],
    percChart = null;


function updateFilter(){  
  data = rawdata;
  ["115", "116", "117"].forEach(function(col){ //filter on each column
    var min = parseFloat($("input[name='min"+col+"']").val());
    var max = parseFloat($("input[name='max"+col+"']").val());
    var res = [];
    data.forEach(function(row){
      if (row[col] > min && row[col] < max) res.push(row)
    });
    data = res;
  });
  
  $("#stats").text(data.length + " (" + new Number(100 * data.length / rawdata.length).toFixed(2) + "%)");

  createPercChart();
  //calc percentiles
  var sortedVals = {};
  ["115", "116", "117"].forEach(function(col){
    var vals = [];
    data.forEach(function(row){
      vals.push(row[col]);
    });
    vals.sort(function(a,b){return a - b});
    sortedVals[col] = vals; 
  });
  
  [0, 0.02, 0.25, 0.50, 0.75, 0.98, 1].forEach(function(perc){
    var percData = [];
    ["115", "116", "117"].forEach(function(col){
      var colVals = sortedVals[col];
      var index = parseInt((colVals.length - 1) * perc);
      percData.push(colVals[index]);
    });
    
    percChart.addSeries({
      name: perc*100 + "%",
      data: percData
    });
  });

  var maxPoints = parseFloat($("input[name='npoints']").val());
  
  // add main graphs:
  graphs.forEach(function(g){
    var gdata = [];
    data.forEach(function(row){
      gdata.push({x:row[g.x], y:row[g.y], name: row.id});      
    });
    g.chart.series[0].setData(gdata.slice(0, maxPoints));
  });
}

$('form').submit(function(ev){ev.preventDefault(); updateFilter()});
$('form input[type="reset"]').click(function(){
  setTimeout(updateFilter, 1);
});
$('#csv').click(function(ev){
  ev.preventDefault();
  var win = window.open('','name');
  win.document.write("<pre>Protein Group Accessions,115/114,116/114,117/114\n");
  data.forEach(function(row){
    var tokens = row.id.split(',');
    var accession = tokens[0].split(";")[0];
    win.document.write(accession + "," + row.id.substring(row.id.indexOf(",") + 1) + "\n");
  });
  win.document.write("</pre>");
});

$.get('/betaceller211011.csv', function(data) {
    var lines = data.split('\r');
    $.each(lines, function(lineNo, line) {
        var items = line.split(',');
        if (lineNo != 0) {
          rawdata.push({"id": line, "115":Math.log(parseFloat(items[1])), "116": Math.log(parseFloat(items[2])), "117": Math.log(parseFloat(items[3]))})
        }
    });
    rawdata.sort(function () { return Math.random() - 0.5; }); //shuffle hack
    updateFilter();
});


graphs.forEach(function(g,i){
  var elemId = "g"+i;
  var elem = $('<div/>').css({'width': '49%', 'height':'450px', 'float': 'left', 'margin': '2px'}).attr('id', elemId).appendTo('body');
  var options = {
      chart: {
         renderTo: elemId, 
         defaultSeriesType: 'scatter',
         zoomType: 'xy',
         events: {
           selection: function(event) {
             $("input[name='min"+g.x+"']").val(event.xAxis[0].min);
             $("input[name='max"+g.x+"']").val(event.xAxis[0].max);
             $("input[name='min"+g.y+"']").val(event.yAxis[0].min);
             $("input[name='max"+g.y+"']").val(event.yAxis[0].max);
             updateFilter();
             return false;
           }
         }
      },
      title: {
         text: g.x + ' - ' + g.y
      },
      xAxis: {
         title: {
            enabled: true,
            text: g.x + "/114"
         },
      },
      yAxis: {
         title: {
           enabled: true,
           text: g.y + "/114"
         },
      },
      tooltip: {
         formatter: function() {
             return this.point.name; 
         }
      },
      credits: { enabled: false },
      legend: { enabled: false},
      plotOptions: {
         scatter: {
            marker: {
               radius: 2,
               states: {
                  hover: {
                     enabled: true,
                     lineColor: 'rgba(100,100,100,0.5)'
                  }
               }
            }
         }
      },
      series: [{data: [], color: 'rgba(255,255,255,0.3)'}]
   };

   g.chart = new Highcharts.Chart(options);
   g.chart.yAxis[0].addPlotBand({from: 0, to: 100, color: 'rgba(255,0,0,0.3)'});
   g.chart.xAxis[0].addPlotBand({from: 0, to: 100, color: 'rgba(0,0,255,0.3)'});
});

function createPercChart(){
  var elemId = "gperc";
  var elem = $('<div/>').css({'width': '49%', 'height':'450px', 'float': 'left', 'margin': '2px'}).attr('id', elemId).appendTo('body');
  var options = {
      chart: {
         renderTo: elemId, 
         zoomType: 'none',
      },
      title: {
         text: 'percentiles'
      },
      xAxis: {
         categories: ['115/114', '116/114', '117/114']
      },
      credits: { enabled: false },
      series: []
   };

   if (percChart){
       percChart.destroy();
   } 
   percChart = new Highcharts.Chart(options);  
}

