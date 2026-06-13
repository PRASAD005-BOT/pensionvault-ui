import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context.jsx';
import './Landing.css';

/* ── SVG icon helpers ── */
const Ic = {
  shield:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  users:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  rupee:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><line x1="6" y1="5" x2="17" y2="5"/></svg>,
  book:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  file:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  trending: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  bell:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  bar:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  check:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  sun:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  lock:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  zap:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  crown:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20M5 20l2-10 5 5 5-8 5 8-2 5"/></svg>,
  scale:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M3 9l4-4 5 5"/><path d="M3 15l9-9 9 9"/><line x1="3" y1="21" x2="21" y2="21"/></svg>,
};

const MODULES = [
  { icon: Ic.shield,   name: 'Identity & Access',    desc: 'RBAC with 6 roles, JWT auth, full audit trail',          color: 'accent'  },
  { icon: Ic.users,    name: 'Member Enrolment',     desc: 'Registration, fund accounts, scheme linkage',            color: 'purple'  },
  { icon: Ic.rupee,    name: 'Contributions',        desc: 'Remittances, reconciliation, defaults tracking',         color: 'success' },
  { icon: Ic.book,     name: 'Ledger & Interest',    desc: 'Real-time ledger, annual interest crediting',            color: 'warning' },
  { icon: Ic.file,     name: 'Benefit Claims',       desc: 'Submit → Review → Approve → Disburse',                  color: 'danger'  },
  { icon: Ic.trending, name: 'Investment & Corpus',  desc: 'Portfolio allocation, corpus records, yield tracking',   color: 'accent'  },
  { icon: Ic.building, name: 'Annuity Plans',        desc: 'Pension plans, monthly disbursements, TDS',              color: 'purple'  },
  { icon: Ic.bell,     name: 'Notifications',        desc: 'Real-time in-app alerts for every system event',         color: 'success' },
];

const FEATURES = [
  { icon: Ic.lock,     accent: 'accent',  title: 'Role-Based Access Control',    desc: '6 distinct roles — Admin, FundAdmin, Member, Employer, InvestmentOfficer, Compliance — each with precisely scoped API and UI access.' },
  { icon: Ic.book,     accent: 'success', title: 'Real-Time Member Ledger',      desc: 'Every transaction instantly posted to the member ledger. Members see only their data; Admins see all entries across the fund.' },
  { icon: Ic.zap,      accent: 'warning', title: 'Claim Workflow Engine',        desc: '4-step lifecycle: Submitted → UnderReview → Approved → Disbursed. Supports 7 claim types including Retirement and Housing.' },
  { icon: Ic.rupee,    accent: 'danger',  title: 'Annuity & Pension Payouts',    desc: 'Create LifeAnnuity, JointAnnuity, TemporaryAnnuity plans. Monthly disbursements with TDS and complete payment history.' },
  { icon: Ic.trending, accent: 'purple',  title: 'Investment Portfolio',         desc: 'Track allocation across G-Sec, Corporate Bonds, Equity, Fixed Deposit and Money Market. Live allocation view.' },
  { icon: Ic.bar,      accent: 'accent',  title: 'Statutory Compliance Reports', desc: 'Generate statutory returns by period, track contribution defaults, browse the full audit trail with date-range filters.' },
];

const ROLES = [
  { icon: Ic.crown,    accent: 'accent',   name: 'Admin',              sub: 'System Administrator',      perms: ['Full access — all 11 modules', 'Create schemes, employers, members', 'Reconcile remittances & credit interest', 'Manage claims, annuity and investments'] },
  { icon: Ic.building, accent: 'success',  name: 'Fund Admin',         sub: 'Operations Manager',        perms: ['Review, approve & disburse claims', 'Reconcile contribution remittances', 'Create and manage annuity plans', 'View reports and full audit trail'] },
  { icon: Ic.users,    accent: 'purple',   name: 'Member',             sub: 'Fund Beneficiary',          perms: ['View personal fund balance', 'Track contribution history', 'Browse personal ledger entries', 'Submit benefit claims online'] },
  { icon: Ic.building, accent: 'warning',  name: 'Employer',           sub: 'Contributing Organisation', perms: ['Enrol employees as members', 'Submit monthly PF remittances', 'View own employee roster', 'Track remittance history'] },
  { icon: Ic.trending, accent: 'danger',   name: 'Investment Officer', sub: 'Fund Manager',              perms: ['Manage investment portfolios', 'Track asset class allocation', 'Record and finalise corpus', 'Monitor yield and returns'] },
  { icon: Ic.scale,    accent: 'accent',   name: 'Compliance Officer', sub: 'Regulatory Oversight',      perms: ['Generate statutory returns', 'Monitor contribution defaults', 'Browse complete audit trail', 'View employer and corpus data'] },
];

const STEPS = [
  { n: '01', title: 'Create Scheme',         desc: 'Admin configures EPF, Gratuity or NPS scheme with contribution rates and annual interest.' },
  { n: '02', title: 'Enrol Members',         desc: 'Employers enrol employees. Fund accounts are auto-created and linked to the scheme.' },
  { n: '03', title: 'Process Contributions', desc: 'Employers submit monthly remittances. FundAdmin reconciles and posts to the ledger.' },
  { n: '04', title: 'Credit Interest',       desc: 'Annual interest calculated and credited to every member\'s fund account automatically.' },
  { n: '05', title: 'Process Claims',        desc: 'Members submit claims. FundAdmin reviews, approves and disburses with TDS calculation.' },
  { n: '06', title: 'Pay Pension',           desc: 'Retirees receive monthly annuity payments with TDS deduction and full payment history.' },
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.lp-reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('lp-visible'), i * 70);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useReveal();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="lp">

      {/* ── NAVBAR ── */}
      <nav className={'lp-nav' + (scrolled ? ' lp-nav--scrolled' : '')}>
        <div className="lp-nav__logo">
          <div className="lp-nav__icon">{Ic.shield}</div>
          <span className="lp-nav__name">Pension<span className="lp-accent">Vault</span></span>
        </div>

        <ul className="lp-nav__links">
          <li><a href="#features">Features</a></li>
          <li><a href="#modules">Modules</a></li>
          <li><a href="#workflow">How It Works</a></li>
          <li><a href="#roles">Roles</a></li>
        </ul>

        <div className="lp-nav__actions">
          <button className="lp-theme-toggle" onClick={toggle} title="Toggle theme" aria-label="Toggle theme">
            {theme === 'dark' ? Ic.sun : Ic.moon}
          </button>
          <button className="lp-btn lp-btn--ghost" onClick={() => navigate('/login')}>Sign In</button>
          <button className="lp-btn lp-btn--primary" onClick={() => navigate('/login')}>
            Get Started {Ic.arrow}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero__glow lp-hero__glow--left" />
        <div className="lp-hero__glow lp-hero__glow--right" />
        <div className="lp-hero__content">

          <h1 className="lp-hero__title lp-reveal">
            Pension &amp; Provident Fund<br />
            <span className="lp-accent">Administration Platform</span>
          </h1>
          <p className="lp-hero__sub lp-reveal">
            A complete enterprise platform for managing member enrolments, employer
            contributions, benefit claims, investment portfolios, and regulatory
            compliance — all in one unified system.
          </p>
          <div className="lp-hero__cta lp-reveal">
            <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={() => navigate('/login')}>
              Get Started {Ic.arrow}
            </button>
            <a className="lp-btn lp-btn--ghost lp-btn--lg" href="#features">Explore Features</a>
          </div>

        </div>
      </section>

      {/* ── MODULES ── */}
      <section className="lp-section lp-section--alt" id="modules">
        <div className="lp-section__head lp-center lp-reveal">
          <div className="lp-eyebrow">8 Core Modules</div>
          <h2 className="lp-section__title">Everything to run a pension fund</h2>
          <p className="lp-section__sub">From enrolment to regulatory reporting — every process covered in one platform.</p>
        </div>
        <div className="lp-modules-grid">
          {MODULES.map(m => (
            <div key={m.name} className="lp-module-card lp-reveal">
              <div className={'lp-module-card__icon lp-icon--' + m.color}>{m.icon}</div>
              <div className="lp-module-card__name">{m.name}</div>
              <div className="lp-module-card__desc">{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-section" id="features">
        <div className="lp-section__head lp-reveal">
          <div className="lp-eyebrow">Platform Features</div>
          <h2 className="lp-section__title">Built for enterprise-grade<br />fund administration</h2>
          <p className="lp-section__sub">Designed to address real challenges faced by pension administrators every day.</p>
        </div>
        <div className="lp-features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="lp-feature-card lp-reveal">
              <div className={'lp-feature-card__icon lp-icon--' + f.accent}>{f.icon}</div>
              <div className="lp-feature-card__title">{f.title}</div>
              <div className="lp-feature-card__desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section className="lp-section lp-section--alt" id="workflow">
        <div className="lp-section__head lp-center lp-reveal">
          <div className="lp-eyebrow">How It Works</div>
          <h2 className="lp-section__title">From enrolment to pension in 6 steps</h2>
          <p className="lp-section__sub">The complete PF lifecycle — automated, auditable and transparent at every stage.</p>
        </div>

        {/* Connector row */}
        <div className="lp-timeline lp-reveal">
          {STEPS.map((s, i) => (
            <div key={s.n} className="lp-timeline__step">
              {i > 0 && <div className="lp-timeline__line" />}
              <div className="lp-timeline__badge">{s.n}</div>
            </div>
          ))}
        </div>

        {/* Cards */}
        <div className="lp-wf-grid">
          {STEPS.map(s => (
            <div key={s.n} className="lp-wf-card lp-reveal">
              <div className="lp-wf-card__num">{s.n}</div>
              <div className="lp-wf-card__title">{s.title}</div>
              <div className="lp-wf-card__desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="lp-section" id="roles">
        <div className="lp-section__head lp-center lp-reveal">
          <div className="lp-eyebrow">6 Stakeholder Roles</div>
          <h2 className="lp-section__title">One platform, six roles, zero overlap</h2>
          <p className="lp-section__sub">Every stakeholder gets exactly the access they need — secured by JWT and RBAC.</p>
        </div>
        <div className="lp-roles-grid">
          {ROLES.map(r => (
            <div key={r.name} className="lp-role-card lp-reveal">
              <div className="lp-role-card__header">
                <div className={'lp-role-card__icon lp-icon--' + r.accent}>{r.icon}</div>
                <div>
                  <div className="lp-role-card__name">{r.name}</div>
                  <div className="lp-role-card__sub">{r.sub}</div>
                </div>
              </div>
              <ul className="lp-role-card__perms">
                {r.perms.map(p => (
                  <li key={p}>
                    <span className="lp-check">{Ic.check}</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-section lp-section--alt">
        <div className="lp-cta lp-reveal">
          <h2 className="lp-cta__title">
            Ready to modernise your<br />
            <span className="lp-accent">pension administration?</span>
          </h2>
          <p className="lp-cta__sub">All test accounts and data are pre-loaded. Login and explore every module instantly.</p>
          <div className="lp-cta__actions">
            <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={() => navigate('/login')}>
              Open PensionVault {Ic.arrow}
            </button>
            <a className="lp-btn lp-btn--outline lp-btn--lg" href="http://localhost:5000/swagger" target="_blank" rel="noreferrer">
              View API Docs
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer__top">
          <div className="lp-footer__brand">
            <div className="lp-nav__logo" style={{ marginBottom: 12 }}>
              <div className="lp-nav__icon">{Ic.shield}</div>
              <span className="lp-nav__name">Pension<span className="lp-accent">Vault</span></span>
            </div>
            <p>A complete pension and provident fund administration platform for fund managers, employers, and compliance teams.</p>
          </div>
          <div className="lp-footer__col">
            <h4>Platform</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#modules">Modules</a></li>
              <li><a href="#workflow">How It Works</a></li>
              <li><a href="#roles">Roles</a></li>
              <li><a href="http://localhost:5000/swagger" target="_blank" rel="noreferrer">API Docs</a></li>
            </ul>
          </div>
          <div className="lp-footer__col">
            <h4>Modules</h4>
            <ul>
              <li><a href="#modules">Member Enrolment</a></li>
              <li><a href="#modules">Contributions</a></li>
              <li><a href="#modules">Ledger &amp; Interest</a></li>
              <li><a href="#modules">Benefit Claims</a></li>
              <li><a href="#modules">Annuity Plans</a></li>
            </ul>
          </div>
          <div className="lp-footer__col">
            <h4>Scheme Types</h4>
            <ul>
              <li><a href="#modules">EPF</a></li>
              <li><a href="#modules">Gratuity Trust</a></li>
              <li><a href="#modules">Superannuation</a></li>
              <li><a href="#modules">NPS</a></li>
              <li><a href="#modules">PPF</a></li>
            </ul>
          </div>
        </div>
        <div className="lp-footer__bottom">
          <span>© 2026 PensionVault. All rights reserved.</span>
          <span>Built with ASP.NET Core 8 + React 18 · Phase 1</span>
        </div>
      </footer>

    </div>
  );
}
