(function() {

  const { select, selectAll, scaleLinear, axisBottom, axisLeft, extent, line, curveBasis } = d3;

  const [performances, productions, companies, cities] = ["performances", "productions", "companies", "cities"];

  const state = {
    yAxis: performances,
    artistInfo: Object.values(artistInfo),
    max: 0
  }

  let svg = select(".chart");
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = {top: 60, right: 40, bottom: 88, left: 150}
  const innerWidth = width - margin.left - margin.bottom;
  const innerHeight = height - margin.top - margin.bottom;

  getColor = {performances: "steelblue", productions: "#fbb34c", companies: "#984756", cities: "#67d294"}

  function render() {
    svg.remove();
    svg = selectAll("#chart-wrapper").append("svg")
    svg
      .attr("class", "chart")
      .attr("width", width)
      .attr("height", height);
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
    data = getData();
    const xAxisLabel = "Percentile"
    const yAxisLabel = "Number of " + state.yAxis.charAt(0).toUpperCase() + state.yAxis.slice(1);
    const x = d => d.x;
    const y = d => d.y;
    const xScale = scaleLinear()
      .domain([0, 99])
      .range([0, innerWidth])
      .nice()
    const yScale = scaleLinear()
      .domain([1, state.max])
      .range([innerHeight, 0])
      .nice()
    const xAxis = axisBottom(xScale)
      .tickSize(-innerHeight)
      .tickPadding(15);
    const yAxis = axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickPadding(10);
    const yAxisG = g.append("g").call(yAxis);
    yAxisG.selectAll(".domain").remove();
    yAxisG.append("text")
      .attr("class", "axis-label")
      .attr("y", -93)
      .attr("x", -innerHeight / 2)
      .attr("fill", "black")
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text(yAxisLabel);
    const xAxisG = g.append("g").call(xAxis)
      .attr("transform", `translate(0, ${innerHeight})`);
    xAxisG.selectAll(".domain").remove();
    xAxisG.append("text")
      .attr("class", "axis-label")
      .attr("y", 75)
      .attr("x", innerWidth / 2)
      .attr("fill", "black")
      .text(xAxisLabel);
    const lineGenerator = line()
      .x(d => xScale(x(d)))
      .y(d => yScale(y(d)))
      .curve(curveBasis);
    g.append("path")
        .attr("class", "line-path")
        .attr("stroke", getColor[state.yAxis])
        .attr("d", lineGenerator(data));
  }

  function getData() {
    const totalArtists = state.artistInfo.length;
    values = state.artistInfo.reduce((acc, artist) => {
      acc.push(artist[state.yAxis]);
      return acc;
    }, []);
    values.sort((a, b) => a - b);
    const data = [];
    for (let i = 0; i < 100; i++) {
      const segment = values.slice(
        Math.floor(i * totalArtists / 100),
        Math.floor((i + 1) * totalArtists / 100)
      );
      yVal = segment.reduce((a, b) => a + b, 0) / segment.length;
      if (yVal > state.max) {
        state.max = yVal;
      }
      data.push({ x: i, y: yVal });
    }
    return data;
  }

  render();

  document.getElementById("y-performances").addEventListener("click", e => handleSelect(e, performances));
  document.getElementById("y-productions").addEventListener("click", e => handleSelect(e, productions));
  document.getElementById("y-companies").addEventListener("click", e => handleSelect(e, companies));
  document.getElementById("y-cities").addEventListener("click", e => handleSelect(e, cities));

  function handleSelect(e, yValue) {
    e.preventDefault();
    state.yAxis = yValue;
    state.max = 0;
    render();
  }

})();
