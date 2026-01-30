import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Coins as CoinsIcon, Gift, TrendingUp, Award, Star } from 'lucide-react';

const Coins = () => {
  const { profile } = useAuth();

  const earnHistory = [
    { id: 1, action: 'Completed Physics Quiz', coins: 50, date: '2026-01-30' },
    { id: 2, action: 'Daily Login Bonus', coins: 10, date: '2026-01-30' },
    { id: 3, action: 'Won Competition', coins: 100, date: '2026-01-29' },
    { id: 4, action: 'Completed Chemistry Quiz', coins: 45, date: '2026-01-29' },
    { id: 5, action: 'First Time Bonus', coins: 200, date: '2026-01-28' },
  ];

  const rewards = [
    { id: 1, name: 'Premium Access - 1 Week', cost: 500, icon: Award },
    { id: 2, name: 'Extra Test Attempts', cost: 200, icon: TrendingUp },
    { id: 3, name: 'AI Tutor Credits', cost: 300, icon: Star },
    { id: 4, name: 'Certificate Badge', cost: 1000, icon: Gift },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <CoinsIcon className="h-8 w-8 text-primary" />
            Coins Earned
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your earnings and redeem rewards
          </p>
        </div>

        {/* Total Coins */}
        <Card className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80">Total Coins</p>
                <h2 className="text-4xl font-bold mt-2">{profile?.coins_earned || 0}</h2>
              </div>
              <CoinsIcon className="h-16 w-16 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Earning History */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Earning History</CardTitle>
              <CardDescription>Your recent coin earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {earnHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.action}</p>
                      <p className="text-sm text-muted-foreground">{item.date}</p>
                    </div>
                    <span className="font-bold text-primary">+{item.coins}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rewards */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Redeem Rewards
              </CardTitle>
              <CardDescription>Spend your coins on rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <reward.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{reward.name}</span>
                    </div>
                    <span className="font-bold text-muted-foreground">{reward.cost} coins</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Coins;
