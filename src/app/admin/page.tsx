
import { getCotizaciones, getPrecios } from './actions';
import AdminDashboard from './AdminDashboard';

export const metadata = {
    title: 'Admin Dashboard | Thermo House',
    description: 'Panel de control de ventas',
    robots: 'noindex, nofollow',
};

// Force dynamic because we want real-time data on every request
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const [quotes, prices] = await Promise.all([
        getCotizaciones(),
        getPrecios()
    ]);

    return <AdminDashboard initialQuotes={quotes} initialPrices={prices} />;
}
