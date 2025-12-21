import { Solution } from "@/types";

export const getSolutions = (): Partial<Solution>[] => {
    // metadata only - prices moved to server
    return [
        {
            id: 'th-fix',
            title: 'TH FIX',
            category: 'concrete',
            grosor: '1000 micras',
            beneficio_principal: 'Impermeabilidad y Reflectancia Básica',
        },
        {
            id: 'th-light',
            title: 'TH LIGHT',
            category: 'concrete',
            grosor: '1/2 cm (5 mm)',
            beneficio_principal: 'Impermeabilidad Total y Aislamiento Inicial',
        },
        {
            id: 'th-forte',
            category: 'concrete',
            title: 'TH FORTE',
            grosor: '1 cm (10 mm)',
            beneficio_principal: 'Aislamiento Térmico Óptimo e Impermeabilidad Máxima',
        },
        {
            id: 'th-3-4',
            title: 'TH 3/4',
            category: 'both',
            grosor: '1.9 cm (19 mm)',
            beneficio_principal: 'Impermeabilidad Total y Aislamiento Térmico/Acústico Alto',
        },
        {
            id: 'th-ingles',
            title: 'TH Inglés',
            category: 'both',
            grosor: '2.5 cm (25 mm)',
            beneficio_principal: 'Aislamiento Térmico y Acústico Superior + Máxima Protección',
        }
    ];
};
