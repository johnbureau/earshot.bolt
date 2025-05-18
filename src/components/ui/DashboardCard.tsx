import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  change,
  icon,
  className = '',
}) => {
  const isPositive = change && change > 0;
  const changeColor = isPositive ? 'text-success-500' : 'text-error-500';
  const changeIcon = isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />;

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
        {change !== undefined && (
          <div className={`flex items-center ${changeColor}`}>
            {changeIcon}
            <span className="ml-1 text-sm font-medium">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;