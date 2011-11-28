(function() {
  var calcMeanAndStdVar, cols, createPercChart, createZScore, data, filterdata, g, graphs, i, percChart, rawdata, state, updateFilter, updateMainGraphs, updatePercentiles, zscore, _fn, _len;
  data = [];
  rawdata = [[], []];
  graphs = [
    {
      x: "IL1B",
      y: "IFNG"
    }, {
      x: "IL1B",
      y: "IL1B+IFNG"
    }, {
      x: "IFNG",
      y: "IL1B+IFNG"
    }
  ];
  percChart = null;
  cols = ["IL1B", "IFNG", "IL1B+IFNG"];
  state = $.query.keys;
  zscore = parseFloat(state.zscore);
  $(function() {
    var file, k, name, sel, selected, v, _i, _len, _ref, _results;
    for (k in state) {
      v = state[k];
      $("input[name='" + k + "']").val(v);
    }
    _ref = ["primary", "secondary"];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      sel = $("<select name='" + name + "'/>");
      $("#dataselectcontainer").append(sel);
      _results.push((function() {
        var _i, _len, _ref, _results;
        _ref = ["none", "betacelle161111", "INS1rep161111", "INS2rep161111"];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          selected = state[name] === file ? "selected" : "";
          _results.push($("<option value='" + file + "' " + selected + ">" + file + "</option>").appendTo(sel));
        }
        return _results;
      })());
    }
    return _results;
  });
  filterdata = function() {
    var col, fd, i, max, mean, min, nextnotzd, notzd, row, stdvar, zd, zhigh, zlow, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4, _results;
    $("#stats").empty();
    _ref = [0, 1];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      fd = rawdata[i];
      for (_j = 0, _len2 = cols.length; _j < _len2; _j++) {
        col = cols[_j];
        _ref2 = [state["min" + col], state["max" + col]], min = _ref2[0], max = _ref2[1];
        fd = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = fd.length; _i < _len; _i++) {
            row = fd[_i];
            if (row[col] > min && row[col] < max) {
              _results.push(row);
            }
          }
          return _results;
        })();
      }
      zd = [];
      notzd = fd;
      console.debug(fd.length);
      for (_k = 0, _len3 = cols.length; _k < _len3; _k++) {
        col = cols[_k];
        _ref3 = calcMeanAndStdVar(rawdata[i], col), mean = _ref3.mean, stdvar = _ref3.stdvar;
        _ref4 = [mean - stdvar * zscore, mean + stdvar * zscore], zlow = _ref4[0], zhigh = _ref4[1];
        nextnotzd = [];
        console.debug(zd.length, notzd.length);
        for (_l = 0, _len4 = notzd.length; _l < _len4; _l++) {
          row = notzd[_l];
          if (row[col] < zlow || row[col] > zhigh) {
            zd.push(row);
          } else {
            nextnotzd.push(row);
          }
        }
        notzd = nextnotzd;
      }
      data[i] = zd;
      _results.push($("<div>" + data[i].length + " / " + rawdata[i].length + " (" + (new Number(100 * data[i].length / rawdata[i].length).toFixed(2)) + "%)</div>").appendTo($("#stats")));
    }
    return _results;
  };
  updatePercentiles = function() {
    var col, colVals, perc, percData, sortedVals, _i, _j, _len, _len2, _ref, _results;
    sortedVals = {};
    for (_i = 0, _len = cols.length; _i < _len; _i++) {
      col = cols[_i];
      sortedVals[col] = data[0].map(function(row) {
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
    var g, gdata, i, maxPoints, row, _i, _len, _ref, _results;
    maxPoints = parseFloat($("input[name='npoints']").val());
    _ref = [0, 1];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      i = _ref[_i];
      _results.push((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = graphs.length; _i < _len; _i++) {
          g = graphs[_i];
          gdata = (function() {
            var _i, _len, _ref, _results;
            _ref = data[i];
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              row = _ref[_i];
              _results.push({
                x: row[g.x],
                y: row[g.y],
                name: row.id
              });
            }
            return _results;
          })();
          _results.push(g.chart.series[i].setData(gdata.slice(0, maxPoints)));
        }
        return _results;
      })());
    }
    return _results;
  };
  updateFilter = function() {
    filterdata();
    createPercChart();
    updatePercentiles();
    updateMainGraphs();
    return createZScore();
  };
  $('#csv').click(function(ev) {
    var accession, row, tokens, win, _i, _len, _ref;
    ev.preventDefault();
    win = window.open('', 'name');
    win.document.write("<pre>Protein Group Accessions,115/114,116/114,117/114,Intensity,Sequence\n");
    _ref = data[0];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      row = _ref[_i];
      tokens = row.id.split(',');
      accession = tokens[0].split(";")[0];
      win.document.write("" + accession + "," + (row.id.substring(row.id.indexOf(",") + 1)) + "\n");
    }
    return win.document.write("</pre>");
  });
  $.when($.get("/" + state.primary + ".csv"), $.get("/" + state.secondary + ".csv")).done(function(r1, r2) {
    var data, i, items, j, line, _len, _len2, _ref, _ref2;
    console.debug("got data");
    _ref = [r1[2].responseText, r2[2].responseText];
    for (i = 0, _len = _ref.length; i < _len; i++) {
      data = _ref[i];
      _ref2 = data.split('\r');
      for (j = 0, _len2 = _ref2.length; j < _len2; j++) {
        line = _ref2[j];
        if (j > 0) {
          items = line.split(',');
          rawdata[i].push({
            id: line,
            "IL1B": Math.log(items[1]),
            "IFNG": Math.log(items[2]),
            "IL1B+IFNG": Math.log(items[3]),
            intensity: parseFloat(items[4])
          });
        }
      }
      console.debug("data0", rawdata[0][0]);
      rawdata[i].sort(function() {
        return Math.random() - 0.5;
      });
    }
    return updateFilter();
  });
  _fn = function(g, i) {
    var elem, options;
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
            $("form").submit();
            return false;
          }
        }
      },
      title: {
        text: g.x + ' - ' + g.y
      },
      xAxis: {
        title: {
          text: "" + g.x + "/control"
        }
      },
      yAxis: {
        title: {
          text: "" + g.y + "/control"
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
        }, {
          data: [],
          color: 'rgba(255,255,0,0.3)'
        }
      ]
    };
    g.chart = new Highcharts.Chart(options);
    g.chart.yAxis[0].addPlotBand({
      from: 0,
      to: 100,
      color: 'rgba(255,0,0,0.3)'
    });
    return g.chart.xAxis[0].addPlotBand({
      from: 0,
      to: 100,
      color: 'rgba(0,0,255,0.3)'
    });
  };
  for (i = 0, _len = graphs.length; i < _len; i++) {
    g = graphs[i];
    _fn(g, i);
  }
  calcMeanAndStdVar = function(d, key) {
    var mean, sqsum, sum, val, _i, _j, _len, _len2;
    sum = 0;
    for (_i = 0, _len = d.length; _i < _len; _i++) {
      val = d[_i];
      sum += val[key];
    }
    mean = sum / d.length;
    sqsum = 0;
    for (_j = 0, _len2 = d.length; _j < _len2; _j++) {
      val = d[_j];
      sqsum += (mean - val[key]) * (mean - val[key]);
    }
    return {
      mean: mean,
      stdvar: Math.sqrt(sqsum / d.length)
    };
  };
  createZScore = function() {
    var bucket, i, m, mean, negstd, quantized, sqsum, std, step, sum, val, _i, _j, _k, _len, _len2, _len3, _len4, _ref;
    mean = [];
    std = [];
    negstd = [];
    step = 100000;
    quantized = [];
    _ref = rawdata[0];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      val = _ref[_i];
      bucket = quantized[parseInt(val.intensity / step)];
      if (bucket) {
        bucket.push(val);
      } else {
        quantized[parseInt(val.intensity / step)] = [val];
      }
    }
    for (i = 0, _len2 = quantized.length; i < _len2; i++) {
      bucket = quantized[i];
      if (bucket) {
        sum = 0;
        sqsum = 0;
        for (_j = 0, _len3 = bucket.length; _j < _len3; _j++) {
          val = bucket[_j];
          sum += val["IL1B"];
        }
        m = sum / bucket.length;
        for (_k = 0, _len4 = bucket.length; _k < _len4; _k++) {
          val = bucket[_k];
          sqsum += (m - val["IL1B"]) * (m - val["IL1B"]);
        }
        mean.push({
          x: i * step,
          y: m
        });
        std.push({
          x: i * step,
          y: m + Math.sqrt(sqsum / bucket.length)
        });
        negstd.push({
          x: i * step,
          y: m - Math.sqrt(sqsum / bucket.length)
        });
      }
    }
    return percChart = new Highcharts.Chart({
      chart: {
        renderTo: ($('<div class="chart"/>').appendTo('body'))[0],
        zoomType: 'none',
        defaultSeriesType: 'scatter'
      },
      title: {
        text: 'Mean and standard deviation as a function of intensity'
      },
      yAxis: {
        title: {
          text: "IL1B"
        }
      },
      xAxis: {
        min: 0,
        max: 5000000,
        title: {
          text: "intensity"
        }
      },
      credits: {
        enabled: false
      },
      series: [
        {
          color: 'rgba(255,255,255,0.3)',
          data: (function() {
            var _i, _len, _ref, _results;
            _ref = rawdata[0];
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              val = _ref[_i];
              _results.push({
                y: val["IL1B"],
                x: val.intensity
              });
            }
            return _results;
          })(),
          name: "samples"
        }, {
          color: 'rgb(0,0,255)',
          type: "line",
          data: mean,
          name: "mean"
        }, {
          color: 'rgb(255,0,0)',
          type: "line",
          data: std,
          name: "mean+stddev"
        }, {
          color: 'rgb(255,0,0)',
          type: "line",
          data: negstd,
          name: "mean-stddev"
        }
      ],
      plotOptions: {
        scatter: {
          marker: {
            radius: 2
          }
        }
      }
    });
  };
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
        categories: ['IL1B/control', 'IFNG/control', 'IL1B+IFNG/control']
      },
      credits: {
        enabled: false
      }
    });
  };
}).call(this);
