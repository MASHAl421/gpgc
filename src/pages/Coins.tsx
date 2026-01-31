import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Coins as CoinsIcon, 
  Gift, 
  TrendingUp, 
  Award, 
  Star, 
  Flame,
  Trophy,
  Medal,
  Crown,
  ShoppingBag,
  History,
  Loader2,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CoinTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  coins_reward: number;
  achievement_type: string;
  requirement_value: number;
}

interface UserAchievement {
  achievement_id: string;
  earned_at: string;
}

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  coin_cost: number;
  item_type: string;
  is_available: boolean;
}

interface UserPurchase {
  shop_item_id: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy,
  Medal,
  Star,
  Flame,
  Crown,
  Award,
  TrendingUp,
};

const Coins = () => {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [userPurchases, setUserPurchases] = useState<UserPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all data in parallel
      const [transactionsRes, achievementsRes, userAchievementsRes, shopItemsRes, purchasesRes] = await Promise.all([
        supabase
          .from('coin_transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('achievements').select('*').order('coins_reward'),
        supabase.from('user_achievements').select('achievement_id, earned_at'),
        supabase.from('shop_items').select('*').eq('is_available', true).order('coin_cost'),
        supabase.from('user_purchases').select('shop_item_id'),
      ]);

      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (achievementsRes.data) setAchievements(achievementsRes.data);
      if (userAchievementsRes.data) setUserAchievements(userAchievementsRes.data);
      if (shopItemsRes.data) setShopItems(shopItemsRes.data);
      if (purchasesRes.data) setUserPurchases(purchasesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!user || !profile) return;
    
    if ((profile.coins_earned || 0) < item.coin_cost) {
      toast.error('Not enough coins!');
      return;
    }

    setPurchasing(item.id);
    try {
      // Use atomic RPC function to spend coins (prevents race conditions and double-spending)
      const { error: spendError } = await supabase.rpc('spend_coins', {
        _user_id: user.id,
        _amount: item.coin_cost,
        _description: `Purchased: ${item.name}`,
        _reference_id: item.id,
      });

      if (spendError) throw spendError;

      // Insert purchase record
      const { error: purchaseError } = await supabase
        .from('user_purchases')
        .insert({ user_id: user.id, shop_item_id: item.id });

      if (purchaseError) throw purchaseError;

      toast.success(`Successfully purchased ${item.name}!`);
      fetchData();
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error purchasing:', error);
      }
      toast.error(error.message || 'Failed to purchase item');
    } finally {
      setPurchasing(null);
    }
  };

  const getAchievementIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Award;
    return Icon;
  };

  const isAchievementEarned = (achievementId: string) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId);
  };

  const isPurchased = (itemId: string) => {
    return userPurchases.some((p) => p.shop_item_id === itemId);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'quiz_reward':
        return <Trophy className="h-4 w-4 text-primary" />;
      case 'daily_login':
        return <Flame className="h-4 w-4 text-orange-500" />;
      case 'achievement':
        return <Award className="h-4 w-4 text-yellow-500" />;
      case 'competition':
        return <Medal className="h-4 w-4 text-primary" />;
      case 'spent':
        return <ShoppingBag className="h-4 w-4 text-red-500" />;
      default:
        return <CoinsIcon className="h-4 w-4 text-primary" />;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const earnedAchievementsCount = userAchievements.length;
  const totalAchievements = achievements.length;
  const achievementProgress = totalAchievements > 0 
    ? Math.round((earnedAchievementsCount / totalAchievements) * 100) 
    : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <CoinsIcon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Coins & Rewards
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Track your earnings, achievements, and redeem rewards
          </p>
        </div>

        {/* Total Coins Card */}
        <Card className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm">Total Coins</p>
                <h2 className="text-3xl md:text-4xl font-bold mt-1">{profile?.coins_earned || 0}</h2>
                <p className="text-primary-foreground/70 text-sm mt-2">
                  {earnedAchievementsCount}/{totalAchievements} achievements unlocked
                </p>
              </div>
              <CoinsIcon className="h-12 w-12 md:h-16 md:w-16 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs md:text-sm">Badges</TabsTrigger>
            <TabsTrigger value="shop" className="text-xs md:text-sm">Shop</TabsTrigger>
            <TabsTrigger value="history" className="text-xs md:text-sm">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Achievement Progress */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Award className="h-5 w-5 text-primary" />
                    Achievement Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Badges Earned</span>
                        <span className="font-medium text-foreground">{earnedAchievementsCount}/{totalAchievements}</span>
                      </div>
                      <Progress value={achievementProgress} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {achievements.slice(0, 5).map((achievement) => {
                        const Icon = getAchievementIcon(achievement.icon);
                        const earned = isAchievementEarned(achievement.id);
                        return (
                          <div
                            key={achievement.id}
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              earned ? 'bg-primary' : 'bg-muted'
                            }`}
                            title={achievement.name}
                          >
                            <Icon className={`h-5 w-5 ${earned ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Earnings */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Recent Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.slice(0, 4).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(tx.transaction_type)}
                          <div>
                            <p className="text-sm font-medium text-foreground line-clamp-1">
                              {tx.description || tx.transaction_type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        <span className={`font-bold ${tx.amount > 0 ? 'text-primary' : 'text-destructive'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </span>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No transactions yet. Start earning!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement) => {
                const Icon = getAchievementIcon(achievement.icon);
                const earned = isAchievementEarned(achievement.id);
                return (
                  <Card 
                    key={achievement.id} 
                    className={`bg-card border-border ${earned ? 'ring-2 ring-primary' : 'opacity-70'}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
                          earned ? 'bg-primary' : 'bg-muted'
                        }`}>
                          <Icon className={`h-6 w-6 ${earned ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{achievement.name}</h3>
                            {earned && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                          <Badge variant="secondary" className="mt-2">
                            +{achievement.coins_reward} coins
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="shop" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {shopItems.map((item) => {
                const purchased = isPurchased(item.id);
                const canAfford = (profile?.coins_earned || 0) >= item.coin_cost;
                return (
                  <Card key={item.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Gift className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{item.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            <div className="flex items-center gap-1 mt-2">
                              <CoinsIcon className="h-4 w-4 text-primary" />
                              <span className="font-bold text-foreground">{item.coin_cost}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4"
                        variant={purchased ? 'outline' : 'default'}
                        disabled={purchased || !canAfford || purchasing === item.id}
                        onClick={() => handlePurchase(item)}
                      >
                        {purchasing === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : purchased ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : null}
                        {purchased ? 'Purchased' : canAfford ? 'Purchase' : 'Not Enough Coins'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <History className="h-5 w-5 text-primary" />
                  Transaction History
                </CardTitle>
                <CardDescription>All your coin transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(tx.transaction_type)}
                        <div>
                          <p className="font-medium text-foreground">
                            {tx.description || tx.transaction_type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold ${tx.amount > 0 ? 'text-primary' : 'text-destructive'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center py-8">
                      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No transactions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Coins;
