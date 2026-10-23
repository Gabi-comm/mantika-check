export const TOUR_KEY = "mantika.tour.v1";
export const TOUR_EVENT = "mantika:tour";

export function startTour() {
  try {
    localStorage.removeItem(TOUR_KEY);
  } catch {}
  window.dispatchEvent(new Event(TOUR_EVENT));
}
