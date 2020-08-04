(function() {
  const state = {
    requiredConnections: 6,
    artistsList: Object.keys(artists),
    artistsHash: artists,
    artistInfo,
    casts,
    companies,
    links: null,
    nodes: null,
    map: null,
    sim: null,
    numGroups: 1,
    colors: []
  }

  const { forceSimulation, forceCenter, forceManyBody, forceLink, select, selectAll, drag } = d3;

  let svg = select(".graph");
  const width = window.innerWidth >= 700 ? Math.min(960, window.innerWidth - 300) : window.innerWidth;
  const height = width * 500 / 960;
  const radiusFactor = 4;
  const getChargeStrength = {3: -1, 4: -5, 5: -10, 6: -20}

  function updateState() {
    state.links = getLinks();
    state.nodes = getNodes(state.links);
    state.map = getMap(state.nodes);
    assignGroups(state.nodes, state.links, state.map);
    state.colors = generateColors(state.numGroups);
    const simulation = forceSimulation()
      .force("link", forceLink().id(d => d.id).strength(0.5))
      .force("charge", forceManyBody().strength(getChargeStrength[state.requiredConnections]))
      .force("center", forceCenter(width / 2, height / 2))

    simulation
     .nodes(state.nodes)
     .on("tick", render);

    simulation.force("link")
      .links(state.links);

  }

  function getLinks() {
    linksArray = [];
    linksHash = {}
    state.artistsList.forEach(artist => {
      linksHash[artist] = {};
      connections = {};
      state.artistInfo[artist].productionsList.forEach(production => {
        Object.keys(state.casts[production].cast).forEach(colleague => {
          if (colleague !== artist) {
            if (connections[colleague]) {
              connections[colleague].push(production);
            }
            else {
              connections[colleague] = [production];
            }
          }
        });
      });
      Object.keys(connections).forEach(colleague => {
        if (connections[colleague].length >= state.requiredConnections
          && !(linksHash[colleague] && linksHash[colleague][artist])
          && getNumberOfCompanies(connections[colleague]) >= state.requiredConnections) {
          linksHash[artist][colleague] = true;
          linksArray.push({source: artist, target: colleague, value: connections[colleague].length});
        }
      });
    });
    return linksArray;
  }

  function getNumberOfCompanies(productions) {
    const companies = productions.reduce((acc, production) => {
      acc[state.casts[production].company] = true;
      return acc;
    }, {});
    return Object.keys(companies).length;
  }

  function getNodes(links) {
    const nodeList =  Object.keys(links.reduce((acc, link) => {
      acc[link.source] = true;
      acc[link.target] = true;
      return acc
    }, {})).map(key => {
      return { id: key, group: null }
    });
    return nodeList;
  }

  function assignGroups(nodeList, links, map) {
    let counter = 0;
    let groupNumber = 0;
    while (counter < nodeList.length) {
      if (nodeList[counter].group === null) {
        connectedNodes(nodeList[counter].id, links).forEach(connectedNode => {
          nodeList[map[connectedNode]].group = groupNumber;
        });
        groupNumber++;
      }
      counter++;
    }
    state.numGroups = groupNumber;
  }

  function connectedNodes(node, links) {
    const searched = {};
    let toSearch = [node];
    while (toSearch.length) {
      const newStack = [];
      toSearch.forEach(node => {
        links.forEach(link => {
          if (link.source === node && !searched[link.target]) {
            newStack.push(link.target);
          }
          if (link.target === node && !searched[link.source]) {
            newStack.push(link.source);
          }
        });
        searched[node] = true;
      });
      toSearch = newStack;
    }
    return Object.keys(searched);
  }

  function getMap(nodes) {
    return nodes.reduce((acc, node, i) => {
      acc[node.id] = i;
      return acc;
    }, {});
  }

  function render() {
    svg.remove();
    svg = selectAll("#graph-wrapper").append("svg")
    svg
      .attr("class", "graph")
      .attr("width", window.innerWidth >= 700 ? Math.min(960, window.innerWidth - 300) : window.innerWidth)
      .attr("height", width * 500 / 960);
    drawLinks();
    drawNodes();

  }

  function drawLinks() {
    const { links, nodes, map, requiredConnections } = state;
    svg.selectAll("path[class=graph-link]")
      .data(links)
      .enter().append("line")
        .attr("class", "graph-link")
        .attr("stroke", d => getColor(nodes[map[d.source.id]]))
        .attr("stroke-opacity", (requiredConnections - 1) / 8)
        .attr("stroke-width", d => (d.value - requiredConnections + 1) * 2 / (8 - requiredConnections))
        .attr("x1", d => getX(nodes[map[d.source.id]]))
        .attr("y1", d => getY(nodes[map[d.source.id]]))
        .attr("x2", d => getX(nodes[map[d.target.id]]))
        .attr("y2", d => getY(nodes[map[d.target.id]]));
  }



  function drawNodes() {
    const { nodes, colors } = state;
    svg.selectAll("path[class=graph-node]")
      .data(nodes)
      .enter().append("circle")
        .attr("class", "graph-node")
        .attr("fill", getColor)
        .attr("cx", getX)
        .attr("cy", getY)
        .attr("r", getRadius)
      .call(drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
  }

  function dragstarted(d) {
    d.selected = true;
    renderArtistDisplay(d.id)
  }

  function dragged(d) {
    d.x += d3.event.dx < 10 ? d3.event.dx : 0;
    d.y += d3.event.dy < 10 ? d3.event.dy : 0;
    render()
  }

  function dragended(d) {
    d.selected = false;
    render();
  }

  function getColor(d) {
    const color = state.colors[d.group];
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }

  function getX(d) {
    return Math.max(getRadius(d), Math.min(width - getRadius(d), d.x))
  }

  function getY(d) {
    return Math.max(getRadius(d), Math.min(height - getRadius(d), d.y))
  }

  function getRadius(d) {
    return (d.selected ? 1.3 : 1) * radiusFactor * (((state.requiredConnections - 3) / 2) + 1);
  }

  function renderArtistDisplay(artist) {
    const companiesList = Object.keys(state.artistInfo[artist].productionsList.reduce((acc, production) => {
      acc[state.casts[production].company] = true;
      return acc;
    }, {}));
    const el = document.getElementById("artist-display");
    el.innerHTML = `<h6>${state.artistsHash[artist]}</h6>
                    ${companiesList.reduce((acc, company) => {
                      acc += `<p class="company-item">${state.companies[company]}</p>`;
                      return acc;
                    }, "")}`
  }

  updateState();
  render();

  document.getElementById("y-3").addEventListener("click", e => handleSelect(e, 3));
  document.getElementById("y-4").addEventListener("click", e => handleSelect(e, 4));
  document.getElementById("y-5").addEventListener("click", e => handleSelect(e, 5));
  document.getElementById("y-6").addEventListener("click", e => handleSelect(e, 6));

  function handleSelect(e, num) {
    e.preventDefault();
    state.requiredConnections = num;
    updateState();
    render();
  }
})();
