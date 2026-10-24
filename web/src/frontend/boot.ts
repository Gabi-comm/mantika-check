// runs before the page paints (theme, sidebar, intro)
export const SETTINGS_KEY = "mantika.settings.v3";
export const SIDEBAR_KEY = "mantika.sidebar.v1";

export const bootScript = `try{var s=JSON.parse(localStorage.getItem("${SETTINGS_KEY}")||"{}");document.documentElement.dataset.theme=s.theme==="light"?"light":"dark";}catch(e){document.documentElement.dataset.theme="dark";}try{if(localStorage.getItem("${SIDEBAR_KEY}")==="hidden")document.documentElement.dataset.sidebar="hidden";}catch(e){}try{var p=location.pathname;if(p!=="/app"&&p.indexOf("/app/")!==0&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="play";}catch(e){}`;
