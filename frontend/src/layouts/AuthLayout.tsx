import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { SkipLink } from '../components/SkipLink';
import styles from './AuthLayout.module.css';

/**
 * Layout compartido por todas las rutas protegidas.
 *
 * WCAG 2.2 AA:
 * - 2.4.1 Bypass Blocks: <SkipLink> como primer elemento del DOM
 * - 1.3.6 Identify Purpose: <main id="main-content"> es el landmark destino del skip-link
 */
export default function AuthLayout() {
  return (
    <div className={styles.layout}>
      {/* WCAG 2.4.1 — Skip link: primer elemento, visible solo en foco */}
      <SkipLink />
      <Navbar />
      {/*
        id="main-content" es el destino del skip-link.
        tabIndex={-1} permite que el skip-link mueva el foco aquí
        sin añadir este elemento al orden de tabulación natural.
      */}
      <main
        id="main-content"
        className={styles.content}
        tabIndex={-1}
      >
        <Outlet />
      </main>
    </div>
  );
}
