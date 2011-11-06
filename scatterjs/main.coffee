data = null 
rawdata = null
graphs = [{x:"115",y:"116"},{x:"115",y:"117"},{x:"116",y:"117"}]
percChart = null;
cols = ["115", "116", "117"]

#on load set form values to values in the query
$ -> 
  for k,v of $.query.keys 
    $("input[name='#{k}']").val(v)
    
filterdata = ->
  data = rawdata
  for col in cols 
    min = parseFloat($("input[name='min"+col+"']").val())
    max = parseFloat($("input[name='max"+col+"']").val())
    data = (row for row in data when row[col] > min && row[col] < max)    
  $("#stats").text "#{data.length} (#{new Number(100 * data.length / rawdata.length).toFixed(2)}%)"
  
updatePercentiles = ->
  sortedVals = {}
  for col in cols
    sortedVals[col] = data.map (row) -> row[col]
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
  for g in graphs
    gdata = ({x:row[g.x], y:row[g.y], name: row.id} for row in data)
    g.chart.series[0].setData(gdata.slice(0, maxPoints));
    
updateFilter = ->
  filterdata()
  createPercChart()
  updatePercentiles()
  updateMainGraphs()

$('#csv').click (ev) ->
  ev.preventDefault()
  win = window.open('','name')
  win.document.write("<pre>Protein Group Accessions,115/114,116/114,117/114,Intensity,\n")
  for row in data
    tokens = row.id.split(',')
    accession = tokens[0].split(";")[0]
    win.document.write "#{accession},#{row.id.substring(row.id.indexOf(",") + 1)}\n"
  win.document.write "</pre>"

$.get '/betaceller301011.csv', (data) ->
  rawdata = for line,i in data.split('\r') when i > 0
    items = line.split(',');
    {"id": line, "115":Math.log(parseFloat(items[1])), "116": Math.log(parseFloat(items[2])), "117": Math.log(parseFloat(items[3]))}
  rawdata.sort( () ->  Math.random() - 0.5 ) #shuffle hack
  updateFilter()

$(window).bind "popstate", (ev) -> 
  i = ev.originalEvent.state?.i || 0
  # if (ev.originalEvent.state)
  #   for kv in ev.originalEvent.state
  #     $("input[name='{kv.name}']").val(kv.value)

for g,i in graphs
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
             updateFilter()
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
      series: [{data: [], color: 'rgba(255,255,255,0.3)'}]

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
  