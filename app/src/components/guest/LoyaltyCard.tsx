import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { listenForLoyaltyLog } from '@/services/firebase-services';
import type { LoyaltyLogEntry, User as AppUser } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Trophy, Star, Gift, Gem, TrendingUp, Clock, BedDouble, Sparkles } from 'lucide-react';

type AuthUserBridge = AppUser & { uid?: string };

interface LoyaltyCardProps {
  onBack: () => void;
}

const TIERS = [
  { name: 'Bronze', min: 0, color: 'from-amber-700 to-amber-900', textColor: 'text-amber-200', icon: Star, badge: 'bg-amber-700' },
  { name: 'Silver', min: 500, color: 'from-gray-400 to-gray-600', textColor: 'text-gray-200', icon: Trophy, badge: 'bg-gray-500' },
  { name: 'Gold', min: 1500, color: 'from-yellow-500 to-amber-600', textColor: 'text-yellow-100', icon: Gift, badge: 'bg-yellow-600' },
  { name: 'Platinum', min: 5000, color: 'from-slate-700 to-slate-900', textColor: 'text-blue-200', icon: Gem, badge: 'bg-slate-800' },
];

export function LoyaltyCard({ onBack }: LoyaltyCardProps) {
  const { user } = useAuth();
  const currentUser = user as AuthUserBridge;
  const [logEntries, setLogEntries] = useState<LoyaltyLogEntry[]>([]);

  const points = currentUser?.loyaltyPoints || 0;
  const tierName = currentUser?.loyaltyTier || 'bronze';
  const currentTier = TIERS.find(t => t.name.toLowerCase() === tierName) || TIERS[0];
  const currentTierIdx = TIERS.indexOf(currentTier);
  const nextTier = TIERS[currentTierIdx + 1];
  const progressToNext = nextTier ? Math.min(100, Math.round(((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100)) : 100;

  const TierIcon = currentTier.icon;

  useEffect(() => {
    const guestId = currentUser?.id || currentUser?.uid;
    if (!guestId) return;
    const unsub = listenForLoyaltyLog(guestId, setLogEntries);
    return unsub;
  }, [currentUser?.id, currentUser?.uid]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Button variant="ghost" onClick={onBack} className="text-[#1e3a5f] hover:bg-[#1e3a5f]/5 -ml-4">
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <div>
        <h1 className="text-3xl font-serif font-bold text-[#1e3a5f]">Loyalty & Rewards</h1>
        <p className="text-gray-500 mt-1">Earn points with every booking and unlock exclusive perks.</p>
      </div>

      {/* Main Loyalty Card */}
      <Card className={`bg-gradient-to-br ${currentTier.color} text-white border-none shadow-2xl overflow-hidden relative`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <CardContent className="p-8 relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-xs uppercase tracking-[0.3em] ${currentTier.textColor} mb-1`}>Azure Horizon Rewards</p>
              <h2 className="text-4xl font-bold font-mono">{points.toLocaleString()}</h2>
              <p className={`text-sm ${currentTier.textColor} mt-1`}>Loyalty Points</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-16 h-16 rounded-2xl ${currentTier.badge} flex items-center justify-center shadow-lg`}>
                <TierIcon className="h-8 w-8" />
              </div>
              <Badge className={`${currentTier.badge} text-white border-none text-xs mt-1`}>{currentTier.name}</Badge>
            </div>
          </div>

          {nextTier && (
            <div className="mt-6">
              <div className="flex justify-between text-xs mb-2">
                <span className={currentTier.textColor}>{currentTier.name}</span>
                <span className={currentTier.textColor}>{nextTier.name} ({nextTier.min} pts)</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full transition-all duration-1000"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
              <p className={`text-xs ${currentTier.textColor} mt-2`}>
                {nextTier.min - points} more points to reach {nextTier.name}
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className={`text-2xl font-bold`}>{logEntries.length}</p>
              <p className={`text-xs ${currentTier.textColor}`}>Transactions</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{logEntries.reduce((sum, e) => sum + e.points, 0)}</p>
              <p className={`text-xs ${currentTier.textColor}`}>Points Earned</p>
            </div>
            <div>
              <p className="text-2xl font-bold">R{(points * 10).toLocaleString()}</p>
              <p className={`text-xs ${currentTier.textColor}`}>Total Spend</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perks */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Gift className="h-5 w-5 text-[#c9a227]" /> Tier Perks</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TIERS.map((tier, i) => (
              <div key={tier.name} className={`p-4 rounded-xl border-2 text-center transition-all ${
                tier.name.toLowerCase() === tierName ? 'border-[#c9a227] bg-[#c9a227]/5' : 'border-gray-100 opacity-50'
              }`}>
                <tier.icon className={`h-6 w-6 mx-auto mb-2 ${tier.name.toLowerCase() === tierName ? 'text-[#c9a227]' : 'text-gray-300'}`} />
                <p className="font-bold text-sm">{tier.name}</p>
                <p className="text-[10px] text-gray-500 mt-1">
                  {i === 0 && '1x Points Earn Rate'}
                  {i === 1 && 'Late Checkout'}
                  {i === 2 && 'Free Spa Treatment'}
                  {i === 3 && 'Suite Upgrade'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rewards Catalog */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-[#c9a227]" /> Redeemable Rewards</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { id: 1, title: 'Complimentary Dessert', pts: 100, icon: Gift },
              { id: 2, title: 'Room Upgrade Request', pts: 300, icon: BedDouble },
              { id: 3, title: 'Free Spa Treatment', pts: 500, icon: Sparkles }
            ].map(reward => (
              <div key={reward.id} className="border border-gray-100 p-4 rounded-xl hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                    <reward.icon className="h-5 w-5 text-amber-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm">{reward.title}</h4>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[#c9a227] font-bold text-sm">{reward.pts} pts</span>
                  <Button 
                    size="sm" 
                    variant={points >= reward.pts ? 'default' : 'outline'}
                    disabled={points < reward.pts}
                    className={points >= reward.pts ? 'bg-[#c9a227] hover:bg-[#b08d22] text-white' : ''}
                  >
                    {points >= reward.pts ? 'Redeem' : 'Not Enough Pts'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Points History */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-600" /> Points History</h3>
          {logEntries.length === 0 ? (
            <p className="text-gray-400 text-center py-8 italic">No points earned yet. Make a booking to start earning!</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {logEntries.slice(0, 20).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{entry.reason}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(entry.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-bold text-sm">+{entry.points}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
