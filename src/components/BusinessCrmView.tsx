import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Target,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import './BusinessCrmView.css';

interface Lead {
  id: string;
  name: string;
  email: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Closed';
  value: number;
  lastContact: string;
  tags: string[];
}

export const BusinessCrmView: React.FC<{ storeId?: string }> = ({ storeId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pipeline' | 'list' | 'tasks'>('pipeline');

  const leads: Lead[] = [
    { id: '1', name: 'James Wilson', email: 'james@example.com', status: 'New', value: 1200, lastContact: '2h ago', tags: ['High Value', 'Restaurant'] },
    { id: '2', name: 'Sarah Miller', email: 'sarah@design.co', status: 'Proposal', value: 3500, lastContact: '1d ago', tags: ['Services'] },
    { id: '3', name: 'Regional Bank', email: 'procurement@regbank.com', status: 'Qualified', value: 8000, lastContact: '3h ago', tags: ['B2B', 'Urgent'] },
    { id: '4', name: 'Mike Thompson', email: 'mike@tours.com', status: 'Contacted', value: 450, lastContact: '5h ago', tags: ['Retail'] },
  ];

  const stats = [
    { label: 'Total Leads', value: '124', icon: Users, color: '#6366f1' },
    { label: 'Active Deals', value: '$18.4k', icon: DollarSign, color: '#10b981' },
    { label: 'Conversion', value: '24%', icon: TrendingUp, color: '#8b5cf6' },
    { label: 'Response Time', value: '1.2h', icon: Clock, color: '#f59e0b' },
  ];

  return (
    <div className="crm-container fade-in">
      {/* CRM Header */}
      <header className="crm-header">
        <div className="crm-title-section">
          <h1>Customer Relationship Manager</h1>
          <p>Manage your leads, customers, and sales pipeline.</p>
        </div>
        <div className="crm-actions">
          <button className="secondary-crm-btn"><Calendar size={18} /> Schedule</button>
          <button className="primary-crm-btn"><Plus size={18} /> Add Lead</button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="crm-stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="crm-stat-card glass">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CRM Navigation */}
      <div className="crm-nav-bar">
        <div className="crm-tabs">
          <button className={activeTab === 'pipeline' ? 'active' : ''} onClick={() => setActiveTab('pipeline')}>Pipeline</button>
          <button className={activeTab === 'list' ? 'active' : ''} onClick={() => setActiveTab('list')}>All Contacts</button>
          <button className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}>Tasks</button>
        </div>
        <div className="crm-search-bar glass">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search leads..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Filter size={18} className="filter-icon" />
        </div>
      </div>

      {/* Pipeline View */}
      {activeTab === 'pipeline' && (
        <div className="crm-pipeline-view">
          {['New', 'Contacted', 'Qualified', 'Proposal'].map(status => (
            <div key={status} className="pipeline-column">
              <div className="column-header">
                <h3>{status}</h3>
                <span className="count">{leads.filter(l => l.status === status).length}</span>
              </div>
              <div className="column-content">
                {leads.filter(l => l.status === status).map(lead => (
                  <div key={lead.id} className="lead-card glass">
                    <div className="lead-header">
                      <h4>{lead.name}</h4>
                      <MoreVertical size={14} />
                    </div>
                    <div className="lead-meta">
                      <span className="lead-value">${lead.value}</span>
                      <span className="lead-time">{lead.lastContact}</span>
                    </div>
                    <div className="lead-tags">
                      {lead.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                    <div className="lead-footer">
                      <div className="contact-icons">
                        <Mail size={14} />
                        <Phone size={14} />
                        <MessageSquare size={14} />
                      </div>
                      <button className="go-btn"><ChevronRight size={14} /></button>
                    </div>
                  </div>
                ))}
                <button className="add-lead-btn-ghost"><Plus size={16} /> New Lead</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className="crm-list-view glass">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Status</th>
                <th>Value</th>
                <th>Source</th>
                <th>Last Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id}>
                  <td>
                    <div className="customer-info">
                      <div className="avatar">{lead.name[0]}</div>
                      <div>
                        <div className="name">{lead.name}</div>
                        <div className="email">{lead.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`status-badge ${lead.status.toLowerCase()}`}>{lead.status}</span></td>
                  <td><span className="value-cell">${lead.value}</span></td>
                  <td>Direct</td>
                  <td>{lead.lastContact}</td>
                  <td>
                    <div className="row-actions">
                      <button className="action-btn"><Mail size={16} /></button>
                      <button className="action-btn"><Calendar size={16} /></button>
                      <button className="action-btn"><CheckCircle2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tasks View */}
      {activeTab === 'tasks' && (
        <div className="crm-tasks-view">
          <div className="tasks-grid">
            <div className="task-category">
              <h3>Today</h3>
              <div className="task-item glass">
                <CheckCircle2 size={20} className="task-check" />
                <div className="task-info">
                  <h4>Follow up with Regional Bank</h4>
                  <p>Send updated proposal for the Q3 contract.</p>
                  <span className="task-time"><Clock size={12} /> 2:30 PM</span>
                </div>
              </div>
              <div className="task-item glass">
                <CheckCircle2 size={20} className="task-check" />
                <div className="task-info">
                  <h4>Review Cajun Gourmet Menu</h4>
                  <p>Sync new menu items with 360 Market.</p>
                  <span className="task-time"><Clock size={12} /> 4:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
