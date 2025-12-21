export interface Solution {
  id: string;
  internal_id: string;
  title: string;
  category: 'concrete' | 'sheet' | 'both';
  precio_contado_m2: number;
  precio_msi_m2: number;
  grosor?: string;
  beneficio_principal?: string;
  detalle_costo_beneficio?: string;
  orden?: number;
  ciudad?: string;
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  state: string;
  city: string;
  google_maps_link: string;
  roofArea: number;
  createdAt: string;
}

export interface Quote {
  id: string;
  leadId: string;
  solutionId: string;
  cashPrice: number;
  msiPrice: number;
  status: 'Nuevo' | 'Contactado' | 'Visita Técnica' | 'Cerrado';
  createdAt: string;
}
