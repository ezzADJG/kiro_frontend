import type { ShalomProduct } from '@/types/payments'

export const SHALOM_PRODUCTS: ShalomProduct[] = [
  { id: 3, title: 'Sobre', content: 'Hasta 0.5 kg', sub_content: 'Documentos y similares', measurements: { weight: 0.5, width: 0.3, height: 0.02, length: 0.4 } },
  { id: 1095, title: 'Caja Paquete XXS', content: 'Hasta 1 kg', sub_content: 'Para envíos muy pequeños', measurements: { weight: 1, width: 0.2, height: 0.15, length: 0.25 } },
  { id: 1096, title: 'Caja Paquete XS', content: 'Hasta 3 kg', sub_content: 'Para envíos pequeños', measurements: { weight: 3, width: 0.25, height: 0.2, length: 0.35 } },
  { id: 1097, title: 'Caja Paquete S', content: 'Hasta 5 kg', sub_content: 'Para envíos medianos', measurements: { weight: 5, width: 0.3, height: 0.25, length: 0.4 } },
  { id: 1098, title: 'Otra Medida', content: 'Definí dimensiones', sub_content: 'Para bultos fuera de catálogo', measurements: { weight: 0, width: 0, height: 0, length: 0 } },
]
