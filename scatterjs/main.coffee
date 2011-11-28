data = []
rawdata = [[],[]]
graphs = [{x:"IL1B",y:"IFNG"},{x:"IL1B",y:"IL1B+IFNG"},{x:"IFNG",y:"IL1B+IFNG"}]
percChart = null;
cols = ["IL1B", "IFNG", "IL1B+IFNG"]
state = $.query.keys
zscore = parseFloat state.zscore
#console.debug "zscore", zscore

$ -> #on load set form values to values in the query 
  for k,v of state
    $("input[name='#{k}']").val(v)
    
  for name in ["primary", "secondary"]
    sel = $("<select name='#{name}'/>")
    $("#dataselectcontainer").append sel
    for file in ["none", "betacelle161111", "INS1rep161111", "INS2rep161111"]
      selected = if state[name] == file then "selected" else "" 
      $("<option value='#{file}' #{selected}>#{file}</option>").appendTo sel
    
filterdata = ->
  $("#stats").empty()
  for i in [0,1]
    fd = rawdata[i]
    for col in cols 
      [min,max] = [state["min"+col], state["max"+col]]
      fd = (row for row in fd when row[col] > min && row[col] < max)
          
    # filter zscore
    zd = []
    notzd = fd
    console.debug fd.length
    for col in cols 
      {mean,stdvar} = calcMeanAndStdVar(rawdata[i], col)
      [zlow, zhigh] = [mean - stdvar * zscore, mean + stdvar * zscore]
      nextnotzd = []
      console.debug zd.length, notzd.length
      for row in notzd
        if row[col] < zlow || row[col] > zhigh
          zd.push row
        else
          nextnotzd.push row
      notzd = nextnotzd
    data[i] = zd

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
       g.chart.series[i].setData(gdata.slice(0, maxPoints))
    
updateFilter = ->
  filterdata()
  createPercChart()
  updatePercentiles()
  updateMainGraphs()
  createZScore()

$('#csv').click (ev) ->
  ev.preventDefault()
  win = window.open('','name')
  win.document.write("<pre>Protein Group Accessions,115/114,116/114,117/114,Intensity,Sequence\n")
  for row in data[0]
    tokens = row.id.split(',')
    accession = tokens[0].split(";")[0]
    win.document.write "#{accession},#{row.id.substring(row.id.indexOf(",") + 1)}\n"
  win.document.write "</pre>"

$.when($.get("/#{state.primary}.csv"), $.get("/#{state.secondary}.csv")).done (r1, r2) ->
  console.debug "got data"
  for data,i in [r1[2].responseText, r2[2].responseText]
    for line,j in data.split('\r') when j > 0
      items = line.split(',')
      rawdata[i].push
        id: line
        "IL1B": Math.log items[1]
        "IFNG": Math.log items[2]
        "IL1B+IFNG": Math.log items[3]
        intensity: parseFloat items[4]
    console.debug "data0", rawdata[0][0]

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
              text: "#{g.x}/control"
        yAxis: 
           title: 
             text: "#{g.y}/control"
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

calcMeanAndStdVar = (d, key) ->
  sum = 0
  for val in d
    sum += val[key]
  mean = sum / d.length
  sqsum = 0
  for val in d 
    sqsum += (mean - val[key]) * (mean - val[key])
  {mean: mean, stdvar: Math.sqrt (sqsum / d.length)}

createZScore = ->
  mean = []
  std = []
  negstd = []
  
  step = 100000
  quantized = []
  for val in rawdata[0]
    bucket = quantized[parseInt(val.intensity / step)]
    if bucket then bucket.push val else quantized[parseInt(val.intensity / step)] = [val]
  
  for bucket,i in quantized
    if bucket
      sum = 0
      sqsum = 0
      for val in bucket
        sum += val["IL1B"]
      m = sum / bucket.length
      for val in bucket
        sqsum += (m - val["IL1B"]) * (m - val["IL1B"])
      
      mean.push 
        x: i * step
        y: m 
      std.push 
        x: i * step
        y: m + Math.sqrt (sqsum / bucket.length)
      negstd.push
        x: i * step
        y: m - Math.sqrt (sqsum / bucket.length)
    
  percChart = new Highcharts.Chart
    chart: 
       renderTo: ($('<div class="chart"/>').appendTo('body'))[0]
       zoomType: 'none'
       defaultSeriesType: 'scatter'
    title: 
       text: 'Mean and standard deviation as a function of intensity'
    yAxis:
      title:
        text: "IL1B"
    xAxis:
      min: 0
      max: 5000000
      title:
        text: "intensity"
    credits: { enabled: false }
    series: [{color: 'rgba(255,255,255,0.3)', data: ({y:val["IL1B"],x:val.intensity} for val in rawdata[0]), name: "samples"},
             {color: 'rgb(0,0,255)', type: "line", data: mean, name: "mean"}
             {color: 'rgb(255,0,0)', type: "line", data: std, name: "mean+stddev"}
             {color: 'rgb(255,0,0)', type: "line", data: negstd, name: "mean-stddev"}
            ]
    plotOptions: 
     scatter: 
        marker: 
           radius: 2

  
createPercChart = ->
  percChart?.destroy() 
  percChart = new Highcharts.Chart
    chart: 
       renderTo: ($('<div class="chart"/>').appendTo('body'))[0]
       zoomType: 'none'
    title: 
       text: 'percentiles'
    xAxis: 
       categories: ['IL1B/control', 'IFNG/control', 'IL1B+IFNG/control']
    credits: { enabled: false }
  