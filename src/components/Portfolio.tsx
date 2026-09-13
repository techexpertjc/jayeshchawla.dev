"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./Portfolio.module.css";
import {
  workItems,
  techMarquee,
  experienceItems,
  stackGroups,
  postcards,
  morphPanels,
  type Postcard,
} from "./portfolio-data";

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const DESK_WIDTH = 1160;
const DESK_HEIGHT = 720;
const DESK_STACK_THRESHOLD = 0.85;

export default function Portfolio() {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const heroMediaRef = useRef<HTMLDivElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const morphSectionRef = useRef<HTMLDivElement>(null);
  const morphIndexRef = useRef<HTMLDivElement>(null);
  const morphPanelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const workCardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const revealNodes = useRef<HTMLElement[]>([]);
  const revealedSet = useRef<Set<HTMLElement>>(new Set());

  const deskOuterRef = useRef<HTMLDivElement>(null);
  const postcardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const offsetsRef = useRef(postcards.map(() => ({ x: 0, y: 0 })));
  const scaleRef = useRef(1);
  const stackedRef = useRef(false);

  const [heroLite, setHeroLite] = useState(false);
  const [deskLayout, setDeskLayout] = useState<"scaled" | "stacked">("scaled");
  const [deskScale, setDeskScale] = useState(1);

  const registerReveal = (el: HTMLElement | null) => {
    if (el && !revealNodes.current.includes(el)) revealNodes.current.push(el);
  };

  useEffect(() => {
    const metered = !!(
      "connection" in navigator &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((navigator as any).connection?.saveData ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        /2g/.test((navigator as any).connection?.effectiveType || ""))
    );
    const mq = window.matchMedia("(max-width: 759px)");
    const sync = () => setHeroLite(metered || mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (revealNodes.current.length === 0) return;
    let counter = 0;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          if (revealedSet.current.has(el)) return;
          revealedSet.current.add(el);
          el.style.transitionDelay = `${Math.min(counter++, 4) * 70}ms`;
          el.classList.add(styles.revealed);
          io.unobserve(el);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    revealNodes.current.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const tick = () => {
      raf = 0;
      const y = window.scrollY || 0;
      const vh = window.innerHeight || 1;
      const doc = document.documentElement.scrollHeight - vh;

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${Math.min(100, Math.max(0, (y / Math.max(1, doc)) * 100))}%`;
      }

      if (!reduced) {
        const hp = Math.min(1, y / vh);
        if (heroMediaRef.current) {
          heroMediaRef.current.style.transform = `translate3d(0,${(hp * 16).toFixed(2)}vh,0) scale(${(1 + hp * 0.08).toFixed(3)})`;
        }
        if (heroCopyRef.current) {
          heroCopyRef.current.style.transform = `translate3d(0,${(hp * -7).toFixed(2)}vh,0)`;
          heroCopyRef.current.style.opacity = String(Math.max(0, 1 - hp * 1.25));
        }
        workCardRefs.current.forEach((card, i) => {
          if (!card || !revealedSet.current.has(card)) return;
          const r = card.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          const p = (r.top + r.height / 2 - vh / 2) / vh;
          card.style.transform = `translate3d(0,${(p * (i % 2 ? -14 : 14)).toFixed(2)}px,0)`;
        });
      }

      const morphSection = morphSectionRef.current;
      const morphs = morphPanelRefs.current;
      if (morphSection && morphs.length) {
        const r = morphSection.getBoundingClientRect();
        const total = r.height - vh;
        const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
        const n = morphs.length;
        const active = Math.min(n - 1, Math.floor(p * n * 0.999));
        morphs.forEach((el, i) => {
          if (!el) return;
          const local = p * n - i;
          const d = Math.abs(local - 0.5);
          const on = i === active;
          if (reduced) {
            el.style.opacity = on ? "1" : "0";
            el.style.transform = "none";
            return;
          }
          const o = on ? Math.max(0, 1 - Math.max(0, d - 0.32) * 3.2) : 0;
          el.style.opacity = o.toFixed(3);
          el.style.transform = `translate3d(0,${((local - 0.5) * -46).toFixed(1)}px,0)`;
          el.style.filter = o > 0.85 ? "none" : `blur(${((1 - o) * 7).toFixed(1)}px)`;
          el.style.pointerEvents = on ? "auto" : "none";
        });
        if (morphIndexRef.current) {
          morphIndexRef.current.textContent = `0${active + 1} / 0${n}`;
        }
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    tick();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const v = heroVideoRef.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.loop = true;

    const play = () => {
      if (document.hidden) return;
      const p = v.play();
      if (p && p.catch) {
        p.catch(() => {
          const retry = () => {
            v.muted = true;
            v.play().catch(() => {});
          };
          (["pointerdown", "keydown", "scroll", "touchstart"] as const).forEach((e) =>
            window.addEventListener(e, retry, { once: true, passive: true })
          );
        });
      }
    };
    play();

    let vio: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      vio = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) play();
          else v.pause();
        },
        { threshold: 0.01 }
      );
      vio.observe(v);
    }
    const onVis = () => {
      if (document.hidden) v.pause();
      else if (v.getBoundingClientRect().bottom > 0) play();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      vio?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [heroLite]);

  useEffect(() => {
    const a = avatarVideoRef.current;
    if (!a) return;
    a.muted = true;
    a.defaultMuted = true;
    a.loop = true;
    a.playsInline = true;
    const go = () => {
      a.classList.add(styles.ready);
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    };
    if (a.readyState >= 2) go();
    else a.addEventListener("loadeddata", go, { once: true });

    const onVis = () => {
      if (document.hidden) a.pause();
      else a.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const outer = deskOuterRef.current;
    if (!outer) return;

    const fit = () => {
      const s = outer.clientWidth / DESK_WIDTH;
      const stack = s < DESK_STACK_THRESHOLD;
      stackedRef.current = stack;
      scaleRef.current = stack ? 1 : Math.min(1, s);
      setDeskLayout(stack ? "stacked" : "scaled");
      setDeskScale(scaleRef.current);
    };
    fit();
    window.addEventListener("resize", fit, { passive: true });
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    let z = 10;
    const cleanups: (() => void)[] = [];

    postcardRefs.current.forEach((card, i) => {
      if (!card) return;
      const pc = postcards[i];

      const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0 || stackedRef.current) return;
        const sx = e.clientX;
        const sy = e.clientY;
        const ox = offsetsRef.current[i].x;
        const oy = offsetsRef.current[i].y;
        let dragging = false;

        const place = (lift: boolean) => {
          if (stackedRef.current) return;
          const { x, y } = offsetsRef.current[i];
          card.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${
            lift ? pc.rotate * 0.35 : pc.rotate
          }deg)${lift ? " scale(1.03)" : ""}`;
        };

        const move = (ev: PointerEvent) => {
          const s = scaleRef.current || 1;
          const dx = (ev.clientX - sx) / s;
          const dy = (ev.clientY - sy) / s;
          if (!dragging && Math.abs(dx) + Math.abs(dy) < 4) return;
          if (!dragging) {
            dragging = true;
            card.style.zIndex = String(++z);
            card.style.cursor = "grabbing";
            card.classList.add(styles.dragging);
            card.setPointerCapture(ev.pointerId);
          }
          ev.preventDefault();
          offsetsRef.current[i] = { x: ox + dx, y: oy + dy };
          place(true);
        };

        const up = (ev: PointerEvent) => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          if (!dragging) return;
          card.style.cursor = "grab";
          card.classList.remove(styles.dragging);
          place(false);
          if (card.hasPointerCapture(ev.pointerId)) card.releasePointerCapture(ev.pointerId);
        };

        window.addEventListener("pointermove", move, { passive: false });
        window.addEventListener("pointerup", up);
      };

      card.addEventListener("pointerdown", onPointerDown);
      cleanups.push(() => card.removeEventListener("pointerdown", onPointerDown));
    });

    return () => cleanups.forEach((fn) => fn());
  }, [deskLayout]);

  const cardTransform = (pc: Postcard) => `rotate(${pc.rotate}deg)`;

  return (
    <>
      <div className={styles.progressTrack}>
        <div ref={progressBarRef} className={styles.progressBar} />
      </div>

      <nav className={styles.nav}>
        <a href="#top" className={styles.navBrand}>
          <span className={styles.avatarSlot}>
            <video
              ref={avatarVideoRef}
              src="/media/avatar-d.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className={styles.avatarVideo}
            />
          </span>
          Jayesh&nbsp;Chawla
        </a>
        <div className={styles.navRight}>
          <span className={styles.navLinks}>
            <a href="#work">Work</a>
            <a href="#experience">Experience</a>
            <a href="#stack">Stack</a>
            <a href="#about">About</a>
          </span>
          <a href="#contact" className={styles.navCta}>
            Get in touch
          </a>
        </div>
      </nav>

      <section id="top" className={styles.hero}>
        <div ref={heroMediaRef} className={styles.heroMedia}>
          <div className={styles.heroMediaBase} />
          <div className={styles.heroWashA} />
          <div className={styles.heroWashB} />
          {!heroLite && (
            <video
              ref={heroVideoRef}
              src="/media/hero-glass.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className={styles.heroVideo}
              onLoadedData={(e) => e.currentTarget.classList.add(styles.ready)}
            />
          )}
        </div>

        <div className={styles.heroScrim} />
        <div className={styles.heroGrain} />

        <div ref={heroCopyRef} className={styles.heroCopy}>
          <div className={styles.heroEyebrow}>
            <span className={styles.heroDot} />
            Senior Frontend Engineer · React &amp; Next.js · 7+ years
          </div>
          <h1 className={styles.heroTitle}>Frontends built pixel-perfect, then owned in production.</h1>
          <p className={styles.heroSubtitle}>
            I&rsquo;ve rebuilt a product&rsquo;s entire frontend twice through two design overhauls, shipped one
            codebase to web, iOS and Android, and taken an application through SOC 2. React, Next.js and TypeScript
            are where I&rsquo;m fastest.
          </p>
          <div className={styles.heroActions}>
            <a href="#work" className={styles.btnPrimary}>
              Selected work <span>↓</span>
            </a>
            <a href="/resume/Jayesh-Chawla-Frontend-Engineer.pdf" download className={styles.btnSecondary}>
              Download résumé <span>PDF</span>
            </a>
          </div>
        </div>

        <div className={styles.scrollCue}>
          <span className={styles.scrollCueLabel}>Scroll</span>
          <span className={styles.scrollCueTrack}>
            <span className={styles.scrollCueFill} />
          </span>
        </div>
      </section>

      <section ref={morphSectionRef} className={styles.morphSection}>
        <div className={styles.morphSticky}>
          <div className={styles.morphInner}>
            <div ref={morphIndexRef} className={styles.morphIndex}>
              01 / 03
            </div>
            <div className={styles.morphStage}>
              {morphPanels.map((panel, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    morphPanelRefs.current[i] = el;
                  }}
                  className={styles.morphPanel}
                  style={i === 0 ? { opacity: 1 } : undefined}
                >
                  <div className={styles.morphHeadline}>
                    {panel.headline[0]}
                    <br />
                    <em>{panel.headline[1]}</em>
                  </div>
                  <p className={styles.morphBody}>{panel.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="work" className={styles.section}>
        <div className={styles.wrap}>
          <div ref={registerReveal} className={cx(styles.reveal, styles.sectionHead)}>
            <div>
              <div className={styles.eyebrow}>01 — Selected work</div>
              <h2 className={styles.sectionTitle}>Products I&rsquo;ve shipped and the part I owned.</h2>
            </div>
            <p className={styles.sectionLede}>
              Five projects across product teams and freelance work. Live links where the work is public.
            </p>
          </div>

          <div className={styles.workGrid}>
            {workItems.map((item, i) => (
              <a
                key={item.href}
                ref={(el) => {
                  workCardRefs.current[i] = el;
                  registerReveal(el);
                }}
                href={item.href}
                target="_blank"
                rel="noopener"
                className={cx(styles.reveal, styles.workCard, item.offset && styles.offset)}
              >
                <div className={styles.workShot}>
                  {item.shot ? (
                    <Image src={item.shot} alt={`${item.title} screenshot`} fill sizes="(max-width: 779px) 100vw, 50vw" className={styles.workShotImg} />
                  ) : (
                    <span className={styles.workShotLabel}>{item.shotLabel}</span>
                  )}
                </div>
                <div className={styles.workMeta}>
                  <h3 className={styles.workTitle}>{item.title}</h3>
                  <span className={cx(styles.workPeriod, item.current && styles.current)}>{item.period}</span>
                </div>
                <p className={styles.workDesc}>{item.desc}</p>
                <div className={styles.workTags}>
                  {item.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.marqueeSection}>
        <div className={styles.marqueeTrack}>
          {[0, 1].map((g) => (
            <div key={g} className={styles.marqueeGroup}>
              {techMarquee.map((tech) => (
                <span key={tech} style={{ display: "contents" }}>
                  <span>{tech}</span>
                  <span className={styles.marqueeDot}>·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section id="experience" className={styles.section}>
        <div className={styles.experienceGrid}>
          <div ref={registerReveal} className={cx(styles.reveal, styles.experienceIntro)}>
            <div className={styles.eyebrow}>02 — Experience</div>
            <h2 className={styles.sectionTitle}>Seven years, four teams, one direction.</h2>
            <p>
              Started in hybrid mobile, went deep on React, and kept taking on whatever sat next to the frontend
              until it included the infrastructure.
            </p>
          </div>

          <div className={styles.timeline}>
            {experienceItems.map((item, i) => (
              <div
                key={i}
                ref={registerReveal}
                className={cx(styles.reveal, styles.timelineItem, item.dashed && styles.dashed)}
              >
                <span className={cx(styles.timelineDot, item.active && styles.active)} />
                <div className={cx(styles.timelineDate, item.active && styles.active)}>{item.date}</div>
                <h3>{item.title}</h3>
                <div className={styles.timelineCompany}>{item.company}</div>
                {item.bullets.length > 0 && (
                  <ul className={styles.timelineList}>
                    {item.bullets.map((b, bi) => (
                      <li key={bi}>{b}</li>
                    ))}
                  </ul>
                )}
                {item.products && (
                  <div className={styles.timelineProducts}>
                    <span className={styles.timelineProductsLabel}>Products</span>
                    {item.products.map((p) => (
                      <a
                        key={p.href}
                        href={p.href}
                        target="_blank"
                        rel="noopener"
                        className={styles.timelineChip}
                      >
                        {p.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="stack" className={styles.section}>
        <div className={styles.wrap}>
          <div ref={registerReveal} className={cx(styles.reveal)} style={{ marginBottom: "clamp(40px,7vh,72px)" }}>
            <div className={styles.eyebrow}>03 — Stack</div>
            <h2 className={styles.sectionTitle}>What I reach for, and how deep it goes.</h2>
          </div>
          <div className={styles.stackGrid}>
            {stackGroups.map((group) => (
              <div key={group.title} ref={registerReveal} className={cx(styles.reveal, styles.stackCard)}>
                <div className={cx(styles.stackEyebrow, group.accent && styles.accent)}>{group.eyebrow}</div>
                <h3>{group.title}</h3>
                <div className={styles.stackList}>
                  {group.items.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className={styles.section}>
        <div ref={registerReveal} className={cx(styles.reveal, styles.aboutGrid)}>
          <div className={styles.aboutHeading}>
            <div className={styles.eyebrow}>04 — About</div>
            <h2 className={styles.sectionTitle}>I like the parts of frontend that touch something real.</h2>
          </div>
          <div className={styles.aboutBody}>
            <p>
              I&rsquo;m a frontend engineer based in India, working remotely with distributed teams. Most of my
              seven years has gone into workflow-heavy products: a geofencing system that calculated real payouts,
              an AI product whose frontend I rebuilt from scratch twice, an insurance app shipped to three
              platforms from one codebase.
            </p>
            <p>
              What I enjoy is the work that sits just past the component — API contracts, production behaviour,
              the edge case nobody specced. That&rsquo;s also how I ended up taking an application through SOC 2
              and leading a cloud migration, and it&rsquo;s changed how I think about frontend architecture since.
            </p>
            <p>I&rsquo;m comfortable working async, reviewing other people&rsquo;s code, and onboarding people onto mine.</p>
          </div>
        </div>
      </section>

      <section id="contact" className={styles.contactSection}>
        <div className={styles.contactGlow} />
        <div ref={registerReveal} className={cx(styles.reveal, styles.contactInner)}>
          <div className={styles.eyebrow}>05 — Contact</div>
          <h2 className={styles.contactTitle}>Looking for someone to own your frontend?</h2>
          <a href="mailto:hi@jayeshchawla.dev" className={styles.contactEmail}>
            hi@jayeshchawla.dev
          </a>
          <div className={styles.contactLinks}>
            <a href="https://github.com/techexpertjc" target="_blank" rel="noopener" className={styles.contactLink}>
              GitHub ↗
            </a>
            <a
              href="https://linkedin.com/in/jayeshchawlajc"
              target="_blank"
              rel="noopener"
              className={styles.contactLink}
            >
              LinkedIn ↗
            </a>
            <a
              href="/resume/Jayesh-Chawla-Frontend-Engineer.pdf"
              download
              className={cx(styles.contactLink, styles.resume)}
            >
              Résumé PDF ↓
            </a>
          </div>
        </div>
      </section>

      <section id="side-quests" className={styles.sideQuests}>
        <div className={styles.wrap}>
          <div ref={registerReveal} className={cx(styles.reveal, styles.sideQuestsHead)}>
            <div>
              <div className={styles.eyebrow}>06 — Side quests</div>
              <h2 className={styles.sectionTitle}>Side quests</h2>
            </div>
            <p className={styles.sideQuestsLede}>Drag the photos around. Nothing here is load-bearing.</p>
          </div>

          <div ref={deskOuterRef} className={styles.deskOuter} style={{ height: deskLayout === "scaled" ? DESK_HEIGHT * deskScale : "auto" }}>
            {deskLayout === "scaled" ? (
              <div
                className={styles.desk}
                style={{ transform: `scale(${deskScale})`, width: DESK_WIDTH, height: DESK_HEIGHT }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/media/map-world.svg" alt="" draggable={false} className={styles.deskMap} />

                {postcards.map((pc, i) => (
                  <div
                    key={pc.id}
                    ref={(el) => {
                      postcardRefs.current[i] = el;
                    }}
                    className={styles.postcard}
                    style={{
                      left: pc.left,
                      top: pc.top,
                      width: pc.width,
                      transform: cardTransform(pc),
                    }}
                  >
                    <div className={styles.postcardPhoto} style={{ height: pc.photoHeight }}>
                      {pc.photo ? (
                        <Image src={pc.photo} alt={pc.place} fill sizes="340px" className={styles.postcardImg} draggable={false} />
                      ) : (
                        "photo pending"
                      )}
                    </div>
                    <div className={styles.postcardCaption}>
                      <span>{pc.place}</span>
                      <span>{pc.year}</span>
                    </div>
                  </div>
                ))}

                <div className={styles.scrawl}>took the beaten path, regretted nothing</div>
              </div>
            ) : (
              <div
                className={styles.desk}
                style={{ width: "100%", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}
              >
                {postcards.map((pc, i) => (
                  <div
                    key={pc.id}
                    className={styles.postcard}
                    style={{
                      position: "relative",
                      width: "min(340px,100%)",
                      cursor: "default",
                      transform: `rotate(${i % 2 ? 1.6 : -1.6}deg)`,
                    }}
                  >
                    <div className={styles.postcardPhoto} style={{ height: pc.photoHeight }}>
                      {pc.photo ? (
                        <Image src={pc.photo} alt={pc.place} fill sizes="340px" className={styles.postcardImg} draggable={false} />
                      ) : (
                        "photo pending"
                      )}
                    </div>
                    <div className={styles.postcardCaption}>
                      <span>{pc.place}</span>
                      <span>{pc.year}</span>
                    </div>
                  </div>
                ))}
                <div className={styles.scrawl} style={{ position: "relative", left: "auto", top: "auto", marginTop: 6, fontSize: 24, textAlign: "center" }}>
                  took the beaten path, regretted nothing
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Jayesh Chawla — Senior Frontend Engineer</span>
        <span>India · Remote · Open to relocation</span>
      </footer>
    </>
  );
}
