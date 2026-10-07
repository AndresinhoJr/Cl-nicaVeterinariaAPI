import { z } from 'zod';
import { ESPECIES_VALIDAS } from '../../types/mascota.types';

/**
 * Esquema Zod para crear / editar una mascota.
 * Las reglas replican las validaciones del backend (MascotaCreateDto / MascotaUpdateDto).
 */
export const mascotaSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.')
    .trim(),

  especie: z
    .enum(ESPECIES_VALIDAS, {
      errorMap: () => ({
        message: `Especie inválida. Opciones: ${ESPECIES_VALIDAS.join(', ')}.`,
      }),
    }),

  // El campo es opcional: el register en MascotaForm usa setValueAs para
  // convertir el string vacío "" de type="number" a null antes de Zod.
  duenoId: z
    .number({ invalid_type_error: 'El ID del dueño debe ser un número.' })
    .int('El ID del dueño debe ser un entero.')
    .positive('El ID del dueño debe ser mayor a 0.')
    .optional()
    .nullable(),
});

export type MascotaFormValues = z.infer<typeof mascotaSchema>;
