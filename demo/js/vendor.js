(function () {
  const KEY = "mantika-demo-state";
  const STUDY_KEY = "mantika-study-sessions";
  const studyOn = new URLSearchParams(location.search).get("study") === "1";
  const ui = {
    view: "home",
    filter: "all",
    compare: false,
    picked: [],
    openId: null,
    toast: null,
    tempError: false,
    cameraError: false,
    scan: null,
  };
  const study = {
    task: "log",
    started: performance.now(),
    tasks: {},
    answers: {},
    consented: false,
  };

  let state = load();

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved && saved.stall) return saved;
    } catch (err) {
      /* start from the sample */
    }
    return sample();
  }

  function minutesAgo(mins) {
    return localIso(new Date(Date.now() - mins * 60000));
  }

  function sample() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(16, 10, 0, 0);
    return {
      lang: "en",
      stall: "V-07",
      heatingRunning: true,
      heatingMinutes: 200,
      lastTick: Date.now(),
      oilType: "palm",
      food: "kwek",
      tempKnown: true,
      tempC: 175,
      freshAdds: [minutesAgo(125)],
      replaced: false,
      readings: [
        row("r1", minutesAgo(20), "2", "2", "sent"),
        row("r0", localIso(yesterday), "1", "1", "sent"),
      ],
      events: [
        { id: "e1", at: minutesAgo(200), kind: "start", status: "sent" },
        { id: "e2", at: minutesAgo(125), kind: "fresh", status: "sent" },
      ],
    };
  }

  function row(id, at, phone, human, status) {
    return {
      id, at, phoneBand: phone, humanBand: human, status,
      rgb: null, lab: null, where: "sample", experimental: true,
    };
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function t(key, vars) {
    let text = (COPY[state.lang] && COPY[state.lang][key]) || COPY.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach((name) => {
        text = text.replace("{" + name + "}", vars[name]);
      });
    }
    return text;
  }

  function liveMinutes() {
    let minutes = state.heatingMinutes;
    if (state.heatingRunning) minutes += (Date.now() - state.lastTick) / 60000;
    return minutes;
  }

  function heatText() {
    const total = Math.max(0, Math.round(liveMinutes()));
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return hours + " h " + mins + " m";
  }

  function clock(iso) {
    const date = new Date(iso);
    return date.toLocaleTimeString(state.lang === "fil" ? "fil-PH" : "en-GB", {
      hour: "numeric", minute: "2-digit",
    });
  }

  function localIso(date) {
    const value = date || new Date();
    const part = (n) => String(n).padStart(2, "0");
    return value.getFullYear() + "-" + part(value.getMonth() + 1) + "-" + part(value.getDate()) +
      "T" + part(value.getHours()) + ":" + part(value.getMinutes()) + ":" + part(value.getSeconds());
  }

  function localDay(value) {
    const date = value instanceof Date ? value : new Date(value);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
  }

  function dayKey(iso) {
    return localDay(iso);
  }

  function dayLabel(iso) {
    return new Date(iso).toLocaleDateString(state.lang === "fil" ? "fil-PH" : "en-GB", {
      weekday: "short", day: "numeric", month: "short",
    });
  }

  function syncState() {
    const pending = [...state.readings, ...state.events].some((item) => item.status === "failed");
    const local = [...state.readings, ...state.events].some((item) => item.status === "phone" || item.status === "unfinished");
    if (pending) return "failed";
    if (local) return "phone";
    return "sent";
  }

  function syncLabel() {
    const mode = syncState();
    if (mode === "failed") return t("notSent");
    if (mode === "phone") return t("onPhone");
    return t("allSent");
  }

  function latestReading() {
    return state.readings.slice().sort((a, b) => b.at.localeCompare(a.at))[0] || null;
  }

  function previousReading(current) {
    const ordered = state.readings.slice().sort((a, b) => a.at.localeCompare(b.at));
    const index = ordered.findIndex((item) => item.id === current.id);
    return index > 0 ? ordered[index - 1] : null;
  }

  function oilName() {
    return t(state.oilType === "unsure" ? "unsureOil" : state.oilType);
  }

  function foodName() {
    return t(state.food);
  }

  function mark(id, ok) {
    if (!studyOn || study.tasks[id]) return;
    study.tasks[id] = {
      id,
      success: ok,
      seconds: Math.round((performance.now() - study.started) / 1000),
    };
    study.started = performance.now();
    if (id === "log") study.task = "scan";
    else if (id === "scan") study.task = "history";
    else if (id === "history") study.task = "sus";
  }

  function render() {
    document.documentElement.lang = state.lang === "fil" ? "fil" : "en";
    const studyBar = document.getElementById("study");
    studyBar.innerHTML = studyOn ? studyHtml() : "";
    document.getElementById("app").innerHTML = shell(viewHtml());
    bind();
  }

  function studyHtml() {
    if (study.saved) return '<div class="study"><p>' + t("studySaved") + "</p></div>";
    const label = study.task === "log" ? t("taskLog")
      : study.task === "scan" ? t("taskScan")
      : study.task === "history" ? t("taskHistory")
      : t("taskSus");
    const seconds = Math.round((performance.now() - study.started) / 1000);
    return '<div class="study"><div class="row"><p>' + label + '</p><span class="num">' + seconds + "s</span></div></div>";
  }

  function shell(inner) {
    const home = ui.view === "home";
    return (
      '<div class="screen">' +
      topbar() +
      (ui.toast ? '<div class="toast" role="status"><span>' + ui.toast + '</span><button type="button" data-action="undo-toast">' + t("undo") + "</button></div>" : "") +
      inner +
      "</div>" +
      '<div class="dock">' +
      (home ? '<button type="button" class="primary" data-go="prepare">' + t("scan") + "</button>" : "") +
      '<nav class="nav" aria-label="Primary">' +
      navBtn("home", t("home")) +
      navBtn("log", t("log")) +
      navBtn("history", t("history")) +
      "</nav></div>"
    );
  }

  function navBtn(view, label) {
    const on = ui.view === view || (view === "history" && ui.view === "detail");
    return '<button type="button" data-go="' + view + '"' + (on ? ' aria-current="page"' : "") + ">" + label + "</button>";
  }

  function topbar() {
    return (
      '<header class="top"><div class="brand">' + markSvg() + "<strong>" + t("brand") + "</strong></div>" +
      '<button type="button" class="sync" data-state="' + syncState() + '" data-action="sync">' +
      syncLabel() + "</button></header>" +
      '<div class="langs" role="group" aria-label="Language">' +
      '<button type="button" data-lang="en" aria-pressed="' + (state.lang === "en") + '">EN</button>' +
      '<button type="button" data-lang="fil" aria-pressed="' + (state.lang === "fil") + '">FIL</button></div>'
    );
  }

  function markSvg() {
    return '<svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="6" fill="#14213D"/><path d="M9 25 L16 8 L23 25" fill="none" stroke="#F6F3EC" stroke-width="2.2"/><path d="M14.2 18.2 H22.2" stroke="#B07A2A" stroke-width="2.2"/></svg>';
  }

  function viewHtml() {
    if (ui.view === "home") return homeHtml();
    if (ui.view === "prepare" || ui.view === "align" || ui.view === "check") return scanHtml();
    if (ui.view === "log") return logHtml();
    if (ui.view === "detail") return detailHtml();
    if (ui.view === "sus") return susHtml();
    return historyHtml();
  }

  function homeHtml() {
    const latest = latestReading();
    const band = latest ? (latest.humanBand || latest.phoneBand) : null;
    const oilSince = state.events.find((item) => item.kind === "start");
    return (
      '<p class="sub">' + longDate() + "</p>" +
      '<p class="stall">' + t("stall") + " " + state.stall + "</p>" +
      '<p class="meta">' + t("sample") + "</p>" +
      '<section class="card"><h2>' + t("latest") + "</h2>" +
      (latest && band
        ? '<div class="reading-row"><i class="swatch" data-band="' + band + '"></i><div><strong>' + t("bandOf", { n: band }) + "</strong>" +
          '<p class="meta">' + dayLabel(latest.at) + ", " + clock(latest.at) + " · " + t("confirmed") + "</p>" +
          '<span class="pill">' + t("experimental") + "</span></div></div>"
        : "<p>" + t("noReadings") + "</p>") +
      "</section>" +
      '<section class="card"><h2>' + t("todayOil") + "</h2>" +
      "<strong>" + oilName() + " · " + foodName() + "</strong>" +
      '<p class="meta">' + t("since") + " " + (oilSince ? clock(oilSince.at) : "—") + "</p>" +
      '<div class="facts"><div><span>' + t("heating") + '</span><b class="num" data-heating>' + heatText() + "</b></div>" +
      "<div><span>" + t("fresh") + '</span><b class="num">' + state.freshAdds.length + " " + t("timeWord") + "</b></div></div>" +
      '<button type="button" class="secondary" data-go="log" style="margin-top:12px">' + t("update") + "</button></section>" +
      "<h2 class=\"section-label\">" + t("recent") + "</h2><ul class=\"recent\">" + recentItems().map((item) =>
        "<li><span>" + item.label + "</span><time>" + item.time + "</time></li>"
      ).join("") + "</ul>"
    );
  }

  function recentItems() {
    const items = [];
    state.readings.forEach((item) => items.push({ at: item.at, label: t("scanned"), time: clock(item.at) }));
    state.events.forEach((item) => items.push({
      at: item.at,
      label: item.kind === "fresh" ? t("added") : item.kind === "replace" ? t("replaced") : t("started") + " · " + oilName(),
      time: clock(item.at),
    }));
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 3);
  }

  function longDate() {
    return new Date().toLocaleDateString(state.lang === "fil" ? "fil-PH" : "en-GB", {
      weekday: "long", day: "numeric", month: "long",
    });
  }

  function scanHtml() {
    if (!ui.scan) ui.scan = { step: "prepare" };
    const scan = ui.scan;
    if (scan.step === "prepare") {
      return '<p class="meta">' + t("step", { n: 1 }) + "</p><h1>" + t("prepareTitle") + "</h1><p>" + t("prepareBody") + "</p>" +
        '<div class="dock" style="position:static;border:0;padding:16px 0"><button type="button" class="primary" data-action="to-align">' + t("continue") + "</button></div>";
    }
    if (scan.step === "problem") {
      return '<h1>' + scan.problemTitle + "</h1><p>" + scan.problemBody + "</p>" +
        '<button type="button" class="primary" data-action="retake">' + t("again") + "</button>";
    }
    if (scan.step === "align") {
      return '<p class="meta">' + t("step", { n: 2 }) + "</p><h1>" + t("alignTitle") + "</h1><p>" + t("alignBody") + "</p>" +
        '<div class="pair"><div class="frame"><div class="strip-demo" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><p>' + t("card") + " + " + t("strip") + "</p></div>" +
        '<div class="frame">' + (scan.preview ? '<img class="preview" alt="" src="' + scan.preview + '">' : "<p>" + t("strip") + "</p>") +
        (ui.cameraError ? '<p class="help">' + t("cameraBody") + "</p>" : '<video id="cam" autoplay playsinline muted style="width:100%;border-radius:4px;background:#efeae0"></video>') +
        "</div></div>" +
        '<div class="checks">' + checkLine(t("light"), scan.checks && scan.checks.light) +
        checkLine(t("focus"), scan.checks && scan.checks.focus) +
        checkLine(t("tilt"), scan.checks && scan.checks.tilt) + "</div>" +
        '<p class="help">' + t("checksNote") + "</p>" +
        '<div style="display:grid;gap:8px;margin-top:12px"><button type="button" class="primary" id="shutter"' + (ui.cameraError ? " disabled" : "") + ">" + t("shutter") + "</button>" +
        '<label class="secondary" style="display:grid;place-items:center">' + t("choose") + '<input id="file" type="file" accept="image/*" capture="environment" hidden></label></div>';
    }
    const band = scan.phoneBand;
    const prev = latestReading();
    return '<p class="meta">' + t("step", { n: 3 }) + "</p><h1>" + t("checkTitle") + "</h1>" +
      (scan.uncertain ? '<div class="error"><strong>' + t("unsureTitle") + "</strong><p>" + t("unsureBody") + "</p></div>" : "") +
      '<section class="card"><p class="meta">' + t("phoneReading") + "</p><strong>" + (band ? t("bandOf", { n: band }) : "—") + "</strong>" +
      '<span class="pill">' + t("experimental") + "</span>" +
      (scan.lab ? '<p class="colour-nums num">RGB ' + scan.rgb.r + ", " + scan.rgb.g + ", " + scan.rgb.b + "<br>L* " + scan.lab.L + " · a* " + scan.lab.a + " · b* " + scan.lab.b + "</p><p class=\"help\">" + t("colourNote") + " " + (scan.where === "research_server" ? t("onServer") : t("onDevice")) + "</p>" : "") +
      "</section>" +
      '<section class="card"><h2>' + t("meansTitle") + "</h2><p>" + t("means") + "</p></section>" +
      "<h2 class=\"section-label\">" + t("which") + "</h2>" +
      '<div class="bands">' + [1, 2, 3].map((n) => {
        const changed = prev && String(prev.humanBand || prev.phoneBand) !== String(n);
        const pressed = String(scan.chosen || band) === String(n);
        return '<button type="button" data-band="' + n + '" aria-pressed="' + pressed + '"><i style="background:' + bandColor(n) + '"></i>Band ' + n +
          '<span class="change">' + (prev ? (changed ? t("changed") : t("noChange")) : "") + "</span></button>";
      }).join("") + "</div>" +
      '<p class="help">' + t("bothKept") + "</p><p class=\"help\">" + t("expNote") + "</p>" +
      '<div style="display:grid;gap:8px;margin-top:12px"><button type="button" class="secondary" data-action="retake">' + t("retake") + "</button>" +
      '<button type="button" class="primary" data-action="save-reading">' + t("saveReading") + "</button></div>";
  }

  function bandColor(n) {
    return n === 1 ? "#f4e4b8" : n === 2 ? "#c4923a" : "#6b4e32";
  }

  function checkLine(label, value) {
    if (!value) return "<div><span>" + label + "</span><span>—</span></div>";
    const good = value === "good" || value === "sharp" || value === "ok";
    const word = value === "good" ? t("good") : value === "sharp" ? t("sharp") : value === "ok" ? t("good")
      : value === "dark" ? t("dark") : value === "bright" ? t("bright") : value === "blur" ? t("blur") : t("tilted");
    return "<div><span>" + label + "</span><span class=\"" + (good ? "ok" : "bad") + "\">" + word + "</span></div>";
  }

  function logHtml() {
    const oils = [["palm", "palm"], ["coconut", "coconut"], ["soybean", "soybean"], ["unsure", "unsureOil"]];
    const foods = [["kwek", "kwek"], ["fish", "fish"], ["banana", "banana"], ["other", "other"]];
    const lastFresh = state.freshAdds[state.freshAdds.length - 1];
    const freshCopy = state.freshAdds.length > 1
      ? t("freshLineMany", { n: state.freshAdds.length, time: lastFresh ? clock(lastFresh) : "—" })
      : t("freshLine", { n: state.freshAdds.length, time: lastFresh ? clock(lastFresh) : "—" });
    return '<div style="display:flex;justify-content:space-between;gap:8px"><h1>' + t("log") + "</h1><button type=\"button\" class=\"textish\" data-go=\"history\" style=\"width:auto\">" + t("past") + "</button></div>" +
      "<h2 class=\"section-label\">" + t("oilQ") + "</h2><p class=\"meta\">" + t("oil") + "</p><div class=\"chips\">" +
      oils.map(([id, key]) => chip("oil", id, t(key), state.oilType === id)).join("") +
      "</div><p class=\"meta\" style=\"margin-top:12px\">" + t("food") + "</p><div class=\"chips\">" +
      foods.map(([id, key]) => chip("food", id, t(key), state.food === id)).join("") +
      "</div><h2 class=\"section-label\">" + t("heatQ") + '</h2><p class="num" data-heating style="font-size:24px;margin:0">' + heatText() + "</p>" +
      '<button type="button" class="secondary" data-action="toggle-heat">' + (state.heatingRunning ? t("frying") : t("paused")) + "</button>" +
      "<p class=\"meta\">" + t("temp") + "</p>" +
      '<div class="stepper"><button type="button" data-action="temp-dec" aria-label="-">−</button><span class="num">' + (state.tempKnown ? state.tempC + " °C" : "—") + "</span>" +
      '<button type="button" data-action="temp-inc" aria-label="+">+</button></div>' +
      '<button type="button" class="textish" data-action="toggle-temp">' + (state.tempKnown ? t("dont") : t("know")) + "</button>" +
      (ui.tempError ? '<p class="error" role="alert">' + t("tempError") + "</p>" : "") +
      "<h2 class=\"section-label\">" + t("changes") + "</h2>" +
      '<div style="display:grid;gap:8px"><button type="button" class="secondary" data-action="add-fresh">+ ' + t("addFresh") + "</button>" +
      '<button type="button" class="secondary" data-action="replace">' + t("replaceAll") + "</button></div>" +
      "<p class=\"help\">" + freshCopy + "</p>" +
      (state.replaced ? '<p class="help">' + t("replaceNote") + "</p>" : "") +
      '<button type="button" class="primary" style="margin-top:16px" data-action="done-log">' + t("done") + "</button>";
  }

  function chip(group, id, label, on) {
    return '<button type="button" data-' + group + '="' + id + '" aria-pressed="' + on + '">' + label + "</button>";
  }

  function historyHtml() {
    const items = historyItems().filter((item) => {
      if (ui.filter === "strips") return item.kind === "strip";
      if (ui.filter === "logs") return item.kind === "log";
      if (ui.filter === "needs") return item.needs;
      return true;
    });
    const needs = historyItems().filter((item) => item.needs).length;
    let body = '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><h1>' + t("history") + "</h1>" +
      '<button type="button" class="textish" data-action="compare" style="width:auto" aria-pressed="' + ui.compare + '">' + t("compare") + "</button></div>";
    if (ui.compare) body += '<p class="help">' + t("compareHint") + " " + ui.picked.length + " / 2</p>";
    body += '<div class="filters">' +
      filterBtn("all", t("all")) + filterBtn("strips", t("strips")) + filterBtn("logs", t("logs")) +
      filterBtn("needs", t("needs") + (needs ? " (" + needs + ")" : "")) + "</div>";
    if (!state.readings.length && ui.filter !== "logs") {
      body += '<section class="card"><h2>' + t("noReadings") + "</h2><p>" + t("noReadingsBody") + "</p>" +
        '<button type="button" class="primary" data-go="prepare">' + t("scan") + "</button></section>";
    }
    let lastDay = "";
    items.forEach((item) => {
      const day = dayKey(item.at);
      if (day !== lastDay) {
        body += '<p class="day">' + dayLabel(item.at) + "</p>";
        lastDay = day;
      }
      const selected = ui.picked.includes(item.id);
      body += '<button type="button" class="rowbtn" data-open="' + item.id + '" data-kind="' + item.kind + '"' +
        (selected ? ' aria-pressed="true"' : "") + ">" +
        (item.band ? '<i class="swatch" data-band="' + item.band + '" style="width:28px;height:36px"></i>' : "<span></span>") +
        "<span><strong>" + item.title + "</strong><small>" + item.sub + "</small></span>" +
        '<span class="tag ' + item.status + '">' + statusWord(item.status) + "</span></button>";
    });
    if (ui.compare && ui.picked.length === 2) body += compareHtml();
    return body;
  }

  function filterBtn(id, label) {
    return '<button type="button" class="secondary" style="width:auto;min-height:40px" data-filter="' + id + '" aria-pressed="' + (ui.filter === id) + '">' + label + "</button>";
  }

  function statusWord(status) {
    if (status === "sent") return t("sent");
    if (status === "failed") return t("notSent");
    if (status === "unfinished") return t("unfinished");
    return t("onPhone");
  }

  function historyItems() {
    const strips = state.readings.map((item) => ({
      id: item.id,
      kind: "strip",
      at: item.at,
      band: item.humanBand || item.phoneBand,
      title: item.humanBand ? t("bandOf", { n: item.humanBand }) : t("unfinished"),
      sub: clock(item.at),
      status: item.humanBand ? item.status : "unfinished",
      needs: item.status !== "sent" || !item.humanBand,
    }));
    const logs = state.events.map((item) => ({
      id: item.id,
      kind: "log",
      at: item.at,
      band: null,
      title: item.kind === "fresh" ? t("added") : item.kind === "replace" ? t("replaced") : t("started"),
      sub: clock(item.at),
      status: item.status,
      needs: item.status !== "sent",
    }));
    return strips.concat(logs).sort((a, b) => b.at.localeCompare(a.at));
  }

  function compareHtml() {
    const pair = ui.picked.map((id) => state.readings.find((item) => item.id === id)).filter(Boolean);
    if (pair.length < 2) return "";
    const a = pair[0].humanBand || pair[0].phoneBand;
    const b = pair[1].humanBand || pair[1].phoneBand;
    return '<section class="card"><h2>' + t("compare") + "</h2><p>" + t("bandOf", { n: a }) + " · " + t("bandOf", { n: b }) + "</p><p><strong>" +
      (a === b ? t("noChange") : t("changed")) + "</strong></p><p class=\"help\">" + t("expNote") + "</p></section>";
  }

  function detailHtml() {
    const item = state.readings.find((row) => row.id === ui.openId);
    if (!item) return historyHtml();
    return "<h1>" + t("detail") + "</h1><p class=\"meta\">" + dayLabel(item.at) + " · " + clock(item.at) + "</p>" +
      '<section class="card"><p>' + t("human") + "</p><strong>" + (item.humanBand ? t("bandOf", { n: item.humanBand }) : "—") + "</strong>" +
      "<p>" + t("auto") + "</p><strong>" + (item.phoneBand ? t("bandOf", { n: item.phoneBand }) : "—") + "</strong>" +
      '<span class="pill">' + t("experimental") + "</span></section>" +
      (item.status !== "sent" ? '<button type="button" class="primary" data-action="send" data-id="' + item.id + '">' + t("send") + "</button>" : "") +
      (studyOn && study.task === "sus" ? '<button type="button" class="primary" data-go="sus">' + t("taskSus") + "</button>" : "") +
      '<button type="button" class="textish" data-go="history">' + t("back") + "</button>";
  }

  function susHtml() {
    const items = SUS[state.lang] || SUS.en;
    return "<h1>SUS</h1><form class=\"sus\" id=\"sus\">" + items.map((text, index) =>
      "<fieldset><legend>" + (index + 1) + ". " + text + "</legend>" +
      [1, 2, 3, 4, 5].map((score) => '<label><input type="radio" name="q' + index + '" value="' + score + '"' +
        (study.answers[index] === score ? " checked" : "") + "> <span class=\"num\">" + score + "</span></label>").join("") +
      "</fieldset>"
    ).join("") +
      '<label><input type="checkbox" id="consented"' + (study.consented ? " checked" : "") + "> " + t("consented") + "</label>" +
      '<p class="help">' + t("practice") + "</p>" +
      '<button class="primary" type="submit">' + t("saveStudy") + "</button></form>";
  }

  function bind() {
    document.querySelectorAll("[data-go]").forEach((node) => node.addEventListener("click", () => {
      ui.view = node.getAttribute("data-go");
      ui.tempError = false;
      render();
    }));
    document.querySelectorAll("[data-lang]").forEach((node) => node.addEventListener("click", () => {
      state.lang = node.getAttribute("data-lang");
      save();
      render();
    }));
    const shutter = document.getElementById("shutter");
    const file = document.getElementById("file");
    const video = document.getElementById("cam");
    if (video && !ui.cameraError) startCamera(video);
    if (shutter && video) shutter.addEventListener("click", () => grabFrame(video));
    if (file) file.addEventListener("change", () => {
      if (file.files && file.files[0]) useFile(file.files[0]);
    });
    document.querySelectorAll("[data-action]").forEach((node) => node.addEventListener("click", () => act(node.getAttribute("data-action"), node)));
    document.querySelectorAll("[data-oil]").forEach((node) => node.addEventListener("click", () => {
      state.oilType = node.getAttribute("data-oil");
      save();
      render();
    }));
    document.querySelectorAll("[data-food]").forEach((node) => node.addEventListener("click", () => {
      state.food = node.getAttribute("data-food");
      save();
      render();
    }));
    document.querySelectorAll("[data-band]").forEach((node) => node.addEventListener("click", () => {
      ui.scan.chosen = node.getAttribute("data-band");
      render();
    }));
    document.querySelectorAll("[data-filter]").forEach((node) => node.addEventListener("click", () => {
      ui.filter = node.getAttribute("data-filter");
      render();
    }));
    document.querySelectorAll("[data-open]").forEach((node) => node.addEventListener("click", () => openRow(node)));
    const form = document.getElementById("sus");
    if (form) form.addEventListener("submit", saveStudy);
  }

  function openRow(node) {
    const id = node.getAttribute("data-open");
    const kind = node.getAttribute("data-kind");
    if (ui.compare && kind === "strip") {
      const index = ui.picked.indexOf(id);
      if (index >= 0) ui.picked.splice(index, 1);
      else if (ui.picked.length < 2) ui.picked.push(id);
      render();
      return;
    }
    if (kind === "strip") {
      const item = state.readings.find((row) => row.id === id);
      ui.openId = id;
      ui.view = "detail";
      if (item && localDay(item.at) < localDay(new Date())) mark("history", true);
      render();
    }
  }

  async function startCamera(video) {
    if (!navigator.mediaDevices) {
      ui.cameraError = true;
      return;
    }
    try {
      if (ui.stream) ui.stream.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      ui.stream = stream;
      video.srcObject = stream;
    } catch (err) {
      ui.cameraError = true;
      render();
    }
  }

  function grabFrame(video) {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) useFile(new File([blob], "strip.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  }

  async function useFile(file) {
    const local = await readImage(file);
    let result = local;
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/v1/demo/analyze", { method: "POST", body });
      if (response.ok) {
        const remote = await response.json();
        result = {
          checks: local.checks,
          phoneBand: remote.band,
          uncertain: (remote.retake_reasons || []).includes("patches_hard_to_separate"),
          rgb: remote.rgb,
          lab: remote.cielab,
          where: "research_server",
          preview: local.preview,
        };
        if ((remote.retake_reasons || []).includes("too_dark")) result.checks.light = "dark";
        if ((remote.retake_reasons || []).includes("blur_suspected")) result.checks.focus = "blur";
      }
    } catch (err) {
      result.where = "phone";
    }
    ui.scan = Object.assign({ step: "align", chosen: result.phoneBand }, result);
    if (result.checks.light === "dark" || result.checks.light === "bright") {
      ui.scan.step = "problem";
      ui.scan.problemTitle = t("tooDarkTitle");
      ui.scan.problemBody = t("tooDarkBody");
    } else if (result.checks.focus === "blur") {
      ui.scan.step = "problem";
      ui.scan.problemTitle = t("blurTitle");
      ui.scan.problemBody = t("blurBody");
    } else {
      ui.scan.step = "check";
    }
    ui.view = "check";
    render();
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 400 / image.width);
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let r = 0, g = 0, b = 0, n = 0, edges = 0, lumaSum = 0, lumaSq = 0;
        const width = canvas.width;
        for (let y = Math.floor(canvas.height * 0.25); y < canvas.height * 0.75; y += 1) {
          for (let x = Math.floor(width * 0.25); x < width * 0.75; x += 1) {
            const i = (y * width + x) * 4;
            r += data[i]; g += data[i + 1]; b += data[i + 2]; n += 1;
            const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
            lumaSum += lum;
            lumaSq += lum * lum;
            if (x + 1 < width * 0.75) {
              const j = (y * width + (x + 1)) * 4;
              edges += Math.abs(data[i] - data[j]) + Math.abs(data[i + 1] - data[j + 1]) + Math.abs(data[i + 2] - data[j + 2]);
            }
          }
        }
        r /= n; g /= n; b /= n;
        const lab = rgbToLab(r, g, b);
        const luma = lumaSum / n;
        const spatial = Math.sqrt(Math.max(0, lumaSq / n - luma * luma));
        const edge = edges / n;
        const light = luma < 45 ? "dark" : luma > 235 ? "bright" : "good";
        const focus = spatial > 18 && edge < 4 ? "blur" : "sharp";
        const nearest = nearestBand(lab);
        resolve({
          preview: url,
          checks: { light, focus, tilt: "ok" },
          phoneBand: nearest.band,
          uncertain: nearest.gap < 8,
          rgb: { r: Math.round(r), g: Math.round(g), b: Math.round(b) },
          lab: { L: round1(lab[0]), a: round1(lab[1]), b: round1(lab[2]) },
          where: "phone",
        });
      };
      image.onerror = reject;
      image.src = url;
    });
  }

  function round1(value) { return Math.round(value * 10) / 10; }

  function rgbToLab(r, g, b) {
    const lin = (c) => {
      const v = c / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    const R = lin(r), G = lin(g), B = lin(b);
    const X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
    const Y = R * 0.2126729 + G * 0.7151522 + B * 0.0721750;
    const Z = R * 0.0193339 + G * 0.1191920 + B * 0.9503041;
    const f = (t) => t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116;
    const fx = f(X / 0.95047), fy = f(Y), fz = f(Z / 1.08883);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }

  function nearestBand(lab) {
    const refs = [
      ["1", 85, 2, 55],
      ["2", 62, 18, 48],
      ["3", 32, 12, 18],
    ];
    const scored = refs.map(([band, L, a, b]) => {
      const d = Math.hypot(lab[0] - L, lab[1] - a, lab[2] - b);
      return { band, d };
    }).sort((a, b) => a.d - b.d);
    return { band: scored[0].band, gap: scored[1].d - scored[0].d };
  }

  function act(name, node) {
    if (name === "to-align") {
      ui.scan = { step: "align" };
      ui.view = "align";
      ui.cameraError = false;
      render();
    } else if (name === "retake") {
      ui.scan = { step: "align" };
      ui.view = "align";
      render();
    } else if (name === "save-reading") {
      const chosen = ui.scan.chosen || ui.scan.phoneBand;
      const now = localIso();
      state.readings.unshift({
        id: "r" + Date.now(),
        at: now,
        phoneBand: ui.scan.phoneBand,
        humanBand: chosen,
        status: navigator.onLine ? "phone" : "failed",
        rgb: ui.scan.rgb,
        lab: ui.scan.lab,
        where: ui.scan.where,
        experimental: true,
      });
      save();
      ui.toast = t("savedReading");
      ui.view = "home";
      mark("scan", true);
      render();
    } else if (name === "undo-toast") {
      if (ui.toast === t("savedReading") && state.readings[0] && state.readings[0].id.startsWith("r") && state.readings[0].where !== "sample") {
        state.readings.shift();
        save();
      }
      ui.toast = null;
      render();
    } else if (name === "toggle-heat") {
      if (state.heatingRunning) {
        state.heatingMinutes = liveMinutes();
        state.heatingRunning = false;
      } else {
        state.lastTick = Date.now();
        state.heatingRunning = true;
      }
      save();
      render();
    } else if (name === "temp-dec" || name === "temp-inc") {
      if (!state.tempKnown) state.tempKnown = true;
      state.tempC += name === "temp-inc" ? 5 : -5;
      ui.tempError = state.tempC < 150 || state.tempC > 200;
      save();
      render();
    } else if (name === "toggle-temp") {
      state.tempKnown = !state.tempKnown;
      ui.tempError = false;
      save();
      render();
    } else if (name === "add-fresh") {
      state.freshAdds.push(localIso());
      state.events.push({ id: "e" + Date.now(), at: state.freshAdds[state.freshAdds.length - 1], kind: "fresh", status: "phone" });
      save();
      render();
    } else if (name === "replace") {
      state.replaced = true;
      state.events.push({ id: "e" + Date.now(), at: localIso(), kind: "replace", status: "phone" });
      save();
      render();
    } else if (name === "done-log") {
      if (state.tempKnown && (state.tempC < 150 || state.tempC > 200)) {
        ui.tempError = true;
        render();
        return;
      }
      if (state.heatingRunning) {
        state.heatingMinutes = liveMinutes();
        state.lastTick = Date.now();
      }
      save();
      ui.toast = t("savedLog");
      ui.view = "home";
      mark("log", true);
      render();
    } else if (name === "compare") {
      ui.compare = !ui.compare;
      ui.picked = [];
      render();
    } else if (name === "send") {
      const item = state.readings.find((row) => row.id === node.getAttribute("data-id"));
      if (item) item.status = navigator.onLine ? "sent" : "failed";
      save();
      render();
    } else if (name === "sync") {
      if (navigator.onLine) {
        state.readings.forEach((item) => { if (item.status === "phone") item.status = "sent"; });
        state.events.forEach((item) => { if (item.status === "phone") item.status = "sent"; });
        save();
      }
      render();
    }
  }

  function saveStudy(event) {
    event.preventDefault();
    const scores = [];
    for (let i = 0; i < 10; i += 1) {
      const picked = document.querySelector('input[name="q' + i + '"]:checked');
      if (!picked) return;
      scores.push(Number(picked.value));
    }
    let raw = 0;
    scores.forEach((score, index) => {
      raw += index % 2 === 0 ? score - 1 : 5 - score;
    });
    const record = {
      at: localIso(),
      consented: document.getElementById("consented").checked,
      tasks: study.tasks,
      sus: raw * 2.5,
      practice: !document.getElementById("consented").checked,
    };
    const all = JSON.parse(localStorage.getItem(STUDY_KEY) || "[]");
    all.push(record);
    localStorage.setItem(STUDY_KEY, JSON.stringify(all));
    study.saved = true;
    ui.toast = t("studySaved");
    ui.view = "home";
    render();
  }

  render();
  setInterval(() => {
    const node = document.querySelector("[data-heating]");
    if (node && state.heatingRunning) node.textContent = heatText();
    if (studyOn) {
      const bar = document.querySelector(".study .num");
      if (bar && study.task !== "sus") bar.textContent = Math.round((performance.now() - study.started) / 1000) + "s";
    }
  }, 1000);

  if (studyOn && study.task === "sus") ui.view = "sus";
})();
