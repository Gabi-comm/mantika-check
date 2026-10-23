export function PageIntro({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead: string; children?: React.ReactNode }) {
  return (
    <section className="dot-grid border-b border-line">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-4 pt-14 pb-14 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:pt-20">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 max-w-2xl text-[2.3rem] leading-[1.06] font-extrabold tracking-[-0.03em] text-ink sm:text-[3rem]">{title}</h1>
        </div>
        <div>
          <p className="max-w-lg text-[1.06rem] text-ink/75">{lead}</p>
          {children}
        </div>
      </div>
    </section>
  );
}
