(function() {
  const state = {
    composer: null,
    mapData: null,
    cities,
    prevZoom: 1
  }

  const mapForm = document.getElementById("map-form");
  mapForm.addEventListener("submit", e => {
    e.preventDefault();
    state.composer = e.target.composer.value;
    renderCircles(state);
    const titles = document.querySelectorAll(".map-title");
    titles.forEach(title => {
      title.remove();
    })
  });

  const { select, json, geoPath, geoEckert4, scalePow, zoom, zoomIdentity } = d3;
  const { feature } = topojson;

  const svg = select("svg");
  const gMap = svg.append("g")
  const gCities = svg.append("g")
  const gx = svg.append("g");
  const gy = svg.append("g");
  const projection = geoEckert4();
  const pathGenerator = geoPath().projection(projection);

  function renderMap() {

    gMap.append("path")
      .attr("class", "sphere")
      .attr("d", pathGenerator({type: "Sphere"}));

    gMap.selectAll("path[class=country]")
      .data(state.mapData.features)
      .enter().append("path")
      .attr("class", "country")
      .attr("d", pathGenerator);

  }

  const radiusScale = scalePow()
    .exponent(0.5)
    .domain([0, 1000])
    .range([2, 15])

  function renderCircles() {
    console.log("render circles called");
    const circles = gCities.selectAll("circle").data(Object.values(state.cities));
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
        .on("hover", d => {
          console.log("hover event");
        })
      .append("title")
        .attr("class", "map-title")
        .text(d => d.name + " | total performances: " + d.totalPerformances)

    circles
      .attr("r", d => `${getRadius(d, state.composer) / state.prevZoom}px`)
      .append("title")
        .text(d => d.name + " | total performances: " + d.totalPerformances);

  }

  function getRadius(city, composer) {
    if (city.selected) {
      console.log("city selected");
    }
    let performances = 0;
    city.productions.forEach(production => {
      if (!composer || production.composer.slice(0, composer.length) === composer) {
        performances += production.performances;
      }
    });
    city.totalPerformances = performances;
    return performances !== 0 ? radiusScale(performances) : 0;
  }

  const zoomSetup = zoom()
    .scaleExtent([1, 32])
    .on("zoom", zoomed);

  function zoomed() {
    const transform = d3.event.transform;
    gCities.attr("transform", transform)
    gMap.attr("transform", transform)
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
  });


  svg.call(zoomSetup).call(zoomSetup.transform, zoomIdentity);

})();

const state = 4;
console.log(state);
