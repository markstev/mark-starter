import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TimingStats {
  durations: number[];
  average: number;
  min: number;
  max: number;
  total: number;
}

export function TimingCard({ children, name }: { children: React.ReactNode, name: string }) {
  const [stats, setStats] = useState<TimingStats>({
    durations: [],
    average: 0,
    min: 0,
    max: 0,
    total: 0
  });
  const [isRunning, setIsRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState(0);
  const [key, setKey] = useState(0); // Key to force re-mount
  const waiting = useRef(false);
  const startTimeRef = useRef<number>(performance.now());

  const calculateStats = useCallback((durations: number[]): TimingStats => {
    if (durations.length === 0) {
      return { durations, average: 0, min: 0, max: 0, total: 0 };
    }
    
    const total = durations.reduce((sum, duration) => sum + duration, 0);
    const average = total / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    return { durations, average, min, max, total };
  }, []);

  const handleDone = useCallback(() => {
    const duration = performance.now() - startTimeRef.current;
    console.log(`⏱Timing Card️ Component "${name}" took ${duration.toFixed(2)}ms to complete (run ${currentRun})`);
    
    setStats(prevStats => {
      const newDurations = [...prevStats.durations, duration];
      return calculateStats(newDurations);
    });
    waiting.current = false;
  }, [name, calculateStats, currentRun]);

  const runTenTimes = useCallback(async () => {
    setIsRunning(true);
    setCurrentRun(0);
    setStats({ durations: [], average: 0, min: 0, max: 0, total: 0 });
    
    for (let i = 0; i < 10; ) {
      if (waiting.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      i++;
      setCurrentRun(i + 1);
      
      // Start timing for this run
      startTimeRef.current = performance.now();
      
      // Force component re-mount by changing key
      waiting.current = true;
      setKey(prev => prev + 1);
      
      // Wait a bit for the component to start and complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsRunning(false);
  }, []);

  const resetStats = useCallback(() => {
    setStats({ durations: [], average: 0, min: 0, max: 0, total: 0 });
    setCurrentRun(0);
    setKey(0);
  }, []);

  // Ensure there is only one child element
  const child = React.Children.only(children);

  // Clone the child element and inject the `onDone` prop
  const childWithProp = React.isValidElement(child) 
    ? React.cloneElement(child, { onDone: handleDone })
    : child;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Timing: {name}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div key={key}>
          {childWithProp}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Button 
            onClick={runTenTimes} 
            disabled={isRunning}
            isLoading={isRunning}
          >
            {isRunning ? `Running ${currentRun}/10` : 'Run 10 Times'}
          </Button>
          
          <Button 
            onClick={resetStats} 
            variant="outline"
            disabled={isRunning || stats.durations.length === 0}
          >
            Reset Stats
          </Button>
        </div>
        
        {stats.durations.length > 0 && (
          <div className="w-full space-y-2">
            <h4 className="font-semibold text-sm">Timing Statistics:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Runs:</span>
                <span className="ml-2 font-mono">{stats.durations.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Average:</span>
                <span className="ml-2 font-mono">{stats.average.toFixed(2)}ms</span>
              </div>
              <div>
                <span className="text-muted-foreground">Min:</span>
                <span className="ml-2 font-mono">{stats.min.toFixed(2)}ms</span>
              </div>
              <div>
                <span className="text-muted-foreground">Max:</span>
                <span className="ml-2 font-mono">{stats.max.toFixed(2)}ms</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <span className="ml-2 font-mono">{stats.total.toFixed(2)}ms</span>
              </div>
            </div>
            
            {stats.durations.length > 1 && (
              <div className="mt-2">
                <span className="text-muted-foreground text-sm">All durations:</span>
                <div className="font-mono text-xs mt-1 p-2 bg-muted rounded">
                  {stats.durations.map((duration, index) => (
                    <span key={index}>
                      {duration.toFixed(2)}ms
                      {index < stats.durations.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export function MostBasicElement({ onDone }: { onDone?: () => void }): React.ReactNode {
    const startTime = performance.now();
  useEffect(() => {
    const duration = performance.now() - startTime;
    console.log(`⏱️ Component "Most Basic Element" took ${duration.toFixed(2)}ms to be fully loaded.`);
    onDone?.();
  }, [onDone]);
  return <div>Most Basic Element</div>;
}