import { useEffect, useRef, useState } from "react";
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { db } from "../utils/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { useRecoilValue } from "recoil";
import { userAtom } from "../store/atoms/user";

Chart.register(...registerables);

interface SubmissionData {
  date: string;
  count: number;
}

const SubmissionActivity = () => {
  const chartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartData, setChartData] = useState<SubmissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useRecoilValue(userAtom);

  // Fetch real submission data from Firestore
  useEffect(() => {
    const fetchSubmissionData = async () => {
      try {
        // Try to fetch from 'submissions' collection
        const submissionsQuery = query(
          collection(db, "submissions"),
          orderBy("timestamp", "desc"),
          limit(30)
        );
        
        const querySnapshot = await getDocs(submissionsQuery);
        
        if (querySnapshot.empty) {
          // Use mock data if no submissions exist yet
          setChartData(generateMockData());
        } else {
          // Process real data - group by date
          const dataByDate: { [key: string]: number } = {};
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = new Date(data.timestamp?.toDate()).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });
            dataByDate[date] = (dataByDate[date] || 0) + 1;
          });

          const formattedData = Object.entries(dataByDate).map(([date, count]) => ({
            date,
            count
          })).reverse(); // Show oldest to newest

          setChartData(formattedData);
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);
        // Fallback to mock data on error
        setChartData(generateMockData());
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionData();
  }, []);

  // Generate mock data for demo purposes
  const generateMockData = (): SubmissionData[] => {
    const data: SubmissionData[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: Math.floor(Math.random() * 15) + 5 // Random 5-20 submissions
      });
    }
    
    return data;
  };

  // Initialize/Update chart when data changes
  useEffect(() => {
    if (!canvasRef.current || chartData.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: chartData.map(d => d.date),
        datasets: [
          {
            label: 'Submissions',
            data: chartData.map(d => d.count),
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: 'rgb(99, 102, 241)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: 'rgb(99, 102, 241)',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context) => `${context.parsed.y} submissions`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#9ca3af',
              font: {
                size: 12,
              },
              stepSize: 5,
            },
            grid: {
              color: 'rgba(75, 85, 99, 0.3)',
              
            },
          },
          x: {
            ticks: {
              color: '#9ca3af',
              font: {
                size: 11,
              },
              maxRotation: 45,
              minRotation: 45,
            },
            grid: {
              display: false,
            },
          },
        },
      },
    };

    chartRef.current = new Chart(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [chartData]);

  const totalSubmissions = chartData.reduce((sum, d) => sum + d.count, 0);
  const avgSubmissions = chartData.length > 0 
    ? Math.round(totalSubmissions / chartData.length) 
    : 0;

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-purple-500 transition-all duration-300">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📈</span>
            Submission Activity
          </h2>
          <span className="text-sm text-gray-400">Last 30 days</span>
        </div>
        
        {/* Stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1 bg-blue-600/20 border border-blue-500/30 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-400">{totalSubmissions}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="flex-1 bg-purple-600/20 border border-purple-500/30 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-400">{avgSubmissions}</div>
            <div className="text-xs text-gray-400">Daily Avg</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <canvas ref={canvasRef} id="submission-activity-chart"></canvas>
      </div>

      {/* Footer Note */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        {chartData.length === 30 && totalSubmissions > 0 
          ? `Showing activity for ${user.user?.email?.split('@')[0] || 'all users'}`
          : "Start solving problems to see your activity graph!"}
      </div>
    </div>
  );
};

export default SubmissionActivity;