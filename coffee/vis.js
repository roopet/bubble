(function() {
  var BubbleChart, root,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  BubbleChart = (function() {

    function BubbleChart(data) {
      this.setTimer = __bind(this.setTimer, this);
      this.hide_details = __bind(this.hide_details, this);
      this.move_off_screen_left = __bind(this.move_off_screen_left, this);
      this.display_by_barHeight = __bind(this.display_by_barHeight, this);
      this.display_by_id = __bind(this.display_by_id, this);
      this.show_details = __bind(this.show_details, this);
      this.hide_state = __bind(this.hide_state, this);
      this.display_states = __bind(this.display_states, this);
      this.move_towards_state = __bind(this.move_towards_state, this);
      this.display_by_state = __bind(this.display_by_state, this);
      this.move_towards_center = __bind(this.move_towards_center, this);
      this.display_state_all = __bind(this.display_state_all, this);
      this.start = __bind(this.start, this);
      this.create_vis = __bind(this.create_vis, this);
      this.create_nodes = __bind(this.create_nodes, this);
      var max_amount;
      this.data = data;
      this.width = 960;
      this.height = 600;
      this.tooltip = CustomTooltip("tooltip", 240);
      this.center = {
        x: this.width / 2,
        y: this.height / 2
      };
      this.state_centers = {
        "Not Ready": {
          x: this.width / 5,
          y: this.height / 2
        },
        "Ready": {
          x: 2 * this.width / 5,
          y: this.height / 2
        },
        "Logged Out": {
          x: 3 * this.width / 5,
          y: this.height / 2
        },
        "Talking": {
          x: 4 * this.width / 5,
          y: this.height / 2
        }
      };
      this.layout_gravity = -0.01;
      this.damper = 0.1;
      this.vis = null;
      this.nodes = [];
      this.force = null;
      this.circles = null;
      this.barChart = null;
      this.pieChart = null;
      this.fill_color = d3.scale.ordinal().domain(["Not Ready", "Logged Out", "Ready", "Talking"]).range(["#d84b2a", "#beccae", "#7aa25c", "#fff380"]);
      max_amount = d3.max(this.data, function(d) {
        return parseInt(d.timeinstate);
      });
      console.log(max_amount);
      this.donut = d3.layout.pie();
      this.arc = d3.svg.arc().innerRadius(250 * .6).outerRadius(250);
      this.radius_scale = d3.scale.pow().exponent(0.5).domain([0, max_amount]).range([2, 70]);
      this.barX_scale = d3.scale.linear().domain([0, 49]).range([25, this.width - 25]);
      this.barY_scale = d3.scale.linear().domain([0, max_amount]).rangeRound([3, this.height]);
      this.create_nodes();
      this.create_vis();
    }

    BubbleChart.prototype.create_nodes = function() {
      var _this = this;
      this.data.forEach(function(d) {
        var node;
        node = {
          id: d.id,
          radius: _this.radius_scale(parseInt(d.timeinstate)),
          barX: _this.barX_scale(d.id) + 1,
          barY: _this.height - 5 - _this.barY_scale(parseInt(d.timeinstate)),
          barH: _this.barY_scale(parseInt(d.timeinstate)),
          barW: _this.width / _this.data.length - 2,
          timeinstate: d.timeinstate,
          name: d.name,
          state: d.states,
          extension: d.extension,
          x: Math.random() * 900,
          y: Math.random() * 800
        };
        return _this.nodes.push(node);
      });
      return this.nodes.sort(function(a, b) {
        return b.timeinstate - a.timeinstate;
      });
    };

    BubbleChart.prototype.create_vis = function() {
      var that,
        _this = this;
      this.vis = d3.select("#vis").append("svg").attr("width", this.width).attr("height", this.height).attr("id", "svg_vis");
      this.circles = this.vis.selectAll("circle").data(this.nodes, function(d) {
        return d.id;
      });
      this.barChart = this.vis.selectAll("rect").data(this.nodes, function(d) {
        return d.timeinstate;
      });
      that = this;
      this.circles.enter().append("circle").attr("r", 0).attr("fill", function(d) {
        return _this.fill_color(d.state);
      }).attr("stroke-width", 2).attr("stroke", function(d) {
        return d3.rgb(_this.fill_color(d.state)).darker();
      }).attr("id", function(d) {
        return "bubble_" + d.id;
      }).on("mouseover", function(d, i) {
        return that.show_details(d, i, this);
      }).on("mouseout", function(d, i) {
        return that.hide_details(d, i, this);
      });
      this.barChart.enter().append("rect").attr("x", 965).attr("y", function(d) {
        return d.barY + 2;
      }).attr("height", function(d) {
        return d.barH;
      }).attr("width", function(d) {
        return d.barW;
      }).attr("fill", function(d) {
        return _this.fill_color(d.state);
      }).attr("stroke-width", 1).attr("stroke", function(d) {
        return d3.rgb(_this.fill_color(d.state)).darker();
      }).attr("id", function(d) {
        return "bar_" + d.id;
      }).on("mouseover", function(d, i) {
        return that.show_details(d, i, this);
      }).on("mouseout", function(d, i) {
        return that.hide_details(d, i, this);
      });
      return this.circles.transition().duration(2000).attr("r", function(d) {
        return d.radius;
      });
    };

    BubbleChart.prototype.charge = function(d) {
      return -Math.pow(d.radius, 2.0) / 8;
    };

    BubbleChart.prototype.start = function() {
      return this.force = d3.layout.force().nodes(this.nodes).size([this.width, this.height]);
    };

    BubbleChart.prototype.display_state_all = function() {
      var _this = this;
      this.force.gravity(this.layout_gravity).charge(this.charge).friction(0.9).on("tick", function(e) {
        return _this.circles.each(_this.move_towards_center(e.alpha)).attr("cx", function(d) {
          return d.x;
        }).attr("cy", function(d) {
          return d.y;
        });
      });
      this.force.start();
      return this.hide_state();
    };

    BubbleChart.prototype.move_towards_center = function(alpha) {
      var _this = this;
      this.barChart.attr("x", function(d) {
        return 965;
      });
      return function(d) {
        d.x = d.x + (_this.center.x - d.x) * (_this.damper + 0.02) * alpha;
        return d.y = d.y + (_this.center.y - d.y) * (_this.damper + 0.02) * alpha;
      };
    };

    BubbleChart.prototype.display_by_state = function() {
      var _this = this;
      this.force.gravity(this.layout_gravity).charge(this.charge).friction(0.9).on("tick", function(e) {
        return _this.circles.each(_this.move_towards_state(e.alpha)).attr("cx", function(d) {
          return d.x;
        }).attr("cy", function(d) {
          return d.y;
        });
      });
      this.force.start();
      return this.display_states();
    };

    BubbleChart.prototype.move_towards_state = function(alpha) {
      var _this = this;
      this.barChart.attr("x", function(d) {
        return 965;
      });
      return function(d) {
        var target;
        target = _this.state_centers[d.state];
        d.x = d.x + (target.x - d.x) * (_this.damper + 0.02) * alpha * 1.1;
        return d.y = d.y + (target.y - d.y) * (_this.damper + 0.02) * alpha * 1.1;
      };
    };

    BubbleChart.prototype.display_states = function() {
      var states, states_data, states_x,
        _this = this;
      states_x = {
        "Not Ready": this.width / 5,
        "Ready": 2 * this.width / 5,
        "Logged Out": 3 * this.width / 5,
        "Talking": 4 * this.width / 5
      };
      states_data = d3.keys(states_x);
      states = this.vis.selectAll(".state").data(states_data);
      return states.enter().append("text").attr("class", "state").attr("x", function(d) {
        return states_x[d];
      }).attr("y", 40).attr("text-anchor", "middle").text(function(d) {
        return d;
      });
    };

    BubbleChart.prototype.hide_state = function() {
      var states;
      return states = this.vis.selectAll(".state").remove();
    };

    BubbleChart.prototype.show_details = function(data, i, element) {
      var content;
      d3.select(element).attr("stroke", "black");
      content = "<span class=\"name\">Agent:</span><span class=\"value\"> " + data.name + "</span><br/>";
      content += "<span class=\"name\">Extension:</span><span class=\"value\"> " + data.extension + "</span><br/>";
      content += "<span class=\"name\">Duration:</span><span class=\"value\"> " + (timeConvert(data.timeinstate)) + "</span><br/>";
      content += "<span class=\"name\">State:</span><span class=\"value\"> " + data.state + "</span>";
      return this.tooltip.showTooltip(content, d3.event);
    };

    BubbleChart.prototype.display_by_id = function() {
      var _this = this;
      this.force.gravity(this.layout_gravity).charge(this.charge).friction(0.9).on("tick", function(e) {
        return _this.circles.each(_this.move_off_screen_left(e.alpha)).attr("cx", function(d) {
          return d.x;
        }).attr("cy", function(d) {
          return d.y;
        });
      });
      this.force.start();
      this.hide_state();
      return this.barChart.transition().duration(2000).attr("x", function(d) {
        return d.barX;
      });
    };

    BubbleChart.prototype.display_by_barHeight = function(data, i) {
      this.data.sort(function(a, b) {
        return b.timeinstate - a.timeinstate;
      });
      return this.barChart.transition().duration(500).attr("transform", function(d, i) {
        return "translate(0," + this.barX_scale(i) + ")";
      });
    };

    BubbleChart.prototype.move_off_screen_left = function(alpha) {
      var _this = this;
      return function(d) {
        return d.x = d.x + (-90 - d.x) * (_this.damper + 0.02) * alpha * 1.1;
      };
    };

    BubbleChart.prototype.hide_details = function(data, i, element) {
      var _this = this;
      d3.select(element).attr("stroke", function(d) {
        return d3.rgb(_this.fill_color(d.state)).darker();
      });
      return this.tooltip.hideTooltip();
    };

    BubbleChart.prototype.setTimer = function() {};

    return BubbleChart;

  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  $(function() {
    var chart, render_vis,
      _this = this;
    chart = null;
    render_vis = function(csv) {
      chart = new BubbleChart(csv);
      chart.start();
      return root.display_all();
    };
    root.display_all = function() {
      return chart.display_state_all();
    };
    root.display_state = function() {
      return chart.display_by_state();
    };
    root.display_id = function() {
      return chart.display_by_id();
    };
    root.display_tis = function() {
      return chart.display_by_barHeight();
    };
    root.toggle_view = function(view_type) {
      if (view_type === 'state') {
        return root.display_state();
      } else if (view_type === 'id') {
        return root.display_id();
      } else {
        return root.display_all();
      }
    };
    return d3.csv("data/agents.csv", render_vis);
  });

}).call(this);
