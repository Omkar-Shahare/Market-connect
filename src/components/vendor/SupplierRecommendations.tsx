import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, TrendingUp, Truck, CheckCircle2 } from "lucide-react";
import StarRating from "@/components/StarRating";
import { useTranslation } from 'react-i18next';

interface Supplier {
    id: string;
    groupId?: string;
    name: string;
    product: string;
    price: string;
    originalPrice: number | string;
    location: string;
    latitude: number;
    longitude: number;
    rating: number;
    deliveryRadius: number;
    deliveryCharge: number;
    image: string;
    verified?: boolean;
    memberYears?: number;
}

interface Location {
    latitude: number;
    longitude: number;
    name?: string;
}

interface SupplierRecommendationsProps {
    suppliers: Supplier[];
    currentLocation: Location | null;
    onSelectSupplier: (supplier: Supplier) => void;
}

const SupplierRecommendations: React.FC<SupplierRecommendationsProps> = ({
    suppliers,
    currentLocation,
    onSelectSupplier
}) => {
    const { t } = useTranslation();
    const [selectedCommodity, setSelectedCommodity] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("smart"); // smart, price, distance, rating

    // Extract unique commodities
    const commodities = useMemo(() => {
        const unique = new Set(suppliers.map(s => s.product));
        return ["all", ...Array.from(unique)];
    }, [suppliers]);

    // Calculate distance
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Filter and sort suppliers
    const recommendedSuppliers = useMemo(() => {
        let filtered = suppliers;

        if (selectedCommodity !== "all") {
            filtered = filtered.filter(s => s.product === selectedCommodity);
        }

        // Calculate scores for "smart" sorting
        const scored = filtered.map(supplier => {
            let score = 0;
            let tags: string[] = [];

            // Price score (lower is better)
            const priceVal = typeof supplier.originalPrice === 'string'
                ? parseFloat(supplier.originalPrice)
                : supplier.originalPrice;

            // Distance score (lower is better)
            let distance = 0;
            if (currentLocation) {
                distance = calculateDistance(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    supplier.latitude,
                    supplier.longitude
                );
            }

            // Rating score (higher is better)
            const rating = supplier.rating || 0;

            // Smart Score Calculation (simplified)
            // Normalize and weight factors
            // This is a heuristic; in a real app, this would be more complex
            score += rating * 20; // Rating weight
            score -= priceVal * 0.5; // Price penalty (cheaper is better)
            if (currentLocation) {
                score -= distance * 2; // Distance penalty (closer is better)
            }

            // Determine tags
            if (rating >= 4.5) tags.push(t('top_rated'));
            if (currentLocation && distance < 5) tags.push(t('nearest'));
            // We'd need relative comparison for "Cheapest", doing it simply here

            return { ...supplier, score, distance, priceVal, tags };
        });

        // Find min price for tagging
        if (scored.length > 0) {
            const minPrice = Math.min(...scored.map(s => s.priceVal));
            scored.forEach(s => {
                if (s.priceVal === minPrice) s.tags.push(t('best_price'));
            });
        }

        // Sort based on selection
        return scored.sort((a, b) => {
            switch (sortBy) {
                case "price":
                    return a.priceVal - b.priceVal;
                case "distance":
                    return a.distance - b.distance;
                case "rating":
                    return b.rating - a.rating;
                case "smart":
                default:
                    return b.score - a.score;
            }
        });
    }, [suppliers, selectedCommodity, sortBy, currentLocation]);

    // Get top 3 recommendations
    const topRecommendations = recommendedSuppliers.slice(0, 3);

    if (suppliers.length === 0) return null;

    return (
        <div className="space-y-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        {t('smart_supplier_matching')}
                    </h2>
                    <p className="text-gray-600">{t('ai_recommendations')}</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <select
                        className="px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={selectedCommodity}
                        onChange={(e) => setSelectedCommodity(e.target.value)}
                    >
                        <option value="all">{t('all_commodities')}</option>
                        {commodities.filter(c => c !== "all").map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    <select
                        className="px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="smart">{t('smart_match')}</option>
                        <option value="price">{t('lowest_price')}</option>
                        <option value="distance">{t('nearest')}</option>
                        <option value="rating">{t('top_rated')}</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topRecommendations.map((supplier, index) => (
                    <Card key={`${supplier.id}-${index}`} className={`relative overflow-hidden border-2 ${index === 0 ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-blue-200'}`}>
                        {index === 0 && (
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium z-10">
                                {t('choice_1')}
                            </div>
                        )}
                        <div className="h-32 overflow-hidden">
                            <img src={supplier.image} alt={supplier.name} className="w-full h-full object-cover" />
                        </div>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg">{supplier.product}</h3>
                                    <p className="text-sm text-gray-600">{supplier.name}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-blue-600 text-lg">{supplier.price}</div>
                                    <div className="text-xs text-gray-500">{t('per_kg')}</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                                {supplier.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                    <StarRating rating={supplier.rating} showCount={true} />
                                </div>
                                {currentLocation && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span>{supplier.distance.toFixed(1)} {t('km_away')}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-gray-400" />
                                    <span>{t('delivery_charge')} ₹{supplier.deliveryCharge}</span>
                                </div>
                            </div>

                            <Button className="w-full" onClick={() => onSelectSupplier(supplier)}>
                                {t('order_now')}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {topRecommendations.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                    <p className="text-gray-500">{t('no_matching_suppliers')}</p>
                </div>
            )}
        </div>
    );
};

export default SupplierRecommendations;
