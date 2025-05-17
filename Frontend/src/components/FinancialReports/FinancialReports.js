import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Select, 
  Table, 
  Spin,
  message,
  ConfigProvider
} from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined
} from '@ant-design/icons';
import './FinancialReports.css';
import { getMonthlyFinancialData, getYearlySummary } from '../../services/financialReportService';

const { Title, Text } = Typography;
const { Option } = Select;

// Theme color
const themeColor = '#3f2b7b';

const FinancialReports = () => {
  const [year, setYear] = useState('2025');
  const [loading, setLoading] = useState(false);
  const [monthlyData, setMonthlyData] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    netProfitPercentage: 0
  });
  
  useEffect(() => {
    fetchFinancialData();
  }, [year]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const data = await getMonthlyFinancialData(year);
      
      // Filter only months with revenue or expenses greater than 0
      const filteredData = data.filter(item => item.revenue > 0 || item.expenses > 0);
      
      // Transform data to table format
      const tableData = filteredData.map((item, index) => ({
        key: (index + 1).toString(),
        month: item.month,
        revenue: item.revenue,
        expenses: item.expenses,
        net: item.netProfit,
        profitMargin: parseFloat(item.profitMargin.toFixed(2))
      }));
      
      setMonthlyData(tableData);
      
      // Calculate yearly summary
      const yearSummary = getYearlySummary(data);
      setSummary(yearSummary);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('An error occurred while loading financial data.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: 'Revenue (₺)',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (text) => (
        <span className="amount">{text.toLocaleString()}</span>
      ),
    },
    {
      title: 'Expenses (₺)',
      dataIndex: 'expenses',
      key: 'expenses',
      render: (text) => (
        <span className="amount">{text.toLocaleString()}</span>
      ),
    },
    {
      title: 'Net (₺)',
      dataIndex: 'net',
      key: 'net',
      render: (text) => (
        <span className={`amount ${text >= 0 ? 'positive' : 'negative'}`}>
          {text.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Profit Margin (%)',
      dataIndex: 'profitMargin',
      key: 'profitMargin',
      render: (text) => `${text}%`,
    },
  ];

  const handleYearChange = (value) => {
    setYear(value);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: themeColor,
        },
      }}
    >
      <div className="financial-reports-container">
        <div className="page-header">
          <Title level={2} style={{ color: themeColor }}>Financial Reports</Title>
          <div className="filter-controls">
            <div className="filter-item">
              <Text>Year</Text>
              <Select 
                value={year} 
                onChange={handleYearChange}
                style={{ width: 120 }}
              >
                <Option value="2023">2023</Option>
                <Option value="2024">2024</Option>
                <Option value="2025">2025</Option>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <Spin size="large" style={{ color: themeColor }} />
          </div>
        ) : (
          <>
            <Row gutter={[16, 24]} className="summary-cards">
              <Col xs={24} md={8}>
                <Card className="summary-card">
                  <div className="card-title">Total Revenue ({year})</div>
                  <div className="amount primary">
                    {summary.totalRevenue.toLocaleString()} ₺
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card className="summary-card">
                  <div className="card-title">Total Expenses ({year})</div>
                  <div className="amount expense">
                    {summary.totalExpenses.toLocaleString()} ₺
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card className="summary-card">
                  <div className="card-title">Net Profit ({year})</div>
                  <div className="amount secondary">
                    {summary.netProfit.toLocaleString()} ₺
                  </div>
                  <div className="comparison">{summary.netProfitPercentage}% of total revenue</div>
                </Card>
              </Col>
            </Row>

            <div className="monthly-report">
              <div className="report-header">
                <Title level={4} style={{ color: themeColor }}>Monthly Revenue and Expense Report ({year})</Title>
              </div>
              {monthlyData.length > 0 ? (
                <Table 
                  dataSource={monthlyData} 
                  columns={columns} 
                  pagination={false}
                  className="financial-table themed-table"
                  bordered
                />
              ) : (
                <div className="no-data">No financial data available for this year.</div>
              )}
            </div>
          </>
        )}
      </div>
    </ConfigProvider>
  );
};

export default FinancialReports; 