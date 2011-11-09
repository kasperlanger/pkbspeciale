data = []
rawdata = [[],[]]
graphs = [{x:"115",y:"116"},{x:"115",y:"117"},{x:"116",y:"117"}]
percChart = null;
cols = ["115", "116", "117"]
state = $.query.keys

$ -> #on load set form values to values in the query 
  for k,v of state
    $("input[name='#{k}']").val(v)
    
  for name in ["primary", "secondary"]
    sel = $("<select name='#{name}'/>")
    $("#dataselectcontainer").append sel
    for file in ["none", "betaceller301011", "biorep1ins-1", "biorep2ins-1"]
      selected = if state[name] == file then "selected" else "" 
      $("<option value='#{file}' #{selected}>#{file}</option>").appendTo sel
    
filterdata = ->
  $("#stats").empty()
  for i in [0,1]
    data[i] = rawdata[i]
    for col in cols 
      [min,max] = [state["min"+col], state["max"+col]]
      data[i] = (row for row in data[i] when row[col] > min && row[col] < max)
    $("<div>#{data[i].length} / #{rawdata[i].length} (#{new Number(100 * data[i].length / rawdata[i].length).toFixed(2)}%)</div>").appendTo $("#stats")
  
updatePercentiles = ->
  sortedVals = {}
  for col in cols
    sortedVals[col] = data[0].map (row) -> row[col]
    sortedVals[col].sort( (x,y) -> x - y)
  for perc in [0, 0.02, 0.25, 0.50, 0.75, 0.98, 1]
    percData = for col in cols
      colVals = sortedVals[col]
      colVals[parseInt((colVals.length - 1) * perc)]      
    percChart.addSeries
      name: "#{perc*100}%"
      data: percData

updateMainGraphs = ->
  maxPoints = parseFloat($("input[name='npoints']").val())
  for i in [0,1]
    for g in graphs
      gdata = ({x:row[g.x], y:row[g.y], name: row.id} for row in data[i])
      g.chart.series[i].setData(gdata.slice(0, maxPoints));
    
updateFilter = ->
  filterdata()
  createPercChart()
  updatePercentiles()
  updateMainGraphs()

$('#csv').click (ev) ->
  ev.preventDefault()
  win = window.open('','name')
  win.document.write("<pre>Protein Group Accessions,115/114,116/114,117/114,Intensity,\n")
  for row in data[0]
    tokens = row.id.split(',')
    accession = tokens[0].split(";")[0]
    win.document.write "#{accession},#{row.id.substring(row.id.indexOf(",") + 1)}\n"
  win.document.write "</pre>"

$.when($.get("/#{state.primary}.csv"), $.get("/#{state.secondary}.csv")).done (r1, r2) ->
  for data,i in [r1[2].responseText, r2[2].responseText]
    rawdata[i] = (for line,j in data.split('\r') when j > 0
      items = line.split(',');
      {"id": line, "115":Math.log(parseFloat(items[1])), "116": Math.log(parseFloat(items[2])), "117": Math.log(parseFloat(items[3]))})
    rawdata[i].sort( () ->  Math.random() - 0.5 ) #shuffle hack
  updateFilter()

for g,i in graphs
  do (g,i) ->
    elem = $('<div class="chart"/>').appendTo('body') 
    options =
        chart: 
           renderTo: elem[0]
           defaultSeriesType: 'scatter'
           zoomType: 'xy'
           events: 
             selection: (event) ->
               $("input[name='min#{g.x}']").val(event.xAxis[0].min)
               $("input[name='max#{g.x}']").val(event.xAxis[0].max)
               $("input[name='min#{g.y}']").val(event.yAxis[0].min)
               $("input[name='max#{g.y}']").val(event.yAxis[0].max)
               $("form").submit()
               return false
        title:
           text: g.x + ' - ' + g.y
        xAxis: 
           title: 
              text: "#{g.x}/114"
        yAxis: 
           title: 
             text: "#{g.y}/114"
        tooltip: 
           formatter: () -> @point.name
        credits: { enabled: false },
        legend: { enabled: false},
        plotOptions: 
           scatter: 
              marker: 
                 radius: 2
        series: [{data: [], color: 'rgba(255,255,255,0.3)'}, {data: [], color: 'rgba(255,255,0,0.3)'}]

     g.chart = new Highcharts.Chart(options)
     g.chart.yAxis[0].addPlotBand({from: 0, to: 100, color: 'rgba(255,0,0,0.3)'})
     g.chart.xAxis[0].addPlotBand({from: 0, to: 100, color: 'rgba(0,0,255,0.3)'})

createPercChart = ->
  percChart?.destroy() 
  percChart = new Highcharts.Chart
    chart: 
       renderTo: ($('<div class="chart"/>').appendTo('body'))[0]
       zoomType: 'none'
    title: 
       text: 'percentiles'
    xAxis: 
       categories: ['115/114', '116/114', '117/114']
    credits: { enabled: false }
  