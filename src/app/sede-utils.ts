/** Orden común para tarjetas y selectores: oficinas, Rioverde y al final Otros Estados. */
export function ordenarSedesParaMostrar<T extends { idSede?: number | string; nombre?: string }>(sedes: T[] | null | undefined): T[] {
  const grupo = (sede: T): number => {
    const nombre = (sede.nombre || '').toLocaleLowerCase();
    if (nombre.includes('otros estados')) return 2;
    if (nombre.includes('rioverde') || nombre.includes('zona sur')) return 1;
    return 0;
  };

  return [...(sedes || [])].sort((a, b) =>
    grupo(a) - grupo(b) || Number(a.idSede || 0) - Number(b.idSede || 0)
  );
}
