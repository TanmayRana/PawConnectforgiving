"use client";

import * as React from "react";
import styles from "./pet-loading-screen.module.css";

export type PetLoadingScreenProps = {
  message?: string;
  fullScreen?: boolean;
  className?: string;
};

export default function PetLoadingScreen({
  message = "Fetching the best care for your furry friends...",
  fullScreen = true,
  className = "",
}: PetLoadingScreenProps) {
  return (
    <div
      className={`${styles.root} ${
        fullScreen ? styles.fullScreen : styles.inline
      } ${styles.fadeIn} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.content}>
        <div className={styles.scene} aria-hidden="true">
          <span className={`${styles.paw} ${styles.pawOne}`}>🐾</span>
          <span className={`${styles.paw} ${styles.pawTwo}`}>🐾</span>
          <span className={`${styles.paw} ${styles.pawThree}`}>🐾</span>

          <div className={`${styles.animal} ${styles.dog}`}>🐶</div>
          <div className={`${styles.animal} ${styles.cat}`}>🐱</div>
          <div className={`${styles.animal} ${styles.rabbit}`}>🐰</div>

          <div className={styles.ground} />
        </div>

        <div className={styles.brand}>
          <span className={styles.brandPrimary}>Paw</span>
          <strong className={styles.brandSecondary}>Connect</strong>
          <span className={styles.brandPaw}>🐾</span>
        </div>

        <p className={styles.message}>{message}</p>

        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressBar} />
        </div>

        <span className={styles.srOnly}>Loading, please wait</span>
      </div>
    </div>
  );
}

export { PetLoadingScreen };
