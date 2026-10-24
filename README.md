# Mantika Check

A frying-oil advisor for street-food vendors, built for PJDSC 2026.

Vendors log how long and how hot they fried, what they cooked, top-ups and what the oil looks like. Mantika Check estimates how worn the oil is, warns them the moment a warning sign shows up, and tells them whether to keep using, filter, top up or replace it. Ollie, the oil-drop mascot, changes with the oil's status.

**Live:** https://mantika-check.vercel.app

## How it decides

The engine is neuro-symbolic and runs in the browser (`web/src/lib`):

1. **Data-driven estimate**: an Arrhenius kinetic model predicts total polar compounds (TPC) from frying hours and heat. It was trained on published laboratory frying data (Li, 2020). See [`models/`](models/README.md).
2. **Hard safety rules**: visible warning signs (smoke, foam, dark and murky, thick oil) or an estimated TPC above 25% override everything and say "replace now".
3. **Fuzzy rules**: a Mamdani fuzzy system weighs the TPC estimate, how much breaded food was fried and how stable the oil type is, and picks one of four statuses: Continue Monitoring, Monitor Closely, Replacement Recommended, Replace Oil.
4. **Advice wording**: an optional Hugging Face model rewrites the advice text. It only words the decision and never changes it. Without a token, fixed templates are used.

The statuses are estimates from logged usage and observations, not lab measurements. The model has not been validated at real stalls yet.

## Features

- Dashboard with oil status, forecast and usage charts
- Session logging, quick visual checks, top-ups and batch replacement
- History of every batch and event
- Accounts with email or Google sign-in. Records sync to Supabase; without an account everything stays on the device.
- Help drawer and a guided tour
- Experimental colour analyzer: compares a region of an oil photo with printed reference swatches
- Mobile-first, with dark and light themes

## Run it

Needs Node 20.9 or newer.

```bash
npm run install:web   # first time
npm run dev           # http://localhost:3000
npm test
npm run build
```

Run these from the repo root. They forward to `web/`.

Copy `web/.env.example` to `web/.env.local` and fill in:

| Variable | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | accounts and sync ([setup steps](supabase/README.md)) |
| `HF_TOKEN`, `HF_MODEL` | optional, Hugging Face advice wording |

The app works without any of these; it just stays on-device with template advice.

## Repo layout

| Path | What's there |
|---|---|
| `web/` | Next.js app: engine in `src/lib`, workspace data and sync in `src/vendor`, UI in `src/components` and `src/app`, tests in `tests/` |
| `models/` | TPC model training: notebook, data, metrics, figures, and `model_export.json` that the app loads |
| `supabase/` | database migration (tables, RLS) and setup guide |
| `demo-video/` | desktop and mobile demo recordings |

## Built with

Next.js 16, React 19, Tailwind CSS 4, TypeScript, Supabase, Vitest, and the Hugging Face inference router.

## Data and references

# References

- Azanza, M. P. V., Membrebe, B. N. Q., Sanchez, R. G. R., Estilo, E. E. C., Dollete, U. G. M., Feliciano, R. J., & Garcia, N. K. A. (2019). Foodborne disease outbreaks in the Philippines (2005–2018). *Philippine Journal of Science, 148*(2), 317–336. https://philjournalsci.dost.gov.ph/foodborne-disease-outbreaks-in-the-philippines-2005-2018/

- Chen, W.-A., Chiu, C. P., Cheng, W.-C., Hsu, C.-K., & Kuo, M.-I. (2013). Total polar compounds and acid values of repeatedly used frying oils measured by standard and rapid methods. *Journal of Food and Drug Analysis, 21*(1), 58–65. https://doi.org/10.6227/jfda.2013210107

- Choe, E., & Min, D. B. (2007). Chemistry of deep-fat frying oils. *Journal of Food Science, 72*(5), R77–R86. https://doi.org/10.1111/j.1750-3841.2007.00352.x

- Codex Alimentarius Commission. (2024). *Standard for named vegetable oils (CXS 210-1999; amended 2024).* https://www.fao.org/fao-who-codexalimentarius/codex-texts/all-standards/en/

- Dedal, A. D., Nanual, B. J., Miranda, G. P., Placencia, A. A., Repe, J. S. A., & Quiroga, Q. M. (2026). Bacterial contamination of Salmonella spp. and Escherichia coli (Migula, 1895) in fresh chicken meat and chicken-based street food sold in the City of Mati. *The Palawan Scientist, 18*(1), 142–150. https://doi.org/10.69721/TPS.J.2026.18.1.15

- Deutsche Gesellschaft für Fettwissenschaft. (n.d.). *Recommendations for used frying fats.* https://dgfett.de/publikationen/downloads/

- Fatemi, S. H., & Hammond, E. G. (1980). Analysis of oleate, linoleate and linolenate hydroperoxides in oxidized ester mixtures. *Lipids, 15*(5), 379–385. https://doi.org/10.1007/BF02533555

- Food Safety and Standards Authority of India. (2018). *Handling and disposal of used cooking oil* (Guidance Note No. 06/2018). https://www.fssai.gov.in/upload/uploadfiles/files/Guidance_Note_Used_Oil_12_11_2018.pdf

- Li, Y. (2020). *Frying oil data* (Version 1) [Data set]. Mendeley Data. https://doi.org/10.17632/4k7b395yxx.1

- Ministry of Public Health, Thailand. (2004). *Notification of the Ministry of Public Health (No. 283) B.E. 2547 (2004): Stipulation on the amount of polar compounds in oil used for frying or cooking food for sale.* https://en.fda.moph.go.th/cat2-health-products/nmp-74

- Ramirez, M. A. J. R., Mesias, I. C. P., & Ramirez, L. V. (2024). Quantitative microbial risk assessment and multi-criteria decision analysis of street-vended pork barbeque contaminated with Escherichia coli. *Journal of Science, Engineering and Technology, 12*(1), 44–59. https://doi.org/10.61569/n2rq1j33

- Testo SE & Co. KGaA. (n.d.). *Frying oil measurement technology for optimum frying oil quality.* https://www.testo.com/en-PH/products/frying-oil-quality

- World Health Organization. (2026, June 4). *Food safety.* https://www.who.int/news-room/fact-sheets/detail/food-safety

- World Health Organization. (n.d.). *Foodborne deaths (mean, 95% uncertainty interval)* [Indicator metadata]. Global Health Observatory. Retrieved October 24, 2026, from https://www.who.int/data/gho/data/indicators/indicator-details/GHO/foodborne-deaths--2010-(mean--95--uncertainty-interval)

- Yongyod, R., & Kerdsin, A. (2025). Modified test kit for detecting polar compounds and evaluating their distribution in reused frying oil. *Foods, 14*(9), Article 1572. https://doi.org/10.3390/foods14091572
