import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import styles from './register.module.css';
import PassCards from './PassCards';
import {
  ATTENDEE_URL,
  BASE,
  CALL_DEADLINE,
  applyCards,
  callCards,
  calls,
  challenge,
  type Card,
} from './data';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'Register for Afriqa Creative Showcase 2026',
  description:
    'Free to attend. Get your pass, book a stand, showcase your fashion or art, or apply to pitch at Afriqa Creative Showcase, 4 and 5 December 2026, Abuja.',
};

function InfoCard({ c }: { c: Card }) {
  const status = c.full ? 'Registration full' : c.spacesLeft !== undefined ? `${c.spacesLeft} spaces left` : c.status;
  const closed = c.full || !c.href;
  return (
    <div className={styles.info}>
      {(c.price || status) && (
        <div className={styles.infoTop}>
          {c.price && <span className={c.price === 'Free' ? styles.tagFree : styles.tagPaid}>{c.price}</span>}
          {status && <span className={`${styles.status} ${c.full ? styles.statusFull : ''}`}>{status}</span>}
        </div>
      )}
      <h3>{c.name}</h3>
      <p>{c.text}</p>
      {c.phone ? (
        <p className={styles.callLine}>
          Call now:{' '}
          <a className={styles.phone} href={`tel:${c.phoneHref}`}>
            {c.phone}
          </a>
        </p>
      ) : closed ? (
        <span className={`${styles.btn} ${styles.btnDark} ${styles.disabled}`} aria-disabled="true">
          {c.full ? 'Registration full' : c.cta}
        </span>
      ) : (
        <a className={`${styles.btn} ${styles.btnDark}`} href={c.href} target="_blank" rel="noopener noreferrer">
          {c.cta}
        </a>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className={`${styles.page} ${montserrat.className}`}>
      <header className={styles.hero}>
        <div className={styles.wrap}>
          <h1>Register for Afriqa Creative Showcase 2026</h1>
          <p className={styles.lead}>
            Two days of fashion, film, music, art, a creative market, industry masterclasses and a Pitch and Deal Room.
          </p>
          <div className={styles.facts}>
            <span>4 and 5 December 2026</span>
            <span>Old Parade Ground, Abuja</span>
            <span className={styles.free}>Free to attend</span>
          </div>
          <div className={styles.heroCtas}>
            <a className={`${styles.btn} ${styles.btnLg}`} href={ATTENDEE_URL} target="_blank" rel="noopener noreferrer">
              Get free pass
            </a>
            <a className={`${styles.btn} ${styles.btnLg} ${styles.btnLine}`} href="#take-part">
              Book a stand
            </a>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.wrap}>
          <section id="passes">
            <h2>Choose your pass</h2>
            <p className={styles.sub}>
              Attending is free. VIP is the upgrade, and the Pitch and Deal Room is paid separately. Masterclasses on both days are included in both passes.
            </p>
            <PassCards />
          </section>

          <section id="take-part">
            <h2>Take part</h2>
            <p className={styles.sub}>For vendors, exhibitors, designers, investors and the press.</p>
            <h3 className={styles.groupTitle}>Call to book. No online form.</h3>
            <div className={styles.grid2}>
              {callCards.map((c) => (
                <InfoCard key={c.name} c={c} />
              ))}
            </div>
            <h3 className={styles.groupTitle}>By application</h3>
            <div className={styles.grid2}>
              {applyCards.map((c) => (
                <InfoCard key={c.name} c={c} />
              ))}
            </div>
          </section>

          <section id="challenge">
            <div className={styles.challenge}>
              <span className={styles.tagPaid}>For students</span>
              <h2>{challenge.name}</h2>
              <p className={styles.challengeText}>{challenge.text}</p>
              <ul className={styles.chips}>
                {challenge.categories.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <div className={styles.prizes}>
                {challenge.prizes.map((p, i) => (
                  <div key={p.place} className={`${styles.prize} ${i === 0 ? styles.prizeFirst : ''}`}>
                    <span>{p.place}</span>
                    <strong>{p.amount}</strong>
                  </div>
                ))}
              </div>
              <div className={styles.challengeFoot}>
                {challenge.href ? (
                  <a className={`${styles.btn} ${styles.btnLg}`} href={challenge.href} target="_blank" rel="noopener noreferrer">
                    Enter the challenge
                  </a>
                ) : (
                  <span className={`${styles.btn} ${styles.btnLg} ${styles.disabled}`} aria-disabled="true">
                    Entry opening soon
                  </span>
                )}
                {challenge.deadline && <span>Deadline: {challenge.deadline}</span>}
              </div>
            </div>
          </section>

          <section id="call">
            <h2>
              Call for Creatives <span className={styles.deadline}>Deadline: {CALL_DEADLINE}</span>
            </h2>
            <p className={styles.sub}>
              Afriqa Creative Showcase invites Nigerian and African creatives to present their work, connect with industry professionals and explore new opportunities.
            </p>
            <div className={styles.grid4}>
              {calls.map((c) => (
                <InfoCard key={c.name} c={c} />
              ))}
            </div>
            <p className={styles.note}>
              Already registered?{' '}
              <a href={`${BASE}/lookup`} target="_blank" rel="noopener noreferrer">
                Check your status
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
