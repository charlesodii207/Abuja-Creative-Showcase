import styles from './register.module.css';
import { tiers, vipNote, pitchStrip } from './data';

/** General and VIP cards plus the Pitch and Deal Room strip, all rendered from `data.ts`. */
export default function PassCards() {
  return (
    <>
      <div className={styles.passes}>
        {tiers.map((t) => (
          <div key={t.id} className={`${styles.pass} ${t.featured ? styles.vip : ''}`}>
            <div className={styles.passTop}>
              <h3>{t.name}</h3>
              <span className={styles.passNote}>{t.note}</span>
            </div>
            <div className={styles.passPrice}>{t.price}</div>
            <p className={styles.priceNote}>{t.priceNote}</p>
            {t.listLabel && <p className={styles.listLabel}>{t.listLabel}</p>}
            <ul className={styles.list}>
              {t.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {t.featured && <p className={styles.vipNote}>{vipNote}</p>}
            <a
              className={`${styles.btn} ${styles.btnBlock} ${t.featured ? '' : styles.btnDark}`}
              href={t.href}
            >
              {t.cta}
            </a>
          </div>
        ))}
      </div>

      <div className={styles.pitch}>
        <div className={styles.pitchText}>
          <h3>
            {pitchStrip.name} <span className={styles.tagPaid}>{pitchStrip.tag}</span>
          </h3>
          <p>{pitchStrip.text}</p>
        </div>
        <div className={styles.pitchAction}>
          <strong>{pitchStrip.price}</strong>
          <a className={`${styles.btn} ${styles.btnOutline}`} href={pitchStrip.href}>
            {pitchStrip.cta}
          </a>
        </div>
      </div>
    </>
  );
}
