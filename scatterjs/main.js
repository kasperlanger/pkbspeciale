(function() {
  var cols, createPercChart, data, elem, filterdata, g, graphs, i, options, percChart, rawdata, updateFilter, updateMainGraphs, updatePercentiles, _len;
  data = null;
  rawdata = null;
  graphs = [
    {
      x: "115",
      y: "116"
    }, {
      x: "115",
      y: "117"
    }, {
      x: "116",
      y: "117"
    }
  ];
  percChart = null;
  cols = ["115", "116", "117"];
  $(function() {
    var k, v, _ref, _results;
    _ref = $.query.keys;
    _results = [];
    for (k in _ref) {
      v = _ref[k];
      _results.push($("input[name='" + k + "']").val(v));
    }
    return _results;
  });
  filterdata = function() {
    var col, max, min, row, _i, _len;
    data = rawdata;
    for (_i = 0, _len = cols.length; _i < _len; _i++) {
      col = cols[_i];
      min = parseFloat($("input[name='min" + col + "']").val());
      max = parseFloat($("input[name='max" + col + "']").val());
      data = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          row = data[_i];
          if (row[col] > min && row[col] < max) {
            _results.push(row);
          }
        }
        return _results;
      })();
    }
    return $("#stats").text("" + data.length + " (" + (new Number(100 * data.length / rawdata.length).toFixed(2)) + "%)");
  };
  updatePercentiles = function() {
    var col, colVals, perc, percData, sortedVals, _i, _j, _len, _len2, _ref, _results;
    sortedVals = {};
    for (_i = 0, _len = cols.length; _i < _len; _i++) {
      col = cols[_i];
      sortedVals[col] = data.map(function(row) {
        return row[col];
      });
      sortedVals[col].sort(function(x, y) {
        return x - y;
      });
    }
    _ref = [0, 0.02, 0.25, 0.50, 0.75, 0.98, 1];
    _results = [];
    for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
      perc = _ref[_j];
      percData = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = cols.length; _i < _len; _i++) {
          col = cols[_i];
          colVals = sortedVals[col];
          _results.push(colVals[parseInt((colVals.length - 1) * perc)]);
        }
        return _results;
      })();
      _results.push(percChart.addSeries({
        name: "" + (perc * 100) + "%",
        data: percData
      }));
    }
    return _results;
  };
  updateMainGraphs = function() {
    var g, gdata, maxPoints, row, _i, _len, _results;
    maxPoints = parseFloat($("input[name='npoints']").val());
    _results = [];
    for (_i = 0, _len = graphs.length; _i < _len; _i++) {
      g = graphs[_i];
      gdata = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          row = data[_i];
          _results.push({
            x: row[g.x],
            y: row[g.y],
            name: row.id
          });
        }
        return _results;
      })();
      _results.push(g.chart.series[0].setData(gdata.slice(0, maxPoints)));
    }
    return _results;
  };
  updateFilter = function() {
    filterdata();
    createPercChart();
    updatePercentiles();
    return updateMainGraphs();
  };
  $('#csv').click(function(ev) {
    var accession, row, tokens, win, _i, _len;
    ev.preventDefault();
    win = window.open('', 'name');
    win.document.write("<pre>Protein Group Accessions,115/114,116/114,117/114,Intensity,\n");
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      row = data[_i];
      tokens = row.id.split(',');
      accession = tokens[0].split(";")[0];
      win.document.write("" + accession + "," + (row.id.substring(row.id.indexOf(",") + 1)) + "\n");
    }
    return win.document.write("</pre>");
  });
  $.get('/betaceller301011.csv', function(data) {
    var i, items, line;
    rawdata = (function() {
      var _len, _ref, _results;
      _ref = data.split('\r');
      _results = [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        line = _ref[i];
        if (i > 0) {
          items = line.split(',');
          _results.push({
            "id": line,
            "115": Math.log(parseFloat(items[1])),
            "116": Math.log(parseFloat(items[2])),
            "117": Math.log(parseFloat(items[3]))
          });
        }
      }
      return _results;
    })();
    rawdata.sort(function() {
      return Math.random() - 0.5;
    });
    return updateFilter();
  });
  $(window).bind("popstate", function(ev) {
    var i, _ref;
    return i = ((_ref = ev.originalEvent.state) != null ? _ref.i : void 0) || 0;
  });
  for (i = 0, _len = graphs.length; i < _len; i++) {
    g = graphs[i];
    elem = $('<div class="chart"/>').appendTo('body');
    options = {
      chart: {
        renderTo: elem[0],
        defaultSeriesType: 'scatter',
        zoomType: 'xy',
        events: {
          selection: function(event) {
            $("input[name='min" + g.x + "']").val(event.xAxis[0].min);
            $("input[name='max" + g.x + "']").val(event.xAxis[0].max);
            $("input[name='min" + g.y + "']").val(event.yAxis[0].min);
            $("input[name='max" + g.y + "']").val(event.yAxis[0].max);
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
          text: "" + g.x + "/114"
        }
      },
      yAxis: {
        title: {
          text: "" + g.y + "/114"
        }
      },
      tooltip: {
        formatter: function() {
          return this.point.name;
        }
      },
      credits: {
        enabled: false
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        scatter: {
          marker: {
            radius: 2
          }
        }
      },
      series: [
        {
          data: [],
          color: 'rgba(255,255,255,0.3)'
        }
      ]
    };
    g.chart = new Highcharts.Chart(options);
    g.chart.yAxis[0].addPlotBand({
      from: 0,
      to: 100,
      color: 'rgba(255,0,0,0.3)'
    });
    g.chart.xAxis[0].addPlotBand({
      from: 0,
      to: 100,
      color: 'rgba(0,0,255,0.3)'
    });
  }
  createPercChart = function() {
    if (percChart != null) {
      percChart.destroy();
    }
    return percChart = new Highcharts.Chart({
      chart: {
        renderTo: ($('<div class="chart"/>').appendTo('body'))[0],
        zoomType: 'none'
      },
      title: {
        text: 'percentiles'
      },
      xAxis: {
        categories: ['115/114', '116/114', '117/114']
      },
      credits: {
        enabled: false
      }
    });
  };
}).call(this);
