
class BubbleChart
  constructor: (data) ->
    @data = data
    @width = 960
    @height = 600

    @tooltip = CustomTooltip("tooltip", 240)

    # locations the nodes will move towards
    # depending on which view is currently being
    # used
    @center = {x: @width / 2, y: @height / 2}
    @state_centers = {
      "Not Ready": {x: @width / 5, y: @height / 2},
      "Ready": {x: 2 * @width / 5, y: @height / 2},
      "Logged Out": {x: 3 * @width / 5, y: @height / 2},
      "Talking": {x: 4 * @width / 5, y: @height / 2}
    }

    # used when setting up force and
    # moving around nodes
    @layout_gravity = -0.01
    @damper = 0.1

    # these will be set in create_nodes and create_vis
    @vis = null
    @nodes = []
    @force = null
    @circles = null
    @barChart = null
    @pieChart = null

    # nice looking colors - no reason to buck the trend
    @fill_color = d3.scale.ordinal()
      .domain(["Not Ready", "Logged Out", "Ready", "Talking"])
      .range(["#d84b2a", "#beccae", "#7aa25c", "#fff380"])

    # use the max timeinstate in the data as the max in the scale's domain
    max_amount = d3.max(@data, (d) -> parseInt(d.timeinstate))
    console.log max_amount
    @donut = d3.layout.pie()
    @arc = d3.svg.arc().innerRadius(250 * .6).outerRadius(250)
    @radius_scale = d3.scale.pow().exponent(0.5).domain([0, max_amount]).range([2,70])
    @barX_scale = d3.scale.linear().domain([0, 49]).range([25, @width-25])
    @barY_scale = d3.scale.linear().domain([0, max_amount]).rangeRound([3, @height])
    this.create_nodes()
    this.create_vis()
    #d3.timer(@update_vis)

  # create node objects from original data
  # that will serve as the data behind each
  # bubble in the vis, then add each node
  # to @nodes to be used later
  create_nodes: () =>
    console?.log("Create_Nodes executed")
    @nodes = []
    @data.forEach (d) =>
      node = {
        id: d.id
        radius: @radius_scale(parseInt(d.timeinstate))
        barX: @barX_scale(d.id) + 1
        barY: @height - 5 - @barY_scale(parseInt(d.timeinstate))
        barH: @barY_scale(parseInt(d.timeinstate))
        barW: @width / @data.length - 2
        timeinstate: d.timeinstate
        name: d.name
        state: d.states
        extension: d.extension
        x: Math.random() * 900
        y: Math.random() * 800
      }
      @nodes.push node
    @nodes.sort (a,b) -> b.timeinstate - a.timeinstate
  # create svg at #vis and then 
  # create circle representation for each node
  create_vis: () =>
    console?.log(JSON.stringify(@nodes))
    @vis = d3.select("#vis").append("svg")
      .attr("width", @width)
      .attr("height", @height)
      .attr("id", "svg_vis")
    @circles = @vis.selectAll("circle")
      .data(@nodes, (d) -> d.id)
    @barChart = @vis.selectAll("rect")
      .data(@nodes, (d) -> d.timeinstate)
    # @pieChart = @vis.selectAll("arc")
    #   .data(@nodes)

    # used because we need 'this' in the 
    # mouse callbacks
    that = this

    # radius will be set to 0 initially.
    # see transition below
    @circles.enter().append("circle")
      .attr("r", 0)
      .attr("fill", (d) => @fill_color(d.state))
      .attr("stroke-width", 2)
      .attr("stroke", (d) => d3.rgb(@fill_color(d.state)).darker())
      .attr("id", (d) -> "bubble_#{d.id}")
      .on("mouseover", (d,i) -> that.show_details(d,i,this))
      .on("mouseout", (d,i) -> that.hide_details(d,i,this))
      # .on("mousedown", (d,i) -> that.show_callAction(d,i,this))

    @barChart.enter().
      append("rect").
      attr("x", 965).
      attr("y", (d) -> d.barY + 2).
      attr("height", (d) -> d.barH).
      attr("width", (d) -> d.barW).
      attr("fill", (d) => @fill_color(d.state))
      .attr("stroke-width", 1)
      .attr("stroke", (d) => d3.rgb(@fill_color(d.state)).darker())
      .attr("id", (d) -> "bar_#{d.id}")
      .on("mouseover", (d,i) -> that.show_details(d,i,this))
      .on("mouseout", (d,i) -> that.hide_details(d,i,this))


    # @pieChart.enter().
    #   append("path")
    #   .attr("fill", (d) => @fill_color(d.state))
    #   .attr("d", @arc)
    #   .on("mouseover", (d,i) -> that.show_details(d,i,this))
    #   .on("mouseout", (d,i) -> that.hide_details(d,i,this))
    # @pieChart.

    # Fancy transition to make bubbles appear, ending with the
    # correct radius
    @circles.transition().duration(2000).attr("r", (d) -> d.radius)
        
  
  update_vis: () =>
    console.log "update_vis"
    _circles = @vis.selectAll("circle")
      .data(@nodes)
    _barChart = @vis.selectAll("rect")
      .data(@nodes)

    # used because we need 'this' in the 
    # mouse callbacks
    that = this

    # radius will be set to 0 initially.
    # see transition below
    _circles.select("circle")
      .attr("r", 0)
      # .on("mousedown", (d,i) -> that.show_callAction(d,i,this))

    _barChart.select("rect").
      attr("x", 965).
      attr("y", (d) -> d.barY + 2).
      attr("height", (d) -> d.barH).
      attr("width", (d) -> d.barW)


  # Charge function that is called for each node.
  # Charge is proportional to the diameter of the
  # circle (which is stored in the radius attribute
  # of the circle's associated data.
  # This is done to allow for accurate collision 
  # detection with nodes of different sizes.
  # Charge is negative because we want nodes to 
  # repel.
  # Dividing by 8 scales down the charge to be
  # appropriate for the visualization dimensions.
  charge: (d) ->
    -Math.pow(d.radius, 2.0) / 8

  # Starts up the force layout with
  # the default values
  start: () =>
    @force = d3.layout.force()
      .nodes(@nodes)
      .size([@width, @height])

  # Sets up force layout to display
  # all nodes in one circle.
  display_state_all: () =>
    @force.gravity(@layout_gravity)
      .charge(this.charge)
      .friction(0.9)
      .on "tick", (e) =>
        @circles.each(this.move_towards_center(e.alpha))
          .attr("cx", (d) -> d.x)
          .attr("cy", (d) -> d.y)
    @force.start()

    this.hide_state()

  # Moves all circles towards the @center
  # of the visualization
  move_towards_center: (alpha) =>
    @barChart.attr("x", (d) -> 965)  
    (d) =>
      d.x = d.x + (@center.x - d.x) * (@damper + 0.02) * alpha
      d.y = d.y + (@center.y - d.y) * (@damper + 0.02) * alpha

  # sets the display of bubbles to be separated
  # into each state. Does this by calling move_towards_state
  display_by_state: () =>
    @force.gravity(@layout_gravity)
      .charge(this.charge)
      .friction(0.9)
      .on "tick", (e) =>
        @circles.each(this.move_towards_state(e.alpha))
          .attr("cx", (d) -> d.x)
          .attr("cy", (d) -> d.y)
    @force.start()

    this.display_states()

  # move all circles to their associated @state_centers 
  move_towards_state: (alpha) =>
    @barChart.attr("x", (d) -> 965)
    (d) =>
      target = @state_centers[d.state]
      d.x = d.x + (target.x - d.x) * (@damper + 0.02) * alpha * 1.1
      d.y = d.y + (target.y - d.y) * (@damper + 0.02) * alpha * 1.1

  # Method to display state titles
  display_states: () =>
    states_x = {"Not Ready": @width / 5, "Ready": 2 * @width / 5, "Logged Out": 3 * @width / 5, "Talking": 4 * @width / 5}
    states_data = d3.keys(states_x)
    states = @vis.selectAll(".state")
      .data(states_data)

    states.enter().append("text")
      .attr("class", "state")
      .attr("x", (d) => states_x[d] )
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .text((d) -> d)

  # Method to hide state titiles
  hide_state: () =>
    states = @vis.selectAll(".state").remove()

  show_details: (data, i, element) =>
    d3.select(element).attr("stroke", "black")
    content = "<span class=\"name\">Agent:</span><span class=\"value\"> #{data.name}</span><br/>"
    content +="<span class=\"name\">Extension:</span><span class=\"value\"> #{data.extension}</span><br/>"
    content +="<span class=\"name\">Duration:</span><span class=\"value\"> #{timeConvert(data.timeinstate)}</span><br/>"
    content +="<span class=\"name\">State:</span><span class=\"value\"> #{data.state}</span>" 
    @tooltip.showTooltip(content,d3.event)

  # show_callAction: (data, i, element) =>
  #   d3.select(element).attr("stroke", "blue")
  #   if data.state is 'Talking'
  #     content +="<br><button>Silent Monitor</button>"
  #   if data.state is not 'Ready'
  #     content += "<br><button>Make Ready</button>"
  #   else if data.state is not 'Logged Out'
  #     content += "<br><button>Log Out</button>"
  #   @tooltip.showTooltip(content,d3.event)
    
  # sets the display of bubbles to be separated
  # into each state. Does this by calling move_towards_state
  display_by_id: () =>
    @force.gravity(@layout_gravity)
      .charge(this.charge)
      .friction(0.9)
      .on "tick", (e) =>
        @circles.each(this.move_off_screen_left(e.alpha))
          .attr("cx", (d) -> d.x)
          .attr("cy", (d) -> d.y)
    @force.start()

    this.hide_state()
    @barChart.transition().duration(2000).attr("x", (d) -> d.barX)
    # this.display_by_barHeight()
    
  display_by_barHeight: (data, i) =>
  	@data.sort (a,b) -> b.timeinstate - a.timeinstate
  	@barChart.transition().
  		duration(500)
      .attr("transform", (d,i)-> "translate(0," + this.barX_scale(i) + ")")
  # Method to move bubble stuff off screen for bar
  move_off_screen_left: (alpha) =>
    (d) =>
      d.x = d.x + (-90 - d.x) * (@damper + 0.02) * alpha * 1.1

  hide_details: (data, i, element) =>
    d3.select(element).attr("stroke", (d) => d3.rgb(@fill_color(d.state)).darker())
    @tooltip.hideTooltip()
  
  setTimer : () =>
    console.log("Set timer")
    @data.forEach (d) =>
      d.timeinstate = parseInt(d.timeinstate)+1000
    @create_nodes()
    #@update_vis()

root = exports ? this

$ ->
  chart = null

  render_vis = (csv) ->
    chart = new BubbleChart csv
    chart.start()
    root.display_all()
  root.display_all = () =>
    chart.display_state_all()
  root.update_vis = () =>
    d3.timer(chart.update_vis)
  root.display_state = () =>
    chart.display_by_state()
  root.display_id = () =>
    chart.display_by_id()
  root.display_tis = () =>
    chart.display_by_barHeight()
  root.incSec = () =>
    setInterval(chart.setTimer, 1000)
  root.toggle_view = (view_type) =>
    if view_type == 'state'
      root.display_state()
    else if view_type == 'id'
      root.display_id()
    else if view_type == 'tis'
          root.incSec()
          root.update_vis()
          # root.display_tis()
    else
      root.display_all()

  d3.csv "data/agents.csv", render_vis
