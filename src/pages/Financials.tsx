import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertCircle,
  Filter,
  BarChart2,
  PieChart as PieChartIcon,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { format, subMonths, parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Event {
  id: string;
  title: string;
  event_date: string;
}

interface EventFinancials {
  id: string;
  event_id: string;
  event_title: string;
  total_sales: number;
  creator_cost: number;
  total_profit: number;
  month: string;
}

type FilterStatus = 'all' | 'completed' | 'incomplete';
type DateFilterType = 'monthly' | 'yearly';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onSubmit: (eventId: string) => void;
  financials: {
    total_sales: string;
    creator_cost: string;
  };
  setFinancials: (financials: { total_sales: string; creator_cost: string }) => void;
}

const FinancialModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  event,
  onSubmit,
  financials,
  setFinancials
}) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add Financial Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">{event.title}</h3>
            <p className="text-gray-500">
              {format(parseISO(event.event_date), 'MMMM d, yyyy')}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Sales
              </label>
              <Input
                type="number"
                placeholder="Enter total sales"
                value={financials.total_sales}
                onChange={(e) => setFinancials({ ...financials, total_sales: e.target.value })}
                startIcon={<DollarSign size={18} />}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Creator Cost
              </label>
              <Input
                type="number"
                placeholder="Enter creator cost"
                value={financials.creator_cost}
                onChange={(e) => setFinancials({ ...financials, creator_cost: e.target.value })}
                startIcon={<DollarSign size={18} />}
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(event.id)}
            disabled={!financials.total_sales || !financials.creator_cost}
          >
            Save Financial Details
          </Button>
        </div>
      </div>
    </div>
  );
};

const Financials: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [financials, setFinancials] = useState<EventFinancials[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('monthly');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [error, setError] = useState<string | null>(null);
  const [newFinancials, setNewFinancials] = useState({
    total_sales: '',
    creator_cost: ''
  });
  const [viewMode, setViewMode] = useState<'overview' | 'events' | 'reports'>('overview');
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y' | 'all'>('3m');
  const [selectedEventForModal, setSelectedEventForModal] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, title, event_date')
          .eq('creator_id', profile.id)
          .order('event_date', { ascending: false });

        if (eventsError) throw eventsError;

        // Fetch financials
        const { data: financialsData, error: financialsError } = await supabase
          .from('event_financials')
          .select(`
            id,
            event_id,
            total_sales,
            creator_cost,
            month,
            event:events(title)
          `);

        if (financialsError) throw financialsError;

        setEvents(eventsData || []);
        setFinancials(
          (financialsData || []).map(f => ({
            ...f,
            event_title: f.event.title,
            total_profit: f.total_sales - f.creator_cost
          }))
        );
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  const handleAddFinancial = async (eventId: string) => {
    if (!newFinancials.total_sales || !newFinancials.creator_cost) {
      setError('Please enter both total sales and creator cost');
      return;
    }

    try {
      const total_sales = parseFloat(newFinancials.total_sales);
      const creator_cost = parseFloat(newFinancials.creator_cost);
      const currentMonth = format(new Date(), 'yyyy-MM');

      // Check if a record already exists for this event and month
      const { data: existingRecord, error: checkError } = await supabase
        .from('event_financials')
        .select('id')
        .eq('event_id', eventId)
        .eq('month', currentMonth)
        .maybeSingle();

      if (checkError) throw checkError;

      let data;
      if (existingRecord) {
        // Update existing record
        const { data: updatedData, error: updateError } = await supabase
          .from('event_financials')
          .update({
            total_sales,
            creator_cost
          })
          .eq('id', existingRecord.id)
          .select('*, event:events(title)')
          .single();

        if (updateError) throw updateError;
        data = updatedData;

        // Update the financials state
        setFinancials(prevFinancials => 
          prevFinancials.map(f => {
            if (f.id === existingRecord.id) {
              return {
                ...f,
                total_sales,
                creator_cost,
                total_profit: total_sales - creator_cost
              };
            }
            return f;
          })
        );
      } else {
        // Create new record
        const { data: newData, error: insertError } = await supabase
          .from('event_financials')
          .insert({
            event_id: eventId,
            total_sales,
            creator_cost,
            month: currentMonth
          })
          .select('*, event:events(title)')
          .single();

        if (insertError) throw insertError;
        data = newData;

        setFinancials(prevFinancials => [
          ...prevFinancials,
          {
            ...data,
            event_title: data.event.title,
            total_profit: total_sales - creator_cost
          }
        ]);
      }

      setNewFinancials({ total_sales: '', creator_cost: '' });
      setError(null);
    } catch (error: any) {
      console.error('Error managing financial record:', error);
      setError(error.message);
    }
  };

  const getTimeRangeDates = () => {
    const now = new Date();
    switch (timeRange) {
      case '3m':
        return {
          start: startOfMonth(subMonths(now, 2)),
          end: endOfMonth(now),
          previousStart: startOfMonth(subMonths(now, 5)),
          previousEnd: endOfMonth(subMonths(now, 3))
        };
      case '6m':
        return {
          start: startOfMonth(subMonths(now, 5)),
          end: endOfMonth(now),
          previousStart: startOfMonth(subMonths(now, 11)),
          previousEnd: endOfMonth(subMonths(now, 6))
        };
      case '1y':
        return {
          start: startOfMonth(subYears(now, 1)),
          end: endOfMonth(now),
          previousStart: startOfMonth(subYears(now, 2)),
          previousEnd: endOfMonth(subYears(now, 1))
        };
      default:
        return {
          start: startOfMonth(subYears(now, 5)),
          end: endOfMonth(now),
          previousStart: startOfMonth(subYears(now, 10)),
          previousEnd: endOfMonth(subYears(now, 5))
        };
    }
  };

  const filteredFinancials = financials.filter(f => {
    if (selectedEvent !== 'all' && f.event_id !== selectedEvent) return false;

    const date = parseISO(f.month + '-01');
    const { start, end } = getTimeRangeDates();
    
    return isWithinInterval(date, { start, end });
  });

  const previousPeriodFinancials = financials.filter(f => {
    if (selectedEvent !== 'all' && f.event_id !== selectedEvent) return false;

    const date = parseISO(f.month + '-01');
    const { previousStart, previousEnd } = getTimeRangeDates();
    
    return isWithinInterval(date, { start: previousStart, end: previousEnd });
  });

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const totalRevenue = filteredFinancials.reduce((sum, f) => sum + f.total_sales, 0);
  const previousTotalRevenue = previousPeriodFinancials.reduce((sum, f) => sum + f.total_sales, 0);
  const revenueTrend = calculateTrend(totalRevenue, previousTotalRevenue);

  const totalProfit = filteredFinancials.reduce((sum, f) => sum + f.total_profit, 0);
  const previousTotalProfit = previousPeriodFinancials.reduce((sum, f) => sum + f.total_profit, 0);
  const profitTrend = calculateTrend(totalProfit, previousTotalProfit);

  const averageProfit = filteredFinancials.length ? totalProfit / filteredFinancials.length : 0;
  const previousAverageProfit = previousPeriodFinancials.length ? 
    previousPeriodFinancials.reduce((sum, f) => sum + f.total_profit, 0) / previousPeriodFinancials.length : 0;
  const averageProfitTrend = calculateTrend(averageProfit, previousAverageProfit);

  const profitMargin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;
  const previousProfitMargin = previousTotalRevenue ? 
    (previousTotalProfit / previousTotalRevenue) * 100 : 0;
  const profitMarginTrend = calculateTrend(profitMargin, previousProfitMargin);

  const monthlyData = filteredFinancials.reduce((acc, f) => {
    const month = f.month;
    if (!acc[month]) {
      acc[month] = {
        month,
        revenue: 0,
        profit: 0,
        cost: 0
      };
    }
    acc[month].revenue += f.total_sales;
    acc[month].profit += f.total_profit;
    acc[month].cost += f.creator_cost;
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

  const eventBreakdown = filteredFinancials.reduce((acc, f) => {
    if (!acc[f.event_title]) {
      acc[f.event_title] = {
        name: f.event_title,
        value: f.total_profit
      };
    } else {
      acc[f.event_title].value += f.total_profit;
    }
    return acc;
  }, {} as Record<string, any>);

  const pieData = Object.values(eventBreakdown);

  const exportToCSV = () => {
    const headers = ['Event', 'Date', 'Total Sales', 'Creator Cost', 'Profit', 'Margin'];
    const csvData = filteredFinancials.map(f => [
      f.event_title,
      format(parseISO(f.month + '-01'), 'MMMM yyyy'),
      f.total_sales,
      f.creator_cost,
      f.total_profit,
      ((f.total_profit / f.total_sales) * 100).toFixed(1) + '%'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `financial-records-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredFinancials.map(f => ({
        Event: f.event_title,
        Date: format(parseISO(f.month + '-01'), 'MMMM yyyy'),
        'Total Sales': f.total_sales,
        'Creator Cost': f.creator_cost,
        Profit: f.total_profit,
        Margin: ((f.total_profit / f.total_sales) * 100).toFixed(1) + '%'
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Analysis');
    
    XLSX.writeFile(workbook, `financial-analysis-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Financial Summary Report', 14, 20);
      
      // Add date
      doc.setFontSize(12);
      doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, 14, 30);
      
      // Add summary stats
      doc.setFontSize(14);
      doc.text('Summary Statistics', 14, 45);
      doc.setFontSize(12);
      doc.text(`Total Revenue: $${totalRevenue.toLocaleString()}`, 14, 55);
      doc.text(`Total Profit: $${totalProfit.toLocaleString()}`, 14, 65);
      doc.text(`Average Profit: $${averageProfit.toLocaleString()}`, 14, 75);
      doc.text(`Profit Margin: ${profitMargin.toFixed(1)}%`, 14, 85);
      
      // Add financial records table
      doc.setFontSize(14);
      doc.text('Financial Records', 14, 105);
      
      const tableData = filteredFinancials.map(f => [
        f.event_title,
        format(parseISO(f.month + '-01'), 'MMMM yyyy'),
        `$${f.total_sales.toLocaleString()}`,
        `$${f.creator_cost.toLocaleString()}`,
        `$${f.total_profit.toLocaleString()}`,
        `${((f.total_profit / f.total_sales) * 100).toFixed(1)}%`
      ]);
      
      autoTable(doc, {
        head: [['Event', 'Date', 'Total Sales', 'Creator Cost', 'Profit', 'Margin']],
        body: tableData,
        startY: 110,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        margin: { top: 110 }
      });
      
      // Save the PDF
      doc.save(`financial-summary-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF report. Please try again.');
    }
  };

  const renderOverview = () => (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm">Total Revenue</h3>
            <DollarSign className="text-primary-500" size={20} />
          </div>
          <p className="text-2xl font-semibold mt-2">${totalRevenue.toLocaleString()}</p>
          <div className={`flex items-center ${revenueTrend >= 0 ? 'text-success-500' : 'text-error-500'} mt-2`}>
            {revenueTrend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="text-sm">{Math.abs(revenueTrend).toFixed(1)}% from last period</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm">Total Profit</h3>
            <TrendingUp className="text-success-500" size={20} />
          </div>
          <p className="text-2xl font-semibold mt-2">${totalProfit.toLocaleString()}</p>
          <div className={`flex items-center ${profitTrend >= 0 ? 'text-success-500' : 'text-error-500'} mt-2`}>
            {profitTrend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="text-sm">{Math.abs(profitTrend).toFixed(1)}% from last period</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm">Average Profit</h3>
            <Calendar className="text-accent-500" size={20} />
          </div>
          <p className="text-2xl font-semibold mt-2">${averageProfit.toLocaleString()}</p>
          <div className={`flex items-center ${averageProfitTrend >= 0 ? 'text-success-500' : 'text-error-500'} mt-2`}>
            {averageProfitTrend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="text-sm">{Math.abs(averageProfitTrend).toFixed(1)}% from last period</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm">Profit Margin</h3>
            <PieChartIcon className="text-primary-500" size={20} />
          </div>
          <p className="text-2xl font-semibold mt-2">{profitMargin.toFixed(1)}%</p>
          <div className={`flex items-center ${profitMarginTrend >= 0 ? 'text-success-500' : 'text-error-500'} mt-2`}>
            {profitMarginTrend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="text-sm">{Math.abs(profitMarginTrend).toFixed(1)}% from last period</span>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue & Profit Chart */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6">Revenue & Profit Overview</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(value) => format(parseISO(value + '-01'), 'MMM yyyy')}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  labelFormatter={(label) => format(parseISO(label + '-01'), 'MMMM yyyy')}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stackId="2"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Event Breakdown */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6">Event Profit Breakdown</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Profit']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-6">Monthly Breakdown</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={(value) => format(parseISO(value + '-01'), 'MMM yyyy')}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                labelFormatter={(label) => format(parseISO(label + '-01'), 'MMMM yyyy')}
              />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#8884d8" />
              <Bar dataKey="profit" name="Profit" fill="#82ca9d" />
              <Bar dataKey="cost" name="Cost" fill="#ff8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );

  const renderEvents = () => (
    <>
      {/* Event Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {events.map(event => {
          const eventFinancials = filteredFinancials.filter(f => f.event_id === event.id);
          const totalRevenue = eventFinancials.reduce((sum, f) => sum + f.total_sales, 0);
          const totalProfit = eventFinancials.reduce((sum, f) => sum + f.total_profit, 0);
          const profitMargin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;

          return (
            <Card 
              key={event.id} 
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedEventForModal(event);
                setIsModalOpen(true);
              }}
            >
              <h3 className="text-lg font-semibold mb-4">{event.title}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-xl font-semibold">${totalRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Profit</p>
                  <p className="text-xl font-semibold">${totalProfit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profit Margin</p>
                  <p className="text-xl font-semibold">{profitMargin.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Event Date</p>
                  <p className="text-xl font-semibold">{format(parseISO(event.event_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Event Financial Records */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Event Financial Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creator Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFinancials.map((financial) => (
                <tr key={financial.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {financial.event_title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(parseISO(financial.month + '-01'), 'MMMM yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${financial.total_sales.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${financial.creator_cost.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${financial.total_profit.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {((financial.total_profit / financial.total_sales) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Financial Details Modal */}
      <FinancialModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEventForModal(null);
          setNewFinancials({ total_sales: '', creator_cost: '' });
        }}
        event={selectedEventForModal}
        onSubmit={(eventId) => {
          handleAddFinancial(eventId);
          setIsModalOpen(false);
          setSelectedEventForModal(null);
        }}
        financials={newFinancials}
        setFinancials={setNewFinancials}
      />
    </>
  );

  const renderReports = () => (
    <>
      {/* Financial Summary */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-6">Financial Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-4">Revenue Analysis</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-semibold">${totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Average Monthly Revenue</p>
                <p className="text-xl font-semibold">
                  ${(totalRevenue / (filteredFinancials.length || 1)).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue Growth</p>
                <p className={`text-xl font-semibold ${revenueTrend >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                  {revenueTrend >= 0 ? '+' : ''}{revenueTrend.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-4">Profit Analysis</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Profit</p>
                <p className="text-xl font-semibold">${totalProfit.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Average Monthly Profit</p>
                <p className="text-xl font-semibold">
                  ${(totalProfit / (filteredFinancials.length || 1)).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Profit Growth</p>
                <p className={`text-xl font-semibold ${profitTrend >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                  {profitTrend >= 0 ? '+' : ''}{profitTrend.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Export Options */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-6">Export Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            size="lg"
            icon={<FileText size={20} />}
            className="flex flex-col items-center justify-center p-6"
            onClick={exportToPDF}
          >
            <span className="mt-2">Financial Summary</span>
            <span className="text-sm text-gray-500">PDF Report</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            icon={<BarChart2 size={20} />}
            className="flex flex-col items-center justify-center p-6"
            onClick={exportToExcel}
          >
            <span className="mt-2">Performance Analysis</span>
            <span className="text-sm text-gray-500">Excel Spreadsheet</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            icon={<Calendar size={20} />}
            className="flex flex-col items-center justify-center p-6"
            onClick={exportToCSV}
          >
            <span className="mt-2">Event Details</span>
            <span className="text-sm text-gray-500">CSV Export</span>
          </Button>
        </div>
      </Card>

      {/* Add Financial Record */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-6">Add Financial Record</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="input"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            <option value="">Select Event</option>
            {events
              .filter(event => {
                if (selectedEvent === 'all') return true;
                const eventDate = parseISO(event.event_date);
                const { start, end } = getTimeRangeDates();
                return isWithinInterval(eventDate, { start, end });
              })
              .map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
          </select>
          <Input
            type="number"
            placeholder="Total Sales"
            value={newFinancials.total_sales}
            onChange={(e) => setNewFinancials({ ...newFinancials, total_sales: e.target.value })}
            startIcon={<DollarSign size={18} />}
          />
          <Input
            type="number"
            placeholder="Creator Cost"
            value={newFinancials.creator_cost}
            onChange={(e) => setNewFinancials({ ...newFinancials, creator_cost: e.target.value })}
            startIcon={<DollarSign size={18} />}
          />
        </div>
        <Button
          className="mt-4"
          onClick={() => selectedEvent && handleAddFinancial(selectedEvent)}
          disabled={!selectedEvent || !newFinancials.total_sales || !newFinancials.creator_cost}
        >
          Add Record
        </Button>
      </Card>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
              <p className="text-gray-600 mt-1">
                Track and manage your event financials
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={viewMode === 'overview' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('overview')}
                icon={<BarChart2 size={18} />}
              >
                Overview
              </Button>
              <Button
                variant={viewMode === 'events' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('events')}
                icon={<Calendar size={18} />}
              >
                Events
              </Button>
              <Button
                variant={viewMode === 'reports' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('reports')}
                icon={<FileText size={18} />}
              >
                Reports
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-error-700 bg-error-50 px-4 py-3 rounded-lg">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event
              </label>
              <select
                className="input"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                <option value="all">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Range
              </label>
              <div className="flex gap-2">
                <Button
                  variant={timeRange === '3m' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('3m')}
                >
                  3M
                </Button>
                <Button
                  variant={timeRange === '6m' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('6m')}
                >
                  6M
                </Button>
                <Button
                  variant={timeRange === '1y' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('1y')}
                >
                  1Y
                </Button>
                <Button
                  variant={timeRange === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('all')}
                >
                  All
                </Button>
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                icon={<Download size={16} />}
              >
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* View Mode Content */}
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'events' && renderEvents()}
        {viewMode === 'reports' && renderReports()}
      </div>
    </div>
  );
};

export default Financials;