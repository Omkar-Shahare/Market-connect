import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ShoppingBag,
    Users,
    TrendingUp,
    ArrowRight,
    Package,
    Truck,
    DollarSign,
    Store,
    Calendar,
    ChevronRight,
    Wallet
} from "lucide-react";
import { formatAmount } from "@/lib/razorpay";

interface VendorHomeDashboardProps {
    vendorProfile: any;
    orders: any[];
    groupOrders: any[];
    onNavigate: (tab: string) => void;
}

const VendorHomeDashboard: React.FC<VendorHomeDashboardProps> = ({
    vendorProfile,
    orders,
    groupOrders,
    onNavigate
}) => {

    // Calculate KPIs
    const kpiStats = useMemo(() => {
        const totalOrders = orders.length;
        const activeGroups = groupOrders.length;

        const totalSpent = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

        // Estimated savings logic (15% of group orders)
        const groupOrdersList = orders.filter(o => o.items?.some((i: any) => i.product?.name?.includes('Group') || o.notes?.includes('group')));
        const estimatedSavings = groupOrdersList.reduce((sum, order) => sum + (Number(order.total_amount) * 0.15), 0);

        return {
            totalOrders,
            activeGroups,
            totalSavings: estimatedSavings,
            totalSpent
        };
    }, [orders, groupOrders]);

    // Business Insights
    const insights = useMemo(() => {
        if (orders.length === 0) return { aov: 0, favoriteSupplier: 'N/A', monthlySpending: 0 };

        const totalSpent = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
        const aov = totalSpent / orders.length;

        // Find favorite supplier
        const supplierCounts: Record<string, number> = {};
        orders.forEach(order => {
            const supplierName = order.supplier?.business_name || 'Unknown';
            supplierCounts[supplierName] = (supplierCounts[supplierName] || 0) + 1;
        });

        const favoriteSupplier = Object.entries(supplierCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // Monthly spending (current month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlySpending = orders
            .filter(order => {
                const date = new Date(order.created_at);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            })
            .reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

        return {
            aov,
            favoriteSupplier,
            monthlySpending
        };
    }, [orders]);

    const recentOrders = orders.slice(0, 5);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Welcome Section with Gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8 text-white shadow-lg">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            Welcome back, {vendorProfile?.owner_name || 'Vendor'}! 👋
                        </h1>
                        <p className="text-blue-100 mt-2 text-base md:text-lg">
                            Here's your daily business overview.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/20">
                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-100" />
                        <span className="text-xs md:text-sm font-medium">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl"></div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                    <CardContent className="p-5 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3 mr-1" /> +2 this week
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Orders</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{kpiStats.totalOrders}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                    <CardContent className="p-5 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                                <Users className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full cursor-pointer hover:bg-blue-100" onClick={() => onNavigate('group')}>
                                Join now <ChevronRight className="w-3 h-3 ml-1" />
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Groups</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{kpiStats.activeGroups}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                    <CardContent className="p-5 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                                <Wallet className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3 mr-1" /> +12% vs last month
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Savings</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{formatAmount(kpiStats.totalSavings)}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column: Quick Actions & Recent Orders */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">

                    {/* Quick Actions */}
                    <Card className="border-none shadow-md bg-white">
                        <CardHeader className="border-b border-gray-100 pb-4">
                            <CardTitle className="text-lg font-bold text-gray-800">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                                <button
                                    onClick={() => onNavigate('suppliers')}
                                    className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group"
                                >
                                    <div className="p-2.5 md:p-3 bg-white text-blue-600 rounded-full mb-2 shadow-sm group-hover:scale-110 transition-transform">
                                        <Store className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <span className="font-semibold text-gray-900">Browse Suppliers</span>
                                    <span className="text-xs text-gray-500 mt-1">Find new partners</span>
                                </button>

                                <button
                                    onClick={() => onNavigate('group')}
                                    className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-green-50 hover:border-green-200 hover:-translate-y-1 transition-all duration-300 group"
                                >
                                    <div className="p-2.5 md:p-3 bg-white text-green-600 rounded-full mb-2 shadow-sm group-hover:scale-110 transition-transform">
                                        <Users className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <span className="font-semibold text-gray-900">Group Buying</span>
                                    <span className="text-xs text-gray-500 mt-1">Save together</span>
                                </button>

                                <button
                                    onClick={() => onNavigate('orders')}
                                    className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-purple-50 hover:border-purple-200 hover:-translate-y-1 transition-all duration-300 group"
                                >
                                    <div className="p-2.5 md:p-3 bg-white text-purple-600 rounded-full mb-2 shadow-sm group-hover:scale-110 transition-transform">
                                        <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <span className="font-semibold text-gray-900">Order History</span>
                                    <span className="text-xs text-gray-500 mt-1">Track & reorder</span>
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Orders Tab Section */}
                    <Card className="border-none shadow-md bg-white overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3 md:px-6 md:py-4">
                            <CardTitle className="text-lg font-bold text-gray-800">Recent Orders</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => onNavigate('orders')} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium">
                                View All <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentOrders.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {recentOrders.map((order) => (
                                        <div key={order.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 hover:bg-gray-50/80 transition-colors group gap-3 sm:gap-0">
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm group-hover:shadow transition-shadow flex-shrink-0">
                                                    {order.items?.[0]?.product?.image_url ? (
                                                        <img
                                                            src={order.items[0].product.image_url}
                                                            alt={order.items[0].product.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <Package className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                                        {order.items?.[0]?.product?.name || 'Order #' + order.order_number?.slice(-6)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <Badge variant="outline" className="text-xs font-normal text-gray-500 border-gray-200">
                                                            {new Date(order.created_at).toLocaleDateString()}
                                                        </Badge>
                                                        <span className="text-xs text-gray-400 hidden sm:inline">•</span>
                                                        <span className="text-xs text-gray-600 font-medium truncate max-w-[150px]">
                                                            {order.supplier?.business_name || 'Unknown Supplier'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-1 sm:mt-0">
                                                <p className="font-bold text-gray-900">{formatAmount(order.total_amount)}</p>
                                                <Badge className={`sm:mt-1 capitalize shadow-sm ${order.status === 'delivered' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200' :
                                                        'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200'
                                                    }`}>
                                                    {order.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShoppingBag className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
                                    <p className="text-gray-500 mt-1 mb-4">Start shopping to see your recent activity here.</p>
                                    <Button onClick={() => onNavigate('suppliers')} className="bg-blue-600 hover:bg-blue-700 text-white">
                                        Browse Suppliers
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Business Insights */}
                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-none shadow-xl overflow-hidden relative">
                        {/* Abstract shapes for visual interest */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>

                        <CardHeader className="relative z-10 border-b border-white/10 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                    <TrendingUp className="w-4 h-4 text-blue-400" />
                                </div>
                                Business Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 space-y-6 pt-6">
                            <div className="group">
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Average Order Value</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-bold text-white group-hover:text-blue-300 transition-colors">{formatAmount(insights.aov)}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10 group">
                                <div className="flex justify-between items-end mb-1">
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Monthly Spending</p>
                                    <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Current Month</span>
                                </div>
                                <p className="text-3xl font-bold text-white group-hover:text-green-300 transition-colors">{formatAmount(insights.monthlySpending)}</p>
                            </div>

                            <div className="pt-4 border-t border-white/10 group">
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Top Supplier</p>
                                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                        {insights.favoriteSupplier.charAt(0)}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-white font-semibold truncate">{insights.favoriteSupplier}</p>
                                        <p className="text-xs text-slate-400">Most frequent partner</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tips or Promo Card */}
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mt-1">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-900 mb-1">Maximize Savings</h3>
                                    <p className="text-sm text-blue-800/80 leading-relaxed">
                                        Join a group order today and save up to <span className="font-bold text-blue-700">20%</span> on delivery and product costs.
                                    </p>
                                    <Button
                                        variant="link"
                                        className="px-0 text-blue-700 mt-2 h-auto font-semibold hover:text-blue-800 group"
                                        onClick={() => onNavigate('group')}
                                    >
                                        Explore Groups <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VendorHomeDashboard;
