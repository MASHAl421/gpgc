import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Play, Eye, Clock, Calendar, CheckCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CompetitionAttempt {
  competition_id: string;
  completed_at: string | null;
  score: number | null;
  total_questions: number | null;
}

interface Competition {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  competition_type: string;
  semester: number | null;
  is_active: boolean;
}

interface CompetitionTestsTableProps {
  competitions: Competition[];
  attempts: CompetitionAttempt[];
  onStartTest: (competitionId: string) => void;
  onViewResult: (competitionId: string) => void;
}

export const CompetitionTestsTable = ({
  competitions,
  attempts,
  onStartTest,
  onViewResult,
}: CompetitionTestsTableProps) => {
  const isMobile = useIsMobile();

  const getAttemptForCompetition = (competitionId: string) => {
    return attempts.find((a) => a.competition_id === competitionId);
  };

  const getCompetitionStatus = (comp: Competition) => {
    const now = new Date();
    const start = new Date(comp.start_time);
    const end = new Date(comp.end_time);

    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'live';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-primary">Live</Badge>;
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>;
      case 'completed':
        return <Badge variant="outline">Ended</Badge>;
      default:
        return null;
    }
  };

  const getResultBadge = (attempt: CompetitionAttempt | undefined, status: string) => {
    if (!attempt) {
      if (status === 'upcoming') {
        return <Badge variant="secondary">Not Started</Badge>;
      }
      if (status === 'completed') {
        return <Badge variant="outline">Missed</Badge>;
      }
      return <Badge variant="secondary">Not Attempted</Badge>;
    }

    const score = attempt.score || 0;
    const total = attempt.total_questions || 1;
    const percentage = Math.round((score / total) * 100);

    if (percentage >= 80) {
      return <Badge className="bg-primary">{score}/{total} ({percentage}%)</Badge>;
    } else if (percentage >= 50) {
      return <Badge variant="secondary">{score}/{total} ({percentage}%)</Badge>;
    } else {
      return <Badge variant="destructive">{score}/{total} ({percentage}%)</Badge>;
    }
  };

  if (competitions.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No tests available at the moment.</p>
        <p className="text-sm text-muted-foreground mt-2">Check back later for upcoming competitions!</p>
      </div>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-3">
        {competitions.map((comp) => {
          const attempt = getAttemptForCompetition(comp.id);
          const status = getCompetitionStatus(comp);

          return (
            <Card key={comp.id} className="bg-card border-border">
              <CardContent className="p-4">
                {/* Header with title and status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">
                      {comp.title}
                    </h3>
                    {comp.semester && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Sem {comp.semester}
                      </Badge>
                    )}
                  </div>
                  {getStatusBadge(status)}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Open: {format(new Date(comp.start_time), 'dd MMM')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Close: {format(new Date(comp.end_time), 'dd MMM')}</span>
                  </div>
                </div>

                {/* Result and Action */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    {attempt && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                    {getResultBadge(attempt, status)}
                  </div>
                  
                  {attempt ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewResult(comp.id)}
                      className="h-8 px-3"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  ) : status === 'live' ? (
                    <Button 
                      size="sm" 
                      onClick={() => onStartTest(comp.id)}
                      className="h-8 px-3"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  ) : status === 'upcoming' ? (
                    <Button size="sm" variant="secondary" disabled className="h-8 px-3">
                      <Clock className="h-3 w-3 mr-1" />
                      Soon
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled className="h-8 px-3">
                      Closed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-primary">
            <th className="text-left text-primary-foreground font-semibold px-4 py-3">Test Name</th>
            <th className="text-left text-primary-foreground font-semibold px-4 py-3">Opening Date</th>
            <th className="text-left text-primary-foreground font-semibold px-4 py-3">Closing Date</th>
            <th className="text-left text-primary-foreground font-semibold px-4 py-3">Date Attempt</th>
            <th className="text-left text-primary-foreground font-semibold px-4 py-3">Result</th>
            <th className="text-center text-primary-foreground font-semibold px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {competitions.map((comp, index) => {
            const attempt = getAttemptForCompetition(comp.id);
            const status = getCompetitionStatus(comp);
            const isEven = index % 2 === 0;

            return (
              <tr key={comp.id} className={isEven ? 'bg-background' : 'bg-muted/30'}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {comp.title}
                  {comp.semester && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Sem {comp.semester}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(new Date(comp.start_time), 'dd-MM-yyyy')}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(new Date(comp.end_time), 'dd-MM-yyyy')}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {attempt?.completed_at
                    ? format(new Date(attempt.completed_at), 'dd-MM-yyyy')
                    : '-'}
                </td>
                <td className="px-4 py-3">{getResultBadge(attempt, status)}</td>
                <td className="px-4 py-3 text-center">
                  {attempt ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewResult(comp.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  ) : status === 'live' ? (
                    <Button size="sm" onClick={() => onStartTest(comp.id)}>
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  ) : status === 'upcoming' ? (
                    <Button size="sm" variant="secondary" disabled>
                      <Clock className="h-4 w-4 mr-1" />
                      Soon
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Closed
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
