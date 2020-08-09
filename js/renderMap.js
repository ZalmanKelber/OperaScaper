(function() {
  const state = {
    composer: null,
    mapData: null,
    cities: Object.values(cities),
    prevZoom: 1,
    selected: null,
    gMap: null,
    gCities: null,
    transform: null
  }

  const { select, selectAll, json, geoPath, geoEckert4, scalePow, zoom, zoomIdentity, drag } = d3;
  const { feature } = topojson;

  let svg = select("#map");
  const projection = geoEckert4();
  const pathGenerator = geoPath().projection(projection);

  function renderMap() {
    const width = window.innerWidth >= 700 ? Math.min(960, window.innerWidth - 300) : window.innerWidth;
    const height = width * 500 / 960;
    state.scaleConstant = width / 960;
    svg.remove();
    svg = selectAll("#map-container").append("svg");
    svg
      .attr("class", "map")
      .attr("width", width)
      .attr("height", height);

    const gMap = svg.append("g")
    const gCities = svg.append("g")
    const gx = svg.append("g");
    const gy = svg.append("g");
    state.gMap = gMap;
    state.gCities = gCities;

    gMap.append("path")
      .attr("class", "sphere")
      .attr("d", pathGenerator({type: "Sphere"}));

    gMap.selectAll("path[class=country]")
      .data(state.mapData.features)
      .enter().append("path")
      .attr("class", "country")
      .attr("d", pathGenerator);

    gMap.attr("transform", `scale(${width / 960})`);

  }

  const radiusScale = scalePow()
    .exponent(0.5)
    .domain([0, 1000])
    .range([2, 15])

  function renderCircles() {
    const width = window.innerWidth >= 700 ? Math.min(960, window.innerWidth - 300) : window.innerWidth;
    const height = width * 500 / 960;
    const circles = state.gCities.selectAll("circle").data(state.cities);
    circles
      .enter().append("circle")
        .attr("class", "city")
        .attr("cx", d => {
          if (d.lng && d.lat) {
            return projection([d.lng, d.lat])[0];
          }})
        .attr("cy", function (d) {
          if (d.lng && d.lat) {
            return projection([d.lng, d.lat])[1];
          }})
        .attr("r", d => `${getRadius(d, state.composer) / state.prevZoom}px`)
      .call(drag()
        .on("start", dragged))
      .append("title")
        .attr("class", "map-title")
        .text(d => d.name + " | total performances: " + d.totalPerformances)

    circles
      .attr("r", d => `${getRadius(d, state.composer) / state.prevZoom}px`)
      .append("title")
        .text(d => d.name + " | total performances: " + d.totalPerformances);
    state.gCities.attr("transform", `scale(${width / 960})`)

  }

  function dragged(d) {
    const el = document.getElementById("city-display");
    el.innerHTML = d.name + " | total performances: " + d.totalPerformances;
  }


  function getRadius(city, composer) {
    let performances = 0;
    city.productions.forEach(production => {
      if (!composer || production.composer.slice(0, composer.length) === composer) {
        performances += production.performances;
      }
    });
    city.totalPerformances = performances;
    const resizeConstant = city.selected ? 1.5 : 1;
    return performances !== 0 ? radiusScale(performances) * resizeConstant : 0;
  }

  function zoomed() {
    const { transform } = d3.event;
    state.gCities.attr("transform", transform)
    state.gMap.attr("transform", transform)
    circlesToUpdate = document.querySelectorAll(".city");
    circlesToUpdate.forEach(circle => {
      if (circle !== undefined) {
        const current = circle.getAttribute("r");
        circle.setAttribute(
          "r",
          Number(current.match(/[0-9.]*/)) * Math.pow(state.prevZoom / transform.k, 0.7)
        );
      }
    });
    state.prevZoom = transform.k;
  }

  json("https://unpkg.com/world-atlas@1/world/110m.json", data => {
    state.mapData = feature(data, data.objects.countries);
    renderMap();
    renderCircles();
    const zoomSetup = zoom()
      .scaleExtent([.5, 32])
      .on("zoom", zoomed);
    zoomIdentity.k *= state.scaleConstant;
    svg.call(zoomSetup).call(zoomSetup.transform, zoomIdentity);
  });

  window.addEventListener("resize", () => {
    renderMap();
    renderCircles();
    const zoomSetup = zoom()
      .scaleExtent([.5, 32])
      .on("zoom", zoomed);
    zoomIdentity.k = state.scaleConstant;
    svg.call(zoomSetup).call(zoomSetup.transform, zoomIdentity);
  });


  const mapForm = document.getElementById("map-form");
  mapForm.addEventListener("submit", e => {
    e.preventDefault();
    state.composer = e.target.composer.value;
    renderMap();
    renderCircles();
    const zoomSetup = zoom()
      .scaleExtent([.5, 32])
      .on("zoom", zoomed);
    zoomIdentity.k = state.scaleConstant;
    svg.call(zoomSetup).call(zoomSetup.transform, zoomIdentity);
    const titles = document.querySelectorAll(".map-title");
    titles.forEach(title => {
      title.remove();
    })
  });


})();
