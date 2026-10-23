export const SETTINGS_KEY = "mantika.settings.v3";
export const INTRO_KEY = "mantika.intro.v1";
export const SIDEBAR_KEY = "mantika.sidebar.v1";

/** Inlined in <head>; runs before paint. Applies the saved theme (dark by default), the hidden-sidebar choice, and marks the once-per-session intro. */
export const bootScript = `try{var s=JSON.parse(localStorage.getItem("${SETTINGS_KEY}")||"{}");document.documentElement.dataset.theme=s.theme==="light"?"light":"dark";}catch(e){document.documentElement.dataset.theme="dark";}try{if(localStorage.getItem("${SIDEBAR_KEY}")==="hidden")document.documentElement.dataset.sidebar="hidden";}catch(e){}try{if(!sessionStorage.getItem("${INTRO_KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="play";}catch(e){}`;
