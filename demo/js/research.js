(function () {
  const coeff = {
    160: [0.0033312266154312603, 0.19731320153706208, 11.063955278592376],
    175: [0.0005531398523611693, 0.3400670947517452, 11.157060117302056],
    190: [0.002016318636869192, 0.6368128602487624, 11.824120234604102],
    205: [0.003922097785418126, 0.7975991632116493, 11.51525659824047],
    220: [0.008444294165234083, 1.0283768202042674, 11.185289589442819],
  };
  const colours = {
    160: "#7C8AA3",
    175: "#5D6B85",
    190: "#3E4E6C",
    205: "#253047",
    220: "#14213D",
  };

  function tpc(temp, hour) {
    const c = coeff[temp];
    return c[0] * hour * hour + c[1] * hour + c[2];
  }

  console.assert(Math.abs(tpc(160, 0) - 11.064) < 0.01);
  console.assert(tpc(160, 30) < 25);
  console.assert(tpc(220, 30) > 25);

  const width = 640;
  const height = 320;
  const left = 48;
  const right = 16;
  const top = 16;
  const bottom = 36;
  const xOf = (hour) => left + (hour / 30) * (width - left - right);
  const yOf = (value) => top + (1 - value / 50) * (height - top - bottom);
  let paths = "";
  Object.keys(coeff).forEach((temp) => {
    let d = "";
    for (let hour = 0; hour <= 30; hour += 1) {
      d += (hour === 0 ? "M" : "L") + xOf(hour).toFixed(1) + " " + yOf(tpc(Number(temp), hour)).toFixed(1) + " ";
    }
    paths += '<path d="' + d + '" fill="none" stroke="' + colours[temp] + '" stroke-width="2"/>';
  });
  const bench = yOf(25);
  const svg = '<svg viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="Curve fit of total polar compounds against frying hours for five temperatures.">' +
    '<line x1="' + left + '" y1="' + top + '" x2="' + left + '" y2="' + (height - bottom) + '" stroke="#14213D" stroke-width="1"/>' +
    '<line x1="' + left + '" y1="' + (height - bottom) + '" x2="' + (width - right) + '" y2="' + (height - bottom) + '" stroke="#14213D" stroke-width="1"/>' +
    '<line x1="' + left + '" y1="' + bench + '" x2="' + (width - right) + '" y2="' + bench + '" stroke="#14213D" stroke-width="1.5" stroke-dasharray="2 4"/>' +
    paths +
    '<text x="' + (left + 6) + '" y="' + (bench - 6) + '" fill="#14213D" font-size="12" font-family="IBM Plex Sans, sans-serif">25%</text>' +
    '<text x="' + left + '" y="' + (height - 12) + '" fill="#374151" font-size="12" font-family="IBM Plex Mono, monospace">0 h</text>' +
    '<text x="' + (width - 70) + '" y="' + (height - 12) + '" fill="#374151" font-size="12" font-family="IBM Plex Mono, monospace">30 h</text>' +
    "</svg>";
  const legend = Object.keys(coeff).map((temp) =>
    '<span><i style="background:' + colours[temp] + '"></i>' + temp + " °C</span>"
  ).join("");
  document.getElementById("chart").innerHTML = svg + '<div class="legend">' + legend + "</div>";

  const sessions = JSON.parse(localStorage.getItem("mantika-study-sessions") || "[]");
  const consented = sessions.filter((item) => item.consented);
  const count = document.getElementById("session-count");
  count.textContent = consented.length ? String(consented.length) : "[n]";
  const status = document.getElementById("usability-status");
  if (consented.length < 5) {
    status.textContent = "Usability review has not reached 5 consented vendors. Consented sessions on this browser: " + consented.length + ". Practice sessions are not included.";
  } else {
    const mean = consented.reduce((sum, item) => sum + item.sus, 0) / consented.length;
    const successes = consented.filter((item) => item.tasks && item.tasks.log && item.tasks.log.success && item.tasks.scan && item.tasks.scan.success && item.tasks.history && item.tasks.history.success).length;
    status.textContent = "Consented vendors: " + consented.length + ". Task success on all three tasks: " + successes + " of " + consented.length + ". Mean SUS: " + mean.toFixed(1) + ".";
  }
})();
