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

export interface Location {
  id: string;
  ciudad: string;
  estado: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  google_maps_link?: string;
  redes_sociales?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
  is_branch?: boolean;
  created_at?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  content: string; // Markdown or HTML
  image_url?: string;
  author_id?: string;
  published_at: string;
  is_published: boolean;
  category?: string;
  created_at: string;
  updated_at: string;
}
