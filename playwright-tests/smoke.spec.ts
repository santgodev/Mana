import { test, expect } from '@playwright/test';

test.describe('Pruebas de humo de Maná', () => {
    test('debería cargar la página principal y mostrar el título', async ({ page }) => {
        await page.goto('/');
        // Buscamos "Maná" en el toolbar o página principal
        await expect(page.getByText(/Maná/i).first()).toBeVisible();
    });

    test('debería navegar al menú de una mesa y permitir agregar al carrito', async ({ page }) => {
        // Usamos una mesa de prueba (ej. el UUID de una mesa real o mock)
        // Para la prueba, solo navegamos a la ruta y vemos si carga
        await page.goto('/client/menu/mesa-1');

        // Esperamos a que cargue el menú (buscamos un texto del menú)
        await expect(page.getByText(/Nuestro Menú/i).or(page.getByText(/Carta/i)).first()).toBeVisible();

        // Si hay productos, intentamos agregar uno
        const addBtn = page.locator('.add-btn-float').first();
        if (await addBtn.isVisible()) {
            await addBtn.click();

            // Verificamos que aparezca el botón flotante del carrito que agregué
            await expect(page.locator('.floating-cart-btn')).toBeVisible();

            // Verificamos que el snackbar de "Ver carrito" (la alerta) sea visible
            await expect(page.getByText(/agregado/i)).toBeVisible();
        }
    });
});
