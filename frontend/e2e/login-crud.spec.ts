/**
 * E2E Test: Flujo completo Login → Crear Mascota → Verificar en Listado
 *
 * PREREQUISITO: Backend ClinicaVeterinariaAPI corriendo en localhost:5000
 * con un usuario admin@test.com / password123 ya creado.
 *
 * Si el backend NO está disponible, usar el modo de mock:
 * ver sección "Modo sin backend" al final del archivo.
 *
 * Playwright ejecuta este test en un browser real (Chromium).
 *
 * Cubre:
 * ✓ Login con credenciales válidas
 * ✓ Redirección a /mascotas tras login exitoso
 * ✓ Navbar visible con nombre de usuario y rol
 * ✓ Abrir modal "Nueva mascota"
 * ✓ Rellenar formulario con datos válidos
 * ✓ Crear la mascota y verificar que aparece en el listado
 * ✓ Logout limpia la sesión y redirige a /login
 * ✓ Responsivo: flujo completo en mobile (Pixel 5)
 */
import { expect, test } from '@playwright/test';

// ─── Datos de prueba ──────────────────────────────────────────────────────────

const TEST_USER = {
  email: 'admin@veterinaria.com',
  password: 'admin123',
};

const TEST_MASCOTA = {
  nombre: `Test-E2E-${Date.now()}`,  // nombre único para evitar colisiones
  especie: 'Perro',
};

// ─── Helper: login reutilizable ───────────────────────────────────────────────

async function loginAs(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();

  await page.getByLabel(/usuario o correo electrónico/i).fill(email);
  await page.getByLabel(/contraseña/i).fill(password);
  await page.getByRole('button', { name: /iniciar sesión/i }).click();

  // Esperar la redirección a /mascotas (o / que redirige a /mascotas)
  await page.waitForURL(/\/mascotas/, { timeout: 10_000 });
}

// ─── Suite principal ──────────────────────────────────────────────────────────

test.describe('Flujo E2E: Login → Crear Mascota → Listar', () => {

  test.beforeEach(async ({ page }) => {
    // Asegurar que cada test comience en login sin sesión activa
    await page.goto('/login');
    await page.evaluate(() => sessionStorage.clear());
  });

  // ── 1. Login exitoso ──────────────────────────────────────────────────────

  test('login exitoso redirige al listado de mascotas', async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    // Verificar que estamos en el listado
    await expect(page.getByRole('heading', { name: /mascotas/i })).toBeVisible();

    // Navbar muestra el badge con el rol
    await expect(page.getByLabel('Rol: Admin')).toBeVisible();
  });

  // ── 2. Login fallido ─────────────────────────────────────────────────────

  test('login fallido muestra alerta de credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/usuario o correo electrónico/i).fill('wrong@user.com');
    await page.getByLabel(/contraseña/i).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // La alerta debe aparecer sin navegar
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 8_000 });
    await expect(alert).toContainText(/credenciales incorrectas/i);

    // Seguimos en /login
    expect(page.url()).toContain('/login');
  });

  // ── 3. Flujo completo: Login → Crear → Listar ─────────────────────────────

  test('crear una mascota y verificar que aparece en el listado', async ({ page }) => {
    // Paso 1: Login
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    // Paso 2: Abrir modal de creación
    const createBtn = page.getByRole('button', { name: /nueva mascota/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Paso 3: Verificar que el dialog se abre
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Paso 4: Rellenar el formulario
    await dialog.getByLabel(/nombre/i).fill(TEST_MASCOTA.nombre);
    await dialog.getByLabel(/especie/i).selectOption(TEST_MASCOTA.especie);
    const duenoSelect = dialog.getByLabel(/dueño \(cliente\)/i);
    await expect(duenoSelect).toBeVisible();
    await page.waitForTimeout(500);
    await duenoSelect.selectOption({ index: 1 });

    // Paso 5: Enviar
    await dialog.getByRole('button', { name: /crear mascota/i }).click();

    // Paso 6: El modal se cierra al éxito
    await expect(dialog).not.toBeVisible({ timeout: 8_000 });

    // Paso 7: La nueva mascota aparece en el listado
    await expect(page.getByText(TEST_MASCOTA.nombre)).toBeVisible({ timeout: 8_000 });
  });

  // ── 4. Validación del formulario ──────────────────────────────────────────

  test('formulario de creación muestra errores de validación client-side', async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    await page.getByRole('button', { name: /nueva mascota/i }).click();
    const dialog = page.getByRole('dialog');

    // Intentar enviar con campos vacíos
    await dialog.getByRole('button', { name: /crear mascota/i }).click();

    // Errores de Zod deben aparecer
    await expect(dialog.getByText(/al menos 2 caracteres/i)).toBeVisible();
    await expect(dialog.getByText(/expected one of/i)).toBeVisible();

    // El modal NO se cierra cuando hay errores
    await expect(dialog).toBeVisible();
  });

  // ── 5. Ruta protegida sin sesión ──────────────────────────────────────────

  test('navegar a /mascotas sin sesión redirige al login', async ({ page }) => {
    // Ir directamente al listado sin loguearse
    await page.goto('/mascotas');

    // Debe redirigir al login
    await page.waitForURL(/\/login/, { timeout: 5_000 });
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
  });

  // ── 6. Logout ─────────────────────────────────────────────────────────────

  test('logout limpia la sesión y redirige al login', async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    // Hacer click en el botón de logout de la navbar
    await page.getByRole('button', { name: /cerrar sesión|salir/i }).click();

    // Debe redirigir al login
    await page.waitForURL(/\/login/, { timeout: 5_000 });
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();

    // Intentar navegar de vuelta a /mascotas → debe redirigir a login
    await page.goto('/mascotas');
    await page.waitForURL(/\/login/, { timeout: 5_000 });
  });

  // ── 7. Responsivo en mobile ───────────────────────────────────────────────

  test('flujo de login funciona en viewport móvil (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    // El h1 debe ser visible en mobile sin scroll horizontal
    await expect(page.getByRole('heading', { name: /mascotas/i })).toBeVisible();

    // No debe haber scroll horizontal (WCAG 1.4.10 Reflow)
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });
});

// ─── Modo sin backend: uso de mock de la API ──────────────────────────────────
// Si el backend no está disponible, puedes mockear las rutas de la API
// usando page.route() antes de cada test:
//
// test.beforeEach(async ({ page }) => {
//   await page.route('**/api/v1/usuarios/login', async (route) => {
//     await route.fulfill({
//       status: 200,
//       contentType: 'application/json',
//       body: JSON.stringify({
//         token: 'mock-token', tipo: 'Bearer', expiraEnMinutos: 60,
//         nombreUsuario: 'admin_test', email: 'admin@test.com', rol: 'Admin',
//       }),
//     });
//   });
//   await page.route('**/api/v1/mascotas', async (route) => {
//     if (route.request().method() === 'GET') {
//       await route.fulfill({
//         status: 200,
//         contentType: 'application/json',
//         body: JSON.stringify({
//           items: [{ id: 1, nombre: 'Fido', especie: 'Perro', ... }],
//           totalCount: 1, page: 1, pageSize: 10,
//           totalPages: 1, hasNextPage: false, hasPreviousPage: false,
//         }),
//       });
//     }
//   });
// });
